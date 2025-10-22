# Event Sourcing + CQRS Patterns

Core patterns for event-sourced aggregates in Vextrus ERP financial services.

---

## Aggregate Root Pattern

```typescript
export class InvoiceAggregate extends AggregateRoot {
  private id: string;
  private status: InvoiceStatus;

  // Factory method
  static create(command: CreateInvoiceCommand): InvoiceAggregate {
    const aggregate = new InvoiceAggregate();
    const event = new InvoiceCreatedEvent({ ... });
    aggregate.apply(event);
    return aggregate;
  }

  // Apply event
  apply(event: DomainEvent): void {
    this.when(event);
    this.uncommittedEvents.push(event);
    this.version++;
  }

  // Event router
  private when(event: DomainEvent): void {
    if (event instanceof InvoiceCreatedEvent) {
      this.onInvoiceCreated(event);
    }
  }

  // Business method
  markAsPaid(paymentId: string): void {
    // Idempotent check
    if (this.status === InvoiceStatus.PAID) return;

    const event = new InvoiceMarkedAsPaidEvent({ ... });
    this.apply(event);
  }
}
```

**Key Points**:
- State changes ONLY through events
- Business rules enforced before creating events
- Idempotency built-in

---

## Domain Events Pattern

```typescript
// Base class
export abstract class DomainEvent {
  readonly eventId: string = generateId();
  readonly occurredAt: Date = new Date();
  abstract readonly eventType: string;
}

// Concrete event (past tense)
export class InvoiceCreatedEvent extends DomainEvent {
  readonly eventType = 'InvoiceCreated';

  constructor(
    public readonly data: {
      aggregateId: string;
      customerId: string;
      items: InvoiceItem[];
    },
  ) {
    super();
  }
}
```

**Rules**:
- Past tense naming: `InvoiceCreated`, not `CreateInvoice`
- Immutable data
- Include version for event evolution

---

## Command Handler Pattern (Write)

```typescript
@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler {
  async execute(command: CreateInvoiceCommand): Promise<string> {
    // 1. Create aggregate
    const invoice = InvoiceAggregate.create(command);

    // 2. Save (append events to EventStore)
    await this.repository.save(invoice);

    // 3. Publish events to bus
    invoice.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });

    return invoice.getId();
  }
}
```

**Flow**: Command → Aggregate → Events → EventStore → Event Bus

---

## Query Handler Pattern (Read)

```typescript
@QueryHandler(GetInvoiceQuery)
export class GetInvoiceHandler {
  async execute(query: GetInvoiceQuery): Promise<InvoiceProjection> {
    // Read from denormalized projection
    return this.repo.findOne({ where: { id: query.id } });
  }
}
```

**CQRS**: Commands → EventStore, Queries → Projections

---

## Projection Handler Pattern (Read Model)

```typescript
@EventsHandler(InvoiceCreatedEvent, InvoiceMarkedAsPaidEvent)
export class InvoiceProjectionHandler {
  async handle(event: DomainEvent): Promise<void> {
    if (event instanceof InvoiceCreatedEvent) {
      await this.createProjection(event);
    } else if (event instanceof InvoiceMarkedAsPaidEvent) {
      await this.updateProjection(event);
    }
  }
}
```

**Purpose**: Keep read models synchronized with event stream

---

## Event Versioning Pattern

```typescript
// V1 Event
export class InvoiceCreatedEventV1 extends DomainEvent {
  readonly eventVersion = 1;
}

// V2 Event (added items field)
export class InvoiceCreatedEventV2 extends DomainEvent {
  readonly eventVersion = 2;
  constructor(public readonly data: {
    ...
    items: InvoiceItem[]; // New field
  }) {}
}

// Upcaster (V1 → V2)
export class InvoiceCreatedUpcaster {
  upcast(event: InvoiceCreatedEventV1): InvoiceCreatedEventV2 {
    return new InvoiceCreatedEventV2({
      ...event.data,
      items: [], // Default value
    });
  }
}
```

---

## Idempotency Pattern

```typescript
markAsPaid(paymentId: string): void {
  // Idempotent check
  if (this.status === InvoiceStatus.PAID) return;
  if (this.paymentIds.includes(paymentId)) return;

  const event = new InvoiceMarkedAsPaidEvent({ ... });
  this.apply(event);
}
```

**Why**: Safe event replay, resilient to duplicate commands

---

## Pattern Summary

| Pattern | Purpose | Layer |
|---------|---------|-------|
| Aggregate Root | Business logic, invariants | Domain |
| Domain Events | State changes (immutable) | Domain |
| Command Handler | Write operations | Application |
| Query Handler | Read operations | Application |
| Projection Handler | Read model sync | Infrastructure |

---

**See also**: `.claude/skills/event-sourcing/advanced-patterns.md` for sagas, snapshots
