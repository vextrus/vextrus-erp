# DDD Event Sourcing Skill

## Aggregate Patterns

### Core Principles
- **Small Aggregates**: Keep aggregates focused and small
- **Enforce Invariants**: Business rules enforced at aggregate boundaries
- **Factory Methods**: Use static factory methods for creation
- **Event-Sourced**: State derived from event stream

### Implementation Pattern
```typescript
// Location: services/*/src/domain/aggregates/

export class InvoiceAggregate {
  private constructor(
    public readonly id: string,
    private status: InvoiceStatus,
    private items: InvoiceItem[],
    private totalAmount: number
  ) {}

  // Factory method for creation
  static create(data: CreateInvoiceData): InvoiceAggregate {
    // Validate invariants
    if (data.items.length === 0) {
      throw new DomainError('Invoice must have at least one item');
    }

    const aggregate = new InvoiceAggregate(
      generateId(),
      InvoiceStatus.DRAFT,
      data.items,
      calculateTotal(data.items)
    );

    // Emit domain event
    aggregate.apply(new InvoiceCreatedEvent({
      invoiceId: aggregate.id,
      items: data.items,
      totalAmount: aggregate.totalAmount
    }));

    return aggregate;
  }

  // Business method
  approve(): void {
    // Enforce invariants
    if (this.status !== InvoiceStatus.DRAFT) {
      throw new DomainError('Only draft invoices can be approved');
    }

    if (this.totalAmount <= 0) {
      throw new DomainError('Invoice amount must be positive');
    }

    // Apply state change
    this.status = InvoiceStatus.APPROVED;

    // Emit domain event
    this.apply(new InvoiceApprovedEvent({
      invoiceId: this.id,
      approvedAt: new Date()
    }));
  }

  // Event application
  private apply(event: DomainEvent): void {
    this.uncommittedEvents.push(event);
  }
}
```

### Aggregate Rules
1. **One aggregate per transaction**: Don't modify multiple aggregates in single transaction
2. **Reference by ID**: Aggregates reference other aggregates by ID only
3. **Small consistency boundaries**: Keep aggregate small to reduce contention
4. **Idempotent operations**: Commands should be idempotent

---

## Event Naming Conventions

### Rules
- **Past Tense**: Events describe something that happened
- **Domain Language**: Use ubiquitous language
- **Immutable**: Events never change after creation
- **Versioned**: Include version for schema evolution

### Naming Pattern
```
{Entity}{Action}Event

Examples:
✅ InvoiceCreatedEvent
✅ PaymentReceivedEvent
✅ ProjectCompletedEvent
✅ InvoiceItemAddedEvent

❌ CreateInvoiceEvent (not past tense)
❌ InvoiceCreate (not an event)
❌ InvoiceEvent (too generic)
```

### Implementation Pattern
```typescript
// Location: services/*/src/domain/events/

export class InvoiceCreatedEvent extends DomainEvent {
  static readonly eventType = 'invoice.created';
  static readonly eventVersion = 1; // Schema version

  constructor(
    public readonly data: {
      invoiceId: string;
      customerId: string;
      items: InvoiceItem[];
      totalAmount: number;
      createdAt: Date;
    },
    metadata?: EventMetadata
  ) {
    super(InvoiceCreatedEvent.eventType, InvoiceCreatedEvent.eventVersion, metadata);
  }
}

// Versioned event example
export class InvoiceCreatedEventV2 extends DomainEvent {
  static readonly eventType = 'invoice.created';
  static readonly eventVersion = 2; // New version

  constructor(
    public readonly data: {
      invoiceId: string;
      customerId: string;
      items: InvoiceItem[];
      totalAmount: number;
      vatAmount: number; // New field in V2
      createdAt: Date;
    },
    metadata?: EventMetadata
  ) {
    super(InvoiceCreatedEventV2.eventType, InvoiceCreatedEventV2.eventVersion, metadata);
  }
}
```

---

## Command Patterns

### Core Principles
- **Validation**: Validate before execution
- **Business Logic**: Enforce business rules
- **Idempotent**: Safe to retry

### Naming Pattern
```
{Action}{Entity}Command

Examples:
✅ CreateInvoiceCommand
✅ ApproveInvoiceCommand
✅ AddInvoiceItemCommand

❌ InvoiceCreateCommand (verb should come first)
❌ CreateInvoice (not a command)
```

### Implementation Pattern
```typescript
// Location: services/*/src/application/commands/

export class CreateInvoiceCommand {
  constructor(
    public readonly customerId: string,
    public readonly items: CreateInvoiceItemDto[],
    public readonly dueDate: Date,
    public readonly idempotencyKey: string // For idempotency
  ) {}
}

// Command Handler
@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler implements ICommandHandler<CreateInvoiceCommand> {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: CreateInvoiceCommand): Promise<string> {
    // 1. Check idempotency
    const existing = await this.invoiceRepository.findByIdempotencyKey(
      command.idempotencyKey
    );
    if (existing) {
      return existing.id; // Already processed
    }

    // 2. Validate command
    this.validateCommand(command);

    // 3. Load aggregate (if needed)
    // 4. Execute business logic
    const invoice = InvoiceAggregate.create({
      customerId: command.customerId,
      items: command.items,
      dueDate: command.dueDate
    });

    // 5. Persist
    await this.invoiceRepository.save(invoice);

    // 6. Publish events
    invoice.uncommittedEvents.forEach(event => {
      this.eventBus.publish(event);
    });

    return invoice.id;
  }

  private validateCommand(command: CreateInvoiceCommand): void {
    if (!command.customerId) {
      throw new ValidationError('Customer ID is required');
    }
    if (command.items.length === 0) {
      throw new ValidationError('At least one item is required');
    }
    // Additional validation...
  }
}
```

---

## Query Patterns (CQRS)

### Core Principles
- **Separate from Commands**: Queries don't modify state
- **Read Models**: Optimized for queries
- **Eventually Consistent**: Can be slightly out of date

### Naming Pattern
```
Get{Entity}{Filter}Query

Examples:
✅ GetInvoiceByIdQuery
✅ GetPendingInvoicesQuery
✅ GetCustomerInvoicesQuery
```

### Implementation Pattern
```typescript
// Location: services/*/src/application/queries/

export class GetInvoiceByIdQuery {
  constructor(public readonly invoiceId: string) {}
}

// Query Handler
@QueryHandler(GetInvoiceByIdQuery)
export class GetInvoiceByIdHandler implements IQueryHandler<GetInvoiceByIdQuery> {
  constructor(private readonly invoiceReadModel: InvoiceReadModel) {}

  async execute(query: GetInvoiceByIdQuery): Promise<InvoiceDto> {
    // Query from read model (not aggregate)
    const invoice = await this.invoiceReadModel.findById(query.invoiceId);

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.toDto(invoice);
  }

  private toDto(invoice: InvoiceReadModelEntity): InvoiceDto {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      // ... map all fields
    };
  }
}
```

---

## Repository Patterns (Event-Sourced)

### Core Principles
- **Event Store**: Store events, not state
- **Replay Events**: Rebuild state from events
- **Snapshots**: Optimize replay for long event streams

### Implementation Pattern
```typescript
// Location: services/*/src/infrastructure/repositories/

export class EventSourcedInvoiceRepository {
  constructor(
    private readonly eventStore: EventStore,
    private readonly snapshotStore: SnapshotStore
  ) {}

  async save(aggregate: InvoiceAggregate): Promise<void> {
    // Get uncommitted events
    const events = aggregate.uncommittedEvents;

    // Persist events
    await this.eventStore.append(aggregate.id, events, aggregate.version);

    // Create snapshot if threshold reached
    if (aggregate.version % 100 === 0) {
      await this.snapshotStore.save({
        aggregateId: aggregate.id,
        version: aggregate.version,
        state: aggregate.toSnapshot()
      });
    }

    // Clear uncommitted events
    aggregate.markEventsAsCommitted();
  }

  async findById(id: string): Promise<InvoiceAggregate | null> {
    // Try to load from snapshot
    const snapshot = await this.snapshotStore.getLatest(id);

    let aggregate: InvoiceAggregate;
    let fromVersion = 0;

    if (snapshot) {
      // Restore from snapshot
      aggregate = InvoiceAggregate.fromSnapshot(snapshot);
      fromVersion = snapshot.version;
    } else {
      // Start from scratch
      aggregate = InvoiceAggregate.empty(id);
    }

    // Load events after snapshot
    const events = await this.eventStore.getEvents(id, fromVersion);

    // Replay events
    events.forEach(event => aggregate.applyEvent(event));

    return aggregate;
  }
}
```

---

## Event Store Pattern

### Implementation Pattern
```typescript
export interface EventStore {
  append(aggregateId: string, events: DomainEvent[], expectedVersion: number): Promise<void>;
  getEvents(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]>;
  getAllEvents(fromSequence?: number): Promise<DomainEvent[]>;
}

// PostgreSQL implementation example
export class PostgresEventStore implements EventStore {
  async append(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<void> {
    await this.db.transaction(async trx => {
      // Optimistic concurrency check
      const current = await trx('events')
        .where({ aggregate_id: aggregateId })
        .max('version as max_version')
        .first();

      if (current.max_version !== expectedVersion) {
        throw new ConcurrencyError('Aggregate version mismatch');
      }

      // Insert events
      for (const event of events) {
        await trx('events').insert({
          aggregate_id: aggregateId,
          event_type: event.eventType,
          event_version: event.eventVersion,
          data: JSON.stringify(event.data),
          metadata: JSON.stringify(event.metadata),
          version: expectedVersion + 1,
          created_at: new Date()
        });
        expectedVersion++;
      }
    });
  }
}
```

---

## Saga Pattern (Process Managers)

### Use Cases
- Cross-aggregate coordination
- Long-running business processes
- Distributed transactions

### Implementation Pattern
```typescript
@Saga()
export class InvoicePaymentSaga {
  @SagaEventHandler(InvoiceApprovedEvent)
  onInvoiceApproved(event: InvoiceApprovedEvent, ctx: SagaContext) {
    // Orchestrate payment process
    return [
      new CreatePaymentCommand({
        invoiceId: event.data.invoiceId,
        amount: event.data.totalAmount
      }),
      new SendInvoiceEmailCommand({
        invoiceId: event.data.invoiceId
      })
    ];
  }

  @SagaEventHandler(PaymentFailedEvent)
  async onPaymentFailed(event: PaymentFailedEvent, ctx: SagaContext) {
    // Compensating action
    return new RejectInvoiceCommand({
      invoiceId: event.data.invoiceId,
      reason: 'Payment failed'
    });
  }
}
```

---

## Best Practices

### DO ✅
- Keep aggregates small and focused
- Use past tense for event names
- Make commands idempotent
- Version events for schema evolution
- Use snapshots for long event streams
- Validate commands before execution
- Use sagas for cross-aggregate coordination

### DON'T ❌
- Don't modify multiple aggregates in one transaction
- Don't put too much logic in aggregates (keep them small)
- Don't change event schemas (create new version instead)
- Don't query from aggregates (use read models)
- Don't skip event versioning
- Don't expose aggregate internals

---

## Reference

**Location Conventions**:
- Aggregates: `services/*/src/domain/aggregates/`
- Events: `services/*/src/domain/events/`
- Commands: `services/*/src/application/commands/`
- Queries: `services/*/src/application/queries/`
- Repositories: `services/*/src/infrastructure/repositories/`
- Sagas: `services/*/src/application/sagas/`

**Further Reading**: `VEXTRUS-PATTERNS.md` for full DDD + Event Sourcing patterns

---

## Usage in Vextrus ERP

This skill is automatically activated when working on:
- Domain modeling
- Aggregate design
- Event definitions
- Command/Query handlers
- Repository implementations
- Business logic enforcement

**Always follow DDD + Event Sourcing patterns for consistency across all services.**
