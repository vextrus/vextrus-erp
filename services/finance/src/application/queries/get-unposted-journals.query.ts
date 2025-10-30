/**
 * Get Unposted Journals Query
 *
 * Query to retrieve all DRAFT journals that have not been posted.
 * Used for validation, review, and batch posting workflows.
 *
 * Use Cases:
 * - Review pending journals before posting
 * - Batch posting workflows
 * - Validation and error checking
 * - Period-end review (unposted items report)
 *
 * Business Rules:
 * - Only returns journals with status = DRAFT
 * - Ordered by journalDate ASC (oldest first for review)
 * - Includes all journal types
 * - Multi-tenant isolation enforced
 *
 * Ordering:
 * - Ordered by journalDate ASC (oldest first)
 * - Secondary order by createdAt ASC
 *
 * CQRS Read Side:
 * - Queries PostgreSQL read model
 * - Filtered by status index
 * - Optimized for workflow queries
 */
export class GetUnpostedJournalsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly limit: number = 100,
    public readonly offset: number = 0,
  ) {
    // Validate required fields
    if (!tenantId) throw new Error('tenantId is required');

    // Validate pagination
    if (limit < 1) throw new Error('limit must be at least 1');
    if (limit > 500) throw new Error('limit cannot exceed 500');
    if (offset < 0) throw new Error('offset cannot be negative');
  }
}
