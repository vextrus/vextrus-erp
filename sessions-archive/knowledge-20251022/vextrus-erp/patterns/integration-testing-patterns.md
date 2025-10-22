# Integration Testing Patterns - Quick Reference

**Auto-loaded by**: `integration-testing` skill

---

## Test Scope Decision Tree

```
Single class? → Unit Test
Multiple modules? → Integration Test
HTTP/GraphQL endpoint? → E2E Test
```

---

## NestJS Testing Module Setup

```typescript
const module = await Test.createTestingModule({
  imports: [AppModule],
})
.overrideProvider(ExternalService)
.useValue(mockExternalService)
.compile();

app = module.createNestApplication();
await app.init();
```

---

## Multi-Tenant Testing

```typescript
// Generate tenant-specific tokens
const tokenA = generateTestJWT({ sub: 'user-a', tenantId: 'tenant-a' });
const tokenB = generateTestJWT({ sub: 'user-b', tenantId: 'tenant-b' });

// Verify isolation
const listA = await listInvoices(tokenA);
expect(listA).toHaveLength(1); // Only tenant A's data
```

---

## CQRS Flow Testing

```typescript
// 1. Execute command
await commandBus.execute(new CreateInvoiceCommand(...));

// 2. Wait for async projection
await delay(100);

// 3. Query projection
const invoice = await queryBus.execute(new GetInvoiceQuery(...));
expect(invoice.status).toBe(InvoiceStatus.DRAFT);
```

---

## GraphQL Testing

```typescript
const { body } = await request(app.getHttpServer())
  .post('/graphql')
  .set('Authorization', `Bearer ${authToken}`)
  .send({
    query: CREATE_INVOICE_MUTATION,
    variables: { input: {...} },
  })
  .expect(200);

expect(body.errors).toBeUndefined();
expect(body.data.createInvoice.id).toBeDefined();
```

---

## External Service Mocking

```typescript
const mockMasterDataClient = {
  getVendor: jest.fn().mockResolvedValue({
    id: 'vendor-1',
    name: 'Test Vendor Ltd.',
  }),
};

.overrideProvider(MasterDataClient)
.useValue(mockMasterDataClient)
```

---

## Database Strategy

**Use Real Database:**
```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  database: 'finance_test',
  synchronize: true,
  dropSchema: true, // Clean slate
})
```

**Or Testcontainers:**
```typescript
const container = await new PostgreSqlContainer().start();
process.env.DB_HOST = container.getHost();
```

---

## Test Data Cleanup

```typescript
beforeEach(async () => {
  await projectionRepo.clear();
});

// OR

afterEach(async () => {
  await dataSource.query('TRUNCATE TABLE invoices CASCADE');
});
```

---

## JWT Token Generation

```typescript
function generateTestJWT(payload: {
  sub: string;
  tenantId: string;
  roles?: string[];
}): string {
  return jwt.sign(
    {
      sub: payload.sub,
      userId: payload.sub,
      tenantId: payload.tenantId,
      roles: payload.roles || ['finance_manager'],
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    process.env.JWT_SECRET || 'test-secret',
  );
}
```

---

## Integration Test Checklist

- [ ] Use `Test.createTestingModule()` for DI
- [ ] Mock external services (EventStore, APIs)
- [ ] Use test database with `dropSchema: true`
- [ ] Generate test JWT tokens
- [ ] Test multi-tenant isolation
- [ ] Handle async projections with delays (100ms)
- [ ] Test GraphQL pagination
- [ ] Verify authentication/authorization
- [ ] Clear database between tests
- [ ] Close app with `await app.close()`

---

## Common Patterns

**Test Module Setup**: Use `Test.createTestingModule()` with overrides
**Multi-Tenancy**: Test data isolation and cross-tenant prevention
**CQRS**: Test command → event → projection flow with delays
**GraphQL**: Use supertest for HTTP/GraphQL endpoint testing
**Mocking**: Mock external APIs, use real database
**Cleanup**: Truncate tables or rollback transactions between tests

---

**See Also**:
- `.claude/skills/integration-testing/SKILL.md` - Complete integration testing guide
- `.claude/skills/integration-testing/resources/test-containers-guide.md` - Testcontainers setup
- `.claude/skills/integration-testing/resources/mocking-strategies.md` - Mocking best practices
