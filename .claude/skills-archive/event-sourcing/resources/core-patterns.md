# Event Sourcing Core Patterns

Complete implementations for the 5 core Event Sourcing + CQRS patterns.

---

## 1. Aggregate Root

Business entity that maintains consistency via event replay.

```typescript
export class InvoiceAggregate extends AggregateRoot {
  private id: string;
  private invoiceNumber: string;
  private status: InvoiceStatus;
  private items: InvoiceItem[] = [];
  private total: number = 0;
  private version: number = 0;

  // Factory method
  static create(command: CreateInvoiceCommand): InvoiceAggregate {
    const aggregate = new InvoiceAggregate();
    const event = new InvoiceCreatedEvent({
      aggregateId: generateId(),
      customerId: command.customerId,
      items: command.items,
    });
    aggregate.apply(event);
    return aggregate;
  }

  // Apply event to update state
  apply(event: DomainEvent): void {
    this.when(event);
    this.uncommittedEvents.push(event);
    this.version++;
  }

  // Event handlers (state transitions)
  private when(event: DomainEvent): void {
    if (event instanceof InvoiceCreatedEvent) {
      this.onInvoiceCreated(event);
    } else if (event instanceof Invoice ItemAddedEvent) {
      this.onItemAdded(event);
    }
  }

  private onInvoiceCreated(event: InvoiceCreatedEvent): void {
    this.id = event.aggregateId;
    this.invoiceNumber = event.invoiceNumber;
    this.status = InvoiceStatus.DRAFT;
    this.items = event.items;
    this.recalculateTotal();
  }

  // Business methods
  addItem(item: InvoiceItem): void {
    // Validate business rules
    if (this.status !== InvoiceStatus.DRAFT) {
      throw new Error('Cannot add items to non-draft invoice');
    }

    // Create and apply event
    const event = new InvoiceItemAddedEvent({
      aggregateId: this.id,
      item,
    });
    this.apply(event);
  }

  markAsPaid(paymentId: string): void {
    if (this.status === InvoiceStatus.PAID) {
      return; // Idempotent
    }

    const event = new InvoiceMarkedAsPaidEvent({
      aggregateId: this.id,
      paymentId,
      paidAt: new Date(),
    });
    this.apply(event);
  }
}
```

---

## 2. Domain Events

Immutable facts about what happened (past tense).

```typescript
export class InvoiceCreatedEvent extends DomainEvent {
  readonly eventType = 'InvoiceCreated';

  constructor(
    public readonly data: {
      aggregateId: string;
      customerId: string;
      items: InvoiceItem[];
      createdBy: string;
    },
  ) {
    super();
  }
}

export class InvoiceMarkedAsPaidEvent extends DomainEvent {
  readonly eventType = 'InvoiceMarkedAsPaid';

  constructor(
    public readonly data: {
      aggregateId: string;
      paymentId: string;
      paidAt: Date;
    },
  ) {
    super();
  }
}
```

---

## 3. Command Handler

Executes business logic via aggregates.

```typescript
@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler
  implements ICommandHandler<CreateInvoiceCommand> {

  constructor(
    private readonly repository: InvoiceRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateInvoiceCommand): Promise<string> {
    // 1. Create aggregate
    const invoice = InvoiceAggregate.create(command);

    // 2. Save aggregate (appends events to EventStore)
    await this.repository.save(invoice);

    // 3. Publish events to event bus
    invoice.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });

    return invoice.getId();
  }
}
```

---

## 4. Query Handler

Reads from projections/read models.

```typescript
@QueryHandler(GetInvoiceQuery)
export class GetInvoiceHandler
  implements IQueryHandler<GetInvoiceQuery> {

  constructor(
    @InjectRepository(InvoiceProjection)
    private readonly repo: Repository<InvoiceProjection>,
  ) {}

  async execute(query: GetInvoiceQuery): Promise<InvoiceProjection> {
    // Read from projection (optimized for queries)
    return this.repo.findOne({
      where: { id: query.id },
      relations: ['items', 'customer'],
    });
  }
}
```

---

## 5. Projection (Read Model)

Event handler that updates denormalized view.

```typescript
@EventsHandler(InvoiceCreatedEvent, InvoiceMarkedAsPaidEvent)
export class InvoiceProjectionHandler
  implements IEventHandler<InvoiceCreatedEvent | InvoiceMarkedAsPaidEvent> {

  constructor(
    @InjectRepository(InvoiceProjection)
    private readonly repo: Repository<InvoiceProjection>,
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    if (event instanceof InvoiceCreatedEvent) {
      await this.createProjection(event);
    } else if (event instanceof InvoiceMarkedAsPaidEvent) {
      await this.updateStatus(event);
    }
  }

  private async createProjection(event: InvoiceCreatedEvent): Promise<void> {
    const projection = this.repo.create({
      id: event.data.aggregateId,
      customerId: event.data.customerId,
      status: 'DRAFT',
      items: event.data.items,
      // ... denormalized fields for query performance
    });

    await this.repo.save(projection);
  }

  private async updateStatus(event: InvoiceMarkedAsPaidEvent): Promise<void> {
    await this.repo.update(
      { id: event.data.aggregateId },
      { status: 'PAID', paidAt: event.data.paidAt },
    );
  }
}
```

---

## Pattern Summary

| Pattern | Purpose | Key Points |
|---------|---------|------------|
| Aggregate Root | Business logic container | Event replay, invariant enforcement |
| Domain Events | State changes | Immutable, past tense, versioned |
| Command Handler | Write operations | Creates/updates aggregates |
| Query Handler | Read operations | Reads from projections |
| Projection | Read model | Denormalized for query performance |
