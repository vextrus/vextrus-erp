# Testing Strategies

**Purpose**: When to use Unit vs Integration vs E2E tests

---

## Test Pyramid

```
        /\
       /E2E\     ← Few (5-10% of tests)
      /------\
     /        \
    /Integration\  ← Some (20-30% of tests)
   /-------------\
  /               \
 /      Unit       \  ← Many (60-75% of tests)
/___________________\
```

**Principle**: More unit tests, fewer integration, fewest E2E

---

## Unit Tests

**Purpose**: Test single function/method in isolation

**When to Use**:
- Pure functions (no dependencies)
- Business logic (calculations, validation)
- Domain aggregates
- Value objects
- Utility functions

**Characteristics**:
- Fast (<10ms per test)
- No external dependencies (mocked)
- Tests one thing
- Easy to debug

**Example**:
```typescript
// Unit test for Money value object
describe('Money', () => {
  it('should add two amounts of same currency', () => {
    const money1 = Money.BDT(100);
    const money2 = Money.BDT(50);

    const result = money1.add(money2);

    expect(result.amount).toBe(150);
    expect(result.currency).toBe(Currency.BDT);
  });

  it('should throw when adding different currencies', () => {
    const money1 = Money.BDT(100);
    const money2 = Money.USD(50);

    expect(() => money1.add(money2)).toThrow('Cannot add different currencies');
  });
});
```

**Coverage Target**: 85-95% for business logic

---

## Integration Tests

**Purpose**: Test multiple components working together

**When to Use**:
- Service + Repository (database)
- Command Handler + Event Bus
- GraphQL Resolver + Service
- External client integration

**Characteristics**:
- Slower (100-500ms per test)
- Real dependencies (test database, message bus)
- Tests interactions
- More realistic

**Example**:
```typescript
// Integration test for Invoice creation command
describe('CreateInvoiceHandler (integration)', () => {
  let handler: CreateInvoiceHandler;
  let repository: InvoiceRepository;
  let eventBus: EventBus;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDatabaseConfig),
        TypeOrmModule.forFeature([Invoice]),
      ],
      providers: [
        CreateInvoiceHandler,
        InvoiceRepository,
        EventBus,
      ],
    }).compile();

    handler = module.get(CreateInvoiceHandler);
    repository = module.get(InvoiceRepository);
    eventBus = module.get(EventBus);
  });

  it('should create invoice and emit InvoiceCreated event', async () => {
    const command = new CreateInvoiceCommand({
      customerId: 'customer-123',
      lineItems: [{ amount: 100, description: 'Item 1' }],
    });

    const invoice = await handler.execute(command);

    // Verify invoice saved to database
    const savedInvoice = await repository.findById(invoice.id);
    expect(savedInvoice).toBeDefined();
    expect(savedInvoice.customerId).toBe('customer-123');

    // Verify event published
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'InvoiceCreated' })
    );
  });
});
```

**Coverage Target**: 70-85% for application layer

---

## E2E (End-to-End) Tests

**Purpose**: Test complete user flow through system

**When to Use**:
- Critical user journeys
- Multi-service flows
- GraphQL API full stack
- Authentication/authorization flows

**Characteristics**:
- Slowest (1-5 seconds per test)
- All real dependencies
- Tests business scenarios
- Most realistic

**Example**:
```typescript
// E2E test for invoice approval flow
describe('Invoice Approval Flow (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    authToken = await getAuthToken(app, 'manager@company.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it('should complete full invoice approval workflow', async () => {
    // 1. Create invoice
    const createResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation CreateInvoice($input: CreateInvoiceInput!) {
            createInvoice(input: $input) {
              success
              data { id status }
            }
          }
        `,
        variables: {
          input: {
            customerId: 'customer-123',
            lineItems: [{ amount: 1000, description: 'Consulting' }],
          },
        },
      })
      .set('Authorization', `Bearer ${authToken}`);

    const invoiceId = createResponse.body.data.createInvoice.data.id;
    expect(createResponse.body.data.createInvoice.data.status).toBe('PENDING');

    // 2. Approve invoice
    const approveResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation ApproveInvoice($id: String!) {
            approveInvoice(id: $id) {
              success
              data { id status approvedBy }
            }
          }
        `,
        variables: { id: invoiceId },
      })
      .set('Authorization', `Bearer ${authToken}`);

    expect(approveResponse.body.data.approveInvoice.success).toBe(true);
    expect(approveResponse.body.data.approveInvoice.data.status).toBe('APPROVED');

    // 3. Verify invoice in database
    const invoice = await getInvoiceFromDatabase(app, invoiceId);
    expect(invoice.status).toBe('APPROVED');
    expect(invoice.approvedBy).toBeDefined();
  });
});
```

**Coverage Target**: Critical paths only (not aiming for % coverage)

---

## Decision Tree

```
What am I testing?
├─ Pure function or method?
│  └─ UNIT TEST
│
├─ Service with database/external dependency?
│  └─ INTEGRATION TEST
│
├─ Complete user flow (create → approve → pay)?
│  └─ E2E TEST
│
└─ GraphQL mutation with side effects?
   ├─ Resolver logic only? → UNIT TEST (mocked)
   └─ Full stack? → E2E TEST
```

---

## Coverage Targets (Vextrus ERP Standards)

| Layer | Coverage | Test Type |
|-------|----------|-----------|
| Domain (aggregates, entities) | 90-100% | Unit |
| Application (commands, queries) | 80-90% | Integration |
| Infrastructure (resolvers) | 70-80% | E2E |
| Overall | 85%+ | Mixed |

**Current Status**:
- Finance service: 377 tests, 85% coverage
- Target: 90% coverage for all services

---

## Test Naming Convention

**Pattern**: `should [expected behavior] when [condition]`

**Good**:
- `should calculate VAT on subtotal`
- `should throw error when VAT rate is negative`
- `should approve invoice when status is PENDING`

**Bad**:
- `test1`
- `testCalculateTax`
- `itWorks`

---

## Test Organization

```typescript
describe('Invoice Domain', () => {
  describe('InvoiceAggregate', () => {
    describe('calculateTax()', () => {
      it('should calculate VAT on subtotal', () => { ... });
      it('should handle zero VAT rate', () => { ... });
      it('should round to 2 decimal places', () => { ... });
    });

    describe('approve()', () => {
      it('should approve pending invoice', () => { ... });
      it('should reject non-pending invoice', () => { ... });
    });
  });
});
```

**Hierarchy**: Domain/Service → Class → Method → Scenarios

---

## Performance Testing

**When**: After feature complete, before production

**Tools**:
- Artillery (load testing)
- k6 (performance testing)
- Apache JMeter

**Example**:
```typescript
describe('Invoice API Performance', () => {
  it('should handle 100 concurrent invoice creations', async () => {
    const startTime = Date.now();
    const promises = Array.from({ length: 100 }, () =>
      createInvoice({ customerId: 'test', lineItems: [{ amount: 100 }] })
    );

    await Promise.all(promises);

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // <5 seconds for 100 requests
  });
});
```

---

## Snapshot Testing

**When**: UI components, GraphQL schema, configuration

**Example**:
```typescript
it('should match GraphQL schema snapshot', () => {
  const schema = buildSchema();
  expect(printSchema(schema)).toMatchSnapshot();
});
```

**Benefit**: Detect unintended schema changes

---

## Test Data Factories

**Pattern**: Create test data easily

```typescript
// Factory
function createTestInvoice(overrides?: Partial<Invoice>): Invoice {
  return new Invoice({
    id: 'invoice-test-' + Math.random(),
    customerId: 'customer-123',
    subtotal: Money.BDT(1000),
    vatRate: 15,
    status: InvoiceStatus.PENDING,
    ...overrides,
  });
}

// Usage
const invoice = createTestInvoice({ vatRate: 20 });
```

---

## Summary

**Test Distribution**:
- 60-75% Unit tests (fast, many)
- 20-30% Integration tests (medium speed, some)
- 5-10% E2E tests (slow, few)

**Coverage Targets**:
- Domain: 90-100%
- Application: 80-90%
- Infrastructure: 70-80%
- Overall: 85%+

**Evidence**: Vextrus Finance service achieves 85% with this strategy
