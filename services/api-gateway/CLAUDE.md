# API Gateway CLAUDE.md

## Purpose
GraphQL API Gateway implementing Apollo Federation v2 with centralized authentication, request routing, and token forwarding to federated subgraphs.

## Narrative Summary
The API Gateway serves as the unified entry point for the Vextrus ERP system, implementing Apollo Federation v2 to compose multiple GraphQL subgraph services into a single cohesive API. Built on NestJS v10 with Apollo Gateway, it provides JWT-based authentication using Passport.js, automatic token forwarding to downstream services, and comprehensive monitoring capabilities. The gateway handles schema composition through introspection and polling of federated subgraphs, implements request/response middleware for distributed tracing, and provides health checks for orchestration. Authentication is enforced at the resolver level using GraphQL guards, allowing fine-grained control over protected operations while maintaining public access to non-sensitive queries.

## Key Files
- `src/main.ts:1-29` - Application bootstrap with Express middleware initialization and CORS configuration
- `src/app.module.ts:1-89` - Root module with GraphQL Federation, authentication, health, metrics, and cache modules
- `src/config/configuration.ts:1-111` - Comprehensive service configuration including JWT, subgraphs, Redis, and rate limiting
- `src/auth/auth.module.ts:1-14` - Authentication module with Passport JWT strategy registration
- `src/auth/jwt.strategy.ts:1-39` - Passport JWT strategy with bearer token extraction and payload validation
- `src/auth/gql-auth.guard.ts:1-31` - GraphQL authentication guard with enhanced error handling
- `src/decorators/current-user.decorator.ts:1-28` - CurrentUser decorator for extracting authenticated user from GraphQL context
- `src/auth/index.ts:1-5` - Authentication module exports for convenient imports
- `src/modules/health/health.controller.ts` - Health check endpoints for readiness and liveness probes
- `src/modules/metrics/metrics.controller.ts` - Prometheus metrics exposition endpoint
- `src/modules/redis/redis.module.ts` - Redis cache configuration for session management
- `src/modules/kafka/kafka.module.ts` - Kafka event streaming integration
- `AUTHENTICATION.md:1-419` - Comprehensive authentication implementation guide with usage examples

## API Endpoints

### GraphQL Federation Gateway
- `POST /graphql` - Unified GraphQL endpoint for all federated operations
- Apollo Sandbox UI at http://localhost:4000/graphql for interactive exploration

### Health & Monitoring
- `GET /health` - Comprehensive health check (gateway, Redis, Kafka, subgraph connectivity)
- `GET /health/ready` - Readiness probe for Kubernetes/Docker orchestration
- `GET /health/live` - Liveness probe for container health monitoring
- `GET /metrics` - Prometheus metrics endpoint for observability

## Integration Points

### Consumes
- **Federated Subgraphs**: Auth, Master Data, Workflow, Rules Engine, Organization, Notification, File Storage, Audit, Configuration, Import/Export, Document Generator, Scheduler, Finance, HR, CRM, SCM, Project Management
- **Redis**: Session management, caching, and rate limiting (host: redis:6379, db: 3)
- **Kafka**: Event streaming for cross-service communication
- **JWT Tokens**: Access tokens from auth service for authentication
- **Environment Config**: Service URLs, secrets, and feature flags

### Provides
- **Unified GraphQL API**: Single endpoint for all federated subgraph operations
- **Authentication Layer**: JWT validation and user context propagation
- **Token Forwarding**: Automatic authorization header propagation to subgraphs via willSendRequest hook
- **Tenant Context**: Multi-tenant header forwarding (X-Tenant-Id) to downstream services
- **Distributed Tracing**: Trace ID propagation (X-Trace-Id) for observability
- **Schema Composition**: Automatic subgraph schema introspection and composition
- **Error Handling**: Centralized error formatting and status code mapping
- **Rate Limiting**: Request throttling to prevent API abuse
- **Health Monitoring**: Service status aggregation for orchestration platforms

## Configuration

### Required Environment Variables

**JWT Authentication**:
- `JWT_ACCESS_SECRET` - JWT signing secret (must match auth service) - default: 'vextrus_jwt_access_secret_dev_2024'
- `JWT_ACCESS_EXPIRES_IN` - Access token TTL - default: '15m'

**Service Configuration**:
- `PORT` - Gateway listening port - default: 4000
- `CORS_ORIGIN` - Allowed CORS origins (comma-separated) - default: 'http://localhost:4000'
- `NODE_ENV` - Environment mode (development/production) for playground and introspection

**Redis Configuration**:
- `REDIS_HOST` - Redis server hostname - default: 'redis'
- `REDIS_PORT` - Redis server port - default: 6379
- `REDIS_PASSWORD` - Redis authentication password - default: 'vextrus_redis_2024'
- `REDIS_DB` - Redis database number - default: 3

**Kafka Configuration**:
- `KAFKA_BROKERS` - Kafka broker addresses (comma-separated)
- `KAFKA_CLIENT_ID` - Client identifier for Kafka
- `KAFKA_GROUP_ID` - Consumer group identifier

**Subgraph Configuration** (all subgraph URLs follow the pattern `{SERVICE}_SERVICE_URL`):
- `AUTH_SERVICE_URL` - default: http://auth:3001/graphql
- `MASTER_DATA_SERVICE_URL` - default: http://master-data:3002/graphql
- `WORKFLOW_SERVICE_URL` - default: http://workflow:3011/graphql
- `RULES_ENGINE_SERVICE_URL` - default: http://rules-engine:3012/graphql
- `ORGANIZATION_SERVICE_URL` - default: http://organization:3016/graphql
- `NOTIFICATION_SERVICE_URL` - default: http://notification:3003/graphql
- `FILE_STORAGE_SERVICE_URL` - default: http://file-storage:3008/graphql
- `AUDIT_SERVICE_URL` - default: http://audit:3009/graphql
- `CONFIGURATION_SERVICE_URL` - default: http://configuration:3004/graphql
- `IMPORT_EXPORT_SERVICE_URL` - default: http://import-export:3007/graphql
- `DOCUMENT_GENERATOR_SERVICE_URL` - default: http://document-generator:3006/graphql
- `SCHEDULER_SERVICE_URL` - default: http://scheduler:3005/graphql
- `FINANCE_SERVICE_URL` - default: http://finance:3014/graphql
- `HR_SERVICE_URL` - default: http://hr:3015/graphql
- `CRM_SERVICE_URL` - default: http://crm:3013/graphql
- `SCM_SERVICE_URL` - default: http://scm:3018/graphql
- `PROJECT_MANAGEMENT_SERVICE_URL` - default: http://project-management:3017/graphql

**Optional Configuration**:
- `SKIP_SERVICES` - Comma-separated list of service names to exclude from federation
- `POLL_INTERVAL` - Subgraph schema polling interval in ms - default: 10000
- `RATE_LIMITING_ENABLED` - Enable/disable rate limiting - default: true
- `RATE_LIMIT_WINDOW_MS` - Rate limit time window - default: 60000 (1 minute)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window - default: 100
- `MONITORING_ENABLED` - Enable/disable monitoring - default: true
- `JAEGER_ENDPOINT` - Jaeger tracing endpoint - default: http://localhost:4000/api/traces

## Key Patterns

### Apollo Federation v2 Architecture
- **IntrospectAndCompose**: Automatic subgraph schema discovery and composition (see app.module.ts:57-62)
- **RemoteGraphQLDataSource**: Custom data source for request/response interception (see app.module.ts:64-80)
- **Schema Polling**: Periodic subgraph introspection for schema updates (pollIntervalInMs: 10000)
- **Subgraph Filtering**: Dynamic service exclusion via SKIP_SERVICES environment variable

### JWT Authentication with Passport.js
- **Strategy Pattern**: Passport JWT strategy for bearer token validation (see jwt.strategy.ts:16-38)
- **Guard Pattern**: GqlAuthGuard for GraphQL resolver protection (see gql-auth.guard.ts:6-30)
- **Decorator Pattern**: @CurrentUser() for user context extraction (see current-user.decorator.ts:21-27)
- **Token Extraction**: ExtractJwt.fromAuthHeaderAsBearerToken() from Authorization header
- **Payload Validation**: Validates required fields (sub/user ID) and attaches user context to request

### Token Forwarding & Context Propagation
Implemented in app.module.ts:36-45 (context creation) and 67-78 (request forwarding):
- **Authorization Header**: JWT token forwarded as Bearer token to all subgraphs
- **Tenant Context**: X-Tenant-Id header for multi-tenant data isolation
- **Distributed Tracing**: X-Trace-Id header for request correlation across services
- **willSendRequest Hook**: Middleware intercepts requests before sending to subgraphs

### Error Handling & Security
- **Enhanced Error Messages**: Specific error types for expired/invalid/missing tokens (see gql-auth.guard.ts:18-28)
- **CSRF Prevention**: Disabled for Apollo Sandbox in development (csrfPrevention: false)
- **CORS Configuration**: Dynamic origin handling with credentials support
- **GraphQL Errors**: Proper HTTP 401 responses via UnauthorizedException

### Resolver-Level Authorization
Protected resolvers pattern (see AUTHENTICATION.md:52-101):
- Pattern: @UseGuards(GqlAuthGuard) on individual Query/Mutation resolvers
- Benefit: Fine-grained control over authentication requirements
- Usage: Apply guard to sensitive operations, leave public queries unprotected
- Access: User context available via @CurrentUser() decorator in resolver parameters

### Health Check Architecture
- **Comprehensive Health**: Database, Redis, Kafka, memory, and subgraph connectivity checks
- **Readiness Probe**: Determines if service can accept traffic (external dependencies)
- **Liveness Probe**: Determines if service is running (internal health only)
- **Kubernetes Integration**: Standard probe endpoints for orchestration

### Configuration Class Pattern
- **Centralized Config**: Single configuration.ts file with type-safe defaults (see configuration.ts)
- **Environment Overrides**: All settings overridable via environment variables
- **Service Discovery**: Dynamic subgraph list construction with filtering
- **Nested Configuration**: Grouped settings (jwt, cors, services, redis, rateLimiting, monitoring)

### NestJS Module Organization
- **Feature Modules**: AuthModule, HealthModule, MetricsModule, RedisModule, KafkaModule
- **Global Configuration**: ConfigModule.forRoot with isGlobal: true
- **Async GraphQL Setup**: GraphQLModule.forRootAsync for dynamic configuration
- **Dependency Injection**: ConfigService injected into GraphQL factory function

## Authentication Implementation

### JWT Payload Structure
- sub: string - User ID (required, primary identifier)
- email: string - User email address (optional)
- username: string - Username for display (optional)
- organizationId: string - Tenant/organization ID (optional)
- iat: number - Issued at timestamp (optional)
- exp: number - Expiration timestamp (optional)

### CurrentUserContext Interface
- id: string - User ID from JWT sub claim
- email: string - User email (optional)
- username: string - Username (optional)
- organizationId: string - Organization/tenant ID (optional)

### Protecting GraphQL Resolvers
Reference complete patterns and examples in AUTHENTICATION.md:52-101

### Token Validation Flow
1. Client sends request with Authorization: Bearer token header
2. GqlAuthGuard extracts token from GraphQL context
3. JwtStrategy validates token signature using JWT_ACCESS_SECRET
4. JwtStrategy.validate() checks payload structure and extracts user data
5. User context attached to request object
6. @CurrentUser() decorator makes user available in resolver
7. Token automatically forwarded to federated subgraphs via willSendRequest

### Authentication Errors
- **Missing Token**: "Authentication required" (401)
- **Expired Token**: "Token has expired" (401)
- **Invalid Token**: "Invalid token" (401)
- **Malformed Payload**: "Invalid token payload" (401)

## Technology Stack
- **NestJS**: v10.0.0 - Framework for building scalable server-side applications
- **Apollo Gateway**: v2.5.0 - GraphQL federation gateway implementation
- **Apollo Server**: v4.9.0 - GraphQL server with Apollo Sandbox UI
- **GraphQL**: v16.7.0 - Query language and schema definition
- **Passport.js**: v0.7.0 - Authentication middleware framework
- **Passport JWT**: v4.0.1 - JWT authentication strategy for Passport
- **Express**: v4.18.2 - HTTP server and middleware platform
- **IORedis**: v5.4.2 - Redis client for caching and sessions
- **KafkaJS**: v2.2.4 - Apache Kafka client for event streaming
- **Prometheus Client**: v15.1.3 - Metrics collection and exposition
- **Class Validator**: v0.14.0 - Decorator-based validation
- **Class Transformer**: v0.5.1 - Object transformation utilities

## Related Documentation
- `AUTHENTICATION.md` - Complete authentication implementation guide with examples
- `../../shared/kernel/CLAUDE.md` - Shared domain primitives and utilities
- `../../shared/contracts/CLAUDE.md` - Data transfer objects and interfaces
- `../auth/CLAUDE.md` - Auth service implementation and JWT token generation
- `../master-data/CLAUDE.md` - Example federated subgraph implementation
- `../../docs/adr/` - Architecture decision records for gateway patterns
- `test-integration/auth-token-forwarding.test.ts` - Integration tests for authentication flow

## Development Notes

### Local Development
- Start gateway with hot reload: `pnpm start:dev`
- Access Apollo Sandbox UI: http://localhost:4000/graphql
- Test health endpoints: `curl http://localhost:4000/health`

### Testing Authentication
See AUTHENTICATION.md:105-156 for comprehensive client-side usage examples

### Troubleshooting

**Issue**: "Invalid token" with valid JWT
- **Cause**: JWT_ACCESS_SECRET mismatch between auth service and gateway
- **Solution**: Verify identical JWT_ACCESS_SECRET in both docker-compose.yml entries

**Issue**: Subgraph not appearing in composed schema
- **Cause**: Subgraph service unavailable during introspection
- **Solution**: Check subgraph health endpoint and ensure service is running

**Issue**: CORS errors when adding Authorization header
- **Cause**: CORS not configured to allow Authorization header
- **Solution**: Verify CORS_ORIGIN includes your frontend domain and credentials: true is set

**Issue**: Token not forwarded to subgraphs
- **Cause**: Context extraction or willSendRequest not working
- **Solution**: Check app.module.ts:36-45 (context) and 67-78 (forwarding) implementation

## Security Considerations

### Production Deployment
- Always use HTTPS in production environments
- Store JWT_ACCESS_SECRET securely (secrets management system)
- Set short token expiration times (15 minutes default)
- Implement refresh token rotation
- Enable rate limiting to prevent abuse
- Monitor for unusual authentication patterns
- Regularly rotate JWT secrets
- Use environment-specific CORS origins

### Multi-Tenant Security
- Tenant isolation enforced via X-Tenant-Id header
- Validate tenant access in subgraph resolvers
- Audit trail for cross-tenant data access attempts
- JWT payload should include organizationId for tenant context

### Rate Limiting
- Default: 100 requests per minute per client
- Configurable via RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX_REQUESTS
- Applied at gateway level before reaching subgraphs
- Prevents DoS attacks and API abuse

---

**Last Updated**: October 13, 2025
**Service Version**: 1.0.0
**Apollo Federation**: v2
**NestJS Version**: 10.0.0
