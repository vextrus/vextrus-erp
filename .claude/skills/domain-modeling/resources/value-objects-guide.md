# Value Objects Guide

Comprehensive guide for implementing value objects in Vextrus ERP microservices.

---

## Overview

**Value Object**: Immutable object defined by its attributes, not identity.

**Key Characteristics**:
- No identity (no ID field)
- Immutable (cannot change after creation)
- Structural equality (compare by values, not reference)
- Self-validating (validation in factory method)
- Side-effect-free operations (return new instances)

**When to Use**: Money, Email, Address, Date ranges, Phone numbers, Tax IDs

---

## Base Pattern

```typescript
// domain/base/value-object.base.ts
export abstract class ValueObject<T> {
  protected readonly props: T

  constructor(props: T) {
    this.props = Object.freeze(props) // Immutability
  }

  equals(other: ValueObject<T>): boolean {
    if (!other) return false
    return JSON.stringify(this.props) === JSON.stringify(other.props)
  }
}
```

---

## Pattern 1: Simple Value Object (Money)

```typescript
export class Money extends ValueObject<{ amount: number; currency: string }> {
  private constructor(props: { amount: number; currency: string }) {
    super(props)
  }

  // Factory method with validation
  static create(amount: number, currency: string): Money {
    if (amount < 0) {
      throw new InvalidMoneyException('Amount cannot be negative')
    }

    if (!['BDT', 'USD', 'EUR'].includes(currency)) {
      throw new InvalidCurrencyException(currency)
    }

    // Precision: 2 decimal places
    return new Money({
      amount: Number(amount.toFixed(2)),
      currency,
    })
  }

  // Immutable operations (return new instance)
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchException(this.currency, other.currency)
    }

    return Money.create(this.amount + other.amount, this.currency)
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchException()
    }

    return Money.create(this.amount - other.amount, this.currency)
  }

  multiply(factor: number): Money {
    return Money.create(this.amount * factor, this.currency)
  }

  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new DivisionByZeroException()
    }

    return Money.create(this.amount / divisor, this.currency)
  }

  // Getters (no setters!)
  get amount(): number {
    return this.props.amount
  }

  get currency(): string {
    return this.props.currency
  }

  // Formatting
  format(): string {
    const symbol = this.currency === 'BDT' ? '৳' : this.currency
    return `${symbol} ${this.amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  // Comparison
  isGreaterThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchException()
    }

    return this.amount > other.amount
  }

  isLessThan(other: Money): boolean {
    return !this.isGreaterThan(other) && !this.equals(other)
  }
}
```

**Usage**:
```typescript
const price = Money.create(1000.567, 'BDT') // Rounds to 1000.57
const vat = price.multiply(0.15) // VAT 15%
const total = price.add(vat)

console.log(total.format()) // "৳ 1,150.66"
```

---

## Pattern 2: Bangladesh-Specific Value Objects

### TIN (Tax Identification Number)

```typescript
export class TIN extends ValueObject<{ value: string }> {
  private constructor(props: { value: string }) {
    super(props)
  }

  static create(value: string): TIN {
    // Remove formatting if present
    const cleaned = value.replace(/[- ]/g, '')

    // Validate: 10 digits
    if (!/^\d{10}$/.test(cleaned)) {
      throw new InvalidTINException('TIN must be 10 digits')
    }

    return new TIN({ value: cleaned })
  }

  get value(): string {
    return this.props.value
  }

  // Format: XXXX-XXX-XXX
  format(): string {
    return `${this.value.slice(0, 4)}-${this.value.slice(4, 7)}-${this.value.slice(7)}`
  }

  // Mask for display: XXXX-XXX-123
  mask(): string {
    return `${this.value.slice(0, 4)}-XXX-${this.value.slice(7)}`
  }
}
```

### BIN (Business Identification Number)

```typescript
export class BIN extends ValueObject<{ value: string }> {
  private constructor(props: { value: string }) {
    super(props)
  }

  static create(value: string): BIN {
    const cleaned = value.replace(/[- ]/g, '')

    // Validate: 9 digits
    if (!/^\d{9}$/.test(cleaned)) {
      throw new InvalidBINException('BIN must be 9 digits')
    }

    return new BIN({ value: cleaned })
  }

  get value(): string {
    return this.props.value
  }

  // Format: XXX-XXX-XXX
  format(): string {
    return `${this.value.slice(0, 3)}-${this.value.slice(3, 6)}-${this.value.slice(6)}`
  }
}
```

### Bangladesh Address

```typescript
export class BangladeshAddress extends ValueObject<{
  division: string
  district: string
  upazila: string
  street: string
  postalCode: string
}> {
  static readonly DIVISIONS = [
    'Dhaka',
    'Chattogram',
    'Rajshahi',
    'Khulna',
    'Barishal',
    'Sylhet',
    'Rangpur',
    'Mymensingh',
  ]

  static readonly DISTRICTS_BY_DIVISION: Record<string, string[]> = {
    Dhaka: ['Dhaka', 'Gazipur', 'Narayanganj', 'Manikganj', /* ... */],
    Chattogram: ['Chattogram', "Cox's Bazar", 'Cumilla', /* ... */],
    // ... other divisions
  }

  private constructor(props) {
    super(props)
  }

  static create(
    division: string,
    district: string,
    upazila: string,
    street: string,
    postalCode: string
  ): BangladeshAddress {
    // Validate division
    if (!this.DIVISIONS.includes(division)) {
      throw new InvalidDivisionException(division)
    }

    // Validate district belongs to division
    const validDistricts = this.DISTRICTS_BY_DIVISION[division]
    if (!validDistricts.includes(district)) {
      throw new DistrictNotInDivisionException(district, division)
    }

    // Validate postal code (4 digits)
    if (!/^\d{4}$/.test(postalCode)) {
      throw new InvalidPostalCodeException(postalCode)
    }

    return new BangladeshAddress({
      division,
      district,
      upazila,
      street,
      postalCode,
    })
  }

  format(): string {
    return `${this.street}, ${this.upazila}, ${this.district}, ${this.division} - ${this.postalCode}`
  }
}
```

---

## Pattern 3: Email Value Object

```typescript
export class Email extends ValueObject<{ value: string }> {
  private static readonly EMAIL_REGEX =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

  private constructor(props: { value: string }) {
    super(props)
  }

  static create(value: string): Email {
    const normalized = value.toLowerCase().trim()

    if (!this.EMAIL_REGEX.test(normalized)) {
      throw new InvalidEmailException(value)
    }

    return new Email({ value: normalized })
  }

  get value(): string {
    return this.props.value
  }

  get localPart(): string {
    return this.value.split('@')[0]
  }

  get domain(): string {
    return this.value.split('@')[1]
  }

  // Mask for display: j***@example.com
  mask(): string {
    const [local, domain] = this.value.split('@')
    return `${local[0]}***@${domain}`
  }
}
```

---

## Pattern 4: Invoice Number Value Object

```typescript
export class InvoiceNumber extends ValueObject<{ value: string }> {
  // Format: INV-YYYY-MM-DD-NNNNNN
  private static readonly PATTERN = /^INV-\d{4}-\d{2}-\d{2}-\d{6}$/

  private constructor(props: { value: string }) {
    super(props)
  }

  static create(value: string): InvoiceNumber {
    if (!this.PATTERN.test(value)) {
      throw new InvalidInvoiceNumberException(value)
    }

    return new InvoiceNumber({ value })
  }

  static generate(date: Date, sequence: number): InvoiceNumber {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const seq = String(sequence).padStart(6, '0')

    return new InvoiceNumber({
      value: `INV-${year}-${month}-${day}-${seq}`,
    })
  }

  get value(): string {
    return this.props.value
  }

  get date(): Date {
    const [_, year, month, day] = this.value.split('-')
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }

  get sequence(): number {
    return parseInt(this.value.split('-')[4])
  }
}
```

---

## Pattern 5: Tax Rate Value Object

```typescript
export class TaxRate extends ValueObject<{ rate: number; category: VATCategory }> {
  // Bangladesh VAT rates
  static readonly STANDARD = new TaxRate({ rate: 0.15, category: 'STANDARD' })
  static readonly REDUCED = new TaxRate({ rate: 0.075, category: 'REDUCED' })
  static readonly ZERO = new TaxRate({ rate: 0, category: 'ZERO_RATED' })
  static readonly EXEMPT = new TaxRate({ rate: 0, category: 'EXEMPT' })

  private constructor(props: { rate: number; category: VATCategory }) {
    super(props)
  }

  static create(rate: number, category: VATCategory): TaxRate {
    if (rate < 0 || rate > 1) {
      throw new InvalidTaxRateException('Tax rate must be between 0 and 1')
    }

    return new TaxRate({ rate, category })
  }

  get rate(): number {
    return this.props.rate
  }

  get category(): VATCategory {
    return this.props.category
  }

  get percentage(): number {
    return this.rate * 100
  }

  apply(amount: Money): Money {
    return amount.multiply(this.rate)
  }

  format(): string {
    return `${this.percentage}% (${this.category})`
  }
}
```

---

## Testing Value Objects

```typescript
describe('Money Value Object', () => {
  it('should create valid money', () => {
    const money = Money.create(1000, 'BDT')

    expect(money.amount).toBe(1000)
    expect(money.currency).toBe('BDT')
  })

  it('should throw on negative amount', () => {
    expect(() => Money.create(-100, 'BDT')).toThrow(InvalidMoneyException)
  })

  it('should add two money values', () => {
    const money1 = Money.create(1000, 'BDT')
    const money2 = Money.create(500, 'BDT')

    const result = money1.add(money2)

    expect(result.amount).toBe(1500)
  })

  it('should throw on currency mismatch', () => {
    const bdt = Money.create(1000, 'BDT')
    const usd = Money.create(100, 'USD')

    expect(() => bdt.add(usd)).toThrow(CurrencyMismatchException)
  })

  it('should be immutable', () => {
    const money = Money.create(1000, 'BDT')
    const doubled = money.multiply(2)

    expect(money.amount).toBe(1000) // Original unchanged
    expect(doubled.amount).toBe(2000)
  })

  it('should have structural equality', () => {
    const money1 = Money.create(1000, 'BDT')
    const money2 = Money.create(1000, 'BDT')
    const money3 = Money.create(2000, 'BDT')

    expect(money1.equals(money2)).toBe(true)
    expect(money1.equals(money3)).toBe(false)
  })
})
```

---

## Best Practices

✅ **Do**:
- Make value objects immutable (Object.freeze)
- Validate in factory method (static create)
- Return new instances from operations
- Use structural equality (not identity)
- Encapsulate business logic (e.g., Money.add)
- Provide formatting methods (format, mask)
- Test validation, immutability, operations

❌ **Don't**:
- Add setters (breaks immutability)
- Use public constructor (use factory method)
- Add identity (use Entity for that)
- Mutate internal state
- Compare by reference (use equals)
- Return same instance from operations

---

## References

- Value Objects: https://martinfowler.com/bliki/ValueObject.html
- DDD Value Objects: https://www.domainlanguage.com/ddd/reference/
- Production Examples:
  - `services/finance/src/domain/value-objects/money.value-object.ts`
  - `services/finance/src/domain/value-objects/tin.value-object.ts`
  - `services/auth/src/domain/value-objects/email.value-object.ts`

---

**Compounding Effect**: Value objects eliminate primitive obsession and encapsulate validation, reducing bugs by 60-80%.
