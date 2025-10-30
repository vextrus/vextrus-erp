# Compounding Cycle Protocol

**Purpose**: Complex feature development using Plan → Delegate → Assess → Codify
**Last Updated**: 2025-10-19 (v7.0 - Plan Mode Integration)

---

## Philosophy

> "AI agents enable a **compounding quality cycle** where each iteration teaches the system, making subsequent work easier, faster, and better."
> — Sam Schillace

---

## When to Use

**Apply compounding cycle for**:
- Complex features (multi-service, multi-day)
- New patterns being introduced
- Significant architectural changes
- Work that will teach reusable patterns

**Skip for**:
- Simple features (<4 hours)
- Bug fixes
- Well-established patterns

**Decision Matrix**: **Complexity + Novelty → Compounding** | **Simple + Familiar → Direct**

---

## The Four Phases

### 1. PLAN (Research & Architecture)

**Goal**: Deep understanding before code, capture decisions in SpecKit spec

**Sonnet 4.5 orchestrates**:
```bash
Task tool: compounding-engineering:architecture-strategist
Task tool: compounding-engineering:pattern-recognition-specialist
Task tool: compounding-engineering:best-practices-researcher
```

**Haiku 4.5 explores**:
```bash
/explore services/[name]
```

**Output**: Feature specification in `sessions/specs/[feature-name].md`

**For SpecKit format**, see: `sessions/specs/TEMPLATE.md`

**Time**: 1-3 hours planning, saves 3-10 hours implementation

---

### 2. DELEGATE (Parallel Execution)

**Goal**: Break down and execute in parallel using specialized agents

**Pattern**:
```
Sonnet analyzes spec → Creates subtasks → Delegates to Haiku instances

Haiku 1-5: Execute subtasks in parallel (domain, database, GraphQL, commands, tests)

Sonnet: Reviews, integrates, ensures coherence
```

**TodoWrite Tool**: Track parallel subtask progress

**Time**: 2-5x faster with parallelization

---

### 3. ASSESS (Quality Compounding)

**Goal**: Multi-level quality review, capture improvement opportunities

**Level 1: Automated** (Required):
```bash
/review /security-scan /test
pnpm build
```

**Level 2: Language-Specific** (Recommended):
```bash
Task tool: compounding-engineering:kieran-typescript-reviewer
```

**Level 3: Specialized** (As needed):
- `architecture-strategist`, `performance-oracle`, `security-sentinel`, `data-integrity-guardian`, `code-simplicity-reviewer`

**Level 4: Domain-Specific**:
- Bangladesh compliance, GraphQL Federation, Event sourcing, Database performance

**Output**: Improvements, technical debt notes, pattern learnings

**Time**: 30 min - 2 hours

---

### 4. CODIFY (Learning Capture)

**Goal**: Systematically capture learnings to make future work easier

**Use feedback-codifier agent**:
```bash
Task tool: compounding-engineering:feedback-codifier
```

**Capture insights**:
1. What patterns worked well?
2. What could be simplified?
3. What should be automated?

**Update knowledge base**:
- Service CLAUDE.md
- sessions/knowledge/vextrus-erp/
- memory/constitution.md (if new standards)

**For detailed questions**, see: `sessions/knowledge/vextrus-erp/patterns/codify-questions-template.md`

**Time**: 15-45 minutes

---

## Plan Mode Integration

**Compounding in plan mode**:
1. User describes complex feature in plan mode
2. Claude presents PLAN phase strategy
3. User approves research approach
4. Execute PLAN (agents gather insights, create spec)
5. Present DELEGATE strategy
6. User approves implementation approach
7. Execute DELEGATE (parallel implementation)
8. Present ASSESS results
9. Execute CODIFY (capture learnings)

**Skills auto-activate** throughout cycle based on domain triggers

---

## Quick Reference

| Phase | Goal | Tools | Output | Time |
|-------|------|-------|--------|------|
| PLAN | Understand | architecture-strategist, pattern-recognition, best-practices-researcher, /explore | SpecKit spec | 1-3h |
| DELEGATE | Execute | Haiku agents (parallel), TodoWrite | Implementation | Varies |
| ASSESS | Quality | /review, /test, /security-scan, specialized reviewers | Improvement list | 30m-2h |
| CODIFY | Learn | feedback-codifier | Knowledge base updates | 15-45m |

**For complete example walkthrough**, see: `sessions/knowledge/vextrus-erp/workflows/compounding-example-invoice-payment.md`

**For metrics and proven results**, see: `sessions/knowledge/vextrus-erp/workflows/compounding-metrics.md`

---

## Philosophy

**Compounding Engineering**: Each task improves future tasks through systematic learning capture and quality compounding.

**Key Principles**:
1. **Plan before code** - Deep understanding first
2. **Parallel execution** - Use multiple Haiku agents
3. **Quality compounds** - Multi-level assessment
4. **Learning capture** - Systematic codification
5. **Future acceleration** - Each task makes next easier

---

**Last Updated**: 2025-10-19
**Version**: 7.0 (Plan Mode Integration)
**Changes**: Condensed phases, extracted examples/metrics, added plan mode workflow
