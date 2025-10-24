---
name: Domain Modeling
description: When implementing domain logic, creating value objects, defining aggregate boundaries, or enforcing business rules, activate this skill to enforce domain-driven design patterns. Use when user says "value object", "aggregate", "domain", "entity", "business rule", "DDD", or when working with domain layer code in services/*/src/domain/.
knowledge_base:
  - sessions/knowledge/vextrus-erp/patterns/domain-modeling-patterns.md
  - sessions/knowledge/vextrus-erp/patterns/event-sourcing-patterns.md
---

# Domain Modeling Skill

**Purpose**: Domain-driven design with value objects, aggregates, and business rule encapsulation.

**Addresses**: Anemic domain models, scattered business logic, poor aggregate boundaries, missing validation.

**Evidence**:
- 15+ value objects (Money, TIN, BIN, Email, InvoiceNumber, AccountCode, BangladeshAddress)
- 4 aggregate roots with event sourcing (Invoice, Payment, JournalEntry, ChartOfAccount)
- 19+ domain events
- Bangladesh-specific domain modeling (Mushak-6.3, NBR compliance, fiscal year)
- Clear entity/value object distinction

---

## Quick Reference

| Pattern | When to Use | Key Benefit |
|---------|-------------|-------------|
| **Value Object** | Immutable concepts (Money, Email, Address) | Encapsulate validation, prevent invalid state |
| **Aggregate Root** | Consistency boundary (Invoice, Payment) | Enforce invariants, transactional boundary |
| **Domain Event** | State changes (InvoiceApproved, PaymentCompleted) | Audit trail, async processing |
| **Entity** | Identity-based (LineItem within Invoice) | Mutable state with lifecycle |
| **Business Rules** | Domain logic (VAT calculation, fiscal year) | Prevent anemic models |

---

## Pattern 1: Value Objects

**Problem**: Primitive obsession, scattered validation, mutable state.

**Solution**: Immutable value objects with encapsulated validation.

### Base Value Object Pattern

```typescript
// domain/base/value-object.base.ts
export abstract class ValueObject<T> {
  protected readonly props: T

  constructor(props: T) {
    this.props = Object.freeze(props)
  }

  // Structural equality (not identity)
  equals(other: ValueObject<T>): boolean {
    if (!other) return false
    return JSON.stringify(this.props) === JSON.stringify(other.props)
  }
}
```

### Money Value Object Example

```typescript
// domain/value-objects/money.value-object.ts
export class Money extends ValueObject<{ amount: number; currency: string }> {
  private constructor(props: { amount: number; currency: string }) {
    super(props)
  }

  static create(amount: number, currency: string): Money {
    // Validation in factory method
    if (amount < 0) {
      throw new InvalidMoneyException('Amount cannot be negative')
    }

    if (!['BDT', 'USD', 'EUR'].includes(currency)) {
      throw new InvalidCurrencyException(currency)
    }

    return new Money({ amount: Number(amount.toFixed(2)), currency })
  }

  // Business operations
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchException(this.currency, other.currency)
    }

    return Money.create(this.amount + other.amount, this.currency)
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchException(this.currency, other.currency)
    }

    return Money.create(this.amount - other.amount, this.currency)
  }

  multiply(factor: number): Money {
    return Money.create(this.amount * factor, this.currency)
  }

  // Getters
  get amount(): number {
    return this.props.amount
  }

  get currency(): string {
    return this.props.currency
  }

  // Formatting
  format(): string {
    const symbol = this.currency === 'BDT' ? '৳' : this.currency
    return `${symbol} ${this.amount.toLocaleString()}`
  }
}
```

**Bangladesh-Specific Value Objects**:
```typescript
// TIN (Tax Identification Number)
export class TIN extends ValueObject<{ value: string }> {
  static create(value: string): TIN {
    if (!/^\d{10}$/.test(value)) {
      throw new InvalidTINException('TIN must be 10 digits')
    }
    return new TIN({ value })
  }

  format(): string {
    // Format: XXXX-XXX-XXX
    return `${this.value.slice(0, 4)}-${this.value.slice(4, 7)}-${this.value.slice(7)}`
  }
}

// BIN (Business Identification Number)
export class BIN extends ValueObject<{ value: string }> {
  static create(value: string): BIN {
    if (!/^\d{9}$/.test(value)) {
      throw new InvalidBINException('BIN must be 9 digits')
    }
    return new BIN({ value })
  }

  format(): string {
    // Format: XXX-XXX-XXX
    return `${this.value.slice(0, 3)}-${this.value.slice(3, 6)}-${this.value.slice(6)}`
  }
}
```

**See**: resources/value-objects-guide.md for complete patterns.

---

## Pattern 2: Aggregate Roots

**Problem**: Scattered business logic, weak consistency boundaries, unclear transactional scope.

**Solution**: Aggregate root with clear boundaries and invariant enforcement.

### Base Aggregate Pattern

```typescript
// domain/base/aggregate-root.base.ts
export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = []
  protected _version: number = 0

  // Domain event management
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event)
  }

  getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents]
  }

  clearDomainEvents(): void {
    this._domainEvents = []
  }

  // Event sourcing support
  loadFromHistory(events: DomainEvent[]): void {
    events.forEach(event => this.apply(event, false))
    this._version = events.length
  }

  protected apply(event: DomainEvent, isNew: boolean = true): void {
    this.when(event) // Mutate state
    if (isNew) {
      this.addDomainEvent(event)
    }
  }

  protected abstract when(event: DomainEvent): void
}
```

### Invoice Aggregate Example

```typescript
// domain/aggregates/invoice/invoice.aggregate.ts
export class Invoice extends AggregateRoot<InvoiceProps> {
  private constructor(props: InvoiceProps, id?: InvoiceId) {
    super(props, id)
  }

  // Factory method
  static create(
    tenantId: string,
    customerId: string,
    invoiceDate: Date,
    userId: string
  ): Invoice {
    const invoice = new Invoice({
      tenantId,
      customerId,
      invoiceNumber: InvoiceNumber.generate(invoiceDate),
      invoiceDate,
      status: InvoiceStatus.DRAFT,
      lineItems: [],
      subtotal: Money.create(0, 'BDT'),
      vatAmount: Money.create(0, 'BDT'),
      grandTotal: Money.create(0, 'BDT'),
      fiscalYear: this.calculateFiscalYear(invoiceDate),
    })

    // Domain event
    invoice.apply(
      new InvoiceCreatedEvent({
        aggregateId: invoice.id.value,
        tenantId,
        userId,
        payload: {
          customerId,
          invoiceNumber: invoice.props.invoiceNumber.value,
          invoiceDate,
        },
      })
    )

    return invoice
  }

  // Business method
  addLineItem(
    productId: string,
    description: string,
    quantity: number,
    unitPrice: Money,
    taxRate: TaxRate,
    userId: string
  ): void {
    // Business rule: Cannot modify approved/paid invoices
    if (this.props.status !== InvoiceStatus.DRAFT) {
      throw new CannotModifyApprovedInvoiceException(this.id.value)
    }

    const lineItem = {
      id: new LineItemId(uuidv4()),
      productId,
      description,
      quantity,
      unitPrice,
      taxRate,
      totalAmount: unitPrice.multiply(quantity),
    }

    this.apply(
      new LineItemAddedEvent({
        aggregateId: this.id.value,
        tenantId: this.props.tenantId,
        userId,
        payload: lineItem,
      })
    )

    // Recalculate totals
    this.recalculateTotals(userId)
  }

  approve(userId: string): void {
    // Business rule: Only DRAFT invoices can be approved
    if (this.props.status !== InvoiceStatus.DRAFT) {
      throw new InvalidInvoiceStatusException(
        this.props.status,
        InvoiceStatus.DRAFT
      )
    }

    // Business rule: Invoice must have line items
    if (this.props.lineItems.length === 0) {
      throw new CannotApproveEmptyInvoiceException(this.id.value)
    }

    this.apply(
      new InvoiceApprovedEvent({
        aggregateId: this.id.value,
        tenantId: this.props.tenantId,
        userId,
        payload: {
          approvedAt: new Date(),
          grandTotal: this.props.grandTotal.amount,
        },
      })
    )
  }

  // Event handler (state mutation)
  protected when(event: DomainEvent): void {
    if (event instanceof InvoiceCreatedEvent) {
      // Initial state already set in constructor
    } else if (event instanceof LineItemAddedEvent) {
      this.props.lineItems.push(event.payload)
    } else if (event instanceof InvoiceApprovedEvent) {
      this.props.status = InvoiceStatus.APPROVED
    } else if (event instanceof InvoiceCancelledEvent) {
      this.props.status = InvoiceStatus.CANCELLED
    }
  }

  // Bangladesh-specific business logic
  private static calculateFiscalYear(date: Date): string {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    // Bangladesh fiscal year: July-June
    return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`
  }

  private recalculateTotals(userId: string): void {
    const subtotal = this.props.lineItems.reduce(
      (sum, item) => sum.add(item.totalAmount),
      Money.create(0, 'BDT')
    )

    const vatAmount = this.props.lineItems.reduce((sum, item) => {
      const vat = item.totalAmount.multiply(item.taxRate.rate)
      return sum.add(vat)
    }, Money.create(0, 'BDT'))

    const grandTotal = subtotal.add(vatAmount)

    this.apply(
      new InvoiceCalculatedEvent({
        aggregateId: this.id.value,
        tenantId: this.props.tenantId,
        userId,
        payload: { subtotal, vatAmount, grandTotal },
      })
    )
  }
}
```

**Aggregate Boundaries**:
- **Invoice** (root) contains **LineItem** entities (composition)
- Customer referenced by ID (not composition)
- Payment referenced by ID (separate aggregate)

**See**: resources/aggregate-boundaries.md for boundary design patterns.

---

## Pattern 3: Domain Events

**Problem**: Missing audit trail, scattered side effects, tight coupling.

**Solution**: Domain events for state changes.

### Base Domain Event

```typescript
// domain/base/domain-event.base.ts
export abstract class DomainEvent {
  readonly eventId: string
  readonly aggregateId: string
  readonly eventType: string
  readonly eventVersion: number
  readonly timestamp: Date
  readonly tenantId: string
  readonly userId: string
  readonly correlationId: string
  readonly payload: any

  constructor(props: DomainEventProps) {
    this.eventId = uuidv4()
    this.aggregateId = props.aggregateId
    this.eventType = this.constructor.name
    this.eventVersion = props.eventVersion || 1
    this.timestamp = new Date()
    this.tenantId = props.tenantId
    this.userId = props.userId
    this.correlationId = props.correlationId || uuidv4()
    this.payload = props.payload
  }
}
```

### Domain Event Examples

```typescript
// InvoiceCreatedEvent
export class InvoiceCreatedEvent extends DomainEvent {
  constructor(props: {
    aggregateId: string
    tenantId: string
    userId: string
    payload: {
      customerId: string
      invoiceNumber: string
      invoiceDate: Date
    }
  }) {
    super(props)
  }
}

// PaymentCompletedEvent
export class PaymentCompletedEvent extends DomainEvent {
  constructor(props: {
    aggregateId: string
    tenantId: string
    userId: string
    payload: {
      invoiceId: string
      amount: number
      currency: string
      completedAt: Date
    }
  }) {
    super(props)
  }
}
```

**Event Handlers** (Application Layer):
```typescript
@EventsHandler(InvoiceApprovedEvent)
export class SendInvoiceApprovalEmailHandler {
  async handle(event: InvoiceApprovedEvent): Promise<void> {
    await this.emailService.sendInvoiceApprovalNotification(
      event.payload.customerId,
      event.payload.invoiceNumber
    )
  }
}
```

---

## Pattern 4: Entity vs Value Object

**Entity**: Identity-based, mutable, has lifecycle.
**Value Object**: Structural equality, immutable, no identity.

### Decision Matrix

| Characteristic | Entity | Value Object |
|----------------|--------|--------------|
| Identity | ✅ Has ID | ❌ No ID |
| Mutability | ✅ Mutable | ❌ Immutable |
| Equality | By ID | By structure |
| Lifecycle | Has state changes | Created once |
| Examples | Invoice, Payment, User | Money, Email, Address |

### Implementation Comparison

```typescript
// Entity: Invoice (identity-based)
export class Invoice extends Entity<InvoiceProps> {
  private constructor(props: InvoiceProps, id?: InvoiceId) {
    super(props, id || new InvoiceId(uuidv4()))
  }

  // Mutable operations
  approve(): void {
    this.props.status = InvoiceStatus.APPROVED
  }

  // Equality by ID
  equals(other: Invoice): boolean {
    return this.id.equals(other.id)
  }
}

// Value Object: Money (structural equality)
export class Money extends ValueObject<{ amount: number; currency: string }> {
  private constructor(props) {
    super(Object.freeze(props)) // Immutable
  }

  // Immutable operations (return new instance)
  add(other: Money): Money {
    return Money.create(this.amount + other.amount, this.currency)
  }

  // Equality by structure
  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency
  }
}
```

---

## Pattern 5: Business Rules in Domain

**Problem**: Business logic in controllers/services (anemic domain model).

**Solution**: Encapsulate business rules in aggregates and value objects.

### Business Rule Examples

```typescript
// Payment aggregate - Mobile wallet validation
export class Payment extends AggregateRoot<PaymentProps> {
  static readonly BANGLADESH_MOBILE_WALLETS = [
    'bKash',
    'Nagad',
    'Rocket',
    'Upay',
    'SureCash',
    'MCash',
    'TCash',
  ]

  initiateMobileWalletPayment(
    walletProvider: string,
    mobileNumber: string,
    userId: string
  ): void {
    // Business rule: Valid wallet provider
    if (!Payment.BANGLADESH_MOBILE_WALLETS.includes(walletProvider)) {
      throw new InvalidMobileWalletProviderException(walletProvider)
    }

    // Business rule: Valid Bangladesh mobile number
    if (!/^01[3-9]\d{8}$/.test(mobileNumber)) {
      throw new InvalidMobileNumberException(mobileNumber)
    }

    // Business rule: Payment must be in PENDING status
    if (this.props.status !== PaymentStatus.PENDING) {
      throw new InvalidPaymentStatusException(
        this.props.status,
        PaymentStatus.PENDING
      )
    }

    this.apply(
      new MobileWalletPaymentInitiatedEvent({
        aggregateId: this.id.value,
        tenantId: this.props.tenantId,
        userId,
        payload: { walletProvider, mobileNumber },
      })
    )
  }

  reconcile(bankTransaction: BankTransaction, userId: string): void {
    // Business rule: Payment must be COMPLETED
    if (this.props.status !== PaymentStatus.COMPLETED) {
      throw new CannotReconcileNonCompletedPaymentException(this.id.value)
    }

    // Business rule: Amount must match
    if (this.props.amount.amount !== bankTransaction.amount) {
      throw new ReconciliationAmountMismatchException(
        this.props.amount.amount,
        bankTransaction.amount
      )
    }

    // Business rule: Date within ±3 days
    const daysDiff = Math.abs(
      differenceInDays(this.props.completedAt, bankTransaction.date)
    )
    if (daysDiff > 3) {
      throw new ReconciliationDateMismatchException(daysDiff)
    }

    this.apply(
      new PaymentReconciledEvent({
        aggregateId: this.id.value,
        tenantId: this.props.tenantId,
        userId,
        payload: { bankTransactionId: bankTransaction.id },
      })
    )
  }
}
```

---

## Pattern 6: Repository Interfaces in Domain

**Problem**: Domain depends on infrastructure (violates DIP).

**Solution**: Define repository interfaces in domain, implement in infrastructure.

### Domain Layer

```typescript
// domain/repositories/invoice.repository.interface.ts
export interface IInvoiceRepository {
  save(invoice: Invoice): Promise<void>
  findById(id: InvoiceId, tenantId: string): Promise<Invoice | null>
  findByInvoiceNumber(
    invoiceNumber: InvoiceNumber,
    tenantId: string
  ): Promise<Invoice | null>
  findByCustomer(customerId: string, tenantId: string): Promise<Invoice[]>
}
```

### Infrastructure Layer

```typescript
// infrastructure/persistence/event-store/invoice.repository.ts
@Injectable()
export class InvoiceEventStoreRepository implements IInvoiceRepository {
  constructor(private readonly eventStore: EventStoreDBClient) {}

  async save(invoice: Invoice): Promise<void> {
    const events = invoice.getDomainEvents()
    const stream = `invoice-${invoice.id.value}`

    await this.eventStore.appendToStream(stream, events)
    invoice.clearDomainEvents()
  }

  async findById(id: InvoiceId, tenantId: string): Promise<Invoice | null> {
    const stream = `invoice-${id.value}`
    const events = await this.eventStore.readStream(stream)

    if (!events.length) return null

    const invoice = Invoice.reconstitute(id)
    invoice.loadFromHistory(events)

    // Security: Verify tenant
    if (invoice.props.tenantId !== tenantId) {
      throw new TenantMismatchException()
    }

    return invoice
  }
}
```

**See**: resources/domain-services.md for domain vs application service patterns.

---

## Integration Points

### With Event Sourcing Skill
- Aggregate roots extend AggregateRoot base class
- Domain events for audit trail
- Event replay via loadFromHistory()
- Snapshot support for performance

### With Multi-Tenancy Skill
- Tenant ID in all aggregates and value objects
- Repository queries scoped by tenant
- Domain events include tenantId

### With Security-First Skill
- Value object validation (TIN, BIN, Email)
- Business rule enforcement prevents invalid state
- Domain exceptions for rule violations

### With GraphQL Schema Skill
- Aggregates → GraphQL types
- Domain events → subscriptions
- Value objects → custom scalars

---

## Quality Checklist

Before completing task:
- [ ] Value objects are immutable (Object.freeze)
- [ ] Value objects have factory methods (static create)
- [ ] Aggregate boundaries clearly defined
- [ ] Business rules in domain layer (not services)
- [ ] Domain events for state changes
- [ ] Repository interfaces in domain layer
- [ ] Entity vs value object decision documented
- [ ] Bangladesh-specific rules encapsulated
- [ ] No anemic domain model (rich behavior)
- [ ] Invariants enforced in aggregates

---

## Service Examples

**Reference Implementations**:
- **Base Classes**: `services/finance/src/domain/base/` (value-object.base.ts, aggregate-root.base.ts, entity.base.ts)
- **Value Objects**: `services/finance/src/domain/value-objects/` (Money, TIN, BIN, InvoiceNumber)
- **Aggregates**: `services/finance/src/domain/aggregates/` (Invoice, Payment, JournalEntry)
- **Domain Events**: Embedded in aggregate files

**Evidence**:
- 15+ value objects with validation
- 4 aggregate roots with event sourcing
- 19+ domain events
- Bangladesh-specific domain modeling (Mushak-6.3, NBR, fiscal year)
- Clear entity/value object distinction

---

## External Resources

- Domain-Driven Design (Eric Evans): https://www.domainlanguage.com/ddd/
- Implementing Domain-Driven Design (Vaughn Vernon)
- Value Objects Explained: https://martinfowler.com/bliki/ValueObject.html
- Aggregate Design: https://www.dddcommunity.org/library/vernon_2011/

---

**Compounding Effect**: Domain modeling patterns create self-documenting code with Bangladesh compliance built-in, reducing bugs and improving maintainability.
