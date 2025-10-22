/**
 * Get Trial Balance Query
 *
 * Retrieves trial balance report for a specific fiscal year.
 * Trial balance lists all accounts with debit/credit balances
 * and verifies that total debits equal total credits.
 *
 * Bangladesh Fiscal Year:
 * - Fiscal year runs from July 1 to June 30
 * - Format: "FY2024-2025" represents July 2024 to June 2025
 * - P01 = July (start), P12 = June (end)
 *
 * Query Pattern:
 * - CQRS Read Operation (queries read model only)
 * - Tenant-scoped (multi-tenant isolation)
 * - Cached with 30-minute TTL (expensive report)
 * - No write operations
 */
export class GetTrialBalanceQuery {
  /**
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @param fiscalYear - Fiscal year in format "FY2024-2025"
   * @param asOfDate - Optional: Calculate balance as of specific date (defaults to current date)
   */
  constructor(
    public readonly tenantId: string,
    public readonly fiscalYear: string,
    public readonly asOfDate?: Date,
  ) {}
}
