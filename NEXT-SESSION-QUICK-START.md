# Next Session Quick Start

**Resume Session 6**: Core Skills Upgrade Completion

---

## 30-Second Overview

**What we're doing**: Upgrading 3 Core Skills (execute-first, haiku-explorer, test-first) to match the quality of 8 Advanced Skills.

**Why it matters**: Core Skills are used in 80% of all tasks but currently have only 2-star quality (vs 5-star for Advanced Skills).

**Time needed**: 2.5-3 hours

---

## Immediate Actions

**Step 1**: Read checkpoint
```bash
cat sessions/tasks/SESSION-5-CHECKPOINT.md
```

**Step 2**: Read action plan
```bash
cat sessions/tasks/SESSION-6-NEXT-ACTIONS.md
```

**Step 3**: Start with execute-first completion (45 min)
```bash
# Already created:
ls .claude/skills/execute-first/resources/execution-strategies.md

# Create next 2 resource files:
# 1. code-first-patterns.md
# 2. skill-coordination.md

# Then upgrade SKILL.md from 93 → 500+ lines
# Then create execute-first-patterns.md knowledge file
```

---

## Files to Create (11 total)

### execute-first (4 files)
1. `.claude/skills/execute-first/resources/code-first-patterns.md`
2. `.claude/skills/execute-first/resources/skill-coordination.md`
3. `.claude/skills/execute-first/SKILL.md` (replace)
4. `sessions/knowledge/vextrus-erp/patterns/execute-first-patterns.md`

### haiku-explorer (2 files)
5. `.claude/skills/haiku-explorer/SKILL.md` (upgrade)
6. `.claude/skills/haiku-explorer/resources/parallel-exploration.md`

### test-first (4 files)
7. `.claude/skills/test-first/resources/tdd-workflow.md`
8. `.claude/skills/test-first/resources/testing-strategies.md`
9. `.claude/skills/test-first/resources/test-patterns.md`
10. `.claude/skills/test-first/SKILL.md` (replace)
11. `sessions/knowledge/vextrus-erp/patterns/test-first-patterns.md`

**Plus**: Update `CLAUDE.md` (skill count 9 → 17)

---

## Template to Follow

**Use as reference**: `.claude/skills/health-check-patterns/SKILL.md` (661 lines, perfect Anthropic compliance)

**Frontmatter**:
```yaml
---
name: Skill Name
version: 1.0.0
triggers: ["trigger1", "trigger2", ...]
auto_load_knowledge:
  - sessions/knowledge/vextrus-erp/patterns/skill-patterns.md
---
```

**Structure** (500+ lines):
1. When This Skill Activates (50 lines)
2. Core Principles (100 lines, 5-7 patterns)
3. Implementation Patterns (150 lines, code examples)
4. Evidence from Vextrus ERP (50 lines)
5. Best Practices (30 lines)
6. Anti-Patterns (30 lines)
7. Quick Reference (30 lines)
8. Further Reading (10 lines)

---

## Success Criteria

**After completion**:
- ✅ All 3 Core Skills: 500+ lines
- ✅ All 3 Core Skills: 3 resource files each
- ✅ All 3 Core Skills: auto_load_knowledge
- ✅ CLAUDE.md shows 17 skills
- ✅ Context: <35% (projected 30-32%)

---

## Anthropic Docs (Manual Review)

**Optional before starting**:
1. https://www.anthropic.com/news/skills
2. https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview
3. https://docs.claude.com/en/docs/agents-and-tools/agent-skills/quickstart
4. https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices

**Already extracted**: 8 patterns from analyzing Advanced Skills

---

## Estimated Timeline

- Phase 3.1 complete: 45 min
- Phase 3.2: 20 min
- Phase 3.3: 45 min
- Phase 4: 30 min
- Phase 5: 15 min

**Total**: 2h 35min

---

**Ready to execute!**

Start with: `cat sessions/tasks/SESSION-6-NEXT-ACTIONS.md`