#!/usr/bin/env python3
"""
Post-Tool-Use Hook - Read-Only Observer Pattern + Monitoring
Claude Code 2.0.19 Compatible

Purpose: Track progress, suggest validation, recommend next actions, monitor agents
Design: Fast progress tracking, suggestions only (no file writes except monitoring)
Performance Target: < 20ms execution (with monitoring)
Note: Matcher in settings.json limits to Edit|Write|MultiEdit only
"""
import json
import sys
import time
from pathlib import Path
from shared_state import get_project_root, get_task_state

# Import monitoring modules (optional - don't fail if not available)
try:
    from cost_tracker import track_agent_invocation as track_cost
    from agent_metrics import track_agent_performance
    MONITORING_AVAILABLE = True
except ImportError:
    MONITORING_AVAILABLE = False

# In-memory progress tracking (resets per hook execution - intentional)
# For persistent tracking, use task file Work Log instead
_progress_counter = 0
_last_suggestion_time = 0
SUGGESTION_COOLDOWN = 300  # 5 minutes between suggestions

# Load input
try:
    input_data = json.load(sys.stdin)
    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})
    cwd = input_data.get("cwd", "")
except:
    sys.exit(0)

PROJECT_ROOT = get_project_root()

# Track file edits (in memory)
def track_edit():
    """Increment edit counter."""
    global _progress_counter
    _progress_counter += 1
    return _progress_counter

# Check if we should suggest validation
def should_suggest_validation(edit_count):
    """Check if validation suggestion is due."""
    global _last_suggestion_time
    now = time.time()

    # Suggest every 10 edits, but not more than once per 5 minutes
    if edit_count % 10 == 0 and (now - _last_suggestion_time) > SUGGESTION_COOLDOWN:
        _last_suggestion_time = now
        return True

    return False

# Get task type from current task
def get_task_type():
    """Determine task type from task name."""
    task_state = get_task_state()
    if not task_state:
        return 'general'

    task_name = task_state.get("task", "")
    if not task_name:
        return 'general'

    task_name = task_name.lower()

    task_types = {
        'database': ['database', 'migration', 'schema', 'postgres', 'sqlite'],
        'frontend': ['frontend', 'ui', 'component', 'react', 'next'],
        'integration': ['integration', 'api', 'webhook', 'bkash', 'nagad'],
        'testing': ['test', 'spec', 'e2e', 'playwright'],
        'documentation': ['docs', 'documentation', 'readme'],
    }

    for task_type, keywords in task_types.items():
        if any(kw in task_name for kw in keywords):
            return task_type

    return 'general'

# Main hook logic
suggestions = []

# Track the edit
if tool_name in ["Edit", "Write", "MultiEdit"]:
    edit_count = track_edit()

    # Validation suggestions (every 10 edits)
    if should_suggest_validation(edit_count):
        suggestions.append(f"\n💡 Progress Check ({edit_count} edits):")
        suggestions.append("   Consider running validation checks:")
        suggestions.append("   - Type check: npm run type-check")
        suggestions.append("   - Linting: npm run lint")
        suggestions.append("   - Tests: npm test")

    # Task-specific suggestions
    task_type = get_task_type()

    if tool_name in ["Write", "Edit"] and edit_count % 5 == 0:
        # Suggest MCP disabling for completed work
        if task_type == 'database':
            suggestions.append("\n💡 Database work in progress:")
            suggestions.append("   Consider testing queries with @postgres")

        elif task_type == 'frontend':
            suggestions.append("\n💡 Frontend changes made:")
            suggestions.append("   Consider visual testing with @playwright")

        elif task_type == 'integration':
            suggestions.append("\n💡 Integration code updated:")
            suggestions.append("   Consider API testing")

# Handle cd commands for CWD tracking
if tool_name == "Bash":
    command = tool_input.get("command", "")
    if "cd " in command:
        suggestions.append(f"\n📁 Working directory: {cwd}")

# Track agent invocations (Task tool)
# Note: This tracks when agents are invoked, but actual performance metrics
# would need to be captured when agent completes (future enhancement)
if tool_name == "Task" and MONITORING_AVAILABLE:
    try:
        # Extract agent information from tool input
        agent_type = tool_input.get("subagent_type", "unknown")
        description = tool_input.get("description", "")

        # For now, we log that an agent was invoked
        # Full tracking (tokens, cost, duration) happens when agent completes
        # This is a placeholder for future integration
        suggestions.append(f"\n📊 Agent invoked: {agent_type}")
        suggestions.append(f"   Description: {description}")
        suggestions.append("   Note: Full metrics tracked on completion")

    except Exception as e:
        # Don't fail the hook if monitoring fails
        pass

# Output suggestions
if suggestions:
    output = {
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": "\n".join(suggestions)
        }
    }
    print(json.dumps(output))

sys.exit(0)
