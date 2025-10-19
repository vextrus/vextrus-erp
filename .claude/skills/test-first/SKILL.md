---
name: Test First
description: When implementing critical features, financial calculations, or business logic, activate this skill to enforce test-driven development. Use when user says "test", "TDD", "test-driven", or when implementing features that need high reliability. Ensures tests are written before implementation code.
---

# Test First Skill

## Purpose
Enforce **test-driven development (TDD)** for critical features requiring high reliability.

## Activation Triggers
- User says: "test", "TDD", "test-driven", "write tests"
- Critical features: Financial calculations, payment processing, data validation
- Business logic: Invoice totals, tax calculations, currency conversion
- High-risk changes: Authentication, authorization, data integrity

## TDD Workflow

### Red-Green-Refactor Cycle
```
1. [RED]    Write failing test
2. [GREEN]  Write minimal code to pass
3. [REFACTOR] Improve code quality
4. [REPEAT] Next test
```

### Step-by-Step Pattern
```
1. [TodoWrite: TDD items]
   - Write test for [feature]
   - Implement [feature]
   - Refactor [feature]
   - Verify all tests pass

2. [Write test file]
   describe('InvoiceAggregate', () => {
     it('should calculate total with tax', () => {
       // Arrange, Act, Assert
     });
   });

3. [Bash: npm test]
   → Test fails (RED) ✓

4. [Write implementation]
   calculateTotal() {
     // Minimal code to pass test
   }

5. [Bash: npm test]
   → Test passes (GREEN) ✓

6. [Refactor if needed]
   → Improve code quality

7. [Bash: npm test]
   → Still passes ✓
```

---

## Test Structure (AAA Pattern)

```typescript
describe('Feature', () => {
  it('should do something specific', () => {
    // Arrange - Set up test data
    const input = createTestData();

    // Act - Execute the code under test
    const result = functionUnderTest(input);

    // Assert - Verify expected outcome
    expect(result).toEqual(expected);
  });
});
```

---

## When to Use TDD

### Always Use TDD For:
- ✅ Financial calculations (invoice totals, taxes)
- ✅ Payment processing
- ✅ Data validation and sanitization
- ✅ Business rules and logic
- ✅ Security-critical features
- ✅ API contracts and integrations

### Optional TDD For:
- 🟡 UI components (can test after)
- 🟡 Configuration files
- 🟡 Simple CRUD operations
- 🟡 Styling and layout

### Skip TDD For:
- ❌ Prototypes and spike solutions
- ❌ One-time scripts
- ❌ Documentation updates
- ❌ Configuration changes

---

## Test Coverage Goals

**Vextrus ERP Standards**:
- Critical paths: 100% coverage
- Business logic: 90%+ coverage
- API endpoints: 85%+ coverage
- Overall: 80%+ coverage

Check coverage:
```bash
npm test -- --coverage
```

---

## Integration with Execute First

TDD modifies the Execute First workflow:

### Execute First (Default)
```
1. TodoWrite
2. Implement code
3. Write tests
4. Verify
```

### Test First (Critical Features)
```
1. TodoWrite (TDD steps)
2. Write failing test (RED)
3. Implement minimal code (GREEN)
4. Refactor
5. Repeat
```

---

## Example: Invoice Tax Calculation

```typescript
// 1. RED - Write failing test
describe('Invoice Tax Calculation', () => {
  it('should apply 10% tax to subtotal', () => {
    const invoice = new Invoice({ subtotal: 100 });

    invoice.applyTax(10);

    expect(invoice.total).toBe(110);
    expect(invoice.tax).toBe(10);
  });
});

// 2. GREEN - Minimal implementation
class Invoice {
  applyTax(rate: number) {
    this.tax = this.subtotal * (rate / 100);
    this.total = this.subtotal + this.tax;
  }
}

// 3. REFACTOR - Improve if needed
class Invoice {
  applyTax(rate: number): void {
    if (rate < 0 || rate > 100) {
      throw new Error('Invalid tax rate');
    }
    this.tax = this.calculateTax(rate);
    this.total = this.subtotal + this.tax;
  }

  private calculateTax(rate: number): number {
    return Number((this.subtotal * (rate / 100)).toFixed(2));
  }
}
```

---

## Testing Framework Quick Reference

### Jest/Vitest (Vextrus ERP)
```typescript
describe('Group tests', () => {
  beforeEach(() => { /* Setup */ });
  afterEach(() => { /* Cleanup */ });

  it('should do something', () => {
    expect(actual).toBe(expected);
  });

  it.skip('temporarily disabled', () => {});

  it.only('focus on this test', () => {});
});
```

### Common Assertions
```typescript
expect(value).toBe(expected);           // Strict equality
expect(value).toEqual(expected);        // Deep equality
expect(value).toBeDefined();
expect(value).toBeTruthy();
expect(array).toContain(item);
expect(fn).toThrow(Error);
expect(fn).toHaveBeenCalledWith(arg);
```

---

## Test Doubles (Mocks, Stubs, Spies)

### Mock External Dependencies
```typescript
// Mock external service
const mockMasterDataClient = {
  getCurrency: jest.fn().mockResolvedValue({
    code: 'USD',
    rate: 1.0
  })
};

// Use in test
it('should fetch currency data', async () => {
  const result = await service.convert(100, 'USD');

  expect(mockMasterDataClient.getCurrency)
    .toHaveBeenCalledWith('USD');
});
```

---

## Success Criteria
- ✅ Test written before implementation
- ✅ Test fails initially (RED)
- ✅ Implementation makes test pass (GREEN)
- ✅ Code refactored for quality
- ✅ All tests pass
- ✅ Coverage meets standards (80%+)

---

## Override

Skip TDD if user explicitly says:
- "skip tests for now"
- "prototype only"
- "just implement it quickly"

**Default for critical features**: TEST FIRST
