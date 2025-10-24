# Domain Services vs Application Services

Guide for distinguishing domain services from application services in Vextrus ERP.

---

## Overview

**Domain Service**: Business logic that doesn't naturally fit in an entity or value object.

**Application Service**: Orchestration layer - coordinates domain objects, handles transactions.

---

## When to Use Domain Service

**Use Domain Service When**:
- Business logic spans multiple aggregates
- Operation doesn't naturally belong to one aggregate
- Stateless operation (no identity)
- Pure business logic (no infrastructure concerns)

**Examples**:
- Calculate fiscal year (Bangladesh July-June cycle)
- Find matching bank transaction for payment
- Validate double-entry accounting balance

---

## Pattern: Embedded Domain Logic

**Vextrus Pattern**: Business logic in aggregates, not separate domain services.

### Invoice Aggregate (No Separate Service)

```typescript
export class Invoice extends AggregateRoot<InvoiceProps> {
  // Domain logic embedded in aggregate
  static calculateFiscalYear(date: Date): string {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    // Bangladesh fiscal year: July-June
    return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`
  }

  private recalculateTotals(): void {
    // Business rule: Grand total = subtotal + VAT + supplementary duty
    const subtotal = this.props.lineItems.reduce(
      (sum, item) => sum.add(item.totalAmount),
      Money.create(0, 'BDT')
    )

    const vatAmount = this.calculateVAT()
    const supplementaryDuty = this.calculateSupplementaryDuty()

    this.props.grandTotal = subtotal.add(vatAmount).add(supplementaryDuty)
  }

  private calculateVAT(): Money {
    return this.props.lineItems.reduce((sum, item) => {
      const vat = item.totalAmount.multiply(item.taxRate.rate)
      return sum.add(vat)
    }, Money.create(0, 'BDT'))
  }
}
```

**Why No Service**: Invoice calculations belong to Invoice aggregate.

---

## Pattern: Application Service (Orchestration)

**Purpose**: Coordinate aggregates, handle transactions, integrate infrastructure.

### Application Service Example

```typescript
@Injectable()
export class ApproveInvoiceCommandHandler {
  constructor(
    private readonly invoiceRepo: IInvoiceRepository,
    private readonly eventBus: EventBus,
    private readonly logger: Logger
  ) {}

  async execute(command: ApproveInvoiceCommand): Promise<void> {
    // 1. Load aggregate
    const invoice = await this.invoiceRepo.findById(
      new InvoiceId(command.invoiceId),
      command.tenantId
    )

    if (!invoice) {
      throw new EntityNotFoundException('Invoice', command.invoiceId)
    }

    // 2. Execute domain logic (in aggregate)
    invoice.approve(command.userId)

    // 3. Persist (transaction boundary)
    await this.invoiceRepo.save(invoice)

    // 4. Publish events (infrastructure concern)
    const events = invoice.getDomainEvents()
    await this.eventBus.publishAll(events)

    invoice.clearDomainEvents()

    this.logger.log('Invoice approved', {
      invoiceId: command.invoiceId,
      userId: command.userId,
    })
  }
}
```

**Application Service Responsibilities**:
- Load aggregates from repository
- Execute domain logic (via aggregate methods)
- Save aggregates (transaction)
- Publish domain events
- Log/monitor (infrastructure)

---

## Pattern: Multi-Aggregate Orchestration

**When**: Operation spans multiple aggregates (via events).

### Invoice Approval + Customer Update

```typescript
// Application service: Orchestrates invoice approval
@Injectable()
export class ApproveInvoiceCommandHandler {
  async execute(command: ApproveInvoiceCommand): Promise<void> {
    const invoice = await this.invoiceRepo.findById(/* ... */)

    invoice.approve(command.userId)  // Domain logic in aggregate

    await this.invoiceRepo.save(invoice)  // Transaction 1

    // InvoiceApprovedEvent published
    // Separate handler updates customer (Transaction 2)
  }
}

// Event handler: Updates customer aggregate
@EventsHandler(InvoiceApprovedEvent)
export class UpdateCustomerOnInvoiceApprovalHandler {
  async handle(event: InvoiceApprovedEvent): Promise<void> {
    const customer = await this.customerRepo.findById(event.payload.customerId)

    customer.increaseOutstandingBalance(
      Money.create(event.payload.grandTotal, 'BDT')
    )  // Domain logic in Customer aggregate

    await this.customerRepo.save(customer)  // Separate transaction
  }
}
```

**Key**: Application layer coordinates, domain logic stays in aggregates.

---

## Pattern: Query Services (Read Side)

**Purpose**: Fetch data for display (no business logic).

### Query Handler

```typescript
@Injectable()
export class GetInvoicesByCustomerQueryHandler {
  constructor(
    @InjectRepository(InvoiceProjection)
    private readonly projectionRepo: Repository<InvoiceProjection>
  ) {}

  async execute(query: GetInvoicesByCustomerQuery): Promise<InvoiceDto[]> {
    // Read from projection (not domain aggregate)
    const projections = await this.projectionRepo.find({
      where: {
        tenantId: query.tenantId,
        customerId: query.customerId,
      },
      order: { invoiceDate: 'DESC' },
      take: query.limit,
    })

    return projections.map(p => this.toDto(p))
  }

  private toDto(projection: InvoiceProjection): InvoiceDto {
    return {
      id: projection.id,
      invoiceNumber: projection.invoiceNumber,
      customerName: projection.customerName,
      grandTotal: projection.grandTotal,
      status: projection.status,
    }
  }
}
```

**No Domain Logic**: Query services just fetch and transform data.

---

## Comparison Table

| Aspect | Domain Service | Application Service | Query Service |
|--------|----------------|---------------------|---------------|
| **Purpose** | Business logic | Orchestration | Data fetching |
| **Location** | domain/ layer | application/ layer | application/queries/ |
| **Dependencies** | Domain objects only | Repositories, events | Projections, DTOs |
| **Stateful** | No | No | No |
| **Transaction** | No | Yes | Read-only |
| **Example** | FiscalYearCalculator | ApproveInvoiceHandler | GetInvoicesQueryHandler |

---

## Anti-Patterns

### ❌ Anemic Domain Model

```typescript
// BAD: Business logic in application service
@Injectable()
export class InvoiceApplicationService {
  async approveInvoice(invoiceId: string): Promise<void> {
    const invoice = await this.repo.findById(invoiceId)

    // Business logic leak into application layer!
    if (invoice.status !== 'DRAFT') {
      throw new Error('Cannot approve non-draft invoice')
    }

    if (invoice.lineItems.length === 0) {
      throw new Error('Cannot approve empty invoice')
    }

    invoice.status = 'APPROVED'  // Direct property mutation

    await this.repo.save(invoice)
  }
}

// GOOD: Business logic in aggregate
export class Invoice extends AggregateRoot {
  approve(userId: string): void {
    // Business rules in domain
    if (this.status !== InvoiceStatus.DRAFT) {
      throw new CannotApproveNonDraftInvoiceException()
    }

    if (this.lineItems.length === 0) {
      throw new CannotApproveEmptyInvoiceException()
    }

    this.apply(new InvoiceApprovedEvent(/* ... */))
  }
}
```

---

## Best Practices

✅ **Do**:
- Keep business logic in aggregates
- Use application services for orchestration only
- Separate query services for reads (CQRS)
- Use events for cross-aggregate coordination
- Domain services only when logic truly doesn't fit elsewhere

❌ **Don't**:
- Put business rules in application services (anemic domain)
- Load multiple aggregates in one transaction
- Mix commands and queries in same service
- Add state to services (use aggregates for state)

---

## References

- Domain Services (Eric Evans): https://www.domainlanguage.com/ddd/
- Application Services: https://www.culttt.com/2014/12/10/application-services-in-domain-driven-design
- Production Examples:
  - `services/finance/src/application/commands/handlers/*.handler.ts`
  - `services/finance/src/application/queries/handlers/*.handler.ts`

---

**Compounding Effect**: Clear separation prevents anemic domain models and keeps business logic testable and maintainable.
