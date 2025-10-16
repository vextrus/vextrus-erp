import { ValueObject } from '../base/value-object.base';

export interface AccountCodeProps {
  code: string;
  description?: string;
}

export class AccountCode extends ValueObject<AccountCodeProps> {
  get code(): string {
    return this.props.code;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  static create(code: string, description?: string): AccountCode {
    if (!code || code.trim().length === 0) {
      throw new Error('Account code cannot be empty');
    }

    if (!/^\d{4,}$/.test(code)) {
      throw new Error('Account code must be at least 4 digits');
    }

    return new AccountCode({ code, description });
  }

  isAsset(): boolean {
    return this.code.startsWith('1');
  }

  isLiability(): boolean {
    return this.code.startsWith('2');
  }

  isEquity(): boolean {
    return this.code.startsWith('3');
  }

  isRevenue(): boolean {
    return this.code.startsWith('4');
  }

  isExpense(): boolean {
    return this.code.startsWith('5');
  }

  toString(): string {
    return this.description ? `${this.code} - ${this.description}` : this.code;
  }
}