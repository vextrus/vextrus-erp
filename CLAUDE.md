# Vextrus ERP - Agent-First Workflow

**Version**: 2.0 (Agent-First Architecture)
**Claude Code**: 2.0.22 | **Models**: Sonnet 4.5 + Haiku 4.5
**Industry**: Bangladesh Construction & Real Estate ERP
**Architecture**: Checkpoint-Driven + Agent Orchestration + Git Worktree ✅

---

## Philosophy: Agent-First, Checkpoint-Driven

**What Works** (Proven in Production):
- ✅ **Agent Orchestration** (21 agents, 95% success rate)
- ✅ **Checkpoint-Driven Development** (300-600 line checkpoints after each phase)
- ✅ **Complete File Reading** (ALWAYS read entire files, 87% bug reduction)
- ✅ **Post-Implementation Quality Review** (kieran-typescript-reviewer, 9.5/10 quality)
- ✅ **Git for Context** (commits, branches, worktrees)

**What Failed** (Deprecated):
- ❌ 17 skills with 5% activation rate → Archived
- ❌ sessions/ directory chaos → Archived
- ❌ Skills-first architecture → Replaced with agent-first

**Core Principle**: **Agents > Skills**, **Checkpoints > Exploration**, **Git > Sessions**

---

## Quick Start

### Simple Tasks (<4 hours - 80% of work)

**Pattern**: Read → Execute → Review → Commit

```bash
# 1. Read target files COMPLETELY (10-40 min)
# No exploration phase needed for simple tasks

# 2. Execute directly (30-120 min)
# Just implement naturally - reference VEXTRUS-PATTERNS.md when needed

# 3. Quality review (5-10 min)
pnpm build && npm test

# 4. Commit (30 sec)
git add . && git commit -m "fix: authentication guard

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Time**: 1-4 hours | **Agents**: 0-1 | **Success Rate**: 95%+

**Example**:
```
User: "Fix the VAT calculation in invoice service"

Claude:
1. Read services/finance/src/application/services/vat-calculation.service.ts
2. Read VEXTRUS-PATTERNS.md (Bangladesh Compliance section)
3. Implement fix with 15% standard VAT rate
4. Add unit test
5. pnpm build && npm test
6. git commit -m "fix: VAT calculation for Bangladesh (15% standard rate)"

Total: 2 hours
```

---

### Medium Tasks (4-8 hours - 15% of work)

**Pattern**: Explore → Read → Execute → Review (Agents) → Commit

```bash
# 1. Exploration (optional, 5-10 min)
/explore services/finance

# 2. Agent assistance (15-30 min)
# Invoke: pattern-recognition-specialist
"Analyze existing payment processing patterns before implementing payment reconciliation"

# 3. Read identified files COMPLETELY (20-40 min)

# 4. Execute with patterns from VEXTRUS-PATTERNS.md (3-6 hours)

# 5. Quality review with agents (15-30 min)
# Invoke: kieran-typescript-reviewer
"Review the payment reconciliation implementation"

# 6. Commit
git add . && git commit -m "feat: payment reconciliation with bank statements"
```

**Time**: 4-8 hours | **Agents**: 2-3 | **Success Rate**: 90%+

---

### Complex Tasks (Multi-day - 5% of work)

**Pattern**: PLAN → EXECUTE → ASSESS → COMMIT (Checkpoint-Driven)

```bash
# DAY 1: PLAN (2-4 hours)
# 1. Explore with Haiku agents (parallel)
/explore services/finance
/explore services/master-data

# 2. Planning agents (parallel)
# Invoke: architecture-strategist
"Design the invoice-payment linking feature with cross-aggregate coordination"

# Invoke: best-practices-researcher
"Research bank reconciliation best practices for construction industry"

# 3. Create implementation plan (TodoWrite: 8-15 items)

# DAY 2-3: EXECUTE (1-2 days)
# 1. Read ALL identified files COMPLETELY
# 2. Implement systematically following plan
# 3. Reference VEXTRUS-PATTERNS.md frequently
# 4. Commit after each major milestone (not just at end)

git commit -m "feat: Add ReconciliationService"
git commit -m "test: Add reconciliation tests"
git commit -m "feat: Add CSV parser for bank statements"

# DAY 4: ASSESS (1-2 hours)
# Quality review with agents
# Invoke: kieran-typescript-reviewer (ALWAYS)
# Invoke: security-sentinel (if security-critical)
# Invoke: performance-oracle (if performance-critical)

# Fix critical issues found

# DAY 5: CHECKPOINT + COMMIT
# 1. Create checkpoint (300-600 lines)
# 2. Update service CLAUDE.md with new features
# 3. Final commit with comprehensive message

git add .
git commit -m "feat: Complete payment reconciliation feature

- Add ReconciliationService with bank statement parsing
- Implement automatic payment-invoice matching
- Add support for discrepancy handling
- Multi-tenant isolation verified
- 32 tests added (100% passing)
- Performance: <500ms for 10,000 transactions

Phase 2 Complete (100%)
Checkpoint: <link-to-checkpoint-file>

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Time**: 2-5 days | **Agents**: 4-7 | **Success Rate**: 85%+

---

## Agent Orchestration

### 21 Specialized Agents (compounding-engineering plugin)

**When to Use Agents**:
- **Simple tasks**: 0-1 agents (usually none)
- **Medium tasks**: 2-3 agents (pattern analysis + quality review)
- **Complex tasks**: 4-7 agents (planning + execution support + review)

### Agent Directory

#### Planning Phase (2-4 agents for complex tasks)
```
architecture-strategist    Use when: Multi-service design, system architecture
best-practices-researcher  Use when: Need external research, new patterns
pattern-recognition-specialist  Use when: Understand existing codebase patterns
repo-research-analyst     Use when: Analyze repository structure
```

#### Execution Phase (1-2 agents, rarely needed)
```
framework-docs-researcher  Use when: Need library documentation
git-history-analyzer      Use when: Understand code evolution
```

#### Review Phase (1-3 agents for medium+ tasks)
```
kieran-typescript-reviewer  Use when: ALWAYS for medium+ tasks (strict quality)
security-sentinel          Use when: Auth, RBAC, sensitive data changes
performance-oracle         Use when: Optimization, caching, database queries
data-integrity-guardian    Use when: Database schema, migrations
code-simplicity-reviewer   Use when: Refactoring, complexity reduction
```

#### Specialized (as needed)
```
feedback-codifier         Use when: Capture learnings from complex tasks
pr-comment-resolver      Use when: Address PR review comments
```

### Agent Invocation Pattern

**Explicit Invocation** (NOT auto-activation):
```typescript
// Simple task
"Implement invoice validation using VEXTRUS-PATTERNS.md"
// No agent needed

// Medium task
"Before implementing payment reconciliation, analyze existing payment patterns"
// Invoke: pattern-recognition-specialist

"Review this payment reconciliation implementation"
// Invoke: kieran-typescript-reviewer

// Complex task
"Design the cross-aggregate invoice-payment coordination system"
// Invoke: architecture-strategist (planning)
// ... implementation ...
// Invoke: kieran-typescript-reviewer + security-sentinel (review)
```

---

## Checkpoint-Driven Development

**Pattern** (Proven in finance task - 100% success, 9.5/10 quality):

### After Each Phase Completion

**Create Checkpoint File** (300-600 lines):
```markdown
# Phase 2 Day 5-6: Performance Optimization COMPLETE

## Summary
- Redis caching infrastructure (30+ cache keys)
- Query handler caching (8 handlers)
- Cache invalidation (4 projection handlers, 18 events)
- Database performance indexes (22 composite indexes)

## Files Created (5)
1. src/infrastructure/cache/cache.module.ts (120 lines)
2. src/infrastructure/cache/cache.service.ts (180 lines)
[...]

## Files Modified (13)
1. get-account.handler.ts (+45 lines) - Added caching
2. account-projection.handler.ts (+38 lines) - Cache invalidation
[...]

## Quality Gates ✅
- [x] Build passing (zero errors)
- [x] Tests passing (377/377)
- [x] Pattern consistency: 100%
- [x] Performance target: 10-50x improvement expected

## Next Session Plan
**Task**: AccountBalanceService creation
**Context Load**: Read this checkpoint file
**Estimated Time**: 4 hours
```

**Move to done/**:
```bash
mv checkpoint.md sessions/tasks/done/task-CHECKPOINT-Phase2-Day5-6.md
```

**Update Main Task File**:
```markdown
# Main task file (sessions/tasks/task-name.md)

## Current Phase: Phase 2 Day 7-8 (IN PROGRESS)

[Current work details at top]

## Phase 2 Day 5-6: Performance Optimization ✅ COMPLETE

[Summary from checkpoint]

See: sessions/tasks/done/task-CHECKPOINT-Phase2-Day5-6.md

## Phase 2 Day 1-4: CRUD Operations ✅ COMPLETE
[...]
```

### Benefits

- ✅ **Zero rework** between sessions (full context preserved)
- ✅ **Fast session resume** (<5 min to load context)
- ✅ **Pattern consistency** (100% across 5,000+ lines)
- ✅ **Quality score** (9.5/10 production-ready)
- ✅ **Single source of truth** (main task file updated progressively)

---

## Git Worktree Workflow

**Use For**: Complex features requiring parallel development (2-5x speedup)

### When to Use

✅ **Use git worktree when**:
- Multi-day feature (>8 hours)
- Multiple services involved (backend + frontend + tests)
- Can parallelize work (independent sub-tasks)

❌ **Skip git worktree for**:
- Simple tasks (<4 hours)
- Single service changes
- Sequential work (no parallelization benefit)

### Workflow

```bash
# 1. Create feature worktrees
git worktree add ../vextrus-payment-backend -b feature/payment-backend
git worktree add ../vextrus-payment-frontend -b feature/payment-frontend
git worktree add ../vextrus-payment-tests -b feature/payment-tests

# 2. Parallel development
# Terminal 1: cd ../vextrus-payment-backend && claude
# Terminal 2: cd ../vextrus-payment-frontend && claude
# Terminal 3: cd ../vextrus-payment-tests && claude

# Each worktree has:
# - Separate branch
# - Separate CLAUDE.md context (if needed)
# - Independent Claude instance
# - No context switching overhead

# 3. Sequential merge back to main
cd ~/vextrus-erp
git checkout main
git merge feature/payment-backend
git merge feature/payment-frontend
git merge feature/payment-tests

# 4. Cleanup
git worktree remove ../vextrus-payment-backend
git worktree remove ../vextrus-payment-frontend
git worktree remove ../vextrus-payment-tests
```

### Benefits

- **2-5x wall-clock speedup** (true parallel work)
- **Clean isolation** (no branch switching)
- **Context focused** (each worktree has specific scope)
- **Native git feature** (no custom tooling)

---

## Quality Gates

### Automated (2-5 min) - NON-NEGOTIABLE

```bash
pnpm build     # Zero TypeScript errors
npm test       # All tests passing
```

**Fail = Block commit**

### Agent Review (15-45 min) - Medium+ Tasks

**ALWAYS use** for medium and complex tasks:
```
kieran-typescript-reviewer  (strict code quality)
```

**Conditionally use**:
```
security-sentinel       (if auth, RBAC, sensitive data)
performance-oracle      (if caching, optimization, queries)
data-integrity-guardian (if database schema changes)
```

### Domain-Specific Validation

**Bangladesh Compliance**:
- VAT 15% for construction materials
- TDS/AIT withholding (5-10% depending on vendor type)
- Mushak 6.3 generation on invoice approval
- Fiscal year July-June (NOT calendar year)
- TIN/BIN format validation (13 digits)

**GraphQL Federation v2**:
- `@key` directive on all federated entities
- Pagination for all list queries
- Payload types with errors (don't throw from mutations)
- 100% authentication coverage (NO @Public())

**Event Sourcing**:
- Events are immutable (past tense)
- Version events for schema evolution
- Idempotent event handlers
- Aggregates are small (1 root entity)

See **VEXTRUS-PATTERNS.md** for complete pattern reference.

---

## Construction & Real Estate ERP

### Industry Focus

**Construction Project Management**:
- Project budget tracking (allocated, spent, committed, available)
- Progress billing (% completion, retention 10%)
- Site management (material delivery, labor, equipment usage)
- Contractor management (payment terms, retention release)
- RAJUK approval integration
- Construction permit tracking

**Real Estate Management**:
- Property lifecycle (acquire → develop → list → sell/lease)
- Lease management (monthly rent, security deposit, renewal)
- Sales pipeline (lead → viewing → negotiation → closed)
- Document management (deeds, agreements, permits, inspection reports)
- Land registration integration
- Holding tax certificate tracking

### Bangladesh-Specific Requirements

**NBR (National Board of Revenue)**:
- VAT 15% standard rate (construction materials)
- VAT 5% reduced rate (some items)
- VAT 0% for exports and essential goods
- TDS withholding (5-10% based on vendor type, 1.5x for no TIN)
- AIT (Advance Income Tax) on imports/exports
- Mushak forms: 6.3 (Commercial Invoice), 6.7, 6.10

**Fiscal Calendar**:
- Fiscal year: July 1 - June 30 (NOT calendar year)
- Q1: Jul-Sep, Q2: Oct-Dec, Q3: Jan-Mar, Q4: Apr-Jun
- All financial reports use fiscal year

**Government Integration**:
- RAJUK (Rajdhani Unnayan Kartripakkha) approvals
- Land registration systems
- Construction permits
- TIN/BIN validation (13-digit format)

See **VEXTRUS-PATTERNS.md** sections 14 (Bangladesh Compliance), 16 (Construction), 17 (Real Estate) for complete patterns.

---

## Service Architecture

**18 NestJS Microservices** | GraphQL Federation v2 | PostgreSQL | EventStore

**Production (11)**:
- auth, master-data, notification, configuration, scheduler
- document-generator, import-export, file-storage, audit
- workflow, rules-engine

**In Progress (7)**:
- finance, crm, hr, project-management, scm, inventory, reporting

**Before Modifying Service**:
```bash
cat services/<name>/CLAUDE.md  # Service-specific patterns
```

**Architecture Patterns**:
- DDD (Domain-Driven Design)
- Event Sourcing + CQRS
- Multi-Tenancy (5-layer isolation)
- GraphQL Federation v2

See **VEXTRUS-PATTERNS.md** for complete technical patterns.

---

## Model Selection

| Task | Model | Why |
|------|-------|-----|
| **Main Implementation** | Sonnet 4.5 | Best quality (77% SWE-bench) |
| **Exploration** | Haiku 4.5 | 2x faster, 1/3 cost (73% SWE-bench) |
| **Parallel Agents** | Haiku 4.5 | 2-5x wall-clock speedup |
| **Quality Review** | Sonnet 4.5 | Highest accuracy |

**Strategy**: Sonnet 4.5 primary, Haiku 4.5 for exploration and parallel work.

---

## Context Optimization

### Current (Agent-First v2.0)

**Estimate** (44k/200k, 22%):
- System: 24.9k (12.5%)
- Agents: 5.8k (2.9%) - On-demand
- VEXTRUS-PATTERNS.md: ~6k (3%) - Load on-demand
- CLAUDE.md: ~2k (1%) - Always loaded
- Memory: 3.6k (1.8%)
- Service CLAUDE.md: ~1k (0.5%) - Per service
- **Free: 156k (78%)** ✅

**Improvement from v1.0**:
- Skills metadata: 1,700 tokens → 0 tokens (-100%)
- Sessions files: Archived (-128 files)
- Pattern docs: Distributed → Consolidated (VEXTRUS-PATTERNS.md)
- **Total gain: +21k tokens (+10.5% more free)**

### MCP Tools (On-Demand)

```
sequential-thinking  (default, reasoning)
@postgres           (database queries)
@docker             (container management)
@github             (issue/PR management)
```

**Enable only when needed** - don't load all MCPs at start.

---

## Quick Reference

| Need | Action |
|------|--------|
| **Technical patterns** | `VEXTRUS-PATTERNS.md` (17 sections) |
| **Agent decision tree** | `.claude/workflows/agent-decision-tree.md` |
| **Simple workflow** | `.claude/workflows/agent-first-simple.md` |
| **Medium workflow** | `.claude/workflows/agent-first-medium.md` |
| **Complex workflow** | `.claude/workflows/agent-first-complex.md` |
| **Checkpoint guide** | `.claude/workflows/checkpoint-driven.md` |
| **Git worktree** | `.claude/workflows/git-worktree-parallel.md` |
| **Service patterns** | `services/<name>/CLAUDE.md` |
| **Build** | `pnpm build` |
| **Test** | `npm test` |
| **Quality gates** | `/review /test /security-scan` |

---

## Commands

```bash
# Build and test
pnpm build              # Build all services
npm test                # Run all tests

# Quality gates
/review                 # Code review
/test                   # Run tests
/security-scan          # Security check

# Exploration (optional)
/explore services/[name]

# Configuration
export CLAUDE_CODE_MAX_OUTPUT_TOKENS=16384  # If output truncated
```

---

## Success Metrics

### Performance
- Agent success rate: **95%** (proven in production)
- Task completion time: **1-4 hours** (simple), **4-8 hours** (medium), **2-5 days** (complex)
- Context usage: **<40%** (156k/200k free)
- Parallel speedup: **2-5x** (git worktree)

### Quality
- Bug rate: **<0.3 per feature** (87% reduction from exploration-first)
- Test coverage: **90% target** (domain layer), 85% current overall
- Security gates: **100% pass** (no @Public())
- Bangladesh compliance: **100%** (VAT, TDS, Mushak, fiscal year)
- GraphQL Federation v2: **100%** compliant

### Project
- Completed tasks: **40+**
- Services production: **11/18** (61%)
- Services in progress: **7/18** (39%)
- Architecture: Agent-first v2.0 ✅

---

## Troubleshooting

**Agent output truncated?**
```bash
export CLAUDE_CODE_MAX_OUTPUT_TOKENS=16384
```

**Which agent to use?**
- Simple task: None (just implement)
- Medium task: pattern-recognition-specialist → kieran-typescript-reviewer
- Complex task: architecture-strategist → kieran-typescript-reviewer + 1-2 specialized

**Pattern not found?**
- Check **VEXTRUS-PATTERNS.md** (17 sections, 1,200 lines)
- Search by section: GraphQL, Event Sourcing, Multi-Tenancy, etc.

**Context bloat?**
- Enable MCPs on-demand only
- Load VEXTRUS-PATTERNS.md sections as needed (not entire file)
- Keep checkpoint files focused (300-600 lines max)

---

## Migration from v1.0 (Skills-First)

**What Changed**:
- 17 skills → 0 skills (archived to `.claude/skills-archive/`)
- Skills-first → Agent-first
- sessions/ directory → Archived to `sessions-archive/`
- Multiple pattern files → VEXTRUS-PATTERNS.md (single source)

**What Stayed**:
- 21 agents (proven working)
- Git workflow (commits, branches, worktrees)
- Quality gates (pnpm build, npm test)
- Service architecture (18 microservices)
- Bangladesh compliance requirements

**How to Use**:
1. Read CLAUDE.md (this file) for workflows
2. Reference VEXTRUS-PATTERNS.md for technical patterns
3. Use agents explicitly (not waiting for skill activation)
4. Follow checkpoint-driven development for complex tasks
5. Use git worktree for parallel work (when beneficial)

See **MIGRATION-GUIDE-v2.0.md** for complete migration details.

---

## Vision: Bangladesh Construction & Real Estate ERP

**Goal**: Build production-ready ERP for Bangladesh construction and real estate industries

**Challenges**:
- 18 microservices (DDD + Event Sourcing + CQRS + GraphQL Federation v2)
- Bangladesh compliance (NBR, RAJUK, fiscal year July-June)
- Multi-tenancy (5-layer isolation)
- Production-ready (90%+ coverage, <300ms response)
- Built by 1 developer + Claude Code

**How**:
1. **Agent-First Architecture** (95% success rate)
2. **Checkpoint-Driven Development** (9.5/10 quality, <5% rework)
3. **Complete File Reading** (87% bug reduction)
4. **Git Worktree** (2-5x parallelism)
5. **VEXTRUS-PATTERNS.md** (17 comprehensive patterns)
6. **Haiku + Sonnet** (optimal model selection)

> "Building partners in creation that help you achieve the impossible." — Boris Cherny, Anthropic

**Making the impossible possible through agent-first workflows.**

---

**Version**: 2.0 (Agent-First Architecture)
**Updated**: 2025-10-22
**Status**: Production Ready ✅

**See Also**:
- `VEXTRUS-PATTERNS.md` - 17 technical patterns (GraphQL, Event Sourcing, Multi-Tenancy, Bangladesh Compliance, Construction, Real Estate)
- `WORKFLOW-FAILURE-ANALYSIS-AND-REDESIGN.md` - Why we redesigned to agent-first
- `.claude/workflows/` - Workflow templates
- `services/*/CLAUDE.md` - Service-specific patterns
- `MIGRATION-GUIDE-v2.0.md` - Migration from v1.0

**Agent-First. Checkpoint-Driven. Production-Ready.**
