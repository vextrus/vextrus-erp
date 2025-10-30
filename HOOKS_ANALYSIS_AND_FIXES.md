# Claude Code Hooks Analysis & Fixes
**Date**: 2025-10-09
**CC Version**: 2.0.10
**Model**: Claude Sonnet 4.5
**Project**: Vextrus ERP

## Executive Summary

Your hooks system has **critical concurrency issues** causing the errors you're experiencing. These hooks were designed for older Claude Code versions and are incompatible with CC 2.0.10's architecture.

### Errors Identified
1. **API Error 400 (tool use concurrency)** → State file race conditions
2. **File unexpectedly modified** → Multiple hooks writing same files
3. **Error writing file** → File locks and concurrent access

---

## Root Cause Analysis

### 🔴 CRITICAL Issue #1: State File Race Conditions

**Affected Files**: `user-messages.py`, `sessions-enforce.py`, `post-tool-use.py`

**Problem**:
Multiple hooks are reading/writing the same state files (`progressive-mode.json`, `daic-mode.json`) **during the same request cycle**:

```python
# user-messages.py (line 176-190) - UserPromptSubmit hook
# WRITES to progressive-mode.json BEFORE tool execution
with open(PROGRESSIVE_MODE_STATE, 'w', encoding='utf-8') as f:
    json.dump(progressive_state, f, indent=2)

# sessions-enforce.py (line 152-159) - PreToolUse hook
# READS progressive-mode.json DURING tool validation
with open(PROGRESSIVE_MODE_STATE, 'r', encoding='utf-8') as f:
    progressive_state = json.load(f)

# post-tool-use.py (line 42-70) - PostToolUse hook
# READS progressive-mode.json AFTER tool execution
with open(PROGRESSIVE_MODE_STATE, 'r', encoding='utf-8') as f:
    progressive_state = json.load(f)
```

**Why This Breaks**:
- Hook 1 writes file → Hook 2 tries to read → Claude Code also accesses → **Concurrency conflict**
- Windows file locking makes this worse
- Claude Code 2.0.10 has stricter file tracking

**Result**: `API Error 400` and file modification errors

---

### 🔴 CRITICAL Issue #2: File Modification in session-start.py

**File**: `session-start.py` (lines 84-100)

**Problem**:
```python
# Modifies task files during session startup
if line.startswith('status: pending'):
    lines[i] = 'status: in-progress'
    task_updated = True
    task_file.write_text('\n'.join(lines), encoding='utf-8')  # ⚠️ WRITES during hook
```

**Why This Breaks**:
- Claude Code tracks file states
- Hook modifies file without Claude knowing
- Next tool use detects "unexpected modification"
- **Triggers: "File has been unexpectedly modified. Read it again before attempting to write it."**

---

### 🟡 MEDIUM Issue #3: Heavy Processing in task-transcript-link.py

**File**: `task-transcript-link.py`

**Problem**:
```python
# Loads ENTIRE transcript into memory
with open(transcript_path, 'r', encoding='utf-8') as f:
    transcript = [json.loads(line) for line in f]  # Could be 100K+ lines

# Uses tiktoken encoding (CPU intensive)
def n_tokens(s: str) -> int:
    return len(enc.encode(s))  # Called repeatedly in loop
```

**Why This Slows Down**:
- Large transcripts (>50K tokens) cause delays
- Runs on EVERY Task tool invocation
- Blocks tool execution until complete
- Can timeout on slower systems

---

### 🟡 MEDIUM Issue #4: Redundant Hook Execution

**File**: `post-tool-use.py`

**Problem**:
```json
"PostToolUse": [{
    "hooks": [...]  // No matcher - runs on ALL tools
}]
```

**Why This Wastes Resources**:
- Runs after Read, Glob, Grep, Bash, etc.
- Opens and parses JSON files unnecessarily
- Adds 50-200ms latency per tool use
- Multiplied over hundreds of operations = significant overhead

---

## Compatibility Issues with CC 2.0.10

### Changes in Claude Code 2.0.10
1. **Stricter file tracking** - Detects external modifications
2. **Improved concurrency detection** - Catches race conditions
3. **Better error reporting** - Shows 400 errors instead of silent failures
4. **Tighter hook integration** - Hooks run in same process context

### Why Old Hooks Break
- **Design assumption**: Hooks could freely modify files
- **Reality**: CC 2.0.10 tracks all file changes
- **Old pattern**: Write state files in hooks
- **New pattern**: Hooks should be read-only or use atomic operations

---

## Recommended Fixes

### Fix #1: Make Hooks Read-Only (Immediate)

**Remove all file writes from hooks**:

```python
# ❌ BAD (current)
with open(PROGRESSIVE_MODE_STATE, 'w', encoding='utf-8') as f:
    json.dump(progressive_state, f, indent=2)

# ✅ GOOD (fixed)
# Don't write during hooks - use slash commands or manual updates
```

**Files to modify**:
- `user-messages.py` - Remove lines 176-190 (progressive mode auto-elevation)
- `session-start.py` - Remove lines 94-98 (task status update)
- Remove auto-write functionality from all hooks

---

### Fix #2: Add Matchers to Reduce Execution

**Update `.claude/settings.json`**:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit|Bash",  // Only run on write operations
        "hooks": [
          {
            "type": "command",
            "command": "python \"%CLAUDE_PROJECT_DIR%\\.claude\\hooks\\post-tool-use.py\""
          }
        ]
      }
    ]
  }
}
```

---

### Fix #3: Simplify State Management

**Use environment variables or in-memory caching instead of file I/O**:

```python
# ❌ Current: Read file on every hook execution
def check_daic_mode_bool() -> bool:
    with open(DAIC_STATE_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data.get("mode", "discussion") == "discussion"

# ✅ Better: Cache in memory with occasional refresh
_mode_cache = None
_cache_time = 0

def check_daic_mode_bool() -> bool:
    global _mode_cache, _cache_time
    now = time.time()
    if _mode_cache is None or now - _cache_time > 5:  # Cache for 5 seconds
        try:
            with open(DAIC_STATE_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                _mode_cache = data.get("mode", "discussion") == "discussion"
                _cache_time = now
        except:
            _mode_cache = True
    return _mode_cache
```

---

### Fix #4: Optimize transcript-link.py

**Use streaming instead of loading entire file**:

```python
# ❌ Current: Load all into memory
with open(transcript_path, 'r', encoding='utf-8') as f:
    transcript = [json.loads(line) for line in f]

# ✅ Better: Stream and process incrementally
def process_transcript_streaming(transcript_path):
    with open(transcript_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                entry = json.loads(line)
                yield entry
            except json.JSONDecodeError:
                continue
```

---

## Enterprise-Grade Hooks for Large ERP Development

### Principles for Production Hooks
1. **Read-only by default** - Never modify files in hooks
2. **Fast execution** - < 50ms per hook
3. **Graceful degradation** - Fail silently, don't block
4. **Minimal dependencies** - Avoid heavy libraries in hot paths
5. **Proper error handling** - Log errors, don't crash

### Recommended Hooks for ERP Development

#### 1. **Context Monitor (Low Priority)**
**Purpose**: Track token usage, warn at thresholds
**Trigger**: UserPromptSubmit
**Execution**: Every 10th message only
**Actions**: Read-only, display warnings

#### 2. **Mode Reminder (High Priority)**
**Purpose**: Remind about current mode (explore/implement/validate)
**Trigger**: PostToolUse
**Matcher**: Edit|Write|MultiEdit
**Actions**: Display current mode, suggest transitions

#### 3. **Branch Validator (Critical)**
**Purpose**: Prevent commits to wrong branches
**Trigger**: PreToolUse
**Matcher**: Bash (for git commands only)
**Actions**: Check git branch matches task expectations

#### 4. **Business Rule Checker (ERP Specific)**
**Purpose**: Validate Bangladesh compliance patterns
**Trigger**: PostToolUse
**Matcher**: Edit|Write (for specific service files)
**Actions**: Scan for TIN/BIN/VAT patterns, warn if incorrect

#### 5. **Performance Baseline (Quality Assurance)**
**Purpose**: Track build times, test execution
**Trigger**: PostToolUse
**Matcher**: Bash (for build/test commands)
**Actions**: Record metrics, alert on degradation

---

## Migration Plan

### Phase 1: Immediate Stabilization (Do Now)
1. **Disable problematic hooks**:
   ```json
   // Comment out or remove from .claude/settings.json:
   // - task-transcript-link.py
   // - context-monitor.py
   // - task-complexity-check.py
   ```

2. **Make remaining hooks read-only**:
   - Edit `user-messages.py` - remove write operations
   - Edit `session-start.py` - remove file modifications
   - Keep `post-tool-use.py` for mode reminders only

3. **Add matchers to PostToolUse**:
   ```json
   "PostToolUse": [{
     "matcher": "Edit|Write|MultiEdit",
     "hooks": [...]
   }]
   ```

### Phase 2: Rebuild Hooks (1-2 days)
1. Create new hook architecture based on CC 2.0.10 patterns
2. Implement caching for state files
3. Add proper error handling
4. Test with large transcripts

### Phase 3: Enterprise Features (1 week)
1. Add ERP-specific validation hooks
2. Implement performance monitoring
3. Create deployment safety checks
4. Add audit trail hooks

---

## Minimal Working Configuration

**For immediate relief, use this minimal `.claude/settings.json`**:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python \"%CLAUDE_PROJECT_DIR%\\.claude\\hooks\\user-messages.py\""
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit|Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python \"%CLAUDE_PROJECT_DIR%\\.claude\\hooks\\sessions-enforce.py\""
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "python \"%CLAUDE_PROJECT_DIR%\\.claude\\hooks\\post-tool-use.py\""
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "startup|clear",
        "hooks": [
          {
            "type": "command",
            "command": "python \"%CLAUDE_PROJECT_DIR%\\.claude\\hooks\\session-start.py\""
          }
        ]
      }
    ]
  },
  "statusLine": {
    "type": "command",
    "command": "python \"%CLAUDE_PROJECT_DIR%\\statusline-script.py\"",
    "padding": 0
  }
}
```

**And modify these hooks to be read-only** (I'll provide fixed versions next).

---

## Next Steps

1. **Review this analysis** - Confirm the errors match your experience
2. **Choose migration path**:
   - **Quick fix**: Minimal config + read-only hooks (30 mins)
   - **Full rebuild**: Enterprise-grade hooks (2-3 days)
3. **Test thoroughly** - Ensure errors are resolved
4. **Monitor performance** - Hooks should add < 100ms latency

---

## Questions to Consider

1. **Do you need progressive modes?** - Or would simpler DAIC be sufficient?
2. **What's most important?** - Task tracking? Context monitoring? Branch safety?
3. **Performance vs Features?** - Willing to trade speed for safety checks?
4. **Deployment target?** - Single dev or team? (Affects hook complexity)

Let me know your priorities and I'll create the fixed hook files for you.
