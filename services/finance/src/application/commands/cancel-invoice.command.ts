/**
 * Cancel Invoice Command
 *
 * Command to cancel an invoice.
 * Requires a reason for audit trail purposes.
 * Cannot cancel paid invoices.
 */
export class CancelInvoiceCommand {
  constructor(
    public readonly invoiceId: string,
    public readonly reason: string,
    public readonly userId: string,
  ) {
    if (!invoiceId) throw new Error('invoiceId is required');
    if (!reason || reason.trim().length === 0) {
      throw new Error('Cancellation reason is required');
    }
    if (!userId) throw new Error('userId is required');
  }
}
