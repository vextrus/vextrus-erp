import { DomainEvent } from '../../../base/domain-event.base';
import { InvoiceId, VendorId, CustomerId, UserId, LineItemDto } from '../invoice.aggregate';

/**
 * Invoice Line Items Updated Event
 *
 * Emitted when line items are updated on a DRAFT invoice.
 * Triggers recalculation of totals, VAT, and taxes.
 */
export class InvoiceLineItemsUpdatedEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: InvoiceId,
    public readonly lineItems: LineItemDto[],
    public readonly updatedBy: UserId,
    tenantId: string,
  ) {
    super(
      invoiceId.value,
      'InvoiceLineItemsUpdated',
      {
        invoiceId: invoiceId.value,
        lineItems,
        updatedBy: updatedBy.value,
      },
      tenantId,
      updatedBy.value
    );
  }
}

/**
 * Invoice Dates Updated Event
 *
 * Emitted when invoice date or due date is updated.
 * May trigger fiscal year recalculation.
 */
export class InvoiceDatesUpdatedEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: InvoiceId,
    public readonly invoiceDate: Date,
    public readonly dueDate: Date,
    public readonly updatedBy: UserId,
    tenantId: string,
  ) {
    super(
      invoiceId.value,
      'InvoiceDatesUpdated',
      {
        invoiceId: invoiceId.value,
        invoiceDate,
        dueDate,
        updatedBy: updatedBy.value,
      },
      tenantId,
      updatedBy.value
    );
  }
}

/**
 * Invoice Customer Updated Event
 *
 * Emitted when the customer is changed on a DRAFT invoice.
 */
export class InvoiceCustomerUpdatedEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: InvoiceId,
    public readonly customerId: CustomerId,
    public readonly updatedBy: UserId,
    tenantId: string,
  ) {
    super(
      invoiceId.value,
      'InvoiceCustomerUpdated',
      {
        invoiceId: invoiceId.value,
        customerId: customerId.value,
        updatedBy: updatedBy.value,
      },
      tenantId,
      updatedBy.value
    );
  }
}

/**
 * Invoice Vendor Updated Event
 *
 * Emitted when the vendor is changed on a DRAFT invoice.
 */
export class InvoiceVendorUpdatedEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: InvoiceId,
    public readonly vendorId: VendorId,
    public readonly updatedBy: UserId,
    tenantId: string,
  ) {
    super(
      invoiceId.value,
      'InvoiceVendorUpdated',
      {
        invoiceId: invoiceId.value,
        vendorId: vendorId.value,
        updatedBy: updatedBy.value,
      },
      tenantId,
      updatedBy.value
    );
  }
}

/**
 * Invoice Tax Info Updated Event
 *
 * Emitted when TIN/BIN information is updated.
 * Bangladesh NBR compliance requirement.
 */
export class InvoiceTaxInfoUpdatedEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: InvoiceId,
    public readonly vendorTIN?: string,
    public readonly vendorBIN?: string,
    public readonly customerTIN?: string,
    public readonly customerBIN?: string,
    public readonly updatedBy?: UserId,
    tenantId?: string,
  ) {
    super(
      invoiceId.value,
      'InvoiceTaxInfoUpdated',
      {
        invoiceId: invoiceId.value,
        vendorTIN,
        vendorBIN,
        customerTIN,
        customerBIN,
        updatedBy: updatedBy?.value,
      },
      tenantId || '',
      updatedBy?.value
    );
  }
}
