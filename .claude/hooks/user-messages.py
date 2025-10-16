#!/usr/bin/env python3
"""
User Prompt Submit Hook - Read-Only Observer Pattern
Claude Code 2.0.19 Compatible

Purpose: Detect workflow triggers, monitor context, suggest plugins/agents
Design: Pure read-only observer, suggestions only (no auto-execution)
Performance Target: < 10ms execution
"""
import json
import sys
import re
import os
from pathlib import Path
from shared_state import get_project_root

# Initialize
try:
    input_data = json.load(sys.stdin)
    prompt = input_data.get("prompt", "")
    transcript_path = input_data.get("transcript_path", "")
except:
    sys.exit(0)

PROJECT_ROOT = get_project_root()
context = ""

# Load configuration
try:
    CONFIG_FILE = PROJECT_ROOT / "sessions" / "sessions-config.json"
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            config = json.load(f)
    else:
        config = {}
except:
    config = {}

# Add ultrathink if not in API mode
if not config.get("api_mode", False):
    context = "[[ ultrathink ]]\n"

# Context monitoring
def get_context_length_from_transcript(transcript_path):
    """Get current context length from most recent main-chain message."""
    try:
        if not os.path.exists(transcript_path):
            return 0

        with open(transcript_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        most_recent_usage = None
        most_recent_timestamp = None

        for line in lines:
            try:
                data = json.loads(line.strip())

                # Skip sidechain entries (subagent calls)
                if data.get('isSidechain', False):
                    continue

                # Check if this entry has usage data
                if data.get('message', {}).get('usage'):
                    entry_time = data.get('timestamp')
                    if entry_time and (not most_recent_timestamp or entry_time > most_recent_timestamp):
                        most_recent_timestamp = entry_time
                        most_recent_usage = data['message']['usage']
            except json.JSONDecodeError:
                continue

        # Calculate context length from most recent usage
        if most_recent_usage:
            context_length = (
                most_recent_usage.get('input_tokens', 0) +
                most_recent_usage.get('cache_read_input_tokens', 0) +
                most_recent_usage.get('cache_creation_input_tokens', 0)
            )
            return context_length
    except Exception:
        pass
    return 0

# Context warnings
if transcript_path and os.path.exists(transcript_path):
    context_length = get_context_length_from_transcript(transcript_path)

    if context_length > 0:
        usable_percentage = (context_length / 160000) * 100

        # Check for warning flags
        warning_75_flag = PROJECT_ROOT / ".claude" / "state" / "context-warning-75.flag"
        warning_90_flag = PROJECT_ROOT / ".claude" / "state" / "context-warning-90.flag"

        # Token warnings (only once per session)
        if usable_percentage >= 90 and not warning_90_flag.exists():
            context += f"\n[90% WARNING] {context_length:,}/160,000 tokens used ({usable_percentage:.1f}%). CRITICAL: Consider wrapping up this task cleanly!\n"
            warning_90_flag.parent.mkdir(parents=True, exist_ok=True)
            warning_90_flag.touch()

        elif usable_percentage >= 75 and not warning_75_flag.exists():
            context += f"\n[75% WARNING] {context_length:,}/160,000 tokens used ({usable_percentage:.1f}%). Context is getting low. Be aware of coming context compaction trigger.\n"
            warning_75_flag.parent.mkdir(parents=True, exist_ok=True)
            warning_75_flag.touch()

        # Context optimization suggestions
        if usable_percentage >= 90:
            context += "\n[Context Optimizer] CRITICAL: Context nearly full. Consider:\n"
            context += "  - Archive completed subtasks\n"
            context += "  - Summarize old discussions\n"
            context += "  - Move to task completion if appropriate\n"
        elif usable_percentage >= 80:
            context += "\n[Context Optimizer] Optimization recommended:\n"
            context += "  - Focus on current task objectives\n"
            context += "  - Archive non-essential context\n"

# Plugin/Agent suggestions based on task type
def suggest_agents(prompt_text):
    """Suggest specialized plugins or agents based on prompt content."""
    suggestions = []
    prompt_lower = prompt_text.lower()

    # Plugin/Agent mapping patterns
    agent_patterns = {
        '/explore': ['explore', 'understand', 'analyze codebase', 'how does', 'where is', 'find files'],
        '/review': ['review', 'code review', 'check quality', 'improve code'],
        '/security-scan': ['security', 'vulnerability', 'secure', 'exploit'],
        '/test': ['test', 'testing', 'unit test', 'integration test'],
        'backend-architect agent': ['architecture', 'api design', 'microservices', 'backend design'],
        'performance-oracle agent': ['slow', 'performance', 'optimize', 'bottleneck', 'query time'],
        'database-architect agent': ['database', 'schema', 'migration', 'sql'],
    }

    for agent, keywords in agent_patterns.items():
        if any(kw in prompt_lower for kw in keywords):
            suggestions.append(agent)

    return suggestions

# Suggest agents if relevant
agent_suggestions = suggest_agents(prompt)
if agent_suggestions and len(prompt) > 30:  # Only for substantial prompts
    context += f"\n[Agent Suggestion] Consider using: {', '.join(agent_suggestions[:3])}\n"

# MCP server suggestions based on intent
def suggest_mcp_servers(prompt_text):
    """Suggest MCP servers based on prompt intent."""
    suggestions = []
    prompt_lower = prompt_text.lower()

    mcp_patterns = {
        '@playwright': ['test ui', 'browser', 'e2e test', 'screenshot', 'navigate'],
        '@github': ['pull request', 'github', 'repository', 'issue'],
        '@memory': ['remember', 'store knowledge', 'recall'],
        '@notion': ['notion', 'document'],
        '@brave-search': ['search web', 'find information', 'look up'],
        '@serena': ['refactor', 'rename', 'symbol'],
    }

    for server, keywords in mcp_patterns.items():
        if any(kw in prompt_lower for kw in keywords):
            suggestions.append(server)

    return suggestions

# Suggest MCP servers if relevant
mcp_suggestions = suggest_mcp_servers(prompt)
if mcp_suggestions and len(prompt) > 30:
    context += f"\n[MCP Suggestion] Consider enabling: {', '.join(mcp_suggestions[:3])}\n"

# Emergency stop detection
if any(word in prompt for word in ["SILENCE", "STOP"]):  # Case sensitive
    context += "\n[EMERGENCY STOP] Halting all operations. Awaiting user guidance.\n"

# Iterloop detection
if "iterloop" in prompt.lower():
    context += "\nYou have been instructed to iteratively loop. Present one item at a time, wait for user response with 'continue' before proceeding to next item.\n"

# Protocol detection - explicit phrases that trigger protocol reading
prompt_lower = prompt.lower()

# Context compaction
if any(phrase in prompt_lower for phrase in ["compact", "restart session", "context compaction"]):
    context += "\nIf the user is asking to compact context, read and follow sessions/protocols/context-compaction.md protocol.\n"

# Task completion
if any(phrase in prompt_lower for phrase in ["complete the task", "finish the task", "task is done",
                                               "mark as complete", "close the task", "wrap up the task"]):
    context += "\nIf the user is asking to complete the task, read and follow sessions/protocols/task-completion.md protocol.\n"

# Task creation
if any(phrase in prompt_lower for phrase in ["create a new task", "create a task", "make a task",
                                               "new task for", "add a task"]):
    context += "\nIf the user is asking to create a task, read and follow sessions/protocols/task-creation.md protocol.\n"

# Task switching
if any(phrase in prompt_lower for phrase in ["switch to task", "work on task", "change to task"]):
    context += "\nIf the user is asking to switch tasks, read and follow sessions/protocols/task-startup.md protocol.\n"

# Slash command suggestions
if prompt.startswith('/'):
    # User is trying a slash command - suggest if not recognized
    context += "\n[Slash Command] Use SlashCommand tool if this is a custom slash command. Check available commands in .claude/commands/\n"

# Task detection (optional feature)
if config.get("task_detection", {}).get("enabled", True):
    task_patterns = [
        r"(?i)we (should|need to|have to) (implement|fix|refactor|migrate|test|research)",
        r"(?i)create a task for",
        r"(?i)add this to the (task list|todo|backlog)",
        r"(?i)we'll (need to|have to) (do|handle|address) (this|that) later",
        r"(?i)that's a separate (task|issue|problem)",
        r"(?i)file this as a (bug|task|issue)"
    ]

    task_mentioned = any(re.search(pattern, prompt) for pattern in task_patterns)

    if task_mentioned:
        context += """
[Task Detection Notice]
The message may reference something that could be a task.

IF you or the user have discovered a potential task that is sufficiently unrelated to the current task, ask if they'd like to create a task file.

Tasks are:
• More than a couple commands to complete
• Semantically distinct units of work
• Work that takes meaningful context
• Single focused goals (not bundled multiple goals)
• Things that would take multiple days should be broken down
• NOT subtasks of current work (those go in the current task file/directory)

If they want to create a task, follow the task creation protocol.
"""

# Output context additions
if context:
    output = {
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": context
        }
    }
    print(json.dumps(output))

sys.exit(0)
