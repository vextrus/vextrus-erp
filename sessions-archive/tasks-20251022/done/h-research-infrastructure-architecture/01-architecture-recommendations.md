# Infrastructure Architecture Recommendations
Date: 2025-09-13
Status: Research Complete

## Executive Summary

Based on comprehensive analysis of our current infrastructure issues and industry best practices research, this document provides actionable recommendations for resolving the critical architectural misalignments in the Vextrus ERP system.

## Current State Analysis

### Critical Issues
1. **API Gateway Mismatch**: Apollo Federation expecting GraphQL from REST-only services
2. **Temporal Deployment**: Defined but not operational, blocking workflow functionality
3. **Configuration Chaos**: Inconsistent credentials, ports, and environment variables
4. **Service Communication**: No standardized pattern for inter-service calls

### Existing Strengths
- Kafka already integrated for event-driven architecture
- Multi-tenant database with RLS implemented
- Docker Compose infrastructure defined
- NestJS framework providing consistent structure

## Recommended Architecture

### 1. API Gateway Strategy: Hybrid Evolution

**Decision: Implement a pragmatic hybrid approach**

#### Phase 1: Immediate (1-2 weeks)
```typescript
// Fix api-gateway/src/config/configuration.ts
// Remove misleading defaults, add actual service URLs
subgraphs: [
  { 
    name: 'auth', 
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001/api' // REST for now
  },
  { 
    name: 'master-data', 
    url: process.env.MASTER_DATA_SERVICE_URL || 'http://localhost:3002/graphql' // Already has GraphQL
  },
  // ... other services
]
```

**Actions:**
1. Keep master-data with GraphQL (already implemented)
2. Add GraphQL schemas to core services (auth, workflow, rules-engine)
3. Route other REST services through Traefik directly
4. Document clear API patterns for each service type

#### Phase 2: Strategic (3-4 weeks)
- Implement GraphQL resolvers for auth, workflow, rules-engine
- Create REST-to-GraphQL adapter layer in API Gateway
- Standardize error handling across both protocols

### 2. Service Communication Pattern

**Decision: Event-driven + Synchronous REST hybrid**

```yaml
# Communication Matrix
Asynchronous Operations:
  - Order processing → Kafka events
  - Audit logging → Kafka events
  - Notifications → Kafka events
  - Report generation → Kafka events

Synchronous Operations:
  - Authentication → Direct REST
  - Real-time queries → Direct REST/GraphQL
  - Validation checks → Direct REST
```

**Implementation:**
```typescript
// Standardized service client
export class ServiceClient {
  constructor(
    private serviceName: string,
    private baseUrl: string,
    private circuitBreaker: CircuitBreaker
  ) {}

  async request(path: string, options: RequestOptions) {
    return this.circuitBreaker.execute(async () => {
      // Add retry logic, timeout, tracing
      return this.httpClient.request({
        url: `${this.baseUrl}${path}`,
        headers: {
          'X-Tenant-ID': this.tenantContext.tenantId,
          'X-Request-ID': this.tracingContext.requestId
        },
        ...options
      });
    });
  }
}
```

### 3. Temporal Workflow Orchestration

**Decision: Fix and deploy existing Temporal setup**

#### Immediate Actions:
1. **Verify Temporal containers are running:**
```bash
docker-compose ps temporal temporal-ui
# If not running:
docker-compose up -d temporal temporal-ui temporal-admintools
```

2. **Check Temporal health:**
```bash
curl http://localhost:7233/health
# Access UI at http://localhost:8080
```

3. **Fix workflow service connection:**
```typescript
// services/workflow/src/config/configuration.ts
export default () => ({
  temporal: {
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'vextrus-workflows'
  }
});
```

#### Production Deployment Strategy:
```yaml
# For Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: temporal-server
spec:
  replicas: 3  # For HA
  template:
    spec:
      containers:
      - name: temporal
        image: temporalio/server:1.22.0
        env:
        - name: DB
          value: "postgresql"
        - name: DB_PORT
          value: "5432"
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: temporal-secrets
              key: username
```

### 4. Configuration Management

**Decision: Centralized configuration with secure secrets management**

#### Development Environment (.env pattern):
```bash
# .env.development
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=vextrus
DATABASE_PASSWORD=vextrus_dev_2024
DATABASE_NAME=vextrus_dev
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092
TEMPORAL_ADDRESS=localhost:7233
```

#### Production Environment:
```typescript
// Integrate with HashiCorp Vault
import { VaultClient } from '@vextrus/vault-client';

export class ConfigService {
  private vault: VaultClient;
  
  async getSecret(key: string): Promise<string> {
    if (process.env.NODE_ENV === 'production') {
      return this.vault.read(`secret/data/${key}`);
    }
    return process.env[key];
  }
}
```

#### Multi-Tenant Configuration:
```typescript
// Leverage configuration service
export class TenantConfigService {
  async getTenantConfig(tenantId: string) {
    const config = await this.configService.get(`tenant:${tenantId}`);
    return {
      fiscalYear: config.fiscalYear || 'july-june',
      vatRate: config.vatRate || 0.15,
      currency: config.currency || 'BDT',
      timezone: config.timezone || 'Asia/Dhaka'
    };
  }
}
```

## Implementation Priorities

### Week 1: Critical Fixes
1. ✅ Fix Temporal deployment and verify workflow service connects
2. ✅ Standardize database credentials across all services
3. ✅ Update API Gateway configuration to reflect actual service endpoints
4. ✅ Create development .env files for all services

### Week 2: Core Services GraphQL
1. ⬜ Add GraphQL schema to auth service
2. ⬜ Add GraphQL schema to workflow service
3. ⬜ Add GraphQL schema to rules-engine
4. ⬜ Test federation with API Gateway

### Week 3: Configuration & Security
1. ⬜ Implement centralized configuration service
2. ⬜ Set up Vault for production secrets
3. ⬜ Standardize environment variable naming
4. ⬜ Implement hot-reload for configurations

### Week 4: Production Readiness
1. ⬜ Create Kubernetes manifests
2. ⬜ Set up monitoring with OpenTelemetry
3. ⬜ Implement circuit breakers
4. ⬜ Performance testing and optimization

## Migration Path

### From Current State to Target Architecture

1. **No Breaking Changes**: All changes are additive or configuration-based
2. **Gradual Migration**: Services can be updated independently
3. **Rollback Strategy**: Each change can be reverted without affecting others

## Performance Targets

### API Response Times
- GraphQL queries: < 200ms (p95)
- REST endpoints: < 300ms (p95)
- Workflow initiation: < 100ms
- Event processing: < 50ms

### Scalability Metrics
- Support 1000+ concurrent users
- Handle 10,000+ workflows/day
- Process 100,000+ events/hour
- Multi-tenant isolation guaranteed

## Risk Mitigation

### Technical Risks
| Risk | Mitigation |
|------|------------|
| GraphQL complexity | Start with simple schemas, evolve gradually |
| Temporal learning curve | Use existing workflow patterns, extensive testing |
| Configuration drift | Automated validation, GitOps approach |
| Performance degradation | Continuous monitoring, circuit breakers |

### Business Risks
| Risk | Mitigation |
|------|------------|
| Development delays | Phased approach, quick wins first |
| System instability | Feature flags, gradual rollout |
| Team resistance | Training, documentation, pair programming |

## Success Metrics

### Short-term (1 month)
- All services starting successfully
- Temporal workflows executing
- API Gateway serving requests
- Development environment stable

### Long-term (3 months)
- Production deployment complete
- < 300ms API response times
- 99.9% uptime achieved
- All business modules integrated

## Recommendations Summary

1. **Hybrid API Strategy**: GraphQL for core services, REST for others
2. **Event-Driven + REST**: Kafka for async, REST for sync operations
3. **Temporal for Workflows**: Fix deployment, use for complex business processes
4. **Centralized Config**: Configuration service + Vault for secrets
5. **Phased Implementation**: Critical fixes first, then evolve architecture

## Next Steps

1. Review and approve recommendations
2. Create detailed implementation tasks
3. Assign team responsibilities
4. Begin Week 1 critical fixes
5. Set up daily stand-ups for progress tracking

---

*This document represents the consensus of research from industry best practices, Gemini analysis, and current system constraints. Implementation should proceed with regular checkpoints and adjustments based on real-world results.*