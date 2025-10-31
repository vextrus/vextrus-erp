# Checkpoint: [Phase Name]

**Task**: [Task name]
**Timestamp**: [YYYY-MM-DD HH:MM:SS]
**Trigger**: [AUTO_CONTEXT_120k / AUTO_PHASE_COMPLETE / MANUAL / AUTO_END_OF_DAY]

---

## Context Status

- **Current Context**: [Xk tokens] ([Y%])
- **Status**: [GREEN <100k / YELLOW 100-120k / ORANGE 120-140k / RED ≥140k]
- **Action Taken**: [Continue / Force Checkpoint / New Session Required]

---

## Git Status

- **Branch**: [branch-name]
- **Last Commit**: [hash]
- **Commit Message**: [message]
- **Uncommitted Changes**: [Yes/No - list if yes]

---

## Completed in This Phase

### Subtasks
- [x] Completed subtask 1
- [x] Completed subtask 2
- [x] Completed subtask 3

### Files Modified
- `path/to/file1.ts` - [description]
- `path/to/file2.ts` - [description]

### Quality Gates
- [x] pnpm build - PASS (0 errors)
- [x] npm test - PASS (all passing)
- [ ] Review - [score or "not yet"]
- [ ] Security scan - [status or "not yet"]

---

## TODO Remaining

### Next Phase: [Phase Name]
- [ ] Next subtask 1
- [ ] Next subtask 2

### Overall Progress
- **Phases Completed**: [X/Y] ([Z%])
- **Estimated Time Remaining**: [hours]

---

## Issues/Blockers

[List any issues encountered or blockers, or "None"]

---

## Decisions Made

[List any architectural or implementation decisions made during this phase]

---

## Notes

[Any additional context, discoveries, or important information]

---

## Recovery Instructions

To resume from this checkpoint:
1. `git checkout [hash]`
2. Read `.claude/todo/current.md` for full TODO state
3. Review this checkpoint for phase-specific context
4. Check `.claude/context-log.md` for context history
5. Continue with [next phase name]

---

**Auto-generated checkpoint**
**Next checkpoint**: After Phase [X] completion or at 120k context
