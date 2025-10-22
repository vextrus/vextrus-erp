---
name: integration-testing
version: 1.0.0
triggers:
  - "integration test"
  - "e2e test"
  - "end-to-end"
  - "test container"
  - "service test"
  - "integration testing"
  - "e2e testing"
auto_load_knowledge:
  - sessions/knowledge/vextrus-erp/patterns/integration-testing-patterns.md
---

# Integration Testing Skill

**Auto-activates on**: "integration test", "e2e test", "test container", "service test"

**Purpose**: Enforce comprehensive integration testing patterns for NestJS microservices with multi-tenancy, event sourcing, and GraphQL Federation.

---

## When This Skill Activates

Use when implementing or reviewing:
- Integration tests spanning multiple modules/services
- E2E tests for GraphQL endpoints
- Service integration tests with external dependencies
- CQRS/Event Sourcing integration testing
- Multi-tenant integration test isolation
- Test container orchestration
- Database migration testing

---

## Core Integration Testing Principles

### 1. Test Scope Hierarchy

```typescript
// Unit Test (single class, mocked dependencies)
describe('InvoiceAggregate', () => {
  it('should calculate VAT correctly', () => {
    const invoice = new InvoiceAggregate();
    // Test single method
  });
});

// Integration Test (multiple classes, real dependencies)
describe('Invoice CQRS Integration', () => {
  let app: INestApplication;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule], // Full application context
    }).compile();

    app = module.createNestApplication();
    await app.init();

    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  it('should create invoice and query projection', async () => {
    // Test: Command → Event → Projection → Query
    const command = new CreateInvoiceCommand(...);
    await commandBus.execute(command);

    await delay(100); // Wait for async projection

    const result = await queryBus.execute(
      new GetInvoiceQuery(invoiceId)
    );
    expect(result.total).toBe(expected);
  });
});

// E2E Test (HTTP/GraphQL, full stack)
describe('Invoice GraphQL E2E', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    app = await setupTestApp();
    authToken = generateTestJWT({
      sub: 'user-1',
      tenantId: 'tenant-1',
      roles: ['finance_manager'],
    });
  });

  it('should create invoice via GraphQL', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: CREATE_INVOICE_MUTATION,
        variables: { input: {...} },
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.createInvoice.id).toBeDefined();
      });
  });
});
```

**Decision Tree:**
- Single class? → **Unit test**
- Multiple modules/services? → **Integration test**
- HTTP/GraphQL endpoint? → **E2E test**

---

## NestJS Testing Module Setup

### Standard Pattern

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('Service Integration Tests', () => {
  let app: INestApplication;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        // Configuration
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),

        // Database (test instance)
        TypeOrmModule.forRootAsync({
          useFactory: () => ({
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 5432,
            database: process.env.DB_NAME || 'test_db',
            synchronize: true,  // Only for testing
            dropSchema: true,   // Clean slate each run
          }),
        }),

        // Application modules
        AppModule,
      ],
    })
    .overrideProvider(ExternalService)
    .useValue(mockExternalService)
    .compile();

    app = module.createNestApplication();

    // Apply middleware/pipes
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
    await app.listen(3000 + process.env.JEST_WORKER_ID); // Parallel test ports
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // Clean data between tests
    await module.get(Repository).clear();
  });
});
```

**Key Points:**
- Use `.env.test` for test configuration
- `synchronize: true` for auto-schema creation
- `dropSchema: true` for isolation
- Override external services with mocks
- Use worker ID for parallel test ports

---

## Multi-Tenant Integration Testing

### Tenant Isolation Pattern

```typescript
describe('Multi-Tenant Invoice Tests', () => {
  const TENANT_A = 'tenant-a-test';
  const TENANT_B = 'tenant-b-test';
  const USER_A = 'user-a';
  const USER_B = 'user-b';

  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    // Generate tenant-specific tokens
    tokenA = generateTestJWT({
      sub: USER_A,
      tenantId: TENANT_A,
      organizationId: 'org-a',
      roles: ['finance_manager'],
    });

    tokenB = generateTestJWT({
      sub: USER_B,
      tenantId: TENANT_B,
      organizationId: 'org-b',
      roles: ['finance_viewer'],
    });
  });

  it('should isolate invoices by tenant', async () => {
    // Create invoice for Tenant A
    const invoiceA = await createInvoice(tokenA, {
      vendorId: 'vendor-a',
      amount: 10000,
    });

    // Create invoice for Tenant B
    const invoiceB = await createInvoice(tokenB, {
      vendorId: 'vendor-b',
      amount: 20000,
    });

    // Tenant A should see only their invoice
    const listA = await queryInvoices(tokenA);
    expect(listA.items).toHaveLength(1);
    expect(listA.items[0].id).toBe(invoiceA.id);

    // Tenant B should see only their invoice
    const listB = await queryInvoices(tokenB);
    expect(listB.items).toHaveLength(1);
    expect(listB.items[0].id).toBe(invoiceB.id);
  });

  it('should reject cross-tenant access', async () => {
    const invoiceA = await createInvoice(tokenA, {...});

    // Tenant B tries to access Tenant A's invoice
    await expect(
      getInvoice(tokenB, invoiceA.id)
    ).rejects.toThrow('Invoice not found');
  });
});
```

**Multi-Tenant Test Checklist:**
- [ ] Create test data for multiple tenants
- [ ] Verify data isolation (can't see other tenant's data)
- [ ] Test cross-tenant access prevention
- [ ] Validate tenant ID in all database queries
- [ ] Test tenant switching (same user, different tenants)

---

## CQRS/Event Sourcing Testing

### Complete Flow Testing

```typescript
describe('Invoice CQRS Flow', () => {
  let commandBus: CommandBus;
  let queryBus: QueryBus;
  let eventStore: EventStoreDBClient;
  let projectionRepo: InvoiceProjectionRepository;

  beforeAll(async () => {
    // Setup with real EventStore or mock
    const module = await Test.createTestingModule({
      imports: [
        CqrsModule,
        EventStoreModule.forRoot({
          connectionString: 'esdb://localhost:2113',
        }),
      ],
      providers: [
        // Command handlers
        CreateInvoiceHandler,
        // Event handlers
        InvoiceProjectionHandler,
        // Query handlers
        GetInvoiceHandler,
      ],
    })
    .overrideProvider(EventStoreDBClient)
    .useValue(mockEventStore)
    .compile();

    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
    projectionRepo = module.get(InvoiceProjectionRepository);
  });

  beforeEach(async () => {
    // Clear projections before each test
    await projectionRepo.clear();
  });

  it('should handle complete CQRS flow', async () => {
    // 1. Execute command
    const command = new CreateInvoiceCommand(
      'INV-001',
      VENDOR_ID,
      lineItems,
      TENANT_ID,
      USER_ID,
    );

    const result = await commandBus.execute(command);
    expect(result.id).toBeDefined();

    // 2. Wait for async projection (event handler)
    await delay(100);

    // 3. Query projection
    const invoice = await queryBus.execute(
      new GetInvoiceQuery(result.id, TENANT_ID)
    );

    expect(invoice).toMatchObject({
      id: result.id,
      invoiceNumber: 'INV-001',
      vendorId: VENDOR_ID,
      status: InvoiceStatus.DRAFT,
      total: expectedTotal,
    });
  });

  it('should replay events to rebuild projection', async () => {
    // Create invoice
    await commandBus.execute(new CreateInvoiceCommand(...));
    await delay(100);

    // Approve invoice
    await commandBus.execute(new ApproveInvoiceCommand(...));
    await delay(100);

    // Clear projection (simulate rebuild)
    await projectionRepo.clear();

    // Replay events
    const events = await eventStore.readStream(streamId);
    for (const event of events) {
      await eventBus.publish(event);
    }
    await delay(100);

    // Verify projection rebuilt correctly
    const invoice = await queryBus.execute(query);
    expect(invoice.status).toBe(InvoiceStatus.APPROVED);
  });
});
```

**Event Sourcing Test Patterns:**
- Test command → event → projection flow
- Verify async projection handling (use delays)
- Test event replay and projection rebuild
- Validate event ordering and causality
- Test idempotent event handlers

---

## GraphQL Federation Testing

### Entity Resolution Testing

```typescript
describe('GraphQL Federation E2E', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    app = await setupTestApp();
    authToken = generateTestJWT({...});
  });

  it('should expose federated schema with @key directives', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query IntrospectionQuery {
            _service {
              sdl
            }
          }
        `,
      })
      .expect(200);

    const sdl = body.data._service.sdl;

    // Verify @key directives for federation
    expect(sdl).toContain('type Invoice @key(fields: "id")');
    expect(sdl).toContain('extend type Vendor @key(fields: "id")');
  });

  it('should resolve entities via _entities query', async () => {
    // Create invoice
    const invoice = await createInvoice({...});

    // Resolve entity (used by gateway)
    const { body } = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query ResolveEntity($representations: [_Any!]!) {
            _entities(representations: $representations) {
              ... on Invoice {
                id
                invoiceNumber
                total
              }
            }
          }
        `,
        variables: {
          representations: [
            { __typename: 'Invoice', id: invoice.id },
          ],
        },
      })
      .expect(200);

    expect(body.data._entities[0]).toMatchObject({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
    });
  });

  it('should paginate results with cursor-based pagination', async () => {
    // Create 15 invoices
    for (let i = 1; i <= 15; i++) {
      await createInvoice({ invoiceNumber: `INV-${i}` });
    }

    // First page
    const page1 = await queryInvoices({
      first: 10,
    });

    expect(page1.edges).toHaveLength(10);
    expect(page1.pageInfo.hasNextPage).toBe(true);

    // Second page
    const page2 = await queryInvoices({
      first: 10,
      after: page1.pageInfo.endCursor,
    });

    expect(page2.edges).toHaveLength(5);
    expect(page2.pageInfo.hasNextPage).toBe(false);
  });
});
```

**GraphQL Federation Test Checklist:**
- [ ] Verify `@key` directives in SDL
- [ ] Test `_entities` query for entity resolution
- [ ] Validate pagination (cursor-based)
- [ ] Test error handling (GraphQL errors, not exceptions)
- [ ] Verify authentication/authorization guards
- [ ] Test field-level permissions

---

## External Service Mocking

### Mock Service Provider Pattern

```typescript
// Mock Master Data Client
const mockMasterDataClient = {
  getVendor: jest.fn().mockResolvedValue({
    id: 'vendor-1',
    name: 'Test Vendor Ltd.',
    tin: '1234567890',
    address: {
      division: 'Dhaka',
      district: 'Dhaka',
      thana: 'Gulshan',
    },
  }),

  getCustomer: jest.fn().mockResolvedValue({
    id: 'customer-1',
    name: 'Test Customer',
    bin: '123456789',
  }),

  // Simulate network errors
  getVendor: jest.fn()
    .mockRejectedValueOnce(new Error('Network timeout'))
    .mockResolvedValueOnce({...}),
};

// Mock EventStore
const mockEventStore = {
  appendToStream: jest.fn().mockResolvedValue({
    success: true,
    nextExpectedStreamRevision: BigInt(1),
  }),

  readStream: jest.fn().mockResolvedValue([
    {
      event: {
        type: 'InvoiceCreated',
        data: {...},
        metadata: {...},
      },
    },
  ]),
};

// Use in test module
const module = await Test.createTestingModule({
  imports: [AppModule],
})
.overrideProvider(MasterDataClient)
.useValue(mockMasterDataClient)
.overrideProvider(EventStoreDBClient)
.useValue(mockEventStore)
.compile();
```

**Mocking Best Practices:**
- Mock external services (EventStore, external APIs)
- Use real database for data layer tests
- Mock slowly: start with real, mock when needed
- Verify mock calls: `expect(mock).toHaveBeenCalledWith(...)`
- Test error scenarios: network failures, timeouts
- Reset mocks between tests: `jest.clearAllMocks()`

---

## Test Data Management

### Test Data Factory Pattern

```typescript
// test/factories/invoice.factory.ts
export class InvoiceTestFactory {
  static createLineItems(count = 2): LineItemDto[] {
    return Array.from({ length: count }, (_, i) => ({
      description: `Line Item ${i + 1}`,
      quantity: 10,
      unitPrice: Money.create(5000, 'BDT'),
      vatCategory: VATCategory.STANDARD,
    }));
  }

  static createInvoiceInput(overrides?: Partial<CreateInvoiceDto>): CreateInvoiceDto {
    return {
      invoiceNumber: `INV-${Date.now()}`,
      vendorId: 'vendor-default',
      customerId: 'customer-default',
      lineItems: this.createLineItems(),
      issueDate: new Date().toISOString(),
      dueDate: addDays(new Date(), 30).toISOString(),
      ...overrides,
    };
  }

  static generateTestJWT(payload: {
    sub: string;
    tenantId: string;
    organizationId: string;
    roles?: string[];
  }): string {
    return jwt.sign(
      {
        sub: payload.sub,
        userId: payload.sub,
        tenantId: payload.tenantId,
        organizationId: payload.organizationId,
        roles: payload.roles || ['finance_manager'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      process.env.JWT_SECRET || 'test-secret',
    );
  }
}

// Usage
const input = InvoiceTestFactory.createInvoiceInput({
  vendorId: 'specific-vendor',
});

const token = InvoiceTestFactory.generateTestJWT({
  sub: 'user-1',
  tenantId: 'tenant-1',
  organizationId: 'org-1',
});
```

**Test Data Principles:**
- **Factories** for reusable test data creation
- **Randomization** to avoid hard-coded dependencies
- **Minimal data** - only essential fields
- **Cleanup** between tests (database truncate/clear)
- **Tenant scoping** for multi-tenancy

---

## Async Projection Handling

### Pattern: Delay and Verify

```typescript
it('should update projection after command', async () => {
  // Execute command
  const result = await commandBus.execute(command);

  // Wait for async event handler
  await delay(100); // 100ms typical for local testing

  // Query projection
  const projection = await queryBus.execute(query);
  expect(projection.status).toBe(expected);
});

// Helper
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**Production Pattern: Event-Driven Testing**

```typescript
it('should update projection after event published', async () => {
  const eventPublished = new Promise<void>((resolve) => {
    eventBus.subscribe((event) => {
      if (event instanceof InvoiceCreated) {
        resolve();
      }
    });
  });

  await commandBus.execute(command);

  await eventPublished; // Wait for specific event

  const projection = await queryBus.execute(query);
  expect(projection).toBeDefined();
});
```

---

## Database Testing Strategies

### In-Memory SQLite (Fast, Isolated)

```typescript
TypeOrmModule.forRoot({
  type: 'better-sqlite3',
  database: ':memory:',
  synchronize: true,
  dropSchema: true,
  entities: [__dirname + '/**/*.entity.ts'],
}),
```

**Pros**: Fast, isolated, no external dependencies
**Cons**: SQL dialect differences, missing features

### Test PostgreSQL Database (Production Parity)

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'finance_test',
  synchronize: true,
  dropSchema: true, // Clean slate
}),
```

**Pros**: Production parity, full SQL features
**Cons**: Slower, requires external service

### Testcontainers (Best of Both)

```typescript
import { PostgreSqlContainer } from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer()
    .withDatabase('test_db')
    .withUsername('test_user')
    .withPassword('test_pass')
    .start();

  process.env.DB_HOST = container.getHost();
  process.env.DB_PORT = container.getPort().toString();
});

afterAll(async () => {
  await container.stop();
});
```

**Pros**: Production parity, isolated, clean
**Cons**: Slower startup, Docker dependency

---

## Observability Testing

### Telemetry Integration Tests

```typescript
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

describe('Telemetry Integration', () => {
  let spanExporter: InMemorySpanExporter;
  let tracerProvider: NodeTracerProvider;

  beforeAll(() => {
    spanExporter = new InMemorySpanExporter();
    tracerProvider = new NodeTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(spanExporter)],
    });
    tracerProvider.register();
  });

  afterEach(() => {
    spanExporter.reset();
  });

  it('should create spans for invoice creation', async () => {
    await createInvoice({...});

    const spans = spanExporter.getFinishedSpans();

    expect(spans).toHaveLength(3);
    expect(spans[0].name).toBe('CreateInvoiceCommand');
    expect(spans[1].name).toBe('InvoiceAggregate.create');
    expect(spans[2].name).toBe('EventStore.appendToStream');

    // Verify span relationships
    expect(spans[1].parentSpanId).toBe(spans[0].spanContext().spanId);
  });
});
```

---

## Integration Test Checklist

**Setup:**
- [ ] Use `Test.createTestingModule()` for DI
- [ ] Mock external services (EventStore, APIs)
- [ ] Use test database with `dropSchema: true`
- [ ] Apply global pipes/filters
- [ ] Generate test JWT tokens

**Multi-Tenancy:**
- [ ] Test data isolation per tenant
- [ ] Test cross-tenant access prevention
- [ ] Validate tenant ID in all queries

**CQRS/Event Sourcing:**
- [ ] Test command → event → projection flow
- [ ] Handle async projections with delays
- [ ] Test event replay and idempotency

**GraphQL:**
- [ ] Test schema introspection
- [ ] Test entity resolution (`_entities`)
- [ ] Test pagination
- [ ] Test authentication/authorization

**Observability:**
- [ ] Verify span creation and linking
- [ ] Test trace context propagation
- [ ] Validate business metrics

**Cleanup:**
- [ ] Clear database between tests
- [ ] Reset mocks with `jest.clearAllMocks()`
- [ ] Close app with `await app.close()`

---

## Resources

- `test-containers-guide.md` - Docker container orchestration for integration tests
- `integration-test-patterns.md` - Common patterns for NestJS integration testing
- `mocking-strategies.md` - Best practices for mocking external services

---

**Version**: 1.0.0
**Status**: Production-Ready
**Evidence**: 6+ integration test files across finance/auth services
