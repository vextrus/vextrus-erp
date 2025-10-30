/**
 * Get Account Query
 *
 * Query to retrieve a single chart of account by ID from the read model.
 * Uses PostgreSQL for fast queries (CQRS read model).
 */
export class GetAccountQuery {
  constructor(public readonly accountId: string) {
    if (!accountId) throw new Error('accountId is required');
  }
}
