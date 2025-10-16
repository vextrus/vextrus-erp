/**
 * Fail Payment Command
 *
 * Command to mark a payment as failed.
 * Used when payment processing fails or is rejected by payment gateway.
 *
 * Business Rules:
 * - Payment must be in PENDING or PROCESSING status
 * - Failure reason is required for audit and troubleshooting
 * - Failed payments can be retried or cancelled
 */
export class FailPaymentCommand {
  constructor(
    public readonly paymentId: string,
    public readonly reason: string,
    public readonly userId: string,
  ) {
    // Validate required fields
    if (!paymentId) throw new Error('paymentId is required');
    if (!reason) throw new Error('reason is required');
    if (!userId) throw new Error('userId is required');

    // Validate reason length
    if (reason.length < 10) {
      throw new Error('reason must be at least 10 characters for audit purposes');
    }

    if (reason.length > 500) {
      throw new Error('reason must not exceed 500 characters');
    }
  }
}
