/**
 * Finance Service Cache Keys
 *
 * Centralized cache key generation for finance service.
 * All keys are tenant-scoped to prevent cross-tenant data leakage.
 *
 * Key Patterns:
 * - query:* - Database query results (TTL: 60s)
 * - report:* - Aggregated financial reports (TTL: 1800s = 30 minutes)
 * - lookup:* - Reference data (TTL: 7200s = 2 hours)
 * - temp:* - Temporary validation data (TTL: 300s = 5 minutes)
 *
 * Bangladesh Compliance:
 * - All financial data cached with tenant isolation
 * - Cache keys include fiscal period for period-specific data
 * - NBR reporting data cached separately for audit trail
 */

export class FinanceCacheKeys {
  /**
   * Account Query Keys (TTL: 60s)
   */
  static accountById(tenantId: string, accountId: string): string {
    return `query:account:${tenantId}:${accountId}`;
  }

  static accountByCode(tenantId: string, accountCode: string): string {
    return `query:account:${tenantId}:code:${accountCode}`;
  }

  static accountsList(tenantId: string, accountType?: string): string {
    return accountType
      ? `query:accounts:${tenantId}:type:${accountType}`
      : `query:accounts:${tenantId}:all`;
  }

  /**
   * Invoice Query Keys (TTL: 60s)
   */
  static invoiceById(tenantId: string, invoiceId: string): string {
    return `query:invoice:${tenantId}:${invoiceId}`;
  }

  static invoicesList(
    tenantId: string,
    options?: { status?: string; page?: number; limit?: number }
  ): string {
    const parts = [`query:invoices:${tenantId}`];
    if (options?.status) parts.push(`status:${options.status}`);
    if (options?.page) parts.push(`page:${options.page}`);
    if (options?.limit) parts.push(`limit:${options.limit}`);
    return parts.join(':');
  }

  /**
   * Payment Query Keys (TTL: 60s)
   */
  static paymentById(tenantId: string, paymentId: string): string {
    return `query:payment:${tenantId}:${paymentId}`;
  }

  static paymentsByInvoice(tenantId: string, invoiceId: string): string {
    return `query:payments:${tenantId}:invoice:${invoiceId}`;
  }

  static paymentsByStatus(tenantId: string, status: string): string {
    return `query:payments:${tenantId}:status:${status}`;
  }

  static paymentsList(tenantId: string, page?: number): string {
    return page
      ? `query:payments:${tenantId}:page:${page}`
      : `query:payments:${tenantId}:all`;
  }

  /**
   * Journal Query Keys (TTL: 60s)
   */
  static journalById(tenantId: string, journalId: string): string {
    return `query:journal:${tenantId}:${journalId}`;
  }

  static journalsByPeriod(tenantId: string, fiscalPeriod: string): string {
    return `query:journals:${tenantId}:period:${fiscalPeriod}`;
  }

  static unpostedJournals(tenantId: string): string {
    return `query:journals:${tenantId}:unposted`;
  }

  static journalsList(tenantId: string): string {
    return `query:journals:${tenantId}:all`;
  }

  /**
   * Financial Report Keys (TTL: 1800s = 30 minutes)
   */
  static financialSummary(tenantId: string, period: string): string {
    return `report:financial-summary:${tenantId}:${period}`;
  }

  static entityTransactions(
    tenantId: string,
    entityType: string,
    entityId: string,
    period?: string
  ): string {
    return period
      ? `report:entity-transactions:${tenantId}:${entityType}:${entityId}:${period}`
      : `report:entity-transactions:${tenantId}:${entityType}:${entityId}`;
  }

  static trialBalance(tenantId: string, fiscalYear: string): string {
    return `report:trial-balance:${tenantId}:${fiscalYear}`;
  }

  static accountBalance(tenantId: string, accountId: string): string {
    return `report:account-balance:${tenantId}:${accountId}`;
  }

  /**
   * Lookup/Reference Data Keys (TTL: 7200s = 2 hours)
   */
  static chartOfAccounts(tenantId: string): string {
    return `lookup:chart-of-accounts:${tenantId}`;
  }

  static fiscalPeriods(tenantId: string): string {
    return `lookup:fiscal-periods:${tenantId}`;
  }

  /**
   * Temporary/Validation Keys (TTL: 300s = 5 minutes)
   */
  static invoiceValidation(tenantId: string, invoiceId: string): string {
    return `temp:invoice-validation:${tenantId}:${invoiceId}`;
  }

  static journalBalanceCheck(tenantId: string, journalId: string): string {
    return `temp:journal-balance:${tenantId}:${journalId}`;
  }

  /**
   * Invalidation Pattern Generators
   * Use with deleteByPattern() to clear multiple related keys
   */
  static allAccountQueries(tenantId: string): string {
    return `query:account*:${tenantId}:*`;
  }

  static allInvoiceQueries(tenantId: string): string {
    return `query:invoice*:${tenantId}:*`;
  }

  static allPaymentQueries(tenantId: string): string {
    return `query:payment*:${tenantId}:*`;
  }

  static allJournalQueries(tenantId: string): string {
    return `query:journal*:${tenantId}:*`;
  }

  static allReports(tenantId: string): string {
    return `report:*:${tenantId}:*`;
  }

  static allTenantCache(tenantId: string): string {
    return `*:${tenantId}:*`;
  }
}
