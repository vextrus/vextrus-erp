import { PaymentStatus, PaymentMethod } from '../../domain/aggregates/payment/payment.aggregate';

/**
 * Get Payments Query
 *
 * Query to retrieve payments with optional filters.
 * Returns paginated list of payments from the read model (PostgreSQL).
 *
 * Filters:
 * - tenantId: Required for multi-tenant isolation
 * - invoiceId: Optional filter by specific invoice
 * - status: Optional filter by payment status
 * - paymentMethod: Optional filter by payment method
 * - limit/offset: Pagination parameters
 *
 * Returns:
 * - Array of Payment DTOs
 */
export class GetPaymentsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly invoiceId?: string,
    public readonly status?: PaymentStatus,
    public readonly paymentMethod?: PaymentMethod,
    public readonly limit: number = 50,
    public readonly offset: number = 0,
  ) {
    if (!tenantId) throw new Error('tenantId is required');
    if (limit < 1 || limit > 100) {
      throw new Error('limit must be between 1 and 100');
    }
    if (offset < 0) {
      throw new Error('offset must be non-negative');
    }
  }
}
