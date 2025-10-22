# Tenant Isolation Guide

**Source**: Multi-Tenancy Skill
**Purpose**: Prevent cross-tenant data leakage in Vextrus ERP

---

## 5-Layer Defense in Depth

### Layer 1: JWT Token Validation
```typescript
// X-Tenant-Id MUST match JWT claim
const tokenTenantId = jwt.claims.tenantId;
const headerTenantId = req.headers['x-tenant-id'];

if (tokenTenantId !== headerTenantId) {
  throw new ForbiddenException('Tenant ID mismatch');
}
```

### Layer 2: Header Enforcement
```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      throw new UnauthorizedException('Missing X-Tenant-Id header');
    }

    this.tenantContext.setTenantId(tenantId);
    req['tenantSchema'] = `tenant_${tenantId}`;
    next();
  }
}
```

### Layer 3: Schema Isolation (PostgreSQL)
```typescript
// Set search_path to tenant schema
await queryRunner.query(`SET search_path TO tenant_${tenantId}`);

// All queries execute in tenant schema
await this.repository.find({ where: { status: 'paid' } });
// SELECT * FROM tenant_org1.invoices WHERE status = 'paid'
```

### Layer 4: Application-Level Validation
```typescript
@Query(() => [Invoice])
async invoices(
  @CurrentTenant() tenantId: string,
  @Args() args: InvoicesArgs,
): Promise<Invoice[]> {
  // ALWAYS pass tenantId to service
  return this.invoiceService.findAll(tenantId, args);
}

// In service
async findAll(tenantId: string, args: InvoicesArgs) {
  // WHERE clause ALWAYS includes tenant_id
  return this.repository.find({
    where: {
      tenantId, // ✅ Explicit tenant filter
      ...args.filters,
    },
  });
}
```

### Layer 5: Row-Level Security (RLS) - Backup
```sql
-- PostgreSQL RLS policy
CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
```

---

## Critical Patterns

### Pattern 1: @CurrentTenant() Decorator
```typescript
@Resolver(() => Invoice)
export class InvoiceResolver {
  @Query(() => [Invoice])
  @UseGuards(JwtAuthGuard)
  async invoices(
    @CurrentTenant() tenantId: string,
    @Args() args: InvoicesArgs,
  ): Promise<Invoice[]> {
    return this.invoiceService.findAll(tenantId, args);
  }
}
```

### Pattern 2: Tenant Context Service
```typescript
@Injectable()
export class TenantContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<string>();

  setTenantId(tenantId: string): void {
    this.asyncLocalStorage.enterWith(tenantId);
  }

  getTenantId(): string {
    const tenantId = this.asyncLocalStorage.getStore();
    if (!tenantId) {
      throw new Error('Tenant context not set');
    }
    return tenantId;
  }
}
```

### Pattern 3: GraphQL Context
```typescript
GraphQLModule.forRootAsync({
  useFactory: () => ({
    context: ({ req }): GraphQLContext => ({
      req,
      tenantId: req.headers['x-tenant-id'] as string,
      userId: req.user?.id,
    }),
  }),
})
```

---

## Common Mistakes

### ❌ Don't

1. **Trust only schema isolation**
   ```typescript
   // ❌ No application-level check
   return this.repository.find({ where: { id } });
   ```

2. **Allow cross-tenant queries**
   ```typescript
   // ❌ Admin endpoint without tenant validation
   @Query(() => [Invoice])
   async allInvoices() {
     return this.repository.find(); // ALL TENANTS!
   }
   ```

3. **Use fallback tenant**
   ```typescript
   // ❌ Dangerous fallback
   const tenantId = req.headers['x-tenant-id'] || 'default';
   ```

4. **Skip header validation**
   ```typescript
   // ❌ No validation
   const tenantId = req.headers['x-tenant-id'];
   // Use without checking if undefined
   ```

### ✅ Do

1. **Always validate tenant context**
   ```typescript
   const tenantId = req.headers['x-tenant-id'];
   if (!tenantId) {
     throw new UnauthorizedException('Missing X-Tenant-Id header');
   }
   ```

2. **Fail secure**
   ```typescript
   // Reject if no tenant context
   if (!this.tenantContext.getTenantId()) {
     throw new Error('No tenant context');
   }
   ```

3. **Log tenant switches**
   ```typescript
   this.logger.log(`Switched to tenant: ${tenantId}`);
   ```

4. **Test cross-tenant access**
   ```typescript
   it('should prevent cross-tenant access', async () => {
     const tenant1Invoice = await createInvoice('tenant1', {...});
     const result = await queryInvoice('tenant2', tenant1Invoice.id);
     expect(result).toBeNull(); // ✅ Prevented
   });
   ```

---

## Testing Tenant Isolation

```typescript
describe('Tenant Isolation', () => {
  it('should prevent cross-tenant data access', async () => {
    // Setup: Create data in tenant1
    const tenant1Invoice = await request
      .post('/graphql')
      .set('Authorization', 'Bearer token1')
      .set('X-Tenant-Id', 'tenant1')
      .send({ query: createInvoice });

    // Attempt: Access from tenant2
    const result = await request
      .post('/graphql')
      .set('Authorization', 'Bearer token2')
      .set('X-Tenant-Id', 'tenant2')
      .send({
        query: `query { invoice(id: "${tenant1Invoice.id}") { id } }`
      });

    // Verify: No data returned
    expect(result.body.data.invoice).toBeNull();
  });

  it('should enforce X-Tenant-Id header', async () => {
    const promise = request
      .post('/graphql')
      .set('Authorization', 'Bearer token')
      // Missing X-Tenant-Id header
      .send({ query: '...' });

    await expect(promise).rejects.toThrow('Missing X-Tenant-Id header');
  });

  it('should validate tenant ID matches JWT', async () => {
    const promise = request
      .post('/graphql')
      .set('Authorization', 'Bearer tokenForTenant1') // JWT has tenant1
      .set('X-Tenant-Id', 'tenant2') // Header has tenant2
      .send({ query: '...' });

    await expect(promise).rejects.toThrow('Tenant ID mismatch');
  });
});
```

---

## Production Checklist

Before deploying multi-tenant features:

- [ ] X-Tenant-Id header required on all endpoints
- [ ] Tenant validation in middleware
- [ ] Tenant context set for request lifecycle
- [ ] PostgreSQL search_path set correctly
- [ ] RLS policies active on all tables
- [ ] Cross-tenant access tests pass
- [ ] Admin endpoints explicitly bypass tenant checks (if needed)
- [ ] Tenant switching logged

---

**See Also**:
- `.claude/skills/multi-tenancy/SKILL.md` - Complete multi-tenancy patterns
- `.claude/skills/security-first/SKILL.md` - Security-by-design
- `sessions/knowledge/vextrus-erp/patterns/rbac-patterns.md` - RBAC implementation
