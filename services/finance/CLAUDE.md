# Finance Service CLAUDE.md

## Purpose
Enterprise-grade financial management service for Bangladesh construction and real estate ERP system.

## Narrative Summary
The Finance Service implements a complete financial management system using Domain-Driven Design (DDD) architecture with event sourcing. Built on NestJS with TypeScript strict mode, it provides comprehensive financial operations including accounting, invoicing, payments, and regulatory compliance for Bangladesh market requirements. The service uses EventStore DB for event sourcing, enabling full audit trails and temporal queries essential for financial data integrity.

## Key Files
- `src/main.ts` - Service bootstrap with port 3006, global validation, CORS, and API prefix configuration
- `src/app.module.ts:24-81` - Core module configuration with GraphQL Federation, EventStore, Kafka, and multi-tenancy
- `src/presentation/health/health.controller.ts:1-49` - Health check endpoints (/health, /health/ready, /health/live)
- `src/infrastructure/persistence/event-store/` - EventStore DB integration for event sourcing
- `src/infrastructure/messaging/kafka/` - Kafka integration for event streaming
- `src/infrastructure/guards/jwt-auth.guard.ts` - JWT authentication guard
- `src/infrastructure/middleware/tenant.middleware.ts` - Multi-tenancy middleware with schema isolation
- `src/infrastructure/graphql/federation.config.ts` - Apollo Federation v2 configuration

## Architecture Overview

### Domain-Driven Design Structure
```
src/
├── domain/               # Business logic and rules
│   ├── aggregates/      # Domain aggregates with event sourcing
│   ├── entities/        # Domain entities
│   ├── value-objects/   # Immutable value objects
│   ├── events/          # Domain events
│   ├── commands/        # Command definitions
│   ├── services/        # Domain services
│   └── repositories/    # Repository interfaces
├── application/         # Use cases and application services
├── infrastructure/      # External integrations
│   ├── persistence/     # EventStore DB integration
│   ├── messaging/       # Kafka event streaming
│   ├── graphql/        # Apollo Federation setup
│   ├── guards/         # Authentication guards
│   ├── middleware/     # Tenant isolation
│   └── telemetry/      # OpenTelemetry observability
└── presentation/       # Controllers and GraphQL resolvers
```

## API Endpoints

### REST Endpoints
- `GET /health` - Comprehensive health check with database and EventStore status
- `GET /health/ready` - Readiness probe with service metadata
- `GET /health/live` - Liveness probe for Kubernetes

### GraphQL Federation
- GraphQL endpoint available at `/graphql`
- Integrated with Apollo Federation v2 for microservice composition
- Schema auto-generated and federated with other services

## Integration Points

### Consumes
- **Authentication Service**: JWT token validation via JwtAuthGuard
- **Organization Service**: Tenant context and schema resolution
- **EventStore DB**: Event persistence and sourcing (port 2113)
- **PostgreSQL**: Read model projections and tenant schemas
- **Kafka**: Event streaming and distributed messaging

### Provides
- `/graphql` - Federated GraphQL schema for financial operations
- `/health/*` - Health check endpoints for monitoring
- **Kafka Events**: Financial domain events for other services
- **EventStore**: Complete audit trail of financial transactions

## Configuration

### Required Environment Variables
```env
# Service Configuration
PORT=3006
NODE_ENV=development|production
CORS_ORIGIN=http://localhost:3000,http://localhost:4200

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=vextrus
DATABASE_PASSWORD=vextrus_dev_2024
DATABASE_NAME=vextrus_finance

# EventStore Configuration
EVENTSTORE_CONNECTION_STRING=esdb://localhost:2113?tls=false

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=finance-service

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# OpenTelemetry (simplified due to version conflicts)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

## Technical Decisions

### Event Sourcing Pattern
- All domain aggregates use event sourcing for complete audit trails
- EventStore DB provides native event storage and streaming
- Read models projected to PostgreSQL for query optimization
- Temporal queries supported for financial reporting

### Multi-Tenancy Architecture
- Schema-based tenant isolation in PostgreSQL
- TenantMiddleware extracts tenant context from requests
- TenantContextService manages tenant-specific configurations
- EventStore streams prefixed with tenant identifiers

### GraphQL Federation
- Apollo Federation v2 for distributed schema composition
- Automatic schema generation from TypeScript decorators
- Federated with other microservices in the ecosystem
- Excludes health endpoints from GraphQL routing

### Simplified Observability
- OpenTelemetry integration with version conflict mitigation
- Custom telemetry module with selective instrumentation
- Health checks include EventStore and database connectivity
- Logging and metrics configured for production monitoring

## Key Patterns

### CQRS with Event Sourcing
- Commands handled by domain aggregates
- Events stored in EventStore DB chronologically
- Read models projected for optimal querying
- Eventual consistency between write and read models

### Domain Events
- Financial transactions generate domain events
- Events published to Kafka for cross-service communication
- Event handlers maintain read model projections
- Saga patterns for distributed transactions

### Multi-Tenant Security
- JWT authentication required for all protected endpoints
- Tenant context isolated at middleware level
- Database schemas separated per tenant
- EventStore streams tenant-scoped

## Development Workflow

### Local Development
```bash
# Install dependencies
pnpm install

# Start in development mode
pnpm run start:dev

# Run tests
pnpm run test
pnpm run test:e2e
pnpm run test:cov
```

### Building and Deployment
```bash
# Build for production
pnpm run build

# Start production server
pnpm run start:prod
```

## Testing Strategy

### Unit Tests
- Domain logic tested in isolation
- Mock external dependencies (EventStore, Kafka)
- Command and event handler testing
- Value object validation testing

### Integration Tests
- End-to-end API testing
- EventStore integration testing
- GraphQL schema validation
- Multi-tenant isolation verification

### Health Monitoring
- Database connectivity checks
- EventStore connection validation
- Service readiness and liveness probes
- Performance metrics collection

## Security Implementation

### Authentication
- JWT tokens validated via NestJS guards
- Global authentication guard with exclusions for health endpoints
- Token expiration and refresh handling
- Role-based access control preparation

### Multi-Tenant Isolation
- Schema-level database isolation
- Tenant context validation on every request
- EventStore stream isolation by tenant
- Cross-tenant data access prevention

## Performance Considerations

### Event Sourcing Optimization
- EventStore DB optimized for append-only operations
- Read model projections for complex queries
- Snapshot strategies for large aggregates
- Event stream partitioning by tenant

### Database Performance
- PostgreSQL with proper indexing for read models
- Connection pooling and query optimization
- Tenant schema isolation for data locality
- Async processing for heavy operations

## Bangladesh ERP Compliance

### Financial Regulations
- NBR (National Board of Revenue) compliance ready
- VAT calculation frameworks prepared
- TIN/BIN validation structures in place
- Fiscal year handling (July-June)

### Audit Requirements
- Complete transaction audit trails via event sourcing
- Immutable financial records
- Temporal queries for historical reporting
- Regulatory reporting data structures

## Related Documentation
- `../../docs/INFRASTRUCTURE_STATUS.md` - Overall infrastructure status
- `../../docs/BUSINESS_ARCHITECTURE_FOUNDATION.md` - Business domain modeling
- `../auth/CLAUDE.md` - Authentication service integration
- `../organization/CLAUDE.md` - Multi-tenancy implementation