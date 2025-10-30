import { LineItemDto } from '../../domain/aggregates/invoice/invoice.aggregate';

/**
 * Create Invoice Command
 *
 * Command to create a new invoice in the system.
 * Contains all necessary data for invoice creation including line items,
 * customer/vendor information, and Bangladesh compliance fields (TIN/BIN).
 */
export class CreateInvoiceCommand {
  constructor(
    public readonly customerId: string,
    public readonly vendorId: string,
    public readonly invoiceDate: Date,
    public readonly dueDate: Date,
    public readonly lineItems: LineItemDto[],
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly vendorTIN?: string,
    public readonly vendorBIN?: string,
    public readonly customerTIN?: string,
    public readonly customerBIN?: string,
  ) {
    // Validate required fields
    if (!customerId) throw new Error('customerId is required');
    if (!vendorId) throw new Error('vendorId is required');
    if (!invoiceDate) throw new Error('invoiceDate is required');
    if (!dueDate) throw new Error('dueDate is required');
    if (!lineItems || lineItems.length === 0) {
      throw new Error('At least one line item is required');
    }
    if (!tenantId) throw new Error('tenantId is required');
    if (!userId) throw new Error('userId is required');

    // Validate dates
    if (dueDate < invoiceDate) {
      throw new Error('Due date cannot be before invoice date');
    }
  }
}
