---
name: GraphQL Event Sourcing
version: 3.0.0
triggers:
  - "GraphQL"
  - "federation"
  - "event sourcing"
  - "CQRS"
  - "aggregate"
  - "domain event"
  - "projection"
  - "@key"
---

# GraphQL Event Sourcing Skill

## Purpose
**Core Vextrus architecture patterns**: GraphQL Federation v2 + Event Sourcing + CQRS. Copy-paste templates for aggregates, events, and federated schemas.

---

## When This Skill Activates

**Automatic activation on**:
- GraphQL schema design (`@key`, `federation`)
- Event sourcing implementation (`aggregate`, `domain event`)
- CQRS patterns (`projection`, `command`, `query`)
- Core architecture work

---

## 1. GraphQL Federation v2

### Entity Pattern (Federated Types)

```graphql
# In finance service
type Invoice @key(fields: "id") {
  id: ID!
  number: String!
  customerId: ID!
  customer: Customer  # Resolved from master-data service
  totalAmount: Float!
  status: InvoiceStatus!
}

# In master-data service
type Customer @key(fields: "id") {
  id: ID!
  name: String!
  email: String!
}

# Reference resolver in finance service
@ResolveReference()
async resolveCustomer(reference: { __typename: string; id: string }) {
  return { __typename: 'Customer', id: reference.id };
}
```

### Query Pattern (with Pagination)

```graphql
# Single entity
invoice(id: ID!): Invoice

# List with pagination (ALWAYS for lists)
invoices(
  page: Int = 1
  limit: Int = 20
  filter: InvoiceFilterInput
  sort: InvoiceSortInput
): InvoicePage!

type InvoicePage {
  data: [Invoice!]!
  meta: PaginationMeta!
}

type PaginationMeta {
  totalItems: Int!
  totalPages: Int!
  currentPage: Int!
  itemsPerPage: Int!
}
```

### Mutation Pattern (Payload Type)

```graphql
# Action-oriented (not CRUD)
createInvoice(input: CreateInvoiceInput!): InvoicePayload!
approveInvoice(id: ID!): InvoicePayload!

type InvoicePayload {
  success: Boolean!
  data: Invoice
  errors: [Error!]
}

type Error {
  field: String
  message: String!
  code: String!
}
```

### Resolver Implementation

```typescript
@Resolver(() => Invoice)
export class InvoiceResolver {
  @Query(() => Invoice, { nullable: true })
  @UseGuards(JwtAuthGuard, RbacGuard)  // ALWAYS both
  @RequirePermissions('invoices.read')
  async invoice(
    @Args('id') id: string,
    @Context() context: GraphQLContext,
  ): Promise<Invoice | null> {
    return this.queryBus.execute(
      new GetInvoiceQuery(id, context.tenantId),
    );
  }

  @Mutation(() => InvoicePayload)
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermissions('invoices.create')
  async createInvoice(
    @Args('input') input: CreateInvoiceInput,
    @Context() context: GraphQLContext,
  ): Promise<InvoicePayload> {
    try {
      const invoice = await this.commandBus.execute(
        new CreateInvoiceCommand(input, context.tenantId, context.userId),
      );
      return { success: true, data: invoice, errors: [] };
    } catch (error) {
      return {
        success: false,
        data: null,
        errors: [{ message: error.message, code: 'CREATE_FAILED' }],
      };
    }
  }
}
```

---

## 2. Event Sourcing + CQRS

### Domain Event Pattern (Immutable, Past Tense)

```typescript
// Events are FACTS (past tense, immutable)
export class InvoiceCreatedEvent implements DomainEvent {
  readonly eventType = 'InvoiceCreated';
  readonly version = 1;  // Version for schema evolution
  readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string,
    public readonly data: {
      customerId: string;
      lineItems: LineItem[];
      totalAmount: number;
      dueDate: Date;
    },
  ) {
    this.occurredOn = new Date();
  }
}

// Schema evolution example
export class InvoiceCreatedEvent_v2 implements DomainEvent {
  readonly eventType = 'InvoiceCreated';
  readonly version = 2;  // New schema
  // ... additional fields
}
```

### Aggregate Pattern (Small, Focused)

```typescript
export class Invoice extends AggregateRoot {
  private id: InvoiceId;
  private customerId: CustomerId;
  private lineItems: LineItem[] = [];
  private totalAmount: Money;
  private status: InvoiceStatus;

  // Factory method (static create)
  static create(
    customerId: CustomerId,
    lineItems: LineItem[],
    tenantId: string,
  ): Invoice {
    const invoice = new Invoice();
    invoice.apply(
      new InvoiceCreatedEvent(
        uuid(),
        tenantId,
        { customerId: customerId.value, lineItems, totalAmount: /* calculate */ }
      ),
    );
    return invoice;
  }

  // Business logic (enforce invariants)
  approve(approvedBy: string): void {
    if (this.status !== InvoiceStatus.DRAFT) {
      throw new InvalidInvoiceStatusException(
        'Only DRAFT invoices can be approved'
      );
    }

    if (this.totalAmount.isZero()) {
      throw new InvoiceValidationException(
        'Cannot approve zero-amount invoice'
      );
    }

    this.apply(new InvoiceApprovedEvent(this.id.value, approvedBy));
  }

  // Event handlers (update state)
  private onInvoiceCreatedEvent(event: InvoiceCreatedEvent): void {
    this.id = new InvoiceId(event.aggregateId);
    this.customerId = new CustomerId(event.data.customerId);
    this.lineItems = event.data.lineItems;
    this.totalAmount = new Money(event.data.totalAmount);
    this.status = InvoiceStatus.DRAFT;
  }

  private onInvoiceApprovedEvent(event: InvoiceApprovedEvent): void {
    this.status = InvoiceStatus.APPROVED;
  }
}
```

### Command Handler Pattern (Write Side)

```typescript
@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler implements ICommandHandler {
  constructor(
    private readonly repository: InvoiceRepository,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: CreateInvoiceCommand): Promise<Invoice> {
    // Create aggregate
    const invoice = Invoice.create(
      new CustomerId(command.customerId),
      command.lineItems,
      command.tenantId,
    );

    // Save to event store (events persisted)
    await this.repository.save(invoice);

    // Events automatically published to event bus
    return invoice;
  }
}
```

### Query Handler Pattern (Read Side)

```typescript
@QueryHandler(GetInvoiceQuery)
export class GetInvoiceHandler implements IQueryHandler {
  constructor(
    @InjectRepository(InvoiceProjection)  // Read model
    private readonly repository: Repository<InvoiceProjection>,
    private readonly cacheService: CacheService,
  ) {}

  async execute(query: GetInvoiceQuery): Promise<Invoice | null> {
    const cacheKey = `invoice:${query.tenantId}:${query.invoiceId}`;

    // Try cache first
    const cached = await this.cacheService.get<Invoice>(cacheKey);
    if (cached) return cached;

    // Query read model (projection)
    const invoice = await this.repository.findOne({
      where: { id: query.invoiceId, tenantId: query.tenantId },
    });

    // Cache result
    if (invoice) {
      await this.cacheService.set(cacheKey, invoice, 60);  // 1 min TTL
    }

    return invoice;
  }
}
```

### Projection Handler Pattern (Event → Read Model)

```typescript
@EventsHandler(InvoiceCreatedEvent, InvoiceApprovedEvent)
export class InvoiceProjectionHandler implements IEventHandler {
  constructor(
    @InjectRepository(InvoiceProjection)
    private readonly repository: Repository<InvoiceProjection>,
    private readonly cacheService: CacheService,
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    // Route to specific handler
    if (event.eventType === 'InvoiceCreated') {
      await this.handleInvoiceCreated(event as InvoiceCreatedEvent);
    } else if (event.eventType === 'InvoiceApproved') {
      await this.handleInvoiceApproved(event as InvoiceApprovedEvent);
    }

    // Invalidate cache (CRITICAL for consistency)
    await this.cacheService.invalidate(`invoice:${event.tenantId}:${event.aggregateId}`);
    await this.cacheService.invalidate(`invoices:${event.tenantId}:*`);  // List cache
  }

  private async handleInvoiceCreated(event: InvoiceCreatedEvent): Promise<void> {
    const projection = new InvoiceProjection();
    projection.id = event.aggregateId;
    projection.tenantId = event.tenantId;
    projection.customerId = event.data.customerId;
    projection.totalAmount = event.data.totalAmount;
    projection.status = 'DRAFT';
    projection.createdAt = event.occurredOn;

    await this.repository.save(projection);
  }

  private async handleInvoiceApproved(event: InvoiceApprovedEvent): Promise<void> {
    await this.repository.update(
      { id: event.aggregateId, tenantId: event.tenantId },
      { status: 'APPROVED', approvedAt: event.occurredOn }
    );
  }
}
```

---

## 3. Best Practices

### GraphQL Federation v2
- ✅ Use `@key` directive on ALL federated entities
- ✅ ALWAYS paginate list queries
- ✅ Return payload types with errors (don't throw from mutations)
- ✅ Apply guards on ALL operations (no @Public())
- ✅ Use business-meaningful names (not CRUD)
- ❌ Never expose database IDs directly (use UUIDs)

### Event Sourcing
- ✅ Events are immutable (never change)
- ✅ Events are past tense: `InvoiceCreated`, not `CreateInvoice`
- ✅ Aggregates are small (1 root entity)
- ✅ Include all data needed for projections in events
- ✅ Version events for schema evolution
- ❌ Don't make aggregates reference other aggregates (use IDs)
- ❌ Don't delete events (append-only)

### CQRS
- ✅ Commands modify state, queries read
- ✅ Projection handlers update read models
- ✅ Cache invalidation in projection handlers
- ✅ Idempotent event handlers
- ❌ Don't query during command execution

---

## Quick Reference

### Create New Aggregate
```typescript
1. Define events (InvoiceCreated, InvoiceApproved)
2. Create aggregate with event handlers
3. Add command handlers (CreateInvoice, ApproveInvoice)
4. Add projection handler (events → read model)
5. Add query handlers (GetInvoice, GetInvoices)
6. Add GraphQL resolver (queries + mutations)
```

### Add New Event to Existing Aggregate
```typescript
1. Create event class (InvoicePaymentLinkedEvent)
2. Add business method to aggregate (linkPayment)
3. Add event handler to aggregate (onInvoicePaymentLinkedEvent)
4. Update projection handler (handleInvoicePaymentLinked)
5. Invalidate cache in projection handler
```

### Add GraphQL Federated Entity
```typescript
1. Define type with @key directive
2. Create resolver with @ResolveReference()
3. Add queries/mutations with guards
4. Test federation with gateway
```

---

**Version**: 3.0.0
**Coverage**: GraphQL Federation v2 + Event Sourcing + CQRS
**Patterns Source**: VEXTRUS-PATTERNS.md sections 1, 2

**See Also**:
- [VEXTRUS-PATTERNS.md](../../VEXTRUS-PATTERNS.md) - Complete patterns (sections 1, 2, 3)
- [Agent Directory](../../agents/AGENT-DIRECTORY.md) - graphql-architect, backend-architect
- [Medium Workflow](../../workflows/medium-task-workflow.md) - When to use these patterns
