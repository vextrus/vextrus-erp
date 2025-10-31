# V10.0 Comprehensive Workflows

**Purpose**: Step-by-step workflows for all 4 levels with specialized agent orchestration

**Quick Reference**:
- **Level 0**: 3 steps, <30min, no agents
- **Level 1**: 5 steps, <2h, optional agents
- **Level 2**: 9 phases, 4-8h, mandatory agents + plugins
- **Level 3**: Multi-day, <120k/session, full orchestration

---

## LEVEL 0: IMMEDIATE (1 file, <30min)

**When to use**: Config changes, typos, version bumps, trivial fixes

**Total Time**: <30min
**Context Budget**: <20k tokens (10%)
**Agents Required**: None
**Plugins Required**: None

### Phase 1: EDIT (Direct)
**Actions**:
- Make change directly in target file
- Keep scope minimal (1 file only)
- No research needed (trivial change)

**Example**:
```typescript
// Before: Update version number
"version": "1.2.3"
// After:
"version": "1.2.4"
```

### Phase 2: VALIDATE (Automated Hooks)
**Automated Actions** (pre-commit hook):
- Auto-format (Prettier)
- Auto-lint (ESLint)
- `pnpm build` → BLOCKING if errors
- `npm test` → BLOCKING if failures

**Manual Verification** (if hooks disabled):
```bash
pnpm build  # Must show 0 errors
npm test    # Must show all passing
```

**BLOCKING**: Cannot proceed if build or tests fail

### Phase 3: COMMIT (Standard)
**Actions**:
```bash
git add .
git commit -m "chore: Update version to 1.2.4"
git push
```

**Post-commit hook** (automated):
- Collect metrics
- Update dashboard

**Context Check**: Auto-suggest `/context` (non-blocking)

### Level 0 Examples
✅ **Good**:
- Update package.json version
- Fix typo in README
- Add missing semicolon
- Update config value

❌ **Bad** (use Level 1+):
- Add new function
- Fix bug with tests
- Update multiple files
- Refactor code

---

## LEVEL 1: SIMPLE (1-3 files, <2h)

**When to use**: Bug fixes, small enhancements, single service, known patterns

**Total Time**: <2h
**Context Budget**: <50k tokens (25%)
**Agents Required**: Optional (Plan/Explore if uncertain)
**Plugins Required**: Optional (tdd-workflows recommended)

### Phase 1: RESEARCH (Targeted)
**Actions**:
- Use `Grep` to find relevant code (not Read)
- Use `Glob` to locate files (not ls)
- Read ONLY files being modified (max 3 files)

**Context-Saving Strategy**:
```bash
# BAD: Read entire directory
Read services/finance/src/**/*.ts  # Wastes 50k+ tokens

# GOOD: Targeted search
Grep "calculateVAT" services/finance/
Read services/finance/src/vat-calculator.service.ts
```

**Optional Agent**:
- If uncertain about location → Launch Explore subagent (Haiku)
- Explore runs in separate 200k window (0 main context cost)

### Phase 2: PLAN (Inline or Subagent)
**Inline Planning** (simple bugs):
```markdown
Problem: VAT calculation incorrect for 0% items
Root cause: Missing null check on vatRate
Solution: Add null check, return amount unchanged if 0%
Test: Add unit test for 0% VAT items
```

**Subagent Planning** (if complex):
- Launch Plan subagent (optional)
- Useful if logic unclear or multiple approaches

### Phase 3: IMPLEMENT (Direct or TDD)
**Direct Implementation** (simple fix):
```typescript
// Add null check
if (!vatRate || vatRate === 0) {
  return amount;
}
return amount * (1 + vatRate);
```

**TDD Implementation** (recommended):
```bash
# Use plugin for TDD workflow
/tdd-workflows:tdd-red
# Write failing test

/tdd-workflows:tdd-green
# Implement fix

/tdd-workflows:tdd-refactor
# Improve quality
```

### Phase 4: VALIDATE (Automated + Manual)
**Automated (Hooks)**:
- Pre-commit: format → lint → build → test

**Manual Checks**:
```bash
# Verify fix works
npm test services/finance/vat-calculator.spec.ts

# Verify no regressions
npm test services/finance/
```

**BLOCKING**: Must pass all tests

### Phase 5: COMMIT (Standard)
**Actions**:
```bash
git add services/finance/
git commit -m "fix(vat): Handle 0% VAT items correctly

- Add null check for vatRate
- Return amount unchanged for 0% items
- Add unit test coverage

Fixes #1234"
git push
```

**Context Check**: Auto-suggest `/context` (non-blocking)

### Level 1 Examples
✅ **Good**:
- Fix calculation bug
- Add input validation
- Update API response format
- Refactor single function

❌ **Bad** (use Level 2+):
- Add new endpoint
- Cross-service change
- Database migration
- New feature

---

## LEVEL 2: STANDARD (4-15 files, 2-8h)

**When to use**: New features, API endpoints, moderate complexity

**Total Time**: 4-8h
**Context Budget**: <100k tokens (50%)
**Agents Required**: MANDATORY (Plan + Explore + 5 specialized)
**Plugins Required**: 12-15 plugins (auto-selected)

### Phase 1: PLAN (Subagent - MANDATORY)

**Launch Plan Subagent**:
```bash
Task(subagent_type="Plan", model="sonnet")
```

**Input to Plan**:
```markdown
Task: Implement invoice-payment linking for Mushak 6.3

Requirements:
- Link invoices to payments in finance service
- Generate Mushak 6.3 report
- Handle partial payments
- Multi-tenant isolation required

Constraints:
- Bangladesh NBR compliance
- Event sourcing architecture
- GraphQL Federation v2
```

**Plan Output Expected**:
- Technical approach
- Affected services (finance, accounting)
- Database changes (event store, read models)
- API changes (GraphQL mutations, queries)
- Test strategy
- Security considerations

**Verification Gate**:
```
Q: Did you launch Plan subagent? [YES/NO]
IF NO → BLOCKING: Cannot proceed without Plan subagent
```

**Context Check**: MANDATORY `/context` after phase

### Phase 2: EXPLORE (Subagent - MANDATORY)

**Launch Explore Subagent** (Haiku, separate 200k window):
```bash
Task(subagent_type="Explore", model="haiku")
```

**Input to Explore**:
```markdown
Explore the following for invoice-payment linking:

Services:
- services/finance/** (invoice aggregates, events)
- services/accounting/** (payment aggregates, events)

Find:
- Existing invoice domain model
- Existing payment domain model
- GraphQL schema definitions
- Event sourcing patterns used
- Multi-tenancy implementation

Return: Structured summary (NOT full files)
```

**Explore Output Expected**:
- Invoice aggregate structure
- Payment aggregate structure
- Existing events (InvoiceCreated, PaymentReceived)
- GraphQL types (Invoice, Payment)
- Multi-tenancy strategy (schema-per-tenant)

**Verification Gate**:
```
Q: Did you launch Explore subagent? [YES/NO]
IF NO → BLOCKING: Cannot proceed without Explore subagent
```

**Context Cost**: 0 tokens in main context (separate window)

**Context Check**: MANDATORY `/context` after phase

### Phase 3: SPEC (Subagent - NEW in V10.0)

**Launch SPEC Subagent**:
```bash
Task(subagent_type="spec-writer")
```

**Input to SPEC**:
- Plan output (from Phase 1)
- Explore summary (from Phase 2)

**SPEC Output Expected**:
- Detailed technical specification
- Event schemas (InvoicePaymentLinked event)
- Command schemas (LinkInvoiceToPayment command)
- Read model schemas (InvoicePaymentView)
- GraphQL schema updates
- API contracts

**Deliverable**: `SPEC-invoice-payment-linking.md`

**Context Check**: MANDATORY `/context` after phase

### Phase 4: ARCHITECT (Subagent - NEW in V10.0)

**Launch ARCHITECT Subagent**:
```bash
Task(subagent_type="architect")
```

**Input to ARCHITECT**:
- SPEC document
- Applicable skills (ddd-event-sourcing, graphql-federation-v2)

**ARCHITECT Output Expected**:
- DDD patterns to use (Aggregate, Entity, Value Object)
- Event sourcing implementation (event store, projections)
- CQRS separation (command handlers, query handlers)
- GraphQL Federation strategy (entity resolution)
- Architecture Decision Records (ADRs)

**Deliverable**: `ADR-invoice-payment-architecture.md`

**Context Check**: MANDATORY `/context` after phase

### Phase 5: IMPLEMENT (Parallel with TEST-GEN)

**Main Thread: Implementation**

Use plugins:
```bash
# Backend feature orchestration
/backend-development:feature-development

# TDD workflow
/tdd-workflows:tdd-cycle
```

**Implementation Order**:
1. **Domain Layer** (Invoice/Payment aggregates):
   ```typescript
   // Event
   export class InvoicePaymentLinkedEvent {
     invoiceId: UUID;
     paymentId: UUID;
     amount: Money;
     linkedAt: DateTime;
   }

   // Command
   export class LinkInvoiceToPaymentCommand {
     invoiceId: UUID;
     paymentId: UUID;
     amount: Money;
     tenantId: UUID;
   }

   // Aggregate method
   linkPayment(payment: Payment, amount: Money): void {
     this.apply(new InvoicePaymentLinkedEvent(...));
   }
   ```

2. **Application Layer** (Command/Query handlers):
   ```typescript
   @CommandHandler(LinkInvoiceToPaymentCommand)
   export class LinkInvoiceToPaymentHandler {
     async execute(command: LinkInvoiceToPaymentCommand): Promise<void> {
       // Load aggregates
       // Validate (multi-tenant, amounts)
       // Execute domain logic
       // Save events
     }
   }
   ```

3. **Presentation Layer** (GraphQL resolvers):
   ```typescript
   @Resolver('Invoice')
   export class InvoiceResolver {
     @Mutation()
     @UseGuards(JwtAuthGuard, RbacGuard)
     async linkInvoiceToPayment(@Args() args): Promise<Invoice> {
       return this.commandBus.execute(new LinkInvoiceToPaymentCommand(args));
     }
   }
   ```

**Parallel Thread: Test Generation Subagent**

Launch TEST-GENERATOR subagent:
```bash
Task(subagent_type="test-generator")
```

**Runs in parallel** while you implement:
- Generates unit tests for aggregates
- Generates integration tests for handlers
- Generates E2E tests for GraphQL
- Returns test suite

**Micro-Commits**:
```bash
git add domain/events/
git commit -m "feat(invoice): Add InvoicePaymentLinked event"

git add domain/aggregates/
git commit -m "feat(invoice): Add linkPayment method"

git add application/commands/
git commit -m "feat(invoice): Add LinkInvoiceToPayment handler"
```

**Context Check**: MANDATORY `/context` after phase

### Phase 6: SECURITY (Subagent - NEW in V10.0)

**Launch SECURITY-AUDITOR Subagent**:
```bash
Task(subagent_type="security-auditor")
```

**Security Checks**:
- OWASP Top 10 scan
- Multi-tenant isolation verified (tenantId filtering)
- Bangladesh compliance (audit trail, NBR requirements)
- Input validation (command validation)
- Authentication/authorization (guards applied)

**Plugin**:
```bash
/backend-api-security:backend-security-coder
```

**Expected Output**:
- Security report
- Vulnerabilities found (if any)
- Remediation recommendations

**BLOCKING**: 0 critical, 0 high vulnerabilities

**Context Check**: MANDATORY `/context` after phase

### Phase 7: REVIEW (Plugin - MANDATORY)

**Comprehensive Review**:
```bash
/comprehensive-review:full-review
```

**12+ Specialized Reviewers** (parallel):
- architecture-strategist
- security-sentinel
- performance-oracle
- data-integrity-guardian
- pattern-recognition-specialist
- code-simplicity-reviewer
- best-practices-researcher
- git-history-analyzer
- repo-research-analyst
- framework-docs-researcher
- kieran-typescript-reviewer (score provider)
- dhh-rails-reviewer (if applicable)

**Expected Output**:
- Review score: X/10
- Critical issues (MUST fix)
- Recommendations (SHOULD fix)
- Compliments (what went well)

**BLOCKING**: Score must be ≥8/10

**If score <8/10**:
1. Read critical issues
2. Fix issues
3. Re-run review
4. Repeat until ≥8/10

**Context Check**: MANDATORY `/context` after phase

### Phase 8: FINALIZE (Documentation + PR)

**Documentation**:
```bash
# API documentation
/api-documentation-generator:generate-api-docs

# Comprehensive docs
/documentation-generation:doc-generate
```

**Output**:
- OpenAPI/Swagger updated
- GraphQL schema docs
- README updates
- CHANGELOG entry

**Pull Request**:
```bash
# Enhanced PR with review integration
/comprehensive-review:pr-enhance

# OR standard PR
/git-pr-workflows:pr-enhance
```

**PR Contents**:
- Summary of changes
- Test plan
- Review score (8.5/10)
- Security scan (0 critical/high)
- Screenshots (if UI)

**Context Check**: MANDATORY `/context` after phase

### Level 2 Verification Gates

**After EVERY phase**:
```
1. Did you complete the phase? [YES/NO]
2. Did you run /context? [YES/NO]
3. Context status? [GREEN/YELLOW/ORANGE/RED]
4. Did you take required action for threshold?
   - GREEN/YELLOW: Continue
   - ORANGE: Create checkpoint
   - RED: STOP (new session)
5. Did you update .claude/todo/current.md?
6. Did you commit TODO update?
```

### Level 2 Examples
✅ **Good**:
- New GraphQL mutation
- Invoice-payment linking
- VAT calculation module
- Multi-step workflow

❌ **Bad** (use Level 3):
- Cross-service authentication
- New microservice
- Distributed transaction
- Architecture refactor

---

## LEVEL 3: COMPLEX (15+ files, 2-5 days)

**When to use**: Cross-service features, new microservices, distributed systems

**Total Time**: 2-5 days
**Context Budget**: <120k per session (60%)
**Agents Required**: ALL (Plan + Explore + 5 specialized)
**Plugins Required**: 15-20 plugins (comprehensive)

### DAY 0: RESEARCH (4 hours)

#### Phase 1.1: EXPLORATION (Parallel)

**Launch Multiple Explore Subagents**:
```bash
# Finance service exploration
Task(subagent_type="Explore", prompt="Explore services/finance/")

# Accounting service exploration
Task(subagent_type="Explore", prompt="Explore services/accounting/")

# Master-data service exploration
Task(subagent_type="Explore", prompt="Explore services/master-data/")
```

**Run in parallel** (each in separate 200k window)

**Expected Output**:
- Service boundaries identified
- Domain models cataloged
- Integration points mapped
- Event flows documented

#### Phase 1.2: CRITICAL THINKING (Complex Decisions)

**Launch Critical Thinking Plugin**:
```bash
/criticalthink:criticalthink
```

**Input**:
```markdown
Problem: Implement distributed VAT calculation across 3 services

Complexity factors:
- Cross-service coordination (finance, accounting, master-data)
- Event-driven architecture (eventual consistency)
- Multi-tenant isolation
- Bangladesh compliance (NBR audit requirements)
- High transaction volume (1000+ invoices/day)

Question: What's the optimal architecture?
```

**Expected Output**:
- Analysis of approaches (choreography vs orchestration)
- Trade-offs (consistency vs availability)
- Recommended approach (saga pattern)
- Risk assessment

#### Phase 1.3: COMPREHENSIVE PLANNING

**Launch Plan Subagent**:
```bash
Task(subagent_type="Plan", model="sonnet", prompt="...")
```

**Plan Output**:
- Multi-day breakdown (Day 1: Service A, Day 2: Service B, etc.)
- Phase-by-phase workflow
- Checkpoint strategy (after every 2 phases)
- Context budget per session
- Rollback strategy

#### Phase 1.4: ARCHITECTURE DESIGN

**Launch Multiple Architecture Plugins**:
```bash
/backend-development:microservices-patterns
/backend-development:architecture-patterns
/database-migrations:sql-migrations
```

**Expected Output**:
- Service boundaries (DDD bounded contexts)
- Event flows (saga choreography)
- Database schema changes (event store + read models)
- API contracts (GraphQL Federation)

**CHECKPOINT**: End of Day 0
```bash
git add .
git commit -m "docs: Add architecture docs for VAT feature"
git push

# Create checkpoint
.claude/checkpoints/2025-10-31-DAY0-COMPLETE.md
```

### DAY 1-N: IMPLEMENTATION (Iterative)

#### Morning Session (4 hours)

**Resume from checkpoint**:
```bash
Read .claude/checkpoints/[latest].md
Read .claude/todo/current.md
```

**Implement Service Slice**:
```bash
# Full-stack orchestration
/full-stack-orchestration:full-stack-feature

# Backend implementation
/backend-development:feature-development

# TDD workflow
/tdd-workflows:tdd-cycle

# Testing
/test-orchestrator:orchestrate
```

**Quality Gates** (after each slice):
```bash
pnpm build  # BLOCKING
npm test    # BLOCKING
```

**Context Check**: MANDATORY after every slice

**CHECKPOINT**: Mid-day if context >80k

#### Afternoon Session (4 hours)

**Continue implementation**:
- Next service slice
- Integration tests
- End-to-end tests

**Distributed Debugging** (if needed):
```bash
/distributed-debugging:debug-trace
```

**Context Check**: MANDATORY after every slice

**CHECKPOINT**: End of day (MANDATORY)
```bash
# Create daily checkpoint
.claude/checkpoints/2025-10-31-DAY1-COMPLETE.md

# Update TODO
.claude/todo/current.md

# Commit
git add .
git commit -m "feat(vat): Complete finance service integration"
git push
```

**Context Status**: Should be <120k (60%)
**If ORANGE/RED**: New session next day

### FINAL DAY: QUALITY (4 hours)

#### Phase: Comprehensive Review

**All review plugins**:
```bash
/comprehensive-review:full-review
/backend-api-security:backend-security-coder
/application-performance:performance-optimization
/performance-testing-review:multi-agent-review
```

**Expected Results**:
- Review score: ≥8/10
- Security: 0 critical/high
- Performance: Response time <200ms
- Test coverage: ≥90%

**BLOCKING**: Must pass all gates

#### Phase: Documentation

```bash
/api-documentation-generator:generate-api-docs
/documentation-generation:doc-generate
```

**Output**:
- API documentation complete
- Architecture diagrams
- Runbooks
- CHANGELOG updated

#### Phase: Deployment Prep

```bash
/deployment-pipeline-orchestrator:pipeline-orchestrate
/database-migrations:migration-observability
/infrastructure-drift-detector:drift-detect
```

**Output**:
- CI/CD pipeline configured
- Migration scripts validated
- Infrastructure verified

#### Phase: Final PR

```bash
/comprehensive-review:pr-enhance
```

**PR Contents**:
- Executive summary
- Technical details
- Test plan (90%+ coverage)
- Performance benchmarks
- Security scan results
- Deployment guide

**FINAL CHECKPOINT**:
```bash
git add .
git commit -m "feat(vat): Complete distributed VAT calculation

Multi-service feature spanning:
- Finance service (invoice aggregates)
- Accounting service (payment aggregates)
- Master-data service (VAT rates)

Architecture:
- Event-driven (saga choreography)
- GraphQL Federation v2
- Multi-tenant isolation
- Bangladesh NBR compliant

Quality:
- Review score: 9.2/10
- Security: 0 critical/high
- Test coverage: 94%
- Performance: 150ms avg response

Closes #5678"
git push
```

### Level 3 Examples
✅ **Good**:
- Cross-service VAT calculation
- New authentication microservice
- Distributed reporting system
- Major architecture refactor

---

## Context Management Across All Levels

### After Every Phase (Mandatory)

**Level 0/1**:
```
Consider running /context to check status (recommended)
```

**Level 2/3**:
```
MANDATORY: Please run /context now

[Wait for user response]

Context: [X]k tokens ([Y]%)
Status: [GREEN/YELLOW/ORANGE/RED]

Action:
- GREEN: Continue to next phase
- YELLOW: Log warning, continue
- ORANGE: FORCE checkpoint (Level 2/3)
- RED: BLOCKING (new session required)
```

### Checkpoint Creation (ORANGE/RED)

**ORANGE (130-160k / 65-80%)**:
```bash
# Create checkpoint
mkdir -p .claude/checkpoints
cat > .claude/checkpoints/2025-10-31-1445-ORANGE.md <<EOF
# Checkpoint: Context ORANGE

**Session**: invoice-payment-linking
**Context**: 145k (72.5%) - ORANGE
**Phase**: 5 (IMPLEMENT - 80% complete)
**Last commit**: "feat(invoice): Add payment linking logic"

**Remaining work**:
- Complete security audit (Phase 6)
- Run comprehensive review (Phase 7)
- Create PR (Phase 8)

**Recovery**: Read this checkpoint, resume Phase 6
EOF

# Commit checkpoint
git add .claude/checkpoints/
git commit -m "chore: Checkpoint - context at 145k (ORANGE)"
git push
```

**Continue after checkpoint** (allowed for ORANGE)

**RED (≥160k / 80%+)**:
```bash
# Create EMERGENCY checkpoint
cat > .claude/checkpoints/2025-10-31-1520-EMERGENCY-RED.md <<EOF
# EMERGENCY Checkpoint: Context RED

**BLOCKING**: New session REQUIRED

**Session**: invoice-payment-linking
**Context**: 165k (82.5%) - RED
**Phase**: 5 (IMPLEMENT - 85% complete)
**Last commit**: "feat(invoice): Add payment repository"

**Recovery for next session**:
1. Start new Claude Code session
2. Read .claude/todo/current.md
3. Read this checkpoint file
4. Resume: Phase 5, complete remaining 15%
5. Continue to Phase 6
EOF

git add .
git commit -m "chore: EMERGENCY checkpoint - context RED at 165k"
git push
```

**STOP - DO NOT CONTINUE** (RED is blocking)

---

## Recovery Procedures

### If Session Interrupted

**Read recovery files**:
```bash
# 1. Read TODO
Read .claude/todo/current.md

# 2. Read latest checkpoint
Read .claude/checkpoints/[latest].md

# 3. Read last commit
git log -1 --stat

# 4. Resume from checkpoint phase
```

### If TODO Lost

**TODO is git-tracked**:
```bash
git log --all --full-history -- .claude/todo/current.md
git show [commit-hash]:.claude/todo/current.md
```

**Restore latest**:
```bash
git checkout HEAD -- .claude/todo/current.md
```

---

**V10.0 Workflows**
**Complete | Actionable | Context-Optimized | Production-Proven**
