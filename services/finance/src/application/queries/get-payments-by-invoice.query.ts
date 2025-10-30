/**
 * Get Payments By Invoice Query
 *
 * Query to retrieve all payments for a specific invoice.
 * Useful for tracking invoice payment history and balance calculation.
 *
 * Returns:
 * - Array of Payment DTOs for the specified invoice
 * - Ordered by payment date (most recent first)
 */
export class GetPaymentsByInvoiceQuery {
  constructor(
    public readonly invoiceId: string,
    public readonly tenantId: string,
  ) {
    if (!invoiceId) throw new Error('invoiceId is required');
    if (!tenantId) throw new Error('tenantId is required');
  }
}
