/**
 * Get Journal Query
 *
 * Query to retrieve a single journal entry by ID from the read model.
 * Returns complete journal details including all lines.
 *
 * CQRS Read Side:
 * - Queries PostgreSQL read model (not EventStore)
 * - Optimized for fast retrieval
 * - Includes denormalized data for performance
 * - Returns null if not found
 */
export class GetJournalQuery {
  constructor(
    public readonly journalId: string,
  ) {
    if (!journalId) throw new Error('journalId is required');
  }
}
