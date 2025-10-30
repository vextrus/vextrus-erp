# Vextrus ERP - V8.0 Enforcement Protocol

**System**: Bangladesh Construction & Real Estate ERP (18 microservices)
**Model**: Sonnet 4.5 (complex), Haiku 4.5 (explore)
**Context**: <50k baseline (25%), 150k available (75%)
**Workflow**: V8.0 Phase-Based Enforcement with Blocking Gates

---

# PART 1: ENFORCEMENT PROTOCOL

## MANDATORY Actions (ALWAYS Execute)

### 1. Tier Classification (MANDATORY - BLOCKING)

WHEN: User provides task
MUST: Answer classification questions BEFORE starting

**Classification Questions**:
```
Q1: How many files affected? [1-3 / 4-15 / 15+]
Q2: Cross-service integration? [YES / NO]
Q3: Estimated time? [<2h / 2-8h / 2-5d]

TIER ASSIGNMENT:
- TIER 1: 1-3 files, <2h, single service
- TIER 2: 4-15 files, 2-8h, single service OR moderate complexity
- TIER 3: 15+ files, 2-5d, cross-service OR high complexity

BLOCKING: Tier is LOCKED once assigned. Cannot self-select "this is simple."
```

---

### 2. Agent Usage (MANDATORY for Tier 2/3 - BLOCKING)

**Plan Subagent (MANDATORY - Tier 2/3)**:
```
MUST: Launch Plan subagent BEFORE implementation
HOW: Task tool with subagent_type="Plan"
BLOCKING: Cannot skip for Tier 2/3

VERIFICATION:
After Phase 1:
Q: "Did you launch Plan subagent? [YES/NO]"
IF NO → BLOCKING: "Must launch Plan subagent. Cannot proceed."
```

**Explore Subagent (MANDATORY - Tier 2/3)**:
```
MUST: Launch Explore subagent BEFORE implementation
HOW: Task tool with subagent_type="Explore"
BLOCKING: Cannot skip for Tier 2/3
BENEFIT: 0 main context cost (separate 200k window)

VERIFICATION:
After Phase 2:
Q: "Did you launch Explore subagent? [YES/NO]"
IF NO → BLOCKING: "Must launch Explore subagent. Cannot proceed."
```

---

### 3. Context Monitoring (MANDATORY after EVERY phase - BLOCKING)

**Auto-Monitor After EVERY Phase**:
```
MUST: Run /context after EVERY phase completion
MUST: Parse token count and percentage
MUST: Evaluate threshold
MUST: Take required action
MUST: Update .claude/context-log.md
MUST: Commit log update

THRESHOLDS:
- GREEN (<100k / 50%): Continue
- YELLOW (100-120k / 50-60%): Warning logged
- ORANGE (120-140k / 60-70%): FORCE checkpoint (MANDATORY)
- RED (≥140k / 70%): BLOCKING - new session required

BLOCKING IF:
- Context ≥140k AND attempting to continue
- Skipping context check after phase
- Not creating checkpoint at ORANGE (120-140k)
```

**Verification After EVERY Phase**:
```
Q1: "Did you run /context? [YES/NO]"
IF NO → BLOCKING: "Must run /context after EVERY phase."

Q2: "Current context? [Xk tokens / Y%]"
Parse actual number

Q3: "Threshold status? [GREEN/YELLOW/ORANGE/RED]"
IF ORANGE: Q4: "Did you create checkpoint? [YES/NO]"
  IF NO → BLOCKING: "Checkpoint MANDATORY at ORANGE."
IF RED → BLOCKING: "New session required. Stop immediately."
```

---

### 4. TODO Persistence (MANDATORY after EVERY phase - BLOCKING)

**Git-Tracked TODO**:
```
FILE: .claude/todo/current.md
MUST: Update after EVERY phase completion
MUST: Commit update (git commit -m "chore: sync TODO [phase]")
MUST: Verify file exists

BLOCKING IF:
- Skipping TODO update
- TODO not committed to git
- File doesn't exist after phase
```

**Verification After EVERY Phase**:
```
Q: "Did you update .claude/todo/current.md? [YES/NO]"
IF NO → BLOCKING: "Must update TODO after EVERY phase."

Q: "Did you commit TODO update? [YES/NO]"
IF NO → BLOCKING: "Must commit TODO to git."
```

---

### 5. Quality Gates (MANDATORY before EVERY commit - BLOCKING)

**Build Gate**:
```
MUST: Run pnpm build before EVERY commit
MUST: Verify 0 TypeScript errors
BLOCKING: Cannot commit with errors

NEVER:
- Skip build to "save time"
- Commit with TypeScript errors
- Work around errors without fixing
```

**Test Gate**:
```
MUST: Run npm test before EVERY commit
MUST: Verify all tests passing
BLOCKING: Cannot commit with failures

NEVER:
- Skip tests to "save time"
- Commit with failing tests
- Disable tests to make them pass
```

**Verification Before EVERY Commit**:
```
Q1: "Did pnpm build pass with 0 errors? [YES/NO]"
IF NO → BLOCKING: "Fix all TypeScript errors before committing."

Q2: "Did npm test pass with all tests passing? [YES/NO]"
IF NO → BLOCKING: "Fix all test failures before committing."
```

---

## NEVER Actions (ALWAYS Forbidden)

```
NEVER: Skip Plan subagent for Tier 2/3
NEVER: Skip Explore subagent for Tier 2/3
NEVER: Skip context monitoring after phase
NEVER: Continue when context RED (≥140k)
NEVER: Skip TODO update after phase
NEVER: Commit with TypeScript errors
NEVER: Commit with failing tests
NEVER: Self-select tier (tier is LOCKED after classification)
NEVER: Skip checkpoint at ORANGE (120-140k)
NEVER: Disable tests to make them pass
```

---

# PART 2: WORKFLOW STATE MACHINE

## State Transitions

```
START
  ↓
CLASSIFY TIER (MANDATORY - blocking questions)
  ↓
  ├─ TIER 1 → 4 phases (no agents required)
  ├─ TIER 2 → 6 phases (Plan + Explore MANDATORY)
  └─ TIER 3 → Multi-day (Plan + Explore MANDATORY)
  ↓
EXECUTE WORKFLOW (phase gates below)
  ↓
COMMIT (quality gates MANDATORY)
  ↓
END
```

---

## TIER 1: Simple Task (1-3 files, <2h)

**When**: Bug fixes, config changes, small enhancements

```
Phase 1: READ
- MUST: Read affected files (Read tool)
- Context check (MANDATORY)
- Update TODO (MANDATORY)

Phase 2: IMPLEMENT
- MUST: Write code
- MUST: Follow existing patterns
- Context check (MANDATORY)
- Update TODO (MANDATORY)

Phase 3: VALIDATE
- MUST: pnpm build (0 errors)
- MUST: npm test (all passing)
- BLOCKING: Cannot proceed if failures
- Context check (MANDATORY)
- Update TODO (MANDATORY)

Phase 4: COMMIT
- MUST: Quality gates passed
- MUST: git add . && git commit && git push
- Context check (MANDATORY)
- Update TODO (MANDATORY)

Total: <2h, <20k context
```

---

## TIER 2: Medium Task (4-15 files, 2-8h)

**When**: New features, API endpoints, service enhancements

```
Phase 1: PLAN (MANDATORY - BLOCKING)
- MUST: Launch Plan subagent (Task tool, subagent_type="Plan")
- MUST: Receive structured plan
- VERIFICATION: "Did you launch Plan subagent? [YES/NO]"
  IF NO → BLOCKING
- Context check (MANDATORY)
- Update TODO (MANDATORY)

Phase 2: EXPLORE (MANDATORY - BLOCKING)
- MUST: Launch Explore subagent (Task tool, subagent_type="Explore")
- MUST: Receive context summary
- VERIFICATION: "Did you launch Explore subagent? [YES/NO]"
  IF NO → BLOCKING
- Context check (MANDATORY)
- Update TODO (MANDATORY)

Phase 3: DESIGN (RECOMMENDED plugins)
- RECOMMENDED: Select ≥1 plugin:
  - /backend-development:feature-development
  - /database-migrations:sql-migrations
  - /api-scaffolding:graphql-architect
  - /tdd-workflows:tdd-cycle
- If no plugin: MUST justify why
- Context check (MANDATORY)
- Update TODO (MANDATORY)

Phase 4: IMPLEMENT
- MUST: Domain → Application → Presentation layers
- MUST: Write tests (unit + integration)
- MUST: Micro-commit after each sub-phase
- Quality gates after EACH sub-phase (MANDATORY):
  - pnpm build (0 errors)
  - npm test (all passing)
- Context check (MANDATORY)
- Update TODO (MANDATORY)

Phase 5: REVIEW (MANDATORY - BLOCKING)
- MUST: /comprehensive-review:full-review
- MUST: Score ≥8/10
- MUST: /backend-api-security:backend-security-coder
- MUST: 0 critical, 0 high vulnerabilities
- VERIFICATION: "Review score ≥8/10? [YES/NO]"
  IF NO → BLOCKING: "Fix issues and re-review"
- Context check (MANDATORY)
- Update TODO (MANDATORY)

Phase 6: FINALIZE
- MUST: Final quality gates pass
- MUST: git commit && git push
- OPTIONAL: /git-pr-workflows:pr-enhance
- Context check (MANDATORY)
- Update TODO (MANDATORY)

Total: 4-8h, <80k context
```

---

## TIER 3: Complex Task (15+ files, 2-5 days)

**When**: Cross-service features, new microservices, distributed systems

```
DAY 0: RESEARCH (4 hours)
Phase 1.1: EXPLORATION (MANDATORY - BLOCKING)
- MUST: Launch Explore subagent (all related services)
- MUST: Map dependencies
- Context check (MANDATORY)
- Update TODO (MANDATORY)

Phase 1.2: PLANNING (MANDATORY - BLOCKING)
- MUST: Launch Plan subagent (comprehensive plan)
- MUST: Break into daily phases
- Context check (MANDATORY)
- Update TODO (MANDATORY)

Phase 1.3: DESIGN (MANDATORY plugins)
- MUST: Select ≥1 specialized plugin
- Context check (MANDATORY)
- Update TODO (MANDATORY)

Phase 1.4: REVIEW PLAN
- MUST: Review with stakeholders if needed
- Context check (MANDATORY)
- Update TODO (MANDATORY)
- CHECKPOINT: End of Day 0

DAY 1-N: IMPLEMENTATION (Iterative)
Morning Session:
- MUST: Review previous day checkpoint
- MUST: Implement feature slice
- MUST: Quality gates after each slice
- Context check after EACH slice (MANDATORY)
- Update TODO after EACH slice (MANDATORY)

Afternoon Session:
- MUST: Continue implementation
- MUST: End-of-day checkpoint
- Context check (MANDATORY)
- Update TODO (MANDATORY)

FINAL DAY: QUALITY (4 hours)
- MUST: /comprehensive-review:full-review (score ≥8/10)
- MUST: /backend-api-security:backend-security-coder (0 critical)
- MUST: /application-performance:performance-engineer
- MUST: Documentation updated
- MUST: git commit && git push
- MUST: /git-pr-workflows:pr-enhance
- Context check (MANDATORY)
- Update TODO (MANDATORY)

Total: 2-5 days, <100k context per session
```

---

# PART 3: TODO & CHECKPOINT SYSTEM

## Git-Tracked TODO

**File**: `.claude/todo/current.md`

**Purpose**: Survive context compaction

**MANDATORY Operations**:
```
AFTER EVERY PHASE:
1. MUST: Update .claude/todo/current.md
2. MUST: git commit -m "chore: sync TODO [phase]"
3. MUST: Verify file exists
4. BLOCKING: Cannot proceed if TODO not synced
```

**Recovery**:
```
IF TODO lost from context:
1. Read .claude/todo/current.md from git
2. Resume from last completed phase
3. Check .claude/checkpoints/ for details
```

**Verification**:
```
Q: "Is TODO synced to git? [YES/NO]"
IF NO → BLOCKING: "Sync TODO to git before proceeding."
```

---

## Checkpoint System

**Directory**: `.claude/checkpoints/`

**Auto-Triggers** (MANDATORY):
```
1. At 120k context (60%) - ORANGE threshold
2. After EVERY phase completion
3. End of each day (Tier 3)
4. Before any risky operation
```

**Checkpoint Process**:
```
1. Create .claude/checkpoints/YYYY-MM-DD-HHMM-phase.md
2. Update .claude/todo/current.md
3. git commit -m "chore: checkpoint [phase]"
4. Verify files committed
```

**BLOCKING**:
```
IF context ORANGE (120-140k):
  BLOCKING: Must create checkpoint before continuing
  Cannot skip checkpoint at ORANGE
```

---

## Context Log

**File**: `.claude/context-log.md`

**MANDATORY Updates**:
```
AFTER EVERY PHASE:
1. Run /context
2. Log to .claude/context-log.md:
   | timestamp | phase | tokens | % | status | action | checkpoint |
3. git commit log update
```

---

# PART 4: QUICK REFERENCE

## Command Cheatsheet

| Action | Command |
|--------|---------|
| **MANDATORY: Plan** | Task tool (subagent_type="Plan") |
| **MANDATORY: Explore** | Task tool (subagent_type="Explore") |
| **MANDATORY: Context** | /context (after EVERY phase) |
| **MANDATORY: Build** | pnpm build (0 errors) |
| **MANDATORY: Test** | npm test (all passing) |
| **MANDATORY: Review** | /comprehensive-review:full-review (≥8/10) |
| **MANDATORY: Security** | /backend-api-security:backend-security-coder |
| Backend Feature | /backend-development:feature-development |
| TDD | /tdd-workflows:tdd-cycle |
| Tests | /unit-test-generator:generate-tests |
| Performance | /application-performance:performance-engineer |
| Database | /database-migrations:sql-migrations |
| PR | /git-pr-workflows:pr-enhance |

---

## Verification Checklist

**After EVERY Phase**:
```
[ ] Ran /context command?
[ ] Context status: GREEN/YELLOW/ORANGE/RED?
[ ] If ORANGE: Created checkpoint?
[ ] If RED: Stopped and started new session?
[ ] Updated .claude/todo/current.md?
[ ] Committed TODO update to git?
```

**Before EVERY Commit**:
```
[ ] pnpm build passed (0 errors)?
[ ] npm test passed (all passing)?
[ ] No TypeScript errors?
[ ] No failing tests?
```

**Tier 2/3 Only**:
```
[ ] Launched Plan subagent?
[ ] Launched Explore subagent?
[ ] Used ≥1 specialized plugin (or justified)?
[ ] Review score ≥8/10?
[ ] Security scan: 0 critical, 0 high?
```

---

## Context Thresholds

| Status | Range | Action |
|--------|-------|--------|
| GREEN | <100k (50%) | Continue |
| YELLOW | 100-120k (50-60%) | Warning logged |
| ORANGE | 120-140k (60-70%) | FORCE checkpoint |
| RED | ≥140k (70%) | BLOCKING - new session |

---

## Tier Selection Matrix

| Files | Time | Cross-Service | Tier |
|-------|------|---------------|------|
| 1-3 | <2h | No | 1 |
| 4-15 | 2-8h | No | 2 |
| 15+ | 2-5d | - | 3 |
| Any | Any | Yes | 3 |

---

# PART 5: DOMAIN PATTERNS

## Architecture Stack

DDD + Event Sourcing + CQRS + GraphQL Federation v2 + NestJS

**Quick References**:
- **Full Patterns**: `VEXTRUS-PATTERNS.md`
- **Bangladesh Compliance**: `.claude/skills/bangladesh-erp-compliance.md`
- **DDD Patterns**: `.claude/skills/ddd-event-sourcing.md`
- **GraphQL Federation**: `.claude/skills/graphql-federation-v2.md`
- **NestJS Patterns**: `.claude/skills/nestjs-microservices.md`

**Key Rules**:
```
Aggregates: Small, enforce invariants
Events: Past tense, immutable, versioned
Commands: Validate, idempotent
GraphQL: Always paginate, JwtAuthGuard + RbacGuard
VAT: 15% standard (Bangladesh)
TDS: 5% with TIN, 7.5% without
Fiscal Year: July 1 - June 30
```

---

## Resources

- **Plugins**: `.claude/plugin-command-reference.md` (54 plugins)
- **Skills**: `.claude/skills/` (auto-activated)
- **Templates**: `.claude/templates/`
- **TODO**: `.claude/todo/current.md` (git-tracked)
- **Checkpoints**: `.claude/checkpoints/`
- **Context Log**: `.claude/context-log.md`
- **V7.0 Archive**: `CLAUDE-V7.0-ARCHIVED.md` (reference only)

---

## Success Metrics

| Metric | Target | BLOCKING If |
|--------|--------|-------------|
| Context/session | <80k (40%) | ≥140k (70%) |
| Agent usage (Tier 2/3) | 100% | 0% (skipped) |
| TODO persistence | 100% | Lost/not synced |
| Quality gates | 100% | Errors/failures |
| Review score | ≥8/10 | <8/10 |
| Security | 0 critical | >0 critical |
| Test coverage | ≥90% | <85% |

---

## Enforcement Summary

**V8.0 Philosophy**: ENFORCE, don't suggest

**Key Changes from V7.0**:
- 99%+ MUST statements (vs 0.3% in V7.0)
- Blocking gates (vs no enforcement)
- Auto-context monitoring (vs manual checks)
- Git-persisted TODO (vs context memory)
- Verification questions (vs trust)

**Your Goal**: 9.5/10 quality, >90% coverage, <80k context, 100% compliance

---

**V8.0: Phase-Based Enforcement Protocol**
**Balanced | Enforced | Resilient | Context-Optimized**
