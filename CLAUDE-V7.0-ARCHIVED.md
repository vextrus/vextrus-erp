# Vextrus ERP - V7.0 Workflow Guide (ARCHIVED)

**⚠️ ARCHIVED: This is V7.0 which failed in production use**
**✅ CURRENT: See CLAUDE.md for V8.0 Enforcement Protocol**

---

**System**: Bangladesh Construction & Real Estate ERP (18 microservices)
**Model**: Sonnet 4.5 (planning/complex), Haiku 4.5 (exploration/execution)
**Context**: Target <50k baseline (25%), 150k free (75%)
**Workflow**: V7.0 Phase-Based Native Orchestration

## Why V7.0 Failed

**Root Causes**:
1. **Only 0.3% MUST statements** (3 of 920 lines) - Too permissive
2. **No verification gates** - Agent could skip agents/plugins
3. **No auto-context monitoring** - Context exploded 50k→140k in Day 1
4. **No TODO persistence** - TODO lost by Day 5 after compaction
5. **Skills wrong format** - Never activated (missing YAML frontmatter)
6. **Result**: 0% plugin usage, manual execution, workflow breakdown

**V8.0 Solution**: Enforcement protocol with blocking gates + auto-monitoring + git persistence

---

## FOR CLAUDE: Your Execution Guide

**This is YOUR primary workflow**. Follow these tier-based patterns for all tasks.

---

## Core Philosophy

1. **Balanced, Not Over-Engineered**: Simple tasks stay simple (4 phases), complex tasks get structure (12+ phases)
2. **Native CC First**: Leverage Plan/Explore subagents before plugins
3. **Phase-Based with Checkpoints**: Clear progress tracking, easy rollback
4. **No Single Point of Failure**: Distributed orchestration across subagents + plugins
5. **Context-Optimized**: <50k baseline, 150k available for work

---

## Workflow Tiers

### TIER 1: Simple Task (<2h, 1-3 files)

**When to use**: Bug fixes, small enhancements, adding fields, config changes

```
Phase 1: READ & ANALYZE (5 min)
- Read affected files directly (Read tool)
- Understand existing patterns

Phase 2: IMPLEMENT (30-90 min)
- Write code (Sonnet 4.5)
- Follow established patterns
- No planning phase needed

Phase 3: VALIDATE (10 min)
- pnpm build (MUST pass)
- npm test (MUST pass)
- Checkpoint: Quality gates passed

Phase 4: COMMIT (5 min)
- git add .
- git commit -m "type: description\n\n- changes\n\n🤖 Claude Code"
- git push

Plugins: 0
Checkpoints: 1
Context: <20k tokens
```

**Example**: Add validation rule, fix typo, update config

---

### TIER 2: Medium Task (2-8h, 4-15 files)

**When to use**: New features, service enhancements, API endpoints, moderate refactoring

```
Phase 1: PLAN (Plan subagent - 15 min)
- Launch Plan subagent (Sonnet 4.5)
- Task: "Plan implementation for [feature]"
- Output: Structured plan with phases, files, risks
- Checkpoint: Review plan before proceeding

Phase 2: EXPLORE (Explore subagent - 10 min)
- Launch Explore subagent (Haiku 4.5 - separate context)
- Analyze relevant services/modules
- Gather architectural patterns
- Identify dependencies
- Output: Concise context summary
- Checkpoint: Context gathered

Phase 3: DESIGN (Specialized plugins - 30 min)
Use as needed:
- /backend-development:feature-development (backend features)
- /database-migrations:sql-migrations (DB changes)
- /api-scaffolding:graphql-architect (GraphQL APIs)
- /tdd-workflows:tdd-cycle (if TDD approach)
- Checkpoint: Design decisions documented

Phase 4: IMPLEMENT (Sonnet 4.5 - 3-5 hours)
Sub-phases (commit after each):

  Phase 4.1: Domain Layer
  - Aggregates, Entities, Value Objects, Events
  - Checkpoint: pnpm build + npm test

  Phase 4.2: Application Layer
  - Commands, Queries, Handlers, Services
  - Checkpoint: pnpm build + npm test

  Phase 4.3: Presentation Layer
  - GraphQL resolvers, DTOs, Guards
  - Checkpoint: pnpm build + npm test

  Phase 4.4: Tests
  - Unit tests (90%+ coverage target)
  - Integration tests
  - Checkpoint: pnpm build + npm test (all passing)

Phase 5: REVIEW (Review plugins - 20 min)
- /comprehensive-review:full-review (multi-agent review)
- /backend-api-security:backend-security-coder (security scan)
- Target: Score >8/10, 0 critical security issues
- Checkpoint: Address critical/high issues if any

Phase 6: FINALIZE (10 min)
- Final pnpm build + npm test
- git add . && git commit && git push
- Optional: /git-pr-workflows:pr-enhance (PR creation)
- Checkpoint: Feature complete

Total: 4-8 hours
Plugins: 3-5
Checkpoints: 6-8
Context: <80k tokens
```

**Example**: New CRUD feature, GraphQL API endpoint, service enhancement

---

### TIER 3: Complex Task (2-5 days, 15+ files, cross-service)

**When to use**: Production modules, cross-service integration, distributed transactions, new microservices

```
═══════════════════════════════════════
DAY 0: RESEARCH & ARCHITECTURE (4 hours)
═══════════════════════════════════════

Phase 1.1: EXPLORATION (Explore subagent - 30 min)
- Launch Explore subagent (Haiku 4.5)
- Explore all related services
- Map dependencies and integration points
- Analyze existing patterns
- Output: Comprehensive context document
- Checkpoint: Context complete

Phase 1.2: ARCHITECTURE PLANNING (Plan subagent - 45 min)
- Launch Plan subagent (Sonnet 4.5)
- Input: Explore findings + requirements
- Create comprehensive implementation plan
- Break into daily phases
- Identify risks, dependencies, unknowns
- Output: Multi-day execution plan
- Checkpoint: Plan created

Phase 1.3: SPECIALIZED DESIGN (Plugins - 2 hours)
Use as needed:
- /backend-development:feature-development (backend architecture)
- /database-migrations:sql-migrations (DB schema design)
- /api-scaffolding:graphql-architect (GraphQL schema)
- /full-stack-orchestration:full-stack-feature (if full-stack)
- /cloud-infrastructure:cloud-architect (if infrastructure)
- Checkpoint: Architecture decisions documented

Phase 1.4: PLAN REVIEW (30 min)
- Review plan with stakeholders if needed
- Adjust based on feedback
- Finalize execution strategy
- Checkpoint: Approved plan ready

═══════════════════════════════════════
DAY 1-N: IMPLEMENTATION (Iterative)
═══════════════════════════════════════

Each Day Pattern:

Morning Session (3-4 hours):
  - Review previous day's work
  - Plan today's phase (which feature slice)

  Implementation Cycle:
    → Implement feature slice (domain → application → presentation)
    → Write tests (unit + integration)
    → Validate (pnpm build + npm test)
    → Checkpoint: Micro-commit (working feature slice)

  Tools:
    - Sonnet 4.5 (complex business logic)
    - /tdd-workflows:tdd-cycle (if TDD)
    - /unit-test-generator:generate-tests (test scaffolding)

Afternoon Session (3-4 hours):
  - Continue implementation
  - Address morning issues
  - Cross-service integration if needed
  - Checkpoint: End-of-day commit (all tests passing)

Evening:
  - Quick review of day's work
  - Plan tomorrow's phase
  - Checkpoint: Daily summary

═══════════════════════════════════════
FINAL DAY: QUALITY & RELEASE (4 hours)
═══════════════════════════════════════

Phase Final.1: COMPREHENSIVE REVIEW (1 hour)
- /comprehensive-review:full-review (all review agents)
- Target: Score >8/10
- Fix critical/high issues
- Checkpoint: Quality score achieved

Phase Final.2: SECURITY AUDIT (30 min)
- /backend-api-security:backend-security-coder
- /authentication-validator:validate-auth (if auth changes)
- Target: 0 critical, 0 high vulnerabilities
- Checkpoint: Security validated

Phase Final.3: PERFORMANCE VALIDATION (30 min)
- /application-performance:performance-engineer
- /database-design:sql-pro (if DB-heavy)
- Load testing for critical endpoints
- Target: Response times <500ms (p95)
- Checkpoint: Performance acceptable

Phase Final.4: DOCUMENTATION (1 hour)
- Update service README.md
- /documentation-generation:api-documenter (API docs)
- Create migration guide if breaking changes
- Update VEXTRUS-PATTERNS.md if new patterns
- Checkpoint: Documentation complete

Phase Final.5: PULL REQUEST (30 min)
- Final pnpm build + npm test (must pass)
- git add . && git commit && git push
- /git-pr-workflows:pr-enhance (comprehensive PR)
- Checkpoint: PR created, ready for review

Total: 2-5 days
Plugins: 8-12
Checkpoints: 15-25
Context: <100k per session (new session each day)
```

**Example**: New microservice, distributed transaction, cross-service feature, production module

---

[REST OF V7.0 CONTENT PRESERVED BUT MARKED AS ARCHIVED]

---

**V7.0 STATUS**: ARCHIVED - Failed in production
**REASON**: No enforcement, no monitoring, no persistence
**REPLACEMENT**: V8.0 Enforcement Protocol (see CLAUDE.md)
