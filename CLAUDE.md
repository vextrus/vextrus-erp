# Vextrus ERP - V8.1 Enforcement Protocol

**System**: Bangladesh Construction & Real Estate ERP (18 microservices)
**Model**: Sonnet 4.5 (complex), Haiku 4.5 (explore)
**Context**: 200k window | Target: <120k (60%)
**Philosophy**: ENFORCE, don't suggest

---

## 🚀 Quick Start

### Step 1: Classify Task (MANDATORY - BLOCKING)

Answer these questions BEFORE starting:

```
Q1: How many files affected? [1-3 / 4-15 / 15+]
Q2: Cross-service integration? [YES / NO]
Q3: Estimated time? [<2h / 2-8h / 2-5d]

TIER ASSIGNMENT:
- TIER 1: 1-3 files, <2h, single service → 4 phases
- TIER 2: 4-15 files, 2-8h, moderate complexity → 6 phases (Plan + Explore MANDATORY)
- TIER 3: 15+ files, 2-5d, cross-service → Multi-day (Plan + Explore MANDATORY)

⚠️ BLOCKING: Tier is LOCKED once assigned.
```

### Step 2: Execute Tier Workflow

**Detailed workflows**: See `.claude/TIER-WORKFLOWS.md`

- **TIER 1**: READ → IMPLEMENT → VALIDATE → COMMIT
- **TIER 2**: PLAN → EXPLORE → DESIGN → IMPLEMENT → REVIEW → FINALIZE
- **TIER 3**: Research Day → Implementation Days → Quality Day

### Step 3: Mandatory Actions (EVERY phase)

1. **Context monitoring**: Ask user to run `/context` (see `.claude/AUTO-CONTEXT-MONITORING.md`)
2. **TODO updates**: Update + commit `.claude/todo/current.md`
3. **Quality gates**: `pnpm build` (0 errors) + `npm test` (all passing) before commits

---

## 📋 Command Reference

| Need | Command | Details |
|------|---------|---------|
| **Plan** | Task(subagent_type="Plan") | `.claude/VERIFICATION-GATES.md` |
| **Explore** | Task(subagent_type="Explore") | `.claude/VERIFICATION-GATES.md` |
| **Context** | Ask user: `/context` | `.claude/AUTO-CONTEXT-MONITORING.md` |
| **Build** | `pnpm build` | Must show 0 errors |
| **Test** | `npm test` | Must show all passing |
| **Review** | `/comprehensive-review:full-review` | Target: ≥8/10 |
| **Security** | `/backend-api-security:backend-security-coder` | 0 critical/high |
| **Backend** | `/backend-development:feature-development` | `.claude/plugin-command-reference.md` |
| **TDD** | `/tdd-workflows:tdd-cycle` | Red-green-refactor |
| **Database** | `/database-migrations:sql-migrations` | Zero-downtime |
| **PR** | `/git-pr-workflows:pr-enhance` | Enhanced PR creation |

---

## 🎯 Context Thresholds

| Status | Range | Action |
|--------|-------|--------|
| **GREEN** | <120k (60%) | Continue |
| **YELLOW** | 120-140k (60-70%) | Warning logged |
| **ORANGE** | 140-160k (70-80%) | **FORCE checkpoint** (MANDATORY) |
| **RED** | ≥160k (80%+) | **BLOCKING** - new session required |

**After EVERY phase**: Ask user `/context` → Evaluate → Act → Log

---

## 🔒 NEVER Actions

```
NEVER: Skip Plan subagent for Tier 2/3
NEVER: Skip Explore subagent for Tier 2/3
NEVER: Skip context monitoring after phase
NEVER: Continue when context RED (≥160k)
NEVER: Skip TODO update after phase
NEVER: Commit with TypeScript errors
NEVER: Commit with failing tests
NEVER: Self-select tier (tier is LOCKED)
NEVER: Skip checkpoint at ORANGE
NEVER: Disable tests to make them pass
```

---

## 📚 Resources

- **Workflows**: `.claude/TIER-WORKFLOWS.md` (detailed tier 1/2/3 phases)
- **Context**: `.claude/AUTO-CONTEXT-MONITORING.md` (thresholds, monitoring, recovery)
- **Gates**: `.claude/VERIFICATION-GATES.md` (classification, phase, quality, context gates)
- **Optimization**: `.claude/CONTEXT-OPTIMIZATION.md` (auto-compact, MCPs, session hygiene)
- **Plugins**: `.claude/plugin-command-reference.md` (54 plugins, tier classifications)
- **Skills**: `.claude/skills/` (4 domain skills: bangladesh-erp, ddd, graphql, nestjs)
- **Patterns**: `VEXTRUS-PATTERNS.md` (DDD + Event Sourcing + CQRS + GraphQL Federation v2)
- **TODO**: `.claude/todo/current.md` (git-tracked, survives compaction)
- **Checkpoints**: `.claude/checkpoints/` (recovery points)
- **Context Log**: `.claude/context-log.md` (audit trail)

---

## 🎓 Domain Patterns (Quick Reference)

**Architecture**: DDD + Event Sourcing + CQRS + GraphQL Federation v2 + NestJS

**Bangladesh Compliance**:
- VAT: 15% standard
- TDS: 5% with TIN, 7.5% without
- Fiscal Year: July 1 - June 30
- Mushak 6.3: Invoice-Payment linking

**Key Rules**:
- Aggregates: Small, enforce invariants
- Events: Past tense, immutable, versioned
- Commands: Validate, idempotent
- GraphQL: Always paginate, JwtAuthGuard + RbacGuard

---

## ✅ Success Metrics

| Metric | Target | BLOCKING If |
|--------|--------|-------------|
| Context/session | <120k (60%) | ≥160k (80%) |
| Agent usage (Tier 2/3) | 100% | 0% (skipped) |
| TODO persistence | 100% | Lost/not synced |
| Quality gates | 100% | Errors/failures |
| Review score | ≥8/10 | <8/10 |
| Security | 0 critical | >0 critical |
| Test coverage | ≥90% | <85% |

---

**V8.1: Concise Enforcement Protocol**
**Balanced | Enforced | Resilient | Context-Optimized**
**See `.claude/TIER-WORKFLOWS.md` for detailed workflows**
