/**
 * Approve Invoice Command
 *
 * Command to approve a draft invoice.
 * Once approved, the invoice status changes to APPROVED and a Mushak number is generated.
 */
export class ApproveInvoiceCommand {
  constructor(
    public readonly invoiceId: string,
    public readonly userId: string,
  ) {
    if (!invoiceId) throw new Error('invoiceId is required');
    if (!userId) throw new Error('userId is required');
  }
}
