import { PaymentStatus } from '../../domain/aggregates/payment/payment.aggregate';

/**
 * Get Payments By Status Query
 *
 * Query to retrieve payments filtered by status.
 * Useful for tracking pending, failed, or reconciliation-needed payments.
 *
 * Common Use Cases:
 * - PENDING: Payments awaiting processing
 * - PROCESSING: Payments in progress
 * - FAILED: Payments that need retry or cancellation
 * - COMPLETED: Payments ready for reconciliation
 *
 * Returns:
 * - Array of Payment DTOs with the specified status
 * - Paginated with limit/offset
 * - Ordered by payment date (most recent first)
 */
export class GetPaymentsByStatusQuery {
  constructor(
    public readonly status: PaymentStatus,
    public readonly tenantId: string,
    public readonly limit: number = 50,
    public readonly offset: number = 0,
  ) {
    if (!status) throw new Error('status is required');
    if (!tenantId) throw new Error('tenantId is required');
    if (limit < 1 || limit > 100) {
      throw new Error('limit must be between 1 and 100');
    }
    if (offset < 0) {
      throw new Error('offset must be non-negative');
    }
  }
}
