import { BadRequestException } from '@nestjs/common';
import { TIN } from '../value-objects/tin.value-object';
import { Money } from '../value-objects/money.value-object';
import { BangladeshAddress } from '../value-objects/bangladesh-address.value-object';
import {
  DomainEvent,
  CustomerCreatedEvent,
  CustomerUpdatedEvent,
  CustomerCreditLimitChangedEvent,
  CustomerOutstandingBalanceUpdatedEvent,
  CustomerCreditLimitExceededEvent,
  CustomerStatusChangedEvent,
  CustomerBlacklistedEvent,
  CustomerLoyaltyPointsUpdatedEvent,
  CustomerPurchaseMadeEvent,
  CustomerPaymentReceivedEvent,
} from '../events/customer.events';

/**
 * Customer Status Enum
 */
export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  BLACKLISTED = 'BLACKLISTED',
}

/**
 * Customer Type Enum
 */
export enum CustomerType {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS',
  GOVERNMENT = 'GOVERNMENT',
}

/**
 * Customer Aggregate Root
 * Encapsulates all business logic related to customer management
 *
 * Business Rules:
 * - Cannot exceed credit limit
 * - Cannot make purchases when blacklisted or suspended
 * - Loyalty points cannot be negative
 * - Outstanding balance cannot be negative
 * - Credit limit must be positive
 */
export class CustomerAggregate {
  private id: string;
  private tenantId: string;
  private code: string;
  private name: string;
  private nameBn?: string;
  private email: string;
  private phone: string;
  private phoneSecondary?: string;
  private tin?: TIN;
  private nid?: string;
  private customerType: CustomerType;
  private status: CustomerStatus;
  private creditLimit: Money;
  private outstandingBalance: Money;
  private totalRevenue: Money;
  private totalPurchases: number;
  private loyaltyPoints: number;
  private address?: BangladeshAddress;
  private blacklistReason?: string;
  private lastPurchaseDate?: Date;
  private createdAt: Date;
  private updatedAt: Date;

  // Domain events pending to be published
  private domainEvents: DomainEvent[] = [];

  private constructor() {
    // Private constructor - use static factory methods
  }

  /**
   * Create new Customer Aggregate
   */
  static create(params: {
    id: string;
    tenantId: string;
    code: string;
    name: string;
    email: string;
    phone: string;
    customerType: CustomerType;
    tin?: string;
    nid?: string;
    nameBn?: string;
    phoneSecondary?: string;
    address?: {
      line1: string;
      line2?: string;
      area: string;
      district: string;
      division: string;
      postalCode: string;
    };
    creditLimit?: number;
  }): CustomerAggregate {
    const customer = new CustomerAggregate();

    // Set basic properties
    customer.id = params.id;
    customer.tenantId = params.tenantId;
    customer.code = params.code;
    customer.name = params.name;
    customer.nameBn = params.nameBn;
    customer.email = params.email;
    customer.phone = params.phone;
    customer.phoneSecondary = params.phoneSecondary;
    customer.nid = params.nid;
    customer.customerType = params.customerType;
    customer.status = CustomerStatus.ACTIVE;
    customer.loyaltyPoints = 0;
    customer.totalPurchases = 0;
    customer.createdAt = new Date();
    customer.updatedAt = new Date();

    // Create value objects
    customer.tin = params.tin ? TIN.create(params.tin) : undefined;
    customer.address = params.address
      ? BangladeshAddress.create(params.address)
      : undefined;

    // Initialize monetary values
    customer.creditLimit = Money.create(params.creditLimit || 0);
    customer.outstandingBalance = Money.zero();
    customer.totalRevenue = Money.zero();

    // Validate business rules
    customer.validateInvariants();

    // Emit domain event
    customer.addDomainEvent(
      new CustomerCreatedEvent(
        customer.id,
        customer.tenantId,
        customer.code,
        customer.name,
        customer.email,
        customer.phone,
        customer.tin,
        customer.address
      )
    );

    return customer;
  }

  /**
   * Reconstitute aggregate from database
   */
  static fromDatabase(data: any): CustomerAggregate {
    const customer = new CustomerAggregate();

    customer.id = data.id;
    customer.tenantId = data.tenant_id;
    customer.code = data.code;
    customer.name = data.name;
    customer.nameBn = data.name_bn;
    customer.email = data.email;
    customer.phone = data.phone;
    customer.phoneSecondary = data.phone_secondary;
    customer.nid = data.nid;
    customer.customerType = data.customer_type;
    customer.status = data.status;
    customer.loyaltyPoints = data.loyalty_points || 0;
    customer.totalPurchases = data.total_purchases || 0;
    customer.blacklistReason = data.blacklist_reason;
    customer.lastPurchaseDate = data.last_purchase_date;
    customer.createdAt = data.created_at;
    customer.updatedAt = data.updated_at;

    // Reconstitute value objects
    customer.tin = data.tin ? TIN.create(data.tin) : undefined;
    customer.address = data.address
      ? BangladeshAddress.fromJSON(data.address)
      : undefined;
    customer.creditLimit = Money.create(data.credit_limit || 0);
    customer.outstandingBalance = Money.create(data.outstanding_balance || 0);
    customer.totalRevenue = Money.create(data.total_revenue || 0);

    return customer;
  }

  /**
   * Update customer information
   */
  updateInformation(changes: {
    name?: string;
    nameBn?: string;
    email?: string;
    phone?: string;
    phoneSecondary?: string;
    tin?: string;
    nid?: string;
    address?: {
      line1: string;
      line2?: string;
      area: string;
      district: string;
      division: string;
      postalCode: string;
    };
  }): void {
    const previousState = { ...this };

    if (changes.name) this.name = changes.name;
    if (changes.nameBn) this.nameBn = changes.nameBn;
    if (changes.email) this.email = changes.email;
    if (changes.phone) this.phone = changes.phone;
    if (changes.phoneSecondary) this.phoneSecondary = changes.phoneSecondary;
    if (changes.nid) this.nid = changes.nid;
    if (changes.tin) this.tin = TIN.create(changes.tin);
    if (changes.address) this.address = BangladeshAddress.create(changes.address);

    this.updatedAt = new Date();
    this.validateInvariants();

    this.addDomainEvent(
      new CustomerUpdatedEvent(this.id, this.tenantId, changes)
    );
  }

  /**
   * Change credit limit
   */
  changeCreditLimit(newLimit: number, reason?: string): void {
    if (newLimit < 0) {
      throw new BadRequestException('Credit limit cannot be negative');
    }

    const previousLimit = this.creditLimit;
    this.creditLimit = Money.create(newLimit);
    this.updatedAt = new Date();

    this.addDomainEvent(
      new CustomerCreditLimitChangedEvent(
        this.id,
        this.tenantId,
        previousLimit,
        this.creditLimit,
        reason
      )
    );
  }

  /**
   * Validate if customer can make a purchase
   */
  validatePurchase(amount: Money): {
    canPurchase: boolean;
    reason?: string;
  } {
    // Check if customer is active
    if (this.status === CustomerStatus.BLACKLISTED) {
      return {
        canPurchase: false,
        reason: 'Customer is blacklisted',
      };
    }

    if (this.status === CustomerStatus.SUSPENDED) {
      return {
        canPurchase: false,
        reason: 'Customer account is suspended',
      };
    }

    if (this.status === CustomerStatus.INACTIVE) {
      return {
        canPurchase: false,
        reason: 'Customer account is inactive',
      };
    }

    // Check credit limit
    const availableCredit = this.creditLimit.subtract(this.outstandingBalance);
    if (amount.greaterThan(availableCredit)) {
      const exceededBy = amount.subtract(availableCredit);

      this.addDomainEvent(
        new CustomerCreditLimitExceededEvent(
          this.id,
          this.tenantId,
          amount,
          availableCredit,
          exceededBy
        )
      );

      return {
        canPurchase: false,
        reason: `Purchase amount exceeds available credit by ${exceededBy.format()}`,
      };
    }

    return { canPurchase: true };
  }

  /**
   * Record a purchase
   */
  recordPurchase(amount: Money, orderId: string): void {
    const validation = this.validatePurchase(amount);
    if (!validation.canPurchase) {
      throw new BadRequestException(validation.reason);
    }

    const previousBalance = this.outstandingBalance;
    this.outstandingBalance = this.outstandingBalance.add(amount);
    this.totalRevenue = this.totalRevenue.add(amount);
    this.totalPurchases += 1;
    this.lastPurchaseDate = new Date();
    this.updatedAt = new Date();

    // Award loyalty points (1 point per 100 BDT)
    const pointsEarned = Math.floor(amount.getAmount() / 100);
    if (pointsEarned > 0) {
      this.addLoyaltyPoints(pointsEarned);
    }

    this.addDomainEvent(
      new CustomerOutstandingBalanceUpdatedEvent(
        this.id,
        this.tenantId,
        previousBalance,
        this.outstandingBalance,
        'increase'
      )
    );

    this.addDomainEvent(
      new CustomerPurchaseMadeEvent(
        this.id,
        this.tenantId,
        amount,
        orderId
      )
    );
  }

  /**
   * Record a payment
   */
  recordPayment(amount: Money, paymentMethod: string, transactionId: string): void {
    if (amount.lessThanOrEqual(Money.zero())) {
      throw new BadRequestException('Payment amount must be positive');
    }

    if (amount.greaterThan(this.outstandingBalance)) {
      throw new BadRequestException(
        'Payment amount cannot exceed outstanding balance'
      );
    }

    const previousBalance = this.outstandingBalance;
    this.outstandingBalance = this.outstandingBalance.subtract(amount);
    this.updatedAt = new Date();

    this.addDomainEvent(
      new CustomerOutstandingBalanceUpdatedEvent(
        this.id,
        this.tenantId,
        previousBalance,
        this.outstandingBalance,
        'decrease'
      )
    );

    this.addDomainEvent(
      new CustomerPaymentReceivedEvent(
        this.id,
        this.tenantId,
        amount,
        paymentMethod,
        transactionId
      )
    );
  }

  /**
   * Add loyalty points
   */
  addLoyaltyPoints(points: number): void {
    if (points < 0) {
      throw new BadRequestException('Cannot add negative loyalty points');
    }

    const previousPoints = this.loyaltyPoints;
    this.loyaltyPoints += points;
    this.updatedAt = new Date();

    this.addDomainEvent(
      new CustomerLoyaltyPointsUpdatedEvent(
        this.id,
        this.tenantId,
        previousPoints,
        this.loyaltyPoints,
        'add'
      )
    );
  }

  /**
   * Redeem loyalty points
   */
  redeemLoyaltyPoints(points: number): void {
    if (points < 0) {
      throw new BadRequestException('Cannot redeem negative loyalty points');
    }

    if (points > this.loyaltyPoints) {
      throw new BadRequestException('Insufficient loyalty points');
    }

    const previousPoints = this.loyaltyPoints;
    this.loyaltyPoints -= points;
    this.updatedAt = new Date();

    this.addDomainEvent(
      new CustomerLoyaltyPointsUpdatedEvent(
        this.id,
        this.tenantId,
        previousPoints,
        this.loyaltyPoints,
        'subtract'
      )
    );
  }

  /**
   * Suspend customer account
   */
  suspend(reason?: string): void {
    if (this.status === CustomerStatus.BLACKLISTED) {
      throw new BadRequestException('Cannot suspend blacklisted customer');
    }

    const previousStatus = this.status;
    this.status = CustomerStatus.SUSPENDED;
    this.updatedAt = new Date();

    this.addDomainEvent(
      new CustomerStatusChangedEvent(
        this.id,
        this.tenantId,
        previousStatus,
        this.status,
        reason
      )
    );
  }

  /**
   * Activate customer account
   */
  activate(): void {
    if (this.status === CustomerStatus.BLACKLISTED) {
      throw new BadRequestException('Cannot activate blacklisted customer');
    }

    const previousStatus = this.status;
    this.status = CustomerStatus.ACTIVE;
    this.updatedAt = new Date();

    this.addDomainEvent(
      new CustomerStatusChangedEvent(
        this.id,
        this.tenantId,
        previousStatus,
        this.status
      )
    );
  }

  /**
   * Blacklist customer
   */
  blacklist(reason: string, blacklistedBy?: string): void {
    if (!reason) {
      throw new BadRequestException('Blacklist reason is required');
    }

    const previousStatus = this.status;
    this.status = CustomerStatus.BLACKLISTED;
    this.blacklistReason = reason;
    this.updatedAt = new Date();

    this.addDomainEvent(
      new CustomerStatusChangedEvent(
        this.id,
        this.tenantId,
        previousStatus,
        this.status,
        reason
      )
    );

    this.addDomainEvent(
      new CustomerBlacklistedEvent(
        this.id,
        this.tenantId,
        reason,
        blacklistedBy
      )
    );
  }

  /**
   * Get available credit
   */
  getAvailableCredit(): Money {
    return this.creditLimit.subtract(this.outstandingBalance);
  }

  /**
   * Check if customer has outstanding balance
   */
  hasOutstandingBalance(): boolean {
    return this.outstandingBalance.greaterThan(Money.zero());
  }

  /**
   * Validate business invariants
   */
  private validateInvariants(): void {
    if (!this.code?.trim()) {
      throw new BadRequestException('Customer code is required');
    }

    if (!this.name?.trim()) {
      throw new BadRequestException('Customer name is required');
    }

    if (!this.email?.trim()) {
      throw new BadRequestException('Customer email is required');
    }

    if (!this.phone?.trim()) {
      throw new BadRequestException('Customer phone is required');
    }

    if (this.creditLimit.isNegative()) {
      throw new BadRequestException('Credit limit cannot be negative');
    }

    if (this.outstandingBalance.isNegative()) {
      throw new BadRequestException('Outstanding balance cannot be negative');
    }

    if (this.loyaltyPoints < 0) {
      throw new BadRequestException('Loyalty points cannot be negative');
    }
  }

  /**
   * Add domain event to pending list
   */
  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  /**
   * Get and clear domain events
   */
  getDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }

  /**
   * Convert to persistence model
   */
  toPersistence(): any {
    return {
      id: this.id,
      tenant_id: this.tenantId,
      code: this.code,
      name: this.name,
      name_bn: this.nameBn,
      email: this.email,
      phone: this.phone,
      phone_secondary: this.phoneSecondary,
      tin: this.tin?.getValue(),
      nid: this.nid,
      customer_type: this.customerType,
      status: this.status,
      credit_limit: this.creditLimit.getAmount(),
      outstanding_balance: this.outstandingBalance.getAmount(),
      total_revenue: this.totalRevenue.getAmount(),
      total_purchases: this.totalPurchases,
      loyalty_points: this.loyaltyPoints,
      address: this.address?.toJSON(),
      blacklist_reason: this.blacklistReason,
      last_purchase_date: this.lastPurchaseDate,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getTenantId(): string {
    return this.tenantId;
  }

  getCode(): string {
    return this.code;
  }

  getName(): string {
    return this.name;
  }

  getStatus(): CustomerStatus {
    return this.status;
  }

  getCreditLimit(): Money {
    return this.creditLimit;
  }

  getOutstandingBalance(): Money {
    return this.outstandingBalance;
  }

  getLoyaltyPoints(): number {
    return this.loyaltyPoints;
  }
}
