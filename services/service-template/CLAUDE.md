# Service Template Generator CLAUDE.md

## Purpose
Generates standardized NestJS service templates with complete project structure, configuration, and DDD patterns for rapid service creation.

## Narrative Summary
The Service Template Generator is a Node.js script that creates fully-configured NestJS microservices following the Vextrus ERP architectural patterns. It generates a complete service structure with CQRS, Event Sourcing, TypeORM integration, health monitoring, testing setup, and Docker configuration. The generator ensures consistency across all services by providing standardized directory structure, dependency configuration, and boilerplate code following Domain-Driven Design principles.

## Key Files
- `generate-service.js:1-378` - Main generator script with complete service scaffolding
- Template outputs:
  - `package.json` - Dependencies and scripts for NestJS, CQRS, TypeORM, Kafka
  - `src/main.ts` - Bootstrap with Swagger, validation, CORS setup
  - `src/app.module.ts` - Module configuration with CQRS and database
  - `src/config/configuration.ts` - Environment-based configuration
  - `src/database/database.module.ts` - TypeORM integration
  - `src/domain/aggregates/[service].aggregate.ts` - Sample aggregate using shared kernel

## Usage
```bash
node services/service-template/generate-service.js <service-name>
```

## Generated Structure
Creates complete service with:
- `src/domain/` - Aggregates, entities, value objects, events, specifications
- `src/application/` - Commands, queries, event handlers (CQRS pattern)
- `src/infrastructure/` - Repositories, event store, external integrations
- `src/modules/` - NestJS modules for features
- `src/config/` - Configuration management
- `src/database/` - TypeORM setup and migrations
- `test/` - Unit, integration, and e2e test structure

## Integration Points
### Provides
- Standardized service template following Vextrus patterns
- Pre-configured NestJS setup with CQRS and TypeORM
- Health monitoring integration
- Swagger documentation setup
- Jest testing configuration
- Docker and Git ignore configurations

### Dependencies Generated
- **NestJS Stack**: @nestjs/common, @nestjs/core, @nestjs/cqrs, @nestjs/platform-express
- **Database**: @nestjs/typeorm, typeorm, pg
- **Messaging**: kafkajs, @nestjs/microservices
- **Caching**: ioredis
- **Validation**: class-transformer, class-validator
- **Documentation**: @nestjs/swagger
- **Testing**: jest, @nestjs/testing

## Configuration Template
Generates configuration for:
- Database connection (PostgreSQL)
- Redis caching
- Kafka messaging
- CORS settings
- Port configuration
- Environment-specific settings

## Key Patterns
- Uses @shared/kernel domain primitives for aggregates (see line 286)
- Follows CQRS pattern with command/query separation
- Implements Event Sourcing ready structure
- Health check endpoints for Kubernetes/Docker
- Jest testing with SWC for fast compilation
- TypeScript strict configuration with path mapping
- Swagger API documentation auto-generation

## Testing Setup
- Jest with SWC compiler for performance
- Coverage thresholds: 80% minimum for branches, functions, lines, statements
- Unit, integration, and e2e test directories
- Debugging configuration included

## Related Documentation
- ../auth/CLAUDE.md - Example of generated service implementation
- ../../shared/kernel/CLAUDE.md - Domain primitives used in templates
- ../../shared/contracts/CLAUDE.md - Service contracts for integration
- ../../docs/DEVELOPMENT_WORKFLOW.md - Development practices for generated services