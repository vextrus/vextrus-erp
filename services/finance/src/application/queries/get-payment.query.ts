/**
 * Get Payment Query
 *
 * Query to retrieve a single payment by ID.
 * Returns payment details from the read model (PostgreSQL).
 *
 * Returns:
 * - Payment DTO with all details
 * - null if payment not found
 */
export class GetPaymentQuery {
  constructor(
    public readonly paymentId: string,
  ) {
    if (!paymentId) throw new Error('paymentId is required');
  }
}
