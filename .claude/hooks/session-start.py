#!/usr/bin/env python3
"""
Session Start Hook - Read-Only Observer Pattern
Claude Code 2.0.19 Compatible

Purpose: Load task context, suggest MCP servers, display status
Design: Pure read-only observer, no file modifications
Performance Target: < 10ms execution
"""
import json
import os
import sys
from pathlib import Path
from shared_state import get_project_root, get_task_state

# Constants
PROJECT_ROOT = get_project_root()
SESSIONS_DIR = PROJECT_ROOT / 'sessions'
STATE_DIR = PROJECT_ROOT / '.claude' / 'state'
CONFIG_FILE = PROJECT_ROOT / 'sessions' / 'sessions-config.json'

# Task-type to MCP server mappings
MCP_SUGGESTIONS = {
    'finance': ['postgres', 'sqlite', 'sequential-thinking'],
    'auth': ['postgres', 'memory'],
    'frontend': ['playwright', 'brightdata'],
    'integration': ['github', 'memory', 'context7'],
    'database': ['postgres', 'sqlite', 'prisma-local', 'prisma-remote'],
    'testing': ['playwright', 'sequential-thinking'],
    'documentation': ['notion', 'memory', 'context7'],
    'api': ['sequential-thinking', 'context7'],
    'default': ['sequential-thinking']
}

def get_config():
    """Read configuration (cached)."""
    try:
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"Warning: Could not read config: {e}", file=sys.stderr)
    return {}

def suggest_mcp_servers(task_name):
    """Suggest MCP servers based on task type."""
    if not task_name:
        return []

    # Extract task type from name (e.g., "h-implement-finance-backend" -> "finance")
    task_lower = task_name.lower()

    for task_type, servers in MCP_SUGGESTIONS.items():
        if task_type in task_lower:
            return servers

    return MCP_SUGGESTIONS['default']

def read_task_file(task_name):
    """Read task file content and extract metadata."""
    task_file = SESSIONS_DIR / 'tasks' / f"{task_name}.md"

    if not task_file.exists():
        return None, None, None

    try:
        content = task_file.read_text(encoding='utf-8')

        # Extract status from frontmatter
        status = 'unknown'
        complexity = None

        if content.startswith('---'):
            lines = content.split('\n')
            for line in lines[1:]:
                if line.startswith('---'):
                    break
                if line.startswith('status:'):
                    status = line.split(':', 1)[1].strip()
                elif line.startswith('complexity:'):
                    try:
                        complexity = int(line.split(':', 1)[1].strip())
                    except:
                        pass

        return content, status, complexity

    except Exception as e:
        print(f"Warning: Could not read task file: {e}", file=sys.stderr)
        return None, None, None

def list_available_tasks():
    """List available tasks from tasks directory."""
    tasks_dir = SESSIONS_DIR / 'tasks'

    if not tasks_dir.exists():
        return []

    task_files = []
    try:
        for task_file in sorted(tasks_dir.glob('*.md')):
            if task_file.name == 'TEMPLATE.md':
                continue

            # Read first few lines for status
            try:
                with open(task_file, 'r', encoding='utf-8') as f:
                    lines = f.readlines()[:15]
                    status = 'unknown'
                    for line in lines:
                        if line.startswith('status:'):
                            status = line.split(':', 1)[1].strip()
                            break

                    task_files.append({
                        'name': task_file.stem,
                        'status': status
                    })
            except:
                pass

    except Exception as e:
        print(f"Warning: Could not list tasks: {e}", file=sys.stderr)

    return task_files

def clear_context_warnings():
    """Clear context warning flags for new session."""
    try:
        warning_75 = STATE_DIR / 'context-warning-75.flag'
        warning_90 = STATE_DIR / 'context-warning-90.flag'

        if warning_75.exists():
            warning_75.unlink()
        if warning_90.exists():
            warning_90.unlink()
    except Exception as e:
        print(f"Warning: Could not clear context flags: {e}", file=sys.stderr)

def main():
    """Main hook execution."""

    # Clear context warnings
    clear_context_warnings()

    # Get config
    config = get_config()
    developer_name = config.get('developer_name', 'Developer')

    # Initialize context message
    context = f"**Session Started** - Welcome back {developer_name}!\n\n"

    # Check for active task
    task_state = get_task_state()
    task_name = task_state.get('task')

    if task_name and SESSIONS_DIR.exists():
        # Read task file
        task_content, status, complexity = read_task_file(task_name)

        if task_content:
            context += f"**Active Task**: `{task_name}`\n"
            context += f"**Status**: {status}\n"

            if complexity:
                context += f"**Complexity**: {complexity}\n"

            if task_state.get('branch'):
                context += f"**Branch**: `{task_state['branch']}`\n"

            context += f"\n---\n\n"

            # Include task content
            context += f"{task_content}\n\n"
            context += "---\n\n"

            # Suggest MCP servers
            suggested_servers = suggest_mcp_servers(task_name)
            if suggested_servers:
                context += f"**Suggested MCP Servers** for this task:\n"
                for server in suggested_servers:
                    context += f"  - `@{server}` (enable with: `@{server}`)\n"
                context += "\n"

            # Suggest next actions based on status
            if status == 'pending':
                context += "**Next Actions**:\n"
                context += "  - Review task requirements\n"
                context += "  - Use `/explore` to analyze codebase if needed\n"
                context += "  - Consider task complexity and plan approach\n\n"

            elif status == 'in-progress':
                context += "**Continue Work**:\n"
                context += "  - Review Work Log at end of task file\n"
                context += "  - Continue from last checkpoint\n"
                context += "  - Update Work Log as you progress\n\n"

    elif SESSIONS_DIR.exists():
        # No active task - list available
        context += "**No Active Task**\n\n"

        tasks = list_available_tasks()

        if tasks:
            context += "**Available Tasks**:\n"
            for task in tasks[:10]:  # Limit to 10 tasks
                context += f"  - `{task['name']}` ({task['status']})\n"

            if len(tasks) > 10:
                context += f"  ... and {len(tasks) - 10} more\n"

            context += "\n**To Select a Task**:\n"
            context += "  1. Update `.claude/state/current_task.json`\n"
            context += "  2. Or ask: 'Switch to task [name]'\n\n"

        else:
            context += "**No Tasks Found**\n\n"
            context += "**Create Your First Task**:\n"
            context += "  1. Ask: 'Create a new task for [description]'\n"
            context += "  2. Or follow: `sessions/protocols/task-creation.md`\n\n"

    else:
        # Sessions system not initialized
        context += "**Sessions System Not Initialized**\n\n"
        context += "The sessions framework helps manage tasks and maintain workflow.\n"
        context += "Contact your administrator for setup assistance.\n\n"

    # Output hook result
    output = {
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": context
        }
    }

    print(json.dumps(output))

if __name__ == '__main__':
    main()
