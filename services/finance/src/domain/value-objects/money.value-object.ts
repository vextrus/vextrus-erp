import { ValueObject } from '../base/value-object.base';

export interface MoneyProps {
  amount: number;
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  // Getter methods for compatibility
  getAmount(): number {
    return this.props.amount;
  }

  getCurrency(): string {
    return this.props.currency;
  }

  static create(amount: number, currency: string = 'BDT'): Money {
    return new Money({ amount: Math.round(amount * 100) / 100, currency: currency.toUpperCase() });
  }

  static fromAmount(amount: number, currency: string = 'BDT'): Money {
    return Money.create(amount, currency);
  }

  static zero(currency: string = 'BDT'): Money {
    return new Money({ amount: 0, currency: currency.toUpperCase() });
  }

  add(money: Money): Money {
    if (!this.isSameCurrency(money.currency)) {
      throw new Error('Cannot add money with different currencies');
    }

    return Money.create(this.amount + money.amount, this.currency);
  }

  subtract(money: Money): Money {
    if (!this.isSameCurrency(money.currency)) {
      throw new Error('Cannot subtract money with different currencies');
    }

    return Money.create(this.amount - money.amount, this.currency);
  }

  multiply(factor: number): Money {
    return Money.create(this.amount * factor, this.currency);
  }

  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    return Money.create(this.amount / divisor, this.currency);
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isPositive(): boolean {
    return this.amount > 0;
  }

  isNegative(): boolean {
    return this.amount < 0;
  }

  negate(): Money {
    return Money.create(-this.amount, this.currency);
  }

  equals(money: Money): boolean {
    return this.amount === money.amount && this.currency === money.currency;
  }

  isSameCurrency(currency: string): boolean {
    return this.currency === currency.toUpperCase();
  }

  greaterThan(money: Money): boolean {
    if (!this.isSameCurrency(money.currency)) {
      throw new Error('Cannot compare money with different currencies');
    }
    return this.amount > money.amount;
  }

  lessThan(money: Money): boolean {
    if (!this.isSameCurrency(money.currency)) {
      throw new Error('Cannot compare money with different currencies');
    }
    return this.amount < money.amount;
  }

  greaterThanOrEqual(money: Money): boolean {
    if (!this.isSameCurrency(money.currency)) {
      throw new Error('Cannot compare money with different currencies');
    }
    return this.amount >= money.amount;
  }

  lessThanOrEqual(money: Money): boolean {
    if (!this.isSameCurrency(money.currency)) {
      throw new Error('Cannot compare money with different currencies');
    }
    return this.amount <= money.amount;
  }

  format(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }

  formatWithSymbol(): string {
    const symbols: Record<string, string> = {
      BDT: '৳',
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
    };

    const symbol = symbols[this.currency] || this.currency;
    return `${symbol}${this.amount.toFixed(2)}`;
  }

  toString(): string {
    return this.format();
  }
}