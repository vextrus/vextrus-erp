# @vextrus/distributed-transactions CLAUDE.md

## Purpose
Shared library providing distributed transaction infrastructure with event sourcing, saga orchestration, outbox pattern, and idempotency middleware for the Vextrus ERP ecosystem.

## Narrative Summary
This package implements comprehensive distributed transaction patterns essential for microservices architecture. It provides event sourcing capabilities with PostgreSQL backend, saga orchestration for complex workflows, reliable event publishing through the outbox pattern, and idempotency guarantees to prevent duplicate operations. The library leverages Emmett for core event store functionality while adding enterprise-grade features like circuit breakers, observability, and comprehensive retry policies.

## Key Components

### Event Sourcing (src/event-sourcing/)
- `types.ts:1-148` - Core type definitions for events, commands, aggregates, and sagas
- `aggregate.base.ts:1-241` - Base aggregate root with event application and state management
- `event-store.service.ts:1-406` - PostgreSQL event store with snapshots and outbox integration

### Saga Orchestration (src/saga/)
- `saga-state-machine.ts:1-353` - State machine orchestrator with compensation logic
- `saga-repository.ts` - Saga persistence and recovery

### Reliability Patterns (src/patterns/)
- `outbox.service.ts:1-400` - Reliable event publishing with retry and dead letter handling
- `idempotency.middleware.ts:1-313` - Request deduplication with configurable TTL

### Value Objects (src/value-objects/)
- `money.ts:1-48` - Simple money implementation with currency validation

### Examples (src/examples/order-to-cash/)
- `order.aggregate.ts:1-393` - Complete order-to-cash workflow implementation
- `order-fulfillment.saga.ts` - Multi-step saga for order processing

## Database Schema
### Tables (src/database/migrations/001_create_event_store.sql)
- `event_store:1-19` - Event storage with optimistic concurrency control
- `saga_state:22-39` - Saga orchestration state management
- `outbox_events:41-59` - Reliable event publishing queue
- `idempotency_keys:62-72` - Request deduplication storage
- `event_snapshots:75-83` - Performance optimization for event replay

## Dependencies
### External Packages
- `@event-driven-io/emmett` - Core event sourcing framework
- `@event-driven-io/emmett-postgresql` - PostgreSQL event store implementation
- `pg` - PostgreSQL client for direct database operations
- `uuid` - Unique identifier generation
- `decimal.js` - Precise decimal arithmetic

### Internal Dependencies
- `@vextrus/kernel` - Base entity and domain primitives
- `@vextrus/utils` - Observability decorators (Trace, Metric, WithCircuitBreaker)
- `@vextrus/contracts` - Shared interface definitions

## Integration Points

### Consumes
- PostgreSQL database for persistence
- OpenTelemetry for observability (peer dependency)
- Message brokers (Kafka/Redis) through publisher implementations

### Provides
- Event sourcing infrastructure for aggregates
- Saga orchestration for complex workflows
- Reliable event publishing capabilities
- Idempotency middleware for HTTP APIs
- Complete order-to-cash workflow example

## Configuration

### EventStoreService Options
- `connectionString` - PostgreSQL connection string
- `poolSize` - Database connection pool size (default: 10)
- `snapshotFrequency` - Events between snapshots (default: 100)
- `enableSnapshots` - Enable/disable snapshotting (default: true)
- `enableOutbox` - Enable/disable outbox pattern (default: true)

### OutboxService Options
- `batchSize` - Events processed per batch (default: 100)
- `processingIntervalMs` - Processing interval (default: 5000)
- `maxRetries` - Maximum retry attempts (default: 3)
- `deadLetterAfterRetries` - Dead letter threshold (default: 5)

### IdempotencyService Options
- `keyHeader` - HTTP header for idempotency key (default: 'x-idempotency-key')
- `ttlHours` - Key expiration time (default: 24)
- `includeBody` - Hash request body (default: true)
- `includeHeaders` - Additional headers to hash

## Usage Patterns

### Event Sourcing
- Extend `AggregateRoot` for domain aggregates
- Implement `when()` method for state transitions
- Implement `handle()` method for command processing
- Use `raiseEvent()` to emit domain events

### Saga Orchestration
- Use `SagaBuilder` for fluent saga definition
- Define state machine with invoke/compensate actions
- Handle events to trigger state transitions
- Implement compensation logic for rollbacks

### Outbox Pattern
- Register message publishers for event types
- Add events to outbox within transactions
- Process outbox events asynchronously
- Handle retry and dead letter scenarios

### Idempotency
- Use middleware for HTTP endpoints
- Use `@Idempotent` decorator for methods
- Provide idempotency keys in requests
- Configure TTL and hashing behavior

## Key Patterns
- Event Sourcing with aggregate root pattern
- Saga pattern for distributed transactions
- Outbox pattern for reliable messaging
- Command Query Responsibility Segregation (CQRS)
- Optimistic concurrency control
- Circuit breaker pattern for resilience
- Exponential backoff for retries

## Testing
- Test location: No tests directory found yet
- Uses Vitest for testing framework
- Supports testcontainers for integration tests
- Coverage reporting with @vitest/coverage-v8

## Build Commands
- `pnpm build` - Compile TypeScript to dist/
- `pnpm test` - Run test suite
- `pnpm test:watch` - Watch mode testing
- `pnpm test:coverage` - Generate coverage report
- `pnpm lint` - ESLint code analysis
- `pnpm clean` - Remove build artifacts

## Related Documentation
- Root CLAUDE.md - Overall system architecture
- shared/kernel/CLAUDE.md - Base domain primitives
- shared/utils/CLAUDE.md - Observability utilities
- shared/contracts/CLAUDE.md - Interface definitions