import { TIN } from '../value-objects/tin.value-object';
import { Money } from '../value-objects/money.value-object';
import { BangladeshAddress } from '../value-objects/bangladesh-address.value-object';

/**
 * Base Domain Event
 */
export abstract class DomainEvent {
  public readonly occurredAt: Date;
  public readonly aggregateId: string;

  constructor(aggregateId: string) {
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
  }

  abstract get eventName(): string;
}

/**
 * Customer Created Event
 * Emitted when a new customer is registered in the system
 */
export class CustomerCreatedEvent extends DomainEvent {
  get eventName(): string {
    return 'customer.created';
  }

  constructor(
    aggregateId: string,
    public readonly tenantId: string,
    public readonly code: string,
    public readonly name: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly tin?: TIN,
    public readonly address?: BangladeshAddress
  ) {
    super(aggregateId);
  }
}

/**
 * Customer Updated Event
 * Emitted when customer information is modified
 */
export class CustomerUpdatedEvent extends DomainEvent {
  get eventName(): string {
    return 'customer.updated';
  }

  constructor(
    aggregateId: string,
    public readonly tenantId: string,
    public readonly changes: Record<string, any>
  ) {
    super(aggregateId);
  }
}

/**
 * Customer Credit Limit Changed Event
 * Emitted when customer's credit limit is modified
 */
export class CustomerCreditLimitChangedEvent extends DomainEvent {
  get eventName(): string {
    return 'customer.credit_limit_changed';
  }

  constructor(
    aggregateId: string,
    public readonly tenantId: string,
    public readonly previousLimit: Money,
    public readonly newLimit: Money,
    public readonly reason?: string
  ) {
    super(aggregateId);
  }
}

/**
 * Customer Outstanding Balance Updated Event
 * Emitted when customer's outstanding balance changes
 */
export class CustomerOutstandingBalanceUpdatedEvent extends DomainEvent {
  get eventName(): string {
    return 'customer.outstanding_balance_updated';
  }

  constructor(
    aggregateId: string,
    public readonly tenantId: string,
    public readonly previousBalance: Money,
    public readonly newBalance: Money,
    public readonly operation: 'increase' | 'decrease' | 'set'
  ) {
    super(aggregateId);
  }
}

/**
 * Customer Credit Limit Exceeded Event
 * Emitted when a transaction would exceed customer's credit limit
 */
export class CustomerCreditLimitExceededEvent extends DomainEvent {
  get eventName(): string {
    return 'customer.credit_limit_exceeded';
  }

  constructor(
    aggregateId: string,
    public readonly tenantId: string,
    public readonly requestedAmount: Money,
    public readonly availableCredit: Money,
    public readonly exceededBy: Money
  ) {
    super(aggregateId);
  }
}

/**
 * Customer Status Changed Event
 * Emitted when customer status changes (active, inactive, suspended, blacklisted)
 */
export class CustomerStatusChangedEvent extends DomainEvent {
  get eventName(): string {
    return 'customer.status_changed';
  }

  constructor(
    aggregateId: string,
    public readonly tenantId: string,
    public readonly previousStatus: string,
    public readonly newStatus: string,
    public readonly reason?: string
  ) {
    super(aggregateId);
  }
}

/**
 * Customer Blacklisted Event
 * Emitted when customer is blacklisted
 */
export class CustomerBlacklistedEvent extends DomainEvent {
  get eventName(): string {
    return 'customer.blacklisted';
  }

  constructor(
    aggregateId: string,
    public readonly tenantId: string,
    public readonly reason: string,
    public readonly blacklistedBy?: string
  ) {
    super(aggregateId);
  }
}

/**
 * Customer Loyalty Points Updated Event
 * Emitted when customer's loyalty points change
 */
export class CustomerLoyaltyPointsUpdatedEvent extends DomainEvent {
  get eventName(): string {
    return 'customer.loyalty_points_updated';
  }

  constructor(
    aggregateId: string,
    public readonly tenantId: string,
    public readonly previousPoints: number,
    public readonly newPoints: number,
    public readonly operation: 'add' | 'subtract' | 'set'
  ) {
    super(aggregateId);
  }
}

/**
 * Customer Purchase Made Event
 * Emitted when customer makes a purchase
 */
export class CustomerPurchaseMadeEvent extends DomainEvent {
  get eventName(): string {
    return 'customer.purchase_made';
  }

  constructor(
    aggregateId: string,
    public readonly tenantId: string,
    public readonly purchaseAmount: Money,
    public readonly orderId: string
  ) {
    super(aggregateId);
  }
}

/**
 * Customer Payment Received Event
 * Emitted when customer makes a payment
 */
export class CustomerPaymentReceivedEvent extends DomainEvent {
  get eventName(): string {
    return 'customer.payment_received';
  }

  constructor(
    aggregateId: string,
    public readonly tenantId: string,
    public readonly paymentAmount: Money,
    public readonly paymentMethod: string,
    public readonly transactionId: string
  ) {
    super(aggregateId);
  }
}
