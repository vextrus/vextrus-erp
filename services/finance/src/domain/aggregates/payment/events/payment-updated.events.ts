import { DomainEvent } from '../../../base/domain-event.base';
import { PaymentId, PaymentMethod, BankAccountId } from '../payment.aggregate';
import { UserId } from '../../invoice/invoice.aggregate';
import { Money } from '../../../value-objects/money.value-object';

/**
 * Payment Amount Updated Event
 *
 * Emitted when payment amount is updated on a PENDING payment.
 */
export class PaymentAmountUpdatedEvent extends DomainEvent {
  constructor(
    public readonly paymentId: PaymentId,
    public readonly amount: Money,
    public readonly updatedBy: UserId,
    tenantId: string,
  ) {
    super(
      paymentId.value,
      'PaymentAmountUpdated',
      {
        paymentId: paymentId.value,
        amount: { amount: amount.getAmount(), currency: amount.getCurrency() },
        updatedBy: updatedBy.value,
      },
      tenantId,
      updatedBy.value
    );
  }
}

/**
 * Payment Date Updated Event
 *
 * Emitted when payment date is updated.
 */
export class PaymentDateUpdatedEvent extends DomainEvent {
  constructor(
    public readonly paymentId: PaymentId,
    public readonly paymentDate: Date,
    public readonly updatedBy: UserId,
    tenantId: string,
  ) {
    super(
      paymentId.value,
      'PaymentDateUpdated',
      {
        paymentId: paymentId.value,
        paymentDate,
        updatedBy: updatedBy.value,
      },
      tenantId,
      updatedBy.value
    );
  }
}

/**
 * Payment Method Updated Event
 *
 * Emitted when payment method is changed on a PENDING payment.
 */
export class PaymentMethodUpdatedEvent extends DomainEvent {
  constructor(
    public readonly paymentId: PaymentId,
    public readonly paymentMethod: PaymentMethod,
    public readonly updatedBy: UserId,
    tenantId: string,
  ) {
    super(
      paymentId.value,
      'PaymentMethodUpdated',
      {
        paymentId: paymentId.value,
        paymentMethod,
        updatedBy: updatedBy.value,
      },
      tenantId,
      updatedBy.value
    );
  }
}

/**
 * Payment Reference Updated Event
 *
 * Emitted when payment reference is updated.
 */
export class PaymentReferenceUpdatedEvent extends DomainEvent {
  constructor(
    public readonly paymentId: PaymentId,
    public readonly reference: string,
    public readonly updatedBy: UserId,
    tenantId: string,
  ) {
    super(
      paymentId.value,
      'PaymentReferenceUpdated',
      {
        paymentId: paymentId.value,
        reference,
        updatedBy: updatedBy.value,
      },
      tenantId,
      updatedBy.value
    );
  }
}

/**
 * Payment Bank Details Updated Event
 *
 * Emitted when bank account or check number is updated.
 */
export class PaymentBankDetailsUpdatedEvent extends DomainEvent {
  constructor(
    public readonly paymentId: PaymentId,
    public readonly bankAccountId?: BankAccountId,
    public readonly checkNumber?: string,
    public readonly updatedBy?: UserId,
    tenantId?: string,
  ) {
    super(
      paymentId.value,
      'PaymentBankDetailsUpdated',
      {
        paymentId: paymentId.value,
        bankAccountId: bankAccountId?.value,
        checkNumber,
        updatedBy: updatedBy?.value,
      },
      tenantId || '',
      updatedBy?.value
    );
  }
}
