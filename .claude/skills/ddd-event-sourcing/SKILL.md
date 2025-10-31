---
name: ddd-event-sourcing
description: DDD + Event Sourcing + CQRS patterns for domain-driven microservices. Use when designing aggregates, domain events, commands, queries, CQRS workflows, event-sourced repositories, sagas, domain models, or implementing event sourcing architecture.
---

# DDD + Event Sourcing + CQRS - Complete Reference

**Auto-loaded when**: Aggregate, Event, Command, Query, CQRS, DDD, event sourcing, domain model keywords detected

---

## 1. Aggregate Root Pattern

### Base Aggregate (Event-Sourced)
```typescript
export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];
  private _version: number = 0;

  get version(): number {
    return this._version;
  }

  // Add domain event (for new events)
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  // Get uncommitted events for persistence
  getUncommittedEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  // Clear events after commit
  markEventsAsCommitted(): void {
    this._domainEvents = [];
  }

  // Load aggregate from event history (event sourcing)
  loadFromHistory(events: DomainEvent[]): void {
    events.forEach(event => {
      this.apply(event, false);  // Apply without adding to uncommitted
      this._version++;
    });
  }

  // Apply event to aggregate state
  protected apply(event: DomainEvent, isNew: boolean = true): void {
    this.when(event);  // Update state via when() method

    if (isNew) {
      this.addDomainEvent(event);  // Add to uncommitted events
      this._version++;
    }
  }

  // Subclasses implement this to handle specific events
  protected abstract when(event: DomainEvent): void;
}
```

### Concrete Aggregate Example (Invoice)
```typescript
export class Invoice extends AggregateRoot {
  private id: InvoiceId;
  private status: InvoiceStatus;
  private lineItems: LineItem[];
  private subtotal: Money;
  private vatAmount: Money;
  private grandTotal: Money;

  // Factory method (create new aggregate)
  static create(data: {
    vendorId: VendorId;
    customerId: CustomerId;
    invoiceDate: Date;
    lineItems: LineItemDto[];
    tenantId: TenantId;
  }): Invoice {
    const invoice = new Invoice();
    const invoiceId = InvoiceId.generate();

    // Emit InvoiceCreatedEvent
    invoice.apply(
      new InvoiceCreatedEvent(
        invoiceId,
        invoiceNumber,
        data.vendorId,
        data.customerId,
        data.invoiceDate,
        data.dueDate,
        data.tenantId.value
      )
    );

    // Add line items (emit LineItemAddedEvent for each)
    data.lineItems.forEach(item => {
      invoice.apply(new LineItemAddedEvent(invoiceId, item, data.tenantId.value));
    });

    return invoice;
  }

  // Business logic methods (enforce invariants + emit events)
  approve(approvedBy: UserId, mushakNumber: string): void {
    if (this.status !== InvoiceStatus.DRAFT) {
      throw new InvalidInvoiceStatusException('Only DRAFT invoices can be approved');
    }

    this.apply(
      new InvoiceApprovedEvent(
        this.id,
        approvedBy,
        new Date(),
        mushakNumber,
        this.tenantId
      )
    );
  }

  recordPayment(paymentId: PaymentId, paymentAmount: Money): void {
    if (this.status !== InvoiceStatus.APPROVED) {
      throw new InvalidInvoiceStatusException('Only APPROVED invoices can receive payments');
    }

    this.paidAmount = this.paidAmount.add(paymentAmount);

    // Emit payment recorded event
    this.apply(new InvoicePaymentRecordedEvent(this.id, paymentId, paymentAmount));

    // If fully paid, emit InvoiceFullyPaidEvent
    if (this.paidAmount.equals(this.grandTotal)) {
      this.apply(new InvoiceFullyPaidEvent(this.id, new Date()));
    }
  }

  // Event handlers (update aggregate state)
  protected when(event: DomainEvent): void {
    if (event instanceof InvoiceCreatedEvent) {
      this.onInvoiceCreated(event);
    } else if (event instanceof LineItemAddedEvent) {
      this.onLineItemAdded(event);
    } else if (event instanceof InvoiceApprovedEvent) {
      this.onInvoiceApproved(event);
    } else if (event instanceof InvoicePaymentRecordedEvent) {
      this.onPaymentRecorded(event);
    } else if (event instanceof InvoiceFullyPaidEvent) {
      this.onFullyPaid(event);
    }
  }

  private onInvoiceCreated(event: InvoiceCreatedEvent): void {
    this.id = event.invoiceId;
    this.status = InvoiceStatus.DRAFT;
    this.lineItems = [];
    this.subtotal = Money.zero();
  }

  private onLineItemAdded(event: LineItemAddedEvent): void {
    this.lineItems.push(event.lineItem);
    this.subtotal = this.subtotal.add(event.lineItem.amount);
  }

  private onInvoiceApproved(event: InvoiceApprovedEvent): void {
    this.status = InvoiceStatus.APPROVED;
    this.mushakNumber = event.mushakNumber;
  }

  private onFullyPaid(event: InvoiceFullyPaidEvent): void {
    this.status = InvoiceStatus.PAID;
    this.paidAt = event.occurredOn;
  }
}
```

---

## 2. Domain Events Pattern

### Event Structure (Immutable, Past Tense)
```typescript
export class InvoiceCreatedEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: InvoiceId,
    public readonly invoiceNumber: string,
    public readonly vendorId: VendorId,
    public readonly customerId: CustomerId,
    public readonly invoiceDate: Date,
    public readonly dueDate: Date,
    public readonly tenantId: string
  ) {
    super(
      invoiceId.value,           // aggregateId
      'InvoiceCreated',          // eventType (past tense)
      {                          // data
        invoiceId: invoiceId.value,
        invoiceNumber,
        vendorId: vendorId.value,
        customerId: customerId.value,
        invoiceDate,
        dueDate
      },
      tenantId                   // tenantId for multi-tenancy
    );
  }
}
```

### Event Naming Rules
- ✅ **Past tense**: `InvoiceCreated`, `PaymentReceived`, `InvoiceApproved`
- ❌ **Imperative**: `CreateInvoice`, `ReceivePayment` (these are commands)
- **Format**: `{Entity}{Action}Event`
- **Immutable**: Never modify after creation
- **Versioned**: Add version for schema evolution

---

## 3. Command Pattern

### Command Handler (Write Side - CQRS)
```typescript
@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler implements ICommandHandler<CreateInvoiceCommand> {
  constructor(
    @Inject('IInvoiceRepository')
    private readonly repository: IInvoiceRepository,
    private readonly eventBus: EventBus,
    private readonly taxCalculationService: TaxCalculationService
  ) {}

  async execute(command: CreateInvoiceCommand): Promise<string> {
    // 1. Business logic & validation
    const lineItemsWithVAT = await this.calculateLineItemsVAT(
      command.lineItems,
      command.invoiceDate
    );

    // 2. Create aggregate (business rules enforced here)
    const invoice = Invoice.create({
      vendorId: new VendorId(command.vendorId),
      customerId: new CustomerId(command.customerId),
      invoiceDate: command.invoiceDate,
      dueDate: command.dueDate,
      tenantId: new TenantId(command.tenantId),
      lineItems: lineItemsWithVAT
    });

    // 3. Persist to event store (write model)
    await this.repository.save(invoice);

    // 4. Publish domain events to Kafka (read model projection)
    const events = invoice.getUncommittedEvents();
    for (const event of events) {
      this.eventBus.publish(event);
    }

    return invoice.getId().value;
  }
}
```

---

## 4. Query Pattern (CQRS Read Side)

### Query Handler (Read from Read Model)
```typescript
@QueryHandler(GetInvoiceQuery)
export class GetInvoiceHandler implements IQueryHandler<GetInvoiceQuery> {
  constructor(
    @InjectRepository(InvoiceReadModel)  // Read model (PostgreSQL)
    private readonly readRepository: Repository<InvoiceReadModel>,
    private readonly cacheService: FinanceCacheService,
    private readonly tenantContext: TenantContextService
  ) {}

  async execute(query: GetInvoiceQuery): Promise<InvoiceDto | null> {
    const tenantId = this.tenantContext.getTenantId();

    // 1. Try cache first (cache-aside pattern)
    const cached = await this.cacheService.getInvoice(tenantId, query.invoiceId);
    if (cached) return cached;

    // 2. Cache miss - query read model
    const invoice = await this.readRepository.findOne({
      where: { id: query.invoiceId }
    });

    if (!invoice) return null;

    // 3. Map to DTO (for GraphQL response)
    const dto = this.mapToDto(invoice);

    // 4. Cache result (TTL: 60s)
    await this.cacheService.setInvoice(tenantId, query.invoiceId, dto);

    return dto;
  }
}
```

### CQRS Separation
```
Write Side (Commands):
  - Enforce business rules in Aggregates
  - Persist to EventStore (append-only)
  - Publish events to Kafka

Read Side (Queries):
  - Read from optimized PostgreSQL read model
  - Redis caching (cache-aside pattern)
  - NO business logic execution
  - Fast, indexed queries
  - Eventually consistent with write side
```

---

## 5. Event Handlers (Projection Handlers)

### Projection Handler (Update Read Model from Events)
```typescript
@EventsHandler(InvoiceCreatedEvent, InvoiceApprovedEvent, InvoiceFullyPaidEvent)
export class InvoiceProjectionHandler implements IEventHandler<DomainEvent> {
  constructor(
    @InjectRepository(InvoiceReadModel)
    private readonly readRepository: Repository<InvoiceReadModel>,
    private readonly cacheService: FinanceCacheService
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    if (event instanceof InvoiceCreatedEvent) {
      await this.handleInvoiceCreated(event);
    } else if (event instanceof InvoiceApprovedEvent) {
      await this.handleInvoiceApproved(event);
    } else if (event instanceof InvoiceFullyPaidEvent) {
      await this.handleInvoiceFullyPaid(event);
    }

    // Invalidate cache on every event
    await this.cacheService.invalidatePattern(`invoice:${event.aggregateId}`);
  }

  private async handleInvoiceCreated(event: InvoiceCreatedEvent): Promise<void> {
    const invoice = new InvoiceReadModel();
    invoice.id = event.invoiceId.value;
    invoice.invoiceNumber = event.invoiceNumber;
    invoice.status = 'DRAFT';
    invoice.createdAt = event.occurredOn;

    await this.readRepository.save(invoice);
  }

  private async handleInvoiceFullyPaid(event: InvoiceFullyPaidEvent): Promise<void> {
    await this.readRepository.update(
      { id: event.invoiceId.value },
      { status: 'PAID', paidAt: event.occurredOn }
    );
  }
}
```

---

## 6. Repository Pattern (Event-Sourced)

### Event-Sourced Repository
```typescript
export class InvoiceEventSourcedRepository implements IInvoiceRepository {
  constructor(private readonly eventStore: EventStoreService) {}

  // Save aggregate by appending events
  async save(aggregate: Invoice): Promise<void> {
    const events = aggregate.getUncommittedEvents();
    const streamName = `invoice-${aggregate.getId().value}`;

    // Append events to EventStore
    await this.eventStore.appendToStream(streamName, events, aggregate.version);

    aggregate.markEventsAsCommitted();
  }

  // Load aggregate by replaying event history
  async findById(id: InvoiceId): Promise<Invoice | null> {
    const streamName = `invoice-${id.value}`;
    const events = await this.eventStore.readStream(streamName);

    if (events.length === 0) return null;

    const invoice = new Invoice();
    invoice.loadFromHistory(events);  // Replay events to reconstruct state

    return invoice;
  }
}
```

---

## 7. Value Objects Pattern

### Money Value Object (Immutable)
```typescript
export class Money {
  private readonly amount: number;
  private readonly currency: string;

  constructor(amount: number, currency: string = 'BDT') {
    if (amount < 0) throw new InvalidMoneyException('Amount cannot be negative');
    this.amount = Math.round(amount * 100) / 100;  // Round to 2 decimals
    this.currency = currency;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  static zero(currency: string = 'BDT'): Money {
    return new Money(0, currency);
  }
}
```

---

## 8. Aggregate Boundaries & Best Practices

### Aggregate Design Rules
```
Invoice Aggregate (Root: Invoice)
├── LineItems (Entities - owned by Invoice)
└── InvoiceId, CustomerId (Value Objects)

Payment Aggregate (Root: Payment)
├── InvoiceId (Reference - NOT owned)
└── PaymentId, Amount (Value Objects)

Rule: Aggregates reference each other by ID ONLY (not object references)
```

### Invariant Enforcement
```typescript
// Enforce business rules at aggregate boundary
approve(approvedBy: UserId): void {
  // ✅ Enforce invariant BEFORE state change
  if (this.status !== InvoiceStatus.DRAFT) {
    throw new InvalidInvoiceStatusException('Only DRAFT invoices can be approved');
  }

  if (this.lineItems.length === 0) {
    throw new InvalidInvoiceException('Cannot approve invoice without line items');
  }

  // State change via event
  this.apply(new InvoiceApprovedEvent(this.id, approvedBy, new Date()));
}
```

---

## 9. Best Practices

✅ **DO**:
- Keep aggregates small (one transaction = one aggregate)
- Events are past tense and immutable
- Commands are imperative and validated before execution
- Separate write (command) and read (query) models (CQRS)
- Reference other aggregates by ID only
- Make commands idempotent
- Version events for schema evolution
- Use value objects for domain concepts
- Enforce invariants at aggregate boundaries

❌ **DON'T**:
- Modify multiple aggregates in one transaction (use sagas/process managers)
- Reference aggregate instances directly (use IDs)
- Mutate events after creation
- Mix command and query responsibilities
- Create anemic domain models (getters/setters only)
- Query during command execution (CQRS violation)
- Skip event versioning

---

**Self-Contained**: All DDD + Event Sourcing + CQRS patterns inline
**Production-Ready**: Extracted from live Vextrus ERP finance service
**Event-Sourced**: Complete event sourcing implementation patterns
