/**
 * Reverse Payment Command
 *
 * Command to reverse a completed or reconciled payment.
 * Used for refunds, chargebacks, or error corrections.
 *
 * Business Rules:
 * - Payment must be in COMPLETED or RECONCILED status
 * - Reversal reason is required for audit trail
 * - Reversed payments create compensating transactions
 * - Reversal is logged with user ID for accountability
 */
export class ReversePaymentCommand {
  constructor(
    public readonly paymentId: string,
    public readonly reason: string,
    public readonly reversedBy: string,
  ) {
    // Validate required fields
    if (!paymentId) throw new Error('paymentId is required');
    if (!reason) throw new Error('reason is required');
    if (!reversedBy) throw new Error('reversedBy (user ID) is required');

    // Validate reason length
    if (reason.length < 10) {
      throw new Error('reason must be at least 10 characters for audit purposes');
    }

    if (reason.length > 500) {
      throw new Error('reason must not exceed 500 characters');
    }
  }
}
