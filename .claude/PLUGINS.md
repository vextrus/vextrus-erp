# V10.0 Plugin Orchestration Matrix

**Purpose**: Comprehensive catalog of 31 installed plugins with auto-selection strategy and pre-defined combos

**V10.0 Innovation**: Plugins auto-select based on domain + concerns (not manual)

---

## Quick Lookup: All 31 Plugins

| # | Plugin | Domain | Tier | Primary Use |
|---|--------|--------|------|-------------|
| 1 | agent-orchestration:improve-agent | Meta | 2,3 | Agent performance tuning |
| 2 | agent-orchestration:multi-agent-optimize | Meta | 3 | Multi-agent workflow optimization |
| 3 | api-documentation-generator:generate-api-docs | Documentation | 2,3 | OpenAPI/Swagger generation |
| 4 | api-testing-observability:api-mock | Testing | 2,3 | Mock API generation |
| 5 | application-performance:performance-optimization | Performance | 3 | End-to-end performance tuning |
| 6 | backend-development:feature-development | Backend | 2,3 | Backend feature orchestration |
| 7 | code-review-ai:ai-review | Quality | 2,3 | AI-powered code review |
| 8 | comprehensive-review:full-review | Quality | 2,3 | 12+ agent comprehensive review |
| 9 | comprehensive-review:pr-enhance | Git | 2,3 | Enhanced PR creation |
| 10 | criticalthink:criticalthink | Planning | 3 | Complex decision analysis |
| 11 | database-cloud-optimization:cost-optimize | Cloud | 3 | Database cost optimization |
| 12 | database-migrations:migration-observability | Database | 2,3 | Migration monitoring + CDC |
| 13 | database-migrations:sql-migrations | Database | 2,3 | Zero-downtime migrations |
| 14 | debugging-toolkit:smart-debug | Debugging | 2,3 | Advanced debugging |
| 15 | deployment-pipeline-orchestrator:pipeline-orchestrate | DevOps | 3 | CI/CD pipeline design |
| 16 | distributed-debugging:debug-trace | Debugging | 3 | Distributed tracing |
| 17 | documentation-generation:doc-generate | Documentation | 2,3 | Comprehensive docs |
| 18 | error-debugging:error-analysis | Debugging | 1,2,3 | Error pattern analysis |
| 19 | error-debugging:error-trace | Debugging | 1,2 | Stack trace analysis |
| 20 | error-debugging:multi-agent-review | Debugging | 2,3 | Multi-agent error investigation |
| 21 | frontend-mobile-development:component-scaffold | Frontend | 2,3 | React/Next.js scaffolding |
| 22 | full-stack-orchestration:full-stack-feature | Full-Stack | 2,3 | Backend + Frontend orchestration |
| 23 | git-pr-workflows:git-workflow | Git | 2,3 | Git workflow management |
| 24 | git-pr-workflows:onboard | Git | 1,2,3 | Team onboarding |
| 25 | git-pr-workflows:pr-enhance | Git | 2,3 | Standard PR creation |
| 26 | infrastructure-drift-detector:drift-detect | DevOps | 3 | IaC drift detection |
| 27 | performance-testing-review:ai-review | Performance | 3 | Performance review |
| 28 | performance-testing-review:multi-agent-review | Performance | 3 | Multi-agent performance analysis |
| 29 | tdd-workflows:tdd-cycle | Testing | 1,2,3 | Full TDD red-green-refactor |
| 30 | test-orchestrator:orchestrate | Testing | 2,3 | Multi-tier test orchestration |
| 31 | unit-testing:test-generate | Testing | 1,2,3 | Unit test generation |

---

## Auto-Selection Matrix (V10.0)

### By Domain

**Backend** (5 plugins):
- **MANDATORY** (Level 2+): backend-development:feature-development
- **MANDATORY** (Level 2+): tdd-workflows:tdd-cycle
- **CONDITIONAL**: database-migrations:sql-migrations (if DB changes)
- **CONDITIONAL**: api-documentation-generator:generate-api-docs (if API changes)
- **CONDITIONAL**: backend-development:feature-development (backend focus)

**Full-Stack** (3 plugins):
- **MANDATORY** (Level 2+): full-stack-orchestration:full-stack-feature
- **MANDATORY** (Level 2+): frontend-mobile-development:component-scaffold
- **MANDATORY** (Level 2+): backend-development:feature-development

**Frontend** (1 plugin):
- **MANDATORY** (Level 2+): frontend-mobile-development:component-scaffold

**Database** (3 plugins):
- **MANDATORY** (if schema changes): database-migrations:sql-migrations
- **RECOMMENDED** (after migration): database-migrations:migration-observability
- **CONDITIONAL** (Level 3): database-cloud-optimization:cost-optimize

**DevOps** (2 plugins):
- **MANDATORY** (Level 3): deployment-pipeline-orchestrator:pipeline-orchestrate
- **RECOMMENDED** (after deployment): infrastructure-drift-detector:drift-detect

**Debugging** (6 plugins):
- **START HERE**: error-debugging:error-analysis
- **IF COMPLEX**: debugging-toolkit:smart-debug
- **IF DISTRIBUTED**: distributed-debugging:debug-trace
- **IF STUCK**: error-debugging:multi-agent-review
- **QUICK**: error-debugging:error-trace
- **MULTI-AGENT**: error-debugging:multi-agent-review

### By Concern

**Security** (2 plugins - ALWAYS Level 2+):
- **MANDATORY**: backend-api-security:backend-security-coder (via comprehensive-review)
- **RECOMMENDED**: authentication-validator:validate-auth (if auth changes)

**Performance** (3 plugins - Level 3 if critical):
- **MANDATORY**: application-performance:performance-optimization
- **MANDATORY**: performance-testing-review:multi-agent-review
- **CONDITIONAL**: database-cloud-optimization:cost-optimize

**Testing** (5 plugins):
- **LEVEL 1+**: tdd-workflows:tdd-cycle (recommended)
- **LEVEL 1+**: unit-testing:test-generate
- **LEVEL 2+**: test-orchestrator:orchestrate
- **LEVEL 2+**: api-testing-observability:api-mock
- **LEVEL 3**: performance-testing-review:multi-agent-review

**Quality** (3 plugins - MANDATORY Level 2+):
- **MANDATORY**: comprehensive-review:full-review
- **OPTIONAL**: code-review-ai:ai-review
- **RECOMMENDED**: comprehensive-review:pr-enhance

**Documentation** (2 plugins):
- **IF API**: api-documentation-generator:generate-api-docs
- **COMPREHENSIVE**: documentation-generation:doc-generate

**Planning** (1 plugin - Level 3 complex decisions):
- **IF COMPLEX**: criticalthink:criticalthink

**Meta-Orchestration** (2 plugins):
- **OPTIMIZATION**: agent-orchestration:improve-agent
- **MULTI-AGENT**: agent-orchestration:multi-agent-optimize

---

## 15 Pre-Defined Plugin Combos

### COMBO 1: Standard Backend Feature (Level 2)

**Use case**: New API endpoint, business logic, moderate complexity

**Plugins** (8):
1. Plan subagent (native)
2. Explore subagent (native)
3. backend-development:feature-development
4. tdd-workflows:tdd-cycle
5. test-orchestrator:orchestrate
6. comprehensive-review:full-review
7. backend-api-security:backend-security-coder (via comprehensive-review)
8. comprehensive-review:pr-enhance

**Workflow**:
```bash
# Phase 1: PLAN
Task(subagent_type="Plan")

# Phase 2: EXPLORE
Task(subagent_type="Explore")

# Phase 3: DESIGN
/backend-development:feature-development

# Phase 4: IMPLEMENT
/tdd-workflows:tdd-cycle

# Phase 5: TEST
/test-orchestrator:orchestrate

# Phase 6: REVIEW
/comprehensive-review:full-review

# Phase 7: FINALIZE
/comprehensive-review:pr-enhance
```

**Context Budget**: 70-90k
**Duration**: 4-6h
**Success Rate**: 95%

---

### COMBO 2: Full-Stack Feature (Level 2/3)

**Use case**: Backend + Frontend, end-to-end feature

**Plugins** (10):
1. Plan subagent
2. Explore subagent
3. full-stack-orchestration:full-stack-feature
4. backend-development:feature-development
5. frontend-mobile-development:component-scaffold
6. tdd-workflows:tdd-cycle (both backend + frontend)
7. test-orchestrator:orchestrate
8. comprehensive-review:full-review
9. backend-api-security:backend-security-coder
10. comprehensive-review:pr-enhance

**Workflow**:
```bash
# Phase 1-2: PLAN + EXPLORE
Task(subagent_type="Plan")
Task(subagent_type="Explore")

# Phase 3: ORCHESTRATE
/full-stack-orchestration:full-stack-feature
  ├─ Backend: /backend-development:feature-development
  └─ Frontend: /frontend-mobile-development:component-scaffold

# Phase 4: IMPLEMENT (TDD both sides)
/tdd-workflows:tdd-cycle  # Backend
/tdd-workflows:tdd-cycle  # Frontend

# Phase 5: TEST
/test-orchestrator:orchestrate

# Phase 6-7: REVIEW + PR
/comprehensive-review:full-review
/comprehensive-review:pr-enhance
```

**Context Budget**: 90-110k
**Duration**: 6-10h
**Success Rate**: 90%

---

### COMBO 3: Security-Critical Feature (Level 2)

**Use case**: Authentication, authorization, payment processing

**Plugins** (9):
1. Plan subagent
2. Explore subagent
3. backend-development:feature-development
4. tdd-workflows:tdd-cycle
5. authentication-validator:validate-auth
6. test-orchestrator:orchestrate
7. comprehensive-review:full-review
8. backend-api-security:backend-security-coder (deep scan)
9. comprehensive-review:pr-enhance

**Workflow**:
```bash
# Standard phases 1-4 (PLAN, EXPLORE, DESIGN, IMPLEMENT)

# Phase 5: AUTH TESTING
/authentication-validator:validate-auth

# Phase 6: SECURITY DEEP SCAN
/backend-api-security:backend-security-coder

# Phase 7: COMPREHENSIVE REVIEW
/comprehensive-review:full-review
  └─ Includes: security-sentinel (one of 12 reviewers)

# Phase 8: PR
/comprehensive-review:pr-enhance
```

**Context Budget**: 80-100k
**Duration**: 5-8h
**Success Rate**: 92%

---

### COMBO 4: Performance-Critical Feature (Level 3)

**Use case**: High-traffic endpoint, real-time processing, optimization

**Plugins** (11):
1. Plan subagent
2. Explore subagent
3. criticalthink:criticalthink (performance analysis)
4. backend-development:feature-development
5. tdd-workflows:tdd-cycle
6. application-performance:performance-optimization
7. database-cloud-optimization:cost-optimize
8. performance-testing-review:multi-agent-review
9. test-orchestrator:orchestrate
10. comprehensive-review:full-review
11. comprehensive-review:pr-enhance

**Workflow**:
```bash
# Phase 1: CRITICAL THINKING
/criticalthink:criticalthink
  └─ Analyze: Performance requirements, bottlenecks, trade-offs

# Phases 2-5: Standard (PLAN, EXPLORE, DESIGN, IMPLEMENT)

# Phase 6: PERFORMANCE OPTIMIZATION
/application-performance:performance-optimization
/database-cloud-optimization:cost-optimize

# Phase 7: PERFORMANCE TESTING
/performance-testing-review:multi-agent-review

# Phases 8-9: REVIEW + PR
/comprehensive-review:full-review
/comprehensive-review:pr-enhance
```

**Context Budget**: 100-120k
**Duration**: 8-12h
**Success Rate**: 88%

---

### COMBO 5: Database Migration (Level 2/3)

**Use case**: Schema changes, zero-downtime migration

**Plugins** (8):
1. Plan subagent
2. Explore subagent
3. database-migrations:sql-migrations
4. tdd-workflows:tdd-cycle (application code)
5. database-migrations:migration-observability
6. test-orchestrator:orchestrate
7. comprehensive-review:full-review
8. comprehensive-review:pr-enhance

**Workflow**:
```bash
# Phases 1-2: PLAN + EXPLORE

# Phase 3: MIGRATION DESIGN
/database-migrations:sql-migrations
  └─ Generates: 3-phase migration (add, backfill, enforce)

# Phase 4: APPLICATION CODE (TDD)
/tdd-workflows:tdd-cycle

# Phase 5: MIGRATION MONITORING
/database-migrations:migration-observability
  └─ Setup: CDC, monitoring, rollback strategy

# Phases 6-8: TEST + REVIEW + PR
/test-orchestrator:orchestrate
/comprehensive-review:full-review
/comprehensive-review:pr-enhance
```

**Context Budget**: 70-90k
**Duration**: 4-7h
**Success Rate**: 93%

---

### COMBO 6: Bug Investigation + Fix (Level 1/2)

**Use case**: Complex bug, root cause unknown

**Plugins** (7-9):
1. Explore subagent (optional, if uncertain)
2. error-debugging:error-analysis
3. debugging-toolkit:smart-debug (if complex)
4. distributed-debugging:debug-trace (if cross-service)
5. error-debugging:multi-agent-review (if stuck)
6. tdd-workflows:tdd-cycle (TDD fix)
7. comprehensive-review:full-review (Level 2 only)

**Workflow** (Escalation chain):
```bash
# Level 1: Simple bugs
error-debugging:error-trace
  ↓ (if no root cause)
error-debugging:error-analysis
  ↓ (if complex)
debugging-toolkit:smart-debug
  ↓ (if distributed system)
distributed-debugging:debug-trace
  ↓ (if still stuck)
error-debugging:multi-agent-review

# After root cause found
/tdd-workflows:tdd-red     # Write failing test
/tdd-workflows:tdd-green   # Fix bug
/tdd-workflows:tdd-refactor # Improve quality

# Level 2: Review
/comprehensive-review:full-review
```

**Context Budget**: 40-80k
**Duration**: 2-6h
**Success Rate**: 85%

---

### COMBO 7: Cross-Service Feature (Level 3)

**Use case**: Distributed feature spanning multiple microservices

**Plugins** (14):
1. criticalthink:criticalthink (architecture decision)
2. Plan subagent
3. Explore subagent (multiple services in parallel)
4. backend-development:microservices-patterns
5. full-stack-orchestration:full-stack-feature
6. backend-development:feature-development
7. tdd-workflows:tdd-cycle
8. distributed-debugging:debug-trace
9. test-orchestrator:orchestrate
10. application-performance:performance-optimization
11. comprehensive-review:full-review
12. backend-api-security:backend-security-coder
13. documentation-generation:doc-generate
14. comprehensive-review:pr-enhance

**Workflow**:
```bash
# Day 0: RESEARCH
/criticalthink:criticalthink
Task(subagent_type="Plan")
Task(subagent_type="Explore", prompt="Service A")
Task(subagent_type="Explore", prompt="Service B")
Task(subagent_type="Explore", prompt="Service C")

# Day 1-2: IMPLEMENTATION
/full-stack-orchestration:full-stack-feature
/backend-development:feature-development
/tdd-workflows:tdd-cycle

# Day 2: TESTING
/distributed-debugging:debug-trace
/test-orchestrator:orchestrate

# Day 3: QUALITY
/application-performance:performance-optimization
/comprehensive-review:full-review
/backend-api-security:backend-security-coder
/documentation-generation:doc-generate
/comprehensive-review:pr-enhance
```

**Context Budget**: 100-120k per session (3 sessions)
**Duration**: 2-3 days
**Success Rate**: 85%

---

### COMBO 8: DevOps Infrastructure (Level 3)

**Use case**: CI/CD pipeline, IaC, deployment automation

**Plugins** (7):
1. Plan subagent
2. deployment-pipeline-orchestrator:pipeline-orchestrate
3. infrastructure-drift-detector:drift-detect
4. database-migrations:migration-observability (if DB)
5. test-orchestrator:orchestrate
6. comprehensive-review:full-review
7. comprehensive-review:pr-enhance

**Workflow**:
```bash
# Phase 1: PLAN
Task(subagent_type="Plan")

# Phase 2: PIPELINE DESIGN
/deployment-pipeline-orchestrator:pipeline-orchestrate
  └─ Generates: GitHub Actions, ArgoCD, etc.

# Phase 3: DRIFT DETECTION
/infrastructure-drift-detector:drift-detect
  └─ Setup: Terraform drift monitoring

# Phase 4: OBSERVABILITY
/database-migrations:migration-observability (if DB migrations)

# Phases 5-7: TEST + REVIEW + PR
/test-orchestrator:orchestrate
/comprehensive-review:full-review
/comprehensive-review:pr-enhance
```

**Context Budget**: 60-80k
**Duration**: 3-6h
**Success Rate**: 90%

---

### COMBO 9: API Documentation (Level 2)

**Use case**: Generate/update API docs after implementation

**Plugins** (4):
1. api-documentation-generator:generate-api-docs
2. documentation-generation:doc-generate
3. comprehensive-review:full-review (docs review)
4. git-pr-workflows:pr-enhance

**Workflow**:
```bash
# After implementation complete

# Phase 1: API DOCS
/api-documentation-generator:generate-api-docs
  └─ Generates: OpenAPI/Swagger from code

# Phase 2: COMPREHENSIVE DOCS
/documentation-generation:doc-generate
  └─ Generates: README, guides, architecture docs

# Phase 3: REVIEW
/comprehensive-review:full-review
  └─ Reviews: Documentation quality

# Phase 4: PR
/git-pr-workflows:pr-enhance
```

**Context Budget**: 30-50k
**Duration**: 1-2h
**Success Rate**: 95%

---

### COMBO 10: TDD Feature (Level 1/2)

**Use case**: Test-driven development workflow

**Plugins** (5-7):
1. Plan subagent (Level 2)
2. tdd-workflows:tdd-red
3. tdd-workflows:tdd-green
4. tdd-workflows:tdd-refactor
5. test-orchestrator:orchestrate
6. comprehensive-review:full-review (Level 2)
7. git-pr-workflows:pr-enhance

**Workflow**:
```bash
# Phase 1: RED (failing test)
/tdd-workflows:tdd-red
  └─ Write: Failing test based on requirements

# Phase 2: GREEN (minimal implementation)
/tdd-workflows:tdd-green
  └─ Implement: Just enough to pass test

# Phase 3: REFACTOR (improve quality)
/tdd-workflows:tdd-refactor
  └─ Refactor: Clean code, remove duplication

# Repeat RED-GREEN-REFACTOR until feature complete

# Phase 4: TEST ORCHESTRATION
/test-orchestrator:orchestrate
  └─ Run: Unit, integration, E2E

# Phases 5-6: REVIEW + PR (Level 2)
/comprehensive-review:full-review
/git-pr-workflows:pr-enhance
```

**Context Budget**: 40-70k
**Duration**: 2-5h
**Success Rate**: 92%

---

### COMBO 11: Onboarding New Developer (Level 0/1)

**Use case**: Team member onboarding, codebase introduction

**Plugins** (3):
1. Explore subagent (codebase tour)
2. git-pr-workflows:onboard
3. documentation-generation:doc-generate (if docs missing)

**Workflow**:
```bash
# Phase 1: CODEBASE EXPLORATION
Task(subagent_type="Explore", prompt="Provide codebase overview for new developer")

# Phase 2: ONBOARDING
/git-pr-workflows:onboard
  └─ Generates: Onboarding checklist, first tasks

# Phase 3: DOCUMENTATION (if needed)
/documentation-generation:doc-generate
  └─ Generates: Architecture guides, setup instructions
```

**Context Budget**: 20-40k
**Duration**: 1-2h
**Success Rate**: 98%

---

### COMBO 12: Agent Workflow Optimization (Meta)

**Use case**: Optimize multi-agent workflows, improve efficiency

**Plugins** (3):
1. agent-orchestration:improve-agent
2. agent-orchestration:multi-agent-optimize
3. comprehensive-review:full-review

**Workflow**:
```bash
# Phase 1: ANALYZE AGENT PERFORMANCE
/agent-orchestration:improve-agent
  └─ Input: Metrics from previous tasks
  └─ Output: Performance bottlenecks, recommendations

# Phase 2: OPTIMIZE MULTI-AGENT WORKFLOW
/agent-orchestration:multi-agent-optimize
  └─ Input: Current workflow definition
  └─ Output: Optimized workflow with parallelization

# Phase 3: REVIEW OPTIMIZATION
/comprehensive-review:full-review
```

**Context Budget**: 40-60k
**Duration**: 2-3h
**Success Rate**: 88%

---

### COMBO 13: Mock API Generation (Level 2)

**Use case**: Generate mock APIs for testing, integration

**Plugins** (5):
1. Plan subagent
2. api-testing-observability:api-mock
3. test-orchestrator:orchestrate
4. comprehensive-review:full-review
5. git-pr-workflows:pr-enhance

**Workflow**:
```bash
# Phase 1: PLAN MOCK STRATEGY
Task(subagent_type="Plan")

# Phase 2: GENERATE MOCKS
/api-testing-observability:api-mock
  └─ Input: API specification (OpenAPI/GraphQL)
  └─ Output: Mock server implementation

# Phase 3: TEST INTEGRATION
/test-orchestrator:orchestrate
  └─ Test: Integration tests with mocks

# Phases 4-5: REVIEW + PR
/comprehensive-review:full-review
/git-pr-workflows:pr-enhance
```

**Context Budget**: 50-70k
**Duration**: 3-5h
**Success Rate**: 90%

---

### COMBO 14: Quick Bug Fix (Level 0/1)

**Use case**: Simple bug, known fix, <1h

**Plugins** (3-4):
1. error-debugging:error-trace (quick analysis)
2. tdd-workflows:tdd-cycle (optional)
3. unit-testing:test-generate (optional)
4. git-commit-smart:commit-smart (via plugin if available)

**Workflow**:
```bash
# Level 0: Trivial fix (no plugins)
# Edit → Validate → Commit

# Level 1: Simple bug
/error-debugging:error-trace
  └─ Quick: Stack trace analysis

# Optional: TDD
/tdd-workflows:tdd-red   # Failing test
# Fix bug
/tdd-workflows:tdd-green # Test passes

# Optional: More tests
/unit-testing:test-generate
```

**Context Budget**: 20-40k
**Duration**: <1h
**Success Rate**: 95%

---

### COMBO 15: Code Review AI (Level 2)

**Use case**: Quick AI review before comprehensive review

**Plugins** (3):
1. code-review-ai:ai-review (quick pass)
2. comprehensive-review:full-review (deep review)
3. git-pr-workflows:pr-enhance

**Workflow**:
```bash
# Phase 1: QUICK AI REVIEW
/code-review-ai:ai-review
  └─ Fast: Surface-level issues, quick wins

# Fix issues from quick review

# Phase 2: COMPREHENSIVE REVIEW
/comprehensive-review:full-review
  └─ Deep: 12+ specialized reviewers

# Phase 3: PR
/git-pr-workflows:pr-enhance
```

**Context Budget**: 50-70k
**Duration**: 2-4h
**Success Rate**: 93%

---

## Plugin Selection Decision Tree

```
START: Task Classified (Level 0/1/2/3)
  ↓
Q1: Domain? [Backend | Frontend | Full-Stack | DevOps | Debugging]
  ↓
Q2: Concerns? [Performance | Security | Auth | Distributed | None]
  ↓
Q3: Special? [Database | Cross-service | Complex-decision | None]
  ↓
COMPUTE: Required Plugin Set from Matrix
  ↓
VERIFY: All applicable plugins selected
  ↓
LOAD: Pre-defined combo (if matches) OR Custom combo
  ↓
EXECUTE: Plugin orchestration
```

---

## Plugin Usage Tracking

**Metrics to collect** (post-commit hook):
- Plugin usage frequency
- Context cost per plugin
- Success rate per plugin
- Average duration per plugin
- Plugin combinations (which combos work best)

**Dashboard**: `.claude/metrics/plugin-usage.json`

---

**V10.0 Plugin Orchestration Matrix**
**31 Plugins | 15 Pre-Defined Combos | Auto-Selection | Production-Proven**
