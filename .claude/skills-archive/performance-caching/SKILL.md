---
name: Performance & Caching
description: When optimizing performance, implementing caching strategies, preventing N+1 queries, or addressing slow database queries, activate this skill to enforce Redis caching patterns, DataLoader for GraphQL, and query optimization best practices. Use when user says "cache", "redis", "performance", "dataloader", "N+1", "optimization", "slow query", or when working with GraphQL resolvers that fetch related data.
knowledge_base:
  - sessions/knowledge/vextrus-erp/patterns/performance-caching-patterns.md
  - sessions/knowledge/vextrus-erp/checklists/quality-gates.md
---

# Performance & Caching Skill

**Purpose**: Optimize application performance through Redis caching, DataLoader batching, and database query optimization.

**Addresses**: N+1 query problems, slow database queries, inefficient GraphQL resolvers, missing cache layers.

**Evidence**:
- Redis infrastructure in 6+ services (auth, master-data, api-gateway, rules-engine, workflow)
- DataLoader implementation in Finance service (100x request reduction, 10x faster)
- Comprehensive caching decorators available but underutilized
- Performance optimization service framework in Finance

---

## Quick Reference

| Pattern | When to Use | Key Benefit |
|---------|-------------|-------------|
| **Redis Cache-Aside** | Frequently accessed data | 10-100x faster reads |
| **DataLoader Batching** | GraphQL field resolvers | Eliminates N+1 queries |
| **@Cacheable Decorator** | Query handlers, computed data | Declarative caching |
| **Composite Indexes** | Multi-tenant queries | <100ms query response |
| **Materialized Views** | Heavy aggregations | Pre-computed reports |
| **Connection Pooling** | Database connections | Reduced connection overhead |

---

## Pattern 1: Redis Cache-Aside with @Cacheable Decorator

**Problem**: Repeated database queries for same data, slow API response times.

**Solution**: Use `@Cacheable` decorator from `shared/utils/src/cache/cache.decorators.ts`.

### Implementation

```typescript
import { Injectable } from '@nestjs/common'
import { Cacheable, CacheEvict, CachePut } from '@vextrus/shared/utils'

@Injectable()
export class InvoiceQueryHandler {
  // Cache for 5 minutes, namespace by tenant
  @Cacheable({
    ttl: 300,
    keyGenerator: (tenantId: string, invoiceId: string) =>
      `invoice:${tenantId}:${invoiceId}`,
  })
  async getInvoice(tenantId: string, invoiceId: string): Promise<Invoice> {
    // First call: hits database, caches result
    // Subsequent calls: returns from Redis (10-100x faster)
    return this.repository.findOne({ where: { tenantId, id: invoiceId } })
  }

  // Update cache after invoice modification
  @CachePut({
    keyGenerator: (invoice: Invoice) => `invoice:${invoice.tenantId}:${invoice.id}`,
  })
  async updateInvoice(invoice: Invoice): Promise<Invoice> {
    const updated = await this.repository.save(invoice)
    return updated // Automatically cached
  }

  // Invalidate cache after deletion
  @CacheEvict({
    keyGenerator: (tenantId: string, invoiceId: string) =>
      `invoice:${tenantId}:${invoiceId}`,
  })
  async deleteInvoice(tenantId: string, invoiceId: string): Promise<void> {
    await this.repository.delete({ tenantId, id: invoiceId })
    // Cache entry automatically evicted
  }
}
```

**Pre-defined Cache Patterns** (from `shared/cache/src/cache.service.ts`):
- `session`: 1 hour TTL
- `auth`: 15 minutes
- `user`: 5 minutes
- `config`: 24 hours
- `lookup`: 2 hours (countries, currencies, tax codes)
- `query`: 1 minute
- `report`: 30 minutes

**See**: resources/redis-patterns.md for complete Redis setup and patterns.

---

## Pattern 2: DataLoader for N+1 Query Prevention

**Problem**: GraphQL resolvers cause N+1 queries when fetching related entities.

**Example N+1 Problem**:
```graphql
query {
  invoices(first: 100) {
    id
    customer { name }  # 100 separate HTTP calls!
    vendor { name }    # 100 more HTTP calls!
  }
}
```

**Solution**: Use DataLoader with batching (10ms window, max 100 items).

### Finance Service Implementation

```typescript
// src/infrastructure/integrations/master-data.dataloader.ts
import DataLoader from 'dataloader'
import { Injectable, Scope } from '@nestjs/common'

@Injectable({ scope: Scope.REQUEST }) // Prevent memory leaks
export class MasterDataDataLoader {
  private readonly vendorLoader: DataLoader<string, Vendor>
  private readonly customerLoader: DataLoader<string, Customer>

  constructor(private readonly masterDataClient: MasterDataClient) {
    this.vendorLoader = new DataLoader(
      async (vendorIds: readonly string[]) => {
        // Single batched request for all vendors
        const vendors = await this.masterDataClient.getVendorsByIds(
          Array.from(vendorIds)
        )

        // CRITICAL: Return in same order as input IDs
        const vendorMap = new Map(vendors.map(v => [v.id, v]))
        return vendorIds.map(id => vendorMap.get(id) || null)
      },
      {
        batchScheduleFn: (callback) => setTimeout(callback, 10), // 10ms window
        maxBatchSize: 100,
      }
    )

    this.customerLoader = new DataLoader(/* same pattern */)
  }

  async loadVendor(vendorId: string): Promise<Vendor | null> {
    return this.vendorLoader.load(vendorId)
  }

  async loadCustomer(customerId: string): Promise<Customer | null> {
    return this.customerLoader.load(customerId)
  }
}
```

### GraphQL Resolver Integration

```typescript
@Resolver(() => InvoiceDto)
export class InvoiceResolver {
  constructor(
    private readonly dataLoader: MasterDataDataLoader
  ) {}

  @ResolveField(() => VendorDto, { nullable: true })
  async vendor(@Parent() invoice: InvoiceDto): Promise<VendorDto | null> {
    if (!invoice.vendorId) return null

    // DataLoader automatically batches and deduplicates
    return this.dataLoader.loadVendor(invoice.vendorId)
  }

  @ResolveField(() => CustomerDto, { nullable: true })
  async customer(@Parent() invoice: InvoiceDto): Promise<CustomerDto | null> {
    if (!invoice.customerId) return null

    return this.dataLoader.loadCustomer(invoice.customerId)
  }
}
```

**Results** (Finance service production metrics):
- **100 invoices**: 200 HTTP requests → 2 batched requests (100x reduction)
- **Projection processing**: 10x faster
- **Response time**: ~500ms → ~50ms

**See**: resources/dataloader-guide.md for complete DataLoader patterns.

---

## Pattern 3: Database Query Optimization

### Composite Indexes for Multi-Tenant Queries

**All queries must be tenant-scoped** for security and performance.

```typescript
@Entity('invoices')
@Index(['tenantId', 'invoiceNumber'], { unique: true })
@Index(['tenantId', 'customerId'])
@Index(['tenantId', 'vendorId'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'fiscalYear'])
@Index(['tenantId', 'invoiceDate'])
@Index(['mushakNumber']) // Bangladesh compliance
export class InvoiceEntity {
  @Column()
  tenantId: string

  @Column()
  invoiceNumber: string

  @Column({ nullable: true })
  customerId: string

  @Column({ nullable: true })
  vendorId: string

  @Column({ type: 'enum', enum: InvoiceStatus })
  status: InvoiceStatus

  // JSONB for flexible line items (avoids separate table join)
  @Column({ type: 'jsonb' })
  lineItems: InvoiceLineItem[]
}
```

**Query Performance**:
- Tenant-scoped queries: <50ms (indexed)
- Cross-tenant admin queries: <200ms (limited use)
- JSONB querying: <100ms (PostgreSQL GIN indexes)

**See**: resources/query-optimization.md for indexing strategies and JSONB patterns.

---

## Pattern 4: Materialized Views for Heavy Aggregations

**Problem**: Dashboard reports with heavy aggregations slow down user experience.

**Solution**: Use PostgreSQL materialized views with scheduled refresh.

```typescript
// services/finance/src/application/services/performance-optimization.service.ts
async createMaterializedView(viewName: string, query: string): Promise<void> {
  await this.connection.query(`
    CREATE MATERIALIZED VIEW IF NOT EXISTS ${viewName} AS
    ${query}
    WITH DATA
  `)

  // Create index on materialized view
  await this.connection.query(`
    CREATE INDEX IF NOT EXISTS idx_${viewName}_tenant
    ON ${viewName} (tenant_id)
  `)
}

// Example: Revenue summary by tenant and month
async createRevenueSummaryView(): Promise<void> {
  await this.createMaterializedView('revenue_summary_mv', `
    SELECT
      tenant_id,
      DATE_TRUNC('month', invoice_date) AS month,
      COUNT(*) AS invoice_count,
      SUM(total_amount) AS total_revenue,
      AVG(total_amount) AS avg_invoice_amount
    FROM invoices
    WHERE status = 'PAID'
    GROUP BY tenant_id, DATE_TRUNC('month', invoice_date)
  `)
}

// Refresh materialized view (scheduled or on-demand)
async refreshMaterializedView(viewName: string): Promise<void> {
  await this.connection.query(`REFRESH MATERIALIZED VIEW ${viewName}`)
}
```

**Refresh Strategies**:
- Real-time dashboards: Refresh every 5 minutes (scheduler)
- Monthly reports: Refresh daily at 2 AM
- Ad-hoc reports: Refresh on-demand

**Performance**: Pre-computed aggregations → <100ms query (vs 5-10s live aggregation)

---

## Pattern 5: Connection Pooling Optimization

**Problem**: Database connection overhead for high-traffic applications.

**Solution**: Optimize PostgreSQL connection pool settings.

```typescript
// typeorm.config.ts
export default new DataSource({
  type: 'postgres',
  // Connection pooling
  extra: {
    max: 20, // Max connections per service instance
    min: 5,  // Minimum idle connections
    idleTimeoutMillis: 30000, // 30s
    connectionTimeoutMillis: 2000, // 2s

    // Query optimization
    statement_timeout: 10000, // Kill queries >10s
    idle_in_transaction_session_timeout: 5000, // 5s
  },

  // Connection reuse
  poolSize: 10,

  // Logging slow queries
  logging: ['error', 'warn', 'migration'],
  maxQueryExecutionTime: 1000, // Log queries >1s
})
```

**Kubernetes Considerations**:
- 3 replicas × 20 max connections = 60 connections per service
- PostgreSQL max_connections = 200 (adjust for 5+ services)

---

## Pattern 6: Query Result Caching

**Problem**: Complex queries re-executed on every request.

**Solution**: Cache query results with Redis.

```typescript
@Injectable()
export class InvoiceQueryService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly repository: InvoiceRepository
  ) {}

  async getInvoicesByStatus(
    tenantId: string,
    status: InvoiceStatus
  ): Promise<Invoice[]> {
    const cacheKey = `invoices:${tenantId}:status:${status}`

    // Try cache first
    const cached = await this.cacheService.get<Invoice[]>(cacheKey)
    if (cached) {
      return cached
    }

    // Cache miss: query database
    const invoices = await this.repository.find({
      where: { tenantId, status },
      order: { invoiceDate: 'DESC' },
      take: 100, // Limit result size
    })

    // Cache for 1 minute (query pattern)
    await this.cacheService.set(cacheKey, invoices, 60)

    return invoices
  }
}
```

**Cache Invalidation** (Event-Sourced System):
```typescript
@EventsHandler(InvoiceStatusChangedEvent)
export class InvalidateInvoiceCacheHandler {
  async handle(event: InvoiceStatusChangedEvent): Promise<void> {
    // Invalidate affected caches
    await this.cacheService.delete(`invoice:${event.tenantId}:${event.invoiceId}`)
    await this.cacheService.delete(`invoices:${event.tenantId}:status:${event.oldStatus}`)
    await this.cacheService.delete(`invoices:${event.tenantId}:status:${event.newStatus}`)
  }
}
```

---

## Integration Points

### With GraphQL Schema Skill
- DataLoader for field resolvers
- Query complexity limits (prevent expensive queries)
- Depth limiting (max nesting: 5 levels)
- Rate limiting per user/tenant

### With Event Sourcing Skill
- Cache invalidation on domain events
- Projection caching (materialized read models)
- Event replay performance optimization

### With Security-First Skill
- Cache keys include tenantId for isolation
- Never cache sensitive data (passwords, tokens)
- Redis AUTH and TLS in production

### With Multi-Tenancy Skill
- All cache keys prefixed with tenantId
- Tenant-scoped query results only
- Cross-tenant queries prohibited

---

## Quality Checklist

Before completing task:
- [ ] DataLoader implemented for all GraphQL field resolvers fetching related entities
- [ ] @Cacheable decorator used on frequently accessed query handlers
- [ ] Redis cache keys include tenantId for multi-tenant isolation
- [ ] Cache invalidation strategy defined for mutations
- [ ] Composite indexes created for all multi-tenant queries
- [ ] Connection pooling configured for expected load
- [ ] Slow query logging enabled (>1s)
- [ ] No N+1 queries in GraphQL API (verified with query logging)
- [ ] Cache TTLs appropriate for data staleness tolerance
- [ ] Materialized views refreshed on schedule for heavy reports

---

## Performance Targets

| Metric | Target | Acceptable |
|--------|--------|------------|
| GraphQL Query (simple) | <100ms | <200ms |
| GraphQL Query (complex) | <300ms | <500ms |
| Database Query | <50ms | <100ms |
| Cache Hit Ratio | >80% | >60% |
| N+1 Queries | 0 | 0 |

---

## Service Examples

**Reference Implementations**:
- **Finance Service DataLoader**: `services/finance/src/infrastructure/integrations/master-data.dataloader.ts`
- **Shared Cache Decorators**: `shared/utils/src/cache/cache.decorators.ts`
- **Redis Cache Service**: `shared/utils/src/cache/redis-cache.service.ts`
- **Performance Optimization Service**: `services/finance/src/application/services/performance-optimization.service.ts`

**Evidence**:
- Redis infrastructure in 6+ services
- DataLoader: 100x request reduction in Finance service
- Caching decorators available but underutilized (opportunity for adoption)

---

## External Resources

- DataLoader: https://github.com/graphql/dataloader
- Redis Caching Patterns: https://redis.io/docs/manual/patterns/
- PostgreSQL Performance: https://www.postgresql.org/docs/current/performance-tips.html
- NestJS Caching: https://docs.nestjs.com/techniques/caching

---

**Compounding Effect**: Performance patterns captured here enable 10-100x faster queries and eliminate N+1 problems across all GraphQL APIs.
