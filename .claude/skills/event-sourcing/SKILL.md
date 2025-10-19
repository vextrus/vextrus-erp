---
name: Event Sourcing
description: When working with domain aggregates, events, CQRS commands/queries, or EventStore, activate this skill to enforce event sourcing and CQRS patterns. Use when user says "aggregate", "event", "domain", "CQRS", "command", "event sourcing", or when modifying domain logic in finance service.
---

# Event Sourcing Skill

## Purpose
Enforce **Event Sourcing + CQRS** patterns for domain-driven design in Vextrus ERP services, particularly Finance.

## Activation Triggers
- User says: "aggregate", "event", "domain", "CQRS", "command", "query", "event sourcing"
- Working in: `services/*/src/domain/aggregates/`
- Creating: Domain events, command handlers, aggregates
- Using: EventStore, event-sourced repositories

## CQRS + Event Sourcing Architecture

```
Command Side (Write)         Event Store         Query Side (Read)
────────────────────         ───────────         ─────────────────
GraphQL Mutation                                 GraphQL Query
      ↓                                                ↑
Command Handler              Append Events       Query Handler
      ↓                           ↓                    ↑
Domain Aggregate          ┌─────────────┐       Read Model
   (apply events)         │ Event Store │    (projections)
      ↓                   │  PostgreSQL │           ↑
Domain Events     ───────→└─────────────┘───────────┘
                            (Stream)
```

## Core Concepts Overview

Event sourcing stores business state as a sequence of events instead of current state. CQRS separates reads (queries) from writes (commands).

**5 Core Patterns**:

1. **Aggregate Root** - Business entity loaded via event replay, enforces invariants
2. **Domain Events** - Immutable facts (past tense): InvoiceCreated, PaymentReceived
3. **Command Handler** - Executes business logic, creates aggregates, appends events
4. **Query Handler** - Reads from optimized projections (denormalized read models)
5. **Projection** - Event handler that updates read models for query performance

**See**: resources/core-patterns.md for complete implementations and code examples

## Event Sourcing Best Practices

### Event Naming
- Past tense: `InvoiceCreated`, `PaymentReceived`, `OrderShipped`
- Business language: `InvoiceCancelled` (not `InvoiceDeleted`)
- Specific: `InvoiceMarkedAsOverdue` (not `InvoiceUpdated`)

### Aggregate Rules
- ✅ Small, focused aggregates (1 root entity)
- ✅ Enforce business invariants
- ✅ Load via event replay
- ❌ Don't make aggregates too large
- ❌ Don't reference other aggregates (use IDs only)

### Event Rules
- ✅ Events are immutable (never change)
- ✅ Events are facts (past tense)
- ✅ Include all data for projections
- ✅ Version events for schema evolution
- ❌ Don't delete events (append-only)

### Command/Query Separation
- Commands: Write operations, return success/failure
- Queries: Read operations, return data from projections
- Never mix: Commands don't return entity data

### Idempotency
```typescript
markAsPaid(paymentId: string): void {
  // Check current state
  if (this.status === InvoiceStatus.PAID) {
    return; // Already paid, do nothing
  }

  // Apply event only if not already in desired state
  this.apply(new InvoiceMarkedAsPaidEvent({ ... }));
}
```

## Workflow Checklist

When implementing event-sourced features:

- [ ] Define domain events (past tense)
- [ ] Create/update aggregate with business logic
- [ ] Implement event handlers in aggregate
- [ ] Create command handler
- [ ] Create projection handler (if needed)
- [ ] Update read model entity
- [ ] Write aggregate unit tests (Given-When-Then)
- [ ] Test command handler integration
- [ ] Verify projection updates correctly
- [ ] Test idempotency
- [ ] Check event versioning strategy

## Plan Mode Integration

In plan mode:
1. User describes domain feature
2. Skill analyzes aggregate boundaries and events
3. Presents CQRS implementation plan (commands, events, projections)
4. User approves event-sourcing approach
5. Execute with event store patterns
6. Test event replay and projections

## Integration with Execute First

Event-sourcing and execute-first work together:

```
1. [TodoWrite: Event sourcing changes]
2. [/explore services/finance/src/domain] → Haiku explores patterns
3. [Write: domain-events.ts] → Execute-first creates events
4. [Edit: invoice.aggregate.ts] → Event-sourcing enforces patterns
5. [Edit: command-handler.ts] → CQRS command pattern
6. [Edit: projection-handler.ts] → Read model projection
7. [Write: aggregate.spec.ts] → Test-first creates tests
8. [Bash: npm test] → Execute-first runs tests
9. [Mark done] → Execute-first completes
```

## Resources & References

**Pattern Files**:
- resources/core-patterns.md - Aggregate, Events, Handlers, Projections with code examples
- resources/advanced-patterns.md - EventStore operations, snapshots, testing patterns

**External Resources**:
- Event Store: PostgreSQL with EventStore library
- CQRS Bus: NestJS CQRS module
- Projections: TypeORM entities in `projections/` directory

## Common Mistakes

❌ Storing aggregate state instead of events
❌ Mutable events
❌ Commands returning entity data
❌ Aggregates referencing other aggregates
❌ Missing idempotency checks
❌ Not testing event replay
❌ Forgetting to publish events to event bus
❌ Deleting events instead of appending compensating events

## Override

Skip this skill if:
- Simple CRUD without domain logic
- Prototyping only
- User says "skip event sourcing"

**Default for finance domain**: USE Event Sourcing + CQRS
