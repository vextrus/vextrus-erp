# Complex Task Workflow

**Time**: 2-5 days (multi-day)
**Agents**: 5-8
**Success Rate**: 85%
**When to Use**: Major features, system refactoring, multi-service changes, production-critical

---

## Pattern: PLAN → EXECUTE → ASSESS → COMMIT (Checkpoint-Driven)

```
DAY 1: PLAN
┌──────────────────┐     ┌─────────────────────┐
│  Parallel Agents │ ──> │  Implementation Plan│
│   (3-5 agents)   │     │    (TodoWrite: 8-15)│
└──────────────────┘     └─────────────────────┘
    1-3 hours                   30-60 min

DAY 2-3: EXECUTE
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│ Implement Phase │ ──> │ Commit       │ ──> │  Checkpoint │
│   (Systematic)  │     │ (Milestones) │     │  (300-600L) │
└─────────────────┘     └──────────────┘     └─────────────┘
    4-12 hours             Every 2-3 hours         30 min

DAY 4: ASSESS
┌──────────────────┐     ┌──────────────┐
│  Quality Agents  │ ──> │  Fix Issues  │
│   (3-4 agents)   │     │  (Critical)  │
└──────────────────┘     └──────────────┘
    1-2 hours              1-2 hours

DAY 5: COMMIT
┌───────────────────┐     ┌──────────────────┐
│  Final Checkpoint │ ──> │ Comprehensive    │
│  (600 lines)      │     │ Commit Message   │
└───────────────────┘     └──────────────────┘
      30 min                    5 min
```

---

## DAY 1: PLAN (2-4 hours)

### Step 1.1: Parallel Exploration (10-20 min)

**Launch multiple Explore agents in parallel**:

```bash
# In single message, request multiple explorations
"Explore these services in parallel:
- /explore services/finance (payment reconciliation context)
- /explore services/master-data (customer/vendor data)
- /explore services/document-generator (report generation)"
```

**Output**: Files, patterns, and architecture across multiple services

---

### Step 1.2: Planning Agents (Parallel, 1-2 hours)

**Launch 3-5 agents in parallel** (single message):

```
"I need to implement cross-aggregate invoice-payment linking with event-driven coordination.

Analyze in parallel:
1. architecture-strategist: Design the cross-service integration architecture
2. pattern-recognition-specialist: Analyze existing payment and invoice patterns
3. best-practices-researcher: Research event-driven coordination patterns for financial systems
4. graphql-architect: Design federated GraphQL schema for payment-invoice linking
5. data-integrity-guardian: Review data integrity concerns for cross-aggregate linking"
```

**Agent Reports**:
- Review ALL agent findings (30-45 min)
- Take detailed notes
- Identify dependencies
- Note risks and mitigation strategies

---

### Step 1.3: Create Implementation Plan (30-60 min)

**Use TodoWrite** to create systematic plan (8-15 items):

```markdown
## Implementation Plan: Invoice-Payment Linking

1. Phase 1: Domain Events (Day 1)
   - [ ] Add InvoicePaymentLinked event
   - [ ] Add PaymentAllocated event
   - [ ] Update event schemas

2. Phase 2: Aggregate Updates (Day 2)
   - [ ] Update Invoice aggregate with payment linking
   - [ ] Update Payment aggregate with invoice allocation
   - [ ] Add validation rules

3. Phase 3: Projection Handlers (Day 2)
   - [ ] Create InvoicePaymentProjectionHandler
   - [ ] Update InvoiceProjection schema
   - [ ] Add cache invalidation

4. Phase 4: GraphQL Schema (Day 3)
   - [ ] Add payment field to Invoice type
   - [ ] Add invoices field to Payment type
   - [ ] Add linking mutation

5. Phase 5: Tests (Day 3)
   - [ ] Unit tests for aggregates
   - [ ] Integration tests for handlers
   - [ ] E2E tests for GraphQL

6. Phase 6: Quality Review (Day 4)
   - [ ] kieran-typescript-reviewer
   - [ ] security-sentinel
   - [ ] performance-oracle

7. Phase 7: Checkpoint & Documentation (Day 5)
```

---

## DAY 2-3: EXECUTE (1-2 days)

### Step 2.1: Read ALL Identified Files (1-2 hours)

**Based on planning phase**, read completely:

```bash
# Invoice aggregate and related
Read services/finance/src/domain/aggregates/invoice/invoice.aggregate.ts
Read services/finance/src/domain/aggregates/invoice/events/invoice-created.event.ts

# Payment aggregate and related
Read services/finance/src/domain/aggregates/payment/payment.aggregate.ts
Read services/finance/src/application/handlers/payment-projection.handler.ts

# GraphQL schemas
Read services/finance/src/presentation/graphql/schema.graphql

# Patterns
Read VEXTRUS-PATTERNS.md (Event Sourcing, GraphQL Federation, Multi-Tenancy)
```

---

### Step 2.2: Implement Systematically (Following Plan)

**Work through TodoWrite list systematically**:

```typescript
// Phase 1: Domain Events
export class InvoicePaymentLinkedEvent implements DomainEvent {
  readonly eventType = 'InvoicePaymentLinked';
  readonly version = 1;
  readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string, // invoiceId
    public readonly tenantId: string,
    public readonly data: {
      paymentId: string;
      allocatedAmount: number;
      remainingAmount: number;
      linkDate: Date;
    },
  ) {
    this.occurredOn = new Date();
  }
}

// Phase 2: Aggregate Updates
export class Invoice extends AggregateRoot {
  // ... existing code ...

  linkPayment(paymentId: PaymentId, amount: Money): void {
    // Validation
    if (this.status === InvoiceStatus.CANCELLED) {
      throw new InvalidInvoiceStatusException('Cannot link payment to cancelled invoice');
    }

    const remainingAmount = this.getOutstandingAmount();
    if (amount.isGreaterThan(remainingAmount)) {
      throw new PaymentExceedsOutstandingAmountException();
    }

    // Apply event
    this.apply(
      new InvoicePaymentLinkedEvent(
        this.id.value,
        this.tenantId.value,
        {
          paymentId: paymentId.value,
          allocatedAmount: amount.amount,
          remainingAmount: remainingAmount.subtract(amount).amount,
          linkDate: new Date(),
        },
      ),
    );
  }

  private onInvoicePaymentLinkedEvent(event: InvoicePaymentLinkedEvent): void {
    // Update read model will be handled by projection handler
  }
}
```

---

### Step 2.3: Commit After Each Major Milestone (Every 2-3 hours)

```bash
# After Phase 1
git add .
git commit -m "feat: Add invoice-payment linking events

- Add InvoicePaymentLinkedEvent
- Add PaymentAllocatedEvent
- Version 1 schemas

Co-Authored-By: Claude <noreply@anthropic.com>"

# After Phase 2
git commit -m "feat: Update Invoice and Payment aggregates with linking logic"

# After Phase 3
git commit -m "feat: Add projection handlers for invoice-payment linking"

# After Phase 4
git commit -m "feat: Add GraphQL schema for invoice-payment relationships"

# After Phase 5
git commit -m "test: Add comprehensive tests for invoice-payment linking"
```

**Why frequent commits**:
- Checkpoint every 2-3 hours of work
- Easy rollback if needed
- Clear progress tracking
- Better git history

---

### Step 2.4: Create Phase Checkpoint (After major phase, 30 min)

**See [Checkpoint-Driven Development](./checkpoint-driven.md) for full guide**

Quick checkpoint file (300-600 lines):

```markdown
# Phase 2 Complete: Invoice-Payment Linking

## Summary
- Added 2 domain events (InvoicePaymentLinked, PaymentAllocated)
- Updated Invoice + Payment aggregates (linking logic)
- Added projection handlers (3 handlers)
- Updated GraphQL schema (2 new fields, 1 mutation)
- Added 45 tests (100% passing)

## Files Created (8)
1. invoice-payment-linked.event.ts (85 lines)
2. payment-allocated.event.ts (75 lines)
[... list all files ...]

## Files Modified (12)
1. invoice.aggregate.ts (+120 lines) - Added linkPayment method
2. payment.aggregate.ts (+95 lines) - Added allocate method
[... list all changes ...]

## Quality Gates ✅
- [x] Build passing (zero errors)
- [x] Tests passing (422/422)
- [x] Pattern consistency: 100%
- [x] Multi-tenant isolation: Verified

## Next Phase Plan
**Phase 3**: GraphQL API + E2E tests
**Estimated**: 8 hours
**Load this checkpoint**: Read this file for context
```

---

## DAY 4: ASSESS (1-2 hours)

### Step 3.1: Launch Quality Agents (Parallel, 45-60 min)

**Launch 3-4 review agents in parallel**:

```
"Review the complete invoice-payment linking implementation with these agents in parallel:

1. kieran-typescript-reviewer: Review all TypeScript code for quality (MANDATORY)
2. security-sentinel: Audit for security issues, especially multi-tenant isolation
3. performance-oracle: Analyze query performance and caching effectiveness
4. data-integrity-guardian: Verify event schemas and projection correctness"
```

**Review Agent Reports**:
- Identify critical issues (security, bugs)
- Note optimization suggestions
- Document decisions

---

### Step 3.2: Fix Critical Issues (1-2 hours)

**Address HIGH priority findings**:

```typescript
// Example: security-sentinel found missing tenant check
// BEFORE (vulnerable)
async linkPayment(invoiceId: string, paymentId: string) {
  const invoice = await this.invoiceRepository.findById(invoiceId);
  const payment = await this.paymentRepository.findById(paymentId);
  invoice.linkPayment(payment.id, payment.amount);
}

// AFTER (secure)
async linkPayment(invoiceId: string, paymentId: string, tenantId: string) {
  const invoice = await this.invoiceRepository.findById(invoiceId);
  const payment = await this.paymentRepository.findById(paymentId);

  // CRITICAL: Verify both belong to same tenant
  if (invoice.tenantId !== tenantId || payment.tenantId !== tenantId) {
    throw new ForbiddenException('Cross-tenant operation not allowed');
  }

  invoice.linkPayment(payment.id, payment.amount);
}
```

**Commit fixes**:

```bash
git commit -m "fix: Add tenant isolation checks to invoice-payment linking

Security fix based on security-sentinel review:
- Add tenant validation in linkPayment command handler
- Verify invoice and payment belong to same tenant
- Add tests for cross-tenant attack prevention

Reviewed-by: security-sentinel

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## DAY 5: CHECKPOINT + COMMIT (30-60 min)

### Step 4.1: Create Final Checkpoint (30 min)

**Comprehensive checkpoint** (600 lines):

```markdown
# Invoice-Payment Linking Feature COMPLETE

## Executive Summary
Complete implementation of automatic invoice-payment linking with event-driven coordination across Invoice and Payment aggregates.

## Feature Scope
- Cross-aggregate linking (Invoice ↔ Payment)
- Event-driven coordination (2 new events)
- GraphQL Federation support (federated entities)
- Multi-tenant isolation (5-layer verified)
- Real-time updates via subscriptions

## Implementation Details

### Domain Events (2 new)
1. InvoicePaymentLinkedEvent (v1)
2. PaymentAllocatedEvent (v1)

### Aggregates Modified (2)
1. Invoice: Added linkPayment(), unlinkPayment(), getOutstandingAmount()
2. Payment: Added allocateToInvoice(), deallocate()

### GraphQL Schema Changes
```graphql
type Invoice @key(fields: "id") {
  id: ID!
  payments: [Payment!]! # NEW
  paidAmount: Float!     # NEW
  outstandingAmount: Float! # NEW
}

type Payment @key(fields: "id") {
  id: ID!
  invoices: [Invoice!]! # NEW
  allocations: [PaymentAllocation!]! # NEW
}

type Mutation {
  linkInvoicePayment(input: LinkInvoicePaymentInput!): LinkInvoicePaymentPayload! # NEW
}
```

### Tests Added (45)
- Unit tests: 25 (100% coverage on domain layer)
- Integration tests: 15
- E2E tests: 5

### Performance Metrics
- Invoice query with payments: <150ms (cached)
- Payment linking mutation: <200ms
- Multi-tenant queries: <180ms (verified isolation)

### Security Review
- ✅ Multi-tenant isolation: 100% (verified by security-sentinel)
- ✅ Authentication: 100% coverage (no @Public())
- ✅ Input validation: All mutations validated
- ✅ Cross-tenant attacks: Prevented and tested

### Files Created (12)
1. invoice-payment-linked.event.ts (85 lines)
2. payment-allocated.event.ts (75 lines)
3. link-invoice-payment.command.ts (65 lines)
4. link-invoice-payment.handler.ts (140 lines)
5. invoice-payment-projection.handler.ts (180 lines)
[... complete list ...]

### Files Modified (18)
1. invoice.aggregate.ts (+245 lines)
2. payment.aggregate.ts (+198 lines)
3. invoice.resolver.ts (+85 lines)
[... complete list ...]

## Quality Gates ✅
- [x] Build passing (zero TypeScript errors)
- [x] Tests passing (467/467, was 422)
- [x] Coverage: 92% (domain layer)
- [x] Pattern consistency: 100% (Event Sourcing + CQRS)
- [x] Multi-tenant isolation: Verified (5-layer)
- [x] GraphQL Federation: Compliant (v2)
- [x] Performance: <300ms (all operations)

## Agent Reviews ✅
- [x] kieran-typescript-reviewer: Quality 9.5/10
- [x] security-sentinel: No vulnerabilities found
- [x] performance-oracle: Performance acceptable
- [x] data-integrity-guardian: Events schema valid

## Learnings & Patterns
1. Cross-aggregate linking requires careful event design
2. Multi-tenant validation MUST occur at command handler level
3. GraphQL Federation v2 @key directive on linked entities
4. Projection handlers need cache invalidation for both aggregates

## Next Steps
- [ ] Add payment reconciliation (builds on this)
- [ ] Add payment allocation reports
- [ ] Add automated payment matching

## Session Resume Guide
**To continue work**: Read this checkpoint file first (full context in 5 min)
**Context files**: VEXTRUS-PATTERNS.md (Event Sourcing, GraphQL)
**Related services**: finance (primary), document-generator (reports)
```

**Save checkpoint**:

```bash
mv checkpoint.md sessions/tasks/done/invoice-payment-linking-COMPLETE-2025-10-24.md
```

---

### Step 4.2: Final Comprehensive Commit (5 min)

```bash
git add .
git commit -m "feat: Complete invoice-payment linking feature

SUMMARY:
Complete implementation of automatic invoice-payment linking with event-driven coordination.

FEATURES:
- Cross-aggregate linking (Invoice ↔ Payment)
- Event-driven coordination (InvoicePaymentLinkedEvent, PaymentAllocatedEvent)
- GraphQL Federation support (linked entities via @key)
- Multi-tenant isolation (5-layer, 100% verified)
- Real-time updates (GraphQL subscriptions)

IMPLEMENTATION:
- 2 new domain events (versioned v1)
- 2 aggregates updated (Invoice, Payment)
- 3 new command handlers
- 3 new projection handlers
- GraphQL schema extended (2 types, 1 mutation)
- 45 tests added (467 total, 100% passing)
- 12 files created, 18 files modified

QUALITY:
- Build: ✅ Zero errors
- Tests: ✅ 467/467 passing
- Coverage: ✅ 92% (domain layer)
- Security: ✅ No vulnerabilities (security-sentinel)
- Performance: ✅ <300ms all operations
- Pattern consistency: ✅ 100%

REVIEWS:
- kieran-typescript-reviewer: Quality 9.5/10
- security-sentinel: No vulnerabilities found
- performance-oracle: Performance acceptable (<300ms)
- data-integrity-guardian: Event schemas valid

METRICS:
- Time: 3.5 days (planned 3-4 days)
- Quality: 9.5/10
- Bugs: 0
- Rework: <2%

Phase Complete (100%)
Checkpoint: sessions/tasks/done/invoice-payment-linking-COMPLETE-2025-10-24.md

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## When to Use

✅ **Use Complex Workflow For**:
- Multi-day features (>8 hours)
- Cross-service integration (2+ services)
- Major architecture changes
- System refactoring
- Production-critical features
- Features requiring parallel development

❌ **Don't Use Complex Workflow For**:
- Simple bugs/features (<4 hours)
- Single service changes
- Clear, straightforward implementations
- When checkpoint overhead > benefit

---

## Git Worktree for Parallel Development

**See [Git Worktree Parallel](./git-worktree-parallel.md) for full guide**

**When to use**: Complex task can be split into independent sub-tasks (backend + frontend + tests)

**Benefits**: 2-5x wall-clock speedup with parallel Claude instances

---

## Success Metrics

**Target** (based on finance task):
- Time: 2-5 days
- Quality: 9-9.5/10
- Bug rate: <0.1 per feature
- Rework: <5%
- Test coverage: 90%+ (domain layer)
- Pattern consistency: 100%

**Actual Results** (10+ complex tasks):
- Average time: 3.5 days
- Average quality: 9.3/10
- Bug rate: 0.08 per feature
- Rework: 3.2%
- Test coverage: 91% (domain layer)
- Pattern consistency: 98%

---

**Version**: 3.0
**Updated**: 2025-10-24
**See Also**:
- [Checkpoint-Driven Development](./checkpoint-driven.md)
- [Git Worktree Parallel Development](./git-worktree-parallel.md)
- [Agent Directory](../agents/AGENT-DIRECTORY.md)
