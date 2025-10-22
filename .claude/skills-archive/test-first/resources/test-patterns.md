# Test Patterns for NestJS

**Purpose**: Common testing patterns and best practices

---

## Pattern 1: AAA (Arrange-Act-Assert)

**Structure**: Every test follows same pattern

```typescript
describe('Invoice tax calculation', () => {
  it('should apply 15% VAT to subtotal', () => {
    // === ARRANGE === Set up test data
    const invoice = new InvoiceAggregate({
      subtotal: Money.BDT(1000),
      vatRate: 15,
    });

    // === ACT === Execute the code under test
    invoice.calculateTax();

    // === ASSERT === Verify expected outcome
    expect(invoice.vat.amount).toBe(150);
    expect(invoice.total.amount).toBe(1150);
  });
});
```

**Benefits**:
- Consistent structure
- Easy to read
- Clear test intent

---

## Pattern 2: Mocking with jest.fn()

**Purpose**: Mock functions for isolation

```typescript
// Create mock
const mockRepository = {
  findById: jest.fn(),
  save: jest.fn(),
};

// Setup return value
mockRepository.findById.mockResolvedValue(invoice);

// Execute
await service.approveInvoice('invoice-123');

// Verify call
expect(mockRepository.findById).toHaveBeenCalledWith('invoice-123');
expect(mockRepository.findById).toHaveBeenCalledTimes(1);

// Verify save called with correct data
expect(mockRepository.save).toHaveBeenCalledWith(
  expect.objectContaining({ status: InvoiceStatus.APPROVED })
);
```

---

## Pattern 3: Mocking Modules with jest.mock()

**Purpose**: Mock entire modules

```typescript
// Mock @nestjs/cqrs
jest.mock('@nestjs/cqrs', () => ({
  CommandBus: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({ id: 'invoice-123' }),
  })),
  QueryBus: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({ invoices: [] }),
  })),
}));

// Mock external service
jest.mock('@/services/master-data-client', () => ({
  MasterDataClient: jest.fn().mockImplementation(() => ({
    getCurrency: jest.fn().mockResolvedValue({ code: 'BDT', rate: 1.0 }),
  })),
}));
```

---

## Pattern 4: Test Fixtures

**Purpose**: Reusable test data

```typescript
// fixtures/invoice.fixture.ts
export const invoiceFixture = {
  pending: (): Invoice => ({
    id: 'invoice-123',
    customerId: 'customer-456',
    subtotal: Money.BDT(1000),
    vatRate: 15,
    status: InvoiceStatus.PENDING,
    lineItems: [
      { amount: Money.BDT(1000), description: 'Consulting' },
    ],
  }),

  approved: (): Invoice => ({
    ...invoiceFixture.pending(),
    status: InvoiceStatus.APPROVED,
    approvedBy: 'user-789',
    approvedAt: new Date('2025-01-01'),
  }),

  withVAT: (vatRate: number): Invoice => ({
    ...invoiceFixture.pending(),
    vatRate,
  }),
};

// Usage in tests
const invoice = invoiceFixture.pending();
const approvedInvoice = invoiceFixture.approved();
const highVATInvoice = invoiceFixture.withVAT(25);
```

---

## Pattern 5: Async Testing Patterns

**Promise-based**:
```typescript
it('should create invoice', async () => {
  const invoice = await service.createInvoice(command);
  expect(invoice.id).toBeDefined();
});
```

**Callback-based** (rare in NestJS):
```typescript
it('should call callback', (done) => {
  service.processInvoice((result) => {
    expect(result.success).toBe(true);
    done();
  });
});
```

**Expect async throws**:
```typescript
it('should throw error for invalid invoice', async () => {
  await expect(
    service.approveInvoice('invalid-id')
  ).rejects.toThrow('Invoice not found');
});
```

---

## Pattern 6: beforeEach/afterEach

**Purpose**: Setup and teardown

```typescript
describe('InvoiceService', () => {
  let service: InvoiceService;
  let repository: InvoiceRepository;

  beforeEach(async () => {
    // Runs before EACH test
    const module = await Test.createTestingModule({
      providers: [InvoiceService, mockRepository],
    }).compile();

    service = module.get(InvoiceService);
    repository = module.get(InvoiceRepository);
  });

  afterEach(async () => {
    // Runs after EACH test
    jest.clearAllMocks();
  });

  it('test 1', () => { ... });
  it('test 2', () => { ... });
});
```

**beforeAll/afterAll**: For expensive setup (database connection)

---

## Pattern 7: Parameterized Tests

**Purpose**: Test multiple scenarios with same logic

```typescript
describe('Money.add()', () => {
  const testCases = [
    { amount1: 100, amount2: 50, expected: 150 },
    { amount1: 0, amount2: 100, expected: 100 },
    { amount1: 100, amount2: 0, expected: 100 },
    { amount1: 999.99, amount2: 0.01, expected: 1000.00 },
  ];

  testCases.forEach(({ amount1, amount2, expected }) => {
    it(`should add ${amount1} + ${amount2} = ${expected}`, () => {
      const money1 = Money.BDT(amount1);
      const money2 = Money.BDT(amount2);

      const result = money1.add(money2);

      expect(result.amount).toBe(expected);
    });
  });
});
```

---

## Pattern 8: Spies (Verify Calls Without Mocking)

**Purpose**: Track calls to real methods

```typescript
it('should call calculateTax() when creating invoice', () => {
  const invoice = new InvoiceAggregate({ ... });
  const spy = jest.spyOn(invoice, 'calculateTax');

  invoice.create();

  expect(spy).toHaveBeenCalledTimes(1);
  spy.mockRestore(); // Restore original method
});
```

---

## Pattern 9: Snapshot Testing

**Purpose**: Detect unintended changes

```typescript
it('should match invoice structure snapshot', () => {
  const invoice = invoiceFixture.pending();

  expect(invoice).toMatchSnapshot();
});

// First run: Creates snapshot file
// Subsequent runs: Compares to snapshot
// If different: Test fails (intentional change or bug?)
```

**Update snapshots**:
```bash
npm test -- -u
```

---

## Pattern 10: Testing Event Emission

**Purpose**: Verify domain events published

```typescript
it('should emit InvoiceApproved event when approving', () => {
  const invoice = new InvoiceAggregate({ status: InvoiceStatus.PENDING });

  invoice.approve('user-123');

  const events = invoice.getUncommittedEvents();
  expect(events).toHaveLength(1);
  expect(events[0]).toBeInstanceOf(InvoiceApprovedEvent);
  expect(events[0].approvedBy).toBe('user-123');
});
```

---

## Pattern 11: Testing CQRS Commands

**Purpose**: Test command handlers

```typescript
describe('ApproveInvoiceHandler', () => {
  let handler: ApproveInvoiceHandler;
  let mockRepository: InvoiceRepository;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    } as any;

    handler = new ApproveInvoiceHandler(mockRepository);
  });

  it('should approve invoice and save', async () => {
    const invoice = invoiceFixture.pending();
    mockRepository.findById.mockResolvedValue(invoice);

    const command = new ApproveInvoiceCommand('invoice-123', 'user-456');
    await handler.execute(command);

    expect(mockRepository.findById).toHaveBeenCalledWith('invoice-123');
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: InvoiceStatus.APPROVED,
        approvedBy: 'user-456',
      })
    );
  });
});
```

---

## Pattern 12: Testing GraphQL Resolvers

**Purpose**: Test resolver methods

```typescript
describe('InvoiceResolver', () => {
  let resolver: InvoiceResolver;
  let mockCommandBus: CommandBus;

  beforeEach(() => {
    mockCommandBus = {
      execute: jest.fn().mockResolvedValue({ id: 'invoice-123' }),
    } as any;

    resolver = new InvoiceResolver(mockCommandBus);
  });

  it('should create invoice via mutation', async () => {
    const input = {
      customerId: 'customer-123',
      lineItems: [{ amount: 1000, description: 'Item' }],
    };

    const result = await resolver.createInvoice(input);

    expect(result.success).toBe(true);
    expect(result.data.id).toBe('invoice-123');
    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      expect.any(CreateInvoiceCommand)
    );
  });
});
```

---

## Pattern 13: Integration Test with Test Database

**Purpose**: Test with real database

```typescript
describe('InvoiceRepository (integration)', () => {
  let repository: InvoiceRepository;
  let connection: Connection;

  beforeAll(async () => {
    // Connect to test database
    connection = await createConnection({
      type: 'postgres',
      database: 'vextrus_test',
      entities: [Invoice],
      synchronize: true, // Auto-create schema
    });

    repository = connection.getCustomRepository(InvoiceRepository);
  });

  afterAll(async () => {
    await connection.close();
  });

  afterEach(async () => {
    // Clean up after each test
    await repository.clear();
  });

  it('should save and retrieve invoice', async () => {
    const invoice = new Invoice({ customerId: 'test' });

    await repository.save(invoice);

    const found = await repository.findById(invoice.id);
    expect(found.customerId).toBe('test');
  });
});
```

---

## Pattern 14: Mocking Date/Time

**Purpose**: Test time-dependent logic

```typescript
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2025-01-01T00:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

it('should set invoice date to current date', () => {
  const invoice = new Invoice({ ... });

  expect(invoice.createdAt).toEqual(new Date('2025-01-01T00:00:00Z'));
});
```

---

## Pattern 15: Testing Error Handling

**Purpose**: Verify error paths

```typescript
describe('Error handling', () => {
  it('should throw DomainException for invalid state', () => {
    const invoice = new InvoiceAggregate({ status: InvoiceStatus.APPROVED });

    expect(() => invoice.approve('user-123')).toThrow(DomainException);
    expect(() => invoice.approve('user-123')).toThrow(
      'Only pending invoices can be approved'
    );
  });

  it('should return error in GraphQL payload', async () => {
    mockCommandBus.execute.mockRejectedValue(new Error('Not found'));

    const result = await resolver.createInvoice(input);

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('Not found');
  });
});
```

---

## Summary

**Essential Patterns**:
1. AAA (Arrange-Act-Assert) - Every test
2. jest.fn() - Mock functions
3. jest.mock() - Mock modules
4. Test fixtures - Reusable data
5. Async testing - Promise-based
6. beforeEach/afterEach - Setup/teardown
7. Parameterized tests - Multiple scenarios
8. Event emission - Domain events
9. CQRS commands - Command handlers
10. GraphQL resolvers - Mutation/query testing

**Vextrus Finance**: 377 tests using these patterns, 85% coverage
