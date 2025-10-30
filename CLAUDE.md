# Vextrus ERP - V7.0 Workflow Guide

**System**: Bangladesh Construction & Real Estate ERP (18 microservices)
**Model**: Sonnet 4.5 (planning/complex), Haiku 4.5 (exploration/execution)
**Context**: Target <50k baseline (25%), 150k free (75%)
**Workflow**: V7.0 Phase-Based Native Orchestration

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

## Native CC Features (Use Before Plugins)

### Plan Subagent (Sonnet 4.5)

**When to use**:
- Medium/complex tasks before implementation
- Breaking down large features into phases
- Risk assessment and dependency mapping

**How to use**:
```
Launch Task tool with subagent_type="Plan"
Provide: Task description, requirements, constraints
Output: Structured implementation plan with phases
Context: Separate from main (saves main context)
```

**Best practices**:
- Always use for Tier 2/3 tasks
- Review plan before proceeding
- Adjust plan based on findings during exploration
- Can resume plan subagent if interrupted

---

### Explore Subagent (Haiku 4.5)

**When to use**:
- Codebase analysis (0 main context cost!)
- Pattern detection across services
- Dependency mapping
- Understanding existing architecture

**How to use**:
```
Launch Task tool with subagent_type="Explore"
Provide: Service/module to explore, what to find
Output: Comprehensive context summary
Context: Separate 200k window (2x faster, 1/3 cost)
```

**Best practices**:
- Use for ALL Tier 2/3 tasks before implementing
- Explore before planning (informs better plans)
- Can explore multiple services in parallel
- Saves 15-20k main context tokens per exploration

---

### Dynamic Model Selection

**Sonnet 4.5**:
- Complex business logic
- Architecture decisions
- Planning phases
- Code review and quality checks

**Haiku 4.5**:
- Codebase exploration
- Pattern detection
- Test execution
- Simple implementations

**Auto-selection**: CC automatically uses Haiku in execution after Sonnet planning (SonnetPlan mode)

---

## Plugin Usage Matrix

### Tier 1 Plugins (Always Use - Core Workflow)

**Backend Development**:
- `/backend-development:feature-development` - Backend feature orchestration
- `/tdd-workflows:tdd-cycle` - TDD red-green-refactor
- `/unit-test-generator:generate-tests` - Test scaffolding

**Quality & Security**:
- `/comprehensive-review:full-review` - Multi-agent code review (12+ agents)
- `/backend-api-security:backend-security-coder` - Security audit

**Database**:
- `/database-migrations:sql-migrations` - Zero-downtime migrations
- `/database-design:sql-pro` - Query optimization

**Git**:
- `/git-pr-workflows:pr-enhance` - Enhanced PR creation

---

### Tier 2 Plugins (Situational - As Needed)

**Performance**:
- `/application-performance:performance-engineer` - Performance optimization
- `/performance-testing-review:performance-engineer` - Load testing

**API Design**:
- `/api-scaffolding:graphql-architect` - GraphQL Federation v2
- `/api-scaffolding:fastapi-pro` - FastAPI design
- `/api-documentation-generator:generate-api-docs` - OpenAPI/Swagger

**Security & Auth**:
- `/authentication-validator:validate-auth` - Auth testing
- `/comprehensive-review:security-auditor` - Security audit

**Debugging**:
- `/error-debugging:error-detective` - Error investigation
- `/debugging-toolkit:smart-debug` - Advanced debugging

**Infrastructure**:
- `/deployment-pipeline-orchestrator:pipeline-orchestrate` - CI/CD
- `/cloud-infrastructure:cloud-architect` - Cloud architecture
- `/observability-monitoring:observability-engineer` - Monitoring

---

### Tier 3 Plugins (Specialized - Domain Specific)

**Full-Stack**:
- `/full-stack-orchestration:full-stack-feature` - Full-stack features
- `/frontend-mobile-development:frontend-developer` - Frontend

**Documentation**:
- `/documentation-generation:api-documenter` - API documentation
- `/documentation-generation:tutorial-engineer` - Tutorials

**Testing**:
- `/test-orchestrator:orchestrate` - Complex test workflows
- `/unit-testing:test-generate` - Unit test generation

**Infrastructure**:
- `/docker-compose-generator:docker-compose` - Docker configs
- `/infrastructure-drift-detector:drift-detect` - Drift detection

---

## Skills (Domain Knowledge Injection)

### Available Skills

**1. bangladesh-erp-compliance**
- VAT calculation (15%/7.5%/0%)
- TDS/AIT withholding (5%/7.5%/10%)
- Mushak 6.3 generation
- Fiscal year (July-June)

**2. ddd-event-sourcing**
- Aggregate patterns (small, enforce invariants)
- Event naming (past tense, immutable, versioned)
- Command/Query separation
- Repository patterns (event-sourced)

**3. graphql-federation-v2**
- @key directive usage
- Reference resolver patterns
- Pagination (always paginate lists)
- Guards (JwtAuthGuard + RbacGuard)

**4. nestjs-microservices**
- Module organization
- Dependency injection patterns
- CQRS implementation
- Multi-tenancy patterns

### How to Use Skills

Skills are automatically activated when relevant to your task. They provide:
- Instant domain patterns
- Compliance rules
- Architectural guidelines
- Best practices

Reference: `.claude/skills/` directory for skill definitions

---

## Quality Gates (Mandatory)

### Before Every Commit

```bash
pnpm build  # MUST: 0 TypeScript errors
npm test    # MUST: all tests passing
```

**Never commit with**:
- TypeScript errors
- Failing tests
- Lint errors

---

### Before Every PR

```bash
pnpm build                              # Pass: 0 errors
npm test                                # Pass: all passing
/comprehensive-review:full-review       # Score: >8/10
/backend-api-security:backend-security-coder  # 0 critical vulnerabilities
Coverage check                          # >85% (90% target)
```

---

## Git Workflow (No Worktrees)

### Standard Branch-Based Workflow

**Branch Creation**:
```bash
git checkout -b feature/task-name
git checkout -b fix/bug-description
git checkout -b refactor/component-name
```

**Micro-Commits (Recommended)**:
```bash
After each phase completion:
  git add .
  git commit -m "phase: description"

Benefits:
- Granular rollback points
- Clear progress tracking
- CI/CD friendly
- No worktree overhead
```

**Commit Message Convention**:
```
type(scope): description

- Change 1
- Change 2
- Change 3

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>

Types: feat, fix, refactor, test, docs, chore, perf
Scopes: Optional (service name or component)
```

**Push & PR**:
```bash
git push origin feature/task-name
/git-pr-workflows:pr-enhance  # Creates comprehensive PR
```

---

## Checkpoint Strategy

### Manual Checkpoints (User-Initiated)

Press **Esc-Esc** to create checkpoint:
- After each major phase
- Before risky operations (refactoring, migrations)
- End of each session (if multi-day task)

### Automated Checkpoints (System)

- After each `pnpm build + npm test` pass
- Git commits (micro-commits = micro-checkpoints)
- End of each phase in Tier 2/3 workflows

### Checkpoint Recovery

If issue detected:
```
1. Identify last good checkpoint
2. Revert to checkpoint (git reset if needed)
3. Analyze what went wrong
4. Adjust approach
5. Resume from checkpoint
```

---

## Context Management

### Target Context Allocation

**Baseline: <50k tokens (25%)**
- System prompt: 2.9k (1.4%)
- System tools: 27.9k (13.9%)
- Custom agents (essential): 5k (2.5%)
- Memory (CLAUDE.md): 3k (1.5%)
- Message buffer: 10k (5%)
- **Total**: ~49k (24.5%)

**Available for work: 150k tokens (75%)**

### Context Optimization Tactics

**1. MCP On-Demand with @ Syntax**:
```
Default: sequential-thinking + postgres - balanced core
Enable as needed: @filesystem, @github, @docker, @playwright, @brave-search, etc.
Total MCP if all 17 enabled: 35-40k (18-20%)
Context saved with balanced: 30-35k (15-17%)

Usage:
- Type @servername to toggle any MCP server on/off
- Examples: @github, @docker, @playwright
- See .mcp.README.md for complete server list
```

**2. Subagent Offloading**:
```
Explore subagent: Separate 200k context (0 main context cost)
Plan subagent: Separate context (0 main context cost)
Strategy: Offload research/planning to subagents
Savings: 15-30k per task
```

**3. Read Selectively**:
```
Use Explore subagent: Codebase analysis (0 main context)
Use Read tool: Only specific files needed (<5 files)
Don't: Read entire services
Savings: 20-40k per session
```

**4. Plugin Separate Context**:
```
Plugins run in separate contexts
Main context only receives final outputs
Savings: Varies by plugin
```

### Context Monitoring

**Thresholds**:
- **Green**: <100k (50%) - Optimal
- **Yellow**: 100-140k (50-70%) - Warning
- **Red**: >140k (70%) - Action needed

**Actions**:
```
If Yellow:
  - Finish current phase
  - Create checkpoint
  - Consider session break

If Red:
  - Complete current implementation
  - Create comprehensive checkpoint
  - Start new session
  - Resume from checkpoint
```

**Check context**: `/context` command

---

## Bangladesh Compliance (Reference)

### VAT Rates

- **Standard**: 15% (construction, most services)
- **Reduced**: 7.5% (specific goods/services)
- **Zero-rated**: 0% (exports, specific sectors)

### TDS/AIT Withholding

- **With TIN**: 5%
- **Without TIN**: 7.5%
- **Professionals**: 10% (consultants, contractors)

### Mushak 6.3 (VAT Challan)

**Requirements**:
- Auto-generate on invoice approval
- Include: TIN/BIN, VAT breakdown, QR code
- **Fiscal Year**: July 1 - June 30 (NOT calendar year)
- Submission: Within 15 days of month-end

**Reference**: `VEXTRUS-PATTERNS.md` sections 11-13 for detailed rules

---

## Architecture Patterns (Quick Reference)

**Stack**: DDD + Event Sourcing + CQRS + GraphQL Federation v2

### Domain-Driven Design

**Aggregates**:
- Small, enforce invariants
- Factory methods for creation
- Location: `services/*/src/domain/aggregates/`

**Events**:
- Past tense naming (e.g., `InvoiceCreated`, `PaymentReceived`)
- Immutable
- Versioned (handle schema evolution)

**Commands**:
- Validation before execution
- Business logic enforcement
- Idempotent

### GraphQL Federation v2

**Entity Definition**:
```graphql
type Invoice @key(fields: "id") {
  id: ID!
  # fields
}
```

**Query Patterns**:
- Always paginate lists
- Use connection pattern
- Return nullable for flexibility

**Guards**:
- Always use: `JwtAuthGuard` + `RbacGuard`
- Permission checks in resolver

**Reference**: `VEXTRUS-PATTERNS.md` for full patterns

---

## Common Task Patterns

### Pattern 1: New Backend Feature (Medium)

```
1. Plan subagent: Feature breakdown
2. Explore subagent: Analyze related services
3. /backend-development:feature-development: Design
4. Implement (Tier 2 workflow):
   - Domain layer (aggregates, events)
   - Application layer (commands, queries)
   - Presentation layer (GraphQL resolvers)
   - Tests (unit + integration)
5. /comprehensive-review:full-review
6. Commit & PR
```

---

### Pattern 2: Database Migration (Medium)

```
1. Plan subagent: Migration strategy
2. Explore subagent: Analyze current schema
3. /database-migrations:sql-migrations: Zero-downtime migration
4. /database-design:sql-pro: Validate queries
5. Implement migration
6. Test migration (up + down)
7. /comprehensive-review:full-review
8. Commit & PR
```

---

### Pattern 3: Performance Optimization (Situational)

```
1. /application-performance:performance-engineer: Identify bottlenecks
2. /database-design:sql-pro: Query optimization (if DB-related)
3. Plan subagent: Optimization strategy
4. Implement optimizations
5. /performance-testing-review:performance-engineer: Validate
6. Benchmark (before/after)
7. Commit & PR
```

---

### Pattern 4: Security Audit (Complex)

```
1. /comprehensive-review:security-auditor: Initial audit
2. /backend-api-security:backend-security-coder: Deep scan
3. /authentication-validator:validate-auth: Auth testing
4. Plan subagent: Remediation plan
5. Fix issues (prioritize critical/high)
6. Re-audit (score >8/10, 0 critical)
7. Document security improvements
8. Commit & PR
```

---

### Pattern 5: Cross-Service Feature (Complex)

```
Day 0:
1. Explore subagent: All related services
2. Plan subagent: Multi-service integration plan
3. /full-stack-orchestration:full-stack-feature: Architecture
4. /database-design:database-architect: Distributed data strategy
5. Review & approve plan

Day 1-N:
1. Implement service 1 (Tier 2 workflow)
2. Implement service 2 (Tier 2 workflow)
3. Integration layer
4. End-to-end tests

Final Day:
1. /comprehensive-review:full-review
2. /application-performance:performance-engineer
3. Load testing
4. Documentation
5. Commit & PR
```

---

## Error Handling & Recovery

### Build/Test Failures

```
1. Read error messages carefully
2. Identify root cause
3. Fix issues
4. Re-run gates (pnpm build + npm test)
5. Only proceed when passing
```

**Never**:
- Skip tests to "save time"
- Commit with errors
- Work around test failures

---

### Review Score <8/10

```
1. Analyze review feedback
2. Prioritize critical/high issues
3. Fix issues
4. Re-run /comprehensive-review:full-review
5. Proceed only when score >8/10
```

---

### Context >140k (Red)

```
1. Check context: /context
2. Complete current phase
3. Create checkpoint (git commit)
4. Document progress
5. Start new session
6. Resume from checkpoint
```

---

### Plugin Failures

**If plugin fails**:
```
1. Check plugin status: /plugin list
2. Review error message
3. Try alternative plugin or manual approach
4. Report issue if reproducible
```

**Fallback**: All plugins are optional. Can always use manual Sonnet implementation.

---

## DO ✅ / DON'T ❌

### DO

✅ Use Plan subagent for Tier 2/3 tasks
✅ Use Explore subagent before implementing (0 main context cost!)
✅ Run quality gates before every commit
✅ Micro-commit after each phase
✅ Review score >8/10 before PR
✅ Reference `VEXTRUS-PATTERNS.md` for architecture
✅ Use Skills for domain knowledge
✅ Monitor context with `/context`
✅ Enable MCP with "@" only when needed
✅ Follow tier-appropriate workflow

### DON'T

❌ Skip planning for Tier 2/3 tasks
❌ Commit with TypeScript errors or failing tests
❌ Skip reviews to "save time"
❌ Load entire files unnecessarily (use Explore subagent)
❌ Enable all MCP servers (use "@" selectively)
❌ Over-engineer simple tasks (keep Tier 1 simple)
❌ Use plugins for simple file reads (use Read tool)
❌ Ignore context warnings (>140k)
❌ Create worktrees (use standard branches)
❌ Skip checkpoints on long tasks

---

## Success Metrics

### Quality Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Code Quality | 9.5/10 | comprehensive-review score |
| Security | 0 critical | security audit |
| Test Coverage | >90% | Jest/Coverage report |
| Performance | <500ms p95 | Response times |
| Context Baseline | <50k (25%) | /context command |

### Workflow Efficiency

| Metric | Target | Measurement |
|--------|--------|-------------|
| Simple Tasks | <2h | Time to completion |
| Medium Tasks | 4-8h | Time to completion |
| Complex Tasks | 2-5 days | Time to completion |
| Resilience | High | Failure recovery |
| DX | Excellent | Developer feedback |

---

## Quick Command Reference

| Need | Command |
|------|---------|
| **Planning** | Task tool (subagent_type="Plan") |
| **Exploration** | Task tool (subagent_type="Explore") |
| **Backend Feature** | `/backend-development:feature-development` |
| **TDD** | `/tdd-workflows:tdd-cycle` |
| **Tests** | `/unit-test-generator:generate-tests` |
| **Review** | `/comprehensive-review:full-review` |
| **Security** | `/backend-api-security:backend-security-coder` |
| **Performance** | `/application-performance:performance-engineer` |
| **Database** | `/database-migrations:sql-migrations` |
| **PR** | `/git-pr-workflows:pr-enhance` |
| **Build** | `pnpm build` |
| **Test** | `npm test` |
| **Context** | `/context` |

---

## Resources

- **Plugin Reference**: `.claude/plugin-command-reference.md` (47+ commands)
- **Skills**: `.claude/skills/` (domain knowledge)
- **Templates**: `.claude/templates/` (task templates)
- **Architecture**: `VEXTRUS-PATTERNS.md` (DDD, Event Sourcing, GraphQL, Bangladesh compliance)
- **V6.0 Archive**: `CLAUDE-V6.0-ARCHIVED.md` (fallback reference)

---

## Workflow Summary

```
TIER 1 (Simple): Read → Implement → Validate → Commit
TIER 2 (Medium): Plan → Explore → Design → Implement → Review → Finalize
TIER 3 (Complex): Research → Architecture → Daily Implementation → Quality → Release
```

**Philosophy**: Each unit of engineering work makes subsequent units easier—not harder.

**Primary Orchestration**: Native CC (Plan/Explore subagents) + Specialized Plugins

**Model Strategy**: Sonnet for complex reasoning, Haiku for exploration/execution

**Context Target**: <50k baseline (25%), 150k available (75%)

**Your Goal**: 9.5/10 quality, >90% coverage, <50k context, systematic delivery.

---

**V7.0: Phase-Based Native Orchestration** | **Balanced** | **Resilient** | **Context-Optimized**
