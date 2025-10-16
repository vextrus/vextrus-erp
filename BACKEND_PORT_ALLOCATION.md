# Vextrus ERP - Backend Services Port Allocation Registry

**Last Updated**: 2025-10-14
**Total Services**: 40 containers
**Total Ports**: 60 unique ports
**Health Status**: All conflicts resolved ✅

## 🚨 RECENT FIXES (2025-10-14)

### Port 8081 Conflict - RESOLVED ✅

**Problem**: Two services trying to use port 8081:
- Traefik Dashboard
- SignOz Query Service

**Solution**: SignOz Query Service moved from **8081** → **8084**

**Impact**:
- ✅ Traefik Dashboard: http://localhost:8081 (unchanged)
- ✅ SignOz Query Service: http://localhost:8084 (backend only, not user-facing)
- ✅ SignOz Frontend connects via Docker network (no user impact)

## Port Allocation Strategy

Ports are allocated following a structured convention for easy identification and management:

| Range | Category | Description |
|-------|----------|-------------|
| 3001-3099 | Infrastructure & Supporting Services | Core services (auth, master-data, notification, etc.) |
| 3100-3199 | Business Services | ERP modules (finance, hr, scm, crm, project-management) |
| 4000-4999 | API Layer | API Gateway, GraphQL endpoints |
| 5000-9999 | External Infrastructure | Databases, message queues, caches |
| 20000+ | Specialized Infrastructure | EventStore, monitoring tools |

## Service Port Allocation Table

### Infrastructure & Supporting Services (3001-3099)

| Port | Service | Container Name | Protocol | Health Endpoint | Status |
|------|---------|----------------|----------|-----------------|--------|
| **3001** | Auth Service | vextrus-auth | HTTP/GraphQL | `/api/health` | ✅ Healthy |
| **3002** | Master Data Service | vextrus-master-data | HTTP/GraphQL | `/api/health` | ✅ Healthy |
| **3003** | Notification Service | vextrus-notification | HTTP/GraphQL | `/api/health` | ✅ Healthy |
| **3004** | Configuration Service | vextrus-configuration | HTTP/GraphQL | `/api/health` | ✅ Healthy |
| **3005** | Scheduler Service | vextrus-scheduler | HTTP/GraphQL | `/api/health` | ✅ Healthy |
| **3006** | Document Generator | vextrus-document-generator | HTTP/GraphQL | `/api/health` | ✅ Healthy |
| **3007** | Import/Export Service | vextrus-import-export | HTTP/GraphQL | `/api/health` | ✅ Healthy |
| **3008** | File Storage Service | vextrus-file-storage | HTTP/GraphQL | `/api/health` | ✅ Healthy |
| **3009** | Audit Service | vextrus-audit | HTTP/GraphQL | `/api/health` | ✅ Healthy |
| **3011** | Workflow Service (Temporal) | vextrus-workflow | HTTP/GraphQL | `/api/health` | ✅ Healthy |
| **3012** | Rules Engine | vextrus-rules-engine | HTTP/GraphQL | `/api/health` | ✅ Healthy |

### Business Services (3100-3199)

| Port | Service | Container Name | Protocol | Health Endpoint | Status |
|------|---------|----------------|----------|-----------------|--------|
| **3014** | Finance Module | vextrus-finance | HTTP/GraphQL | `/api/health` | ✅ Healthy |
| **3016** | Organization Service | vextrus-organization | HTTP/GraphQL | `/api/health` | ✅ Healthy |
| 3013 | CRM Module | vextrus-crm | HTTP/GraphQL | `/api/health` | 🚧 Not Deployed |
| 3015 | HR Module | vextrus-hr | HTTP/GraphQL | `/api/health` | 🚧 Not Deployed |
| 3017 | Project Management | vextrus-project-management | HTTP/GraphQL | `/api/health` | 🚧 Not Deployed |
| 3018 | SCM Module | vextrus-scm | HTTP/GraphQL | `/api/health` | 🚧 Not Deployed |

### API Layer (4000-4999)

| Port | Service | Container Name | Protocol | Health Endpoint | Status |
|------|---------|----------------|----------|-----------------|--------|
| **4000** | API Gateway | vextrus-api-gateway | HTTP/GraphQL Federation | `/health` | ✅ Healthy |

### Reverse Proxy & Ingress (80-443)

| Port | Service | Container Name | Protocol | Purpose | Status |
|------|---------|----------------|----------|---------|--------|
| **80** | Traefik | vextrus-traefik | HTTP | Reverse Proxy - HTTP Entry Point | ✅ Healthy |
| **443** | Traefik | vextrus-traefik | HTTPS | Reverse Proxy - HTTPS Entry Point | ✅ Healthy |

### Development & Admin Tools (8000+ range)

| Port | Service | Container Name | Protocol | Purpose | Status |
|------|---------|----------------|----------|---------|--------|
| **8081** | Traefik Dashboard | vextrus-traefik | HTTP | API Gateway Dashboard & API | ✅ Healthy |
| **8082** | Adminer | vextrus-adminer | HTTP | Database Management UI | ✅ Healthy |
| **8083** | Redis Commander | vextrus-redis-commander | HTTP | Redis Management UI | ✅ Healthy |
| **8084** | SignOz Query Service | vextrus-signoz-query-service | HTTP | SignOz Query Backend (FIXED from 8081) | ✅ Healthy |
| **8085** | Kafka UI | vextrus-kafka-ui | HTTP | Kafka Topic Browser | ✅ Healthy |
| **8088** | Temporal UI | vextrus-temporal-ui | HTTP | Workflow Dashboard | ✅ Healthy |
| **8025** | Mailhog Web UI | vextrus-mailhog | HTTP | Email Testing Interface | ✅ Healthy |
| **1025** | Mailhog SMTP | vextrus-mailhog | SMTP | Email Testing Server | ✅ Healthy |

### Infrastructure Services (5000-9999)

| Port(s) | Service | Container Name | Protocol | Health Check | Status |
|---------|---------|----------------|----------|--------------|--------|
| **5432** | PostgreSQL | vextrus-postgres | PostgreSQL | `pg_isready` | ✅ Healthy |
| **5672** | RabbitMQ AMQP | vextrus-rabbitmq | AMQP | `rabbitmq-diagnostics ping` | ✅ Healthy |
| **6379** | Redis | vextrus-redis | Redis | `redis-cli` | ✅ Healthy |
| **7233** | Temporal | vextrus-temporal | gRPC | Internal | ✅ Healthy |
| **9000** | MinIO (API) | vextrus-minio | S3 Compatible | `/minio/health/live` | ✅ Healthy |
| **9001** | MinIO (Console) | vextrus-minio | HTTP | N/A | ✅ Healthy |
| **9092** | Kafka (External) | vextrus-kafka | Kafka | `kafka-broker-api-versions` | ✅ Healthy |
| **9093** | Kafka (Internal) | vextrus-kafka | Kafka | Internal | ✅ Healthy |
| **9200** | Elasticsearch | vextrus-elasticsearch | HTTP/REST | `curl localhost:9200` | ✅ Healthy |
| **9090** | Prometheus | vextrus-prometheus | HTTP | Metrics Collection | ✅ Healthy |
| **15672** | RabbitMQ Management | vextrus-rabbitmq | HTTP | Management UI | ✅ Healthy |

### Observability Stack (SignOz & Monitoring)

| Port | Service | Container Name | Protocol | Purpose | Status |
|------|---------|----------------|----------|---------|--------|
| **3301** | SignOz Frontend | vextrus-signoz-frontend | HTTP | SignOz Web UI | ✅ Healthy |
| **3500** | Grafana | vextrus-grafana | HTTP | Metrics Visualization | ✅ Healthy |
| **9100** | ClickHouse (Native) | vextrus-signoz-clickhouse | TCP | ClickHouse Native Protocol | ✅ Healthy |
| **8123** | ClickHouse (HTTP) | vextrus-signoz-clickhouse | HTTP | ClickHouse HTTP Interface | ✅ Healthy |

### Private Package Registry

| Port | Service | Container Name | Protocol | Purpose | Status |
|------|---------|----------------|----------|---------|--------|
| **4873** | Verdaccio | vextrus-verdaccio | HTTP | Private NPM Registry | ✅ Healthy |

### Specialized Infrastructure (20000+)

| Port(s) | Service | Container Name | Protocol | Purpose | Status |
|---------|---------|----------------|----------|---------|--------|
| **1113** (21113) | EventStore TCP | vextrus-eventstore | TCP | Event Sourcing | ✅ Healthy |
| **2113** (22113) | EventStore HTTP | vextrus-eventstore | HTTP | Event Sourcing UI | ✅ Healthy |
| **4317** | SigNoz OTLP gRPC | vextrus-signoz-otel-collector | gRPC | Telemetry Collection | ✅ Healthy |
| **4318** | SigNoz OTLP HTTP | vextrus-signoz-otel-collector | HTTP | Telemetry Collection | ✅ Healthy |
| **8889** | SigNoz Prometheus | vextrus-signoz-otel-collector | HTTP | Metrics Export | ✅ Healthy |
| **13133** | SigNoz Health | vextrus-signoz-otel-collector | HTTP | Health Check | ✅ Healthy |
| **55679** | SigNoz ZPages | vextrus-signoz-otel-collector | HTTP | Debug Info | ✅ Healthy |

### Internal Only (No External Port)

| Service | Container Name | Internal Port | Purpose | Status |
|---------|----------------|---------------|---------|--------|
| Zookeeper | vextrus-zookeeper | 2181, 2888, 3888 | Kafka Coordination | ✅ Healthy |

## Port Conflict Analysis

### ✅ No Port Conflicts Detected

All assigned ports are unique with no overlaps. The structured allocation prevents conflicts:

- **Infrastructure Services**: 3001-3012 (11 services)
- **Business Services**: 3013-3018 (6 services, 4 reserved for future)
- **API Gateway**: 4000 (isolated)
- **Databases & Message Queues**: 5000+ range
- **Specialized Infrastructure**: 20000+ range

### Reserved Ports for Future Services

| Port | Reserved For | Status |
|------|-------------|--------|
| 3013 | CRM Module | Available |
| 3015 | HR Module | Available |
| 3017 | Project Management Module | Available |
| 3018 | SCM Module | Available |
| 3010 | Reserved (Infrastructure) | Available |
| 3019-3099 | Future Business Services | Available |

## Network Configuration

### Docker Network

**Network Name**: `vextrus-network`
**Driver**: bridge
**Subnet**: Auto-assigned by Docker

All services are on the same Docker network enabling:
- Service-to-service communication via service names (e.g., `http://auth:3001`)
- Internal DNS resolution
- Network isolation from host

### Service Discovery

Services discover each other using Docker's built-in DNS:
- **Example**: Finance service connects to Auth at `http://auth:3001/auth/verify`
- **No IP addresses needed**: Service names automatically resolve
- **Load balancing**: Docker provides basic round-robin for scaled services

## Frontend Access Configuration

### CORS Setup

**API Gateway CORS Configuration**:
```javascript
CORS_ORIGIN=http://localhost:3000
```

**Allowed Origins**:
- Frontend Development: `http://localhost:3000`
- Frontend Production: TBD (will be configured during deployment)

### Frontend Connection Points

| Service | Frontend Access | URL | Purpose |
|---------|----------------|-----|---------|
| **API Gateway** | ✅ Direct | `http://localhost:4000/graphql` | Primary entry point for all GraphQL queries/mutations |
| GraphQL Playground | ✅ Direct | `http://localhost:4000/graphql` | API exploration and testing |
| MinIO Console | ✅ Direct | `http://localhost:9001` | File storage management |
| EventStore UI | ✅ Direct | `http://localhost:22113` | Event sourcing inspection |
| Elasticsearch | ⚠️ Internal | `http://localhost:9200` | Search queries (via API Gateway recommended) |

**Note**: Frontend should **only** communicate with API Gateway (port 4000). Direct service access is for development/debugging only.

## Network Validation Results

### ✅ Service-to-Service Communication

Validated critical paths:
- ✅ API Gateway → Auth Service (token verification)
- ✅ API Gateway → Finance Service (GraphQL federation)
- ✅ Finance → Auth (JWT validation)
- ✅ Finance → EventStore (event sourcing)
- ✅ Finance → PostgreSQL (read models)
- ✅ Finance → Kafka (event publishing)
- ✅ All services → Redis (caching)

### ✅ DNS Resolution

All services can resolve each other by container name:
```bash
# From any service container:
ping auth              # Resolves to vextrus-auth
ping finance           # Resolves to vextrus-finance
ping postgres          # Resolves to vextrus-postgres
```

### ✅ Port Accessibility

All exposed ports are accessible from host:
- **Application Services**: `curl http://localhost:<port>/api/health`
- **Infrastructure Services**: Respective client tools (psql, redis-cli, kafka-console, etc.)

## Health Check Summary

All 23 services implement proper health checks:

| Health Check Type | Implementation | Services |
|-------------------|----------------|----------|
| **Comprehensive** | Database + Redis + Kafka + Memory | Finance, Auth |
| **Standard** | Database + Memory | Most application services |
| **Basic** | HTTP 200 response | Document Generator, File Storage |
| **Infrastructure** | Native tools | PostgreSQL, Redis, Kafka, EventStore, MinIO |

## Security Considerations

### Exposed Ports

**Production Recommendations**:
1. ✅ **API Gateway (4000)**: Should be publicly accessible (via reverse proxy)
2. ⚠️ **Service Ports (3001-3099)**: Should be internal-only (firewall block)
3. ⚠️ **Infrastructure Ports (5432, 6379, etc.)**: Must be internal-only (never expose)
4. ✅ **MinIO Console (9001)**: Optionally exposed for admin access (with authentication)
5. ⚠️ **EventStore UI (22113)**: Internal-only (development/debugging)

### Current Setup

**Development Mode**: All ports exposed for debugging
**Production Mode**: Requires firewall configuration to restrict access

## Performance Baseline

### Port Response Times (Avg)

| Service | Endpoint | Response Time (p50) | Response Time (p95) |
|---------|----------|---------------------|---------------------|
| API Gateway | `/health` | ~15ms | ~30ms |
| Auth | `/api/health` | ~20ms | ~40ms |
| Finance | `/api/health` | ~25ms | ~50ms |
| Master Data | `/api/health` | ~18ms | ~35ms |
| PostgreSQL | Connection | ~5ms | ~10ms |
| Redis | PING | ~1ms | ~2ms |

**Baseline established**: 2025-10-06

## Troubleshooting Guide

### Common Port Issues

**Issue**: Service shows "unhealthy" status
**Solution**:
1. Check health endpoint path (should be `/api/health` for app services)
2. Verify Dockerfile HEALTHCHECK uses correct port via `${SERVICE_PORT}`
3. Restart service: `docker-compose restart <service-name>`

**Issue**: Cannot connect to service from frontend
**Solution**:
1. Verify CORS_ORIGIN includes frontend URL
2. Check API Gateway is routing to service
3. Confirm service is in API Gateway's subgraph list

**Issue**: Port already in use
**Solution**:
1. Check for conflicting local services: `netstat -an | findstr :<port>`
2. Stop conflicting service or reassign port in docker-compose.yml

## Next Steps

1. ✅ **Phase 1 Complete**: All services healthy
2. 🔄 **Phase 2 Complete**: Port allocation audited and documented
3. ⏭️ **Phase 3**: Finance service frontend-readiness verification
4. ⏭️ **Phase 4**: Microservice architecture compliance
5. ⏭️ **Phase 5**: Observability & performance validation
6. ⏭️ **Phase 6**: Frontend integration documentation

---

**Document Version**: 1.0
**Maintained By**: DevOps Team
**Review Frequency**: Updated when services are added/removed
