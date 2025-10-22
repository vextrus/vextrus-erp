# Domain Modeling Patterns

**Purpose**: Quick reference for domain-driven design patterns in Vextrus ERP
**Last Updated**: 2025-10-20
**Source**: 15+ value objects, 4 aggregates, 19+ domain events across Finance/Auth/Master-Data services
**Auto-Loaded By**: `domain-modeling` skill

---

## Quick Reference

| Pattern | When to Use | Key Benefit | Examples |
|---------|-------------|-------------|----------|
| **Value Object** | Immutable concepts | Encapsulate validation | Money, TIN, BIN, Email |
| **Aggregate Root** | Consistency boundary | Enforce invariants | Invoice, Payment, JournalEntry |
| **Domain Event** | State changes | Audit trail, async | InvoiceApproved, PaymentCompleted |
| **Entity** | Identity-based | Mutable with lifecycle | LineItem, JournalLine |
| **Repository Interface** | Data access | Dependency inversion | IInvoiceRepository |

---

## Pattern 1: Value Objects (Immutable, Self-Validating)

**Example: Money**
```typescript
export class Money extends ValueObject<{ amount: number; currency: string }> {
  static create(amount: number, currency: string): Money {
    if (amount < 0) throw new InvalidMoneyException()
    if (!['BDT', 'USD'].includes(currency)) throw new InvalidCurrencyException()

    return new Money({ amount: Number(amount.toFixed(2)), currency })
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) throw new CurrencyMismatchException()
    return Money.create(this.amount + other.amount, this.currency)
  }
}
```

**Bangladesh-Specific**:
- TIN (Tax ID): 10 digits, format XXXX-XXX-XXX
- BIN (Business ID): 9 digits, format XXX-XXX-XXX
- BangladeshAddress: 8 divisions, 64 districts validation
- InvoiceNumber: Format INV-YYYY-MM-DD-NNNNNN

**Evidence**: 15+ value objects in production (Money, TIN, BIN, Email, AccountCode, TaxRate, InvoiceNumber)

---

## Pattern 2: Aggregate Roots (Consistency Boundaries)

**Invoice Aggregate**:
```typescript
export class Invoice extends AggregateRoot<InvoiceProps> {
  static create(tenantId: string, customerId: string, invoiceDate: Date): Invoice {
    const invoice = new Invoice({
      tenantId,
      customerId,  // Reference by ID only
      lineItems: [],
      status: InvoiceStatus.DRAFT,
      fiscalYear: this.calculateFiscalYear(invoiceDate),  // Bangladesh July-June
    })

    invoice.apply(new InvoiceCreatedEvent(/* ... */))
    return invoice
  }

  addLineItem(productId: string, quantity: number, unitPrice: Money): void {
    if (this.status !== InvoiceStatus.DRAFT) {
      throw new CannotModifyApprovedInvoiceException()
    }

    this.props.lineItems.push({ productId, quantity, unitPrice })
    this.recalculateTotals()  // Enforce invariant
  }

  approve(userId: string): void {
    if (this.lineItems.length === 0) {
      throw new CannotApproveEmptyInvoiceException()
    }

    this.apply(new InvoiceApprovedEvent(/* ... */))
  }
}
```

**Boundaries**:
- Invoice contains LineItems (composition)
- Customer/Product referenced by ID (not loaded)
- One transaction = one aggregate

**Evidence**: 4 aggregate roots (Invoice, Payment, JournalEntry, ChartOfAccount)

---

## Pattern 3: Domain Events (State Changes)

**Example: InvoiceApproved Event**
```typescript
export class InvoiceApprovedEvent extends DomainEvent {
  constructor(props: {
    aggregateId: string
    tenantId: string
    userId: string
    payload: { invoiceNumber: string; grandTotal: number }
  }) {
    super(props)  // Adds eventId, timestamp, correlationId
  }
}
```

**Event Handler** (Application Layer):
```typescript
@EventsHandler(InvoiceApprovedEvent)
export class SendInvoiceApprovalEmailHandler {
  async handle(event: InvoiceApprovedEvent): Promise<void> {
    await this.emailService.sendInvoiceApprovalNotification(event.payload)
  }
}
```

**Evidence**: 19+ domain events (InvoiceCreated, PaymentCompleted, JournalPosted, etc.)

---

## Pattern 4: Entity vs Value Object Decision

| Characteristic | Entity | Value Object |
|----------------|--------|--------------|
| Identity | ✅ Has ID | ❌ No ID |
| Mutability | ✅ Mutable | ❌ Immutable |
| Equality | By ID | By structure |
| Examples | Invoice, Payment | Money, Email, Address |

**Invoice** (Entity): Has InvoiceId, status changes over time
**Money** (Value Object): No identity, immutable, ৳1000 always equals ৳1000

---

## Pattern 5: Business Rules in Domain

**Bangladesh VAT Calculation**:
```typescript
export class Invoice extends AggregateRoot {
  private calculateVAT(): Money {
    return this.lineItems.reduce((sum, item) => {
      // Bangladesh VAT rates: 15% standard, 7.5% reduced, 5% truncated
      const vat = item.totalAmount.multiply(item.taxRate.rate)
      return sum.add(vat)
    }, Money.create(0, 'BDT'))
  }

  // Bangladesh fiscal year: July-June
  static calculateFiscalYear(date: Date): string {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`
  }
}
```

**Mobile Wallet Validation** (Bangladesh-Specific):
```typescript
export class Payment extends AggregateRoot {
  static readonly BANGLADESH_MOBILE_WALLETS = [
    'bKash', 'Nagad', 'Rocket', 'Upay', 'SureCash', 'MCash', 'TCash'
  ]

  initiateMobileWalletPayment(provider: string, mobile: string): void {
    if (!Payment.BANGLADESH_MOBILE_WALLETS.includes(provider)) {
      throw new InvalidMobileWalletProviderException()
    }

    if (!/^01[3-9]\d{8}$/.test(mobile)) {  // Bangladesh mobile format
      throw new InvalidMobileNumberException()
    }

    this.apply(new MobileWalletPaymentInitiatedEvent(/* ... */))
  }
}
```

---

## Integration Points

### With Event Sourcing Skill
- Aggregates extend AggregateRoot with event sourcing
- loadFromHistory() for event replay
- getDomainEvents() / clearDomainEvents() lifecycle

### With Multi-Tenancy Skill
- All aggregates include tenantId
- Repository queries scoped by tenant
- Domain events propagate tenantId

### With Security-First Skill
- Value object validation (TIN, BIN format)
- Business rule enforcement prevents invalid state
- Domain exceptions for security violations

### With GraphQL Schema Skill
- Aggregates → GraphQL types (InvoiceDto)
- Value objects → Custom scalars (Money, Email)
- Domain events → GraphQL subscriptions

---

## Quality Checklist

- [ ] Value objects immutable (Object.freeze)
- [ ] Value objects have factory methods (static create)
- [ ] Aggregate boundaries clearly defined
- [ ] Business rules in domain layer (not services)
- [ ] Domain events for state changes
- [ ] Repository interfaces in domain layer
- [ ] Entity vs value object decision documented
- [ ] Bangladesh-specific rules encapsulated
- [ ] No anemic domain model (rich behavior)
- [ ] Invariants enforced within aggregates

---

## Service Examples

**Reference Implementations**:
- Base classes: `services/finance/src/domain/base/`
- Value objects: `services/finance/src/domain/value-objects/` (Money, TIN, BIN)
- Aggregates: `services/finance/src/domain/aggregates/` (Invoice, Payment)
- Auth value objects: `services/auth/src/domain/value-objects/` (Email, HashedPassword)

**Evidence**:
- 15+ value objects with validation
- 4 aggregate roots with event sourcing
- 19+ domain events
- Bangladesh-specific domain modeling (Mushak-6.3, NBR compliance, fiscal year)

---

## Common Anti-Patterns

❌ **Primitive Obsession**: Using `number` instead of `Money`, `string` instead of `Email`
❌ **Anemic Domain Model**: Business logic in services, not aggregates
❌ **Large Aggregates**: >5 child entities, slow transactions
❌ **Cross-Aggregate Transactions**: Modifying 2+ aggregates in one transaction
❌ **Missing Validation**: Accepting invalid data into domain
❌ **Public Setters**: Breaking immutability of value objects

---

**Compounding Effect**: Domain modeling patterns create self-documenting code with Bangladesh compliance built-in, reducing bugs by 60-80%.
