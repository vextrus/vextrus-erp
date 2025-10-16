import { JournalType, JournalStatus } from '../../domain/aggregates/journal/journal-entry.aggregate';

/**
 * Get Journals Query
 *
 * Query to retrieve multiple journal entries with optional filters.
 * Supports pagination and filtering by type, status, and fiscal period.
 *
 * Filters:
 * - journalType: GENERAL, SALES, PURCHASE, etc. (optional)
 * - status: DRAFT, POSTED, REVERSED, etc. (optional)
 * - fiscalPeriod: FY2024-2025-P01 format (optional)
 * - tenantId: Multi-tenant isolation (required)
 *
 * Pagination:
 * - limit: Maximum number of results (default 50, max 200)
 * - offset: Number of results to skip (default 0)
 *
 * Ordering:
 * - Ordered by journalDate DESC (newest first)
 * - Secondary order by journalNumber
 *
 * CQRS Read Side:
 * - Queries PostgreSQL read model with indexes
 * - Fast filtering and pagination
 * - Optimized for list views
 */
export class GetJournalsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly journalType?: JournalType,
    public readonly status?: JournalStatus,
    public readonly fiscalPeriod?: string,
    public readonly limit: number = 50,
    public readonly offset: number = 0,
  ) {
    // Validate required fields
    if (!tenantId) throw new Error('tenantId is required');

    // Validate pagination
    if (limit < 1) throw new Error('limit must be at least 1');
    if (limit > 200) throw new Error('limit cannot exceed 200');
    if (offset < 0) throw new Error('offset cannot be negative');

    // Validate fiscal period format if provided
    if (fiscalPeriod) {
      const fiscalPeriodRegex = /^FY\d{4}-\d{4}-P(0[1-9]|1[0-2])$/;
      if (!fiscalPeriodRegex.test(fiscalPeriod)) {
        throw new Error(
          'Invalid fiscal period format. Expected: FY2024-2025-P01 (P01 to P12)'
        );
      }
    }
  }
}
