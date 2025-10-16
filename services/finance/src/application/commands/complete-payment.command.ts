/**
 * Complete Payment Command
 *
 * Command to mark a payment as completed.
 * Used when payment processing is successful and transaction reference is received.
 *
 * Business Rules:
 * - Payment must be in PENDING or PROCESSING status
 * - Transaction reference is required for audit trail
 * - Once completed, payment can be reconciled or reversed
 */
export class CompletePaymentCommand {
  constructor(
    public readonly paymentId: string,
    public readonly transactionReference: string,
    public readonly userId: string,
  ) {
    // Validate required fields
    if (!paymentId) throw new Error('paymentId is required');
    if (!transactionReference) throw new Error('transactionReference is required');
    if (!userId) throw new Error('userId is required');

    // Validate transaction reference format
    if (transactionReference.length < 5) {
      throw new Error('transactionReference must be at least 5 characters');
    }
  }
}
