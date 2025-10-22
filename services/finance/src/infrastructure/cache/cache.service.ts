import { Injectable, Logger } from '@nestjs/common';
import { CacheService as SharedCacheService } from '@vextrus/cache';
import { FinanceCacheKeys } from './cache.keys';

/**
 * Finance Service Cache Service
 *
 * Finance-specific caching layer built on shared cache infrastructure.
 * Provides domain-specific cache operations with automatic TTL management.
 *
 * Features:
 * - Tenant-scoped caching (all keys include tenantId)
 * - Predefined TTLs per data type (query: 60s, report: 1800s, lookup: 7200s)
 * - Pattern-based invalidation for bulk cache clearing
 * - Cache-aside pattern helpers
 * - Statistics tracking for monitoring
 *
 * Bangladesh Compliance:
 * - Fiscal period-aware caching for financial reports
 * - NBR report data cached separately
 * - Tenant isolation prevents cross-tenant data leakage
 */

@Injectable()
export class FinanceCacheService {
  private readonly logger = new Logger(FinanceCacheService.name);

  // TTL configurations (in seconds)
  private readonly TTL_QUERY = 60; // 1 minute - frequently changing data
  private readonly TTL_REPORT = 1800; // 30 minutes - aggregated reports
  private readonly TTL_LOOKUP = 7200; // 2 hours - reference data
  private readonly TTL_TEMP = 300; // 5 minutes - temporary/validation data

  constructor(private readonly cacheService: SharedCacheService) {}

  /**
   * Account Caching
   */
  async getAccount<T>(tenantId: string, accountId: string): Promise<T | null> {
    const key = FinanceCacheKeys.accountById(tenantId, accountId);
    return this.cacheService.get<T>(key);
  }

  async setAccount<T>(
    tenantId: string,
    accountId: string,
    account: T
  ): Promise<void> {
    const key = FinanceCacheKeys.accountById(tenantId, accountId);
    await this.cacheService.set(key, account, this.TTL_QUERY);
    this.logger.debug(`Cached account: ${accountId} for tenant: ${tenantId}`);
  }

  async getAccountByCode<T>(
    tenantId: string,
    accountCode: string
  ): Promise<T | null> {
    const key = FinanceCacheKeys.accountByCode(tenantId, accountCode);
    return this.cacheService.get<T>(key);
  }

  async setAccountByCode<T>(
    tenantId: string,
    accountCode: string,
    account: T
  ): Promise<void> {
    const key = FinanceCacheKeys.accountByCode(tenantId, accountCode);
    await this.cacheService.set(key, account, this.TTL_QUERY);
  }

  async getAccountsList<T>(
    tenantId: string,
    accountType?: string
  ): Promise<T | null> {
    const key = FinanceCacheKeys.accountsList(tenantId, accountType);
    return this.cacheService.get<T>(key);
  }

  async setAccountsList<T>(
    tenantId: string,
    accounts: T,
    accountType?: string
  ): Promise<void> {
    const key = FinanceCacheKeys.accountsList(tenantId, accountType);
    await this.cacheService.set(key, accounts, this.TTL_QUERY);
  }

  /**
   * Invoice Caching
   */
  async getInvoice<T>(tenantId: string, invoiceId: string): Promise<T | null> {
    const key = FinanceCacheKeys.invoiceById(tenantId, invoiceId);
    return this.cacheService.get<T>(key);
  }

  async setInvoice<T>(
    tenantId: string,
    invoiceId: string,
    invoice: T
  ): Promise<void> {
    const key = FinanceCacheKeys.invoiceById(tenantId, invoiceId);
    await this.cacheService.set(key, invoice, this.TTL_QUERY);
    this.logger.debug(`Cached invoice: ${invoiceId} for tenant: ${tenantId}`);
  }

  async getInvoicesList<T>(
    tenantId: string,
    options?: { status?: string; page?: number; limit?: number }
  ): Promise<T | null> {
    const key = FinanceCacheKeys.invoicesList(tenantId, options);
    return this.cacheService.get<T>(key);
  }

  async setInvoicesList<T>(
    tenantId: string,
    invoices: T,
    options?: { status?: string; page?: number; limit?: number }
  ): Promise<void> {
    const key = FinanceCacheKeys.invoicesList(tenantId, options);
    await this.cacheService.set(key, invoices, this.TTL_QUERY);
  }

  /**
   * Payment Caching
   */
  async getPayment<T>(tenantId: string, paymentId: string): Promise<T | null> {
    const key = FinanceCacheKeys.paymentById(tenantId, paymentId);
    return this.cacheService.get<T>(key);
  }

  async setPayment<T>(
    tenantId: string,
    paymentId: string,
    payment: T
  ): Promise<void> {
    const key = FinanceCacheKeys.paymentById(tenantId, paymentId);
    await this.cacheService.set(key, payment, this.TTL_QUERY);
    this.logger.debug(`Cached payment: ${paymentId} for tenant: ${tenantId}`);
  }

  async getPaymentsByInvoice<T>(
    tenantId: string,
    invoiceId: string
  ): Promise<T | null> {
    const key = FinanceCacheKeys.paymentsByInvoice(tenantId, invoiceId);
    return this.cacheService.get<T>(key);
  }

  async setPaymentsByInvoice<T>(
    tenantId: string,
    invoiceId: string,
    payments: T
  ): Promise<void> {
    const key = FinanceCacheKeys.paymentsByInvoice(tenantId, invoiceId);
    await this.cacheService.set(key, payments, this.TTL_QUERY);
  }

  async getPaymentsByStatus<T>(
    tenantId: string,
    status: string
  ): Promise<T | null> {
    const key = FinanceCacheKeys.paymentsByStatus(tenantId, status);
    return this.cacheService.get<T>(key);
  }

  async setPaymentsByStatus<T>(
    tenantId: string,
    status: string,
    payments: T
  ): Promise<void> {
    const key = FinanceCacheKeys.paymentsByStatus(tenantId, status);
    await this.cacheService.set(key, payments, this.TTL_QUERY);
  }

  /**
   * Journal Caching
   */
  async getJournal<T>(tenantId: string, journalId: string): Promise<T | null> {
    const key = FinanceCacheKeys.journalById(tenantId, journalId);
    return this.cacheService.get<T>(key);
  }

  async setJournal<T>(
    tenantId: string,
    journalId: string,
    journal: T
  ): Promise<void> {
    const key = FinanceCacheKeys.journalById(tenantId, journalId);
    await this.cacheService.set(key, journal, this.TTL_QUERY);
    this.logger.debug(`Cached journal: ${journalId} for tenant: ${tenantId}`);
  }

  async getJournalsByPeriod<T>(
    tenantId: string,
    fiscalPeriod: string
  ): Promise<T | null> {
    const key = FinanceCacheKeys.journalsByPeriod(tenantId, fiscalPeriod);
    return this.cacheService.get<T>(key);
  }

  async setJournalsByPeriod<T>(
    tenantId: string,
    fiscalPeriod: string,
    journals: T
  ): Promise<void> {
    const key = FinanceCacheKeys.journalsByPeriod(tenantId, fiscalPeriod);
    await this.cacheService.set(key, journals, this.TTL_QUERY);
  }

  async getUnpostedJournals<T>(tenantId: string): Promise<T | null> {
    const key = FinanceCacheKeys.unpostedJournals(tenantId);
    return this.cacheService.get<T>(key);
  }

  async setUnpostedJournals<T>(
    tenantId: string,
    journals: T
  ): Promise<void> {
    const key = FinanceCacheKeys.unpostedJournals(tenantId);
    await this.cacheService.set(key, journals, this.TTL_QUERY);
  }

  /**
   * Financial Report Caching (longer TTL)
   */
  async getFinancialSummary<T>(
    tenantId: string,
    period: string
  ): Promise<T | null> {
    const key = FinanceCacheKeys.financialSummary(tenantId, period);
    return this.cacheService.get<T>(key);
  }

  async setFinancialSummary<T>(
    tenantId: string,
    period: string,
    summary: T
  ): Promise<void> {
    const key = FinanceCacheKeys.financialSummary(tenantId, period);
    await this.cacheService.set(key, summary, this.TTL_REPORT);
  }

  async getTrialBalance<T>(
    tenantId: string,
    fiscalYear: string
  ): Promise<T | null> {
    const key = FinanceCacheKeys.trialBalance(tenantId, fiscalYear);
    return this.cacheService.get<T>(key);
  }

  async setTrialBalance<T>(
    tenantId: string,
    fiscalYear: string,
    trialBalance: T
  ): Promise<void> {
    const key = FinanceCacheKeys.trialBalance(tenantId, fiscalYear);
    await this.cacheService.set(key, trialBalance, this.TTL_REPORT);
  }

  async getAccountBalance<T>(
    tenantId: string,
    accountId: string
  ): Promise<T | null> {
    const key = FinanceCacheKeys.accountBalance(tenantId, accountId);
    return this.cacheService.get<T>(key);
  }

  async setAccountBalance<T>(
    tenantId: string,
    accountId: string,
    balance: T
  ): Promise<void> {
    const key = FinanceCacheKeys.accountBalance(tenantId, accountId);
    await this.cacheService.set(key, balance, this.TTL_REPORT);
  }

  /**
   * Lookup/Reference Data Caching (longest TTL)
   */
  async getChartOfAccounts<T>(tenantId: string): Promise<T | null> {
    const key = FinanceCacheKeys.chartOfAccounts(tenantId);
    return this.cacheService.get<T>(key);
  }

  async setChartOfAccounts<T>(tenantId: string, accounts: T): Promise<void> {
    const key = FinanceCacheKeys.chartOfAccounts(tenantId);
    await this.cacheService.set(key, accounts, this.TTL_LOOKUP);
  }

  /**
   * Cache Invalidation
   */
  async invalidateAccount(tenantId: string, accountId?: string): Promise<void> {
    if (accountId) {
      await this.cacheService.delete(
        FinanceCacheKeys.accountById(tenantId, accountId)
      );
    }
    await this.cacheService.deleteByPattern(
      FinanceCacheKeys.allAccountQueries(tenantId)
    );
    await this.cacheService.deleteByPattern(
      FinanceCacheKeys.allReports(tenantId)
    );
    this.logger.debug(
      `Invalidated account cache for tenant: ${tenantId}${accountId ? `, account: ${accountId}` : ''}`
    );
  }

  async invalidateInvoice(tenantId: string, invoiceId?: string): Promise<void> {
    if (invoiceId) {
      await this.cacheService.delete(
        FinanceCacheKeys.invoiceById(tenantId, invoiceId)
      );
    }
    await this.cacheService.deleteByPattern(
      FinanceCacheKeys.allInvoiceQueries(tenantId)
    );
    await this.cacheService.deleteByPattern(
      FinanceCacheKeys.allReports(tenantId)
    );
    this.logger.debug(
      `Invalidated invoice cache for tenant: ${tenantId}${invoiceId ? `, invoice: ${invoiceId}` : ''}`
    );
  }

  async invalidatePayment(tenantId: string, paymentId?: string): Promise<void> {
    if (paymentId) {
      await this.cacheService.delete(
        FinanceCacheKeys.paymentById(tenantId, paymentId)
      );
    }
    await this.cacheService.deleteByPattern(
      FinanceCacheKeys.allPaymentQueries(tenantId)
    );
    await this.cacheService.deleteByPattern(
      FinanceCacheKeys.allReports(tenantId)
    );
    this.logger.debug(
      `Invalidated payment cache for tenant: ${tenantId}${paymentId ? `, payment: ${paymentId}` : ''}`
    );
  }

  async invalidateJournal(tenantId: string, journalId?: string): Promise<void> {
    if (journalId) {
      await this.cacheService.delete(
        FinanceCacheKeys.journalById(tenantId, journalId)
      );
    }
    await this.cacheService.deleteByPattern(
      FinanceCacheKeys.allJournalQueries(tenantId)
    );
    await this.cacheService.deleteByPattern(
      FinanceCacheKeys.allReports(tenantId)
    );
    this.logger.debug(
      `Invalidated journal cache for tenant: ${tenantId}${journalId ? `, journal: ${journalId}` : ''}`
    );
  }

  async invalidateAllReports(tenantId: string): Promise<void> {
    await this.cacheService.deleteByPattern(
      FinanceCacheKeys.allReports(tenantId)
    );
    this.logger.debug(`Invalidated all reports for tenant: ${tenantId}`);
  }

  async invalidateAllTenantCache(tenantId: string): Promise<void> {
    await this.cacheService.deleteByPattern(
      FinanceCacheKeys.allTenantCache(tenantId)
    );
    this.logger.warn(`Invalidated ALL cache for tenant: ${tenantId}`);
  }

  /**
   * Cache-Aside Pattern Helper
   * Get from cache, or compute and cache if missing
   */
  async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    // Try cache first
    const cached = await this.cacheService.get<T>(key);
    if (cached !== null) {
      this.logger.debug(`Cache HIT: ${key}`);
      return cached;
    }

    // Cache miss - compute value
    this.logger.debug(`Cache MISS: ${key} - computing...`);
    const value = await computeFn();

    // Cache the computed value
    await this.cacheService.set(key, value, ttl);

    return value;
  }
}
