# Database Query Optimization

Comprehensive guide for optimizing PostgreSQL queries in Vextrus ERP microservices.

---

## Overview

**Performance Targets**:
- Simple queries (single table, indexed): **<50ms**
- Complex queries (joins, aggregations): **<200ms**
- Heavy reports (materialized views): **<500ms**

**Optimization Strategies**:
1. **Indexing**: Composite indexes for multi-tenant queries
2. **JSONB**: Flexible schema without JOIN overhead
3. **Materialized Views**: Pre-computed aggregations
4. **Query Analysis**: EXPLAIN ANALYZE for bottlenecks
5. **Connection Pooling**: Reduce connection overhead

---

## Pattern 1: Composite Indexes for Multi-Tenant Queries

**Rule**: All queries in multi-tenant system must be scoped by `tenantId`.

### Index Strategy

```typescript
@Entity('invoices')
@Index(['tenantId', 'invoiceNumber'], { unique: true })  // Unique invoice numbers per tenant
@Index(['tenantId', 'customerId'])  // Customer invoices query
@Index(['tenantId', 'vendorId'])    // Vendor invoices query
@Index(['tenantId', 'status'])      // Status filtering
@Index(['tenantId', 'fiscalYear'])  // Fiscal year reports
@Index(['tenantId', 'invoiceDate']) // Date range queries
@Index(['mushakNumber'])             // Bangladesh compliance (global)
export class InvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

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

  @Column()
  fiscalYear: string

  @Column({ type: 'date' })
  invoiceDate: Date

  @Column({ nullable: true })
  mushakNumber: string
}
```

### Query Performance with Indexes

```typescript
// Without index on [tenantId, status]:
// EXPLAIN: Seq Scan on invoices (cost=0.00..1250.00 rows=100 width=500) ~500ms

// With composite index:
// EXPLAIN: Index Scan using idx_invoices_tenant_status (cost=0.00..8.50 rows=100 width=500) ~15ms

await invoiceRepository.find({
  where: { tenantId: 'tenant-123', status: 'PENDING' },
  order: { invoiceDate: 'DESC' },
  take: 100,
})
```

**Index Selection Rules**:
1. **Most selective column first**: If filtering by tenantId (required) and status (optional), index on `[tenantId, status]`
2. **Equality before range**: `[tenantId, status, invoiceDate]` → tenantId (=), status (=), invoiceDate (range)
3. **Unique constraints**: `[tenantId, invoiceNumber]` → Enforce uniqueness per tenant

---

## Pattern 2: JSONB for Flexible Schema

**Use Case**: Line items, metadata, settings that change frequently.

### Schema Design

```typescript
@Entity('invoices')
export class InvoiceEntity {
  @Column({ type: 'jsonb' })
  lineItems: InvoiceLineItem[]

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>
}

interface InvoiceLineItem {
  productId: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  totalAmount: number
}
```

**Benefits**:
- No separate `invoice_line_items` table (avoids JOIN)
- Schema evolution without migrations
- Fast writes (single row update)
- PostgreSQL JSONB is indexed and queryable

### JSONB Queries

```typescript
// Query invoices with specific product in line items
await invoiceRepository
  .createQueryBuilder('invoice')
  .where('invoice.tenantId = :tenantId', { tenantId })
  .andWhere(`invoice.lineItems @> '[{"productId": "product-123"}]'`)
  .getMany()

// SQL: invoice.lineItems @> '[{"productId": "product-123"}]'
// Uses GIN index for fast lookup
```

### JSONB Indexing

```typescript
// Migration: Create GIN index for JSONB column
export class AddLineItemsIndex1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX idx_invoices_line_items
      ON invoices USING GIN (line_items jsonb_path_ops)
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_invoices_line_items`)
  }
}
```

**When to Use JSONB**:
✅ Flexible data (line items, settings, metadata)
✅ Infrequently queried nested data
✅ Schema evolves frequently

**When NOT to Use JSONB**:
❌ Frequently queried/joined data (use relations)
❌ Data integrity constraints needed (use foreign keys)
❌ Complex aggregations across nested data

---

## Pattern 3: Materialized Views for Heavy Aggregations

**Problem**: Dashboard reports with complex aggregations slow down on large datasets.

**Solution**: Pre-compute results in materialized view, refresh periodically.

### Create Materialized View

```typescript
// services/finance/src/application/services/performance-optimization.service.ts
@Injectable()
export class PerformanceOptimizationService {
  constructor(
    @InjectConnection() private readonly connection: Connection
  ) {}

  async createRevenueSummaryView(): Promise<void> {
    // Create materialized view
    await this.connection.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS revenue_summary_mv AS
      SELECT
        tenant_id,
        DATE_TRUNC('month', invoice_date) AS month,
        COUNT(*) AS invoice_count,
        SUM(total_amount) AS total_revenue,
        AVG(total_amount) AS avg_invoice_amount,
        MAX(total_amount) AS max_invoice_amount,
        MIN(total_amount) AS min_invoice_amount
      FROM invoices
      WHERE status = 'PAID'
      GROUP BY tenant_id, DATE_TRUNC('month', invoice_date)
      WITH DATA
    `)

    // Create index on materialized view
    await this.connection.query(`
      CREATE INDEX IF NOT EXISTS idx_revenue_summary_tenant_month
      ON revenue_summary_mv (tenant_id, month DESC)
    `)
  }

  async refreshRevenueSummary(): Promise<void> {
    await this.connection.query(`REFRESH MATERIALIZED VIEW revenue_summary_mv`)
  }

  async refreshConcurrently(): Promise<void> {
    // Non-blocking refresh (requires unique index)
    await this.connection.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY revenue_summary_mv`)
  }
}
```

### Query Materialized View

```typescript
@Injectable()
export class RevenueReportService {
  async getMonthlyRevenue(tenantId: string, year: number): Promise<RevenueReport[]> {
    return this.connection.query(`
      SELECT
        month,
        invoice_count,
        total_revenue,
        avg_invoice_amount
      FROM revenue_summary_mv
      WHERE tenant_id = $1
        AND EXTRACT(YEAR FROM month) = $2
      ORDER BY month DESC
    `, [tenantId, year])
  }
}
```

**Performance**:
- **Without MV**: Aggregation on 1M invoices → **5-10s**
- **With MV**: Query materialized view → **<100ms** (50-100x faster)

**Refresh Strategies**:
1. **Scheduled** (cron): Refresh every 5 minutes/hourly/daily
2. **On-demand**: Refresh when data changes (after invoice payment)
3. **Concurrent**: Non-blocking refresh (requires unique index)

### Scheduled Refresh

```typescript
import { Cron, CronExpression } from '@nestjs/schedule'

@Injectable()
export class MaterializedViewScheduler {
  // Refresh every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async refreshRevenueSummary(): Promise<void> {
    await this.performanceService.refreshConcurrently()
  }

  // Refresh daily at 2 AM
  @Cron('0 2 * * *')
  async refreshDailyReports(): Promise<void> {
    await this.performanceService.refreshAllMaterializedViews()
  }
}
```

---

## Pattern 4: Query Analysis with EXPLAIN ANALYZE

**Always analyze slow queries** to identify bottlenecks.

### Run EXPLAIN ANALYZE

```typescript
async analyzeQuery(): Promise<void> {
  const result = await this.connection.query(`
    EXPLAIN ANALYZE
    SELECT i.*, c.name AS customer_name
    FROM invoices i
    LEFT JOIN customers c ON c.id = i.customer_id
    WHERE i.tenant_id = 'tenant-123'
      AND i.status = 'PENDING'
    ORDER BY i.invoice_date DESC
    LIMIT 100
  `)

  console.log(result)
}
```

### Example Output

```
Limit  (cost=0.43..42.15 rows=100 width=500) (actual time=0.042..1.245 rows=100 loops=1)
  ->  Nested Loop Left Join  (cost=0.43..4156.32 rows=9952 width=500) (actual time=0.041..1.227 rows=100 loops=1)
        ->  Index Scan using idx_invoices_tenant_status on invoices i  (cost=0.43..1234.56 rows=9952 width=468) (actual time=0.025..0.456 rows=100 loops=1)
              Index Cond: ((tenant_id = 'tenant-123') AND (status = 'PENDING'))
        ->  Index Scan using customers_pkey on customers c  (cost=0.00..0.29 rows=1 width=32) (actual time=0.006..0.006 rows=1 loops=100)
              Index Cond: (id = i.customer_id)
Planning Time: 0.325 ms
Execution Time: 1.289 ms
```

**Key Metrics**:
- `cost=0.43..42.15`: Estimated cost (lower is better)
- `actual time=0.042..1.245`: Actual execution time (ms)
- `rows=100`: Number of rows returned
- `Index Scan`: Using index (fast)
- `Seq Scan`: Full table scan (slow, needs index)

**Red Flags**:
- `Seq Scan` on large tables → Add index
- `actual time >> estimated time` → Outdated statistics (run ANALYZE)
- `rows >> actual rows` → Inaccurate estimates

---

## Pattern 5: Avoid N+1 Queries with Relations

**Problem**: Fetching related entities in loop causes N+1 queries.

### N+1 Example (BAD)

```typescript
// ❌ N+1 queries: 1 for invoices + N for customers
const invoices = await invoiceRepository.find({ where: { tenantId } })

for (const invoice of invoices) {
  invoice.customer = await customerRepository.findOne({
    where: { id: invoice.customerId },
  })
}
// 101 queries for 100 invoices
```

### Solution 1: Use Relations

```typescript
// ✅ Single query with JOIN
const invoices = await invoiceRepository.find({
  where: { tenantId },
  relations: ['customer', 'vendor'],
})
// 1 query with JOIN
```

### Solution 2: Manual IN Query

```typescript
// ✅ 2 queries: 1 for invoices + 1 for customers
const invoices = await invoiceRepository.find({ where: { tenantId } })

const customerIds = [...new Set(invoices.map(i => i.customerId).filter(Boolean))]
const customers = await customerRepository.findByIds(customerIds)

const customerMap = new Map(customers.map(c => [c.id, c]))
invoices.forEach(i => {
  i.customer = customerMap.get(i.customerId)
})
// 2 queries total
```

### Solution 3: DataLoader (GraphQL)

```typescript
// ✅ Batched requests (best for GraphQL)
@ResolveField(() => CustomerDto)
async customer(@Parent() invoice: InvoiceDto): Promise<CustomerDto> {
  return this.dataLoader.loadCustomer(invoice.customerId)
}
// See dataloader-guide.md for details
```

---

## Pattern 6: Connection Pooling Optimization

**PostgreSQL connections are expensive** - reuse them via pooling.

### TypeORM Configuration

```typescript
// typeorm.config.ts
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  // Connection pooling
  extra: {
    max: 20,           // Max connections per service instance
    min: 5,            // Minimum idle connections
    idleTimeoutMillis: 30000,  // Close idle connections after 30s
    connectionTimeoutMillis: 2000,  // Timeout acquiring connection

    // Query timeouts
    statement_timeout: 10000,  // Kill queries running >10s
    idle_in_transaction_session_timeout: 5000,  // Kill idle transactions >5s
  },

  // Connection reuse
  poolSize: 10,

  // Logging
  logging: ['error', 'warn', 'migration'],
  maxQueryExecutionTime: 1000,  // Log queries >1s
})
```

### Kubernetes Scaling Considerations

```yaml
# 3 replicas × 20 max connections = 60 connections per service
replicas: 3

# PostgreSQL max_connections
# Formula: (number of services × replicas × max connections) + overhead
# Example: 5 services × 3 replicas × 20 = 300 + 50 overhead = 350
postgresql:
  max_connections: 400
```

---

## Pattern 7: Pagination for Large Result Sets

**Never return unbounded result sets** - use cursor or offset pagination.

### Offset Pagination

```typescript
@Query(() => InvoicePaginatedResponse)
async invoices(
  @Args('tenantId') tenantId: string,
  @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
  @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number
): Promise<InvoicePaginatedResponse> {
  const [invoices, total] = await this.repository.findAndCount({
    where: { tenantId },
    order: { invoiceDate: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  })

  return {
    items: invoices,
    total,
    page,
    limit,
    hasMore: page * limit < total,
  }
}
```

**Drawback**: Offset pagination is slow for large offsets (page 1000+).

### Cursor Pagination (Recommended)

```typescript
@Query(() => InvoiceCursorResponse)
async invoices(
  @Args('tenantId') tenantId: string,
  @Args('first', { type: () => Int, defaultValue: 50 }) first: number,
  @Args('after', { nullable: true }) after?: string
): Promise<InvoiceCursorResponse> {
  const query = this.repository
    .createQueryBuilder('invoice')
    .where('invoice.tenantId = :tenantId', { tenantId })
    .orderBy('invoice.invoiceDate', 'DESC')
    .addOrderBy('invoice.id', 'ASC')  // Stable sort
    .take(first + 1)  // Fetch one extra to check hasMore

  if (after) {
    // Decode cursor
    const [date, id] = Buffer.from(after, 'base64').toString().split(':')
    query.andWhere(
      '(invoice.invoiceDate < :date OR (invoice.invoiceDate = :date AND invoice.id > :id))',
      { date, id }
    )
  }

  const invoices = await query.getMany()

  const hasMore = invoices.length > first
  const items = hasMore ? invoices.slice(0, -1) : invoices

  return {
    items,
    pageInfo: {
      hasNextPage: hasMore,
      endCursor: items.length > 0
        ? Buffer.from(`${items[items.length - 1].invoiceDate}:${items[items.length - 1].id}`).toString('base64')
        : null,
    },
  }
}
```

**Benefits**: Constant time performance regardless of page depth.

---

## Pattern 8: Slow Query Logging

**Monitor slow queries** to identify optimization opportunities.

### Enable Slow Query Log

```sql
-- PostgreSQL configuration
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries >1s
SELECT pg_reload_conf();
```

### Log Slow Queries in Application

```typescript
// typeorm.config.ts
export default new DataSource({
  logging: ['error', 'warn', 'migration'],
  maxQueryExecutionTime: 1000,  // Log queries >1s
})
```

### Custom Logger

```typescript
import { Logger } from '@nestjs/common'
import { QueryRunner } from 'typeorm'

export class CustomQueryLogger implements Logger {
  private readonly logger = new Logger('DatabaseQuery')

  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    const start = Date.now()
    queryRunner?.query(query, parameters).finally(() => {
      const duration = Date.now() - start
      if (duration > 1000) {
        this.logger.warn(`Slow query (${duration}ms): ${query}`, { parameters })
      }
    })
  }
}
```

---

## Performance Checklist

Before deploying:
- [ ] All multi-tenant queries have composite index on `[tenantId, ...]`
- [ ] JSONB columns have GIN index if queried
- [ ] Materialized views created for heavy aggregations
- [ ] Materialized views refresh on schedule
- [ ] No N+1 queries (use relations, IN queries, or DataLoader)
- [ ] Connection pooling configured for expected load
- [ ] Slow query logging enabled (>1s)
- [ ] EXPLAIN ANALYZE run on complex queries
- [ ] Pagination implemented for large result sets
- [ ] Database statistics up to date (`ANALYZE`)

---

## Best Practices

✅ **Do**:
- Index all query predicates (WHERE, JOIN, ORDER BY)
- Use composite indexes for multi-tenant queries
- Prefer JSONB for flexible schemas (line items, metadata)
- Use materialized views for heavy reports
- Enable slow query logging
- Use cursor pagination for deep pagination
- Analyze queries with EXPLAIN ANALYZE
- Keep statistics up to date (ANALYZE)

❌ **Don't**:
- Create index on every column (overhead on writes)
- Use JSONB for frequently queried/joined data
- Return unbounded result sets
- Use offset pagination for deep pages (>1000)
- Ignore slow query logs
- Fetch relations in loops (N+1 queries)
- Use SELECT * (fetch only needed columns)

---

## References

- PostgreSQL Indexing: https://www.postgresql.org/docs/current/indexes.html
- JSONB Indexing: https://www.postgresql.org/docs/current/datatype-json.html#JSON-INDEXING
- Materialized Views: https://www.postgresql.org/docs/current/sql-creatematerializedview.html
- EXPLAIN ANALYZE: https://www.postgresql.org/docs/current/using-explain.html
- TypeORM Performance: https://typeorm.io/caching
- Production Service: `services/finance/src/application/services/performance-optimization.service.ts`
