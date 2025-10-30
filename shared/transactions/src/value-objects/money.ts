/**
 * Simple Money value object implementation
 * This is a temporary implementation until proper Money class is available in @vextrus/kernel
 */
export class Money {
  constructor(
    private readonly amount: number,
    private readonly currency: string
  ) {}

  static fromAmount(amount: number, currency: string): Money {
    return new Money(amount, currency);
  }

  static zero(currency: string): Money {
    return new Money(0, currency);
  }

  static fromJSON(data: { amount: number; currency: string }): Money {
    return new Money(data.amount, data.currency);
  }

  toJSON(): { amount: number; currency: string } {
    return {
      amount: this.amount,
      currency: this.currency
    };
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(`Cannot add different currencies: ${this.currency} and ${other.currency}`);
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  isNegative(): boolean {
    return this.amount < 0;
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }
}