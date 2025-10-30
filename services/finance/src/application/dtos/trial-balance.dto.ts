import { AccountType } from '../../domain/aggregates/chart-of-account/chart-of-account.aggregate';

/**
 * Trial Balance Entry DTO
 *
 * Represents a single account line in the trial balance report.
 * Shows debit/credit balance based on account type's normal balance.
 */
export class TrialBalanceEntryDto {
  /** Account code (e.g., "1010", "2020") */
  accountCode!: string;

  /** Account name (e.g., "Cash and Cash Equivalents") */
  accountName!: string;

  /** Account type (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE) */
  accountType!: AccountType;

  /**
   * Debit balance (for presentation)
   * - Assets/Expenses: Shows balance in debit column
   * - Liabilities/Equity/Revenue: Shows 0
   */
  debitBalance!: number;

  /**
   * Credit balance (for presentation)
   * - Liabilities/Equity/Revenue: Shows balance in credit column
   * - Assets/Expenses: Shows 0
   */
  creditBalance!: number;

  /**
   * Net balance (actual accounting balance)
   * Always shown for verification purposes
   */
  netBalance!: number;

  constructor(partial: Partial<TrialBalanceEntryDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Trial Balance Summary by Account Type
 *
 * Aggregates balances for each account type for
 * financial statement preparation.
 */
export interface TrialBalanceTypeSummary {
  /** Total debit balance for this account type */
  totalDebit: number;

  /** Total credit balance for this account type */
  totalCredit: number;

  /** Net balance (debit - credit) */
  netBalance: number;

  /** Number of accounts in this type */
  accountCount: number;
}

/**
 * Trial Balance DTO
 *
 * Complete trial balance report with all accounts and verification.
 * In double-entry accounting, total debits MUST equal total credits.
 *
 * Bangladesh Compliance:
 * - Follows NBR accounting standards
 * - Supports Bangladesh fiscal year (July-June)
 * - Formatted for Mushak reporting
 */
export class TrialBalanceDto {
  /** Fiscal year (e.g., "FY2024-2025") */
  fiscalYear!: string;

  /** Balance as of this date */
  asOfDate!: Date;

  /** All account entries in the trial balance */
  entries!: TrialBalanceEntryDto[];

  /** Summary verification totals */
  summary!: {
    /** Total of all debit balances */
    totalDebits: number;

    /** Total of all credit balances */
    totalCredits: number;

    /** True if debits === credits (should always be true) */
    isBalanced: boolean;

    /** Difference between debits and credits (should be 0) */
    variance: number;

    /** Total number of accounts included */
    accountCount: number;
  };

  /** Grouped summary by account type */
  groupedByType!: {
    [AccountType.ASSET]: TrialBalanceTypeSummary;
    [AccountType.LIABILITY]: TrialBalanceTypeSummary;
    [AccountType.EQUITY]: TrialBalanceTypeSummary;
    [AccountType.REVENUE]: TrialBalanceTypeSummary;
    [AccountType.EXPENSE]: TrialBalanceTypeSummary;
  };

  /** Metadata */
  metadata!: {
    /** When this report was generated */
    generatedAt: Date;

    /** Tenant ID for multi-tenant isolation */
    tenantId: string;

    /** Currency code (default: BDT) */
    currency: string;
  };

  constructor(partial: Partial<TrialBalanceDto>) {
    Object.assign(this, partial);
  }
}
