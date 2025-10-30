/**
 * Get Invoices Query
 *
 * Query to retrieve a list of invoices from the read model.
 * Supports filtering by organization and pagination.
 */
export class GetInvoicesQuery {
  constructor(
    public readonly organizationId?: string,
    public readonly limit: number = 50,
    public readonly offset: number = 0,
  ) {
    if (limit && (limit < 1 || limit > 100)) {
      throw new Error('Limit must be between 1 and 100');
    }
    if (offset && offset < 0) {
      throw new Error('Offset cannot be negative');
    }
  }
}
