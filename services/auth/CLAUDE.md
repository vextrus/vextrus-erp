# Auth Service CLAUDE.md

## Purpose
Provides authentication and authorization services with JWT tokens, refresh tokens, user management, comprehensive health monitoring, and OpenTelemetry observability.

## Narrative Summary
The Auth Service implements a comprehensive authentication system using NestJS with CQRS pattern and Event Sourcing. It handles user registration, login, token refresh, and user management with security features like account locking after failed attempts. The service uses Domain-Driven Design patterns with aggregates, value objects, and domain events. Health monitoring includes database, Redis, Kafka, and memory checks with separate endpoints for readiness and liveness probes. The service features full OpenTelemetry instrumentation with distributed tracing, metrics collection, and context propagation for comprehensive observability across the system.

## Key Files
- `src/main.ts` - Application bootstrap with Swagger, validation, and CORS
- `src/app.module.ts:10-25` - Root module configuration with database, CQRS, health, and telemetry modules
- `src/modules/auth/auth.module.ts:59-67` - GraphQL federation configuration with Apollo Federation Driver
- `src/domain/aggregates/user.aggregate.ts:30-276` - User aggregate with authentication logic and event sourcing
- `src/modules/auth/auth.controller.ts` - Authentication REST endpoints
- `src/modules/auth/auth.service.ts` - Authentication business logic with JWT handling
- `src/resolvers/auth.resolver.ts:11-102` - GraphQL resolver for authentication operations (login, register, refresh, logout)
- `src/resolvers/user.resolver.ts:7-40` - GraphQL resolver for user queries with federation support
- `src/modules/users/entities/user.entity.ts:11-157` - User entity with GraphQL federation directives and field mappings
- `src/dto/login.dto.ts:5-31` - GraphQL login input/response DTOs with validation
- `src/dto/register.dto.ts` - GraphQL registration input/response DTOs
- `src/dto/refresh-token.dto.ts` - GraphQL refresh token input/response DTOs
- `src/dto/user.response.ts:1-37` - GraphQL UserResponse DTO with field mappings
- `src/guards/gql-auth.guard.ts` - GraphQL authentication guard
- `src/decorators/current-user.decorator.ts` - GraphQL current user context decorator
- `src/modules/health/health.controller.ts:16-44` - Health check endpoints with readiness/liveness probes
- `src/config/configuration.ts` - Service configuration for database, Redis, and Kafka
- `src/database/database.module.ts` - TypeORM database configuration
- `src/telemetry/telemetry.module.ts:8-22` - OpenTelemetry telemetry module configuration
- `src/telemetry/tracing.service.ts:6-83` - Distributed tracing service with span management
- `src/telemetry/metrics.service.ts:29-207` - Business metrics collection and reporting
- `src/telemetry/context-propagation.interceptor.ts:8-103` - HTTP context propagation interceptor

## API Endpoints

### REST Endpoints
- `POST /api/v1/auth/register` - User registration with organization and role assignment
- `POST /api/v1/auth/login` - User authentication with JWT and refresh tokens
- `POST /api/v1/auth/refresh` - Refresh access token using refresh token
- `GET /api/v1/health` - Comprehensive health check (database, memory, Redis, Kafka)
- `GET /api/v1/health/ready` - Readiness probe (database, Redis, Kafka)
- `GET /api/v1/health/live` - Liveness probe (memory check only)

### GraphQL Operations

#### Authentication Mutations
- `Mutation.login(input: LoginInput): LoginResponse` - User authentication with JWT tokens
- `Mutation.register(input: RegisterInput): RegisterResponse` - User registration with organization assignment
- `Mutation.refreshToken(input: RefreshTokenInput): RefreshTokenResponse` - Access token refresh using refresh token
- `Mutation.logout: Boolean` - User logout (requires authentication guard)

#### User Queries
- `Query.me: User` - Current authenticated user profile
- `Query.user(id: ID): User` - Get user by ID (requires authentication)
- `Query.users(organizationId: String): [User]` - List users by organization (requires authentication)
- `Query.userByEmail(email: String): User` - Find user by email (requires authentication)
- `Query.validateToken(token: String): Boolean` - JWT token validation

#### Federation Support
- `User.__resolveReference(reference: {__typename: String, id: String}): User` - Entity resolution for federation
- `User.fullName: String` - Computed field resolver for full name
- `@Directive('@key(fields: "id")')` on User entity for federation key

## Integration Points
### Consumes
- PostgreSQL: User data persistence and event store
- Redis: Session management and caching
- Kafka: Domain event publishing for user events
- OTLP Endpoint: OpenTelemetry traces and metrics export (default: localhost:4317)
- @vextrus/shared-kernel: Domain primitives (AggregateRoot, Entity, ValueObject)
- @vextrus/shared-contracts: Authentication interfaces and DTOs
- @vextrus/utils: Observability utilities and decorators for tracing

### Provides
- JWT Authentication: Access and refresh token generation (REST and GraphQL)
- User Management: Registration, profile updates, account locking
- GraphQL Federation Schema: User entity with federation key directives and resolvers
- Authentication Guards: GqlAuthGuard for GraphQL endpoint protection
- User Context: CurrentUser decorator for GraphQL resolvers
- Entity Resolution: Federation support for cross-service user references
- Health Monitoring: Service status for orchestration platforms
- Domain Events: UserRegistered, UserLoggedIn, RefreshTokenIssued events
- Observability Data: Distributed traces, business metrics, and telemetry via OTLP
- Trace Propagation: W3C Trace Context headers in HTTP responses

## Configuration
Required environment variables:
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME` - PostgreSQL connection
- `REDIS_HOST`, `REDIS_PORT` - Redis connection for sessions
- `KAFKA_BROKERS`, `KAFKA_GROUP_ID` - Kafka configuration for events
- `JWT_SECRET`, `JWT_EXPIRES_IN` - JWT token configuration
- `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRES_IN` - Refresh token settings
- `PORT` - Service port (default: 3000)
- `CORS_ORIGIN` - CORS configuration

OpenTelemetry configuration:
- `OTEL_SERVICE_NAME` - Service name for telemetry (default: auth-service)
- `OTEL_EXPORTER_OTLP_ENDPOINT` - OTLP endpoint URL (default: http://localhost:4317)
- `OTEL_EXPORTER_OTLP_HEADERS` - OTLP headers as JSON string
- `SERVICE_VERSION` - Service version for resource attributes
- `NODE_ENV` - Environment identifier for telemetry
- `OTEL_METRIC_EXPORT_INTERVAL` - Metrics export interval in ms (default: 10000)
- `OTEL_CONSOLE_EXPORTER` - Enable console exporter for debugging (default: false)

## Key Patterns
- CQRS with Command/Query separation using @nestjs/cqrs
- Event Sourcing with domain events in user aggregate (see user.aggregate.ts:84-95)
- Domain-Driven Design with aggregates and value objects
- Repository pattern for data persistence
- JWT with refresh token rotation for security
- Account locking after 5 failed login attempts (see user.aggregate.ts:197-204)
- Health check pattern with readiness/liveness separation

GraphQL federation patterns:
- Apollo Federation v2 with @key directives for entity identification (see user.entity.ts:12)
- Reference resolution for cross-service entity lookups (see user.resolver.ts:37-39)
- Authentication guard integration for GraphQL endpoints (see gql-auth.guard.ts)
- Context propagation using CurrentUser decorator for resolvers
- Dual interface support with shared DTOs for REST and GraphQL endpoints
- Federation schema generation with autoSchemaFile configuration

OpenTelemetry observability patterns:
- Distributed tracing with W3C Trace Context propagation (see context-propagation.interceptor.ts:17-46)
- Business metrics collection for authentication events (see metrics.service.ts:114-125)
- Span context enrichment with user and request attributes
- Automatic HTTP instrumentation with custom attributes
- Metrics aggregation by time windows and labels (see metrics.service.ts:77-101)
- Error tracking with exception recording in spans

## Related Documentation
- ../../shared/kernel/CLAUDE.md - Domain primitives usage
- ../../shared/contracts/CLAUDE.md - Authentication contracts
- ../../shared/utils/CLAUDE.md - Observability utilities and decorators
- ../service-template/CLAUDE.md - Service generation template
- ../../docs/adr/ - Architecture decision records for authentication patterns