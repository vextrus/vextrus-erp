import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChartOfAccountReadModel } from '../../infrastructure/persistence/typeorm/entities/chart-of-account.entity';
import { FinanceCacheService } from '../../infrastructure/cache/cache.service';
import { AccountBalanceDto } from '../dtos/account-balance.dto';
import { AccountType } from '../../domain/aggregates/chart-of-account/chart-of-account.aggregate';
import { Money } from '../../domain/value-objects/money.value-object';

/**
 * Account Balance Service
 *
 * Provides domain service for querying account balances from the read model.
 * Balances are pre-calculated by projection handlers (NOT runtime aggregation).
 *
 * Key Features:
 * - Queries ChartOfAccountReadModel for pre-calculated balances
 * - Maps balances to debit/credit presentation based on account type
 * - Heavy caching with Redis (60s TTL for queries, 1800s for reports)
 * - Multi-tenant safe (all queries tenant-scoped)
 *
 * Balance Calculation Flow:
 * 1. Journal posted → JournalPostedEvent emitted
 * 2. JournalProjectionHandler updates account balances
 * 3. AccountBalanceUpdatedEvent emitted
 * 4. AccountProjectionHandler updates ChartOfAccountReadModel.balance
 * 5. This service queries the pre-calculated balance
 *
 * NO runtime SUM() queries - balances are maintained incrementally.
 */
@Injectable()
export class AccountBalanceService {
  private readonly logger = new Logger(AccountBalanceService.name);

  constructor(
    @InjectRepository(ChartOfAccountReadModel)
    private readonly accountRepository: Repository<ChartOfAccountReadModel>,
    private readonly cacheService: FinanceCacheService,
  ) {}

  /**
   * Get account balance by account ID
   *
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @param accountId - Account unique identifier
   * @returns Account balance with debit/credit presentation
   * @throws NotFoundException if account not found
   */
  async getAccountBalance(
    tenantId: string,
    accountId: string,
  ): Promise<AccountBalanceDto> {
    this.logger.debug(`Getting balance for account ${accountId} (tenant: ${tenantId})`);

    // Try cache first
    const cached = await this.cacheService.getAccountBalance<AccountBalanceDto>(
      tenantId,
      accountId,
    );

    if (cached) {
      this.logger.debug(`Cache HIT for account ${accountId}`);
      return cached;
    }

    // Cache MISS - query database
    this.logger.debug(`Cache MISS for account ${accountId} - querying database`);

    const account = await this.accountRepository.findOne({
      where: {
        id: accountId,
        tenantId,
      },
    });

    if (!account) {
      throw new NotFoundException(
        `Account ${accountId} not found for tenant ${tenantId}`,
      );
    }

    // Map to DTO with debit/credit presentation
    const balanceDto = this.mapToBalanceDto(account);

    // Cache the result (60s TTL)
    await this.cacheService.setAccountBalance(tenantId, accountId, balanceDto);
    this.logger.debug(`Cached balance for account ${accountId}`);

    return balanceDto;
  }

  /**
   * Get account balance by account code
   *
   * @param tenantId - Tenant identifier
   * @param accountCode - Account code (e.g., "1010", "2020")
   * @returns Account balance
   * @throws NotFoundException if account not found
   */
  async getAccountBalanceByCode(
    tenantId: string,
    accountCode: string,
  ): Promise<AccountBalanceDto> {
    this.logger.debug(`Getting balance for account code ${accountCode} (tenant: ${tenantId})`);

    // Try cache first
    const cached = await this.cacheService.getAccountByCode<AccountBalanceDto>(
      tenantId,
      accountCode,
    );

    if (cached) {
      this.logger.debug(`Cache HIT for account code ${accountCode}`);
      return cached;
    }

    // Cache MISS - query database
    const account = await this.accountRepository.findOne({
      where: {
        accountCode,
        tenantId,
      },
    });

    if (!account) {
      throw new NotFoundException(
        `Account with code ${accountCode} not found for tenant ${tenantId}`,
      );
    }

    const balanceDto = this.mapToBalanceDto(account);

    // Cache the result
    await this.cacheService.setAccountByCode(tenantId, accountCode, balanceDto);

    return balanceDto;
  }

  /**
   * Get all account balances for a specific account type
   *
   * @param tenantId - Tenant identifier
   * @param accountType - Account type (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
   * @param activeOnly - Return only active accounts (default: true)
   * @returns Array of account balances
   */
  async getAccountsBalanceByType(
    tenantId: string,
    accountType: AccountType,
    activeOnly = true,
  ): Promise<AccountBalanceDto[]> {
    this.logger.debug(
      `Getting balances for account type ${accountType} ` +
      `(tenant: ${tenantId}, activeOnly: ${activeOnly})`,
    );

    // Try cache first
    const cacheKey = `${accountType}:${activeOnly}`;
    const cached = await this.cacheService.getAccountsList<AccountBalanceDto[]>(
      tenantId,
      cacheKey,
    );

    if (cached) {
      this.logger.debug(`Cache HIT for account type ${accountType}`);
      return cached;
    }

    // Cache MISS - query database
    const where: any = {
      accountType,
      tenantId,
    };

    if (activeOnly) {
      where.isActive = true;
    }

    const accounts = await this.accountRepository.find({
      where,
      order: {
        accountCode: 'ASC', // Bangladesh standard: hierarchical code order
      },
    });

    const balanceDtos = accounts.map(account => this.mapToBalanceDto(account));

    // Cache the result
    await this.cacheService.setAccountsList(tenantId, balanceDtos, cacheKey);
    this.logger.debug(
      `Cached ${balanceDtos.length} accounts for type ${accountType}`,
    );

    return balanceDtos;
  }

  /**
   * Get total balance for all accounts of a specific type
   * Used for trial balance and financial statement totals
   *
   * @param tenantId - Tenant identifier
   * @param accountType - Account type to sum
   * @returns Total balance as Money object
   */
  async getTotalBalanceByType(
    tenantId: string,
    accountType: AccountType,
  ): Promise<Money> {
    this.logger.debug(
      `Getting total balance for account type ${accountType} (tenant: ${tenantId})`,
    );

    // Get all accounts of this type (cached)
    const accounts = await this.getAccountsBalanceByType(tenantId, accountType, true);

    // Sum the balances
    let totalBalance = 0;
    for (const account of accounts) {
      totalBalance += account.balance;
    }

    this.logger.debug(
      `Total balance for ${accountType}: ${totalBalance} ` +
      `(${accounts.length} accounts)`,
    );

    // Return as Money object (assume BDT currency)
    return Money.fromAmount(totalBalance, 'BDT');
  }

  /**
   * Get all active accounts with balances for trial balance
   *
   * @param tenantId - Tenant identifier
   * @returns All active accounts with balances
   */
  async getAllActiveAccountBalances(tenantId: string): Promise<AccountBalanceDto[]> {
    this.logger.debug(`Getting all active account balances (tenant: ${tenantId})`);

    // Try cache first
    const cached = await this.cacheService.getChartOfAccounts<AccountBalanceDto[]>(
      tenantId,
    );

    if (cached) {
      this.logger.debug(`Cache HIT for all active accounts`);
      return cached;
    }

    // Cache MISS - query database
    const accounts = await this.accountRepository.find({
      where: {
        tenantId,
        isActive: true,
      },
      order: {
        accountCode: 'ASC',
      },
    });

    const balanceDtos = accounts.map(account => this.mapToBalanceDto(account));

    // Cache the result (longer TTL: 2 hours for reference data)
    await this.cacheService.setChartOfAccounts(tenantId, balanceDtos);
    this.logger.debug(`Cached ${balanceDtos.length} active accounts`);

    return balanceDtos;
  }

  /**
   * Map ChartOfAccountReadModel to AccountBalanceDto
   * Applies debit/credit presentation rules based on account type
   *
   * @param account - Account read model entity
   * @returns Account balance DTO with debit/credit columns
   */
  private mapToBalanceDto(account: ChartOfAccountReadModel): AccountBalanceDto {
    const balance = account.balance || 0;

    // Determine debit/credit presentation
    // Debit normal accounts: Assets, Expenses
    const isDebitNormal =
      account.accountType === AccountType.ASSET ||
      account.accountType === AccountType.EXPENSE;

    // Credit normal accounts: Liabilities, Equity, Revenue
    const isCreditNormal =
      account.accountType === AccountType.LIABILITY ||
      account.accountType === AccountType.EQUITY ||
      account.accountType === AccountType.REVENUE;

    // Apply presentation rules
    let debitBalance = 0;
    let creditBalance = 0;

    if (isDebitNormal) {
      // Debit normal: show positive balance in debit column
      debitBalance = balance >= 0 ? balance : 0;
      creditBalance = balance < 0 ? Math.abs(balance) : 0;
    } else if (isCreditNormal) {
      // Credit normal: show positive balance in credit column
      creditBalance = balance >= 0 ? balance : 0;
      debitBalance = balance < 0 ? Math.abs(balance) : 0;
    }

    return new AccountBalanceDto({
      accountId: account.id,
      accountCode: account.accountCode,
      accountName: account.accountName,
      accountType: account.accountType,
      balance,
      currency: account.currency,
      debitBalance,
      creditBalance,
      netBalance: balance,
      isActive: account.isActive,
      parentAccountId: account.parentAccountId || undefined,
      updatedAt: account.updatedAt,
    });
  }
}
