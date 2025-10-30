# Auto-Context Monitoring System

**Purpose**: Prevent context explosion through automatic monitoring and enforcement

**Problem Solved**: V7.0 context exploded from 50k → 140k+ in Day 1 due to manual checking

**Solution**: Automatic context check after EVERY phase with blocking gates

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
AUTO: Run /context command
  ↓
Parse token count & percentage
  ↓
Evaluate threshold
  ↓
  ├─ <100k (50%): GREEN → Continue
  ├─ 100-120k (50-60%): YELLOW → Log warning, continue
  ├─ 120-140k (60-70%): ORANGE → FORCE checkpoint, continue
  └─ ≥140k (70%+): RED → BLOCKING (new session REQUIRED)
  ↓
Update .claude/context-log.md
  ↓
Commit log update
```

---

## Threshold Definitions

### GREEN: <100k tokens (50%)

**Status**: Optimal operating range
**Action**: Continue normal workflow
**Logging**: Standard entry in context-log.md
**No checkpoint required**

**Example**:
```
Phase 2 complete: 85k tokens (42.5%)
Status: GREEN
Action: Continue to Phase 3
```

---

### YELLOW: 100-120k tokens (50-60%)

**Status**: Warning - Monitor closely
**Action**:
1. Log warning to context-log.md
2. Continue workflow (no checkpoint yet)
3. Consider context optimization:
   - Disable unused MCP servers
   - Avoid large file reads
   - Use Explore subagent for codebase analysis

**Logging**: Warning entry with optimization suggestions

**Example**:
```
Phase 3 complete: 112k tokens (56%)
Status: YELLOW (Warning)
Action: Continue to Phase 4
Recommendation: Consider disabling unused MCPs
```

---

### ORANGE: 120-140k tokens (60-70%)

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
git commit -m "chore: AUTO checkpoint - context at 125k (62.5%)"

# 4. Verify
Checkpoint created: YES ✓
TODO synced: YES ✓
Git committed: YES ✓

# 5. Continue
Proceed to next phase
```

**Example**:
```
Phase 4 complete: 125k tokens (62.5%)
Status: ORANGE (Critical)
Action: FORCE checkpoint created
Checkpoint: .claude/checkpoints/2025-10-31-1445-AUTO-CONTEXT.md
Continue: YES (can continue after checkpoint)
```

---

### RED: ≥140k tokens (70%+)

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
git commit -m "chore: EMERGENCY checkpoint - context RED at 142k (71%)"
git push

# 4. STOP
BLOCKING: New session required
DO NOT proceed to next phase
User must resume in new session
```

**Example**:
```
Phase 5 complete: 142k tokens (71%)
Status: RED (BLOCKING)
Action: EMERGENCY checkpoint created
Checkpoint: .claude/checkpoints/2025-10-31-1520-EMERGENCY-RED.md
Continue: NO ✗ (BLOCKED)

BLOCKING MESSAGE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔ CONTEXT RED: New Session Required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context: 142k tokens (71%)
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
| 2025-10-31 14:45 | Phase 4 | 125k | 62.5% | ORANGE | Force checkpoint | 2025-10-31-1445-AUTO-CONTEXT.md |
```

---

## Implementation in CLAUDE.md

In V8.0 CLAUDE.md, this will be enforced as:

```markdown
## MANDATORY: Auto-Context Monitoring

AFTER EVERY PHASE:
1. MUST run /context command
2. MUST parse token count
3. MUST evaluate threshold (GREEN/YELLOW/ORANGE/RED)
4. MUST take required action:
   - GREEN: Continue
   - YELLOW: Log warning, continue
   - ORANGE: Force checkpoint, continue
   - RED: BLOCKING (stop, new session)
5. MUST update .claude/context-log.md
6. MUST commit log update

BLOCKING IF:
- Context ≥140k (70%) AND continuing
- Skipping context check after phase
- Not creating checkpoint at 120-140k
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

### When YELLOW (100-120k):
- Disable unused MCP servers (use @ syntax to toggle)
- Use Explore subagent for codebase analysis (separate context)
- Avoid reading large files directly (use targeted searches)
- Clear message buffer if possible

### When ORANGE (120-140k):
- All YELLOW strategies
- Checkpoint now (before forced)
- Consider phase completion and natural break point
- Plan next session if close to RED

### Prevent RED:
- Monitor actively (don't wait for auto-check)
- Use Explore/Plan subagents (separate context)
- Don't read entire service directories
- Use grep/glob instead of reading files

---

## Testing the System

To validate auto-context monitoring:

1. **GREEN test**: Complete simple task, verify <100k
2. **YELLOW test**: Simulate 110k context, verify warning logged
3. **ORANGE test**: Simulate 125k context, verify checkpoint created
4. **RED test**: Simulate 142k context, verify BLOCKING works

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Context per session | <80k (40%) |
| Auto-check compliance | 100% (after every phase) |
| Checkpoint compliance | 100% (at ORANGE) |
| RED incidents | 0 (should never reach RED) |

---

**Version**: V8.0
**Status**: Production
**Last Updated**: 2025-10-31
