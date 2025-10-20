# Integration Test Patterns

**Purpose**: Common patterns for testing NestJS microservices with multi-tenancy, CQRS, and GraphQL Federation.

---

## NestJS Testing Module Setup

### Standard Pattern

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

describe('Invoice Integration Tests', () => {
  let app: INestApplication;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(ExternalService)
    .useValue(mockExternalService)
    .compile();

    app = module.createNestApplication();

    // Apply global middleware
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### Selective Module Testing

```typescript
// Test specific modules, not full AppModule
const module = await Test.createTestingModule({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env.test' }),
    TypeOrmModule.forRoot({...}),
    CqrsModule,
    FinanceModule, // Only finance domain
  ],
  providers: [
    CreateInvoiceHandler,
    InvoiceProjectionHandler,
  ],
}).compile();
```

**Benefits**: Faster tests, clearer dependencies, easier debugging

---

## Multi-Tenant Testing Patterns

### Tenant Isolation Verification

```typescript
describe('Multi-Tenant Isolation', () => {
  const TENANT_A = 'tenant-a';
  const TENANT_B = 'tenant-b';

  let tokenA: string;
  let tokenB: string;

  beforeAll(() => {
    tokenA = generateTestJWT({ sub: 'user-a', tenantId: TENANT_A });
    tokenB = generateTestJWT({ sub: 'user-b', tenantId: TENANT_B });
  });

  it('should isolate data by tenant', async () => {
    // Create data for Tenant A
    const invoiceA = await createInvoice(tokenA, { amount: 1000 });

    // Create data for Tenant B
    const invoiceB = await createInvoice(tokenB, { amount: 2000 });

    // Verify isolation
    const listA = await listInvoices(tokenA);
    expect(listA).toHaveLength(1);
    expect(listA[0].id).toBe(invoiceA.id);

    const listB = await listInvoices(tokenB);
    expect(listB).toHaveLength(1);
    expect(listB[0].id).toBe(invoiceB.id);
  });

  it('should prevent cross-tenant access', async () => {
    const invoice = await createInvoice(tokenA, {...});

    // Tenant B tries to access Tenant A's invoice
    await expect(
      getInvoice(tokenB, invoice.id)
    ).rejects.toThrow('Invoice not found');
  });
});
```

### Schema-Based Multi-Tenancy Testing

```typescript
beforeEach(async () => {
  const dataSource = module.get(DataSource);

  // Create tenant schemas
  await dataSource.query('CREATE SCHEMA IF NOT EXISTS tenant_a');
  await dataSource.query('CREATE SCHEMA IF NOT EXISTS tenant_b');

  // Run migrations for each schema
  await runMigrations(dataSource, 'tenant_a');
  await runMigrations(dataSource, 'tenant_b');
});

afterEach(async () => {
  const dataSource = module.get(DataSource);

  // Clean schemas
  await dataSource.query('DROP SCHEMA IF EXISTS tenant_a CASCADE');
  await dataSource.query('DROP SCHEMA IF EXISTS tenant_b CASCADE');
});
```

---

## CQRS/Event Sourcing Patterns

### Complete Flow Testing

```typescript
describe('Invoice CQRS Flow', () => {
  let commandBus: CommandBus;
  let queryBus: QueryBus;
  let projectionRepo: InvoiceProjectionRepository;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [CqrsModule, AppModule],
    }).compile();

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
      'vendor-1',
      lineItems,
      'tenant-1',
      'user-1',
    );

    const result = await commandBus.execute(command);

    // 2. Wait for async projection
    await delay(100);

    // 3. Query projection
    const invoice = await queryBus.execute(
      new GetInvoiceQuery(result.id, 'tenant-1')
    );

    expect(invoice).toMatchObject({
      id: result.id,
      invoiceNumber: 'INV-001',
      status: InvoiceStatus.DRAFT,
    });
  });
});

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Event Replay Testing

```typescript
it('should replay events to rebuild projection', async () => {
  // 1. Create invoice (command → event → projection)
  await commandBus.execute(new CreateInvoiceCommand(...));
  await delay(100);

  // 2. Approve invoice (command → event → projection)
  await commandBus.execute(new ApproveInvoiceCommand(...));
  await delay(100);

  // 3. Verify projection state
  let invoice = await queryBus.execute(query);
  expect(invoice.status).toBe(InvoiceStatus.APPROVED);

  // 4. Clear projection (simulate rebuild)
  await projectionRepo.clear();

  // 5. Replay events from event store
  const events = await readEventsFromStream(streamId);
  for (const event of events) {
    await eventBus.publish(event);
  }
  await delay(100);

  // 6. Verify projection rebuilt correctly
  invoice = await queryBus.execute(query);
  expect(invoice.status).toBe(InvoiceStatus.APPROVED);
});
```

### Idempotency Testing

```typescript
it('should handle duplicate events idempotently', async () => {
  const event = new InvoiceCreatedEvent({
    invoiceId: 'invoice-1',
    amount: 1000,
  });

  // Apply event twice
  await eventHandler.handle(event);
  await eventHandler.handle(event); // Duplicate

  await delay(100);

  // Should have single projection
  const projections = await projectionRepo.find({
    where: { invoiceId: 'invoice-1' },
  });

  expect(projections).toHaveLength(1);
});
```

---

## GraphQL Testing Patterns

### Mutation Testing

```typescript
const CREATE_INVOICE_MUTATION = `
  mutation CreateInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
      id
      invoiceNumber
      total
      status
    }
  }
`;

it('should create invoice via GraphQL', async () => {
  const { body } = await request(app.getHttpServer())
    .post('/graphql')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      query: CREATE_INVOICE_MUTATION,
      variables: {
        input: {
          invoiceNumber: 'INV-001',
          vendorId: 'vendor-1',
          lineItems: [...],
        },
      },
    })
    .expect(200);

  expect(body.errors).toBeUndefined();
  expect(body.data.createInvoice).toMatchObject({
    id: expect.any(String),
    invoiceNumber: 'INV-001',
    status: 'DRAFT',
  });
});
```

### Query with Pagination Testing

```typescript
const LIST_INVOICES_QUERY = `
  query ListInvoices($first: Int, $after: String) {
    invoices(first: $first, after: $after) {
      edges {
        node {
          id
          invoiceNumber
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

it('should paginate invoices correctly', async () => {
  // Create 15 invoices
  for (let i = 1; i <= 15; i++) {
    await createInvoice({ invoiceNumber: `INV-${i}` });
  }

  // First page
  const page1 = await queryGraphQL({
    query: LIST_INVOICES_QUERY,
    variables: { first: 10 },
  });

  expect(page1.data.invoices.edges).toHaveLength(10);
  expect(page1.data.invoices.pageInfo.hasNextPage).toBe(true);

  // Second page
  const page2 = await queryGraphQL({
    query: LIST_INVOICES_QUERY,
    variables: {
      first: 10,
      after: page1.data.invoices.pageInfo.endCursor,
    },
  });

  expect(page2.data.invoices.edges).toHaveLength(5);
  expect(page2.data.invoices.pageInfo.hasNextPage).toBe(false);
});
```

### GraphQL Error Handling

```typescript
it('should return validation errors', async () => {
  const { body } = await request(app.getHttpServer())
    .post('/graphql')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      query: CREATE_INVOICE_MUTATION,
      variables: {
        input: {
          // Missing required fields
          vendorId: 'vendor-1',
        },
      },
    })
    .expect(200); // GraphQL always returns 200

  expect(body.errors).toBeDefined();
  expect(body.errors[0].message).toContain('invoiceNumber is required');
  expect(body.errors[0].extensions.code).toBe('VALIDATION_ERROR');
});
```

### Federation Entity Resolution

```typescript
it('should resolve entities via _entities query', async () => {
  const invoice = await createInvoice({...});

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
```

---

## Authentication/Authorization Testing

### JWT Token Generation

```typescript
import * as jwt from 'jsonwebtoken';

function generateTestJWT(payload: {
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
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    },
    process.env.JWT_SECRET || 'test-secret',
  );
}
```

### Testing Different Roles

```typescript
describe('Role-Based Access Control', () => {
  let adminToken: string;
  let viewerToken: string;

  beforeAll(() => {
    adminToken = generateTestJWT({
      sub: 'admin',
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      roles: ['finance_admin'],
    });

    viewerToken = generateTestJWT({
      sub: 'viewer',
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      roles: ['finance_viewer'],
    });
  });

  it('should allow admin to create invoice', async () => {
    const result = await createInvoice(adminToken, {...});
    expect(result.id).toBeDefined();
  });

  it('should reject viewer creating invoice', async () => {
    await expect(
      createInvoice(viewerToken, {...})
    ).rejects.toThrow('Insufficient permissions');
  });
});
```

---

## Database Testing Patterns

### Transaction Rollback Pattern

```typescript
describe('Invoice Creation', () => {
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    const dataSource = module.get(DataSource);
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  });

  afterEach(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
  });

  it('should create invoice in transaction', async () => {
    const invoice = await createInvoice({...});
    expect(invoice.id).toBeDefined();
    // Transaction rolled back after test
  });
});
```

### Clear/Truncate Pattern

```typescript
afterEach(async () => {
  const dataSource = module.get(DataSource);

  // Clear all tables (cascade)
  await dataSource.query('TRUNCATE TABLE invoices CASCADE');
  await dataSource.query('TRUNCATE TABLE payments CASCADE');
});
```

---

## Observability Testing Patterns

### Telemetry Span Testing

```typescript
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';

describe('Telemetry', () => {
  let spanExporter: InMemorySpanExporter;

  beforeAll(() => {
    spanExporter = new InMemorySpanExporter();
    const tracerProvider = new NodeTracerProvider({
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

    expect(spans.length).toBeGreaterThan(0);
    expect(spans[0].name).toBe('CreateInvoiceCommand');
    expect(spans[0].attributes['tenant.id']).toBe('tenant-1');
  });
});
```

---

## WebSocket Testing Patterns

```typescript
import { io, Socket } from 'socket.io-client';

describe('WebSocket Events', () => {
  let socket: Socket;

  beforeAll(async () => {
    await app.listen(3000);

    socket = io('http://localhost:3000', {
      auth: { token: authToken },
    });

    await new Promise((resolve) => {
      socket.on('connect', resolve);
    });
  });

  afterAll(async () => {
    socket.disconnect();
    await app.close();
  });

  it('should receive invoice created event', async () => {
    const eventPromise = new Promise((resolve) => {
      socket.on('invoice.created', resolve);
    });

    await createInvoice({...});

    const event = await eventPromise;
    expect(event).toMatchObject({
      type: 'invoice.created',
      invoiceId: expect.any(String),
    });
  });
});
```

---

## Performance Testing Patterns

### Response Time Assertions

```typescript
it('should respond within 300ms', async () => {
  const start = Date.now();

  await createInvoice({...});

  const duration = Date.now() - start;
  expect(duration).toBeLessThan(300);
});
```

### Load Testing

```typescript
it('should handle concurrent requests', async () => {
  const requests = Array.from({ length: 50 }, (_, i) =>
    createInvoice({ invoiceNumber: `INV-${i}` })
  );

  const results = await Promise.all(requests);

  expect(results).toHaveLength(50);
  expect(results.every(r => r.id)).toBe(true);
});
```

---

## Best Practices Summary

1. **Use Testing Module**: `Test.createTestingModule()` for DI
2. **Mock External Services**: EventStore, APIs, HTTP clients
3. **Clean Between Tests**: Truncate tables or rollback transactions
4. **Async Handling**: Use delays for async projections (100ms)
5. **Multi-Tenancy**: Always test tenant isolation
6. **GraphQL Errors**: Don't throw, return errors in response
7. **JWT Tokens**: Generate with `generateTestJWT()`
8. **Pagination**: Test first page, next page, end of results
9. **Idempotency**: Test duplicate events/commands
10. **Observability**: Verify spans and metrics
