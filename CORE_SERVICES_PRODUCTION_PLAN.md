# Core Services Production Implementation Plan

## Current State Analysis

### Service Status Matrix
| Service | Health | Metrics | Migrations | Kafka | Entities |
|---------|--------|---------|------------|-------|----------|
| **Auth** | ✅ Has module | ❌ None | ❌ None | ✅ Working | ✅ 5 entities |
| **Master-Data** | ❌ None | ❌ None | ❌ None | ✅ Working | ✅ 5 entities |
| **Workflow** | ❌ None | ❌ None | ❌ None | ❌ Missing | ❌ None yet |
| **Rules-Engine** | ❌ None | ❌ None | ❌ None | ❌ Missing | ❌ None yet |
| **API-Gateway** | ❌ None | ❌ None | N/A | ❌ Missing | N/A |

## Implementation Phases

### Phase 1: Health Checks (1 hour)
**Services**: master-data, workflow, rules-engine, api-gateway

**Tasks**:
1. Create health module structure in each service
2. Copy pattern from audit service
3. Add health controller with /health, /health/ready, /health/live endpoints
4. Include Redis, Kafka, Database connectivity checks
5. Update app.module.ts to import health modules

**Files to create per service**:
- `src/modules/health/health.module.ts`
- `src/modules/health/health.controller.ts`
- `src/modules/health/redis.health.ts` (if Redis used)
- `src/modules/health/kafka.health.ts` (if Kafka used)

### Phase 2: Prometheus Metrics (2 hours)
**Services**: auth, master-data, workflow, rules-engine, api-gateway

**Tasks**:
1. Create metrics module structure in each service
2. Copy pattern from audit service
3. Add service-specific business metrics:
   - **Auth**: login_attempts, token_generations, refresh_rates, session_counts
   - **Master-Data**: crud_operations_total (per entity), query_duration, cache_hits
   - **Workflow**: process_starts, process_completions, task_assignments, sla_breaches
   - **Rules-Engine**: rule_evaluations, condition_checks, action_executions, cache_effectiveness
   - **API-Gateway**: federated_queries, response_times, error_rates, rate_limits

**Files to create per service**:
- `src/modules/metrics/metrics.module.ts`
- `src/modules/metrics/metrics.controller.ts`
- `src/modules/metrics/metrics.service.ts`

### Phase 3: Database Migrations - Existing Entities (2 hours)
**Services**: auth, master-data

**Auth Entities to migrate**:
- `users` - User authentication data
- `roles` - RBAC roles
- `permissions` - RBAC permissions
- `user_roles` - User-role associations
- `event_store` - Event sourcing

**Master-Data Entities to migrate**:
- `customers` - Customer master records
- `vendors` - Vendor master records
- `products` - Product catalog
- `accounts` - Chart of accounts
- `base` - Common fields inheritance

**Tasks**:
1. Create migrations directory
2. Generate TypeORM migrations
3. Add UUID primary keys
4. Add proper indexes
5. Add tenant_id for multi-tenancy

### Phase 4: Create Missing Entities & Migrations (3 hours)
**Services**: workflow, rules-engine

**Workflow Entities to create**:
```typescript
// workflow.entity.ts - Workflow definitions
// process.entity.ts - Process instances
// task.entity.ts - Task instances
// transition.entity.ts - State transitions
// assignment.entity.ts - Task assignments
```

**Rules-Engine Entities to create**:
```typescript
// rule.entity.ts - Rule definitions
// condition.entity.ts - Rule conditions
// action.entity.ts - Rule actions
// evaluation.entity.ts - Evaluation history
// rule-set.entity.ts - Rule groupings
```

### Phase 5: Kafka Integration (1 hour)
**Services**: workflow, rules-engine, api-gateway

**Workflow Topics**:
- `workflow.process.started`
- `workflow.process.completed`
- `workflow.task.assigned`
- `workflow.task.completed`
- `workflow.sla.breached`

**Rules-Engine Topics**:
- `rules.evaluation.requested`
- `rules.evaluation.completed`
- `rules.rule.created`
- `rules.rule.updated`

**API-Gateway Topics**:
- `gateway.query.received`
- `gateway.query.completed`
- `gateway.error.occurred`
- `gateway.rate.limited`

### Phase 6: Integration Testing (1 hour)
**All services**

**Tests**:
1. Health endpoints return 200
2. Metrics endpoints return Prometheus format
3. Migrations run successfully
4. Services start without errors
5. Kafka events flow correctly
6. GraphQL federation works
7. End-to-end authentication flow
8. Grafana shows all metrics

## Implementation Order

1. **Health Checks First** - Quick wins, enables Kubernetes deployment
2. **Metrics Second** - Enables monitoring visibility
3. **Migrations Third** - Database structure required for operations
4. **Kafka Last** - Events depend on working services

## Scripts to Use

```bash
# Health checks
scripts/add-health-to-core-services.sh

# Metrics
scripts/setup-metrics-modules.sh

# Migrations
scripts/generate-migrations.sh

# Kafka topics
scripts/create-kafka-topics.sh

# Validation
scripts/validate-complete-system.sh
```

## Success Metrics

- All 12 services have health endpoints responding
- All 12 services visible in Prometheus/Grafana
- Zero errors on `docker-compose up`
- Can authenticate and perform CRUD operations
- Events flowing through Kafka
- GraphQL federation operational

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Health Checks | 1 hour | None |
| Metrics | 2 hours | None |
| Existing Migrations | 2 hours | None |
| New Entities | 3 hours | None |
| Kafka | 1 hour | Entities |
| Testing | 1 hour | All above |
| **Total** | **10 hours** | |

## Next Steps

1. Start with health checks for master-data service
2. Use audit service as template
3. Test each service individually
4. Run integration tests after each phase