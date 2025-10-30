/**
 * Get Account By Code Query
 *
 * Query to retrieve a single chart of account by account code from the read model.
 * Account codes are unique per tenant.
 * Uses PostgreSQL for fast queries (CQRS read model).
 *
 * Bangladesh Compliance:
 * - Account code format: XXXX or XXXX-YY-ZZ (hierarchical)
 */
export class GetAccountByCodeQuery {
  constructor(
    public readonly accountCode: string,
    public readonly tenantId: string,
  ) {
    if (!accountCode) throw new Error('accountCode is required');
    if (!tenantId) throw new Error('tenantId is required');

    // Validate account code format
    if (!/^\d{4}(-\d{2})*$/.test(accountCode)) {
      throw new Error('Account code must follow Bangladesh format: XXXX or XXXX-YY-ZZ');
    }
  }
}
