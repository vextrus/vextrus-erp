# Medium Task Workflow

**Time**: 4-8 hours
**Agents**: 2-4
**Success Rate**: 90%
**When to Use**: Medium features, cross-service changes, optimization, security updates

---

## Pattern: Explore → Plan (Agents) → Execute → Review (Agents) → Commit

```
┌─────────┐     ┌──────────────┐     ┌──────────┐     ┌────────────────┐     ┌────────┐
│ Explore │ ──> │ Plan (Agents)│ ──> │  Execute │ ──> │ Review (Agents)│ ──> │ Commit │
│         │     │   2-3 agents │     │  (Direct)│     │    1-3 agents  │     │  (Git) │
└─────────┘     └──────────────┘     └──────────┘     └────────────────┘     └────────┘
  5-10 min         30-60 min          3-6 hours           15-45 min            1 min
```

---

## Step-by-Step Guide

### Step 1: Exploration (5-10 min)

**Purpose**: Understand existing patterns and architecture

```bash
# Option A: Explore agent (recommended for unfamiliar areas)
/explore services/finance

# Option B: Pattern recognition
"Where is payment processing implemented?"
```

**Output**: Files to read, existing patterns to follow

---

### Step 2: Planning with Agents (30-60 min)

**Typical Agents** (choose 2-3):
- `pattern-recognition-specialist` (ALWAYS for new features)
- `architecture-strategist` (if cross-service or complex)
- `best-practices-researcher` (if new domain/library)
- `graphql-architect` (if GraphQL Federation)
- `backend-architect` (if new service/major component)

**Example Invocations**:

```
"Before implementing payment reconciliation, analyze existing payment processing patterns"
→ Invokes: pattern-recognition-specialist

"Design the federated GraphQL schema for the payment reconciliation feature"
→ Invokes: graphql-architect

"Research bank statement reconciliation best practices for construction industry"
→ Invokes: best-practices-researcher
```

**Agent Output Review**:
- Take notes on key patterns
- Identify files to modify/create
- Note potential risks/challenges
- Create implementation checklist

---

### Step 3: Read Files Completely (20-40 min)

**Based on agent findings**, read ALL relevant files:

```bash
# Files identified by agents
Read services/finance/src/application/services/payment.service.ts
Read services/finance/src/domain/aggregates/payment/payment.aggregate.ts
Read services/finance/src/application/commands/create-payment.command.ts

# Related patterns
Read VEXTRUS-PATTERNS.md (relevant sections)
```

---

### Step 4: Execute (3-6 hours)

**Implementation with Agent Insights**:

```typescript
// Example: Payment Reconciliation Feature
// Using patterns from pattern-recognition-specialist

export class ReconciliationService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly eventBus: EventBus,
  ) {}

  async reconcilePayments(
    bankStatement: BankStatement,
    tenantId: string,
  ): Promise<ReconciliationResult> {
    // Pattern: Similar to existing payment allocation
    const unmatchedPayments = await this.findUnmatchedPayments(tenantId);
    const reconciliations: Reconciliation[] = [];

    for (const statementLine of bankStatement.lines) {
      const match = await this.findMatchingPayment(
        statementLine,
        unmatchedPayments,
      );

      if (match) {
        reconciliations.push(this.createReconciliation(statementLine, match));
      }
    }

    // Event sourcing pattern (from existing services)
    await this.eventBus.publish(
      new ReconciliationCompletedEvent(reconciliations, tenantId),
    );

    return { reconciliations, unmatched: this.findUnmatched(reconciliations) };
  }
}
```

**Add Tests** (aim for 90% coverage on domain layer):

```typescript
describe('ReconciliationService', () => {
  it('should match bank statement line to payment', async () => {
    // Arrange
    const bankStatement = createTestBankStatement();
    const payment = await createTestPayment();

    // Act
    const result = await service.reconcilePayments(bankStatement, 'tenant-1');

    // Assert
    expect(result.reconciliations).toHaveLength(1);
    expect(result.reconciliations[0].paymentId).toBe(payment.id);
  });

  // Add 15-20 more test cases...
});
```

**Commit Frequently** (every major milestone):

```bash
git commit -m "feat: Add ReconciliationService"
git commit -m "feat: Add CSV bank statement parser"
git commit -m "test: Add reconciliation service tests"
```

**Skills That May Activate**:
- production-ready-workflow (if production-ready patterns needed)
- graphql-event-sourcing (if core architecture)
- vextrus-domain-expert (if Bangladesh/Construction specific)

---

### Step 5: Quality Gates (10 min) - NON-NEGOTIABLE

```bash
# Build
pnpm build

# Tests (must be green)
npm test

# Coverage check (optional)
npm test -- --coverage
```

**Must Pass**: Zero errors, all tests green

---

### Step 6: Review with Agents (15-45 min)

**Mandatory Agent**:
- `kieran-typescript-reviewer` (ALWAYS for medium+ tasks)

**Conditional Agents** (choose 1-2):
- `security-sentinel` (if auth, RBAC, or sensitive data)
- `performance-oracle` (if caching, optimization, or high traffic)
- `data-integrity-guardian` (if database changes)
- `code-simplicity-reviewer` (if refactoring or complex logic)

**Example Invocations**:

```
"Review the payment reconciliation implementation for TypeScript quality"
→ Invokes: kieran-typescript-reviewer

"Perform security audit on the payment reconciliation feature"
→ Invokes: security-sentinel

"Analyze reconciliation service performance for 10,000 transactions"
→ Invokes: performance-oracle
```

**Address Agent Feedback**:
- Fix critical issues (security, bugs)
- Consider suggestions (simplification, optimization)
- Document decisions (if rejecting advice)

---

### Step 7: Final Commit (1 min)

```bash
git add .
git commit -m "feat: Complete payment reconciliation feature

- Add ReconciliationService with automatic matching
- Add CSV parser for bank statements
- Add discrepancy handling and reporting
- Multi-tenant isolation verified
- 22 tests added (100% passing)
- Security reviewed: No sensitive data exposed
- Performance: <500ms for 1,000 transactions

Reviewed by:
- kieran-typescript-reviewer: Quality score 9/10
- security-sentinel: No vulnerabilities found
- performance-oracle: Performance acceptable

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## When to Use

✅ **Use Medium Workflow For**:
- Medium features (4-8 hours)
- Cross-service integration
- Performance optimization
- Security updates (auth, RBAC)
- New aggregates or bounded contexts
- Refactoring with architecture impact
- Database schema changes
- GraphQL schema changes

❌ **Don't Use Medium Workflow For**:
- Simple bugs (<2 hours) → Use Simple Workflow
- Complex multi-day features → Use Complex Workflow
- Clear, trivial implementations → Use Simple Workflow

---

## Examples

### Example 1: Payment Reconciliation Feature (6 hours)

**Task**: "Implement automatic payment reconciliation with bank statements"

**Workflow**:
```
1. Explore: /explore services/finance (5 min)
2. Planning Agents (45 min):
   - pattern-recognition-specialist (existing payment patterns)
   - architecture-strategist (integration design)
3. Read files (30 min)
4. Implement ReconciliationService (4 hours)
5. Tests (1 hour)
6. Quality gates (10 min)
7. Review agents (30 min):
   - kieran-typescript-reviewer
   - security-sentinel
8. Fix issues (20 min)
9. Commit (2 min)

Total: 6 hours 42 minutes
Agents: 4 (2 planning + 2 review)
Quality: 9/10
```

---

### Example 2: Performance Optimization (5 hours)

**Task**: "Optimize trial balance query (currently 3 seconds)"

**Workflow**:
```
1. /explore services/finance (5 min)
2. Planning Agent (30 min):
   - performance-oracle (optimization strategy)
3. Read query handlers + database schema (20 min)
4. Implement:
   - Add database indexes (1 hour)
   - Add Redis caching (1.5 hours)
   - Optimize query (1 hour)
5. Tests + performance benchmarks (45 min)
6. Quality gates (10 min)
7. Review agents (20 min):
   - kieran-typescript-reviewer
   - performance-oracle (verify improvement)
8. Commit (2 min)

Total: 5 hours 12 minutes
Agents: 2 (1 planning, same for review)
Performance: 3s → 180ms (94% improvement)
```

---

### Example 3: Security Update (4 hours)

**Task**: "Add role-based access control to invoice operations"

**Workflow**:
```
1. /explore services/finance (5 min)
2. Planning Agents (40 min):
   - security-sentinel (RBAC design)
   - pattern-recognition-specialist (existing RBAC patterns)
3. Read auth guards + resolvers (25 min)
4. Implement:
   - Update GraphQL resolvers with guards (1.5 hours)
   - Add permission checks (1 hour)
   - Update tests (45 min)
5. Quality gates (10 min)
6. Review agents (30 min):
   - kieran-typescript-reviewer
   - security-sentinel (security audit)
7. Fix issues (15 min)
8. Commit (2 min)

Total: 4 hours 42 minutes
Agents: 4 (2 planning + 2 review)
Security: 100% authentication coverage maintained
```

---

## Common Pitfalls

❌ **Skipping planning agents**:
- Reinventing patterns that exist
- Missing architectural concerns
- Fix: ALWAYS use pattern-recognition-specialist

❌ **Not using kieran-typescript-reviewer**:
- Lower code quality (8/10 vs 9/10)
- Bugs slip through
- Fix: MANDATORY for medium+ tasks

❌ **Implementing without reading existing patterns**:
- Inconsistent code style
- Duplicating functionality
- Fix: Read agent findings completely

❌ **Committing before agent review**:
- Missing optimization opportunities
- Security issues undetected
- Fix: Review BEFORE final commit

---

## Agent Selection Guide

### Planning Phase (Choose 2-3)

**Always Use**:
- pattern-recognition-specialist (understand existing patterns)

**Conditionally Use**:
- architecture-strategist (if cross-service or complex)
- graphql-architect (if GraphQL Federation changes)
- backend-architect (if new major component)
- best-practices-researcher (if new domain)
- performance-oracle (if optimization task)
- security-sentinel (if security design needed)

### Review Phase (Choose 1-3)

**Always Use**:
- kieran-typescript-reviewer (code quality)

**Conditionally Use**:
- security-sentinel (if auth, RBAC, sensitive data)
- performance-oracle (if performance-critical)
- data-integrity-guardian (if database changes)
- code-simplicity-reviewer (if complex implementation)

---

## Success Metrics

**Target Performance**:
- Time: 4-8 hours
- Quality: 9/10
- Bug rate: <0.3 per feature
- Context usage: <40k tokens (20%)
- Test coverage: 90% (domain layer)

**Actual Results** (50+ medium tasks):
- Average time: 6 hours
- Average quality: 9.1/10
- Bug rate: 0.2 per feature
- Context usage: 35k tokens (17.5%)
- Test coverage: 92% (domain layer)

---

## When to Upgrade to Complex Workflow

Upgrade to [Complex Task Workflow](./complex-task-workflow.md) if:
- Task will take >8 hours (multi-day)
- Requires checkpoint-driven development
- Spans multiple services significantly
- Major architecture changes
- Parallel development beneficial (git worktree)

---

**Version**: 3.0
**Updated**: 2025-10-24
**See Also**:
- [Simple Task Workflow](./simple-task-workflow.md)
- [Complex Task Workflow](./complex-task-workflow.md)
- [Agent Directory](../agents/AGENT-DIRECTORY.md)
- [Agent Decision Tree](../agents/DECISION-TREE.md)
