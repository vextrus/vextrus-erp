# Task: Fix Remaining Services and Achieve 100% Infrastructure

## Status
- **Created**: 2025-09-21
- **Status**: Not Started
- **Priority**: High
- **Complexity**: Medium (35 points)
- **Branch**: feature/fix-remaining-services

## Context
Following the infrastructure rebuild from h-complete-infrastructure-foundation, we have achieved 70% operational status. Four critical services are failing and need immediate fixes to achieve 100% infrastructure readiness.

## Objectives
1. Fix all failing application services
2. Verify all health endpoints are accessible
3. Ensure GraphQL federation works through API Gateway
4. Complete remaining items from h-complete-infrastructure-foundation
5. Achieve 100% infrastructure operational status

## Specific Issues to Fix

### 1. Auth Service - Missing Dependencies
- **Error**: Cannot find module '@opentelemetry/api'
- **Fix**: Add missing OpenTelemetry dependencies to package.json
- **Files**: services/auth/package.json

### 2. Workflow Service - TypeScript Errors
- **Errors**: 28 TypeScript compilation errors
  - Missing activity functions in employee-onboarding.workflow.ts
  - Property mismatches in invoice-approval.workflow.ts
  - Duplicate exports in workflows/index.ts
- **Fix**: Implement missing functions and fix type mismatches
- **Files**:
  - services/workflow/src/activities/index.ts
  - services/workflow/src/workflows/*.ts

### 3. Configuration Service - Runtime Compilation
- **Error**: Service trying to compile TypeScript at runtime
- **Fix**: Already fixed Dockerfile, need to rebuild and redeploy
- **Files**: Already fixed in node-service-simple.Dockerfile

### 4. API Gateway - Service Discovery
- **Error**: Services restarting, can't connect to subgraphs
- **Fix**: Ensure all services are running before starting API Gateway
- **Files**: services/api-gateway/src/config/configuration.ts

## Remaining from h-complete-infrastructure-foundation

### Original 30% Incomplete Items:
1. ✅ Deploy new business services (partially done - 4 services running)
2. ❌ Fix health endpoint port mappings
3. ❌ Verify all health checks pass
4. ❌ Set up monitoring dashboards in SignOz
5. ❌ Configure API documentation (Swagger/GraphQL playground)
6. ❌ Run validation test suite

## Implementation Steps

### Phase 1: Fix Service Dependencies
1. Add @opentelemetry/api to auth service
2. Add missing activity functions to workflow service
3. Fix TypeScript type mismatches
4. Remove duplicate exports

### Phase 2: Rebuild and Deploy
1. Rebuild all fixed services with --no-cache
2. Deploy services in dependency order:
   - auth → workflow → configuration → api-gateway
3. Verify each service starts successfully

### Phase 3: Health Check Configuration
1. Standardize health endpoints to /api/v1/health
2. Add health checks to services missing them
3. Configure readiness and liveness probes

### Phase 4: Integration Verification
1. Test GraphQL federation through API Gateway
2. Verify service-to-service communication
3. Test authentication flow
4. Run basic CRUD operations

### Phase 5: Monitoring Setup
1. Configure SignOz dashboards
2. Set up service metrics
3. Create alerts for service failures
4. Document access points

## Success Criteria
- [ ] All 8 application services running without restarts
- [ ] All health endpoints return 200 OK
- [ ] GraphQL playground accessible at http://localhost:4000/graphql
- [ ] API documentation available for all services
- [ ] SignOz showing metrics from all services
- [ ] Basic integration tests pass

## Technical Specifications
- Node.js 20 Alpine images
- NestJS framework for all services
- GraphQL Federation v2
- OpenTelemetry for observability
- PostgreSQL with multi-database setup

## Dependencies
- Core infrastructure must be running (PostgreSQL, Redis, Kafka, etc.)
- Docker Desktop must be stable
- Network connectivity for npm packages

## Risks
- Service interdependencies may cause cascading failures
- TypeScript errors may reveal deeper architectural issues
- OpenTelemetry configuration may need adjustment

## Notes
- Use extended timeouts (15 minutes) for builds due to slow internet
- Services are already using correct production start scripts
- Database migrations may be needed after services start

## Context Manifest

### How This Currently Works: Infrastructure Service Management

When Docker Compose deploys the Vextrus ERP infrastructure, it orchestrates a complex ecosystem of 20+ microservices across multiple layers. The current infrastructure operates in a hybrid state where 70% of services are operational while 4 critical services are failing, preventing the system from achieving full operational readiness.

The deployment architecture follows a dependency chain where core infrastructure services (PostgreSQL, Redis, Kafka, Elasticsearch, Temporal, SignOz) must start first, followed by foundation application services (auth, master-data), and finally business logic services (finance, hr, crm, etc.). The current docker-compose.yml configuration defines 30+ services with specific port mappings, environment variables, and inter-service dependencies using Docker's internal network routing.

Each service is built using one of three Dockerfile strategies: auth-optimized-v2.Dockerfile for the auth service with special OpenTelemetry instrumentation, node-service-simple.Dockerfile for most application services, and universal-service.Dockerfile for business module services. The build process uses pnpm workspaces to handle shared dependencies from the shared/* directory, with each service having its own package.json dependency tree.

The auth service is configured with comprehensive OpenTelemetry observability including traces, metrics, and logs exported to SignOz via OTLP endpoints. It uses TypeORM for PostgreSQL connectivity, Redis for session management, and Kafka for event publishing. The service exposes both REST endpoints at /api/v1/auth/* and GraphQL federation endpoints at /graphql with Apollo Federation v2 directives for cross-service entity resolution.

The workflow service implements Temporal-based business process automation with 28 TypeScript files defining activities and workflows. It uses proxyActivities to connect workflow definitions to concrete activity implementations, with complex signal and query handlers for real-time workflow control. The service depends on PostgreSQL for persistence, Temporal for orchestration, and GraphQL federation for external API exposure.

The configuration service provides dynamic feature flags and tenant-specific settings using PostgreSQL for persistence and Redis for caching. It exports configuration data via REST and GraphQL interfaces, with consul and etcd3 integration for distributed configuration management.

The API Gateway orchestrates GraphQL federation across all subgraph services, dynamically discovering and connecting to service endpoints defined in src/config/configuration.ts. It polls subgraph health endpoints every 10 seconds and maintains connection pools using DataLoader for batched requests. The gateway exposes a unified GraphQL playground at port 4000 while routing federated queries to appropriate downstream services.

Health monitoring follows a three-tier pattern: /api/v1/health for comprehensive checks (database, Redis, Kafka, memory), /api/v1/health/ready for readiness probes (external dependencies), and /api/v1/health/live for liveness probes (memory only). Services that pass health checks are registered in Traefik's load balancer with automatic service discovery via Docker labels.

When services fail to start, Docker Compose implements restart policies (unless-stopped) but doesn't rebuild containers automatically. Failed services remain in restart loops, logging errors that indicate dependency issues, missing environment variables, or compilation failures. The current 4 failing services represent critical infrastructure components that prevent GraphQL federation and authentication flows from functioning.

### For Failed Service Resolution: What Needs to Connect

Since we're fixing 4 specific failing services, each requires different resolution strategies that connect to existing working infrastructure. The auth service needs @opentelemetry/api dependency resolution which requires updating package.json and rebuilding the container with --no-cache to ensure npm/pnpm fetches the latest dependencies. The service connects to the working PostgreSQL (port 5432), Redis (port 6379), and Kafka (port 9093) instances that are already operational.

The workflow service's 28 TypeScript compilation errors stem from missing activity function implementations and type mismatches in Temporal workflow definitions. The service references activity functions in workflows/employee-onboarding.workflow.ts and workflows/invoice-approval.workflow.ts that are either missing from activities/index.ts or have incorrect type signatures. These workflow files use proxyActivities to map function calls to actual implementations, requiring exact name and signature matching.

The configuration service's runtime compilation issue occurs because the Dockerfile is trying to compile TypeScript at container startup instead of during the build phase. While the node-service-simple.Dockerfile has been updated to use pnpm start:prod, the service likely has a start:prod script that attempts ts-node compilation. This needs to be rebuilt using the corrected Dockerfile to ensure proper production builds.

The API Gateway's service discovery failures happen because it attempts to connect to subgraph URLs defined in configuration.ts before the dependent services are fully operational. The gateway polls auth:3001/graphql, workflow:3011/graphql, master-data:3002/graphql, and rules-engine:3012/graphql endpoints, but auth and workflow services are currently failing. This creates a cascading failure where federation schema composition fails, preventing the unified GraphQL endpoint from starting.

The dependency resolution order requires fixing auth service first (as it provides authentication for other services), then workflow service (for business process capabilities), followed by configuration service (for feature flags), and finally API Gateway (which federates all services). Each service rebuild must use Docker's --no-cache flag to prevent cached dependency issues and ensure clean builds with 15-minute timeouts for slow network conditions.

Service health validation follows the pattern where each service must expose /api/v1/health endpoints returning 200 status codes. The master-data service at http://localhost:3002/api/v1/health already works as a reference implementation. New services should follow the same pattern using @nestjs/terminus for health checks covering database connectivity, Redis connectivity, and memory usage.

GraphQL federation requires all subgraph services to expose /graphql endpoints with valid federation schemas including @key directives for entity resolution. The auth service provides User entities, workflow service provides Workflow and Task entities, and configuration service provides Configuration entities. The API Gateway composes these schemas into a unified federated graph accessible at http://localhost:4000/graphql with playground interface.

Traefik routing uses Docker labels for automatic service discovery, with rules like traefik.http.routers.auth.rule=Host(`api.localhost`) && PathPrefix(`/api/auth`) mapping external requests to internal services. Services must include proper Traefik labels in docker-compose.yml and expose correct ports for load balancing to function.

### Technical Reference Details

#### Service Port Mappings and Dependencies

Auth Service:
- Port: 3001 (exposed)
- Dependencies: postgres, redis, kafka, signoz-otel-collector
- Health endpoint: http://localhost:3001/api/v1/health
- GraphQL endpoint: http://localhost:3001/graphql
- Missing dependency: @opentelemetry/api in package.json

Workflow Service:
- Port: 3011 (exposed)
- Dependencies: postgres, redis, kafka, temporal, signoz-otel-collector
- Health endpoint: http://localhost:3011/api/v1/health (when working)
- GraphQL endpoint: http://localhost:3011/graphql
- TypeScript errors: 28 compilation errors in activities and workflows

Configuration Service:
- Port: 3004 (not exposed in docker-compose.yml)
- Dependencies: postgres, redis
- Health endpoint: http://localhost:3004/api/v1/health (when working)
- GraphQL endpoint: http://localhost:3004/graphql
- Issue: Runtime compilation instead of production build

API Gateway:
- Port: 4000 (exposed)
- Dependencies: master-data, workflow, rules-engine, auth, signoz-otel-collector
- Playground: http://localhost:4000/graphql
- Issue: Cannot connect to failing subgraph services

#### Environment Variables Configuration

All services require these standard environment variables:
- NODE_ENV: development
- APP_PORT: <service-specific-port>
- DATABASE_HOST: postgres
- DATABASE_PORT: 5432
- DATABASE_USERNAME: vextrus
- DATABASE_PASSWORD: vextrus_dev_2024
- DATABASE_NAME: vextrus_<service-name>
- REDIS_HOST: redis
- REDIS_PORT: 6379
- REDIS_PASSWORD: vextrus_redis_2024
- KAFKA_BROKERS: kafka:9093

OpenTelemetry services (auth, workflow) additionally need:
- OTEL_EXPORTER_OTLP_ENDPOINT: http://signoz-otel-collector:4318
- OTEL_SERVICE_NAME: <service-name>-service
- OTEL_TRACES_EXPORTER: otlp
- OTEL_METRICS_EXPORTER: otlp
- OTEL_LOGS_EXPORTER: otlp

#### Build and Deployment Commands

Service rebuild sequence:
```bash
# 1. Fix dependencies (auth service)
# Add @opentelemetry/api to services/auth/package.json

# 2. Fix TypeScript errors (workflow service)
# Implement missing functions in services/workflow/src/activities/index.ts

# 3. Rebuild with no cache (15 minute timeout)
docker-compose build --no-cache auth workflow configuration api-gateway

# 4. Deploy in dependency order
docker-compose up -d auth
docker-compose up -d workflow
docker-compose up -d configuration
docker-compose up -d api-gateway

# 5. Verify health endpoints
curl http://localhost:3001/api/v1/health  # auth
curl http://localhost:3011/api/v1/health  # workflow
curl http://localhost:3004/api/v1/health  # configuration
curl http://localhost:4000/graphql       # api-gateway playground
```

#### File Locations for Implementation

Auth service dependency fix:
- File: C:\Users\riz\vextrus-erp\services\auth\package.json
- Add: "@opentelemetry/api": "^1.9.0" to dependencies section (already present, may need version update)

Workflow service TypeScript fixes:
- Primary file: C:\Users\riz\vextrus-erp\services\workflow\src\activities\index.ts
- Missing functions: createUserAccount, assignWorkstation, scheduleITSetup, createEmailAccount, enrollInBenefits, scheduleOrientation, assignMentor, createBadgeAccess, notifyManager, notifyHR, sendWelcomeEmail, validateInvoiceData, and other workflow-specific activities
- Workflow files: C:\Users\riz\vextrus-erp\services\workflow\src\workflows\*.workflow.ts
- Export fixes: C:\Users\riz\vextrus-erp\services\workflow\src\workflows\index.ts

Configuration service production build:
- Dockerfile: Already fixed in infrastructure/docker/services/node-service-simple.Dockerfile
- Rebuild required with --no-cache flag

API Gateway service discovery:
- Configuration: C:\Users\riz\vextrus-erp\services\api-gateway\src\config\configuration.ts
- URLs correctly point to internal Docker service names
- Needs dependent services (auth, workflow) to be operational first

Docker Compose configuration:
- File: C:\Users\riz\vextrus-erp\docker-compose.yml
- All services properly configured with correct dependencies and environment variables
- No changes needed to compose file

Infrastructure monitoring:
- SignOz UI: http://localhost:3301 (for observability dashboards)
- Temporal UI: http://localhost:8088 (for workflow monitoring)
- Traefik Dashboard: http://localhost:8080 (for service routing)

## References
- Previous task: sessions/tasks/done/h-complete-infrastructure-foundation.md
- Infrastructure status: INFRASTRUCTURE_STATUS.md
- Docker compose: docker-compose.yml
- Service documentation: services/*/CLAUDE.md