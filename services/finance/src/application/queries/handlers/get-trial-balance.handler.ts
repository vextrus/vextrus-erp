import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetTrialBalanceQuery } from '../get-trial-balance.query';
import {
  TrialBalanceDto,
  TrialBalanceEntryDto,
  TrialBalanceTypeSummary,
} from '../../dtos/trial-balance.dto';
import { AccountBalanceService } from '../../services/account-balance.service';
import { FinanceCacheService } from '../../../infrastructure/cache/cache.service';
import { AccountType } from '../../../domain/aggregates/chart-of-account/chart-of-account.aggregate';

/**
 * Get Trial Balance Query Handler
 *
 * Generates trial balance report from pre-calculated account balances.
 * Verifies double-entry accounting (debits = credits).
 *
 * Trial Balance Rules:
 * 1. Lists all active accounts with balances
 * 2. Debit normal accounts (Assets, Expenses) → debit column
 * 3. Credit normal accounts (Liabilities, Equity, Revenue) → credit column
 * 4. Total debits MUST equal total credits
 * 5. Groups by account type for financial statements
 *
 * Performance:
 * - Queries pre-calculated balances (NO runtime SUM)
 * - Cached for 30 minutes (expensive report)
 * - <500ms without cache, <50ms with cache HIT
 *
 * Bangladesh Fiscal Year:
 * - FY2024-2025: July 1, 2024 → June 30, 2025
 * - Compatible with NBR reporting requirements
 */
@QueryHandler(GetTrialBalanceQuery)
export class GetTrialBalanceHandler
  implements IQueryHandler<GetTrialBalanceQuery>
{
  private readonly logger = new Logger(GetTrialBalanceHandler.name);

  constructor(
    private readonly accountBalanceService: AccountBalanceService,
    private readonly cacheService: FinanceCacheService,
  ) {}

  async execute(query: GetTrialBalanceQuery): Promise<TrialBalanceDto> {
    const { tenantId, fiscalYear, asOfDate } = query;

    this.logger.log(
      `Generating trial balance for ${fiscalYear} (tenant: ${tenantId})`,
    );

    // Try cache first
    const cached = await this.cacheService.getTrialBalance<TrialBalanceDto>(
      tenantId,
      fiscalYear,
    );

    if (cached) {
      this.logger.debug(`Cache HIT for trial balance ${fiscalYear}`);
      return cached;
    }

    // Cache MISS - generate trial balance
    this.logger.debug(`Cache MISS for trial balance ${fiscalYear} - generating...`);

    const startTime = Date.now();

    // Get all active account balances
    const accountBalances = await this.accountBalanceService.getAllActiveAccountBalances(
      tenantId,
    );

    this.logger.debug(
      `Retrieved ${accountBalances.length} active accounts in ${Date.now() - startTime}ms`,
    );

    // Map to trial balance entries
    const entries: TrialBalanceEntryDto[] = accountBalances.map(account => ({
      accountCode: account.accountCode,
      accountName: account.accountName,
      accountType: account.accountType,
      debitBalance: account.debitBalance,
      creditBalance: account.creditBalance,
      netBalance: account.netBalance,
    }));

    // Calculate summary totals
    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of entries) {
      totalDebits += entry.debitBalance;
      totalCredits += entry.creditBalance;
    }

    // Verify balance (debits should equal credits)
    const variance = Math.abs(totalDebits - totalCredits);
    const isBalanced = variance < 0.01; // Allow 1 cent tolerance for rounding

    if (!isBalanced) {
      this.logger.warn(
        `Trial balance is UNBALANCED! ` +
        `Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}, ` +
        `Variance: ${variance.toFixed(2)}`,
      );
    } else {
      this.logger.debug(
        `Trial balance is balanced: ${totalDebits.toFixed(2)} = ${totalCredits.toFixed(2)}`,
      );
    }

    // Group by account type for financial statement preparation
    const groupedByType = this.groupByAccountType(entries);

    // Build trial balance DTO
    const trialBalance = new TrialBalanceDto({
      fiscalYear,
      asOfDate: asOfDate || new Date(),
      entries,
      summary: {
        totalDebits,
        totalCredits,
        isBalanced,
        variance,
        accountCount: entries.length,
      },
      groupedByType,
      metadata: {
        generatedAt: new Date(),
        tenantId,
        currency: 'BDT',
      },
    });

    // Cache the result (30 minutes TTL)
    await this.cacheService.setTrialBalance(tenantId, fiscalYear, trialBalance);

    const elapsedTime = Date.now() - startTime;
    this.logger.log(
      `Trial balance generated in ${elapsedTime}ms ` +
      `(${entries.length} accounts, balanced: ${isBalanced})`,
    );

    return trialBalance;
  }

  /**
   * Group trial balance entries by account type
   * Used for financial statement preparation (Balance Sheet, P&L)
   *
   * @param entries - All trial balance entries
   * @returns Grouped summary by account type
   */
  private groupByAccountType(
    entries: TrialBalanceEntryDto[],
  ): Record<AccountType, TrialBalanceTypeSummary> {
    const grouped: Partial<Record<AccountType, TrialBalanceTypeSummary>> = {};

    // Initialize all account types
    for (const accountType of Object.values(AccountType)) {
      grouped[accountType] = {
        totalDebit: 0,
        totalCredit: 0,
        netBalance: 0,
        accountCount: 0,
      };
    }

    // Aggregate by account type
    for (const entry of entries) {
      const summary = grouped[entry.accountType]!;

      summary.totalDebit += entry.debitBalance;
      summary.totalCredit += entry.creditBalance;
      summary.netBalance += entry.netBalance;
      summary.accountCount += 1;
    }

    // Log summary
    for (const [type, summary] of Object.entries(grouped)) {
      this.logger.debug(
        `${type}: ${summary.accountCount} accounts, ` +
        `Debit: ${summary.totalDebit.toFixed(2)}, ` +
        `Credit: ${summary.totalCredit.toFixed(2)}, ` +
        `Net: ${summary.netBalance.toFixed(2)}`,
      );
    }

    return grouped as Record<AccountType, TrialBalanceTypeSummary>;
  }
}
