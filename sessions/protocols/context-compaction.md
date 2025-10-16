# Context Compaction Protocol

**Purpose**: Prepare for context reset while preserving state and learnings
**Last Updated**: 2025-10-16 (Modernized for CC 2.0.19 + SpecKit)

---

## When to Use

**Trigger context compaction when**:
- Context usage >75% (150k/200k tokens)
- User requests `/compact` or explicit context reset
- Session becoming unwieldy
- Before switching to different task

---

## 1. Update Task State

**Ensure current task is recorded**:

```bash
# Verify task state is current
cat .claude/state/current_task.json

# Update if needed
vi .claude/state/current_task.json
```

**Should contain**:
- `task`: Current task name
- `branch`: Current git branch
- `services`: Affected services
- `updated`: Today's date

---

## 2. Update Task File

### Work Log

**Add final session entry**:

```markdown
## Work Log

**Session X - 2025-10-16**:
- Completed X, Y, Z
- Identified issue with A
- Next: Implement B
```

**Keep concise** (<100 lines total work log)

### Progress Tracking

**TodoWrite tool maintains this automatically**, but verify:

```markdown
## Progress
- [x] Completed items
- [ ] Pending items
```

### Decisions

**Document any new decisions**:

```markdown
## Decisions Made

**2025-10-16**: Chose event sourcing for payments
- Rationale: Audit trail required
- Alternative considered: Simple CRUD
- Reference: memory/constitution.md - Event Sourcing patterns
```

---

## 3. Update Documentation (If Needed)

**Only if significant interface changes**:

```bash
# For service documentation updates
/docs

# OR use docs-architect for comprehensive updates
Task tool: documentation-generation:docs-architect
```

**Update**:
- Service CLAUDE.md files (if patterns changed)
- Feature specs (if implementation deviated)
- Architecture decisions (if new patterns)

---

## 4. Context Optimization Check

**Before compacting, verify context is optimized**:

### Task File Size
- [ ] Task file <500 lines (target) or <1000 lines (max)
- [ ] Using references, not embedding
- [ ] Work log concise
- [ ] No copied architecture/code

**If task file too large**:
```bash
# Check size
wc -l sessions/tasks/[task-file].md

# If >1000 lines, refactor:
# - Move embedded content to references
# - Use /explore instead of copying
# - Consolidate work log entries
```

### MCP Servers
- [ ] Only sequential-thinking enabled (default)
- [ ] Other MCPs disabled unless actively using
- [ ] Context: ~1.5k tokens for MCPs

**Disable unused MCPs**:
```bash
# If you previously enabled MCPs, they may still be active
# Verify: /context command (if available)
# Disable by not using @ mentions
```

### Embedded Content
- [ ] No full service architectures embedded
- [ ] No large code blocks unnecessarily
- [ ] References to service CLAUDE.md files
- [ ] Using /explore for analysis

---

## 5. Create Checkpoint

**Document current state clearly**:

```markdown
## Checkpoint - 2025-10-16

### Accomplished
- [List what was completed this session]

### In Progress
- [What is partially done]

### Next Steps
1. [Specific next action]
2. [Second action]
3. [Third action]

### Blockers
- [Any blockers or considerations]
- [Dependencies needed]

### Context Notes
- Key files modified: [list]
- Active branch: [branch-name]
- Test status: [passing/failing]
```

---

## 6. Verify Quality State

**Before compacting, ensure quality maintained**:

```bash
# Run quick checks if code was modified
/test                    # Tests still passing?
git status               # Any uncommitted changes?
```

**If uncommitted changes**:
- Commit if work unit complete
- OR document in checkpoint why uncommitted

---

## 7. Announce Readiness

**Communicate to user**:

> "Context compaction complete! ✅
>
> **Task state updated**:
> - Current task: [task-name]
> - Branch: [branch-name]
> - Status: [in-progress/completed]
>
> **Progress checkpoint created**:
> - Accomplished: [summary]
> - Next steps: [concrete actions]
> - Blockers: [none/listed]
>
> **Context optimized**:
> - Task file: [X] lines (target <500)
> - MCPs: sequential-thinking only
> - Documentation: updated
>
> Ready for context reset. Would you like to continue, or switch tasks?"

---

## Context Optimization Tips

### Reference > Embed

**❌ Don't**:
```markdown
## Domain Model
[Copy 500 lines of entity definitions]
```

**✅ Do**:
```markdown
## Domain Model
See: services/finance/src/domain/entities/
Use: /explore services/finance/src/domain
```

### MCP On-Demand

**Default state** (after compaction):
- Only sequential-thinking enabled
- Other MCPs: Enable with @servername when needed
- Context baseline: ~1.5k tokens

### Work Log Concision

**❌ Don't**:
```markdown
**Session 1**: Started by exploring the finance service architecture.
Read through the CLAUDE.md file which describes the overall structure.
Then analyzed the domain model, specifically the Invoice aggregate...
[500 lines of detailed narration]
```

**✅ Do**:
```markdown
**Session 1**: Explored finance service, designed Invoice aggregate
**Session 2**: Implemented aggregate, added tests
**Session 3**: Quality gates passed, ready for PR
```

---

## After Compaction

**When resuming work**:

1. **Load task state**: `cat .claude/state/current_task.json`
2. **Read checkpoint**: Review last checkpoint in task file
3. **Review next steps**: Follow concrete actions listed
4. **Enable MCPs if needed**: @postgres, @docker, etc.
5. **Continue work**: Pick up where left off

---

## Quick Checklist

Before announcing compaction ready:

- [ ] Task state updated (`.claude/state/current_task.json`)
- [ ] Work log updated with session entry
- [ ] Progress tracked (TodoWrite or manual)
- [ ] Decisions documented (if any)
- [ ] Documentation updated (if needed)
- [ ] Task file <1000 lines (preferably <500)
- [ ] Only sequential-thinking MCP enabled
- [ ] No embedded content (using references)
- [ ] Checkpoint created (what done, what next, blockers)
- [ ] Quality state verified (tests passing, git status clean or documented)

---

## Philosophy

> "Compact context, preserve state, optimize for next session."

**Key Principles**:
1. **State preservation** - Never lose progress
2. **Context optimization** - Minimize token usage
3. **Clear checkpoints** - Obvious next steps
4. **Documentation currency** - Keep docs updated
5. **Quality maintenance** - Don't break things

---

## Related Protocols

- **Task startup**: `sessions/protocols/task-startup.md`
- **Task completion**: `sessions/protocols/task-completion.md`
- **Compounding cycle**: `sessions/protocols/compounding-cycle.md`
- **Context optimization**: `sessions/knowledge/vextrus-erp/context-optimization-tips.md`

---

**Last Updated**: 2025-10-16
**Status**: ✅ Modernized for CC 2.0.19 + SpecKit
**Changes**: Removed old agent references, added TodoWrite, context optimization focus
