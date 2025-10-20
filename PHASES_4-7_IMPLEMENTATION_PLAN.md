# Phases 4-7 Implementation Plan - Ultimate Workflow Completion

**Date**: 2025-10-19
**Status**: Ready for Execution in Fresh Session
**Estimated Time**: 4-5 hours
**Context Required**: ~60-70k tokens

---

## Prerequisites Completed ✅

- ✅ Phase 1: CLAUDE.md cleaned (removed Current Task Status)
- ✅ Phase 2A: Environment variable set (CLAUDE_CODE_MAX_OUTPUT_TOKENS=16384)
- ✅ Phase 2B: 4 Haiku agents explored with comprehensive reports
- ✅ Phase 3A: Hooks directory deleted (backed up to ./hooks-backup-*)
- ✅ Phase 3B: Task file refactored (1,172 → 99 lines, checkpoint created)

---

## Agent Exploration Results Summary

All 4 agents completed successfully. Key findings:

### Agent 1: Skills Analysis
- **security-first/SKILL.md**: 614 lines → Target 190 lines (69% reduction)
- **event-sourcing/SKILL.md**: 467 lines → Target 210 lines (55% reduction)
- **graphql-schema/SKILL.md**: 435 lines → Target 220 lines (50% reduction)
- **execute-first, haiku-explorer, test-first**: All compliant, no changes needed

### Agent 2: Hooks Analysis
- All hooks safely deletable ✅
- Monitoring data exported to ./hooks-backup-monitoring/
- No external dependencies or integrations

### Agent 3: Service Patterns Extraction
- Database migration patterns identified (TypeORM, zero-downtime)
- Multi-tenancy patterns documented (schema isolation, context propagation)
- Production deployment patterns extracted (health checks, phased rollout)

### Agent 4: Protocol Verbosity Analysis
- task-startup.md: 337 → 180 lines (47% reduction)
- task-completion.md: 505 → 250 lines (51% reduction)
- compounding-cycle.md: 450 → 225 lines (50% reduction)
- task-creation.md: 263 → 130 lines (51% reduction)
- context-compaction.md: 308 → 155 lines (50% reduction)

---

## Phase 4: Skills Enhancement (Estimated: 2 hours)

### Phase 4A: Refine Existing 3 Skills (45 minutes)

#### 4A.1: security-first/SKILL.md (614 → 190 lines)

**Current Structure** (from agent analysis):
- Lines 1-43: Frontmatter + Security Principles
- Lines 45-104: Authentication Pattern (60 lines)
- Lines 107-192: Authorization Pattern (86 lines)
- Lines 195-302: Input Validation (108 lines)
- Lines 305-379: Sensitive Data Handling (75 lines)
- Lines 382-401: SQL Injection Prevention (20 lines)
- Lines 405-425: Rate Limiting (21 lines)
- Lines 429-490: Audit Logging (62 lines)
- Lines 494-513: Security Checklist (20 lines)
- Lines 516-559: Security Testing (44 lines)
- Lines 562-576: OWASP Top 10 (15 lines)
- Lines 579-615: Integration + Resources + Override (37 lines)

**Action Plan**:

1. **Create reference files**:
   ```
   .claude/skills/security-first/
   ├── SKILL.md (190 lines - NEW)
   ├── authentication.md (100 lines - EXTRACT from lines 45-104)
   ├── authorization.md (90 lines - EXTRACT from lines 107-192)
   ├── input-validation.md (85 lines - EXTRACT from lines 195-302)
   ├── data-protection.md (95 lines - EXTRACT from lines 305-379, 382-401, 405-425)
   ├── audit-compliance.md (90 lines - EXTRACT from lines 429-490, 516-559)
   └── threats-checklist.md (50 lines - EXTRACT from lines 494-513, 562-576)
   ```

2. **New SKILL.md structure** (190 lines):
   ```markdown
   ---
   name: Security First
   description: [KEEP EXISTING]
   allowed-tools: [KEEP EXISTING]
   ---

   # Security First Skill

   ## Purpose (8 lines)
   Enforce security-by-design for financial ERP system

   ## Activation Triggers (8 lines)
   "security", "auth", "permission", "rbac", "validation", "sensitive"

   ## Security Principles (15 lines)
   Defense in depth, least privilege, fail secure

   ## Defense in Depth Overview (12 lines)
   Brief overview of 6 security layers

   ## Quick Security Checklist (25 lines)
   Essential security items for every feature

   ## Pattern Overview (30 lines)
   Brief description of each pattern with reference links:
   - Authentication → See authentication.md
   - Authorization → See authorization.md
   - Input Validation → See input-validation.md
   - Data Protection → See data-protection.md
   - Audit & Compliance → See audit-compliance.md
   - Threat Reference → See threats-checklist.md

   ## Plan Mode Integration (10 lines)
   How skill works in plan mode workflow

   ## Integration with Execute First (10 lines)
   How skills coordinate

   ## Resources & References (12 lines)
   Links to extracted files and external docs

   ## Override (8 lines)
   User opt-out mechanism
   ```

3. **Files to create** (6 reference files):
   - Extract authentication patterns (JWT, guards, usage)
   - Extract authorization (RBAC, decorators, permissions)
   - Extract validation (DTO, GraphQL, sanitization)
   - Extract data protection (encryption, SQL injection, rate limiting)
   - Extract audit logging and security testing
   - Extract checklists and OWASP references

**Estimated time**: 20 minutes

---

#### 4A.2: event-sourcing/SKILL.md (467 → 210 lines)

**Current Structure** (from agent analysis):
- Lines 1-32: Frontmatter + CQRS Architecture
- Lines 36-117: Core Concepts (5 subsections, 82 lines)
- Lines 119-151: Domain Events (33 lines)
- Lines 153-181: Command Handler (29 lines)
- Lines 183-204: Query Handler (22 lines)
- Lines 206-246: Projection (41 lines)
- Lines 250-290: Best Practices (41 lines)
- Lines 293-360: Event Store Patterns (68 lines)
- Lines 363-401: Testing (39 lines)
- Lines 405-468: Checklist + Integration + Resources + Override (64 lines)

**Action Plan**:

1. **Create reference files**:
   ```
   .claude/skills/event-sourcing/
   ├── SKILL.md (210 lines - NEW)
   ├── core-patterns.md (165 lines - EXTRACT from lines 36-151, 206-246)
   └── advanced-patterns.md (110 lines - EXTRACT from lines 293-360, 363-401)
   ```

2. **New SKILL.md structure** (210 lines):
   ```markdown
   ---
   name: Event Sourcing
   description: [KEEP EXISTING]
   allowed-tools: [KEEP EXISTING]
   ---

   # Event Sourcing Skill

   ## Purpose (8 lines)

   ## Activation Triggers (8 lines)

   ## CQRS Architecture (12 lines)
   Keep diagram from lines 19-32

   ## Core Concepts Overview (25 lines)
   High-level overview with references to core-patterns.md
   - Aggregate Root
   - Domain Events
   - Command Handler
   - Query Handler
   - Projection

   ## Event Sourcing Best Practices (25 lines)
   Keep from lines 250-290 (condensed)

   ## Workflow Checklist (15 lines)
   Essential steps for event-sourced features

   ## Plan Mode Integration (10 lines)

   ## Integration with Execute First (10 lines)

   ## Resources & References (10 lines)
   Link to core-patterns.md and advanced-patterns.md

   ## Override (8 lines)
   ```

**Estimated time**: 15 minutes

---

#### 4A.3: graphql-schema/SKILL.md (435 → 220 lines)

**Current Structure** (from agent analysis):
- Lines 1-31: Frontmatter + Federation Architecture
- Lines 33-149: Schema Design Patterns (117 lines - 5 patterns)
- Lines 151-225: Resolver Patterns (75 lines - 3 patterns)
- Lines 228-272: Federation v2 Best Practices (45 lines)
- Lines 275-293: Naming Conventions (19 lines)
- Lines 295-322: Error Handling (28 lines)
- Lines 325-373: Testing GraphQL APIs (49 lines)
- Lines 376-436: Checklist + Integration + Resources + Override (61 lines)

**Action Plan**:

1. **Create reference files**:
   ```
   .claude/skills/graphql-schema/
   ├── SKILL.md (220 lines - NEW)
   ├── examples.md (145 lines - EXTRACT schema patterns + resolver patterns + testing)
   └── best-practices.md (75 lines - EXTRACT federation + error handling + common mistakes)
   ```

2. **New SKILL.md structure** (220 lines):
   ```markdown
   ---
   name: GraphQL Schema
   description: [KEEP EXISTING]
   allowed-tools: [KEEP EXISTING]
   ---

   # GraphQL Schema Skill

   ## Purpose (8 lines)

   ## Activation Triggers (8 lines)

   ## Federation Architecture (12 lines)
   Keep diagram

   ## Quick Reference (18 lines)
   Naming conventions (condensed)

   ## Schema Design Patterns (30 lines)
   Brief overview of 5 patterns with reference to examples.md

   ## Resolver Patterns (20 lines)
   Brief overview with reference to examples.md

   ## Federation v2 Essentials (25 lines)
   Core directives and patterns (condensed from best-practices.md)

   ## Tools & Setup (10 lines)

   ## Schema Checklist (15 lines)

   ## Plan Mode Integration (10 lines)

   ## Integration with Execute First (10 lines)

   ## References (8 lines)
   Link to examples.md and best-practices.md

   ## Override (8 lines)
   ```

**Estimated time**: 10 minutes

---

### Phase 4B: Create 3 New Skills (75 minutes)

#### 4B.1: database-migrations Skill (25 minutes)

**Target**: 350 lines
**Reference**: Agent 3 extraction results (TypeORM patterns, zero-downtime strategies)

**File Structure**:
```
.claude/skills/database-migrations/
├── SKILL.md (350 lines)
└── migration-examples.md (200 lines - optional, for future)
```

**SKILL.md Content**:

```markdown
---
name: Database Migrations
description: When creating database migrations, schema changes, or data migrations, activate this skill to enforce TypeORM zero-downtime patterns. Use when user says "migration", "schema change", "alter table", "database", "typeorm", or when modifying entity files.
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# Database Migrations Skill

## Purpose
Enforce safe, reversible, zero-downtime database migrations for Vextrus ERP

## Activation Triggers
- User says: "migration", "schema change", "alter table", "add column", "database", "typeorm"
- Working in: `services/*/src/migrations/`
- Modifying: Entity files (`*.entity.ts`)
- Creating: New tables, indexes, constraints

## Zero-Downtime Migration Strategy

[Content from Agent 3 extraction - TypeORM patterns]

### Pattern 1: Schema-Based Multi-Tenancy
- Separate PostgreSQL schemas per tenant
- Migration applies to all tenant schemas
- Tenant context isolation maintained

### Pattern 2: Event Sourcing + Read Model
- EventStore: Immutable events (no migrations)
- PostgreSQL: Read model projections (can rebuild)
- Strategy: New projection while old serves queries

### Pattern 3: Multi-Step Breaking Changes
1. Add new column (nullable)
2. Backfill data
3. Make non-nullable
4. Drop old column (separate migration)

## Migration File Structure

[TypeORM migration template from service-template]

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class DescriptiveAction1234567890123 implements MigrationInterface {
  name = 'DescriptiveAction1234567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Forward migration
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback migration
  }
}
```

## Critical Rules

1. **Always Reversible**: Every migration must have working `down()` method
2. **No Synchronize in Production**: `DATABASE_SYNCHRONIZE=false` always
3. **Test on Staging First**: Fresh database + rollback procedure
4. **Index Strategy**: Create index before dropping old one
5. **Multi-Tenant Safe**: Apply to all tenant schemas

## Index Creation Pattern

```typescript
// Good: Create new index first, then drop old
await queryRunner.query(`CREATE INDEX idx_invoices_customer_new ON invoices (customer_id, created_at)`);
// Test queries use new index
await queryRunner.query(`DROP INDEX idx_invoices_customer_old`);

// Bad: Drop first (query degradation window)
await queryRunner.query(`DROP INDEX idx_invoices_customer_old`);
await queryRunner.query(`CREATE INDEX idx_invoices_customer_new ...`);
```

## Data Migration Pattern

```typescript
// Separate data migration from schema migration
export class MigrateCustomerData1234567890124 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Batch processing for large datasets
    const batchSize = 1000;
    let offset = 0;

    while (true) {
      const result = await queryRunner.query(`
        UPDATE customers
        SET new_field = old_field
        WHERE id IN (
          SELECT id FROM customers
          WHERE new_field IS NULL
          LIMIT ${batchSize}
        )
      `);

      if (result.affectedRows === 0) break;
      offset += batchSize;
    }
  }
}
```

## Rollback Procedures

### Event Sourcing Services (Finance)
- Events immutable, never rolled back
- Rollback: Replay events, rebuild read model
- Projection can be dropped and recreated

### Standard Services
- Execute migration `down()` method
- Verify data integrity after rollback
- Test rollback procedure in staging

## Multi-Tenant Migration

```typescript
// Apply migration to all tenant schemas
export class MultiTenantMigration implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tenants = await queryRunner.query(`
      SELECT schema_name FROM information_schema.schemata
      WHERE schema_name LIKE 'tenant_%'
    `);

    for (const tenant of tenants) {
      await queryRunner.query(`SET search_path TO ${tenant.schema_name}`);
      // Apply migration in tenant schema
      await queryRunner.query(`ALTER TABLE invoices ADD COLUMN status VARCHAR(50)`);
    }

    await queryRunner.query(`SET search_path TO public`);
  }
}
```

## Configuration Pattern

```env
# Production settings (from agent extraction)
DATABASE_SYNCHRONIZE=false  # CRITICAL: Never true in production
DATABASE_LOGGING=false
DATABASE_MIGRATIONS=src/migrations/*.ts
DATABASE_MIGRATIONS_RUN=true  # Auto-run on startup
```

## Migration Checklist

Before creating migration:
- [ ] Read existing entity definitions
- [ ] Check for breaking changes (column drops, type changes)
- [ ] Plan multi-step approach if breaking
- [ ] Consider index creation order

After creating migration:
- [ ] Test on fresh database
- [ ] Test rollback procedure
- [ ] Verify data integrity
- [ ] Check query performance with new indexes
- [ ] Test across all tenant schemas
- [ ] Disable synchronize if enabled

## Plan Mode Integration

In plan mode:
1. User requests schema change
2. Skill analyzes breaking vs non-breaking
3. Presents multi-step plan if needed
4. User approves approach
5. Execute migration creation

## Integration with Execute First

- Execute First: Creates migration files
- Database Migrations: Ensures safety patterns
- Security First: Validates data access in migrations
- Multi-Tenancy: Ensures tenant isolation maintained

## Common Mistakes to Avoid

❌ **Don't**:
- Drop columns without multi-step migration
- Use `DATABASE_SYNCHRONIZE=true` in production
- Skip `down()` method implementation
- Forget to test rollback
- Apply destructive operations directly

✅ **Do**:
- Always create reversible migrations
- Test on staging with production-like data
- Use batch processing for data migrations
- Create indexes before dropping old ones
- Document breaking changes

## Resources

- TypeORM Migrations: https://typeorm.io/migrations
- Zero-Downtime Deployments: https://github.com/rails/strong_migrations
- Multi-Tenant Migrations: services/organization/CLAUDE.md
- Event Sourcing Migrations: services/finance/CLAUDE.md

## Override

User can bypass with:
- "skip migration safety checks"
- "I'll handle rollback manually"

Default: **ENFORCE ZERO-DOWNTIME PATTERNS**
```

**Key Content Sources**:
- Agent 3 extraction: TypeORM patterns, multi-tenancy, rollback procedures
- Service CLAUDE.md files: finance, organization, master-data
- Best practices: Zero-downtime deployments, index strategies

---

#### 4B.2: multi-tenancy Skill (25 minutes)

**Target**: 300 lines
**Reference**: Agent 3 extraction results (tenant context, schema isolation)

**File Structure**:
```
.claude/skills/multi-tenancy/
└── SKILL.md (300 lines)
```

**SKILL.md Content**:

```markdown
---
name: Multi-Tenancy
description: When working with multi-tenant features, tenant context, or data isolation, activate this skill to enforce tenant isolation patterns. Use when user says "tenant", "multi-tenant", "schema isolation", "organization", "x-tenant-id", or when creating queries/mutations that access tenant data.
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
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

[From Agent 3 extraction - finance/auth services]

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
// Use @CurrentTenant() decorator (from workflow, rules-engine)

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
```

**Key Content Sources**:
- Agent 3 extraction: All 5 tenant context patterns
- Service CLAUDE.md: finance, auth, master-data, api-gateway, organization
- Defense in depth: 5 validation layers from extraction

---

#### 4B.3: production-deployment Skill (25 minutes)

**Target**: 400 lines
**Reference**: Agent 3 extraction results (health checks, phased rollout, observability)

**File Structure**:
```
.claude/skills/production-deployment/
└── SKILL.md (400 lines)
```

**SKILL.md Content**:

```markdown
---
name: Production Deployment
description: When deploying to production, creating phased rollouts, or setting up observability, activate this skill to enforce production-ready patterns. Use when user says "deploy", "production", "rollout", "monitoring", "observability", "k8s", "kubernetes", "health check".
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# Production Deployment Skill

## Purpose
Ensure production deployments are safe, monitored, reversible, and follow Vextrus ERP phased rollout strategy

## Activation Triggers
- User says: "deploy", "production", "rollout", "monitoring", "observability", "k8s", "kubernetes"
- Working in: k8s/ directories, health endpoints, observability setup
- Creating: Deployment manifests, health checks, metrics endpoints
- Modifying: Service configurations for production

## Phased Rollout Strategy

Vextrus ERP Standard (from Finance service pattern):

```
Week 1:  20% traffic → Early adopters, monitoring baseline
Week 2:  50% traffic → Expand, validate performance
Week 3:  80% traffic → Near-full deployment
Week 4: 100% traffic → Complete rollout

Rollback trigger: Any critical metric degradation
```

### Week-by-Week Configuration

```yaml
# Week 1: 20% (k8s/03-production-week1-20percent.yaml)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finance-service-v2
spec:
  replicas: 1  # 20% of total capacity (5 pods = 100%)
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0  # Zero downtime requirement

# Week 4: 100% (k8s/09-production-week4-100percent.yaml)
spec:
  replicas: 5  # Full capacity
```

## Three-Tier Health Check System

[From Agent 3 extraction - organization, auth, finance services]

### Tier 1: Liveness Probe (`/health/live`)

**Purpose**: Container orchestration (Docker/K8s)
**Response Time**: <100ms
**Checks**: Process alive only (minimal resource validation)

```typescript
// Location: services/*/src/health/health.controller.ts

@Get('/health/live')
@Public() // No authentication for liveness
async checkLiveness(): Promise<HealthResponse> {
  return {
    status: 'alive',
    uptime: process.uptime(),
    memory: process.memoryUsage().heapUsed,
    timestamp: new Date().toISOString(),
  };
}
```

**Kubernetes Usage**:
```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

### Tier 2: Readiness Probe (`/health/ready`)

**Purpose**: Load balancer traffic routing
**Response Time**: <500ms
**Checks**: All critical dependencies (Database, Redis, Kafka, EventStore)

```typescript
@Get('/health/ready')
@Public()
async checkReadiness(): Promise<ReadinessResponse> {
  const checks = await Promise.all([
    this.checkDatabase(),
    this.checkRedis(),
    this.checkKafka(),
    this.checkEventStore(), // For event-sourced services
  ]);

  const allReady = checks.every(check => check.status === 'ready');

  return {
    status: allReady ? 'ready' : 'not_ready',
    checks: {
      database: checks[0].status,
      redis: checks[1].status,
      kafka: checks[2].status,
      eventstore: checks[3]?.status,
    },
    timestamp: new Date().toISOString(),
  };
}

private async checkDatabase(): Promise<{ status: string }> {
  try {
    await this.dataSource.query('SELECT 1');
    return { status: 'ready' };
  } catch (error) {
    return { status: 'not_ready' };
  }
}
```

**Kubernetes Usage**:
```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 20
  periodSeconds: 5
  timeoutSeconds: 3
  successThreshold: 3  # Must pass 3 times before routing traffic
  failureThreshold: 2
```

### Tier 3: Comprehensive Health (`/health`)

**Purpose**: Monitoring dashboards, alerting systems
**Response Time**: <2s
**Checks**: Full system health + metadata

```typescript
@Get('/health')
@Public()
async checkHealth(): Promise<ComprehensiveHealthResponse> {
  return {
    status: 'healthy',
    version: process.env.SERVICE_VERSION,
    uptime: process.uptime(),
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
      limit: os.totalmem(),
    },
    database: await this.checkDatabaseHealth(),
    redis: await this.checkRedisHealth(),
    kafka: await this.checkKafkaHealth(),
    eventstore: await this.checkEventStoreHealth(),
    dependencies: {
      auth: await this.pingService('auth-service'),
      masterData: await this.pingService('master-data-service'),
    },
    timestamp: new Date().toISOString(),
  };
}
```

## Observability Setup

### OpenTelemetry Configuration

[From Agent 3 extraction - auth service lines 96-102]

```typescript
// Location: services/*/src/telemetry/telemetry.module.ts

@Global()
@Module({
  imports: [
    OpenTelemetryModule.forRoot({
      serviceName: process.env.OTEL_SERVICE_NAME || 'vextrus-service',
      serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
      traceExporter: {
        otlp: {
          url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
          headers: JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS || '{}'),
        },
      },
      metricExporter: {
        otlp: {
          url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
          exportIntervalMillis: parseInt(process.env.OTEL_METRIC_EXPORT_INTERVAL || '10000'),
        },
      },
      instrumentations: [
        new HttpInstrumentation(),
        new NestInstrumentation(),
        new PgInstrumentation(),
      ],
    }),
  ],
})
export class TelemetryModule {}
```

### Environment Variables

```env
# Observability (Production)
OTEL_SERVICE_NAME=finance-service
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.monitoring:4317
OTEL_EXPORTER_OTLP_HEADERS={"x-api-key":"production-key"}
SERVICE_VERSION=1.2.3
OTEL_METRIC_EXPORT_INTERVAL=10000
OTEL_CONSOLE_EXPORTER=false  # Disable console in prod
```

### Distributed Tracing

```typescript
// Automatic W3C Trace Context propagation
// From auth service (lines 121-128)

export class TracePropagationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const span = trace.getActiveSpan();

    if (span) {
      // Enrich span with business context
      span.setAttributes({
        'user.id': request.user?.id,
        'tenant.id': request.headers['x-tenant-id'],
        'request.method': request.method,
        'request.url': request.url,
      });
    }

    return next.handle();
  }
}
```

### Prometheus Metrics

```typescript
// Location: services/*/src/metrics/metrics.controller.ts

@Controller('metrics')
export class MetricsController {
  @Get()
  @Public()
  async getMetrics(): Promise<string> {
    return register.metrics(); // Prometheus text format
  }
}

// Custom business metrics
const invoiceCreationCounter = new Counter({
  name: 'invoice_creation_total',
  help: 'Total number of invoices created',
  labelNames: ['tenant_id', 'status'],
});

invoiceCreationCounter.inc({ tenant_id: 'org1', status: 'draft' });
```

## Kubernetes Integration

### Zero-Downtime Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finance-service
  labels:
    app: finance-service
    version: v1.2.3
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Max 1 extra pod during update
      maxUnavailable: 0  # Zero downtime requirement

  selector:
    matchLabels:
      app: finance-service

  template:
    metadata:
      labels:
        app: finance-service
        version: v1.2.3
    spec:
      containers:
      - name: finance-service
        image: vextrus/finance-service:v1.2.3
        ports:
        - containerPort: 3000

        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_HOST
          valueFrom:
            secretKeyRef:
              name: finance-db-credentials
              key: host

        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"

        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3

        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 20
          periodSeconds: 5
          timeoutSeconds: 3
          successThreshold: 3
          failureThreshold: 2
```

### Service Definition

```yaml
apiVersion: v1
kind: Service
metadata:
  name: finance-service
spec:
  selector:
    app: finance-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

## Rollback Procedures

### Automatic Rollback Triggers

[From Agent 3 extraction - finance lines 101-125]

1. **Readiness Probe Failure** (3 consecutive failures)
   - K8s stops routing traffic to unhealthy pods
   - Old version continues serving requests

2. **Critical Business Metric Degradation**
   - Error rate >5% (vs baseline <1%)
   - Response time >2x baseline
   - Database connection pool exhaustion

3. **Dependency Unavailability**
   - EventStore connection drops
   - Database unavailable >30s
   - Redis cache unavailable

### Manual Rollback Procedure

```bash
# Check current deployment
kubectl get deployments -n vextrus

# View deployment history
kubectl rollout history deployment/finance-service -n vextrus

# Rollback to previous version
kubectl rollout undo deployment/finance-service -n vextrus

# Rollback to specific revision
kubectl rollout undo deployment/finance-service --to-revision=3 -n vextrus

# Monitor rollback progress
kubectl rollout status deployment/finance-service -n vextrus
```

### Event Sourcing Rollback

For event-sourced services (Finance):
```typescript
// Events immutable, rollback via projection rebuild
export class ProjectionRollbackService {
  async rollbackToVersion(version: number): Promise<void> {
    // 1. Stop new projections
    await this.projectionManager.stop();

    // 2. Clear current read model
    await this.readModelRepository.truncate();

    // 3. Replay events up to target version
    const events = await this.eventStore.readAllEvents({
      maxVersion: version,
    });

    // 4. Rebuild projections
    for (const event of events) {
      await this.projectionHandler.handle(event);
    }

    // 5. Resume normal operation
    await this.projectionManager.start();
  }
}
```

## Production Configuration Pattern

```env
# Service Identity
NODE_ENV=production
PORT=3006
SERVICE_VERSION=1.2.3

# Security
JWT_SECRET=[from-vault]
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Database (Connection Pooling)
DATABASE_HOST=prod-db.internal
DATABASE_PORT=5432
DATABASE_USER=[from-secrets-manager]
DATABASE_PASSWORD=[from-secrets-manager]
DATABASE_NAME=vextrus_finance
DATABASE_SYNCHRONIZE=false  # CRITICAL
DATABASE_LOGGING=false
DATABASE_POOL_SIZE=20
DATABASE_POOL_MAX=50

# Caching
REDIS_HOST=prod-redis.internal
REDIS_PORT=6379
REDIS_PASSWORD=[from-secrets-manager]
CACHE_TTL=300

# Messaging
KAFKA_BROKERS=kafka-1.internal:9092,kafka-2.internal:9092,kafka-3.internal:9092
KAFKA_CLIENT_ID=finance-service-prod
KAFKA_GROUP_ID=finance-service-prod-group

# Observability
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.monitoring:4317
OTEL_SERVICE_NAME=finance-service
OTEL_EXPORTER_OTLP_HEADERS={"x-api-key":"[from-vault]"}
SERVICE_VERSION=1.2.3
```

## Deployment Checklist

Before deployment:
- [ ] All tests passing (unit + integration + e2e)
- [ ] Security scan clean (`/security-scan`)
- [ ] Database migrations tested on staging
- [ ] Health checks implemented (3 tiers)
- [ ] Observability configured (OTEL + Prometheus)
- [ ] Secrets in vault (not env vars)
- [ ] Resource limits defined (memory + CPU)
- [ ] Rollback procedure documented
- [ ] Phased rollout plan approved

During deployment:
- [ ] Monitor health checks (readiness passes)
- [ ] Watch error rates (should stay <1%)
- [ ] Check response times (<300ms p95)
- [ ] Verify distributed tracing working
- [ ] Validate metrics exporting
- [ ] Test database connection pool
- [ ] Confirm EventStore connectivity (if applicable)

After deployment:
- [ ] All pods healthy (kubectl get pods)
- [ ] Traffic routing correctly
- [ ] No elevated error rates
- [ ] Performance within SLOs
- [ ] Logs flowing to aggregator
- [ ] Alerts configured and silent
- [ ] Documentation updated

## Common Mistakes to Avoid

❌ **Don't**:
- Skip readiness probes (traffic routed too early)
- Use comprehensive health for K8s probes (too slow)
- Store secrets in environment variables
- Deploy without rollback plan
- Skip phased rollout for critical services
- Forget to set resource limits

✅ **Do**:
- Implement all 3 health check tiers
- Use secrets manager for credentials
- Define resource requests + limits
- Test rollback procedure in staging
- Monitor during phased rollout
- Document deployment steps

## Plan Mode Integration

In plan mode:
1. User requests production deployment
2. Skill presents phased rollout plan
3. User approves week-by-week strategy
4. Execute deployment with monitoring

## Integration with Other Skills

- **Database Migrations**: Ensure migrations run before deployment
- **Multi-Tenancy**: Validate tenant isolation maintained
- **Security First**: Verify secrets management
- **Event Sourcing**: EventStore connectivity in health checks

## Resources

- Health Check Patterns: services/organization/CLAUDE.md (lines 39-44)
- Phased Rollout: services/finance/k8s/ deployments
- OpenTelemetry: services/auth/CLAUDE.md (lines 96-102)
- Kubernetes Best Practices: https://kubernetes.io/docs/concepts/configuration/

## Override

User can bypass with:
- "skip phased rollout for hotfix"
- "deploy directly to 100%"

Default: **ENFORCE PHASED ROLLOUT**
```

**Key Content Sources**:
- Agent 3 extraction: All health check patterns, phased rollout, observability
- Service CLAUDE.md: finance, auth, organization, api-gateway
- Kubernetes: Zero-downtime strategies from finance k8s/ files

---

## Phase 5: Sessions Directory Overhaul (Estimated: 1.5 hours)

### Phase 5A: Simplify 5 Core Protocols (60 minutes)

Based on Agent 4 verbosity analysis, each protocol needs 40-50% reduction.

#### 5A.1: task-startup.md (337 → 180 lines) - 15 minutes

**Sections to Keep**:
- Section 0: Load Task Context (concise)
- Section 1: Load Project Constitution (reference only)
- Section 3: Quick Context - /explore (critical)
- Section 5: MCP On-Demand (just data)
- Section 6: Update Task File Status (template)
- Section 8: Verify Understanding (checklist)
- Section 9: Work Mode (6 principles)
- Quick Checklist

**Sections to Trim**:
- Section 2 (Load Feature Spec): 18 → 5 lines
- Section 3 (Service Context): 33 → 12 lines (consolidate subsections)
- Section 4 (Context Optimization): 39 → 15 lines (remove redundant examples)
- Section 7 (Git Workflow): 22 → 8 lines (remove "complex scenarios" text)
- Section 10 (Example Message): Remove entirely (redundant with checklist)

**Sections to Extract**:
- Context Optimization philosophy → `sessions/knowledge/vextrus-erp/guides/context-optimization.md`

**New Addition**:
```markdown
## Plan Mode Workflow

**Default assumption**: User starts in plan mode (⏸)

1. User enters plan mode and describes task
2. Claude researches and asks clarifying questions (AskUserQuestion)
3. Claude presents comprehensive plan (ExitPlanMode)
4. User approves plan
5. Claude executes approved plan
6. User reviews results

Only skip plan mode if user explicitly executes immediately.
```

#### 5A.2: task-completion.md (505 → 250 lines) - 15 minutes

**Sections to Keep**:
- Section 1: Pre-Completion Checks
- Section 2A: Automated Quality Gates
- Section 2B: Advanced Reviews (condensed list)
- Section 2C: Domain-Specific Validations (checklists only)
- Section 7: Git Operations
- Complete Checklist (condensed)

**Sections to Trim**:
- Section 2B (Advanced Reviews): 41 → 12 lines (remove agent descriptions, simple list)
- Section 3 (Documentation Updates): 33 → 10 lines (remove subsection headers)
- Section 4 (Codify Learnings): 40 → 15 lines (condense 5 questions to 3 bullets)
- Section 8 (Select Next Task): 43 → 12 lines (remove message templates)
- Section 9 (Create PR): 33 → 5 lines (command only)
- Complete Checklist: 58 → 20 lines (flatten categories)

**Sections to Extract**:
- Codify questions detailed → `sessions/knowledge/vextrus-erp/patterns/codify-questions-template.md`
- PR template → `sessions/templates/pull-request-template.md`
- Complete checklist detailed → `sessions/knowledge/vextrus-erp/checklists/completion-checklist-detailed.md`

**New Addition**: Plan Mode Integration section

#### 5A.3: compounding-cycle.md (450 → 225 lines) - 15 minutes

**Sections to Keep**:
- Philosophy (condensed quote only)
- When to Use (decision matrix)
- Four Phases overview
- PLAN/DELEGATE/ASSESS/CODIFY summaries (brief)
- Quick Reference

**Sections to Trim**:
- When to Use: 19 → 8 lines (remove redundant examples)
- PLAN phase: 58 → 25 lines (remove agent descriptions, reference SpecKit template)
- ASSESS phase: 47 → 18 lines (flatten 4-level structure to simple list)
- Complete Example: 101 → 35 lines (remove subsection headers, condense)
- Philosophy: Remove duplicate (keep at end only)

**Sections to Extract**:
- PLAN phase SpecKit sections → Reference `sessions/specs/TEMPLATE.md`
- Complete example walkthrough → `sessions/knowledge/vextrus-erp/workflows/compounding-example-invoice-payment.md`
- Metrics → `sessions/knowledge/vextrus-erp/workflows/compounding-metrics.md`

**New Addition**: Plan Mode Integration (how compounding works in plan mode)

#### 5A.4: task-creation.md (263 → 130 lines) - 10 minutes

**Sections to Keep**:
- Priority Prefix System (reference format)
- Task Type Prefix Enum (reference format)
- File vs Directory Decision
- Creating a Task steps 1-3
- Quick Checklist
- Philosophy

**Sections to Trim**:
- Configuration: 3 → 1 line
- Priority Prefix System: 14 → 8 lines
- Task Type Prefix Enum: 13 → 8 lines
- SpecKit section: 32 → 8 lines (remove benefits, "when to skip")
- Review Constitution: 15 → 3 lines (one-liner reference)
- Context Gathering: 26 → 6 lines (remove benefits, anti-patterns)
- Starting Work: 31 → 10 lines (remove JSON commentary)
- Task Evolution: 7 → 3 lines
- For Agents: 10 → 5 lines

**Sections to Extract**:
- SpecKit detailed → `sessions/specs/TEMPLATE.md`
- Context gathering philosophy → `sessions/knowledge/vextrus-erp/guides/context-gathering-guide.md`

**New Addition**: Plan Mode assumption at top

#### 5A.5: context-compaction.md (308 → 155 lines) - 5 minutes

**Sections to Keep**:
- When to Use (trigger conditions)
- Section 1: Update Task State
- Section 2: Update Task File (concise)
- Section 4: Context Optimization Check (checklist only)
- Section 5: Create Checkpoint (reference only)
- Section 6: Verify Quality State
- Quick Checklist
- Related Protocols

**Sections to Trim**:
- Work Log subsection: 14 → 6 lines
- Section 3 (Update Documentation): 17 → 5 lines
- Section 4 (Context Check): 40 → 15 lines (remove explanatory text)
- Section 5 (Checkpoint): 27 → 10 lines (remove template, reference file)
- Section 7 (Announce Readiness): 23 → 5 lines (remove template)
- Context Optimization Tips: 40 → 0 lines (EXTRACT to reference file)
- Philosophy: 10 → 4 lines
- Complete Checklist: 14 → 8 lines

**Sections to Extract**:
- Context Optimization Tips → `sessions/knowledge/vextrus-erp/guides/context-optimization-tips.md`
- Checkpoint template → `sessions/templates/checkpoint-template.md`
- Announce readiness message → `sessions/templates/compaction-ready-announcement.md`

**New Addition**: Plan Mode Integration section

---

### Phase 5B: Restructure Knowledge Base (30 minutes)

**Current Structure**:
```
sessions/knowledge/vextrus-erp/
├── README.md
├── agent-catalog.md
├── context-optimization-tips.md
├── plugin-usage-guide.md
├── quality-gates-checklist.md
└── workflow-patterns.md
```

**New Structure**:
```
sessions/knowledge/vextrus-erp/
├── README.md (updated index with category links)
├── patterns/
│   ├── event-sourcing-examples.md (extracted from skill)
│   ├── graphql-federation-patterns.md (extracted from skill)
│   ├── multi-tenancy-patterns.md (NEW - from new skill)
│   ├── migration-strategies.md (NEW - from new skill)
│   ├── deployment-procedures.md (NEW - from new skill)
│   └── codify-questions-template.md (extracted from protocol)
├── checklists/
│   ├── quality-gates.md (renamed from quality-gates-checklist.md)
│   ├── bangladesh-compliance.md (NEW - extracted from security-first skill)
│   ├── security-checklist.md (extracted from security-first skill)
│   └── completion-checklist-detailed.md (extracted from task-completion protocol)
├── guides/
│   ├── context-optimization.md (renamed + expanded)
│   ├── plugin-usage.md (renamed from plugin-usage-guide.md)
│   ├── agent-selection.md (renamed from agent-catalog.md)
│   └── context-gathering-guide.md (NEW - extracted from task-creation)
└── workflows/
    ├── proven-patterns.md (renamed from workflow-patterns.md)
    ├── compounding-example-invoice-payment.md (NEW - extracted from protocol)
    └── compounding-metrics.md (NEW - extracted from protocol)
```

**Action Items**:
1. Create 4 new directories (patterns, checklists, guides, workflows)
2. Move existing 6 files to appropriate categories with renames
3. Extract 12 new reference files from skills and protocols
4. Update README.md with categorized quick links
5. Create symbolic link from old paths to new (backward compatibility)

---

## Phase 6: Update Documentation and Test (Estimated: 30 minutes)

### 6A: Update Root CLAUDE.md (5 minutes)

**Changes**:
- Add references to new 3 skills (database-migrations, multi-tenancy, production-deployment)
- Update total skill count (6 → 9)
- Add plan mode workflow section
- Update knowledge base structure references

**Section to add**:
```markdown
## Skills (9 Auto-Activating)

### Core Development (3)
- **execute-first** - Code-first workflow
- **haiku-explorer** - Fast Haiku 4.5 exploration
- **test-first** - TDD enforcement

### Domain Patterns (3)
- **event-sourcing** - CQRS + Event Sourcing
- **graphql-schema** - GraphQL Federation v2
- **security-first** - Security-by-design

### Infrastructure (3)
- **database-migrations** - Zero-downtime migrations
- **multi-tenancy** - Tenant isolation
- **production-deployment** - Safe deployments

## Plan Mode Workflow (Default)

All tasks start in plan mode (⏸):
1. User describes task in plan mode
2. Claude researches + asks clarifying questions
3. Claude presents comprehensive plan (ExitPlanMode)
4. User approves plan
5. Claude executes
6. User reviews results

Exit plan mode only when approved.
```

### 6B: Update ULTIMATE_WORKFLOW_DESIGN.md (10 minutes)

**Changes**:
- Add Phase 4B results (3 new skills created)
- Update skills section with new infrastructure category
- Add agent scoping strategy improvements
- Add plan mode workflow section (Section XVII)
- Update Phase-by-Phase Development with new skills mapped
- Update Quick Reference Card with new skill triggers

### 6C: Test Skills Activation (10 minutes)

**Verification prompts**:

1. **database-migrations activation**:
   ```
   User: "create migration for adding payment_status column"
   Expected: database-migrations skill activates
   Verify: Checks for reversible migration, zero-downtime pattern
   ```

2. **multi-tenancy activation**:
   ```
   User: "implement tenant isolation for invoices query"
   Expected: multi-tenancy skill activates
   Verify: Enforces 5-layer defense in depth, X-Tenant-Id header check
   ```

3. **production-deployment activation**:
   ```
   User: "deploy finance service to production with monitoring"
   Expected: production-deployment skill activates
   Verify: Suggests phased rollout, health checks, observability setup
   ```

4. **Multi-skill coordination**:
   ```
   User: "create new payment table with multi-tenant isolation for production"
   Expected: database-migrations + multi-tenancy + production-deployment activate
   Verify: All 3 skills coordinate (migration applies to tenant schemas, health checks added)
   ```

**Test Method**:
- Create test prompts file
- Execute each prompt
- Verify correct skills activate via skill name in response
- Check guidance matches skill content

---

## Phase 7: Create Migration Guide and Skills README (Estimated: 20 minutes)

### 7A: Create Skills README (10 minutes)

**File**: `.claude/skills/README.md`

```markdown
# Vextrus ERP Skills

9 domain-specific skills for building production-ready ERP system with Claude Code.

## What Are Skills?

Skills are reusable prompt fragments that give Claude specialized capabilities. They:
- Auto-activate based on trigger words
- Load progressively (metadata → skill → references)
- Work together for complex tasks
- Enforce Vextrus ERP patterns and best practices

## Skill Categories

### Core Development (3 skills)

#### execute-first
**Triggers**: "implement", "fix", "add", "update", "refactor", "build"
**Purpose**: Code-first workflow, skip unnecessary planning
**Lines**: 93 (Anthropic compliant ✅)

#### haiku-explorer
**Triggers**: "where", "find", "understand", "how does", "what is"
**Purpose**: Fast Haiku 4.5 exploration, 98.6% context savings
**Lines**: 160 (Anthropic compliant ✅)

#### test-first
**Triggers**: "test", "TDD", financial calculations
**Purpose**: Test-driven development for critical features
**Lines**: 256 (Anthropic compliant ✅)

### Domain Patterns (3 skills)

#### event-sourcing
**Triggers**: "aggregate", "event", "domain", "CQRS", "command"
**Purpose**: CQRS + Event Sourcing for Finance service
**Lines**: 210 (Refactored ✅)
**References**: core-patterns.md, advanced-patterns.md

#### graphql-schema
**Triggers**: "graphql", "schema", "resolver", "query", "mutation"
**Purpose**: GraphQL Federation v2 patterns across 18 services
**Lines**: 220 (Refactored ✅)
**References**: examples.md, best-practices.md

#### security-first
**Triggers**: "security", "auth", "permission", "rbac", "validation"
**Purpose**: Security-by-design for financial ERP
**Lines**: 190 (Refactored ✅)
**References**: authentication.md, authorization.md, input-validation.md, data-protection.md, audit-compliance.md, threats-checklist.md

### Infrastructure (3 skills - NEW)

#### database-migrations
**Triggers**: "migration", "schema change", "alter table", "database"
**Purpose**: TypeORM zero-downtime migrations
**Lines**: 350
**Patterns**: Multi-tenant migrations, event sourcing, rollback procedures

#### multi-tenancy
**Triggers**: "tenant", "multi-tenant", "schema isolation", "organization"
**Purpose**: 5-layer tenant isolation enforcement
**Lines**: 300
**Patterns**: Schema isolation, context propagation, cross-tenant prevention

#### production-deployment
**Triggers**: "deploy", "production", "rollout", "monitoring", "k8s"
**Purpose**: Phased rollouts, health checks, observability
**Lines**: 400
**Patterns**: 3-tier health checks, OpenTelemetry, Kubernetes integration

## How Skills Work

### Automatic Activation
```
User: "implement invoice payment with security"

Skills activated:
- execute-first (orchestration)
- test-first (TDD for payment logic)
- graphql-schema (payment mutation)
- event-sourcing (PaymentProcessed event)
- security-first (RBAC guard)
```

### Progressive Disclosure
```
Level 1 (Always loaded): Skill metadata (~100 tokens)
Level 2 (On activation): SKILL.md content (~200-400 lines)
Level 3 (On-demand): Reference files (only if needed)
```

### Plan Mode Integration
All skills work in plan mode:
1. User describes task in plan mode
2. Skills analyze and ask clarifying questions
3. Present comprehensive plan
4. User approves
5. Execute with skill guidance

## Skill Design Principles

Following Anthropic best practices:

1. **<500 lines** - SKILL.md files stay concise
2. **Clear triggers** - Activation keywords obvious
3. **Progressive disclosure** - Extract large sections to reference files
4. **Allowed-tools** - Only necessary tools listed
5. **Plan mode aware** - All skills assume plan mode workflow

## Adding New Skills

1. Create directory: `.claude/skills/[skill-name]/`
2. Create SKILL.md with frontmatter:
   ```yaml
   ---
   name: Skill Name
   description: When user says "trigger words", activate this skill...
   allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task]
   ---
   ```
3. Restart Claude Code (skills load at startup)
4. Test activation with trigger phrases

## Resources

- Anthropic Skills: https://www.anthropic.com/news/skills
- Skills GitHub: https://github.com/anthropics/skills
- Claude Code Skills Docs: https://docs.claude.com/en/docs/claude-code/skills
- Vextrus ERP Workflow: /ULTIMATE_WORKFLOW_DESIGN.md

## Success Metrics

- 9/9 skills <500 lines (100% Anthropic compliant)
- 3/9 skills use progressive disclosure
- 100% coverage for Vextrus ERP patterns
- 40+ tasks proven with skill workflow
- 98.6% context savings via Haiku Explorer

---

**Version**: 2.0 (Infrastructure Skills Added)
**Updated**: 2025-10-19
**Total Lines**: 2,525 (avg 281 lines/skill)
```

### 7B: Create Migration Guide (10 minutes)

**File**: `WORKFLOW_V7_MIGRATION_GUIDE.md`

```markdown
# Workflow v7.0 Migration Guide

**From**: v6.0 (Execute First)
**To**: v7.0 (Ultimate Agentic Workflow)
**Date**: 2025-10-19
**Breaking Changes**: Yes (hooks removed, knowledge base restructured)

## What Changed

### 1. Settings & Hooks

**Before (v6.0)**:
- 4 active hooks (session-start, user-messages, post-tool-use, sessions-enforce)
- Hooks in .claude/settings.json
- 12 Python files in .claude/hooks/

**After (v7.0)**:
- ✅ Zero hooks (skills-only architecture)
- ✅ .claude/hooks/ directory deleted
- ✅ Monitoring data backed up to ./hooks-backup-monitoring/
- ✅ Minimal settings.json (schema reference only)

**Migration**: No action needed, already completed in Phase 3

### 2. Skills System

**Before (v6.0)**:
- 6 skills (execute-first, haiku-explorer, test-first, graphql-schema, event-sourcing, security-first)
- 3 skills >400 lines (exceeding Anthropic recommendations)

**After (v7.0)**:
- ✅ 9 skills total (3 new infrastructure skills)
- ✅ All skills <500 lines (Anthropic compliant)
- ✅ 3 skills refactored with progressive disclosure

**New Skills**:
1. **database-migrations** (350 lines) - TypeORM zero-downtime patterns
2. **multi-tenancy** (300 lines) - 5-layer tenant isolation
3. **production-deployment** (400 lines) - Phased rollouts, health checks

**Refactored Skills**:
1. **security-first**: 614 → 190 lines (69% reduction, 6 reference files)
2. **event-sourcing**: 467 → 210 lines (55% reduction, 2 reference files)
3. **graphql-schema**: 435 → 220 lines (50% reduction, 2 reference files)

**Migration**: Restart Claude Code to load new/updated skills

### 3. Sessions Protocols

**Before (v6.0)**:
- 5 protocols totaling 1,863 lines
- Verbose with redundant explanations
- No plan mode guidance

**After (v7.0)**:
- ✅ Same 5 protocols, now 940 lines (50% reduction)
- ✅ Plan mode workflow documented in all protocols
- ✅ Extracted 12 reference files to knowledge base

**Protocol Changes**:
- task-startup.md: 337 → 180 lines (47% reduction)
- task-completion.md: 505 → 250 lines (51% reduction)
- compounding-cycle.md: 450 → 225 lines (50% reduction)
- task-creation.md: 263 → 130 lines (51% reduction)
- context-compaction.md: 308 → 155 lines (50% reduction)

**Migration**: Use updated protocols immediately, references auto-resolve

### 4. Knowledge Base Structure

**Before (v6.0)**:
```
sessions/knowledge/vextrus-erp/
├── README.md
├── agent-catalog.md
├── context-optimization-tips.md
├── plugin-usage-guide.md
├── quality-gates-checklist.md
└── workflow-patterns.md
```

**After (v7.0)**:
```
sessions/knowledge/vextrus-erp/
├── README.md (updated)
├── patterns/ (5 files)
├── checklists/ (4 files)
├── guides/ (4 files)
└── workflows/ (3 files)
```

**Migration**: Backward-compatible symbolic links created, no action needed

### 5. CLAUDE.md

**Before (v6.0)**:
- Contained "Current Task Status" section (lines 259-273)
- Updated after every task (maintenance burden)

**After (v7.0)**:
- ✅ Timeless, no task-specific content
- ✅ Added plan mode workflow section
- ✅ Updated to 9 skills (3 categories)
- ✅ Current task tracked in .claude/state/current_task.json only

**Migration**: No action needed, CLAUDE.md is now truly standard

### 6. Task File Strategy

**Before (v6.0)**:
- Large task files (1,172 lines example)
- Embedded discovery reports, full context
- Violated 500-1,000 line target

**After (v7.0)**:
- ✅ Checkpoint pattern for complex tasks
- ✅ Lightweight task files (<200 lines)
- ✅ References to checkpoints for full details

**Example**:
- Before: i-finance-module-refinement-production-ready.md (1,172 lines)
- After: Same file (99 lines) + checkpoint in done/ (1,172 lines archived)

**Migration**: Apply checkpoint pattern to future complex tasks

### 7. Plan Mode Workflow

**Before (v6.0)**:
- Not documented in protocols
- Optional usage
- No standard approach

**After (v7.0)**:
- ✅ Default workflow assumption
- ✅ Documented in all protocols
- ✅ Integrated with all skills

**Workflow**:
1. User enters plan mode (⏸)
2. Claude researches + asks questions
3. Claude presents plan (ExitPlanMode)
4. User approves
5. Execute

**Migration**: Start using plan mode for all non-trivial tasks

## How to Use v7.0

### Daily Workflow

```bash
# 1. Enter plan mode (shift+tab)
⏸ plan mode on

# 2. Describe task
"implement invoice payment with tenant isolation and security"

# 3. Claude researches and presents plan
# Skills auto-activate: execute-first, test-first, event-sourcing,
#                       multi-tenancy, security-first

# 4. Approve plan
# Claude executes with skill guidance

# 5. Quality gates
/review /test /security-scan

# 6. Commit
git add . && git commit
```

### Skill Activation

Skills auto-activate based on keywords. No manual invocation needed.

**Examples**:
- "create migration" → database-migrations
- "add tenant validation" → multi-tenancy
- "deploy to production" → production-deployment
- "implement payment with security" → execute-first + test-first + event-sourcing + security-first

### Knowledge Base

New categorized structure:

```bash
# Patterns
cat sessions/knowledge/vextrus-erp/patterns/multi-tenancy-patterns.md

# Checklists
cat sessions/knowledge/vextrus-erp/checklists/security-checklist.md

# Guides
cat sessions/knowledge/vextrus-erp/guides/context-optimization.md

# Workflows
cat sessions/knowledge/vextrus-erp/workflows/proven-patterns.md
```

### Protocols

Use updated protocols with plan mode workflow:

```bash
# Task startup (in plan mode)
cat sessions/protocols/task-startup.md

# Task completion
cat sessions/protocols/task-completion.md

# Complex features
cat sessions/protocols/compounding-cycle.md
```

## Testing v7.0

### Verify Skills Loaded

```bash
# Should list 9 skills
ls .claude/skills/*/SKILL.md

# Expected output:
# execute-first/SKILL.md
# haiku-explorer/SKILL.md
# test-first/SKILL.md
# event-sourcing/SKILL.md
# graphql-schema/SKILL.md
# security-first/SKILL.md
# database-migrations/SKILL.md
# multi-tenancy/SKILL.md
# production-deployment/SKILL.md
```

### Test Skill Activation

```
⏸ plan mode on
"create payment_status migration with tenant isolation for production deployment"

Expected: All 3 new skills mentioned in plan:
- database-migrations (zero-downtime migration)
- multi-tenancy (apply to all tenant schemas)
- production-deployment (health checks, phased rollout)
```

### Verify Knowledge Base

```bash
# Check new structure
ls -R sessions/knowledge/vextrus-erp/

# Should see 4 directories:
# patterns/
# checklists/
# guides/
# workflows/
```

## Rollback to v6.0

If needed (not recommended):

```bash
# 1. Restore hooks
cp -r ./hooks-backup-code/* .claude/hooks/

# 2. Restore settings
# (Would need to recreate .claude/settings.local.json)

# 3. Restore old skills
# (Would need git revert of skill changes)

# 4. Restore old protocols
# (git revert protocol simplifications)
```

**Recommendation**: Don't rollback. v7.0 is battle-tested and superior.

## Breaking Changes Summary

1. **Hooks removed** - Skills replace all functionality
2. **Knowledge base restructured** - New categorized directories
3. **Skills refactored** - 3 skills split into main + references
4. **Protocols simplified** - 50% shorter, plan mode integrated
5. **CLAUDE.md changed** - No more task status section

## Benefits of v7.0

- ✅ **50% shorter protocols** - Faster to reference
- ✅ **100% Anthropic compliant skills** - All <500 lines
- ✅ **Zero overhead** - No hooks blocking execution
- ✅ **3 new infrastructure skills** - Migrations, multi-tenancy, deployment
- ✅ **Better organization** - Categorized knowledge base
- ✅ **Plan mode standard** - Clear workflow for all tasks
- ✅ **Timeless CLAUDE.md** - No maintenance burden

## Support

Questions about migration?
- Read: ULTIMATE_WORKFLOW_DESIGN.md (comprehensive guide)
- Check: .claude/skills/README.md (skill reference)
- Review: sessions/protocols/ (updated protocols)

---

**Migration Complete**: 2025-10-19
**Status**: Production Ready ✅
**Next**: Start using v7.0 workflow for all tasks
```

---

## Execution Summary

### Files to Create (Total: 31 files)

**Phase 4A - Skills Refactoring (10 files)**:
1. .claude/skills/security-first/SKILL.md (NEW - 190 lines)
2. .claude/skills/security-first/authentication.md
3. .claude/skills/security-first/authorization.md
4. .claude/skills/security-first/input-validation.md
5. .claude/skills/security-first/data-protection.md
6. .claude/skills/security-first/audit-compliance.md
7. .claude/skills/security-first/threats-checklist.md
8. .claude/skills/event-sourcing/SKILL.md (NEW - 210 lines)
9. .claude/skills/event-sourcing/core-patterns.md
10. .claude/skills/event-sourcing/advanced-patterns.md
11. .claude/skills/graphql-schema/SKILL.md (NEW - 220 lines)
12. .claude/skills/graphql-schema/examples.md
13. .claude/skills/graphql-schema/best-practices.md

**Phase 4B - New Skills (3 files)**:
14. .claude/skills/database-migrations/SKILL.md (350 lines)
15. .claude/skills/multi-tenancy/SKILL.md (300 lines)
16. .claude/skills/production-deployment/SKILL.md (400 lines)

**Phase 5A - Protocol Simplification (5 files modified)**:
17. sessions/protocols/task-startup.md (MODIFY - 337 → 180 lines)
18. sessions/protocols/task-completion.md (MODIFY - 505 → 250 lines)
19. sessions/protocols/compounding-cycle.md (MODIFY - 450 → 225 lines)
20. sessions/protocols/task-creation.md (MODIFY - 263 → 130 lines)
21. sessions/protocols/context-compaction.md (MODIFY - 308 → 155 lines)

**Phase 5B - Knowledge Base (12 new reference files + restructure)**:
22-33. sessions/knowledge/vextrus-erp/ (restructure + 12 extracted files)

**Phase 6 - Documentation (2 modified)**:
34. CLAUDE.md (MODIFY - add new skills, plan mode)
35. ULTIMATE_WORKFLOW_DESIGN.md (MODIFY - update with Phase 4-7 results)

**Phase 7 - Migration Guide (2 new)**:
36. .claude/skills/README.md
37. WORKFLOW_V7_MIGRATION_GUIDE.md

### Files to Modify (Total: 9 files)

- 3 skill SKILL.md files (security-first, event-sourcing, graphql-schema)
- 5 protocol files (all shortened by 40-50%)
- 1 CLAUDE.md (add skills, plan mode)
- 1 ULTIMATE_WORKFLOW_DESIGN.md (update results)
- sessions/knowledge/vextrus-erp/README.md (add categories)

### Total Line Count Changes

**Before v7.0**:
- Skills: 2,025 lines (6 skills, 3 over limit)
- Protocols: 1,863 lines (verbose)
- Total: 3,888 lines

**After v7.0**:
- Skills: 2,960 lines (9 skills, all <500 lines)
- Protocols: 940 lines (50% reduction)
- Total: 3,900 lines

**Net**: +12 lines but:
- +3 new infrastructure skills (+1,270 lines of NEW functionality)
- -923 lines of verbosity removed from protocols
- -335 lines removed from refactored skills (moved to reference files)

---

## Next Session Execution Checklist

When executing in fresh session:

**Phase 4 (2 hours)**:
- [ ] 4A.1: Refactor security-first skill (20 min)
- [ ] 4A.2: Refactor event-sourcing skill (15 min)
- [ ] 4A.3: Refactor graphql-schema skill (10 min)
- [ ] 4B.1: Create database-migrations skill (25 min)
- [ ] 4B.2: Create multi-tenancy skill (25 min)
- [ ] 4B.3: Create production-deployment skill (25 min)

**Phase 5 (1.5 hours)**:
- [ ] 5A.1: Simplify task-startup.md (15 min)
- [ ] 5A.2: Simplify task-completion.md (15 min)
- [ ] 5A.3: Simplify compounding-cycle.md (15 min)
- [ ] 5A.4: Simplify task-creation.md (10 min)
- [ ] 5A.5: Simplify context-compaction.md (5 min)
- [ ] 5B: Restructure knowledge base (30 min)

**Phase 6 (30 minutes)**:
- [ ] 6A: Update CLAUDE.md (5 min)
- [ ] 6B: Update ULTIMATE_WORKFLOW_DESIGN.md (10 min)
- [ ] 6C: Test skills activation (15 min)

**Phase 7 (20 minutes)**:
- [ ] 7A: Create .claude/skills/README.md (10 min)
- [ ] 7B: Create WORKFLOW_V7_MIGRATION_GUIDE.md (10 min)

**Total**: 4.5 hours estimated

---

## Success Criteria

After Phases 4-7 complete:

- ✅ All 9 skills <500 lines (Anthropic compliant)
- ✅ 3 new infrastructure skills created
- ✅ All protocols 40-50% shorter
- ✅ Knowledge base categorized and organized
- ✅ Plan mode documented in all protocols
- ✅ Skills activation tested and working
- ✅ Documentation complete and accurate
- ✅ Migration guide provides clear upgrade path
- ✅ Backward compatibility maintained

---

**Plan Created**: 2025-10-19
**Ready for Execution**: Fresh session recommended
**Context Preserved**: All agent exploration results included in plan
**Estimated Completion**: Single 4.5-hour focused session
