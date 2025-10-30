import { LineItemDto } from '../../domain/aggregates/invoice/invoice.aggregate';

/**
 * Update Invoice Command
 *
 * Updates an existing invoice (DRAFT status only).
 * Follows CQRS pattern - command is executed by UpdateInvoiceHandler.
 *
 * Business Rules:
 * - Only DRAFT invoices can be updated
 * - Event sourcing: Updates are recorded as events, not destructive changes
 * - All fields are optional (partial updates supported)
 *
 * Bangladesh Compliance:
 * - TIN/BIN validation if provided
 * - Fiscal year auto-calculated from invoice date
 * - VAT rates recalculated if line items change
 */
export class UpdateInvoiceCommand {
  constructor(
    public readonly invoiceId: string,
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly customerId?: string,
    public readonly vendorId?: string,
    public readonly invoiceDate?: Date,
    public readonly dueDate?: Date,
    public readonly lineItems?: LineItemDto[],
    public readonly vendorTIN?: string,
    public readonly vendorBIN?: string,
    public readonly customerTIN?: string,
    public readonly customerBIN?: string,
  ) {}
}
