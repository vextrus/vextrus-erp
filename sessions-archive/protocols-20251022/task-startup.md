# Task Startup Protocol

**Purpose**: Systematic task initialization for Vextrus ERP development
**Last Updated**: 2025-10-19 (v7.0 - Plan Mode Integration)

---

## 0. Load Task Context

```bash
# View active task
cat .claude/state/current_task.json

# Update task state
{
  "task": "task-name",           # NO path, NO .md extension
  "branch": "feature/branch-name",
  "services": ["service1"],
  "updated": "2025-10-19"
}
```

---

## 1. Load Project Constitution

```bash
cat CLAUDE.md  # Read once per session
```

---

## 2. Load Feature Specification (If Exists)

```bash
cat sessions/specs/[feature-name].md  # SpecKit format for complex features
```

---

## 3. Gather Service Context

### Quick Context (Recommended)

```bash
/explore services/[service-name]  # Haiku 4.5 - 2x faster, 1/3 cost, separate context
```

### Service Documentation

```bash
cat services/[service-name]/CLAUDE.md  # Architecture, domain model, business rules
```

---

## 4. Context Optimization

### Key Principle: Reference > Embed

**✅ DO** reference:
```markdown
**Service**: services/finance/
**Architecture**: See services/finance/CLAUDE.md
**Domain**: Use `/explore services/finance/src/domain`
```

**❌ DON'T** embed full context (creates 3,000+ line files).

**Task File Limits**: <500 lines (target), 1,000 lines (max)

**Details**: `sessions/knowledge/vextrus-erp/guides/context-optimization.md`

---

## 5. Enable MCP Servers (On-Demand Only)

**Default**: `sequential-thinking` (1.5k tokens)
**On-demand**: `@postgres`, `@docker`, `@playwright`, `@github`, `@serena`

**Savings**: 98.6% context reduction

---

## 6. Update Task File Status

```yaml
---
task: feature-name
branch: feature/branch-name
status: in-progress
started: 2025-10-19
spec: sessions/specs/feature-name.md  # If exists
---
```

---

## 7. Plan Mode Workflow

**Default**: All tasks start in plan mode (⏸)

1. User describes task in plan mode
2. Claude researches + asks questions (AskUserQuestion)
3. Claude presents plan (ExitPlanMode)
4. User approves
5. Claude executes

**Skills auto-activate** based on trigger words during planning.

---

## 8. Verify Understanding

Before starting:

- ✅ Success criteria understood
- ✅ Work log reviewed (if resuming)
- ✅ No blockers
- ✅ Approach confirmed (ask in plan mode if uncertain)
- ✅ Quality gates identified
- ✅ Task file <500 lines

---

## 9. Work Mode

**Principles**:
1. **Skill-driven** - Auto-activation on keywords
2. **Reference > Embed** - Link, don't copy
3. **Checkpoint frequently** - Esc-Esc to rewind
4. **Update work log** - Brief progress notes
5. **TodoWrite** - Track progress
6. **Quality gates** - /review, /test, /security-scan

---

## Git Workflow

```bash
git checkout -b feature/task-name
# Work...
git add . && git commit -m "feat: description"
git push origin feature/task-name
```

---

## Quick Checklist

- [ ] Task state updated (`.claude/state/current_task.json`)
- [ ] Constitution reviewed (`CLAUDE.md`)
- [ ] Feature spec loaded (if exists)
- [ ] Service context gathered (`/explore` or CLAUDE.md)
- [ ] MCPs on-demand only
- [ ] Task file frontmatter updated
- [ ] Task file <500 lines (references, not embeds)
- [ ] Plan mode used
- [ ] Understanding verified

---

## Related Protocols

- **Complex tasks**: `sessions/protocols/compounding-cycle.md`
- **Completion**: `sessions/protocols/task-completion.md`
- **Context maintenance**: `sessions/protocols/context-compaction.md`

---

## Philosophy

> "Start with clarity, optimize for context, leverage skills, maintain systematically."

**Key Principles**:
1. **Systematic** - Follow protocol
2. **Context-efficient** - Reference > Embed, MCP on-demand
3. **Spec-driven** - Use SpecKit for complex features
4. **Skill-assisted** - Auto-activation
5. **Quality-first** - Plan gates from start
6. **Plan mode default** - Research → Plan → Approve → Execute

---

**Version**: 7.0 (Plan Mode Integration)
**Changes**: Condensed verbosity, plan mode workflow, skill-driven emphasis
