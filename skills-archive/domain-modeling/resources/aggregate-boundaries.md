# Aggregate Boundaries Guide

Complete guide for designing aggregate boundaries in Vextrus ERP microservices with event sourcing.

---

## Overview

**Aggregate**: Consistency boundary - a cluster of entities and value objects treated as a single unit.

**Aggregate Root**: Entry point to the aggregate, enforces invariants.

**Key Rules**:
1. Reference other aggregates by ID only
2. One transaction = one aggregate
3. Small aggregates preferred
4. Invariants enforced within boundary

---

## Pattern 1: Invoice Aggregate

### Boundary Decision

**Inside Invoice Aggregate**:
- Invoice (root entity)
- LineItem (child entities)
- InvoiceNumber, Money, TaxRate (value objects)

**Outside Invoice Aggregate** (reference by ID):
- Customer (separate aggregate)
- Product (separate aggregate)
- Payment (separate aggregate)

**Why**:
- LineItems cannot exist without Invoice → Composition
- Customer exists independently → Reference
- One invoice transaction affects only invoice data

```typescript
export class Invoice extends AggregateRoot<InvoiceProps> {
  // Composition: LineItems inside aggregate
  private props: {
    lineItems: LineItem[]  // Owned
    customerId: string     // Reference only
    vendorId: string       // Reference only
  }

  addLineItem(
    productId: string,  // Reference, not loaded
    quantity: number,
    unitPrice: Money
  ): void {
    // Business rule: Cannot modify approved invoices
    if (this.status !== InvoiceStatus.DRAFT) {
      throw new CannotModifyApprovedInvoiceException()
    }

    const lineItem = {
      id: new LineItemId(uuidv4()),
      productId,  // Store ID, not full Product
      quantity,
      unitPrice,
      totalAmount: unitPrice.multiply(quantity),
    }

    this.props.lineItems.push(lineItem)
    this.recalculateTotals()
  }

  // Invariant: Grand total = subtotal + VAT
  private recalculateTotals(): void {
    const subtotal = this.props.lineItems.reduce(
      (sum, item) => sum.add(item.totalAmount),
      Money.create(0, 'BDT')
    )

    const vatAmount = this.props.lineItems.reduce((sum, item) => {
      const vat = item.totalAmount.multiply(item.taxRate.rate)
      return sum.add(vat)
    }, Money.create(0, 'BDT'))

    this.props.subtotal = subtotal
    this.props.vatAmount = vatAmount
    this.props.grandTotal = subtotal.add(vatAmount)
  }
}
```

**Transaction Scope**: Update invoice with line items in single transaction.

---

## Pattern 2: Payment Aggregate

### Boundary Decision

**Inside Payment Aggregate**:
- Payment (root)
- PaymentId, Money, MobileWallet (value objects)

**Outside** (reference by ID):
- Invoice (separate aggregate)
- BankAccount (separate aggregate)

**Why**:
- Payment lifecycle independent of Invoice
- One payment can be for multiple invoices (future)
- Payment reconciliation is payment concern

```typescript
export class Payment extends AggregateRoot<PaymentProps> {
  private props: {
    invoiceId: string  // Reference only
    amount: Money
    status: PaymentStatus
    mobileWallet?: MobileWallet
  }

  complete(userId: string): void {
    // Business rule: Must be in PROCESSING status
    if (this.status !== PaymentStatus.PROCESSING) {
      throw new InvalidPaymentStatusException()
    }

    this.apply(
      new PaymentCompletedEvent({
        aggregateId: this.id.value,
        tenantId: this.props.tenantId,
        userId,
        payload: {
          invoiceId: this.props.invoiceId,  // Include for event handlers
          amount: this.props.amount.amount,
          completedAt: new Date(),
        },
      })
    )
  }

  reconcile(bankTransaction: BankTransaction): void {
    // Business rule: Amount must match
    if (this.props.amount.amount !== bankTransaction.amount) {
      throw new ReconciliationAmountMismatchException()
    }

    // Business rule: Already reconciled
    if (this.props.status === PaymentStatus.RECONCILED) {
      throw new PaymentAlreadyReconciledException()
    }

    this.apply(new PaymentReconciledEvent(/* ... */))
  }
}
```

**Separate Transaction**: Payment completion != Invoice payment (eventually consistent via events).

---

## Pattern 3: Journal Entry Aggregate

### Boundary Decision

**Inside JournalEntry Aggregate**:
- JournalEntry (root)
- JournalLine (child entities)
- AccountCode, Money (value objects)

**Outside**:
- ChartOfAccount (separate aggregate)

**Why**:
- Invariant: Debits = Credits (enforced within journal)
- Journal lines cannot exist without journal
- Account balances updated via events (eventually consistent)

```typescript
export class JournalEntry extends AggregateRoot<JournalEntryProps> {
  private props: {
    lines: JournalLine[]
    status: JournalStatus
  }

  addLine(
    accountCode: AccountCode,
    debit: Money,
    credit: Money,
    description: string
  ): void {
    // Business rule: Cannot modify posted journal
    if (this.status === JournalStatus.POSTED) {
      throw new CannotModifyPostedJournalException()
    }

    const line = {
      id: new JournalLineId(uuidv4()),
      accountCode,
      debit,
      credit,
      description,
    }

    this.props.lines.push(line)
  }

  post(userId: string): void {
    // Invariant: Total debits = Total credits
    const totalDebits = this.props.lines.reduce(
      (sum, line) => sum.add(line.debit),
      Money.create(0, 'BDT')
    )

    const totalCredits = this.props.lines.reduce(
      (sum, line) => sum.add(line.credit),
      Money.create(0, 'BDT')
    )

    if (!totalDebits.equals(totalCredits)) {
      throw new UnbalancedJournalException(
        totalDebits.amount,
        totalCredits.amount
      )
    }

    this.apply(new JournalPostedEvent(/* ... */))
  }
}
```

**Invariant Enforcement**: Balanced journal enforced before posting.

---

## Pattern 4: Cross-Aggregate Updates (Eventually Consistent)

**Problem**: Invoice approved → Update customer credit limit (different aggregate).

**Solution**: Domain events + event handlers (eventual consistency).

### Invoice Aggregate

```typescript
export class Invoice extends AggregateRoot<InvoiceProps> {
  approve(userId: string): void {
    // Business rule checks...

    this.apply(
      new InvoiceApprovedEvent({
        aggregateId: this.id.value,
        payload: {
          customerId: this.props.customerId,
          grandTotal: this.props.grandTotal.amount,
        },
      })
    )
  }
}
```

### Application Layer Event Handler

```typescript
@EventsHandler(InvoiceApprovedEvent)
export class UpdateCustomerCreditOnInvoiceApprovalHandler {
  async handle(event: InvoiceApprovedEvent): Promise<void> {
    // Load customer aggregate
    const customer = await this.customerRepository.findById(
      event.payload.customerId
    )

    // Update customer (separate transaction)
    customer.increaseOutstandingBalance(
      Money.create(event.payload.grandTotal, 'BDT')
    )

    await this.customerRepository.save(customer)
  }
}
```

**Benefits**:
- No distributed transactions
- Each aggregate in own transaction
- Failures isolated
- Eventual consistency acceptable

---

## Aggregate Size Guidelines

### Small Aggregates (Preferred)

**Advantages**:
- Less contention (fewer conflicts)
- Faster transactions
- Easier to understand
- Better performance

**Example**: Payment aggregate (just Payment root, no child entities)

### Large Aggregates (Avoid)

**Warning Signs**:
- >5 child entity types
- Slow to load from database
- High transaction conflict rate
- Complex invariants across many entities

**Refactoring Strategy**: Split into multiple aggregates, use eventual consistency.

---

## Repository Pattern

### One Repository Per Aggregate Root

```typescript
// domain/repositories/invoice.repository.interface.ts
export interface IInvoiceRepository {
  save(invoice: Invoice): Promise<void>
  findById(id: InvoiceId, tenantId: string): Promise<Invoice | null>
}

// domain/repositories/payment.repository.interface.ts
export interface IPaymentRepository {
  save(payment: Payment): Promise<void>
  findById(id: PaymentId, tenantId: string): Promise<Payment | null>
}
```

**Don't Create**:
- LineItemRepository (line items accessed via Invoice)
- JournalLineRepository (journal lines accessed via JournalEntry)

---

## Event Sourcing Integration

### Event Stream Per Aggregate

```typescript
// infrastructure/persistence/event-store/invoice.repository.ts
export class InvoiceEventStoreRepository implements IInvoiceRepository {
  async save(invoice: Invoice): Promise<void> {
    const events = invoice.getDomainEvents()
    const streamName = `invoice-${invoice.id.value}`  // One stream per aggregate

    await this.eventStore.appendToStream(streamName, events)
    invoice.clearDomainEvents()
  }

  async findById(id: InvoiceId, tenantId: string): Promise<Invoice | null> {
    const streamName = `invoice-${id.value}`
    const events = await this.eventStore.readStream(streamName)

    if (!events.length) return null

    // Reconstitute aggregate from events
    const invoice = Invoice.reconstitute(id)
    invoice.loadFromHistory(events)

    return invoice
  }
}
```

**Stream Naming**: `{aggregate-type}-{aggregate-id}`

---

## Common Mistakes

### ❌ Mistake 1: Loading Full Related Aggregates

```typescript
// BAD: Loading full Customer aggregate
export class Invoice extends AggregateRoot<InvoiceProps> {
  customer: Customer  // Don't embed full aggregate!

  getTotalWithCustomerDiscount(): Money {
    return this.grandTotal.multiply(1 - this.customer.discountRate)
  }
}

// GOOD: Reference by ID, pass discount as parameter
export class Invoice extends AggregateRoot<InvoiceProps> {
  customerId: string  // Reference only

  applyCustomerDiscount(discountRate: number): Money {
    return this.grandTotal.multiply(1 - discountRate)
  }
}
```

### ❌ Mistake 2: Modifying Multiple Aggregates in One Transaction

```typescript
// BAD: Update invoice and customer in same transaction
async approveInvoice(invoiceId: string): Promise<void> {
  const invoice = await this.invoiceRepo.findById(invoiceId)
  const customer = await this.customerRepo.findById(invoice.customerId)

  invoice.approve()
  customer.increaseOutstandingBalance(invoice.grandTotal)

  await this.invoiceRepo.save(invoice)
  await this.customerRepo.save(customer)  // Don't do this!
}

// GOOD: Use events for cross-aggregate updates
async approveInvoice(invoiceId: string): Promise<void> {
  const invoice = await this.invoiceRepo.findById(invoiceId)
  invoice.approve()  // Emits InvoiceApprovedEvent

  await this.invoiceRepo.save(invoice)
  // Event handler updates customer separately
}
```

---

## Testing Aggregate Boundaries

```typescript
describe('Invoice Aggregate Boundary', () => {
  it('should enforce invariant within boundary', () => {
    const invoice = Invoice.create(/* ... */)

    invoice.addLineItem(/* ... */)
    invoice.addLineItem(/* ... */)

    // Invariant: Grand total = subtotal + VAT
    expect(invoice.grandTotal).toEqual(
      invoice.subtotal.add(invoice.vatAmount)
    )
  })

  it('should not load related aggregates', () => {
    const invoice = Invoice.create(/* ... */)

    // Only has customer ID, not full Customer aggregate
    expect(invoice.customerId).toBe('customer-123')
    expect(invoice.customer).toBeUndefined()
  })

  it('should emit events for cross-aggregate effects', () => {
    const invoice = Invoice.create(/* ... */)
    invoice.approve()

    const events = invoice.getDomainEvents()

    // InvoiceApprovedEvent includes customerId for handler
    const approvedEvent = events.find(e => e instanceof InvoiceApprovedEvent)
    expect(approvedEvent.payload.customerId).toBe('customer-123')
  })
})
```

---

## References

- Effective Aggregate Design (Vaughn Vernon): https://www.dddcommunity.org/library/vernon_2011/
- Event Sourcing Aggregates: https://eventstore.com/blog/event-sourcing-and-cqrs/
- Production Examples:
  - `services/finance/src/domain/aggregates/invoice/invoice.aggregate.ts`
  - `services/finance/src/domain/aggregates/payment/payment.aggregate.ts`

---

**Compounding Effect**: Well-defined aggregate boundaries reduce transaction conflicts by 70-90% and enable horizontal scaling.
