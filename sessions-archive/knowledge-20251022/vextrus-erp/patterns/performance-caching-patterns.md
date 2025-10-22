# Performance & Caching Patterns

**Purpose**: Quick reference for performance optimization and caching strategies in Vextrus ERP
**Last Updated**: 2025-10-20
**Source**: Production implementation in Finance service + 6 services with Redis
**Auto-Loaded By**: `performance-caching` skill

---

## Quick Reference

| Pattern | When to Use | Key Benefit | Performance Gain |
|---------|-------------|-------------|------------------|
| **Redis Cache-Aside** | Frequently accessed data | Avoid repeated DB queries | 10-100x faster reads |
| **DataLoader Batching** | GraphQL field resolvers | Eliminate N+1 queries | 100x request reduction |
| **@Cacheable Decorator** | Query handlers | Declarative caching | Minimal code changes |
| **Composite Indexes** | Multi-tenant queries | Fast filtered queries | <50ms query response |
| **Materialized Views** | Heavy aggregations | Pre-computed results | 50-100x faster reports |
| **Connection Pooling** | All database access | Reduce connection overhead | Stable performance |

---

## Pattern 1: Redis Cache-Aside with @Cacheable

**Problem**: Repeated database queries for same data.

**Solution**:
```typescript
import { Cacheable } from '@vextrus/shared/utils'

@Cacheable({
  ttl: 300, // 5 minutes
  keyGenerator: (tenantId: string, id: string) => `product:${tenantId}:${id}`,
})
async getProduct(tenantId: string, id: string): Promise<Product> {
  return this.repository.findOne({ where: { tenantId, id } })
}
```

**Result**: First call → DB query + cache. Subsequent calls → Redis (10-100x faster).

---

## Pattern 2: DataLoader for N+1 Prevention

**Problem**: 100 invoices with customers → 101 queries.

**Solution**:
```typescript
@Injectable({ scope: Scope.REQUEST })
export class CustomerDataLoader {
  private loader = new DataLoader(async (customerIds: readonly string[]) => {
    const customers = await this.repository.findByIds(Array.from(customerIds))
    const map = new Map(customers.map(c => [c.id, c]))
    return customerIds.map(id => map.get(id) || null) // Same order!
  })
}
```

**Result**: 101 queries → 2 queries (1 for invoices, 1 batched for customers).

**Evidence**: Finance service - 100x request reduction, 10x faster projection processing.

---

## Pattern 3: Composite Indexes for Multi-Tenant

**Rule**: All queries must be tenant-scoped.

**Solution**:
```typescript
@Entity('invoices')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'customerId'])
@Index(['tenantId', 'invoiceDate'])
export class InvoiceEntity { /* ... */ }
```

**Result**: <50ms query response with proper indexes vs 500ms+ without.

---

## Pattern 4: Materialized Views for Reports

**Problem**: Revenue report aggregates 1M invoices → 5-10s.

**Solution**:
```typescript
CREATE MATERIALIZED VIEW revenue_summary_mv AS
SELECT
  tenant_id,
  DATE_TRUNC('month', invoice_date) AS month,
  SUM(total_amount) AS total_revenue
FROM invoices
WHERE status = 'PAID'
GROUP BY tenant_id, month
```

**Refresh**: Scheduled (cron every 5 minutes) or on-demand.

**Result**: 5-10s aggregation → <100ms materialized view query (50-100x faster).

---

## Pattern 5: Tag-Based Cache Invalidation

**Problem**: Invalidate related cache entries when one entity changes.

**Solution**:
```typescript
// Set with tags
await this.cacheService.setWithTags(
  `invoice:${invoice.id}`,
  invoice,
  300,
  [`tenant:${invoice.tenantId}`, `customer:${invoice.customerId}`]
)

// Invalidate all customer invoices
await this.cacheService.invalidateByTag(`customer:${customerId}`)
```

---

## Pattern 6: Connection Pooling

**Configuration**:
```typescript
extra: {
  max: 20,  // Max connections per instance
  min: 5,   // Minimum idle connections
  idleTimeoutMillis: 30000,
  statement_timeout: 10000,  // Kill queries >10s
}
```

**Kubernetes**: 3 replicas × 20 max = 60 connections → PostgreSQL max_connections: 400.

---

## Integration Points

### With GraphQL Schema Skill
- DataLoader for all field resolvers fetching related entities
- Query complexity limits to prevent expensive queries
- Rate limiting per user/tenant

### With Event Sourcing Skill
- Cache invalidation on domain events (InvoiceStatusChangedEvent → invalidate cache)
- Projection caching (materialized read models)
- Event replay performance (batch processing)

### With Multi-Tenancy Skill
- All cache keys prefixed with tenantId
- Tenant-scoped indexes: `[tenantId, ...]`
- No cross-tenant queries

### With Security-First Skill
- Never cache sensitive data (passwords, tokens)
- Redis AUTH and TLS in production
- Cache keys include tenantId for isolation

---

## Performance Targets

| Metric | Target | Acceptable |
|--------|--------|------------|
| Simple Query | <50ms | <100ms |
| Complex Query | <200ms | <500ms |
| GraphQL Query | <100ms | <300ms |
| Cache Hit Ratio | >80% | >60% |
| N+1 Queries | 0 | 0 |

---

## Quality Checklist

- [ ] DataLoader implemented for GraphQL field resolvers
- [ ] @Cacheable decorator on frequently accessed query handlers
- [ ] Redis cache keys include tenantId
- [ ] Cache invalidation on mutations/events
- [ ] Composite indexes on all multi-tenant queries
- [ ] Connection pooling configured
- [ ] Slow query logging enabled (>1s)
- [ ] No N+1 queries (verified with logging)
- [ ] Materialized views for heavy reports
- [ ] Cache hit rate >80%

---

## Service Examples

**Reference Implementations**:
- Finance DataLoader: `services/finance/src/infrastructure/integrations/master-data.dataloader.ts`
- Cache Decorators: `shared/utils/src/cache/cache.decorators.ts`
- Redis Service: `shared/utils/src/cache/redis-cache.service.ts`
- Performance Service: `services/finance/src/application/services/performance-optimization.service.ts`

**Evidence**:
- 6+ services with Redis infrastructure
- Finance service: 100x request reduction with DataLoader
- Comprehensive caching decorators (underutilized - adoption opportunity)

---

## Pre-defined Cache Patterns

From `shared/cache/src/cache.service.ts`:

- **session**: 1 hour
- **auth**: 15 minutes
- **user**: 5 minutes
- **config**: 24 hours
- **lookup**: 2 hours (countries, currencies, tax codes)
- **query**: 1 minute
- **report**: 30 minutes

**Usage**:
```typescript
await this.cacheService.set(`country:${code}`, country, CachePattern.LOOKUP)
```

---

## Common Pitfalls

❌ **Wrong DataLoader ordering**: Return results in same order as input keys
❌ **SINGLETON scope**: Use REQUEST scope to prevent memory leaks
❌ **Cross-tenant caching**: Always include tenantId in cache keys
❌ **No cache invalidation**: Stale data without event-driven invalidation
❌ **Missing indexes**: Seq Scan on large tables (add composite index)
❌ **Unbounded queries**: Always use pagination

---

**Compounding Effect**: Performance patterns enable 10-100x faster queries and eliminate N+1 problems across all services.
