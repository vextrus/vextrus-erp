#!/usr/bin/env python3
"""
Pre-Tool-Use Hook - Read-Only Observer Pattern
Claude Code 2.0.19 Compatible

Purpose: Validate before destructive ops, check task/branch alignment
Design: Warnings only, never blocks operations
Performance Target: < 10ms execution
"""
import json
import sys
import subprocess
import re
import time
from pathlib import Path
from shared_state import get_task_state, get_project_root

# Cache for reducing file I/O
_cache = {}
_cache_ttl = 5  # seconds

# Load input
try:
    input_data = json.load(sys.stdin)
    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})
except:
    sys.exit(0)  # Allow on error

PROJECT_ROOT = get_project_root()

# MCP tools should never be warned about
MCP_TOOL_PREFIXES = [
    "mcp__", "mcp_", "context7", "brave", "brightdata", "consult7", "serena",
    "filesystem", "github", "memory", "sequential", "prisma",
    "postgres", "sqlite", "notion", "reddit", "playwright"
]

# Check if MCP tool
is_mcp_tool = any(tool_name.lower().startswith(prefix.lower()) for prefix in MCP_TOOL_PREFIXES)
if is_mcp_tool:
    sys.exit(0)  # Always allow MCP tools

# Read-only bash commands that don't need validation
READ_ONLY_BASH = [
    "ls", "ll", "pwd", "cd", "echo", "cat", "head", "tail", "less", "more",
    "grep", "rg", "find", "which", "whereis", "type", "file", "stat",
    "du", "df", "tree", "basename", "dirname", "realpath", "readlink",
    "whoami", "env", "printenv", "date", "cal", "uptime", "ps", "top",
    "wc", "cut", "sort", "uniq", "comm", "diff", "cmp", "md5sum", "sha256sum",
    "git status", "git log", "git diff", "git show", "git branch",
    "git remote", "git fetch", "git describe", "git rev-parse", "git blame",
    "docker ps", "docker images", "docker logs", "docker inspect",
    "npm list", "npm ls", "pip list", "pip show", "yarn list",
    "curl", "wget", "jq", "awk", "sed -n", "tar -t", "unzip -l",
    # Windows
    "dir", "where", "findstr", "fc", "comp", "certutil",
    "Get-ChildItem", "Get-Location", "Get-Content", "Select-String",
]

# For Bash tool, check if read-only
if tool_name == "Bash":
    command = tool_input.get("command", "").strip()

    # Check if all commands in chain are read-only
    is_read_only = any(command.startswith(prefix) for prefix in READ_ONLY_BASH)

    # Check for write patterns
    write_patterns = [
        r'>\s*[^>]', r'>>', r'\btee\b', r'\bmv\b', r'\bcp\b', r'\brm\b',
        r'\bmkdir\b', r'\btouch\b', r'\bsed\s+(?!-n)',
        r'\bnpm\s+install', r'\bpip\s+install', r'\bapt\s+install',
    ]

    has_write = any(re.search(pattern, command) for pattern in write_patterns)

    if is_read_only and not has_write:
        sys.exit(0)  # Allow read-only bash without validation

# Load configuration with caching
def cached_load_config():
    """Load configuration with caching."""
    global _cache
    now = time.time()

    if 'config' in _cache:
        cached_data, cached_time = _cache['config']
        if now - cached_time < _cache_ttl:
            return cached_data

    try:
        config_file = PROJECT_ROOT / "sessions" / "sessions-config.json"
        if config_file.exists():
            with open(config_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                _cache['config'] = (data, now)
                return data
    except:
        pass

    return {"branch_enforcement": {"enabled": True}}

config = cached_load_config()

# Validation warnings (never blocks)
warnings = []

# 1. Check for common security mistakes
if tool_name in ["Write", "Edit", "MultiEdit"]:
    file_path = tool_input.get("file_path", "")

    # Warn about sensitive files
    sensitive_patterns = [
        r'\.env$', r'credentials', r'secret', r'password', r'api[_-]?key',
        r'private[_-]?key', r'\.pem$', r'\.key$', r'token'
    ]

    if any(re.search(pattern, file_path.lower()) for pattern in sensitive_patterns):
        warnings.append(f"⚠️  WARNING: Editing potentially sensitive file: {file_path}")
        warnings.append("   Please ensure no secrets are committed to version control.")

# 2. Task and branch alignment validation
if tool_name in ["Write", "Edit", "MultiEdit"]:
    file_path_str = tool_input.get("file_path", "")

    if file_path_str:
        file_path = Path(file_path_str)

        # Get task state
        task_state = get_task_state()
        current_task = task_state.get("task")
        expected_branch = task_state.get("branch")
        affected_services = task_state.get("services", [])

        # Warn if no task set
        if not current_task:
            warnings.append("ℹ️  INFO: No active task set. Consider setting a task for better tracking.")

        # Branch validation (if enabled and task has branch)
        if expected_branch and config.get("branch_enforcement", {}).get("enabled", False):
            try:
                # Find git repo
                current = file_path if file_path.is_dir() else file_path.parent
                repo_path = None

                while current.parent != current:
                    if (current / ".git").exists():
                        repo_path = current
                        break
                    current = current.parent

                if repo_path:
                    # Get current branch
                    result = subprocess.run(
                        ["git", "branch", "--show-current"],
                        cwd=str(repo_path),
                        capture_output=True,
                        text=True,
                        timeout=1
                    )

                    current_branch = result.stdout.strip()

                    # Check if branch matches
                    if current_branch != expected_branch:
                        warnings.append(f"⚠️  BRANCH MISMATCH: On '{current_branch}' but task expects '{expected_branch}'")
                        warnings.append(f"   Consider: git checkout {expected_branch}")

                    # Check if service is in task scope
                    if affected_services:
                        # Determine if this is a service-specific file
                        try:
                            relative_path = file_path.relative_to(PROJECT_ROOT)
                            path_parts = relative_path.parts

                            # Check if path starts with 'services/' or similar
                            if len(path_parts) > 1 and path_parts[0] in ['services', 'apps', 'packages']:
                                service_name = path_parts[1]

                                if service_name not in affected_services:
                                    warnings.append(f"⚠️  SCOPE WARNING: '{service_name}' not listed in task services")
                                    warnings.append(f"   Task services: {', '.join(affected_services)}")
                                    warnings.append(f"   Consider updating task file to include this service")
                        except ValueError:
                            pass  # File not relative to project root

            except (subprocess.TimeoutExpired, subprocess.SubprocessError, Exception):
                pass  # Silently allow on error

# 3. Warn about .claude/state modifications (except current_task.json)
if tool_name in ["Write", "Edit", "MultiEdit"]:
    file_path_str = tool_input.get("file_path", "")

    if file_path_str:
        file_path = Path(file_path_str)
        state_dir = PROJECT_ROOT / '.claude' / 'state'

        try:
            rel_path = file_path.resolve().relative_to(state_dir.resolve())

            # Allow current_task.json and workflow_state.json
            allowed_state_files = ['current_task.json', 'workflow_state.json']

            if file_path.name not in allowed_state_files:
                warnings.append(f"⚠️  STATE WARNING: Modifying system state: {rel_path}")
                warnings.append(f"   Most state files should not be edited directly")
        except ValueError:
            pass  # Not in state directory

# Output warnings (never block - always exit 0)
if warnings:
    print("\n".join(warnings), file=sys.stderr)

sys.exit(0)  # Always allow operation
