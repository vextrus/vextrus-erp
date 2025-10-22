import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { AccountType } from '../../../domain/aggregates/chart-of-account/chart-of-account.aggregate';

/**
 * Trial Balance Entry GraphQL Type
 *
 * Represents a single account line in the trial balance.
 */
@ObjectType()
export class TrialBalanceEntryType {
  @Field(() => String, { description: 'Account code (e.g., "1010")' })
  accountCode!: string;

  @Field(() => String, { description: 'Account name' })
  accountName!: string;

  @Field(() => String, { description: 'Account type (ASSET, LIABILITY, etc.)' })
  accountType!: AccountType;

  @Field(() => Float, { description: 'Debit balance (Assets/Expenses)' })
  debitBalance!: number;

  @Field(() => Float, { description: 'Credit balance (Liabilities/Equity/Revenue)' })
  creditBalance!: number;

  @Field(() => Float, { description: 'Net balance (actual accounting balance)' })
  netBalance!: number;
}

/**
 * Trial Balance Summary GraphQL Type
 *
 * Verification totals for double-entry accounting.
 */
@ObjectType()
export class TrialBalanceSummaryType {
  @Field(() => Float, { description: 'Total of all debit balances' })
  totalDebits!: number;

  @Field(() => Float, { description: 'Total of all credit balances' })
  totalCredits!: number;

  @Field(() => Boolean, {
    description: 'True if debits === credits (double-entry balanced)',
  })
  isBalanced!: boolean;

  @Field(() => Float, { description: 'Difference between debits and credits (should be 0)' })
  variance!: number;

  @Field(() => Int, { description: 'Total number of accounts' })
  accountCount!: number;
}

/**
 * Trial Balance Type Summary GraphQL Type
 *
 * Aggregated totals for each account type.
 */
@ObjectType()
export class TrialBalanceTypeSummaryType {
  @Field(() => Float, { description: 'Total debit balance for this account type' })
  totalDebit!: number;

  @Field(() => Float, { description: 'Total credit balance for this account type' })
  totalCredit!: number;

  @Field(() => Float, { description: 'Net balance (debit - credit)' })
  netBalance!: number;

  @Field(() => Int, { description: 'Number of accounts in this type' })
  accountCount!: number;
}

/**
 * Grouped By Type GraphQL Type
 *
 * Trial balance grouped by account type for financial statement preparation.
 */
@ObjectType()
export class GroupedByTypeType {
  @Field(() => TrialBalanceTypeSummaryType, { description: 'Asset accounts summary' })
  ASSET!: TrialBalanceTypeSummaryType;

  @Field(() => TrialBalanceTypeSummaryType, { description: 'Liability accounts summary' })
  LIABILITY!: TrialBalanceTypeSummaryType;

  @Field(() => TrialBalanceTypeSummaryType, { description: 'Equity accounts summary' })
  EQUITY!: TrialBalanceTypeSummaryType;

  @Field(() => TrialBalanceTypeSummaryType, { description: 'Revenue accounts summary' })
  REVENUE!: TrialBalanceTypeSummaryType;

  @Field(() => TrialBalanceTypeSummaryType, { description: 'Expense accounts summary' })
  EXPENSE!: TrialBalanceTypeSummaryType;
}

/**
 * Trial Balance Metadata GraphQL Type
 */
@ObjectType()
export class TrialBalanceMetadataType {
  @Field(() => Date, { description: 'When this report was generated' })
  generatedAt!: Date;

  @Field(() => String, { description: 'Tenant ID' })
  tenantId!: string;

  @Field(() => String, { description: 'Currency code (default: BDT)' })
  currency!: string;
}

/**
 * Trial Balance GraphQL Type
 *
 * Complete trial balance report with all accounts and verification.
 * Bangladesh-compliant format for NBR reporting.
 */
@ObjectType()
export class TrialBalanceType {
  @Field(() => String, { description: 'Fiscal year (e.g., "FY2024-2025")' })
  fiscalYear!: string;

  @Field(() => Date, { description: 'Balance as of this date' })
  asOfDate!: Date;

  @Field(() => [TrialBalanceEntryType], { description: 'All account entries' })
  entries!: TrialBalanceEntryType[];

  @Field(() => TrialBalanceSummaryType, { description: 'Summary verification totals' })
  summary!: TrialBalanceSummaryType;

  @Field(() => GroupedByTypeType, { description: 'Grouped summary by account type' })
  groupedByType!: GroupedByTypeType;

  @Field(() => TrialBalanceMetadataType, { description: 'Report metadata' })
  metadata!: TrialBalanceMetadataType;
}
