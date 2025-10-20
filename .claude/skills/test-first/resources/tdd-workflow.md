# TDD Workflow (Red-Green-Refactor)

**Purpose**: Test-Driven Development cycle for critical features

---

## Red-Green-Refactor Cycle

```
┌─────────────┐
│     RED     │ ← Write failing test
│  Test fails │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│    GREEN    │ ← Minimal implementation
│  Test passes│
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  REFACTOR   │ ← Improve code quality
│ Tests still │
│    pass     │
└──────┬──────┘
       │
       ↓ (repeat for next feature)
```

---

## Step 1: RED (Write Failing Test)

**Goal**: Define expected behavior before implementation

**Test Structure (AAA Pattern)**:
```typescript
// Arrange - Set up test data
// Act - Execute code under test
// Assert - Verify expected outcome

describe('InvoiceAggregate', () => {
  it('should calculate VAT on subtotal', () => {
    // Arrange
    const invoice = new InvoiceAggregate({
      subtotal: Money.BDT(1000),
      vatRate: 15,
    });

    // Act
    invoice.calculateTax();

    // Assert
    expect(invoice.vat.amount).toBe(150);
    expect(invoice.total.amount).toBe(1150);
  });
});
```

**Run Test**:
```bash
npm test -- invoice.aggregate.spec.ts
```

**Expected**: ❌ Test fails (calculateTax not implemented)

---

## Step 2: GREEN (Minimal Implementation)

**Goal**: Make test pass with simplest code

```typescript
class InvoiceAggregate {
  calculateTax(): void {
    // Simplest implementation to pass test
    this.vat = this.subtotal.multiply(this.vatRate / 100);
    this.total = this.subtotal.add(this.vat);
  }
}
```

**Run Test**:
```bash
npm test -- invoice.aggregate.spec.ts
```

**Expected**: ✅ Test passes

**Don't**: Over-engineer at this stage
- No premature optimization
- No handling edge cases not in test
- No extra features

---

## Step 3: REFACTOR (Improve Quality)

**Goal**: Clean up code while keeping tests green

**Before Refactor**:
```typescript
calculateTax(): void {
  this.vat = this.subtotal.multiply(this.vatRate / 100);
  this.total = this.subtotal.add(this.vat);
}
```

**After Refactor**:
```typescript
calculateTax(): void {
  this.vat = this.calculateVAT();
  this.total = this.calculateTotal();
}

private calculateVAT(): Money {
  if (this.vatRate === 0) {
    return Money.zero(this.currency);
  }
  return this.subtotal.multiply(this.vatRate / 100).round(2);
}

private calculateTotal(): Money {
  return this.subtotal.add(this.vat);
}
```

**Run Test**:
```bash
npm test -- invoice.aggregate.spec.ts
```

**Expected**: ✅ Tests still pass after refactor

**Refactoring Opportunities**:
- Extract methods for clarity
- Add proper error handling
- Improve naming
- Add type safety
- Remove duplication

---

## Step 4: REPEAT (Next Test Case)

Add more test cases for edge cases:

```typescript
describe('InvoiceAggregate tax calculation', () => {
  it('should calculate VAT on subtotal', () => { ... }); // ✅ Already passing

  it('should handle zero VAT rate', () => {
    // NEW TEST (RED)
    const invoice = new InvoiceAggregate({
      subtotal: Money.BDT(1000),
      vatRate: 0,
    });

    invoice.calculateTax();

    expect(invoice.vat.amount).toBe(0);
    expect(invoice.total.amount).toBe(1000);
  });

  it('should round VAT to 2 decimal places', () => {
    // NEW TEST (RED)
    const invoice = new InvoiceAggregate({
      subtotal: Money.BDT(100.33),
      vatRate: 15,
    });

    invoice.calculateTax();

    expect(invoice.vat.amount).toBe(15.05); // Properly rounded
  });

  it('should reject negative VAT rate', () => {
    // NEW TEST (RED)
    const invoice = new InvoiceAggregate({
      subtotal: Money.BDT(1000),
      vatRate: -5,
    });

    expect(() => invoice.calculateTax()).toThrow('VAT rate cannot be negative');
  });
});
```

For each new test: RED → GREEN → REFACTOR

---

## NestJS Testing Setup

### TestingModule Pattern

```typescript
import { Test, TestingModule } from '@nestjs/testing';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: InvoiceRepository,
          useValue: mockInvoiceRepository,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // More tests...
});
```

---

## Mocking Dependencies

### Mock Functions
```typescript
const mockRepository = {
  findById: jest.fn(),
  save: jest.fn(),
};

// In test
mockRepository.findById.mockResolvedValue(invoice);

// Verify call
expect(mockRepository.findById).toHaveBeenCalledWith('invoice-123');
```

### Mock Modules
```typescript
jest.mock('@nestjs/cqrs', () => ({
  CommandBus: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue(result),
  })),
}));
```

---

## TDD Benefits

1. **Confidence**: Tests written first ensure 100% coverage
2. **Design**: Writing tests first improves API design
3. **Regression**: Tests catch bugs immediately
4. **Documentation**: Tests document expected behavior
5. **Refactoring**: Safe refactoring with test safety net

---

## When to Use TDD

**Always**:
- Financial calculations (invoice totals, tax)
- Payment processing
- Data validation critical to business
- Complex business rules

**Sometimes**:
- New features with unclear requirements (TDD helps clarify)
- Bug fixes (write failing test first, then fix)

**Rarely**:
- UI components (can test after)
- Configuration files
- Simple CRUD (test after is fine)

---

## TDD vs Test-After

**TDD (Test-First)**:
- Write test → fails → implement → passes → refactor
- Used for: Critical features (20-25% of tasks)
- Benefit: Design clarity, 100% coverage guaranteed

**Test-After**:
- Implement → write test → verify
- Used for: Most features (75-80% of tasks)
- Benefit: Faster for straightforward requirements

**Both achieve 85%+ coverage, TDD adds extra rigor for critical paths**

---

## Summary

**Red-Green-Refactor Cycle**:
1. RED: Write failing test (define behavior)
2. GREEN: Minimal code to pass (implement)
3. REFACTOR: Improve quality (clean up)
4. REPEAT: Next test case

**Evidence**: Vextrus Finance service 377 tests, 10 features built with TDD, 0 production bugs in financial logic
