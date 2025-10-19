---
name: Multi-Tenancy
description: When working with multi-tenant features, tenant context, or data isolation, activate this skill to enforce tenant isolation patterns. Use when user says "tenant", "multi-tenant", "schema isolation", "organization", "x-tenant-id", or when creating queries/mutations that access tenant data.
---

# Multi-Tenancy Skill

## Purpose
Prevent cross-tenant data leakage and enforce tenant context propagation across Vextrus ERP

## Activation Triggers
- User says: "tenant", "multi-tenant", "schema isolation", "organization", "x-tenant-id"
- Working in: GraphQL resolvers, database queries, middleware
- Creating: Queries, mutations, services that access tenant data
- Modifying: Authentication, authorization, data access layers

## Multi-Tenancy Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ API Gateway (Entry Point)                                   │
│ - Extracts X-Tenant-Id from JWT                            │
│ - Forwards header to all services                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Service (Finance, Master Data, etc.)                        │
│ - TenantMiddleware extracts X-Tenant-Id                    │
│ - Sets schema context: tenant_{tenantId}                   │
│ - All queries execute in tenant schema                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Database (PostgreSQL)                                       │
│ - Schema-based isolation: tenant_org1, tenant_org2         │
│ - Application-level validation (WHERE tenant_id = $1)      │
│ - Row-Level Security (RLS) as backup layer                 │
└─────────────────────────────────────────────────────────────┘
```

## Pattern 1: Tenant Context Middleware

```typescript
// Location: services/*/src/infrastructure/middleware/tenant.middleware.ts

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantContext: TenantContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      throw new UnauthorizedException('Missing X-Tenant-Id header');
    }

    // Set tenant context for this request
    this.tenantContext.setTenantId(tenantId);

    // Set PostgreSQL search_path to tenant schema
    req['tenantSchema'] = `tenant_${tenantId}`;

    next();
  }
}

// Apply in AppModule
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*'); // All routes require tenant context
  }
}
```

## Pattern 2: GraphQL Context Extraction

```typescript
// Location: services/*/src/presentation/graphql/context.ts

export interface GraphQLContext {
  req: Request;
  tenantId: string;
  userId: string;
}

// In GraphQLModule configuration
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

## Pattern 3: Tenant-Aware Resolvers

```typescript
// Use @CurrentTenant() decorator

@Resolver(() => Invoice)
export class InvoiceResolver {

  @Query(() => [Invoice])
  @UseGuards(JwtAuthGuard) // Always require auth first
  async invoices(
    @CurrentTenant() tenantId: string,
    @Args() args: InvoicesArgs,
  ): Promise<Invoice[]> {
    // tenantId automatically extracted from context
    // All queries scoped to this tenant
    return this.invoiceService.findAll(tenantId, args);
  }

  @Mutation(() => Invoice)
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('invoices:create') // RBAC on top of tenant isolation
  async createInvoice(
    @CurrentTenant() tenantId: string,
    @Args('input') input: CreateInvoiceInput,
  ): Promise<Invoice> {
    return this.invoiceService.create(tenantId, input);
  }
}
```

## Pattern 4: Schema-Based Isolation

```typescript
// TypeORM DataSource with dynamic schema
// Location: services/*/src/infrastructure/persistence/typeorm.config.ts

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      schema: this.getTenantSchema(), // Dynamic per request
      // ... other config
    };
  }

  private getTenantSchema(): string {
    const tenantId = this.tenantContext.getTenantId();
    return `tenant_${tenantId}`;
  }
}
```

## Pattern 5: Database Query Validation

```typescript
// Always include tenant_id in WHERE clause (defense in depth)

// Repository method
async findByCustomer(tenantId: string, customerId: string): Promise<Invoice[]> {
  return this.repository.find({
    where: {
      tenant_id: tenantId,  // CRITICAL: Never omit
      customer_id: customerId,
    },
  });
}

// Raw query (when needed)
async customQuery(tenantId: string, filters: any): Promise<any> {
  return this.repository.query(
    `SELECT * FROM invoices WHERE tenant_id = $1 AND status = $2`,
    [tenantId, filters.status]
  );
}
```

## Pattern 6: API Gateway Header Forwarding

```typescript
// Location: services/api-gateway/src/gateway.config.ts

export class GraphQLFederationConfig {
  createGqlOptions(): ApolloGatewayDriverConfig {
    return {
      gateway: {
        buildService({ url }) {
          return new RemoteGraphQLDataSource({
            url,
            willSendRequest({ request, context }) {
              // Forward critical headers to all services
              request.http.headers.set('authorization', context.req.headers.authorization);
              request.http.headers.set('x-tenant-id', context.req.headers['x-tenant-id']);
              request.http.headers.set('x-trace-id', context.req.headers['x-trace-id']);
            },
          });
        },
      },
    };
  }
}
```

## Pattern 7: EventStore Stream Isolation

```typescript
// For event-sourced services (Finance)
// Location: services/finance/src/infrastructure/event-store/

export class EventStoreService {
  async appendEvent(tenantId: string, streamName: string, event: DomainEvent): Promise<void> {
    // Prefix stream with tenant ID
    const tenantStream = `tenant-${tenantId}-${streamName}`;

    await this.eventStore.appendToStream(tenantStream, event);
  }

  async readStream(tenantId: string, streamName: string): Promise<DomainEvent[]> {
    const tenantStream = `tenant-${tenantId}-${streamName}`;
    return this.eventStore.readStream(tenantStream);
  }
}
```

## Cross-Tenant Prevention Checklist

Defense in Depth (5 Validation Layers):

1. **JWT Validation** (Layer 1)
   - [ ] JWT contains organizationId (tenantId)
   - [ ] Token signature verified
   - [ ] Token not expired

2. **Header Validation** (Layer 2)
   - [ ] X-Tenant-Id header present
   - [ ] X-Tenant-Id matches JWT organizationId
   - [ ] Header forwarded to all downstream services

3. **Middleware Validation** (Layer 3)
   - [ ] TenantMiddleware extracts and validates tenant
   - [ ] Tenant context set for request lifecycle
   - [ ] PostgreSQL schema switched to tenant schema

4. **Query Validation** (Layer 4)
   - [ ] All queries include WHERE tenant_id = $1
   - [ ] No raw queries without tenant filter
   - [ ] Schema isolation active (search_path set)

5. **Row-Level Security** (Layer 5 - Backup)
   - [ ] RLS policies enabled on tenant-aware tables
   - [ ] Fallback protection if application logic bypassed

## Tenant Switching Pattern

```typescript
// For admin operations (super-admin only)
@Mutation(() => Boolean)
@UseGuards(JwtAuthGuard, SuperAdminGuard)
async switchTenant(
  @Args('targetTenantId') targetTenantId: string,
): Promise<boolean> {
  // Validate super-admin has permission
  // Log tenant switch for audit
  // Switch context
  this.tenantContext.setTenantId(targetTenantId);
  return true;
}
```

## Configuration Pattern

```env
# Multi-tenancy settings
TENANT_ISOLATION_MODE=schema  # schema | row | hybrid
TENANT_SCHEMA_PREFIX=tenant_
ENABLE_CROSS_TENANT_QUERIES=false  # CRITICAL: Must be false
ENFORCE_TENANT_HEADER=true
```

## Testing Multi-Tenancy

```typescript
// Test suite for tenant isolation
describe('Tenant Isolation', () => {
  it('should prevent cross-tenant data access', async () => {
    // Setup: Create data in tenant1
    const tenant1Invoice = await createInvoice('tenant1', { ... });

    // Attempt: Access from tenant2
    const result = await queryInvoice('tenant2', tenant1Invoice.id);

    // Verify: No data returned
    expect(result).toBeNull();
  });

  it('should enforce X-Tenant-Id header', async () => {
    const promise = request
      .post('/graphql')
      .set('Authorization', 'Bearer token')
      // Missing X-Tenant-Id header
      .send({ query: '...' });

    await expect(promise).rejects.toThrow('Missing X-Tenant-Id header');
  });
});
```

## Common Mistakes to Avoid

❌ **Don't**:
- Omit tenant_id from WHERE clauses
- Use fallback values (`|| 'default'`)
- Skip header validation
- Allow cross-tenant queries in admin endpoints
- Trust only application-level isolation

✅ **Do**:
- Enforce 5-layer defense in depth
- Use schema isolation + application validation
- Log all tenant switches
- Test cross-tenant access prevention
- Fail secure (reject if no tenant context)

## Plan Mode Integration

In plan mode:
1. User requests feature with data access
2. Skill checks if tenant-aware
3. Presents isolation strategy
4. User approves approach
5. Execute with tenant validation

## Integration with Other Skills

- **Security First**: Works together for complete auth/authz
- **Database Migrations**: Ensures migrations apply to all tenant schemas
- **Event Sourcing**: Tenant prefixes on event streams
- **GraphQL Schema**: @CurrentTenant() decorator usage

## Resources

- Schema Isolation: services/organization/CLAUDE.md
- Tenant Context: services/auth/CLAUDE.md (lines 121-128)
- GraphQL Federation: services/api-gateway/CLAUDE.md (lines 258-262)
- EventStore Isolation: services/finance/CLAUDE.md (lines 109-119)

## Override

User can bypass with:
- "skip tenant validation for admin query"
- "this is a cross-tenant report"

Default: **ENFORCE TENANT ISOLATION**
