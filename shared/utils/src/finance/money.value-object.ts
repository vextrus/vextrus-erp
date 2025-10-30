import { Decimal } from 'decimal.js';
import { ValueObject } from '@vextrus/kernel';

export type Currency = 'BDT' | 'USD' | 'EUR' | 'GBP' | 'INR';

export interface MoneyProps {
  amount: Decimal;
  currency: Currency;
}

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  static create(amount: number | string | Decimal, currency: Currency = 'BDT'): Money {
    return new Money({
      amount: new Decimal(amount),
      currency
    });
  }

  static fromCents(cents: number, currency: Currency = 'BDT'): Money {
    return new Money({
      amount: new Decimal(cents).dividedBy(100),
      currency
    });
  }

  static zero(currency: Currency = 'BDT'): Money {
    return new Money({
      amount: new Decimal(0),
      currency
    });
  }

  get amount(): Decimal {
    return this.props.amount;
  }

  get currency(): Currency {
    return this.props.currency;
  }

  add(money: Money): Money {
    this.assertSameCurrency(money);
    return Money.create(
      this.props.amount.plus(money.props.amount),
      this.props.currency
    );
  }

  subtract(money: Money): Money {
    this.assertSameCurrency(money);
    return Money.create(
      this.props.amount.minus(money.props.amount),
      this.props.currency
    );
  }

  multiply(factor: number | Decimal): Money {
    return Money.create(
      this.props.amount.times(factor),
      this.props.currency
    );
  }

  divide(divisor: number | Decimal): Money {
    if (new Decimal(divisor).isZero()) {
      throw new Error('Cannot divide by zero');
    }
    return Money.create(
      this.props.amount.dividedBy(divisor),
      this.props.currency
    );
  }

  round(decimalPlaces: number = 2): Money {
    return Money.create(
      this.props.amount.toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP),
      this.props.currency
    );
  }

  roundBankers(decimalPlaces: number = 2): Money {
    return Money.create(
      this.props.amount.toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_EVEN),
      this.props.currency
    );
  }

  floor(): Money {
    return Money.create(
      this.props.amount.floor(),
      this.props.currency
    );
  }

  ceil(): Money {
    return Money.create(
      this.props.amount.ceil(),
      this.props.currency
    );
  }

  isPositive(): boolean {
    return this.props.amount.greaterThan(0);
  }

  isNegative(): boolean {
    return this.props.amount.lessThan(0);
  }

  isZero(): boolean {
    return this.props.amount.isZero();
  }

  greaterThan(money: Money): boolean {
    this.assertSameCurrency(money);
    return this.props.amount.greaterThan(money.props.amount);
  }

  greaterThanOrEqual(money: Money): boolean {
    this.assertSameCurrency(money);
    return this.props.amount.greaterThanOrEqualTo(money.props.amount);
  }

  lessThan(money: Money): boolean {
    this.assertSameCurrency(money);
    return this.props.amount.lessThan(money.props.amount);
  }

  lessThanOrEqual(money: Money): boolean {
    this.assertSameCurrency(money);
    return this.props.amount.lessThanOrEqualTo(money.props.amount);
  }

  negate(): Money {
    return Money.create(
      this.props.amount.negated(),
      this.props.currency
    );
  }

  absolute(): Money {
    return Money.create(
      this.props.amount.absoluteValue(),
      this.props.currency
    );
  }

  abs(): Money {
    return this.absolute();
  }

  percentage(percent: number): Money {
    return Money.create(
      this.props.amount.times(percent).dividedBy(100),
      this.props.currency
    );
  }

  allocate(ratios: number[]): Money[] {
    const total = ratios.reduce((sum, ratio) => sum + ratio, 0);
    const amounts: Money[] = [];
    let remainder = this.props.amount;

    for (let i = 0; i < ratios.length - 1; i++) {
      const share = this.props.amount.times(ratios[i] || 0).dividedBy(total);
      const rounded = share.toDecimalPlaces(2, Decimal.ROUND_DOWN);
      amounts.push(Money.create(rounded, this.props.currency));
      remainder = remainder.minus(rounded);
    }

    // Last allocation gets the remainder to ensure total is preserved
    amounts.push(Money.create(remainder, this.props.currency));
    return amounts;
  }

  format(locale: 'en' | 'bn' = 'bn', options?: Intl.NumberFormatOptions): string {
    const symbol = this.getCurrencySymbol();
    const formatted = this.props.amount.toFixed(2);
    
    if (locale === 'bn') {
      const bengaliFormatted = this.toBengaliNumber(formatted);
      return `${symbol}${bengaliFormatted}`;
    }
    
    return `${symbol}${formatted}`;
  }

  formatWithIndianNumbering(locale: 'en' | 'bn' = 'bn'): string {
    const symbol = this.getCurrencySymbol();
    const parts = this.props.amount.toFixed(2).split('.');
    const integerPart = parts[0] || '0';
    const decimalPart = parts[1] || '00';
    
    // Indian numbering system (lakhs, crores)
    let formatted = '';
    const len = integerPart.length;
    
    if (len <= 3) {
      formatted = integerPart;
    } else if (len <= 5) {
      formatted = integerPart.slice(0, len - 3) + ',' + integerPart.slice(len - 3);
    } else if (len <= 7) {
      formatted = integerPart.slice(0, len - 5) + ',' + 
                  integerPart.slice(len - 5, len - 3) + ',' + 
                  integerPart.slice(len - 3);
    } else {
      // For numbers larger than 7 digits
      let remaining = integerPart.slice(0, len - 7);
      const lastPart = integerPart.slice(len - 7);
      
      // Add commas every 2 digits for the remaining part
      const remainingFormatted = remaining.replace(/(\d)(?=(\d{2})+$)/g, '$1,');
      formatted = remainingFormatted + ',' + 
                  lastPart.slice(0, 2) + ',' + 
                  lastPart.slice(2, 4) + ',' + 
                  lastPart.slice(4);
    }
    
    const result = `${formatted}.${decimalPart}`;
    
    if (locale === 'bn') {
      const bengaliFormatted = this.toBengaliNumber(result);
      return `${symbol}${bengaliFormatted}`;
    }
    
    return `${symbol}${result}`;
  }

  private toBengaliNumber(num: string): string {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.replace(/\d/g, d => bengaliDigits[parseInt(d)] || d);
  }

  private getCurrencySymbol(): string {
    const symbols: Record<Currency, string> = {
      BDT: '৳',
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹'
    };
    return symbols[this.props.currency];
  }

  private assertSameCurrency(money: Money): void {
    if (this.props.currency !== money.props.currency) {
      throw new Error(`Currency mismatch: ${this.props.currency} vs ${money.props.currency}`);
    }
  }

  toJSON(): { amount: string; currency: Currency } {
    return {
      amount: this.props.amount.toString(),
      currency: this.props.currency
    };
  }

  static fromJSON(json: { amount: string; currency: Currency }): Money {
    return Money.create(json.amount, json.currency);
  }

  toString(): string {
    return `${this.props.amount.toString()} ${this.props.currency}`;
  }

  toCents(): number {
    return this.props.amount.times(100).toNumber();
  }

  getAmount(): Decimal {
    return this.props.amount;
  }
}