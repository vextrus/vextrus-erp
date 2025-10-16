import { BadRequestException } from '@nestjs/common';

/**
 * Money Value Object
 * Handles monetary amounts with currency support
 *
 * Business Rules:
 * - Immutable once created
 * - Amount stored as integer (smallest currency unit - paisa for BDT)
 * - Supports multi-currency operations
 * - Default currency: BDT (Bangladesh Taka)
 * - Precision: 2 decimal places
 */
export class Money {
  private readonly amount: number; // Stored in smallest unit (paisa)
  private readonly currency: string;

  // Supported currencies
  private static readonly SUPPORTED_CURRENCIES = ['BDT', 'USD', 'EUR', 'GBP', 'INR'];
  private static readonly DEFAULT_CURRENCY = 'BDT';

  private constructor(amount: number, currency: string) {
    this.amount = amount;
    this.currency = currency;
  }

  /**
   * Create Money from decimal amount
   * @param amount - Amount in major currency unit (e.g., 100.50 BDT)
   * @param currency - Currency code (default: BDT)
   */
  static create(amount: number, currency: string = Money.DEFAULT_CURRENCY): Money {
    if (amount === null || amount === undefined) {
      throw new BadRequestException('Amount cannot be null or undefined');
    }

    if (isNaN(amount) || !isFinite(amount)) {
      throw new BadRequestException('Amount must be a valid number');
    }

    const normalizedCurrency = currency.toUpperCase();
    this.validateCurrency(normalizedCurrency);

    // Convert to smallest unit (paisa)
    const amountInSmallestUnit = Math.round(amount * 100);

    return new Money(amountInSmallestUnit, normalizedCurrency);
  }

  /**
   * Create Money from smallest unit (paisa)
   * @param amountInPaisa - Amount in paisa (e.g., 10050 = 100.50 BDT)
   * @param currency - Currency code
   */
  static fromSmallestUnit(amountInPaisa: number, currency: string = Money.DEFAULT_CURRENCY): Money {
    if (amountInPaisa === null || amountInPaisa === undefined) {
      throw new BadRequestException('Amount cannot be null or undefined');
    }

    const normalizedCurrency = currency.toUpperCase();
    this.validateCurrency(normalizedCurrency);

    return new Money(amountInPaisa, normalizedCurrency);
  }

  /**
   * Create zero money
   */
  static zero(currency: string = Money.DEFAULT_CURRENCY): Money {
    return Money.create(0, currency);
  }

  /**
   * Validate currency code
   */
  private static validateCurrency(currency: string): void {
    if (!this.SUPPORTED_CURRENCIES.includes(currency)) {
      throw new BadRequestException(
        `Unsupported currency: ${currency}. Supported: ${this.SUPPORTED_CURRENCIES.join(', ')}`
      );
    }
  }

  /**
   * Get amount in major unit (e.g., 100.50)
   */
  getAmount(): number {
    return this.amount / 100;
  }

  /**
   * Get amount in smallest unit (paisa)
   */
  getAmountInSmallestUnit(): number {
    return this.amount;
  }

  /**
   * Get currency code
   */
  getCurrency(): string {
    return this.currency;
  }

  /**
   * Add two Money objects
   * @throws BadRequestException if currencies don't match
   */
  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  /**
   * Subtract two Money objects
   * @throws BadRequestException if currencies don't match
   */
  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  /**
   * Multiply by a factor
   */
  multiply(factor: number): Money {
    if (isNaN(factor) || !isFinite(factor)) {
      throw new BadRequestException('Factor must be a valid number');
    }
    return new Money(Math.round(this.amount * factor), this.currency);
  }

  /**
   * Divide by a divisor
   */
  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new BadRequestException('Cannot divide by zero');
    }
    if (isNaN(divisor) || !isFinite(divisor)) {
      throw new BadRequestException('Divisor must be a valid number');
    }
    return new Money(Math.round(this.amount / divisor), this.currency);
  }

  /**
   * Calculate percentage
   * @param percentage - Percentage value (e.g., 15 for 15%)
   */
  percentage(percentage: number): Money {
    return this.multiply(percentage / 100);
  }

  /**
   * Check if amount is zero
   */
  isZero(): boolean {
    return this.amount === 0;
  }

  /**
   * Check if amount is positive
   */
  isPositive(): boolean {
    return this.amount > 0;
  }

  /**
   * Check if amount is negative
   */
  isNegative(): boolean {
    return this.amount < 0;
  }

  /**
   * Get absolute value
   */
  abs(): Money {
    return new Money(Math.abs(this.amount), this.currency);
  }

  /**
   * Negate the amount
   */
  negate(): Money {
    return new Money(-this.amount, this.currency);
  }

  /**
   * Compare with another Money object
   * @returns true if equal
   */
  equals(other: Money): boolean {
    if (!other) return false;
    return this.amount === other.amount && this.currency === other.currency;
  }

  /**
   * Greater than comparison
   */
  greaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  /**
   * Greater than or equal comparison
   */
  greaterThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount >= other.amount;
  }

  /**
   * Less than comparison
   */
  lessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount < other.amount;
  }

  /**
   * Less than or equal comparison
   */
  lessThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount <= other.amount;
  }

  /**
   * Assert same currency for operations
   */
  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new BadRequestException(
        `Cannot perform operation on different currencies: ${this.currency} vs ${other.currency}`
      );
    }
  }

  /**
   * Format for display
   * @returns Formatted string (e.g., "৳ 1,234.56" for BDT)
   */
  format(): string {
    const amount = this.getAmount();
    const formatted = amount.toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const symbols: Record<string, string> = {
      BDT: '৳',
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
    };

    const symbol = symbols[this.currency] || this.currency;
    return `${symbol} ${formatted}`;
  }

  /**
   * String representation
   */
  toString(): string {
    return `${this.getAmount()} ${this.currency}`;
  }

  /**
   * JSON serialization
   */
  toJSON(): { amount: number; currency: string } {
    return {
      amount: this.getAmount(),
      currency: this.currency,
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json: { amount: number; currency: string }): Money {
    return Money.create(json.amount, json.currency);
  }

  /**
   * Create from database value (can be null)
   */
  static fromNullable(amount: number | null | undefined, currency?: string): Money | null {
    if (amount === null || amount === undefined) return null;
    return Money.create(amount, currency);
  }

  /**
   * Sum array of Money objects
   * @throws BadRequestException if currencies don't match
   */
  static sum(amounts: Money[]): Money {
    if (amounts.length === 0) {
      return Money.zero();
    }

    const currency = amounts[0].currency;
    const total = amounts.reduce((sum, money) => {
      if (money.currency !== currency) {
        throw new BadRequestException('Cannot sum Money objects with different currencies');
      }
      return sum + money.amount;
    }, 0);

    return new Money(total, currency);
  }

  /**
   * Calculate VAT (Bangladesh standard rate: 15%)
   */
  calculateVAT(rate: number = 15): Money {
    return this.percentage(rate);
  }

  /**
   * Add VAT to amount
   */
  withVAT(rate: number = 15): Money {
    return this.add(this.calculateVAT(rate));
  }
}
