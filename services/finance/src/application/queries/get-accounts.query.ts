import { AccountType } from '../../domain/aggregates/chart-of-account/chart-of-account.aggregate';

/**
 * Get Accounts Query
 *
 * Query to retrieve a list of chart of accounts from the read model.
 * Supports filtering by account type and active status.
 * Uses PostgreSQL for fast queries (CQRS read model).
 *
 * Multi-Tenancy:
 * - Results automatically filtered by tenantId via TenantContext
 */
export class GetAccountsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly accountType?: AccountType,
    public readonly isActive?: boolean,
    public readonly limit: number = 100,
    public readonly offset: number = 0,
  ) {
    if (!tenantId) throw new Error('tenantId is required');
    if (limit < 1 || limit > 1000) {
      throw new Error('limit must be between 1 and 1000');
    }
    if (offset < 0) {
      throw new Error('offset must be non-negative');
    }
  }
}
