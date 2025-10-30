# ADR-003: Database Strategy and Data Management

## Status
Accepted

## Date
2024-12-05

## Context
Vextrus ERP requires a robust data strategy that can:
- Handle complex construction project data relationships
- Support multi-tenancy for SaaS model
- Ensure data consistency in distributed architecture
- Comply with Bangladesh data protection regulations
- Scale to millions of transactions
- Support offline-first mobile access

Bangladesh market specifics:
- Average internet speed: 23.3 Mbps (vs 45.6 global)
- Frequent power outages requiring resilient data handling
- Regulatory requirement for data sovereignty

## Decision

### Primary Database Strategy

#### OLTP (Operational)
- **PostgreSQL 16** as primary database
- **Multi-tenant**: Shared database, schema separation
- **Partitioning**: By organization_id and date
- **Connection pooling**: PgBouncer for efficiency

#### Event Store
- **EventStoreDB** for event sourcing
- **Retention**: 7 years for audit compliance
- **Partitioning**: By stream and date

#### Caching
- **Redis 7** for hot data
- **TTL Strategy**: 5 minutes default, 1 hour for reports
- **Patterns**: Cache-aside for flexibility

#### Analytics (Future)
- **ClickHouse** for time-series analytics
- **Data pipeline**: CDC from PostgreSQL

### Multi-Tenancy Model

```sql
-- Schema-based isolation
CREATE SCHEMA tenant_001;
CREATE SCHEMA tenant_002;

-- Row-Level Security for shared tables
ALTER TABLE core.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON core.projects
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

### Data Consistency Strategy

#### Within Monolith
- ACID transactions for critical operations
- Two-phase commit for cross-module operations
- Optimistic locking for concurrent updates

#### Across Microservices
- Saga pattern for distributed transactions
- Eventually consistent with compensating actions
- Event sourcing for audit trail

### Backup and Recovery

```yaml
backup_strategy:
  frequency:
    full: weekly
    incremental: daily
    transaction_log: continuous
  retention:
    production: 90 days
    archives: 7 years
  locations:
    primary: AWS S3 (Singapore)
    secondary: Local datacenter (Dhaka)
```

## Database Design Principles

### 1. Command vs Query Separation
```typescript
// Write model (normalized)
Project -> Tasks -> Resources -> Timesheets

// Read model (denormalized)
ProjectDashboardView {
  projectId, name, progress, budget, 
  taskCount, overdueCount, teamSize
}
```

### 2. Temporal Data Handling
```sql
-- Audit columns on every table
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
created_by UUID NOT NULL,
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_by UUID NOT NULL,
deleted_at TIMESTAMPTZ, -- Soft delete
version INTEGER NOT NULL DEFAULT 1 -- Optimistic locking
```

### 3. Bangladesh-Specific Considerations
```sql
-- Bengali collation support
CREATE COLLATION bengali (locale = 'bn_BD.utf8');

-- Fiscal year support (July-June)
CREATE OR REPLACE FUNCTION fiscal_year(date_input DATE) 
RETURNS INTEGER AS $$
BEGIN
  IF EXTRACT(MONTH FROM date_input) >= 7 THEN
    RETURN EXTRACT(YEAR FROM date_input);
  ELSE
    RETURN EXTRACT(YEAR FROM date_input) - 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Currency handling (BDT with paisa)
CREATE DOMAIN money_bdt AS NUMERIC(15,2) 
  CHECK (VALUE >= 0);
```

## Rationale

### Why PostgreSQL?
- **ACID compliance** critical for financial data
- **JSON support** for flexible schemas
- **Strong consistency** for construction project data
- **Proven at scale** (Instagram, Reddit use it)
- **Cost-effective** compared to Oracle ($0 vs $47,500/processor)

### Why EventStoreDB?
- **Built for event sourcing** with native projections
- **Immutable audit log** for compliance
- **Time travel** queries for debugging
- **High performance** (50,000+ events/second)

### Why Redis?
- **Sub-millisecond latency** for cache hits
- **Reduced database load** by 70%
- **Session management** for 10,000+ concurrent users
- **Pub/sub** for real-time updates

### Why Schema-based Multi-tenancy?
- **Strong isolation** between tenants
- **Easier backup/restore** per tenant
- **Simple compliance** with data residency
- **Cost-effective** for 100-1000 tenants

## Consequences

### Positive
- Strong data consistency within boundaries
- Complete audit trail for compliance
- Excellent performance with caching
- Clear separation of concerns
- Scalable to millions of records

### Negative
- PostgreSQL vertical scaling limits (mitigated by partitioning)
- EventStoreDB operational complexity (mitigated by managed service)
- Cache invalidation complexity (mitigated by short TTLs)
- Schema-per-tenant overhead (automated by migration scripts)

## Migration Strategy

### From Existing Systems
1. **Data mapping** from legacy schemas
2. **ETL pipelines** for initial load
3. **Parallel run** for validation
4. **Gradual cutover** by module

### Performance Targets
- Query response: <50ms (p95)
- Write latency: <100ms (p95)  
- Cache hit ratio: >80%
- Connection pool efficiency: >90%

## Monitoring

```yaml
metrics:
  - query_duration_p95
  - connection_pool_usage
  - cache_hit_ratio
  - replication_lag
  - disk_usage_percentage
  
alerts:
  - slow_queries: >100ms
  - connection_exhaustion: >80%
  - replication_lag: >1s
  - disk_usage: >75%
```

## Alternatives Considered

1. **MongoDB**:
   - Rejected: Eventual consistency issues for financial data
   
2. **MySQL**:
   - Rejected: Weaker JSON support, less extensible

3. **DynamoDB**:
   - Rejected: Vendor lock-in, no Bangladesh region

4. **Row-level multi-tenancy**:
   - Rejected: Risk of data leaks, complex queries

## References
- [PostgreSQL Multi-tenant Architectures](https://www.postgresql.org/docs/current/ddl-schemas.html)
- [Event Sourcing with EventStoreDB](https://www.eventstore.com/event-sourcing)
- [Redis Caching Strategies](https://redis.io/docs/manual/patterns/)