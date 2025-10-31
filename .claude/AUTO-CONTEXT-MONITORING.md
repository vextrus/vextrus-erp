# Auto-Context Monitoring System

**Purpose**: Prevent context explosion through user-driven monitoring and enforcement

**Problem Solved**: V7.0 context exploded from 50k → 140k+ in Day 1 due to no monitoring

**Solution**: User-driven context check after EVERY phase with blocking gates

**CRITICAL LIMITATION**: Claude CANNOT run /context command directly. User must run it and provide results.

---

## Architecture

### Trigger Points

Context monitoring MUST be triggered at:
1. **After EVERY phase completion** (MANDATORY)
2. **Before launching subagents** (Explore/Plan)
3. **After receiving large tool results** (>10k tokens)
4. **End of each work session**

### Monitoring Flow

```
PHASE_COMPLETE
  ↓
MUST: Ask user to run /context command
  ↓
WAIT: For user response with token count
  ↓
Parse user-provided token count & percentage
  ↓
Evaluate threshold
  ↓
  ├─ <120k (60%): GREEN → Continue
  ├─ 120-140k (60-70%): YELLOW → Log warning, continue
  ├─ 140-160k (70-80%): ORANGE → FORCE checkpoint, continue
  └─ ≥160k (80%+): RED → BLOCKING (new session REQUIRED)
  ↓
Update .claude/context-log.md
  ↓
Commit log update
```

---

## Threshold Definitions

### GREEN: <120k tokens (60%)

**Status**: Optimal operating range
**Action**: Continue normal workflow
**Logging**: Standard entry in context-log.md
**No checkpoint required**

**Example**:
```
Phase 2 complete: 100k tokens (50%)
Status: GREEN
Action: Continue to Phase 3
```

---

### YELLOW: 120-140k tokens (60-70%)

**Status**: Warning - Monitor closely
**Action**:
1. Log warning to context-log.md
2. Continue workflow (no checkpoint yet)
3. Consider context optimization:
   - Disable unused MCP servers
   - Avoid large file reads
   - Use Explore subagent for codebase analysis
   - Clear context for unrelated tasks

**Logging**: Warning entry with optimization suggestions

**Example**:
```
Phase 3 complete: 135k tokens (67.5%)
Status: YELLOW (Warning)
Action: Continue to Phase 4
Recommendation: Consider context optimization (see .claude/CONTEXT-OPTIMIZATION.md)
```

---

### ORANGE: 140-160k tokens (70-80%)

**Status**: Critical - Checkpoint required
**Action**:
1. **MANDATORY**: Create checkpoint immediately
2. Update .claude/todo/current.md
3. Commit all changes
4. Log to context-log.md
5. Continue workflow (session can continue)

**This is NOT blocking**, but checkpoint is MANDATORY before continuing.

**Checkpoint Process**:
```bash
# 1. Create checkpoint file
.claude/checkpoints/YYYY-MM-DD-HHMM-AUTO-CONTEXT.md

# 2. Update TODO
.claude/todo/current.md (sync state)

# 3. Git commit
git add .claude/
git commit -m "chore: AUTO checkpoint - context at 145k (72.5%)"

# 4. Verify
Checkpoint created: YES ✓
TODO synced: YES ✓
Git committed: YES ✓

# 5. Continue
Proceed to next phase
```

**Example**:
```
Phase 4 complete: 155k tokens (77.5%)
Status: ORANGE (Critical)
Action: FORCE checkpoint created
Checkpoint: .claude/checkpoints/2025-10-31-1445-AUTO-CONTEXT.md
Continue: YES (can continue after checkpoint)
```

---

### RED: ≥160k tokens (80%+)

**Status**: BLOCKING - New session required
**Action**:
1. **BLOCKING**: Stop all work immediately
2. Create emergency checkpoint
3. Update .claude/todo/current.md
4. Commit all changes
5. **DO NOT continue** - session MUST end
6. User must start new session

**This IS blocking** - workflow cannot continue.

**Emergency Process**:
```bash
# 1. Emergency checkpoint
.claude/checkpoints/YYYY-MM-DD-HHMM-EMERGENCY-RED.md

# 2. Update TODO
.claude/todo/current.md (sync state)

# 3. Git commit
git add .
git commit -m "chore: EMERGENCY checkpoint - context RED at 165k (82.5%)"
git push

# 4. STOP
BLOCKING: New session required
DO NOT proceed to next phase
User must resume in new session
```

**Example**:
```
Phase 5 complete: 170k tokens (85%)
Status: RED (BLOCKING)
Action: EMERGENCY checkpoint created
Checkpoint: .claude/checkpoints/2025-10-31-1520-EMERGENCY-RED.md
Continue: NO ✗ (BLOCKED)

BLOCKING MESSAGE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔ CONTEXT RED: New Session Required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context: 170k tokens (85%)
Status: BLOCKING

All work has been checkpointed and committed.
To resume:
1. Start new Claude Code session
2. Read .claude/todo/current.md
3. Read .claude/checkpoints/[latest].md
4. Resume from Phase [X]

DO NOT CONTINUE IN THIS SESSION.
```

---

## Context Log Updates

After each monitoring check, update `.claude/context-log.md`:

```markdown
| 2025-10-31 14:45 | Phase 4 | 145k | 72.5% | ORANGE | Force checkpoint | 2025-10-31-1445-AUTO-CONTEXT.md |
```

---

## Implementation in CLAUDE.md

In V8.1 CLAUDE.md, this is enforced as:

```markdown
## MANDATORY: Auto-Context Monitoring

AFTER EVERY PHASE:
1. MUST ask user to run /context command
2. MUST parse token count from user response
3. MUST evaluate threshold (GREEN/YELLOW/ORANGE/RED)
4. MUST take required action:
   - GREEN: Continue
   - YELLOW: Log warning, continue
   - ORANGE: Force checkpoint, continue
   - RED: BLOCKING (stop, new session)
5. MUST update .claude/context-log.md
6. MUST commit log update

BLOCKING IF:
- Context ≥160k (80%) AND continuing
- Skipping context check after phase
- Not creating checkpoint at 140-160k
```

---

## Verification Questions

After each phase, Claude MUST answer:

**Q1**: "Did you run /context after this phase? [YES/NO]"
- If NO → BLOCKING: "Must run /context"

**Q2**: "What is current context status? [GREEN/YELLOW/ORANGE/RED]"
- Parse actual number

**Q3**: "Did you take required action for threshold?"
- GREEN: Continue? YES/NO
- YELLOW: Logged warning? YES/NO
- ORANGE: Created checkpoint? YES/NO
- RED: Created emergency checkpoint AND stopped? YES/NO

---

## Recovery from Context Explosion

If context reaches RED:

1. **Immediate**: Emergency checkpoint + commit
2. **End session**: User starts new session
3. **Resume**:
   ```bash
   # In new session
   Read .claude/todo/current.md
   Read .claude/checkpoints/[latest-emergency].md
   Resume from [last-completed-phase]
   ```
4. **Investigate**: Why did context explode?
   - Review context-log.md
   - Identify spike source (large file reads, etc.)
   - Adjust workflow to prevent recurrence

---

## Context Optimization Strategies

### When YELLOW (120-140k):
- Disable unused MCP servers (use @ syntax to toggle)
- Use Explore subagent for codebase analysis (separate context)
- Avoid reading large files directly (use targeted searches)
- Clear context for unrelated tasks (/clear between features)
- See .claude/CONTEXT-OPTIMIZATION.md for detailed strategies

### When ORANGE (140-160k):
- All YELLOW strategies
- Checkpoint now (MANDATORY before continuing)
- Consider phase completion and natural break point
- Plan next session if close to RED

### Prevent RED:
- Monitor actively (don't wait for auto-check)
- Use Explore/Plan subagents (separate 200k context windows)
- Don't read entire service directories
- Use grep/glob instead of reading files
- Disable auto-compact (can waste 45k tokens)
- Be selective with MCP servers (each uses 4-10k tokens)

---

## Testing the System

To validate auto-context monitoring:

1. **GREEN test**: Complete simple task, verify <120k (60%)
2. **YELLOW test**: Simulate 130k context (65%), verify warning logged
3. **ORANGE test**: Simulate 150k context (75%), verify checkpoint created
4. **RED test**: Simulate 165k context (82.5%), verify BLOCKING works

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Context per session | <100k (50%) |
| Auto-check compliance | 100% (after every phase) |
| Checkpoint compliance | 100% (at ORANGE) |
| RED incidents | 0 (should never reach RED) |

---

**Version**: V8.1
**Status**: Production
**Last Updated**: 2025-10-31
