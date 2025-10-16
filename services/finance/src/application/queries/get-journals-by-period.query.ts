/**
 * Get Journals By Period Query
 *
 * Query to retrieve all journal entries for a specific fiscal period.
 * Used for period-end closing, reporting, and reconciliation.
 *
 * Fiscal Period Format:
 * - FY2024-2025-P01 (July = P01)
 * - FY2024-2025-P12 (June = P12)
 * - Bangladesh fiscal year: July 1 to June 30
 *
 * Use Cases:
 * - Period-end closing
 * - Monthly financial reports
 * - Trial balance generation
 * - Fiscal year-end audit
 *
 * Ordering:
 * - Ordered by journalDate ASC (chronological)
 * - Secondary order by journalNumber
 *
 * CQRS Read Side:
 * - Queries PostgreSQL read model
 * - Filtered by fiscalPeriod index
 * - Optimized for period-based queries
 */
export class GetJournalsByPeriodQuery {
  constructor(
    public readonly fiscalPeriod: string,
    public readonly tenantId: string,
    public readonly limit: number = 100,
    public readonly offset: number = 0,
  ) {
    // Validate required fields
    if (!fiscalPeriod) throw new Error('fiscalPeriod is required');
    if (!tenantId) throw new Error('tenantId is required');

    // Validate fiscal period format
    const fiscalPeriodRegex = /^FY\d{4}-\d{4}-P(0[1-9]|1[0-2])$/;
    if (!fiscalPeriodRegex.test(fiscalPeriod)) {
      throw new Error(
        'Invalid fiscal period format. Expected: FY2024-2025-P01 (P01 to P12)'
      );
    }

    // Validate pagination
    if (limit < 1) throw new Error('limit must be at least 1');
    if (limit > 500) throw new Error('limit cannot exceed 500 for period queries');
    if (offset < 0) throw new Error('offset cannot be negative');
  }
}
