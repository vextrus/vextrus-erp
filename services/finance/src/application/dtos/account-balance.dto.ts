import { AccountType } from '../../domain/aggregates/chart-of-account/chart-of-account.aggregate';

/**
 * Account Balance Data Transfer Object
 *
 * Represents account balance with debit/credit presentation
 * based on account type's normal balance.
 *
 * Bangladesh Chart of Accounts:
 * - Debit Normal: Assets (1xxx), Expenses (5xxx)
 * - Credit Normal: Liabilities (2xxx), Equity (3xxx), Revenue (4xxx)
 */
export class AccountBalanceDto {
  /** Account unique identifier */
  accountId!: string;

  /** Account code (e.g., 1010, 2020) */
  accountCode!: string;

  /** Account name (e.g., "Cash and Cash Equivalents") */
  accountName!: string;

  /** Account type (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE) */
  accountType!: AccountType;

  /** Raw balance amount (can be positive or negative) */
  balance!: number;

  /** Currency code (default: BDT) */
  currency!: string;

  /**
   * Debit balance (for presentation)
   * - Assets/Expenses: Shows positive balance as debit
   * - Liabilities/Equity/Revenue: Shows 0 (normal credit balance)
   */
  debitBalance!: number;

  /**
   * Credit balance (for presentation)
   * - Liabilities/Equity/Revenue: Shows positive balance as credit
   * - Assets/Expenses: Shows 0 (normal debit balance)
   */
  creditBalance!: number;

  /**
   * Net balance (actual accounting balance)
   * - Positive for debit normal accounts with debit balance
   * - Positive for credit normal accounts with credit balance
   */
  netBalance!: number;

  /** Whether account is active and can be used in transactions */
  isActive!: boolean;

  /** Parent account ID (if this is a sub-account) */
  parentAccountId?: string;

  /** Last updated timestamp */
  updatedAt?: Date;

  constructor(partial: Partial<AccountBalanceDto>) {
    Object.assign(this, partial);
  }

  /**
   * Helper: Is this a debit normal account?
   * Assets and Expenses normally have debit balances
   */
  isDebitNormalAccount(): boolean {
    return this.accountType === AccountType.ASSET ||
           this.accountType === AccountType.EXPENSE;
  }

  /**
   * Helper: Is this a credit normal account?
   * Liabilities, Equity, and Revenue normally have credit balances
   */
  isCreditNormalAccount(): boolean {
    return this.accountType === AccountType.LIABILITY ||
           this.accountType === AccountType.EQUITY ||
           this.accountType === AccountType.REVENUE;
  }
}
