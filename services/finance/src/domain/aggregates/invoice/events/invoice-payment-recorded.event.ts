import { DomainEvent } from '../../../base/domain-event.base';
import { InvoiceId } from '../invoice.aggregate';
import { PaymentId } from '../../payment/payment.aggregate';
import { Money } from '../../../value-objects/money.value-object';

/**
 * Invoice Payment Recorded Event
 *
 * Emitted when a payment is recorded against an invoice.
 * Updates the invoice's paid amount and automatically transitions
 * the invoice to PAID status if fully paid.
 *
 * Business Rules:
 * - Can only record payment on APPROVED invoices
 * - Cannot record payment on DRAFT or CANCELLED invoices
 * - Cannot overpay an invoice (paidAmount <= grandTotal)
 * - If remainingAmount === 0, invoice auto-transitions to PAID
 *
 * Event Sourcing Pattern:
 * - Domain event emitted by Invoice aggregate
 * - Projected to InvoiceReadModel by InvoiceProjectionHandler
 * - Triggers cache invalidation for invoice queries
 *
 * Payment Linking:
 * - Links Payment aggregate to Invoice aggregate
 * - Payment.invoiceId already exists (one-to-many relationship)
 * - This event enables tracking total payments received per invoice
 */
export class InvoicePaymentRecordedEvent extends DomainEvent {
  constructor(
    /** Invoice that received the payment */
    public readonly invoiceId: InvoiceId,

    /** Payment that was applied to this invoice */
    public readonly paymentId: PaymentId,

    /** Amount of this specific payment */
    public readonly paymentAmount: Money,

    /** Previous total paid amount before this payment */
    public readonly previousPaidAmount: Money,

    /** New total paid amount after this payment */
    public readonly newPaidAmount: Money,

    /** Remaining amount to be paid (grandTotal - newPaidAmount) */
    public readonly remainingAmount: Money,

    /** Tenant ID for multi-tenant isolation */
    tenantId: string,
  ) {
    super(
      invoiceId.value,
      'InvoicePaymentRecorded',
      {
        invoiceId: invoiceId.value,
        paymentId: paymentId.value,
        paymentAmount: {
          amount: paymentAmount.getAmount(),
          currency: paymentAmount.getCurrency(),
        },
        previousPaidAmount: {
          amount: previousPaidAmount.getAmount(),
          currency: previousPaidAmount.getCurrency(),
        },
        newPaidAmount: {
          amount: newPaidAmount.getAmount(),
          currency: newPaidAmount.getCurrency(),
        },
        remainingAmount: {
          amount: remainingAmount.getAmount(),
          currency: remainingAmount.getCurrency(),
        },
      },
      tenantId,
    );
  }
}

/**
 * Invoice Fully Paid Event
 *
 * Emitted when an invoice is fully paid (remainingAmount === 0).
 * This is a derived event that happens automatically when
 * InvoicePaymentRecordedEvent results in zero remaining balance.
 *
 * Use Cases:
 * - Triggers automatic invoice status change to PAID
 * - Can trigger business workflows (notifications, approvals, etc.)
 * - Used for reporting and analytics
 */
export class InvoiceFullyPaidEvent extends DomainEvent {
  constructor(
    /** Invoice that is now fully paid */
    public readonly invoiceId: InvoiceId,

    /** Final payment that completed the invoice */
    public readonly finalPaymentId: PaymentId,

    /** Total amount paid (should equal grandTotal) */
    public readonly totalPaidAmount: Money,

    /** When the invoice was fully paid */
    public readonly paidAt: Date,

    /** Tenant ID */
    tenantId: string,
  ) {
    super(
      invoiceId.value,
      'InvoiceFullyPaid',
      {
        invoiceId: invoiceId.value,
        finalPaymentId: finalPaymentId.value,
        totalPaidAmount: {
          amount: totalPaidAmount.getAmount(),
          currency: totalPaidAmount.getCurrency(),
        },
        paidAt,
      },
      tenantId,
    );
  }
}
