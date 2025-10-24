# Checkpoint-Logs Integration with GitHub Issues

**Purpose**: Comprehensive progress tracking for complex multi-day features
**Use For**: Complex tasks (2-5 days), multi-worktree development, team visibility
**Pattern**: Checkpoint → Sync → Review → Continue

---

## Overview

**Checkpoint-Driven Development** (proven 9.5/10 quality) + **GitHub Issues** (team visibility) = Comprehensive feature tracking

**Benefits**:
- **Asynchronous collaboration**: Team can review checkpoints offline
- **Progress visibility**: GitHub issue becomes single source of truth
- **Context preservation**: Full checkpoint history preserved
- **Review integration**: Link checkpoints to PR reviews
- **Metrics tracking**: Measure actual vs estimated time

---

## When to Use

✅ **Use checkpoint-logs integration when**:
- Multi-day features (2-5 days)
- Multiple developers/stakeholders need visibility
- High-stakes features requiring review gates
- Git worktree parallel development (3+ worktrees)
- Budget/timeline tracking important

❌ **Skip for**:
- Simple tasks (<4 hours)
- Solo work with no stakeholders
- Exploratory/learning tasks
- Internal refactoring (no external visibility needed)

---

## Workflow Pattern

### Phase 1: Initial Planning (Day 0)

**1.1 Create GitHub Issue**

```typescript
// Use GitHub MCP tool
mcp__github__create_issue({
  owner: "your-org",
  repo: "vextrus-erp",
  title: "feat: Implement invoice-payment linking with reconciliation",
  body: `
## Goal
Implement comprehensive invoice-payment linking feature with automatic reconciliation

## Scope
- Payment aggregate (Event Sourcing)
- Reconciliation aggregate (cross-aggregate coordination)
- GraphQL resolvers (Federation v2)
- Integration tests (CQRS flows)
- E2E tests (GraphQL mutations/queries)

## Estimated Time
3-5 days (wall-clock)

## Quality Gates
- [ ] kieran-typescript-reviewer: 9.5/10+ quality
- [ ] security-sentinel: 100% pass
- [ ] performance-oracle: <300ms response
- [ ] Test coverage: 90%+ (domain layer)

## Dependencies
- Invoice service (completed)
- Payment gateway integration (in progress)

## Stakeholders
- @finance-team (business requirements)
- @dev-lead (technical review)
  `,
  labels: ["feature", "finance", "complex"]
})
```

**1.2 Enter Plan Mode**

Follow `.claude/github/workflows/plan-mode-workflow.md`:
1. Research (30-90 min) - Parallel agents
2. Analyze (30-60 min) - Read files completely
3. Design (30-90 min) - Architectural decisions
4. TodoWrite (15-30 min) - 8-15 structured tasks
5. **Checkpoint** (30-60 min) - Create `checkpoint-day0-plan.md`

**1.3 Sync Planning Checkpoint**

```bash
# Sync planning checkpoint to GitHub issue
./.claude/github/scripts/sync-checkpoint.sh checkpoint-day0-plan.md 123

# Or use GitHub MCP directly
mcp__github__add_issue_comment({
  owner: "your-org",
  repo: "vextrus-erp",
  issue_number: 123,
  body: "## Day 0: Planning Complete\n\n[checkpoint content]"
})
```

---

### Phase 2: Daily Execution (Day 1-4)

**2.1 Start-of-Day Checkpoint** (15-30 min)

Create `checkpoint-dayN-start.md`:

```markdown
# Day N Start Checkpoint

**Date**: 2025-10-24
**Time**: 09:00
**Branch**: feature/invoice-payment-linking
**Issue**: #123

## Yesterday's Accomplishments
- [x] Domain layer complete (Payment aggregate)
- [x] 15 tests passing (92% coverage)
- [x] kieran-typescript-reviewer: 9/10 quality

## Today's Goals
- [ ] Application layer (CQRS handlers)
- [ ] GraphQL resolvers (Federation v2)
- [ ] Integration tests (CQRS flows)

## Blockers
- None

## Estimated Time
6-8 hours

## Notes
- Payment aggregate design reviewed and approved
- Ready for application layer implementation
```

**Sync to GitHub**:
```bash
./.claude/github/scripts/sync-checkpoint.sh checkpoint-day2-start.md 123
```

**2.2 End-of-Day Checkpoint** (30-60 min)

Create `checkpoint-dayN-end.md`:

```markdown
# Day N End Checkpoint

**Date**: 2025-10-24
**Time**: 17:30
**Branch**: feature/invoice-payment-linking
**Issue**: #123

## Accomplishments
- [x] Application layer complete (4 CQRS handlers)
- [x] GraphQL resolvers complete (5 queries, 3 mutations)
- [x] Integration tests (12 tests, 95% coverage)
- [x] Quality review: kieran-typescript-reviewer (9.5/10)

## Code Changes
- `services/finance/src/domain/payment/payment.aggregate.ts` - Payment aggregate
- `services/finance/src/application/commands/` - 3 command handlers
- `services/finance/src/application/queries/` - 2 query handlers
- `services/finance/src/presentation/resolvers/` - GraphQL resolvers

## Quality Metrics
- TypeScript: 0 errors (pnpm build ✓)
- Tests: 27 passing, 0 failing (npm test ✓)
- Coverage: 95% (domain layer)
- Performance: <250ms (payment creation)

## Tomorrow's Plan
- [ ] E2E tests (GraphQL mutations/queries)
- [ ] Performance testing (100+ concurrent payments)
- [ ] Final review (security-sentinel + performance-oracle)

## Blockers
- None

## Notes
- Payment-invoice linking logic more complex than estimated (+2 hours)
- Cross-aggregate coordination required additional event handlers
```

**Sync to GitHub**:
```bash
./.claude/github/scripts/sync-checkpoint.sh checkpoint-day2-end.md 123
```

**2.3 Commit Progress**

```bash
git add .
git commit -m "feat(finance): Complete application layer for payment linking

- Implement 3 command handlers (CreatePayment, LinkInvoice, ReconcilePayment)
- Implement 2 query handlers (GetPayment, GetPaymentsByInvoice)
- Add 12 integration tests (CQRS flows)
- Quality review: kieran-typescript-reviewer (9.5/10)

Related to #123

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Phase 3: Review Gates (Throughout)

**3.1 Quality Review Checkpoints**

After each major milestone, create quality checkpoint:

```markdown
# Quality Review Checkpoint: Domain Layer

**Date**: 2025-10-24
**Reviewer**: kieran-typescript-reviewer
**Branch**: feature/invoice-payment-linking
**Issue**: #123

## Review Scope
- Payment aggregate (`payment.aggregate.ts`)
- Value objects (Amount, PaymentMethod, PaymentStatus)
- Events (PaymentCreated, InvoiceLinked, PaymentReconciled)

## Review Results

**Overall Score**: 9.5/10

**Strengths**:
- ✅ Excellent event design (immutable, past tense)
- ✅ Strong aggregate boundaries (single responsibility)
- ✅ Comprehensive validation (Amount, PaymentMethod)
- ✅ Event versioning implemented correctly

**Issues Found**: 0 critical, 1 minor

**Minor Issues**:
1. PaymentMethod enum could use JSDoc comments

## Actions Taken
- Added JSDoc comments to PaymentMethod enum
- Re-ran quality review: 9.5/10 → 10/10

## Quality Gates
- [x] kieran-typescript-reviewer: 10/10
- [x] TypeScript: 0 errors
- [x] Tests: 15 passing (92% coverage)
- [x] Performance: <200ms (aggregate operations)
```

**Sync to GitHub**:
```bash
./.claude/github/scripts/sync-checkpoint.sh checkpoint-review-domain.md 123
```

**3.2 Security Review Checkpoints**

For auth, RBAC, sensitive data:

```markdown
# Security Review Checkpoint: Payment Authorization

**Date**: 2025-10-24
**Reviewer**: security-sentinel
**Branch**: feature/invoice-payment-linking
**Issue**: #123

## Review Scope
- Payment authorization (RBAC)
- GraphQL resolvers (@Authorized decorator)
- Sensitive data handling (payment method details)

## Security Review Results

**Overall**: ✅ APPROVED

**Checks Performed**:
- [x] 100% authentication coverage (no @Public())
- [x] RBAC enforcement (CREATE_PAYMENT, VIEW_PAYMENT)
- [x] Sensitive data encrypted (payment method details)
- [x] Input validation (all GraphQL inputs)
- [x] SQL injection protection (parameterized queries)

## Vulnerabilities Found
None

## Actions Taken
None required

## Quality Gates
- [x] security-sentinel: ✅ APPROVED
- [x] 100% authentication coverage
- [x] Sensitive data encrypted
```

---

### Phase 4: Final Checkpoint (End of Feature)

**4.1 Create Comprehensive Final Checkpoint**

Create `checkpoint-final-complete.md` (300-600 lines):

```markdown
# Final Checkpoint: Invoice-Payment Linking Feature Complete

**Date**: 2025-10-24
**Duration**: 5 days (planned), 4.5 days (actual)
**Branch**: feature/invoice-payment-linking
**Issue**: #123
**PR**: #456

## Executive Summary

Implemented comprehensive invoice-payment linking feature with:
- Cross-aggregate coordination (Invoice + Payment + Reconciliation)
- Event Sourcing + CQRS architecture
- GraphQL Federation v2 resolvers
- 45 tests (92% coverage)
- Proven quality (9.5/10 average)

## Implementation Details

### Domain Layer (Day 1-2)
**Files Modified**:
- `services/finance/src/domain/payment/payment.aggregate.ts` (320 lines)
- `services/finance/src/domain/payment/value-objects/` (8 value objects)
- `services/finance/src/domain/payment/events/` (12 events)

**Key Patterns**:
- Event Sourcing (12 domain events, immutable)
- Aggregate root (Payment as single entry point)
- Value objects (Amount, PaymentMethod, PaymentStatus)

**Quality Reviews**:
- kieran-typescript-reviewer: 9.5/10
- Tests: 15 (92% coverage)

### Application Layer (Day 2-3)
**Files Modified**:
- `services/finance/src/application/commands/` (3 command handlers)
- `services/finance/src/application/queries/` (2 query handlers)
- `services/finance/src/application/events/` (4 event handlers)

**Key Patterns**:
- CQRS (commands + queries separated)
- Event handlers (cross-aggregate coordination)
- Idempotency (command deduplication)

**Quality Reviews**:
- kieran-typescript-reviewer: 9.5/10
- Tests: 27 (95% coverage)

### Presentation Layer (Day 3-4)
**Files Modified**:
- `services/finance/src/presentation/resolvers/payment.resolver.ts` (280 lines)
- `services/finance/src/presentation/inputs/` (5 GraphQL inputs)
- `services/finance/src/presentation/payloads/` (3 GraphQL payloads)

**Key Patterns**:
- GraphQL Federation v2 (@key directive on Payment)
- Payload types with errors (don't throw from mutations)
- Pagination (relay-style connections)

**Quality Reviews**:
- kieran-typescript-reviewer: 9.5/10
- security-sentinel: ✅ APPROVED (100% auth coverage)
- Tests: 45 (92% coverage)

### Testing (Throughout)
**Test Coverage**:
- Unit tests: 20 (domain layer)
- Integration tests: 15 (CQRS flows)
- E2E tests: 10 (GraphQL mutations/queries)
- **Total**: 45 tests, 92% coverage

**Quality Gates**:
- pnpm build: ✅ 0 TypeScript errors
- npm test: ✅ 45 passing, 0 failing
- Performance: ✅ <300ms response time

## Quality Reviews

### kieran-typescript-reviewer
**Average Score**: 9.5/10
**Reviews**: 3 (domain, application, presentation)
**Issues Found**: 2 minor (both resolved)

### security-sentinel
**Result**: ✅ APPROVED
**Checks**: 100% authentication coverage, no vulnerabilities

### performance-oracle
**Result**: ✅ APPROVED
**Response Time**: <300ms (95th percentile)
**Optimization**: Added caching for payment lookup

## Time Tracking

**Planned**: 5 days (40 hours)
**Actual**: 4.5 days (36 hours)
**Savings**: 0.5 days (4 hours, 10% under)

**Breakdown**:
- Day 0 (Planning): 4 hours
- Day 1 (Domain): 8 hours
- Day 2 (Application): 8 hours
- Day 3 (Presentation): 8 hours
- Day 4 (Testing + Review): 8 hours

## Lessons Learned

**What Worked**:
- ✅ Plan Mode reduced rework from 30-40% → <5%
- ✅ Checkpoint-driven development maintained 9.5/10 quality
- ✅ kieran-typescript-reviewer caught issues early
- ✅ Git worktree NOT used (cross-aggregate dependencies too tight)

**What Could Improve**:
- ⚠️ Cross-aggregate coordination more complex than estimated (+2 hours)
- ⚠️ Event handler idempotency required additional design time (+1 hour)

**For Next Time**:
- Allocate 20% buffer for cross-aggregate features
- Design event handlers earlier in planning phase

## Next Steps

- [x] Create PR with comprehensive description
- [x] Request review from @dev-lead
- [ ] Address PR feedback (if any)
- [ ] Merge to main after approval
- [ ] Deploy to staging
- [ ] Validate in staging (smoke tests)
- [ ] Deploy to production

## References

- Issue: #123
- PR: #456
- Branch: feature/invoice-payment-linking
- Checkpoints: 10 total (day0-plan, day1-start/end, day2-start/end, etc.)
```

**4.2 Sync Final Checkpoint to GitHub**

```bash
./.claude/github/scripts/sync-checkpoint.sh checkpoint-final-complete.md 123
```

**4.3 Update GitHub Issue**

```typescript
mcp__github__update_issue({
  owner: "your-org",
  repo: "vextrus-erp",
  issue_number: 123,
  state: "closed",
  body: `
[Original issue body]

---

## Final Checkpoint

Feature implemented successfully in 4.5 days (10% under estimate)

**Quality Metrics**:
- kieran-typescript-reviewer: 9.5/10
- security-sentinel: ✅ APPROVED
- performance-oracle: ✅ APPROVED
- Tests: 45 passing (92% coverage)

**See**: Full checkpoint in comments below

**PR**: #456
  `
})
```

---

## Git Worktree Integration

**For multi-worktree development**, sync checkpoints from each worktree:

```bash
# In main worktree (~/vextrus-erp)
./.claude/github/scripts/sync-checkpoint.sh checkpoint-main-day2.md 123

# In backend worktree (../vextrus-invoice-backend)
./.claude/github/scripts/sync-checkpoint.sh checkpoint-backend-day2.md 123

# In frontend worktree (../vextrus-invoice-frontend)
./.claude/github/scripts/sync-checkpoint.sh checkpoint-frontend-day2.md 123
```

**Result**: GitHub issue #123 shows progress from all 3 worktrees

---

## Checkpoint File Naming Convention

**Planning**:
- `checkpoint-day0-plan.md` - Initial planning checkpoint

**Daily**:
- `checkpoint-day1-start.md` - Start of day 1
- `checkpoint-day1-end.md` - End of day 1
- `checkpoint-day2-start.md` - Start of day 2
- `checkpoint-day2-end.md` - End of day 2

**Reviews**:
- `checkpoint-review-domain.md` - Domain layer quality review
- `checkpoint-review-security.md` - Security review
- `checkpoint-review-performance.md` - Performance review

**Final**:
- `checkpoint-final-complete.md` - Comprehensive final checkpoint

**Worktree-Specific**:
- `checkpoint-backend-day2.md` - Backend worktree checkpoint
- `checkpoint-frontend-day2.md` - Frontend worktree checkpoint

---

## Best Practices

### Checkpoint Frequency

**Too Infrequent** (<1 per day):
- Lose context between checkpoints
- Hard to track daily progress
- Difficult to identify when issues started

**Too Frequent** (>2 per day):
- Overhead not worth it
- Context switching cost
- Diminishing returns

**Optimal** (2 per day for complex tasks):
- Start-of-day (15-30 min) - Set goals
- End-of-day (30-60 min) - Document accomplishments

### Checkpoint Content

**Always Include**:
- Date, time, branch, issue number
- Accomplishments (what was done)
- Quality metrics (tests, coverage, reviews)
- Next steps (what's coming)
- Blockers (if any)

**Optionally Include**:
- Code snippets (key algorithms)
- Architecture diagrams (for complex features)
- Performance benchmarks
- Lessons learned

**Never Include**:
- Sensitive data (credentials, API keys)
- Customer PII (personal information)
- Complete code dumps (use links instead)

### GitHub Issue Structure

**Issue Body**:
- Goal (what we're building)
- Scope (what's included/excluded)
- Estimated time
- Quality gates
- Dependencies
- Stakeholders

**Issue Comments** (checkpoints):
- Day 0: Planning checkpoint
- Day 1: Start + End checkpoints
- Day 2: Start + End checkpoints
- Day N: Start + End checkpoints
- Reviews: Quality review checkpoints
- Final: Comprehensive final checkpoint

**Issue Labels**:
- `feature` - New functionality
- `finance` / `crm` / etc. - Domain area
- `complex` - Multi-day feature
- `checkpoint-driven` - Using checkpoint workflow

---

## Metrics and Analytics

**From GitHub Issues**:
- Planned vs actual time (estimate accuracy)
- Quality review scores (9.5/10 average target)
- Checkpoint frequency (2 per day optimal)
- Blocker frequency (minimize to <1 per feature)

**From Checkpoints**:
- Daily velocity (tasks completed per day)
- Quality gate pass rate (target 100%)
- Rework percentage (target <5%)
- Test coverage trends (target 90%+)

**Example Analysis** (from 10 complex features):
- Average planned time: 4.2 days
- Average actual time: 3.8 days (10% under estimate)
- Average quality score: 9.5/10
- Average rework: <5%
- Average test coverage: 92%

---

## Troubleshooting

**Checkpoint not syncing?**
```bash
# Check GitHub MCP status
/mcp status

# Enable GitHub MCP
/mcp enable github

# Try sync again
./.claude/github/scripts/sync-checkpoint.sh checkpoint-day2.md 123
```

**GitHub CLI not found?**
```bash
# Install GitHub CLI
# Windows: winget install --id GitHub.cli
# macOS: brew install gh
# Linux: See https://cli.github.com/

# Authenticate
gh auth login
```

**Checkpoint too large for comment?**
- Split into multiple comments
- Link to gist instead
- Summarize in comment, link to full checkpoint in PR

**Lost checkpoint history?**
```bash
# Checkpoints committed to git
git log --all --grep="checkpoint"

# Find checkpoint files
find . -name "checkpoint-*.md"
```

---

## Integration with PR Workflow

**Link checkpoints to PR description**:

```typescript
mcp__github__create_pull_request({
  owner: "your-org",
  repo: "vextrus-erp",
  title: "feat: Complete invoice-payment linking with reconciliation",
  head: "feature/invoice-payment-linking",
  base: "main",
  body: `
Closes #123

## Checkpoints

All checkpoints documented in issue #123:
- [Day 0: Planning](issue-link#comment-1)
- [Day 1: Domain layer complete](issue-link#comment-2)
- [Day 2: Application layer complete](issue-link#comment-4)
- [Day 3: Presentation layer complete](issue-link#comment-6)
- [Day 4: Testing complete](issue-link#comment-8)
- [Final: Feature complete](issue-link#comment-10)

## Quality Reviews
- [x] kieran-typescript-reviewer: 9.5/10 (see checkpoint-review-domain.md)
- [x] security-sentinel: ✅ APPROVED (see checkpoint-review-security.md)
- [x] performance-oracle: ✅ APPROVED (see checkpoint-review-performance.md)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
  `
})
```

---

## See Also

- `.claude/github/workflows/plan-mode-workflow.md` - Systematic planning pattern
- `.claude/github/workflows/git-worktree-automation.md` - Parallel development
- `.claude/github/scripts/sync-checkpoint.sh` - Checkpoint sync script
- `.claude/workflows/checkpoint-driven.md` - Checkpoint-driven development
- `.claude/workflows/complex-task-workflow.md` - Complex task template

---

**Pattern**: Checkpoint → Sync → Review → Continue

**Time Overhead**: 15-60 min per checkpoint (2% of feature time)

**Quality Impact**: 9.5/10 average, <5% rework, proven in production

**Best For**: Complex multi-day features with stakeholder visibility

**Tool Required**: GitHub MCP (enable on-demand: `/mcp enable github`)
