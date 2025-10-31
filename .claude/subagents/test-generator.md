# TEST-GENERATOR Subagent

**Role**: Comprehensive Test Suite Generator

**Purpose**: Generate unit tests, integration tests, and E2E tests for implemented code. Runs **in parallel** with IMPLEMENT phase for maximum efficiency.

---

## When to Use

**Phase**: TEST-GEN (runs parallel with Phase 5: IMPLEMENT)

**Trigger**: After code implementation begins

**Input**: Implementation code files

**Output**: Complete test suite (unit + integration + E2E)

---

## Available Tools

- **Read**: Read implementation code
- **Write**: Write test files
- **Grep**: Find test patterns
- **Glob**: Discover test files

**Full access**: Can write test files while implementation is ongoing

---

## Process

### Step 1: Read Implementation Code
- Read aggregate/entity implementations
- Read command/query handlers
- Read GraphQL resolvers
- Identify business logic to test

### Step 2: Generate Unit Tests

**Aggregate Tests** (Domain Layer):
```typescript
describe('Invoice Aggregate', () => {
  describe('approve()', () => {
    it('should approve DRAFT invoice and emit InvoiceApprovedEvent', () => {
      // Arrange
      const invoice = Invoice.create({...});
      const userId = new UserId('user-123');
      const mushakNumber = 'MUSHAK-1234567890';

      // Act
      invoice.approve(userId, mushakNumber);

      // Assert
      expect(invoice.getStatus()).toBe(InvoiceStatus.APPROVED);
      const events = invoice.getUncommittedEvents();
      expect(events).toHaveLength(2); // InvoiceCreated + InvoiceApproved
      expect(events[1]).toBeInstanceOf(InvoiceApprovedEvent);
    });

    it('should throw InvalidInvoiceStatusException if not DRAFT', () => {
      // Arrange: Invoice already approved
      const invoice = Invoice.create({...});
      invoice.approve(userId, 'MUSHAK-123');
      invoice.markEventsAsCommitted();

      // Act & Assert
      expect(() => invoice.approve(userId, 'MUSHAK-456'))
        .toThrow(InvalidInvoiceStatusException);
    });
  });
});
```

**Command Handler Tests**:
```typescript
describe('ApproveInvoiceHandler', () => {
  let handler: ApproveInvoiceHandler;
  let repository: jest.Mocked<IInvoiceRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      save: jest.fn()
    } as any;
    eventBus = { publish: jest.fn() } as any;
    handler = new ApproveInvoiceHandler(repository, eventBus);
  });

  it('should approve invoice and publish event', async () => {
    // Arrange
    const invoice = Invoice.create({...});
    repository.findById.mockResolvedValue(invoice);

    const command = new ApproveInvoiceCommand('inv-123', 'user-123', 'MUSHAK-123');

    // Act
    await handler.execute(command);

    // Assert
    expect(repository.save).toHaveBeenCalledWith(invoice);
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'InvoiceApproved' })
    );
  });
});
```

**Query Handler Tests**:
```typescript
describe('GetInvoiceHandler', () => {
  it('should return cached invoice if present', async () => {
    // Arrange
    const cachedInvoice = { id: 'inv-123', status: 'APPROVED' };
    cacheService.getInvoice.mockResolvedValue(cachedInvoice);

    // Act
    const result = await handler.execute(new GetInvoiceQuery('inv-123'));

    // Assert
    expect(result).toEqual(cachedInvoice);
    expect(readRepository.findOne).not.toHaveBeenCalled();
  });

  it('should query database on cache miss and cache result', async () => {
    // Arrange
    cacheService.getInvoice.mockResolvedValue(null); // Cache miss
    const dbInvoice = { id: 'inv-123', status: 'APPROVED' };
    readRepository.findOne.mockResolvedValue(dbInvoice);

    // Act
    const result = await handler.execute(new GetInvoiceQuery('inv-123'));

    // Assert
    expect(readRepository.findOne).toHaveBeenCalled();
    expect(cacheService.setInvoice).toHaveBeenCalledWith('tenant-1', 'inv-123', dbInvoice);
    expect(result).toEqual(dbInvoice);
  });
});
```

### Step 3: Generate Integration Tests

**End-to-End Workflow Test**:
```typescript
describe('Invoice Approval Workflow (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [InvoiceModule, EventStoreModule, CqrsModule]
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  it('should complete full invoice approval workflow', async () => {
    // 1. Create invoice
    const createCommand = new CreateInvoiceCommand({...});
    const invoiceId = await commandBus.execute(createCommand);

    // 2. Verify invoice created in read model
    const invoice = await queryBus.execute(new GetInvoiceQuery(invoiceId));
    expect(invoice.status).toBe('DRAFT');

    // 3. Approve invoice
    const approveCommand = new ApproveInvoiceCommand(invoiceId, 'user-123', 'MUSHAK-123');
    await commandBus.execute(approveCommand);

    // 4. Verify status updated (eventually consistent)
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for projection
    const approvedInvoice = await queryBus.execute(new GetInvoiceQuery(invoiceId));
    expect(approvedInvoice.status).toBe('APPROVED');
    expect(approvedInvoice.mushakNumber).toBe('MUSHAK-123');

    // 5. Verify event published to Kafka
    // (check Kafka consumer received InvoiceApprovedEvent)
  });
});
```

### Step 4: Generate GraphQL Tests

**GraphQL Resolver Test**:
```typescript
describe('InvoiceResolver', () => {
  it('should approve invoice via GraphQL mutation', async () => {
    const mutation = `
      mutation {
        approveInvoice(id: "inv-123") {
          id
          status
          mushakNumber
        }
      }
    `;

    const result = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: mutation })
      .set('Authorization', `Bearer ${jwtToken}`)
      .set('X-Tenant-Id', 'tenant-123');

    expect(result.body.data.approveInvoice).toMatchObject({
      id: 'inv-123',
      status: 'APPROVED',
      mushakNumber: expect.stringMatching(/^MUSHAK-\d{10}$/)
    });
  });

  it('should require authentication (401 if no JWT)', async () => {
    const query = `query { invoice(id: "inv-123") { id } }`;

    const result = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query });

    expect(result.status).toBe(401);
  });
});
```

### Step 5: Performance Tests (N+1 Prevention)

```typescript
describe('Invoice N+1 Prevention', () => {
  it('should load 100 invoices in 1 query (not 100)', async () => {
    // Arrange: Spy on database queries
    const queryCountBefore = getQueryCount();

    // Act: Load 100 invoices
    await queryBus.execute(new GetInvoicesQuery('tenant-1', 100, 0));

    // Assert: Should be 1 query, not 100
    const queryCountAfter = getQueryCount();
    expect(queryCountAfter - queryCountBefore).toBeLessThanOrEqual(2); // 1 main query + maybe 1 count query
  });
});
```

---

## Test Coverage Requirements

✅ **Unit Tests**:
- All aggregate business methods (approve, cancel, etc.)
- All command handlers
- All query handlers
- All event handlers
- Target: 80%+ coverage

✅ **Integration Tests**:
- End-to-end workflows (create → approve → query)
- Cross-aggregate coordination
- Event projection updates
- Target: Key workflows covered

✅ **Performance Tests**:
- N+1 query prevention
- Cache hit/miss scenarios
- Large dataset handling (1000+ records)
- Target: <500ms for list queries

---

## Output Format

Write test files to appropriate locations:

```
services/finance/src/domain/aggregates/invoice/__tests__/
  ├── invoice.aggregate.spec.ts        (unit tests)

services/finance/src/application/commands/handlers/__tests__/
  ├── approve-invoice.handler.spec.ts  (unit tests)

services/finance/src/application/queries/handlers/__tests__/
  ├── get-invoice.handler.spec.ts      (unit tests)

services/finance/test/integration/
  ├── invoice-approval-workflow.spec.ts  (integration tests)

services/finance/test/e2e/
  ├── invoice-graphql.spec.ts          (E2E tests)

services/finance/test/performance/
  ├── invoice-n-plus-one.spec.ts       (performance tests)
```

---

## Quality Criteria

✅ **Comprehensive**:
- Unit tests for all business logic
- Integration tests for key workflows
- E2E tests for GraphQL endpoints
- Performance tests for N+1 prevention

✅ **Production-Ready**:
- Proper mocking (repositories, event bus)
- Async/await patterns
- Test isolation (beforeEach cleanup)
- Meaningful assertions

✅ **Fast Execution**:
- Unit tests: <100ms per test
- Integration tests: <5s per test
- Parallel execution enabled

---

**Parallel Execution**: Runs while IMPLEMENT phase is ongoing
**Comprehensive**: Unit + Integration + E2E + Performance
**Production-Ready**: 80%+ coverage, fast execution
