# Task Creation Protocol

**Purpose**: Systematic task file creation for Vextrus ERP development
**Last Updated**: 2025-10-19 (v7.0 - Plan Mode Integration)

---

## Plan Mode Assumption

**Default**: All tasks created in plan mode (⏸) for comprehensive planning

---

## Priority Prefix System

**Format**: `[priority]-[type]-[task-name].md`

**Priority**:
- `a-` Critical (blocking, production issues)
- `b-` High (core features, important bugs)
- `c-` Medium (enhancements, refactoring)
- `d-` Low (nice-to-have, documentation)

---

## Task Type Prefix Enum

**Types**:
- `feature-` New functionality
- `fix-` Bug fixes
- `refactor-` Code improvements
- `docs-` Documentation
- `test-` Testing improvements
- `research-` Investigation/exploration

---

## File vs Directory Decision

**File** (`.md`):
- Simple, single-service tasks
- <10 day timeline
- Minimal context needed

**Directory** (`/`):
- Complex, multi-service tasks
- >10 day timeline
- Needs checkpoints, artifacts

---

## Creating a Task

### 1. Review Constitution

```bash
cat CLAUDE.md
```

Brief review of project principles and architecture.

### 2. Gather Context

**For new patterns**:
```bash
/explore services/[name]
```

**For context gathering strategies**, see: `sessions/knowledge/vextrus-erp/guides/context-gathering-guide.md`

### 3. Create Task File

**Template**:
```markdown
---
task: task-name
branch: feature/task-name
status: pending
created: 2025-10-19
spec: sessions/specs/task-name.md  # If complex
---

# Task: [Task Name]

## Objective
[Clear, measurable goal]

## Success Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Context
**Service**: services/[name]/
**References**: See services/[name]/CLAUDE.md

## Approach
[Brief technical approach]

## Quality Gates
- [ ] /review
- [ ] /security-scan
- [ ] /test
- [ ] pnpm build

## Work Log
[Track progress as you work]
```

**For SpecKit details**, see: `sessions/specs/TEMPLATE.md`

---

## Starting Work

Update `.claude/state/current_task.json`:
```json
{
  "task": "task-name",
  "branch": "feature/task-name",
  "services": ["service1"],
  "updated": "2025-10-19"
}
```

Follow `task-startup.md` protocol.

---

## Task Evolution

Tasks may grow. If exceeding 1,000 lines:
1. Create checkpoint
2. Refactor to reference pattern
3. Consider splitting into subtasks

---

## For Agents

When creating tasks for user:
1. Use plan mode (present plan before creating)
2. Use priority + type prefixes
3. Keep task files concise (<500 lines)
4. Reference external docs
5. Include clear success criteria

---

## Quick Checklist

- [ ] Task follows naming convention
- [ ] Frontmatter complete
- [ ] Success criteria defined
- [ ] Context references (not embeds)
- [ ] Quality gates listed
- [ ] Work log section included

---

## Philosophy

> "Well-defined tasks compound: clear objectives, systematic execution, captured learnings."

---

**Last Updated**: 2025-10-19
**Version**: 7.0 (Plan Mode Integration)
