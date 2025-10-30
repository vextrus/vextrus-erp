# Organization Service CLAUDE.md

## Purpose
Provides organization hierarchy management and multi-tenant capabilities for the ERP system with health monitoring, metrics collection, and Kafka event publishing.

## Narrative Summary
The Organization Service manages organizational hierarchies, divisions, and tenant isolation using NestJS with TypeORM. It provides comprehensive CRUD operations for organization structures and ensures proper tenant-based data segregation. The service integrates health checking capabilities via @nestjs/terminus for service monitoring, metrics collection using prom-client for observability, and Kafka integration via kafkajs for event-driven communication. Database operations utilize PostgreSQL with proper connection management and entity relationships.

## Key Files
- `src/app.module.ts:12-37` - Main application module with TypeORM configuration and module imports
- `src/main.ts` - Bootstrap configuration with global pipes and server setup
- `src/controllers/organization.controller.ts` - REST endpoints for organization CRUD operations
- `src/entities/organization.entity.ts` - Organization entity with hierarchical relationships
- `src/entities/division.entity.ts` - Division entity for organizational subdivisions
- `src/entities/tenant.entity.ts` - Tenant entity for multi-tenancy support
- `src/modules/health/health.module.ts` - Health check module configuration
- `src/modules/health/health.controller.ts` - Health endpoint implementations
- `src/modules/health/health.service.ts` - Health check service logic
- `src/modules/metrics/metrics.module.ts` - Metrics collection module
- `src/modules/metrics/metrics.controller.ts` - Metrics endpoint for Prometheus
- `src/modules/metrics/metrics.service.ts` - Metrics collection and reporting logic
- `src/modules/kafka/kafka.module.ts` - Kafka event publishing module
- `src/modules/kafka/kafka.service.ts` - Kafka producer and consumer services
- `src/database/data-source.ts` - TypeORM data source configuration
- `src/migrations/20250925120000-OrganizationServiceInitial.ts` - Initial database migration

## API Endpoints

### REST Endpoints
- `GET /api/organizations` - List organizations with pagination
- `POST /api/organizations` - Create new organization
- `GET /api/organizations/:id` - Get organization by ID
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization
- `GET /api/organizations/:id/divisions` - Get divisions for organization
- `POST /api/organizations/:id/divisions` - Create division under organization

### Health Endpoints
- `GET /api/health` - Overall service health status
- `GET /api/health/ready` - Readiness probe for Kubernetes (checks dependencies)
- `GET /api/health/live` - Liveness probe for Kubernetes (simple process check)
- `GET /api/health/stats` - Service statistics and metrics
- `GET /api/health/dependencies` - Dependency health status details

### Monitoring Endpoints
- `GET /metrics` - Prometheus metrics endpoint for scraping

## Integration Points
### Consumes
- PostgreSQL: Organization data persistence with hierarchical relationships
- Environment Config: Database connection and service configuration
- Kafka Brokers: Event publishing and consumption for organization changes

### Provides
- Organization Management: CRUD operations for organizational structures
- Tenant Isolation: Multi-tenant data segregation and context management
- Health Monitoring: Service health status for orchestration platforms
- Metrics Collection: Performance and usage metrics for observability
- Event Publishing: Organization lifecycle events via Kafka for downstream services
- Division Management: Organizational subdivision handling and hierarchical queries

## Configuration
Required environment variables:
- `DATABASE_HOST`, `DATABASE_PORT` - PostgreSQL connection details
- `DATABASE_USERNAME` - Database user (default: 'vextrus')
- `DATABASE_PASSWORD` - Database password (default: 'postgres')
- `DATABASE_NAME` - Database name (default: 'vextrus_organization')
- `NODE_ENV` - Environment mode for synchronization and logging
- `KAFKA_BROKERS` - Kafka broker connection string
- `KAFKA_CLIENT_ID` - Kafka client identifier
- `PORT` - Service port (default varies)

Optional configuration:
- `CORS_ORIGIN` - CORS allowed origins
- `HEALTH_CHECK_TIMEOUT` - Health check timeout in milliseconds
- `METRICS_INTERVAL` - Metrics collection interval

## Key Patterns
- Multi-tenant architecture with tenant-scoped queries and data isolation
- Health check patterns using @nestjs/terminus for Kubernetes integration
  - **Liveness probe** (`/api/health/live`): Simple process check without resource validation
  - **Readiness probe** (`/api/health/ready`): Validates all dependencies before accepting traffic
  - **Docker healthcheck**: Uses `/api/health/liveness` for container orchestration
- Metrics collection with prom-client for Prometheus monitoring
- Event-driven architecture using Kafka for organization lifecycle events
- TypeORM entity relationships for hierarchical organization structures
- Database migration management for schema evolution
- Configuration management using @nestjs/config for environment-based setup

## Related Documentation
- ../../shared/kernel/CLAUDE.md - Domain primitives and organization abstractions
- ../../shared/contracts/CLAUDE.md - Organization service contracts and interfaces
- ../../docs/adr/ - Architecture decisions for multi-tenancy patterns