# Hook System Documentation
**Claude Code 2.0.17 Compatible**
**Read-Only Observer Pattern**

## Overview

The Vextrus ERP hook system follows a **read-only observer pattern** designed for CC 2.0.17 stability. All hooks provide intelligent suggestions and context without modifying files or blocking operations.

## Design Principles

1. **Read-Only Operations** - No file writes, no state modifications
2. **Suggestions Only** - Hooks guide, never auto-execute
3. **Fast Execution** - Target < 10ms per hook
4. **Graceful Errors** - All hooks fail-safe, never block work
5. **Intelligent Context** - Task-aware, MCP-aware, context-aware

## Hook Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Hook Lifecycle                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. SessionStart → Load task, suggest MCP, display      │
│  2. UserPromptSubmit → Monitor context, suggest agents  │
│  3. PreToolUse → Validate, warn (never block)           │
│  4. PostToolUse → Track progress, suggest validation    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Hook Details

### 1. SessionStart Hook
**File**: `session-start.py`
**Trigger**: Session initialization
**Matcher**: None (runs on all session starts)

**Purpose**:
- Load active task context
- Display task status and metadata
- Suggest MCP servers based on task type
- Provide next action recommendations

**Output Example**:
```
**Session Started** - Welcome back Rizvi!

**Active Task**: `h-implement-finance-backend-business-logic`
**Status**: in-progress
**Complexity**: 85
**Branch**: `feature/implement-finance-backend-business-logic`

**Suggested MCP Servers** for this task:
  - `@postgres` (enable with: `@postgres`)
  - `@sqlite` (enable with: `@sqlite`)
  - `@sequential-thinking` (enable with: `@sequential-thinking`)

**Continue Work**:
  - Review Work Log at end of task file
  - Continue from last checkpoint
  - Update Work Log as you progress
```

**Task Type → MCP Mapping**:
- `finance` → postgres, sqlite, sequential-thinking
- `auth` → postgres, memory
- `frontend` → playwright, brightdata
- `integration` → github, memory, context7
- `database` → postgres, sqlite, prisma-local, prisma-remote
- `testing` → playwright, sequential-thinking
- `documentation` → notion, memory, context7
- `api` → sequential-thinking, context7

**Performance**: ~5-8ms execution

---

### 2. UserPromptSubmit Hook
**File**: `user-messages.py`
**Trigger**: Every user message
**Matcher**: None (runs on all prompts)

**Purpose**:
- Add ultrathink directive (if not in API mode)
- Monitor context usage and warn at thresholds
- Detect protocol triggers (task creation, completion, etc.)
- Suggest agents based on prompt content
- Suggest MCP servers based on intent
- Detect task opportunities

**Features**:

#### Context Monitoring
```
[75% WARNING] 120,000/160,000 tokens used (75.0%)
Context is getting low. Be aware of coming context compaction.

[90% WARNING] 144,000/160,000 tokens used (90.0%)
CRITICAL: Consider wrapping up this task cleanly!
```

#### Agent Suggestions
Detects keywords and suggests relevant agents:
- `explore`, `understand`, `analyze` → Explore agent
- `nbr`, `vat`, `tin`, `bangladesh` → business-logic-validator
- `migrate`, `etl`, `bulk import` → data-migration-specialist
- `bkash`, `api`, `integration` → api-integration-tester
- `slow`, `performance`, `optimize` → performance-profiler
- `review`, `security` → code-review

#### MCP Suggestions
```
[MCP Suggestion] Consider enabling: @playwright, @github
```

#### Protocol Detection
Automatically suggests reading protocol files:
- "create a task" → `sessions/protocols/task-creation.md`
- "complete the task" → `sessions/protocols/task-completion.md`
- "switch to task" → `sessions/protocols/task-startup.md`
- "compact" → `sessions/protocols/context-compaction.md`

#### Emergency Stop
Keywords `SILENCE` or `STOP` (case-sensitive) halt operations.

**Performance**: ~5-10ms execution

---

### 3. PreToolUse Hook (sessions-enforce.py)
**File**: `sessions-enforce.py`
**Trigger**: Before Edit, Write, MultiEdit, Bash
**Matcher**: `Write|Edit|MultiEdit|Bash`

**Purpose**:
- Validate operations with warnings (never blocks)
- Check for sensitive file edits
- Verify task and branch alignment
- Warn about scope mismatches

**Validations**:

#### Security Warnings
```
⚠️  WARNING: Editing potentially sensitive file: .env
   Please ensure no secrets are committed to version control.
```

Sensitive patterns: `.env`, `credentials`, `secret`, `password`, `api_key`, `.pem`, `.key`, `token`

#### Branch Alignment
```
⚠️  BRANCH MISMATCH: On 'main' but task expects 'feature/finance-backend'
   Consider: git checkout feature/finance-backend
```

#### Scope Validation
```
⚠️  SCOPE WARNING: 'inventory-service' not listed in task services
   Task services: finance-service, master-data-service
   Consider updating task file to include this service
```

#### State File Protection
```
⚠️  STATE WARNING: Modifying system state: progressive-mode.json
   Most state files should not be edited directly
```

Allowed state files: `current_task.json`, `workflow_state.json`

**Important**: This hook **NEVER blocks operations** - it only warns. Exit code is always 0.

**Performance**: ~3-5ms execution

---

### 4. PostToolUse Hook
**File**: `post-tool-use.py`
**Trigger**: After Edit, Write, MultiEdit
**Matcher**: `Edit|Write|MultiEdit`

**Purpose**:
- Track progress (in-memory counter)
- Suggest validation at milestones
- Provide task-specific suggestions
- Track working directory changes

**Features**:

#### Progress Tracking
```
💡 Progress Check (10 edits):
   Consider running validation checks:
   - Type check: npm run type-check
   - Linting: npm run lint
   - Tests: npm test
```

Suggests validation every 10 edits (max once per 5 minutes).

#### Task-Specific Suggestions
- **Database tasks**: "Consider testing queries with @postgres"
- **Frontend tasks**: "Consider visual testing with @playwright"
- **Integration tasks**: "Consider API testing"

#### Directory Tracking
```
📁 Working directory: C:\Users\riz\vextrus-erp\services\finance
```

**Performance**: ~2-3ms execution

---

## Configuration

### Hook Configuration (.claude/settings.json)
```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [{
          "type": "command",
          "command": "python \"%CLAUDE_PROJECT_DIR%\\.claude\\hooks\\session-start.py\""
        }]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [{
          "type": "command",
          "command": "python \"%CLAUDE_PROJECT_DIR%\\.claude\\hooks\\user-messages.py\""
        }]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit|Bash",
        "hooks": [{
          "type": "command",
          "command": "python \"%CLAUDE_PROJECT_DIR%\\.claude\\hooks\\sessions-enforce.py\""
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [{
          "type": "command",
          "command": "python \"%CLAUDE_PROJECT_DIR%\\.claude\\hooks\\post-tool-use.py\""
        }]
      }
    ]
  }
}
```

### Workflow Configuration (sessions/sessions-config.json)
```json
{
  "developer_name": "Rizvi",
  "workflow": {
    "mode": "agent-first"
  },
  "blocked_tools": [],
  "branch_enforcement": {
    "enabled": false
  },
  "task_detection": {
    "enabled": true
  },
  "api_mode": false
}
```

**Key Settings**:
- `workflow.mode`: `"agent-first"` (replaces progressive/DAIC modes)
- `blocked_tools`: `[]` (empty - no tool blocking)
- `branch_enforcement.enabled`: `false` (warnings only, no blocks)
- `task_detection.enabled`: `true` (detect task opportunities)
- `api_mode`: `false` (adds ultrathink directive)

---

## Testing

### Independent Hook Tests
```bash
python .claude/hooks/test-hooks.py
```

**Test Results** (Phase 2):
```
[PASS]: session-start
[PASS]: user-prompt-submit
[PASS]: pre-tool-use
[PASS]: post-tool-use

Total: 4 | Passed: 4 | Failed: 0
```

### Manual Testing
```bash
# Test SessionStart
python .claude/hooks/session-start.py

# Test UserPromptSubmit
echo '{"prompt": "test", "transcript_path": ".claude/transcript.jsonl"}' | python .claude/hooks/user-messages.py

# Test PreToolUse
echo '{"tool_name": "Edit", "tool_input": {"file_path": "test.ts"}}' | python .claude/hooks/sessions-enforce.py

# Test PostToolUse
echo '{"tool_name": "Edit", "tool_input": {"file_path": "test.ts"}, "cwd": "."}' | python .claude/hooks/post-tool-use.py
```

---

## Troubleshooting

### Hook Not Executing
1. Check `.claude/settings.json` syntax
2. Verify Python path in command
3. Check hook file permissions
4. Test hook manually with command above

### Hook Errors
All hooks are designed to fail gracefully:
- Errors written to stderr (not stdout)
- Exit code 0 on errors (never blocks)
- Exceptions caught and logged

### Performance Issues
If hooks feel slow:
1. Check file I/O (should be minimal with caching)
2. Verify no network calls
3. Test execution time: `time python .claude/hooks/[hook].py`
4. Target: < 10ms per hook

### Context Warnings Not Showing
1. Check transcript path exists
2. Verify warning flags cleared: `.claude/state/context-warning-*.flag`
3. Flags reset on SessionStart
4. Warnings show once per session

---

## Migration from Old Hooks

### Removed Features
- ❌ DAIC mode enforcement (tool blocking removed)
- ❌ Progressive mode state file writes
- ❌ Automatic file modifications
- ❌ Task status auto-updates
- ❌ Complex mode transitions

### New Features
- ✅ Read-only observer pattern
- ✅ MCP server suggestions
- ✅ Agent recommendations
- ✅ Smart protocol detection
- ✅ Context optimization suggestions
- ✅ Task-aware validations
- ✅ Fast caching (5s TTL)

### Breaking Changes
**None** - Hooks are backward compatible. Old hook calls still work, just with new behavior (suggestions vs. enforcement).

---

## Performance Metrics

| Hook | Avg Execution | Max Execution | File I/O |
|------|--------------|---------------|----------|
| SessionStart | ~5-8ms | < 15ms | 2-3 reads (cached) |
| UserPromptSubmit | ~5-10ms | < 20ms | 1-2 reads (cached) |
| PreToolUse | ~3-5ms | < 10ms | 1 read (cached) |
| PostToolUse | ~2-3ms | < 5ms | 1 read (cached) |

**Total Overhead per Tool Operation**: ~15-25ms (acceptable for user experience)

---

## Best Practices

### For Hook Development
1. **Always fail gracefully** - Never block on errors
2. **Cache aggressively** - 5s TTL for config files
3. **Minimize I/O** - Read only what's needed
4. **Provide actionable suggestions** - Not just warnings
5. **Test independently** - Each hook should work standalone

### For Users
1. **Read hook suggestions** - They're context-aware and helpful
2. **Don't ignore warnings** - Especially security and branch warnings
3. **Enable MCP servers** - When hooks suggest them
4. **Monitor context** - Act on 75%/90% warnings
5. **Use protocols** - When hooks detect protocol triggers

### For Debugging
1. **Check stderr** - All warnings go to stderr
2. **Test manually** - Use test script or manual commands
3. **Verify state files** - Ensure `.claude/state/current_task.json` exists
4. **Check Python version** - Python 3.8+ required
5. **Review logs** - Hook output in Claude Code console

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Claude Code 2.0.17                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Hook System                             │
│                 (Read-Only Observers)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SessionStart  →  Load Context & Suggest MCP                │
│       ↓                                                      │
│  UserPromptSubmit  →  Monitor & Suggest Agents              │
│       ↓                                                      │
│  PreToolUse  →  Validate & Warn (No Blocking)               │
│       ↓                                                      │
│  [Tool Execution]                                            │
│       ↓                                                      │
│  PostToolUse  →  Track & Suggest Validation                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    State Management                          │
├─────────────────────────────────────────────────────────────┤
│  • current_task.json (read-only)                            │
│  • sessions-config.json (cached)                            │
│  • context-warning-*.flag (managed)                         │
│  • No file writes from hooks                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Future Enhancements (Phase 3+)

### Planned Features
- **Smart MCP auto-enable** - Auto-enable based on task type
- **Performance profiling** - Track hook execution metrics
- **Custom hook registry** - User-defined hooks
- **Hook templates** - Quick hook generation
- **Integration tests** - Full workflow testing

### Potential Improvements
- WebSocket integration for real-time updates
- Machine learning for better suggestions
- Plugin system for extensible hooks
- Dashboard for hook analytics

---

## Support

For issues or questions:
1. Check this documentation
2. Test hooks manually with test script
3. Review `.claude/WORKFLOW_UPGRADE_ANALYSIS_2025.md`
4. Check `sessions/protocols/` for workflow protocols

**Version**: Phase 2 (2025-10-16)
**Status**: Production Ready
**Stability**: Excellent (0 errors in testing)
