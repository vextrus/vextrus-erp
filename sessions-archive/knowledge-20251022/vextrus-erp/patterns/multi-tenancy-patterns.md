# Multi-Tenancy Patterns

5-layer defense-in-depth strategy for tenant isolation in Vextrus ERP.

---

## Architecture: Schema-Based Isolation

```
API Gateway → Extract X-Tenant-Id from JWT
     ↓
Service Middleware → Set schema context (tenant_{id})
     ↓
Database → Schema isolation + Row-level validation
```

---

## Pattern 1: Tenant Context Middleware

```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    // Fail secure: reject if no tenant
    if (!tenantId) {
      throw new UnauthorizedException('Missing X-Tenant-Id header');
    }

    this.tenantContext.setTenantId(tenantId);
    req['tenantSchema'] = `tenant_${tenantId}`;
    next();
  }
}
```

---

## Pattern 2: Tenant-Aware Resolvers

```typescript
@Resolver(() => Invoice)
export class InvoiceResolver {
  @Query(() => [Invoice])
  @UseGuards(JwtAuthGuard)
  async invoices(
    @CurrentTenant() tenantId: string, // Auto-extracted
    @Args() args: InvoicesArgs,
  ): Promise<Invoice[]> {
    return this.invoiceService.findAll(tenantId, args);
  }
}
```

**Custom Decorator**:
```typescript
export const CurrentTenant = createParamDecorator(
  (data: unknown, context: ExecutionContext): string => {
    const ctx = GqlExecutionContext.create(context);
    const { tenantId } = ctx.getContext<GraphQLContext>();

    if (!tenantId) {
      throw new UnauthorizedException('Tenant context missing');
    }

    return tenantId;
  },
);
```

---

## Pattern 3: Database Query Validation

```typescript
// Repository: Always include tenant_id
async findByCustomer(tenantId: string, customerId: string): Promise<Invoice[]> {
  return this.repository.find({
    where: {
      tenant_id: tenantId,  // NEVER OMIT
      customer_id: customerId,
    },
  });
}
```

**Defense-in-depth**: Schema isolation + application-level validation

---

## Pattern 4: EventStore Stream Isolation

```typescript
export class EventStoreService {
  async appendEvent(tenantId: string, streamName: string, event: DomainEvent): Promise<void> {
    // Prefix stream with tenant ID
    const tenantStream = `tenant-${tenantId}-${streamName}`;
    await this.eventStore.appendToStream(tenantStream, event);
  }
}
```

---

## 5-Layer Defense in Depth

| Layer | Validation | Fail Behavior |
|-------|-----------|---------------|
| 1. JWT | Contains `organizationId` (tenantId) | 401 Unauthorized |
| 2. Header | `X-Tenant-Id` present and matches JWT | 401 Unauthorized |
| 3. Middleware | Tenant context set, schema switched | 401 Unauthorized |
| 4. Query | `WHERE tenant_id = $1` in all queries | Empty result set |
| 5. RLS | Row-Level Security policies (backup) | Access denied |

---

## Cross-Tenant Prevention Checklist

- [ ] JWT contains organizationId
- [ ] X-Tenant-Id header validated
- [ ] TenantMiddleware applied to all routes
- [ ] All queries include `WHERE tenant_id = $1`
- [ ] No raw queries without tenant filter
- [ ] RLS policies enabled on tables
- [ ] Cross-tenant access tests passing
- [ ] Audit logs capture tenant switches

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Omit `tenant_id` from WHERE | Always include tenant filter |
| Use fallback values (`\|\| 'default'`) | Fail secure, reject request |
| Skip header validation | Validate at middleware layer |
| Trust only app-level isolation | Use schema isolation + RLS backup |

---

**See also**: `.claude/skills/security-first/authorization.md` for RBAC integration
