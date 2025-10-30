/**
 * Reconcile Payment Command
 *
 * Command to reconcile a payment with bank statement transaction.
 * Used to match completed payments with actual bank transactions for financial accuracy.
 *
 * Business Rules:
 * - Payment must be in COMPLETED status
 * - Payment cannot already be RECONCILED
 * - Bank statement transaction ID is required for matching
 * - Reconciliation creates immutable audit trail
 */
export class ReconcilePaymentCommand {
  constructor(
    public readonly paymentId: string,
    public readonly bankStatementTransactionId: string,
    public readonly reconciledBy: string,
  ) {
    // Validate required fields
    if (!paymentId) throw new Error('paymentId is required');
    if (!bankStatementTransactionId) {
      throw new Error('bankStatementTransactionId is required');
    }
    if (!reconciledBy) throw new Error('reconciledBy (user ID) is required');

    // Validate bank transaction ID format
    if (bankStatementTransactionId.length < 5) {
      throw new Error('bankStatementTransactionId must be at least 5 characters');
    }
  }
}
