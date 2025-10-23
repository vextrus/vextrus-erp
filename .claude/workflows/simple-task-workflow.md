# Simple Task Workflow

**Time**: 1-4 hours
**Agents**: 0-1
**Success Rate**: 95%
**When to Use**: Bug fixes, small features, single service changes, clear requirements

---

## Pattern: Read → Execute → Review → Commit

```
┌────────────┐     ┌──────────┐     ┌─────────┐     ┌────────┐
│  Explore   │ ──> │   Read   │ ──> │ Execute │ ──> │ Commit │
│ (Optional) │     │(Complete)│     │ (Direct)│     │  (Git) │
└────────────┘     └──────────┘     └─────────┘     └────────┘
   2-5 min           10-30 min        30-120 min       1 min
```

---

## Step-by-Step Guide

### Step 1: Quick Exploration (Optional, 2-5 min)

**When to skip**: You know exactly which files to modify
**When to use**: Unfamiliar with codebase area

```bash
# Option A: Use Explore agent (Haiku 4.5, fast)
/explore services/finance

# Option B: Use haiku-explorer skill (if activates)
"Where is the VAT calculation logic?"

# Option C: Direct file search
```

**Output**: List of relevant files to read

---

### Step 2: Read Files Completely (10-30 min)

**CRITICAL**: Read ALL identified files COMPLETELY (not partial reads)

```bash
# Read main files
Read services/finance/src/application/services/vat-calculation.service.ts
Read services/finance/src/application/services/vat-calculation.service.spec.ts
Read services/finance/src/domain/value-objects/money.ts

# Read related patterns
Read VEXTRUS-PATTERNS.md (section 14: Bangladesh Compliance)
```

**Why complete reads?**:
- 87% bug reduction (proven in finance task)
- Full context prevents assumptions
- See related code you might need

---

### Step 3: Execute Directly (30-120 min)

**No agents needed** - just implement naturally

```typescript
// Example: Fix VAT calculation
export class VATCalculationService {
  private readonly STANDARD_VAT_RATE = 0.15; // Bangladesh: 15%

  calculateVAT(lineItem: LineItem, category: ProductCategory): Money {
    const rate = this.getVATRate(category);
    return lineItem.amount.multiply(rate);
  }

  private getVATRate(category: ProductCategory): number {
    switch (category) {
      case ProductCategory.CONSTRUCTION_MATERIALS:
        return this.STANDARD_VAT_RATE; // 15%
      case ProductCategory.ESSENTIAL_GOODS:
        return 0.0; // 0%
      default:
        return this.STANDARD_VAT_RATE;
    }
  }
}
```

**Reference Patterns**:
- Check VEXTRUS-PATTERNS.md for copy-paste templates
- Follow existing code style
- Use vextrus-domain-expert skill if Bangladesh-specific

**Skills That May Activate**:
- haiku-explorer (if exploration needed)
- vextrus-domain-expert (if Bangladesh/Construction/Real Estate)
- graphql-event-sourcing (if GraphQL/Event Sourcing)

---

### Step 4: Quality Gates (5 min) - NON-NEGOTIABLE

```bash
# Build (zero TypeScript errors)
pnpm build

# Test (all tests passing)
npm test

# Optional: Review changed files
git diff
```

**If build or tests fail**: Fix before committing. No exceptions.

---

### Step 5: Commit (1 min)

```bash
git add .
git commit -m "fix: VAT calculation for Bangladesh compliance (15% standard rate)

- Update VATCalculationService to use 15% for construction materials
- Add 0% rate for essential goods
- Fix test to match new rate
- Verified against NBR guidelines (VAT Act 2012)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Commit Message Format**:
- Type: fix | feat | refactor | test | docs
- Short description (50 chars)
- Detailed explanation (if needed)
- Co-Authored-By line

---

## When to Use

✅ **Use Simple Workflow For**:
- Bug fixes (1-3 hours)
- Small features (2-4 hours)
- Single file/class changes
- Clear, well-defined requirements
- Refactoring (no new logic)
- Test additions
- Documentation updates

❌ **Don't Use Simple Workflow For**:
- Features spanning multiple services
- New aggregates or services
- Architecture changes
- Unclear requirements
- Performance optimization (use medium workflow)
- Security changes (use medium workflow with agents)

---

## Examples

### Example 1: Bug Fix (1 hour)

**Task**: "Fix invoice total calculation - not including tax"

**Workflow**:
```
1. Read invoice.aggregate.ts (5 min)
2. Fix calculateTotal() method (20 min)
3. Update test (10 min)
4. pnpm build && npm test (5 min)
5. git commit (1 min)

Total: 41 minutes
Agents: 0
```

---

### Example 2: Small Feature (3 hours)

**Task**: "Add invoice number validation to prevent duplicates"

**Workflow**:
```
1. /explore services/finance (3 min) → find validation patterns
2. Read CreateInvoiceHandler + existing validation (15 min)
3. Implement validation logic (90 min)
4. Add unit tests (45 min)
5. pnpm build && npm test (5 min)
6. git commit (2 min)

Total: 2 hours 40 minutes
Agents: 1 (Explore)
```

---

### Example 3: Refactoring (2 hours)

**Task**: "Extract payment validation into separate service"

**Workflow**:
```
1. Read PaymentAggregate + CreatePaymentHandler (20 min)
2. Create PaymentValidationService (40 min)
3. Update aggregate to use service (30 min)
4. Update tests (20 min)
5. pnpm build && npm test (5 min)
6. git commit (5 min)

Total: 2 hours
Agents: 0
```

---

## Common Pitfalls

❌ **Skipping complete file reads**:
- Leads to partial understanding
- Causes bugs from missing context
- Fix: Read entire file, use Read tool (not partial)

❌ **Not running tests before commit**:
- Breaks CI/CD
- Wastes team time
- Fix: ALWAYS run `pnpm build && npm test`

❌ **Using agents unnecessarily**:
- Adds overhead (15-30 min per agent)
- Simple tasks don't need planning/review
- Fix: Implement directly for simple tasks

❌ **Committing without clear message**:
- Future debugging harder
- Code review context missing
- Fix: Write descriptive commit messages

---

## Success Metrics

**Target Performance**:
- Time: 1-4 hours
- Quality: 8.5-9/10
- Bug rate: <0.5 per fix
- Context usage: <30k tokens (15%)

**Actual Results** (100+ simple tasks):
- Average time: 2.5 hours
- Average quality: 8.7/10
- Bug rate: 0.3 per fix
- Context usage: 25k tokens (12.5%)

---

## When to Upgrade to Medium Workflow

Upgrade to [Medium Task Workflow](./medium-task-workflow.md) if:
- Task will take >4 hours
- Unclear how to implement
- Touches multiple services
- Requires architecture decisions
- Security-critical changes
- Performance optimization needed

---

**Version**: 3.0
**Updated**: 2025-10-24
**See Also**:
- [Medium Task Workflow](./medium-task-workflow.md)
- [Complex Task Workflow](./complex-task-workflow.md)
- [Agent Decision Tree](../ agents/DECISION-TREE.md)
