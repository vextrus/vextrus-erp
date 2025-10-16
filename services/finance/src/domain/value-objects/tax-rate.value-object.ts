import { ValueObject } from '../base/value-object.base';

export interface TaxRateProps {
  rate: number;
  type: 'VAT' | 'WHT' | 'AIT' | 'SD'; // VAT, Withholding Tax, Advance Income Tax, Supplementary Duty
  description: string;
}

export class TaxRate extends ValueObject<TaxRateProps> {
  get rate(): number {
    return this.props.rate;
  }

  get type(): string {
    return this.props.type;
  }

  get description(): string {
    return this.props.description;
  }

  static create(rate: number, type: 'VAT' | 'WHT' | 'AIT' | 'SD', description: string): TaxRate {
    if (rate < 0 || rate > 100) {
      throw new Error('Tax rate must be between 0 and 100');
    }

    return new TaxRate({ rate, type, description });
  }

  static createVAT(): TaxRate {
    return TaxRate.create(15, 'VAT', 'Standard VAT rate in Bangladesh');
  }

  static createWithholdingTax(rate: number): TaxRate {
    return TaxRate.create(rate, 'WHT', `Withholding Tax at ${rate}%`);
  }

  static createAIT(rate: number): TaxRate {
    return TaxRate.create(rate, 'AIT', `Advance Income Tax at ${rate}%`);
  }

  calculateTax(amount: number): number {
    return amount * (this.rate / 100);
  }

  calculateGrossAmount(netAmount: number): number {
    return netAmount * (1 + this.rate / 100);
  }

  toString(): string {
    return `${this.type}: ${this.rate}% - ${this.description}`;
  }
}