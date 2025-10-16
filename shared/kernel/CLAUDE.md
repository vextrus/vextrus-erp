# Shared Kernel CLAUDE.md

## Purpose
Provides foundational Domain-Driven Design primitives and patterns for building consistent domain models across all Vextrus ERP services.

## Architecture Overview
The Shared Kernel implements core DDD building blocks that ensure consistency and enforce domain modeling patterns across microservices. It provides base classes for Aggregates, Entities, and Value Objects, along with event sourcing infrastructure and repository interfaces. This kernel serves as the foundation for domain modeling in all services, promoting consistency and reducing code duplication.

## Module Structure
- `domain/` - Core DDD building blocks and interfaces
  - `aggregate-root.base.ts` - Event sourcing aggregate base class
  - `entity.base.ts` - Entity base with identity and timestamps
  - `value-object.base.ts` - Immutable value object base with UUID implementation
  - `domain-event.interface.ts` - Event contracts for event sourcing
  - `repository.interface.ts` - Repository pattern interface
  - `specification.base.ts` - Specification pattern for business rules
  - `index.ts` - Module exports

## Key Components
### AggregateRoot (aggregate-root.base.ts)
- `AggregateRoot:4-37` - Base class extending NestJS CQRS AggregateRoot
- Manages domain events and aggregate versioning
- Provides event sourcing capabilities with history loading
- Used by services like UserAggregate in auth service

### Entity (entity.base.ts)
- `Entity<TId>:1-37` - Generic entity base class with typed identity
- Automatic timestamp management (createdAt, updatedAt)
- Identity-based equality comparison
- Thread-safe timestamp updates

### ValueObject (value-object.base.ts)
- `ValueObject<T>:1-17` - Immutable value object base with structural equality
- `UUID:19-39` - Concrete UUID value object with validation
- Enforces immutability through Object.freeze
- JSON-based equality comparison

### Domain Events (domain-event.interface.ts)
- `IDomainEvent:1-7` - Standard event interface with metadata support
- `IEventHandler<T>:9-11` - Generic event handler interface
- Supports event versioning and aggregate correlation

## Dependencies
- External: @nestjs/cqrs for aggregate root integration
- Internal: None (serves as foundation for other modules)

## Usage Patterns
Services import and extend these base classes:
- Aggregates extend AggregateRoot for event sourcing
- Domain entities extend Entity for identity management
- Value objects extend ValueObject for immutable data
- Events implement IDomainEvent for consistent messaging

## Integration Points
### Used By
- services/auth: UserAggregate, UserId, Email, HashedPassword value objects
- services/service-template: Generated aggregates reference @shared/kernel
- All generated services: Standard domain modeling patterns

### Provides
- Domain modeling foundation for microservices
- Event sourcing infrastructure
- Repository and specification patterns
- Consistent identity and equality semantics

## Testing
- Test directory: Located in consuming services
- Unit tests verify base class behavior and equality semantics
- Integration tests ensure event sourcing workflows

## Patterns & Conventions
- Follows Domain-Driven Design tactical patterns
- Immutability for value objects with deep freezing
- Event sourcing with aggregate versioning
- Generic typing for type safety and reusability
- NestJS CQRS integration for command/event handling

## Related Documentation
- ../../services/auth/CLAUDE.md - Example usage in authentication domain
- ../../services/service-template/CLAUDE.md - Template integration
- ../../docs/adr/ - Architectural decisions for DDD patterns
- ../contracts/CLAUDE.md - Service integration contracts