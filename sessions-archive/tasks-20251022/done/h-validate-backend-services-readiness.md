---
task: h-validate-backend-services-readiness
branch: feature/validate-backend-services-readiness
status: incomplete
created: 2025-10-06
completed: 2025-10-06
modules: [all-services, api-gateway, finance, infrastructure, observability]
complexity: 149
priority: CRITICAL_BLOCKER
estimated_hours: 12-16
note: "INCOMPLETE - Infrastructure issues discovered requiring Docker optimization first"
---

# High Priority: Validate Backend Services Readiness for Frontend Integration

## Problem/Goal

Before implementing the Finance frontend module, we must systematically validate and optimize all 23 backend services to ensure they are production-ready, properly integrated, and frontend-friendly. Current analysis shows **3 unhealthy services** (file-storage, import-export, document-generator) that must be fixed, plus comprehensive validation of port allocation, health checks, API contracts, and service integration patterns.

## Context

**Completed Foundation**:
- ✅ Frontend Foundation (Vextrus Vision design system, glassmorphism, React 18+)
- ✅ Finance Module Backend (89 complexity, full microservice integration)
- ✅ 18 Backend Services running in Docker
- ✅ Infrastructure services (PostgreSQL, Redis, Kafka, EventStore, etc.)

**Current State** (23 Services Running):
```
HEALTHY (20):
✅ vextrus-api-gateway (4000)       ✅ vextrus-auth (3001)
✅ vextrus-master-data (3002)       ✅ vextrus-notification (3003)
✅ vextrus-configuration (3004)     ✅ vextrus-scheduler (3005)
✅ vextrus-workflow (3011)          ✅ vextrus-rules-engine (3012)
✅ vextrus-finance (3014)           ✅ vextrus-organization (3016)
✅ vextrus-audit (3009)             ✅ vextrus-postgres (5432)
✅ vextrus-redis (6379)             ✅ vextrus-kafka (9092-9093)
✅ vextrus-elasticsearch (9200)     ✅ vextrus-zookeeper (2181)
✅ vextrus-minio (9000-9001)        ✅ vextrus-eventstore (21113, 22113)
✅ vextrus-temporal (7233)          ✅ vextrus-signoz-otel-collector (4317-4318)

UNHEALTHY (3):
❌ vextrus-file-storage (3008)
❌ vextrus-import-export (3007)
❌ vextrus-document-generator (3006)
```

**Why This Matters**:
Research shows 60% of frontend development delays stem from backend integration issues. Pre-flight validation prevents:
- API contract mismatches during frontend development
- Service discovery failures in production
- Performance bottlenecks under load
- Security vulnerabilities in authentication flows
- Data inconsistencies across microservices

## 🎯 Success Criteria

### Phase 1: Service Health & Recovery (CRITICAL)
- [ ] **Fix Unhealthy Services**
  - [ ] `vextrus-file-storage` - Diagnose and repair (MinIO integration)
  - [ ] `vextrus-import-export` - Diagnose and repair (Kafka/database connectivity)
  - [ ] `vextrus-document-generator` - Diagnose and repair (Puppeteer/templates)
  - [ ] All services show `healthy` status in Docker health checks
  - [ ] Health endpoint response time < 50ms for all services

- [ ] **Health Check Validation**
  - [ ] All services implement `/health` endpoint
  - [ ] All services implement `/health/ready` (readiness probe)
  - [ ] All services implement `/health/live` (liveness probe)
  - [ ] Health checks include dependency status (database, cache, message queue)
  - [ ] Automated health monitoring script created

### Phase 2: Port Allocation & Network Validation
- [ ] **Port Allocation Audit**
  - [ ] Document all service ports in central registry (Markdown table)
  - [ ] Verify no port conflicts exist
  - [ ] Confirm port ranges follow convention:
    - Infrastructure: 3001-3099
    - Core Business: 3100-3199
    - Supporting: 3200-3299
    - External Infrastructure: 4000+ (API Gateway), 5000+ (databases)
  - [ ] Update docker-compose.yml with standardized port allocation
  - [ ] Document exposed ports for frontend consumption

- [ ] **Network Communication Validation**
  - [ ] Test service-to-service communication (internal Docker network)
  - [ ] Verify API Gateway can route to all services
  - [ ] Confirm DNS resolution works for all service names
  - [ ] Test load balancing if configured
  - [ ] Validate CORS configuration for frontend access

### Phase 3: Finance Service Frontend-Readiness Verification
- [ ] **API Contract Validation**
  - [ ] GraphQL schema is properly federated via API Gateway
  - [ ] All Finance queries/mutations accessible at `http://localhost:4000/graphql`
  - [ ] GraphQL Playground works and shows Finance schema
  - [ ] TypeScript types generated from GraphQL schema
  - [ ] API response formats match frontend expectations (camelCase vs snake_case)

- [ ] **Finance Service Integration Matrix**
  | Service | Integration Type | Status | Frontend Impact |
  |---------|-----------------|--------|-----------------|
  | Auth | GraphQL + JWT | ⬜ Verify | Authentication required for all Finance APIs |
  | Master Data | GraphQL Federation | ⬜ Verify | Vendor/Customer data resolution |
  | Workflow | Temporal SDK | ⬜ Verify | Approval flows UI state management |
  | Notification | Kafka Events | ⬜ Verify | Real-time alerts in UI |
  | Document Generator | gRPC | ⬜ Verify | Invoice/report PDF generation |
  | Audit | Event Stream | ⬜ Verify | Audit trail display in UI |
  | File Storage | MinIO SDK | ⬜ Verify | Document upload/preview |
  | Rules Engine | GraphQL | ⬜ Verify | Client-side validation rules |
  | Organization | GraphQL Federation | ⬜ Verify | Multi-company switching |

- [ ] **Finance Module Completeness**
  - [ ] All CRUD operations working (Chart of Accounts, Journals, Invoices, Payments)
  - [ ] Event Sourcing operational (can replay events)
  - [ ] CQRS read models optimized for frontend queries
  - [ ] Multi-tenancy working (data isolation verified)
  - [ ] Bangladesh compliance features active (NBR, Mushak forms)
  - [ ] Real-time features working (WebSocket/SSE for live updates)

### Phase 4: Microservice Architecture Compliance
- [ ] **Architecture Patterns Validation**
  - [ ] API Gateway: Single entry point confirmed, rate limiting active
  - [ ] Service Discovery: All services registered and discoverable
  - [ ] Circuit Breakers: Resilience4j/Hystrix configured for critical paths
  - [ ] Event-Driven: Kafka topics properly configured, consumers working
  - [ ] Database per Service: No cross-service database queries detected
  - [ ] Saga Pattern: Distributed transaction coordination verified

- [ ] **GraphQL Federation Validation**
  - [ ] Apollo Federation v2 gateway running correctly
  - [ ] All services register their schemas with gateway
  - [ ] Entity resolution working (@key directives)
  - [ ] No schema conflicts or overlapping types
  - [ ] Federation playground shows complete unified schema
  - [ ] Query planning optimization enabled

- [ ] **Authentication & Authorization**
  - [ ] JWT token validation working across all services
  - [ ] RBAC policies enforced at API Gateway level
  - [ ] Multi-tenancy tokens properly scoped
  - [ ] Token refresh mechanism working
  - [ ] Service-to-service authentication (if applicable)

### Phase 5: Observability & Performance Validation
- [ ] **OpenTelemetry Integration**
  - [ ] All services sending traces to SigNoz
  - [ ] Distributed tracing working across service calls
  - [ ] Metrics collection active (Prometheus format)
  - [ ] Log aggregation working (structured JSON logs)
  - [ ] SigNoz dashboard accessible and showing data

- [ ] **Performance Baselines**
  - [ ] API Gateway response time: < 50ms (routing overhead)
  - [ ] Finance GraphQL queries: < 200ms (p95)
  - [ ] Finance mutations: < 500ms (p95)
  - [ ] Database query performance: < 100ms (p95)
  - [ ] Cache hit ratio: > 80% for read-heavy endpoints
  - [ ] Kafka message processing latency: < 100ms

- [ ] **Load Testing (Optional but Recommended)**
  - [ ] Finance service can handle 100 concurrent requests
  - [ ] API Gateway can handle 500 req/sec
  - [ ] No memory leaks detected under sustained load
  - [ ] Connection pooling working correctly

### Phase 6: Documentation & Frontend Handoff
- [ ] **Service Catalog Documentation**
  - [ ] Create `BACKEND_SERVICES_CATALOG.md` with:
    - Service descriptions and responsibilities
    - Port allocations and URLs
    - Health check endpoints
    - GraphQL schema locations
    - Authentication requirements
    - Rate limits and quotas
    - Example queries/mutations for frontend

- [ ] **Frontend Integration Guide**
  - [ ] Create `FRONTEND_INTEGRATION_GUIDE.md` with:
    - API Gateway base URL and authentication flow
    - GraphQL client setup (Apollo Client configuration)
    - TypeScript type generation workflow
    - WebSocket connection setup for real-time features
    - Error handling patterns
    - Pagination and infinite scroll patterns
    - File upload/download patterns
    - Multi-tenancy context management

- [ ] **Finance Module API Reference**
  - [ ] Document all Finance GraphQL queries/mutations
  - [ ] Provide example requests/responses
  - [ ] Document real-time subscription endpoints
  - [ ] List all Kafka events frontend should listen to
  - [ ] Document Bangladesh-specific fields (TIN, BIN, Mushak)

## 🔍 Best Practices from Research

### Pre-Frontend Integration Checklist (Industry Standards 2025)

**Contract-First Development**:
- ✅ OpenAPI 3.1/GraphQL schema as source of truth
- ✅ Schema versioning and backward compatibility
- ✅ Automated contract testing (Pact.io pattern)
- ✅ TypeScript types auto-generated from schemas

**Service Mesh Readiness** (Future):
- Consider Istio/Linkerd for advanced traffic management
- Mutual TLS for service-to-service communication
- Advanced observability (service topology maps)

**Testing Strategy**:
```
Unit Tests → Integration Tests → Contract Tests → E2E Tests
                                      ↑
                            Critical before frontend!
```

**Performance Monitoring**:
- Establish baseline metrics BEFORE frontend development
- Set up alerts for degradation (> 20% increase in p95 latency)
- Monitor database connection pool usage
- Track GraphQL query complexity

## User Notes

**Critical Path**:
1. Fix 3 unhealthy services FIRST (blocking issue)
2. Validate Finance service integration completeness
3. Document API contracts for frontend team
4. Establish performance baselines
5. Create frontend integration guide

**Risk Mitigation**:
- If service fixes take > 4 hours, document workarounds for frontend
- If Finance integration gaps found, create follow-up tasks immediately
- Keep frontend team informed of any breaking changes

**Post-Validation**:
After this task, we'll have:
- 23/23 services healthy and validated
- Complete API documentation for frontend
- Performance baselines established
- Clear integration patterns documented
- Confidence to begin Finance frontend development

## Context Manifest

### How the Microservice Architecture Currently Works

The Vextrus ERP backend is built on a distributed microservices architecture with 23 containerized services orchestrated through Docker Compose. The system follows Domain-Driven Design (DDD) principles with event sourcing, CQRS patterns, and GraphQL Federation for unified API access. Here's how it all works together:

#### Entry Point and API Gateway Flow

When a frontend application makes a request, it enters through the **API Gateway** (port 4000), which acts as the single entry point for all client communications. The gateway is built with NestJS and implements Apollo Federation v2 to compose a unified GraphQL schema from multiple microservices. Here's the request flow:

1. **Client Request**: Frontend sends GraphQL query/mutation to `http://localhost:4000/graphql`
2. **Authentication Context Extraction**: The gateway extracts JWT token from `Authorization: Bearer <token>` header and tenant ID from `x-tenant-id` header
3. **Context Propagation**: Gateway creates a request context object containing token, tenantId, and trace headers, then forwards these to subgraph services
4. **Schema Composition**: Apollo Gateway uses IntrospectAndCompose to dynamically discover and merge GraphQL schemas from registered subgraphs (auth, master-data, workflow, rules-engine, organization, and eventually finance)
5. **Query Planning**: Gateway analyzes the GraphQL query and creates an execution plan to fetch data from appropriate services
6. **Distributed Execution**: Gateway fans out requests to multiple services in parallel when possible, forwarding authentication and tenant context via HTTP headers
7. **Response Aggregation**: Results from different services are merged according to federation rules and returned as a single response

The gateway configuration lives in `services/api-gateway/src/config/configuration.ts` where subgraphs are registered. Currently, Finance service is in the `SKIP_SERVICES` list (line 661 of docker-compose.yml), meaning it's not yet federated through the gateway despite having GraphQL capabilities.

#### Authentication and Authorization Architecture

The **Auth Service** (port 3001) is the cornerstone of security, implementing JWT-based authentication with refresh token rotation:

**Registration/Login Flow**:
1. User submits credentials via REST (`POST /api/v1/auth/login`) or GraphQL (`Mutation.login`)
2. Auth service validates credentials against PostgreSQL database (`vextrus_auth`)
3. On success, generates two tokens:
   - **Access Token**: Short-lived (15m), contains user ID, role, organization, and tenant
   - **Refresh Token**: Long-lived (7d), stored in Redis with user association
4. Returns both tokens plus user profile to client
5. Failed attempts increment counter; after 5 failures, account locks via User Aggregate event sourcing

**Request Authentication Flow**:
1. Client includes access token in `Authorization: Bearer <token>` header
2. Each protected service (e.g., Finance) uses `JwtAuthGuard` to intercept requests
3. Guard extracts token and makes HTTP POST to Auth service at `/auth/verify`
4. Auth service validates token signature, expiration, and revocation status
5. If valid, returns user object which guard attaches to request context as `req.user`
6. Service-level authorization checks user role against required permissions

**Multi-Tenancy Integration**:
- Every authenticated request includes `x-tenant-id` header
- `TenantMiddleware` (in Finance, Organization services) extracts and validates tenant ID
- Services use schema-based tenant isolation: each tenant gets `tenant_{tenantId}` schema in PostgreSQL
- EventStore streams are prefixed with tenant ID for event sourcing isolation
- Cross-tenant queries are blocked at middleware level

#### Finance Service Deep Dive: Event Sourcing and CQRS

The **Finance Service** (port 3014) is the most architecturally advanced service, implementing full event sourcing with CQRS:

**Command Processing (Write Side)**:
1. Client sends GraphQL mutation (e.g., `createInvoice`) to Finance service
2. `JwtAuthGuard` validates authentication and attaches user context
3. `TenantMiddleware` validates tenant and sets schema context
4. GraphQL resolver receives command and delegates to Command Handler
5. Command Handler loads aggregate root from EventStore or creates new one
6. Business logic executes within aggregate (e.g., `InvoiceAggregate.create()`)
7. Aggregate emits domain events (e.g., `InvoiceCreatedEvent`)
8. Events are appended to EventStore DB stream `{tenantId}-invoice-{aggregateId}`
9. Events published to Kafka topic `finance.invoice.created` for async processing
10. Confirmation returned to client

**Query Processing (Read Side)**:
1. Client sends GraphQL query (e.g., `getInvoice(id)`)
2. Query handler reads from PostgreSQL read model (optimized view tables)
3. Read models are projections built by event handlers consuming from EventStore
4. Returns denormalized data optimized for fast queries (< 100ms target)

**Event Sourcing Architecture**:
- **EventStore DB** (ports 21113 TCP, 22113 HTTP): Append-only event log providing full audit trail
- Connection string: `esdb://eventstore:2113?tls=false` (configured in Finance service)
- Domain aggregates: ChartOfAccountAggregate, JournalEntryAggregate, InvoiceAggregate, PaymentAggregate
- Each aggregate has unique stream: `{tenantId}-{aggregate-type}-{aggregate-id}`
- Events are immutable JSON documents with metadata (timestamp, userId, correlationId)
- Finance service implements `EventStoreService` to append/read events with strong consistency

**CQRS Read Model Projection**:
- Event handlers subscribe to EventStore streams
- On event received, handler updates PostgreSQL read model tables
- Read models use TypeORM entities for query optimization
- Eventual consistency: small lag between write and read availability (typically < 50ms)

#### Service-to-Service Communication Patterns

The architecture uses three communication patterns:

**1. Synchronous HTTP (Service-to-Service)**:
- Example: Finance→Auth for token verification
- Uses NestJS HttpModule with Axios
- Includes retry logic (5 retries with exponential backoff)
- Timeout configured per service (typically 5s)

**2. Asynchronous Messaging via Kafka**:
- **Kafka Cluster** (ports 9092 external, 9093 internal) with Zookeeper coordination
- Each service is both producer and consumer
- Topics follow pattern: `{service}.{entity}.{event}` (e.g., `finance.invoice.created`)
- Finance service Kafka config: clientId `finance-service`, consumer group `finance-consumer`
- Idempotent producers prevent duplicate events
- Example flow: Finance emits `InvoiceCreatedEvent` → Notification service listens → sends email to customer

**3. GraphQL Federation (API Composition)**:
- Services expose GraphQL schemas with `@key` directives for entity references
- Example: User entity in Auth service has `@Directive('@key(fields: "id")')`
- Other services can extend User with additional fields via federation
- Gateway resolves cross-service references automatically
- Enables complex queries spanning multiple services in single request

#### Database Architecture: Multi-Database Per Service

Each service has dedicated PostgreSQL database for complete isolation:

**Database Initialization** (`infrastructure/docker/postgres/init.sql`):
- PostgreSQL container (port 5432) creates 18 databases on startup
- Examples: `vextrus_auth`, `vextrus_finance`, `vextrus_master_data`, etc.
- Each database has UUID and pgcrypto extensions enabled
- Each database has service-specific schema (e.g., `finance` schema in `vextrus_finance`)
- Single database user `vextrus` with grants across all databases

**Multi-Tenancy Implementation**:
- Within each service database, dynamic schemas created per tenant: `tenant_{tenantId}`
- TypeORM configuration switches schema based on `req.tenantContext.dbSchema`
- Prevents accidental cross-tenant data leakage
- All queries scoped to tenant schema automatically

**Data Consistency Patterns**:
- **Saga Pattern**: Distributed transactions coordinated via Kafka events
- **Eventual Consistency**: Services maintain local replicas via event subscriptions
- **Compensating Transactions**: Failed multi-service operations emit rollback events
- **Outbox Pattern**: Database writes and event publishing in same transaction

#### Observability and Telemetry Stack

**OpenTelemetry Integration**:
- **SigNoz Collector** (ports 4317 gRPC, 4318 HTTP) receives all telemetry
- Services configured with `OTEL_EXPORTER_OTLP_ENDPOINT=http://signoz-otel-collector:4318`
- Three signal types collected:
  - **Traces**: Distributed request tracing with W3C Trace Context propagation
  - **Metrics**: Business metrics (login count, invoice creation, query latency)
  - **Logs**: Structured JSON logs with correlation IDs

**Trace Propagation Flow**:
1. API Gateway generates trace ID for incoming request
2. Sets `x-trace-id` header when calling subgraphs
3. Each service extracts trace ID and creates child spans
4. Services forward trace headers to downstream dependencies
5. Complete trace visible in SigNoz UI showing full request path

**Health Check Implementation**:
Services implement three health endpoints following Kubernetes patterns:

1. **`GET /health`**: Comprehensive check including database, Redis, Kafka, EventStore
   - Returns 200 if all dependencies healthy, 503 otherwise
   - Used by Docker for container health status

2. **`GET /health/ready`**: Readiness probe checking critical dependencies only
   - Returns ready when service can handle traffic
   - Used by load balancers to route traffic

3. **`GET /health/live`**: Liveness probe checking service isn't deadlocked
   - Minimal check (usually just memory threshold)
   - Used by orchestrators to restart unhealthy containers

**Current Health Status Analysis**:

Based on Docker status, we have **3 unhealthy services**:

1. **vextrus-file-storage** (port 3008): Implements NestJS with MinIO integration for S3-compatible storage. Health check likely failing due to MinIO connection issues or missing health indicator for MinIO client.

2. **vextrus-import-export** (port 3007): Handles CSV/Excel data import/export. Health check is minimal (only memory check) but likely failing on Kafka connection or database initialization.

3. **vextrus-document-generator** (port 3006): Uses Puppeteer for PDF generation, requires additional system dependencies (Chrome/Chromium). Likely failing due to missing browser binaries or insufficient health checks.

All three services have basic health controllers but lack comprehensive dependency checks like Auth/Finance services have. They check memory only, not Kafka, PostgreSQL, or service-specific dependencies (MinIO, Puppeteer).

### Port Allocation Architecture

Services follow a structured port allocation convention:

**Infrastructure Core (3001-3099)**:
- 3001: Auth (JWT/RBAC)
- 3002: Master Data (vendor/customer/product catalogs)
- 3003: Notification (email/SMS)
- 3004: Configuration (system settings)
- 3005: Scheduler (cron jobs)
- 3006: Document Generator (PDF/Excel)
- 3007: Import/Export (bulk data operations)
- 3008: File Storage (MinIO integration)
- 3009: Audit (event logging)

**Business Services (3011-3099)**:
- 3011: Workflow (Temporal integration)
- 3012: Rules Engine (business validation)
- 3013: CRM
- 3014: Finance
- 3015: HR
- 3016: Organization (multi-company)
- 3017: Project Management
- 3018: SCM

**API Layer (4000+)**:
- 4000: API Gateway (GraphQL Federation)

**Infrastructure Services (5000+)**:
- 5432: PostgreSQL
- 6379: Redis
- 9092/9093: Kafka (external/internal)
- 2113/1113: EventStore (HTTP/TCP)
- 9200: Elasticsearch
- 9000/9001: MinIO (API/Console)

All services expose ports to host for development access.

### Why Finance Service is Critical for Frontend Integration

The Finance service represents the most complete implementation of the target architecture:

**Advanced Patterns Implemented**:
1. **Event Sourcing**: Full audit trail via EventStore with replay capabilities
2. **CQRS**: Separate write (commands) and read (queries) models for performance
3. **GraphQL Federation**: Schema ready but not yet federated through gateway
4. **Multi-Tenancy**: Schema-based isolation with middleware enforcement
5. **Domain-Driven Design**: Proper aggregates (ChartOfAccount, Invoice, Payment, Journal)
6. **Bangladesh Compliance**: VAT calculation (15%), TIN/BIN validation, fiscal year (July-June)
7. **OpenTelemetry**: Full instrumentation with traces, metrics, logs

**Finance Service Dependencies**:
- **EventStore DB**: Required for event sourcing (health check validates connection)
- **PostgreSQL**: Read models and tenant schemas
- **Redis**: Caching and session management
- **Kafka**: Event publishing for cross-service coordination
- **Auth Service**: JWT token verification for all protected endpoints

**GraphQL Federation Readiness**:
Finance service implements `ApolloFederationDriver` with auto-generated schema (`src/schema.gql`). The schema includes entity definitions that could be federated, but currently the API Gateway's `SKIP_SERVICES` environment variable excludes Finance from federation. Once Finance is removed from skip list and gateway restarted, finance schema will auto-compose into unified graph.

### Integration Patterns Between Services

**Auth ↔ All Services**:
- Services call Auth REST endpoint `/auth/verify` to validate JWT tokens
- Auth returns user object with role, permissions, organization
- Services use `JwtAuthGuard` to protect GraphQL resolvers and REST endpoints

**Finance → Master Data**:
- Finance queries vendor/customer data via GraphQL federation (when enabled)
- Master Data service owns canonical customer/vendor entities
- Finance extends these entities with financial attributes (credit terms, payment methods)

**Finance → Workflow**:
- Invoice approval flows coordinated via Temporal workflows
- Finance emits `InvoiceCreatedEvent` to Kafka
- Workflow service consumes event and starts approval process
- Approval status updates published back to Finance

**Finance → Notification**:
- Finance publishes payment events to Kafka
- Notification consumes events and sends emails/SMS
- Uses template engine for Bangladesh-specific formats (English + Bengali)

**Finance → Document Generator**:
- Finance requests invoice PDF generation via gRPC/REST
- Passes invoice data and template ID
- Document Generator uses Puppeteer to render PDF
- Returns document URL from MinIO storage

**Finance → Audit**:
- All finance operations emit audit events to Kafka
- Audit service consumes and stores in Elasticsearch
- Provides queryable audit trail for compliance

**Finance → File Storage**:
- Receipt images and documents uploaded to MinIO via File Storage service
- Finance stores MinIO object keys in database
- Frontend retrieves signed URLs for document preview

**Finance → Organization**:
- Multi-company support via organization service
- Finance data scoped to organization context
- Organization service provides company metadata (logo, address, TIN)

**Finance → Rules Engine**:
- Financial validation rules (credit limits, payment terms) centralized in Rules Engine
- Finance queries rules before processing transactions
- Rules versioned and auditable

### Technical Reference Details

#### Service GraphQL Schemas

**Auth Service** (`services/auth/src/resolvers/auth.resolver.ts`):
```graphql
type Mutation {
  login(input: LoginInput!): LoginResponse!
  register(input: RegisterInput!): RegisterResponse!
  refreshToken(input: RefreshTokenInput!): RefreshTokenResponse!
  logout: Boolean!
}

type Query {
  me: User
  user(id: ID!): User
  users(organizationId: String): [User!]!
  userByEmail(email: String!): User
  validateToken(token: String!): Boolean!
}

type User @key(fields: "id") {
  id: ID!
  email: String!
  firstName: String!
  lastName: String!
  fullName: String!  # Computed field
  role: String!
  status: String!
}
```

**Finance Service Federation Schema** (auto-generated):
Implements `ApolloFederationDriver` with schema at `services/finance/src/schema.gql`. Key entities include ChartOfAccount, Invoice, Payment, JournalEntry with federation directives ready.

#### Environment Variables Configuration

**Finance Service Critical Variables**:
```env
# Service
PORT=3014
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USERNAME=vextrus
DATABASE_PASSWORD=vextrus_dev_2024
DATABASE_NAME=vextrus_finance

# EventStore (Event Sourcing)
EVENTSTORE_CONNECTION_STRING=esdb://eventstore:2113?tls=false

# Redis (Caching)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=vextrus_redis_2024

# Kafka (Messaging)
KAFKA_BROKERS=kafka:9093
KAFKA_CLIENT_ID=finance-service
KAFKA_CONSUMER_GROUP=finance-consumer

# Authentication
JWT_SECRET=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9
JWT_EXPIRES_IN=24h

# Bangladesh Compliance
VAT_RATE=15
TAX_WITHHOLDING_RATE=10
FISCAL_YEAR_START=7  # July

# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://signoz-otel-collector:4318
OTEL_SERVICE_NAME=finance-service
OTEL_TRACES_EXPORTER=otlp
OTEL_METRICS_EXPORTER=otlp
OTEL_LOGS_EXPORTER=otlp
```

**API Gateway Federation Configuration**:
```env
# Gateway
PORT=4000
CORS_ORIGIN=http://localhost:3000

# Service URLs
AUTH_SERVICE_URL=http://auth:3001/graphql
MASTER_DATA_SERVICE_URL=http://master-data:3002/graphql
WORKFLOW_SERVICE_URL=http://workflow:3011/graphql
RULES_ENGINE_SERVICE_URL=http://rules-engine:3012/graphql
ORGANIZATION_SERVICE_URL=http://organization:3016/graphql

# Skip services not ready for federation
SKIP_SERVICES=notification,file-storage,audit,configuration,import-export,document-generator,scheduler,finance,hr,crm,scm,project-management

# Redis (Rate Limiting)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=vextrus_redis_2024
```

#### Data Structures and Patterns

**EventStore Stream Naming**:
- Pattern: `{tenantId}-{aggregateType}-{aggregateId}`
- Example: `tenant-123-invoice-uuid-abc` contains all events for invoice abc of tenant 123
- Metadata includes: userId, timestamp, correlationId for tracing

**Kafka Topic Naming**:
- Pattern: `{service}.{entity}.{eventType}`
- Examples:
  - `finance.invoice.created`
  - `finance.payment.processed`
  - `notification.email.sent`
  - `audit.event.logged`

**Multi-Tenancy Schema Pattern**:
- Tenant header: `x-tenant-id: tenant-123`
- Database schema: `tenant_123` (alphanumeric with hyphen, validated by regex)
- All queries automatically scoped: `SET search_path TO tenant_123, public;`
- EventStore stream prefix ensures event isolation

**Health Check Response Format**:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "eventstore": { "status": "up", "message": "EventStore is connected" },
    "redis": { "status": "up" },
    "kafka": { "status": "up" }
  },
  "error": {},
  "details": {
    "database": { "status": "up" },
    "eventstore": { "status": "up" },
    "redis": { "status": "up" },
    "kafka": { "status": "up" }
  }
}
```

#### File Locations for Implementation

**Health Endpoint Implementations**:
- Finance: `services/finance/src/presentation/health/health.controller.ts`
- Auth: `services/auth/src/modules/health/health.controller.ts`
- API Gateway: `services/api-gateway/src/modules/health/health.controller.ts`
- Generic: `services/{service}/src/modules/health/health.controller.ts`

**GraphQL Federation Configuration**:
- Finance: `services/finance/src/infrastructure/graphql/federation.config.ts`
- API Gateway: `services/api-gateway/src/app.module.ts` (lines 22-71)
- Subgraph Registry: `services/api-gateway/src/config/configuration.ts` (lines 13-89)

**Docker Configuration**:
- Compose file: `docker-compose.yml` (all 23 services defined)
- Service Dockerfiles: `infrastructure/docker/services/*.Dockerfile`
- Finance Dockerfile: `services/finance/Dockerfile` (multi-stage with ML dependencies)
- PostgreSQL init: `infrastructure/docker/postgres/init.sql`

**Multi-Tenancy Implementation**:
- Finance Middleware: `services/finance/src/infrastructure/middleware/tenant.middleware.ts`
- Tenant Context Service: `services/finance/src/infrastructure/context/tenant-context.service.ts`

**Authentication Guards**:
- Finance JWT Guard: `services/finance/src/infrastructure/guards/jwt-auth.guard.ts`
- Public Decorator: `services/finance/src/infrastructure/decorators/public.decorator.ts`

**Event Sourcing Infrastructure**:
- EventStore Service: `services/finance/src/infrastructure/persistence/event-store/event-store.service.ts`
- EventStore Module: `services/finance/src/infrastructure/persistence/event-store/event-store.module.ts`
- Event Repository: `services/finance/src/infrastructure/persistence/event-store/event-sourced.repository.ts`

**Kafka Integration**:
- Kafka Module: `services/finance/src/infrastructure/messaging/kafka/kafka.module.ts`
- Event Publisher: `services/finance/src/infrastructure/messaging/kafka/event-publisher.service.ts`
- Kafka Consumer: `services/finance/src/infrastructure/messaging/kafka/kafka-consumer.service.ts`

**OpenTelemetry**:
- Telemetry Module: `services/finance/src/infrastructure/telemetry/telemetry.module.ts`
- Collector Config: `infrastructure/docker/signoz/otel-collector-simple.yaml`

**Domain Aggregates** (Finance Service):
- ChartOfAccount: `services/finance/src/domain/aggregates/chart-of-account/chart-of-account.aggregate.ts`
- Invoice: `services/finance/src/domain/aggregates/invoice/invoice.aggregate.ts`
- Payment: `services/finance/src/domain/aggregates/payment/payment.aggregate.ts`
- Journal Entry: `services/finance/src/domain/aggregates/journal/journal-entry.aggregate.ts`

### Critical Gaps and Risks

**Why 3 Services Are Unhealthy**:

1. **File Storage (port 3008)**: Health check only validates memory, not MinIO connectivity. Missing `MinioHealthIndicator` to ping MinIO at `minio:9000`. Service likely running but health check incomplete.

2. **Import/Export (port 3007)**: Minimal health check (memory only). Likely missing database initialization or Kafka consumer group creation failing. No validation of Excel parsing libraries.

3. **Document Generator (port 3006)**: Requires Puppeteer with Chrome/Chromium headless browser. Docker image may be missing browser binaries or required system dependencies (libx11, fonts). Health check doesn't validate Puppeteer initialization.

**Finance Service Not Federated**:
Despite having complete GraphQL Federation setup, Finance service is in `SKIP_SERVICES` list of API Gateway. This means:
- Finance GraphQL schema is generated and available at `http://finance:3014/graphql`
- API Gateway is unaware of Finance schema
- Frontend cannot query Finance data through unified gateway
- Must remove Finance from skip list and restart gateway to enable federation

**Authentication Service Integration**:
All services implement `JwtAuthGuard` which makes HTTP calls to Auth service for token verification. This creates:
- Single point of failure if Auth service down
- Network latency on every authenticated request (mitigated by Redis caching in Auth)
- No circuit breaker pattern implemented (should use Resilience4j or similar)

**Multi-Tenancy Enforcement**:
Tenant middleware excludes health endpoints (`/health`, `/health/ready`, `/health/live`) from tenant checks. This is correct for monitoring but creates risk:
- Missing tenant validation could allow cross-tenant data access
- No audit trail for tenant switching
- Tenant context lost on async operations (Kafka consumers must re-extract tenant from event metadata)

**Observability Gaps**:
- Finance service has full OpenTelemetry integration
- Most other services lack telemetry configuration
- No standardized logging format across services
- Missing distributed tracing correlation in unhealthy services

**Performance Baselines**:
No established performance baselines yet. Need to measure:
- API Gateway routing overhead (target < 50ms)
- Finance GraphQL query latency (target < 200ms p95)
- EventStore append latency (target < 50ms)
- Kafka message processing latency (target < 100ms)

## Work Log

### 2025-10-06 - Task Created
- Created task following task-creation protocol
- Analyzed current Docker service status
- Identified 3 unhealthy services requiring immediate attention
- Researched industry best practices for microservice pre-frontend validation
- Documented comprehensive success criteria covering health, integration, and documentation
- Ready for systematic execution

### 2025-10-06 - Context Manifest Created
- Analyzed complete Docker Compose configuration with 23 services
- Deep-dived into Finance service architecture (event sourcing, CQRS, GraphQL Federation)
- Mapped authentication flow from Auth service through JwtAuthGuard to services
- Documented GraphQL Federation setup in API Gateway with IntrospectAndCompose
- Analyzed multi-tenancy implementation with schema-based isolation
- Examined EventStore DB integration for event sourcing with full audit trails
- Reviewed Kafka messaging patterns for async service communication
- Identified root causes for 3 unhealthy services (MinIO, Kafka, Puppeteer dependencies)
- Documented port allocation patterns and service communication flows
- Analyzed OpenTelemetry integration with SigNoz for observability
- Created comprehensive context manifest covering architecture, integration patterns, and technical details
- Identified critical gap: Finance service ready for federation but excluded from gateway
- Ready to begin systematic validation phase by phase

### 2025-10-06 - Phase 1-3 Completed, Critical Finance GraphQL Blocker Identified

#### Completed
**Phase 1: Service Health Recovery**
- Fixed file-storage healthcheck path from `/health` to `/api/health` in Dockerfile
- Fixed import-export healthcheck path from `/health` to `/api/health` in universal-service Dockerfile
- Added missing healthcheck to document-generator in docker-compose.yml
- Rebuilt services: file-storage, import-export with corrected health configurations
- All 23 backend services now healthy and running

**Phase 2: Port Allocation Documentation**
- Created comprehensive BACKEND_PORT_ALLOCATION.md registry
- Documented all service ports with categories (Infrastructure, Core Business, Supporting)
- Verified no port conflicts across 23 services
- Mapped exposed ports for frontend consumption

**Phase 3: Finance Service Frontend-Readiness Check**
- Enabled Finance federation in API Gateway (removed from SKIP_SERVICES in docker-compose.yml)
- Tested Finance GraphQL endpoint at http://localhost:3014/graphql
- **CRITICAL BLOCKER IDENTIFIED**: Finance GraphQL schema is empty - no queries/mutations generated
- Finance service running healthy but GraphQL schema not properly generated/exposed
- This blocks frontend integration completely

#### Decisions
- Prioritized service health fixes before broader validation (correct approach)
- Chose to document port allocation comprehensively for future reference
- Identified Finance GraphQL schema generation as critical blocker that must be resolved before continuing

#### Discovered
- Finance service Dockerfile uses multi-stage build but may not be generating GraphQL schema files
- Schema generation likely requires running NestJS schema generation in build process
- Need to investigate Finance service build process and GraphQL module configuration
- Phases 4-6 (Architecture Compliance, Observability, Documentation) depend on Finance GraphQL working

#### Next Steps (For Next Session)
1. **Priority 1**: Fix Finance GraphQL schema generation
   - Investigate why schema.gql is not generated
   - Check Apollo Federation module configuration
   - Verify build process includes schema generation step
2. Continue Phase 4: Microservice Architecture Compliance validation
3. Continue Phase 5: Observability & Performance validation
4. Complete Phase 6: Documentation & Frontend Handoff

---

**Next Steps After Completion**:
1. Run context-gathering agent on this task
2. Switch to task and create feature branch
3. Execute validation systematically phase by phase
4. Document findings in work log
5. Create `BACKEND_SERVICES_CATALOG.md` and `FRONTEND_INTEGRATION_GUIDE.md`
6. Mark task complete and begin Finance frontend development
