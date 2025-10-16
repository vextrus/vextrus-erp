/**
 * Get Invoice Query
 *
 * Query to retrieve a single invoice by ID from the read model.
 * Uses PostgreSQL for fast queries (CQRS read model).
 */
export class GetInvoiceQuery {
  constructor(public readonly invoiceId: string) {
    if (!invoiceId) throw new Error('invoiceId is required');
  }
}
