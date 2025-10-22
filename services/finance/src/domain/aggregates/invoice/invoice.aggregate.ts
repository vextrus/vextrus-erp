import { AggregateRoot } from '../../base/aggregate-root.base';
import { DomainEvent } from '../../base/domain-event.base';
import { Money } from '../../value-objects/money.value-object';
import { TIN } from '../../value-objects/tin.value-object';
import { BIN } from '../../value-objects/bin.value-object';
import { InvoiceNumber } from '../../value-objects/invoice-number.value-object';
import { TenantId } from '../chart-of-account/chart-of-account.aggregate';
import {
  InvoiceLineItemsUpdatedEvent,
  InvoiceDatesUpdatedEvent,
  InvoiceCustomerUpdatedEvent,
  InvoiceVendorUpdatedEvent,
  InvoiceTaxInfoUpdatedEvent,
} from './events/invoice-updated.events';
import { InvoicePaymentRecordedEvent, InvoiceFullyPaidEvent } from './events/invoice-payment-recorded.event';
import { PaymentId } from '../payment/payment.aggregate';

// Value Objects
export class InvoiceId {
  constructor(public readonly value: string) {}

  static generate(): InvoiceId {
    return new InvoiceId(`INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }
}

export class VendorId {
  constructor(public readonly value: string) {}
}

export class CustomerId {
  constructor(public readonly value: string) {}
}

export class LineItemId {
  constructor(public readonly value: string) {}

  static generate(): LineItemId {
    return new LineItemId(`LI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }
}

export class UserId {
  constructor(public readonly value: string) {}
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
}

export enum VATCategory {
  STANDARD = 'standard',      // 15%
  REDUCED = 'reduced',        // 7.5%
  ZERO_RATED = 'zero',       // 0%
  EXEMPT = 'exempt',          // Exempt
  TRUNCATED = 'truncated',    // 5%
}

export interface LineItem {
  id: LineItemId;
  description: string;
  quantity: number;
  unitPrice: Money;
  amount: Money;
  vatCategory: VATCategory;
  vatRate: number;
  vatAmount: Money;
  hsCode?: string;  // Bangladesh HS Code
  supplementaryDuty?: Money;
  advanceIncomeTax?: Money;
}

// Events
export class InvoiceCreatedEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: InvoiceId,
    public readonly invoiceNumber: string,
    public readonly vendorId: VendorId,
    public readonly customerId: CustomerId,
    public readonly invoiceDate: Date,
    public readonly dueDate: Date,
    public readonly tenantId: string,
    public readonly fiscalYear: string,
  ) {
    super(
      invoiceId.value,
      'InvoiceCreated',
      {
        invoiceId: invoiceId.value,
        invoiceNumber,
        vendorId: vendorId.value,
        customerId: customerId.value,
        invoiceDate,
        dueDate,
        fiscalYear,
      },
      tenantId
    );
  }
}

export class LineItemAddedEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: InvoiceId,
    public readonly lineItem: LineItem,
    public readonly tenantId: string,
  ) {
    super(
      invoiceId.value,
      'LineItemAdded',
      { lineItem },
      tenantId
    );
  }
}

export class InvoiceApprovedEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: InvoiceId,
    public readonly approvedBy: UserId,
    public readonly approvedAt: Date,
    public readonly mushakNumber: string,
    public readonly tenantId: string,
  ) {
    super(
      invoiceId.value,
      'InvoiceApproved',
      {
        approvedBy: approvedBy.value,
        approvedAt,
        mushakNumber,
      },
      tenantId,
      approvedBy.value
    );
  }
}

export class InvoiceCalculatedEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: InvoiceId,
    public readonly subtotal: Money,
    public readonly vatAmount: Money,
    public readonly supplementaryDuty: Money,
    public readonly advanceIncomeTax: Money,
    public readonly grandTotal: Money,
    public readonly tenantId: string,
  ) {
    super(
      invoiceId.value,
      'InvoiceCalculated',
      {
        subtotal: subtotal.amount,
        vatAmount: vatAmount.amount,
        supplementaryDuty: supplementaryDuty.amount,
        advanceIncomeTax: advanceIncomeTax.amount,
        grandTotal: grandTotal.amount,
      },
      tenantId
    );
  }
}

export class InvoiceCancelledEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: InvoiceId,
    public readonly cancelledBy: UserId,
    public readonly cancelledAt: Date,
    public readonly reason: string,
    public readonly tenantId: string,
  ) {
    super(
      invoiceId.value,
      'InvoiceCancelled',
      {
        cancelledBy: cancelledBy.value,
        cancelledAt,
        reason,
      },
      tenantId,
      cancelledBy.value
    );
  }
}

// Commands
export interface CreateInvoiceCommand {
  vendorId: VendorId;
  customerId: CustomerId;
  invoiceDate: Date;
  dueDate: Date;
  tenantId: TenantId;
  lineItems?: LineItemDto[];
  vendorTIN?: string;
  vendorBIN?: string;
  customerTIN?: string;
  customerBIN?: string;
}

export interface LineItemDto {
  description: string;
  quantity: number;
  unitPrice: Money;
  amount?: Money;
  vatCategory?: VATCategory;
  hsCode?: string;
  supplementaryDutyRate?: number;
  advanceIncomeTaxRate?: number;
}

// Exceptions
export class InvalidInvoiceStatusException extends Error {
  constructor(current: InvoiceStatus, expected: InvoiceStatus) {
    super(`Invalid invoice status. Current: ${current}, Expected: ${expected}`);
  }
}

export class InvalidVATRateException extends Error {
  constructor(rate: number) {
    super(`Invalid VAT rate: ${rate}. Must be one of Bangladesh standard rates.`);
  }
}

export class InvalidFiscalYearException extends Error {
  constructor(date: Date) {
    super(`Date ${date.toISOString()} is outside valid fiscal year`);
  }
}

export class InvoiceOverpaymentException extends Error {
  constructor(grandTotal: Money, attemptedPayment: Money) {
    super(
      `Cannot overpay invoice. Grand total: ${grandTotal.getAmount()}, ` +
      `Attempted total payment: ${attemptedPayment.getAmount()}`,
    );
  }
}

// Invoice props interface
export interface InvoiceProps {
  invoiceId: InvoiceId;
  invoiceNumber: InvoiceNumber;
  vendorId: VendorId;
  customerId: CustomerId;
  lineItems: LineItem[];
  subtotal: Money;
  vatAmount: Money;
  supplementaryDuty: Money;
  advanceIncomeTax: Money;
  grandTotal: Money;
  status: InvoiceStatus;
  mushakNumber?: string;
  challanNumber?: string;
  invoiceDate: Date;
  dueDate: Date;
  tenantId: TenantId;
  fiscalYear: string;
  vendorTIN?: TIN;
  vendorBIN?: BIN;
  customerTIN?: TIN;
  customerBIN?: BIN;
}

// Aggregate
export class Invoice extends AggregateRoot<InvoiceProps> {
  private invoiceId!: InvoiceId;
  private invoiceNumber!: InvoiceNumber;
  private vendorId!: VendorId;
  private customerId!: CustomerId;
  private lineItems: LineItem[] = [];
  private subtotal!: Money;
  private vatAmount!: Money;
  private supplementaryDuty!: Money;
  private advanceIncomeTax!: Money;
  private grandTotal!: Money;
  private status!: InvoiceStatus;
  private mushakNumber?: string;
  private challanNumber?: string;
  private invoiceDate!: Date;
  private dueDate!: Date;
  private tenantId!: TenantId;
  private fiscalYear!: string;
  private vendorTIN?: TIN;
  private vendorBIN?: BIN;
  private customerTIN?: TIN;
  private customerBIN?: BIN;
  private paidAmount: Money = Money.zero('BDT'); // Track total payments received

  // Static sequence counter (in production, this would be from database)
  private static mushakSequence = 0;

  constructor(props?: InvoiceProps, id?: string) {
    // Create default props if not provided
    const defaultProps: InvoiceProps = {
      invoiceId: InvoiceId.generate(),
      invoiceNumber: InvoiceNumber.generate(new Date(), 0),
      vendorId: new VendorId(''),
      customerId: new CustomerId(''),
      lineItems: [],
      subtotal: Money.zero('BDT'),
      vatAmount: Money.zero('BDT'),
      supplementaryDuty: Money.zero('BDT'),
      advanceIncomeTax: Money.zero('BDT'),
      grandTotal: Money.zero('BDT'),
      status: InvoiceStatus.DRAFT,
      invoiceDate: new Date(),
      dueDate: new Date(),
      tenantId: new TenantId(''),
      fiscalYear: ''
    };
    super(props || defaultProps, id || defaultProps.invoiceId.value);
  }

  static create(command: CreateInvoiceCommand): Invoice {
    const invoice = new Invoice();

    // Calculate fiscal year (July to June in Bangladesh)
    const fiscalYear = this.calculateFiscalYear(command.invoiceDate);

    // Generate Mushak-compliant invoice number using value object
    const invoiceNumber = this.generateMushakInvoiceNumber(
      command.invoiceDate,
      command.tenantId
    );

    invoice.apply(new InvoiceCreatedEvent(
      InvoiceId.generate(),
      invoiceNumber.value, // Use value property for event
      command.vendorId,
      command.customerId,
      command.invoiceDate,
      command.dueDate,
      command.tenantId.value,
      fiscalYear,
    ));

    // Store TIN/BIN for compliance (convert strings to value objects if provided)
    invoice.vendorTIN = command.vendorTIN ? TIN.create(command.vendorTIN) : undefined;
    invoice.vendorBIN = command.vendorBIN ? BIN.create(command.vendorBIN) : undefined;
    invoice.customerTIN = command.customerTIN ? TIN.create(command.customerTIN) : undefined;
    invoice.customerBIN = command.customerBIN ? BIN.create(command.customerBIN) : undefined;

    // Add line items if provided
    if (command.lineItems && command.lineItems.length > 0) {
      command.lineItems.forEach(item => {
        invoice.addLineItem(item, command.tenantId.value);
      });
    }

    return invoice;
  }

  private static calculateFiscalYear(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // Bangladesh fiscal year: July 1 to June 30
    if (month >= 7) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }

  private static generateMushakInvoiceNumber(
    date: Date,
    tenantId: TenantId
  ): InvoiceNumber {
    // Use the InvoiceNumber value object's generate method
    // In production, sequence would come from database query
    const sequence = ++this.mushakSequence;
    return InvoiceNumber.generate(date, sequence);
  }

  addLineItem(item: LineItemDto, tenantId?: string): void {
    // Calculate VAT based on category
    const vatCategory = item.vatCategory || VATCategory.STANDARD;
    const vatRate = this.getVATRate(vatCategory);

    // Validate VAT rate
    if (!this.isValidVATRate(vatRate)) {
      throw new InvalidVATRateException(vatRate);
    }

    // Calculate amounts
    const amount = item.amount || item.unitPrice.multiply(item.quantity);
    const vatAmount = amount.multiply(vatRate);

    // Calculate supplementary duty if applicable
    const supplementaryDuty = item.supplementaryDutyRate
      ? amount.multiply(item.supplementaryDutyRate)
      : Money.zero(amount.getCurrency());

    // Calculate advance income tax if applicable
    const advanceIncomeTax = item.advanceIncomeTaxRate
      ? amount.multiply(item.advanceIncomeTaxRate)
      : Money.zero(amount.getCurrency());

    const lineItem: LineItem = {
      id: LineItemId.generate(),
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount,
      vatCategory,
      vatRate,
      vatAmount,
      hsCode: item.hsCode,
      supplementaryDuty,
      advanceIncomeTax,
    };

    this.apply(new LineItemAddedEvent(this.invoiceId, lineItem, tenantId || this.tenantId.value));
    this.recalculateTotals();
  }

  private getVATRate(category: VATCategory): number {
    // Bangladesh VAT rates as per NBR
    const vatRates: Record<VATCategory, number> = {
      [VATCategory.STANDARD]: 0.15,     // 15% standard rate
      [VATCategory.REDUCED]: 0.075,     // 7.5% reduced rate
      [VATCategory.TRUNCATED]: 0.05,    // 5% truncated rate
      [VATCategory.ZERO_RATED]: 0,      // 0% zero-rated
      [VATCategory.EXEMPT]: 0,          // Exempt items
    };

    return vatRates[category];
  }

  private isValidVATRate(rate: number): boolean {
    const validRates = [0, 0.05, 0.075, 0.15];
    return validRates.includes(rate);
  }

  private recalculateTotals(): void {
    // Calculate subtotal
    const subtotal = this.lineItems.reduce(
      (sum, item) => sum.add(item.amount),
      Money.zero('BDT')
    );

    // Calculate total VAT
    const vatAmount = this.lineItems.reduce(
      (sum, item) => sum.add(item.vatAmount),
      Money.zero('BDT')
    );

    // Calculate total supplementary duty
    const supplementaryDuty = this.lineItems.reduce(
      (sum, item) => sum.add(item.supplementaryDuty || Money.zero('BDT')),
      Money.zero('BDT')
    );

    // Calculate total advance income tax
    const advanceIncomeTax = this.lineItems.reduce(
      (sum, item) => sum.add(item.advanceIncomeTax || Money.zero('BDT')),
      Money.zero('BDT')
    );

    // Grand total = Subtotal + VAT + Supplementary Duty - Advance Income Tax
    const grandTotal = subtotal
      .add(vatAmount)
      .add(supplementaryDuty)
      .subtract(advanceIncomeTax);

    this.apply(new InvoiceCalculatedEvent(
      this.invoiceId,
      subtotal,
      vatAmount,
      supplementaryDuty,
      advanceIncomeTax,
      grandTotal,
      this.tenantId.value,
    ));
  }

  approve(approvedBy: UserId): void {
    if (this.status !== InvoiceStatus.DRAFT) {
      throw new InvalidInvoiceStatusException(this.status, InvoiceStatus.DRAFT);
    }

    const mushakNumber = this.generateMushakNumber();

    this.apply(new InvoiceApprovedEvent(
      this.invoiceId,
      approvedBy,
      new Date(),
      mushakNumber,
      this.tenantId.value,
    ));
  }

  private generateMushakNumber(): string {
    // Format: MUSHAK-6.3-YYYY-MM-NNNNNN
    // Mushak-6.3 is the standard VAT invoice format in Bangladesh
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const sequence = String(++Invoice.mushakSequence).padStart(6, '0');

    return `MUSHAK-6.3-${year}-${month}-${sequence}`;
  }

  cancel(cancelledBy: UserId, reason: string): void {
    if (this.status === InvoiceStatus.CANCELLED) {
      throw new Error('Invoice is already cancelled');
    }

    if (this.status === InvoiceStatus.PAID) {
      throw new Error('Cannot cancel a paid invoice');
    }

    this.apply(new InvoiceCancelledEvent(
      this.invoiceId,
      cancelledBy,
      new Date(),
      reason,
      this.tenantId.value,
    ));
  }

  /**
   * Update line items (DRAFT only)
   * Replaces all line items and recalculates totals
   */
  updateLineItems(lineItems: LineItemDto[], updatedBy: UserId): void {
    if (this.status !== InvoiceStatus.DRAFT) {
      throw new InvalidInvoiceStatusException(this.status, InvoiceStatus.DRAFT);
    }

    this.apply(new InvoiceLineItemsUpdatedEvent(
      this.invoiceId,
      lineItems,
      updatedBy,
      this.tenantId.value
    ));
  }

  /**
   * Update invoice and due dates (DRAFT only)
   * May trigger fiscal year recalculation
   */
  updateDates(invoiceDate?: Date, dueDate?: Date, updatedBy?: UserId): void {
    if (this.status !== InvoiceStatus.DRAFT) {
      throw new InvalidInvoiceStatusException(this.status, InvoiceStatus.DRAFT);
    }

    this.apply(new InvoiceDatesUpdatedEvent(
      this.invoiceId,
      invoiceDate || this.invoiceDate,
      dueDate || this.dueDate,
      updatedBy || new UserId('system'),
      this.tenantId.value
    ));
  }

  /**
   * Update customer (DRAFT only)
   */
  updateCustomer(customerId: CustomerId, updatedBy: UserId): void {
    if (this.status !== InvoiceStatus.DRAFT) {
      throw new InvalidInvoiceStatusException(this.status, InvoiceStatus.DRAFT);
    }

    this.apply(new InvoiceCustomerUpdatedEvent(
      this.invoiceId,
      customerId,
      updatedBy,
      this.tenantId.value
    ));
  }

  /**
   * Update vendor (DRAFT only)
   */
  updateVendor(vendorId: VendorId, updatedBy: UserId): void {
    if (this.status !== InvoiceStatus.DRAFT) {
      throw new InvalidInvoiceStatusException(this.status, InvoiceStatus.DRAFT);
    }

    this.apply(new InvoiceVendorUpdatedEvent(
      this.invoiceId,
      vendorId,
      updatedBy,
      this.tenantId.value
    ));
  }

  /**
   * Update tax information (TIN/BIN)
   * Bangladesh NBR compliance requirement
   */
  updateTaxInfo(
    vendorTIN?: string,
    vendorBIN?: string,
    customerTIN?: string,
    customerBIN?: string,
    updatedBy?: UserId
  ): void {
    if (this.status !== InvoiceStatus.DRAFT) {
      throw new InvalidInvoiceStatusException(this.status, InvoiceStatus.DRAFT);
    }

    this.apply(new InvoiceTaxInfoUpdatedEvent(
      this.invoiceId,
      vendorTIN,
      vendorBIN,
      customerTIN,
      customerBIN,
      updatedBy,
      this.tenantId.value
    ));
  }

  /**
   * Record Payment Against Invoice
   *
   * Records a payment that has been applied to this invoice.
   * Updates the paid amount and automatically transitions to PAID
   * status if the invoice is fully paid.
   *
   * Business Rules:
   * - Can only record payment on APPROVED invoices
   * - Cannot record payment on DRAFT or CANCELLED invoices
   * - Cannot overpay (total paid cannot exceed grand total)
   * - Auto-transitions to PAID when remaining amount === 0
   *
   * @param paymentId - Payment that was applied
   * @param paymentAmount - Amount of this specific payment
   * @throws Error if invoice status invalid
   * @throws InvoiceOverpaymentException if payment would exceed grand total
   */
  recordPayment(paymentId: PaymentId, paymentAmount: Money): void {
    // Validation: Can only record payment on APPROVED invoices
    // CRITICAL FIX #3: Use InvalidInvoiceStatusException for consistency
    if (this.status === InvoiceStatus.DRAFT) {
      throw new InvalidInvoiceStatusException(
        this.status,
        InvoiceStatus.APPROVED,
      );
    }

    if (this.status === InvoiceStatus.CANCELLED) {
      throw new Error('Cannot record payment for CANCELLED invoice');
    }

    // Calculate new paid amount
    const previousPaidAmount = this.paidAmount || Money.zero('BDT');
    const newPaidAmount = previousPaidAmount.add(paymentAmount);

    // Validate: Cannot overpay
    if (newPaidAmount.getAmount() > this.grandTotal.getAmount()) {
      throw new InvoiceOverpaymentException(this.grandTotal, newPaidAmount);
    }

    // Calculate remaining amount
    const remainingAmount = this.grandTotal.subtract(newPaidAmount);

    // Emit payment recorded event
    this.apply(new InvoicePaymentRecordedEvent(
      this.invoiceId,
      paymentId,
      paymentAmount,
      previousPaidAmount,
      newPaidAmount,
      remainingAmount,
      this.tenantId.value,
    ));

    // If fully paid, emit fully paid event
    if (remainingAmount.isZero()) {
      this.apply(new InvoiceFullyPaidEvent(
        this.invoiceId,
        paymentId,
        newPaidAmount,
        new Date(),
        this.tenantId.value,
      ));
    }
  }

  // Event handlers
  protected when(event: DomainEvent): void {
    switch (event.constructor) {
      case InvoiceCreatedEvent:
        this.onInvoiceCreatedEvent(event as InvoiceCreatedEvent);
        break;
      case LineItemAddedEvent:
        this.onLineItemAddedEvent(event as LineItemAddedEvent);
        break;
      case InvoiceCalculatedEvent:
        this.onInvoiceCalculatedEvent(event as InvoiceCalculatedEvent);
        break;
      case InvoiceApprovedEvent:
        this.onInvoiceApprovedEvent(event as InvoiceApprovedEvent);
        break;
      case InvoiceCancelledEvent:
        this.onInvoiceCancelledEvent(event as InvoiceCancelledEvent);
        break;
      case InvoiceLineItemsUpdatedEvent:
        this.onInvoiceLineItemsUpdated(event as InvoiceLineItemsUpdatedEvent);
        break;
      case InvoiceDatesUpdatedEvent:
        this.onInvoiceDatesUpdated(event as InvoiceDatesUpdatedEvent);
        break;
      case InvoiceCustomerUpdatedEvent:
        this.onInvoiceCustomerUpdated(event as InvoiceCustomerUpdatedEvent);
        break;
      case InvoiceVendorUpdatedEvent:
        this.onInvoiceVendorUpdated(event as InvoiceVendorUpdatedEvent);
        break;
      case InvoiceTaxInfoUpdatedEvent:
        this.onInvoiceTaxInfoUpdated(event as InvoiceTaxInfoUpdatedEvent);
        break;
      case InvoicePaymentRecordedEvent:
        this.onInvoicePaymentRecorded(event as InvoicePaymentRecordedEvent);
        break;
      case InvoiceFullyPaidEvent:
        this.onInvoiceFullyPaid(event as InvoiceFullyPaidEvent);
        break;
    }
  }

  private onInvoiceCreatedEvent(event: InvoiceCreatedEvent): void {
    this.invoiceId = event.invoiceId;
    this.invoiceNumber = InvoiceNumber.create(event.invoiceNumber);
    this.vendorId = event.vendorId;
    this.customerId = event.customerId;
    this.invoiceDate = event.invoiceDate;
    this.dueDate = event.dueDate;
    this.tenantId = new TenantId(event.tenantId);
    this.fiscalYear = event.fiscalYear;
    this.status = InvoiceStatus.DRAFT;
    this.lineItems = [];
    this.subtotal = Money.zero('BDT');
    this.vatAmount = Money.zero('BDT');
    this.supplementaryDuty = Money.zero('BDT');
    this.advanceIncomeTax = Money.zero('BDT');
    this.grandTotal = Money.zero('BDT');
  }

  private onLineItemAddedEvent(event: LineItemAddedEvent): void {
    this.lineItems.push(event.lineItem);
  }

  private onInvoiceCalculatedEvent(event: InvoiceCalculatedEvent): void {
    this.subtotal = event.subtotal;
    this.vatAmount = event.vatAmount;
    this.supplementaryDuty = event.supplementaryDuty;
    this.advanceIncomeTax = event.advanceIncomeTax;
    this.grandTotal = event.grandTotal;
  }

  private onInvoiceApprovedEvent(event: InvoiceApprovedEvent): void {
    this.status = InvoiceStatus.APPROVED;
    this.mushakNumber = event.mushakNumber;
  }

  private onInvoiceCancelledEvent(event: InvoiceCancelledEvent): void {
    this.status = InvoiceStatus.CANCELLED;
  }

  private onInvoiceLineItemsUpdated(event: InvoiceLineItemsUpdatedEvent): void {
    // Clear existing line items and recreate from DTOs
    this.lineItems = [];

    event.lineItems.forEach(itemDto => {
      // Calculate VAT based on category
      const vatCategory = itemDto.vatCategory || VATCategory.STANDARD;
      const vatRate = this.getVATRate(vatCategory);

      // Calculate amounts
      const amount = itemDto.amount || itemDto.unitPrice.multiply(itemDto.quantity);
      const vatAmount = amount.multiply(vatRate);

      // Calculate supplementary duty if applicable
      const supplementaryDuty = itemDto.supplementaryDutyRate
        ? amount.multiply(itemDto.supplementaryDutyRate)
        : Money.zero(amount.getCurrency());

      // Calculate advance income tax if applicable
      const advanceIncomeTax = itemDto.advanceIncomeTaxRate
        ? amount.multiply(itemDto.advanceIncomeTaxRate)
        : Money.zero(amount.getCurrency());

      const lineItem: LineItem = {
        id: LineItemId.generate(),
        description: itemDto.description,
        quantity: itemDto.quantity,
        unitPrice: itemDto.unitPrice,
        amount,
        vatCategory,
        vatRate,
        vatAmount,
        hsCode: itemDto.hsCode,
        supplementaryDuty,
        advanceIncomeTax,
      };

      this.lineItems.push(lineItem);
    });

    // Recalculate totals
    this.recalculateTotals();
  }

  private onInvoiceDatesUpdated(event: InvoiceDatesUpdatedEvent): void {
    this.invoiceDate = event.invoiceDate;
    this.dueDate = event.dueDate;

    // Recalculate fiscal year if invoice date changed
    const newFiscalYear = Invoice.calculateFiscalYear(event.invoiceDate);
    if (newFiscalYear !== this.fiscalYear) {
      this.fiscalYear = newFiscalYear;
    }
  }

  private onInvoiceCustomerUpdated(event: InvoiceCustomerUpdatedEvent): void {
    this.customerId = event.customerId;
  }

  private onInvoiceVendorUpdated(event: InvoiceVendorUpdatedEvent): void {
    this.vendorId = event.vendorId;
  }

  private onInvoiceTaxInfoUpdated(event: InvoiceTaxInfoUpdatedEvent): void {
    if (event.vendorTIN !== undefined) {
      this.vendorTIN = event.vendorTIN ? TIN.create(event.vendorTIN) : undefined;
    }
    if (event.vendorBIN !== undefined) {
      this.vendorBIN = event.vendorBIN ? BIN.create(event.vendorBIN) : undefined;
    }
    if (event.customerTIN !== undefined) {
      this.customerTIN = event.customerTIN ? TIN.create(event.customerTIN) : undefined;
    }
    if (event.customerBIN !== undefined) {
      this.customerBIN = event.customerBIN ? BIN.create(event.customerBIN) : undefined;
    }
  }

  /**
   * Handle InvoicePaymentRecordedEvent
   * Updates the paid amount on the invoice
   */
  private onInvoicePaymentRecorded(event: InvoicePaymentRecordedEvent): void {
    this.paidAmount = event.newPaidAmount;
  }

  /**
   * Handle InvoiceFullyPaidEvent
   * Transitions invoice status to PAID
   */
  private onInvoiceFullyPaid(event: InvoiceFullyPaidEvent): void {
    this.status = InvoiceStatus.PAID;
  }

  // Getters
  getId(): InvoiceId {
    return this.invoiceId;
  }

  getInvoiceNumber(): string {
    return this.invoiceNumber.value;
  }

  getInvoiceNumberObject(): InvoiceNumber {
    return this.invoiceNumber;
  }

  getMushakNumber(): string | undefined {
    return this.mushakNumber;
  }

  getStatus(): InvoiceStatus {
    return this.status;
  }

  getLineItems(): LineItem[] {
    return [...this.lineItems];
  }

  getSubtotal(): Money {
    return this.subtotal;
  }

  getVatAmount(): Money {
    return this.vatAmount;
  }

  getGrandTotal(): Money {
    return this.grandTotal;
  }

  getFiscalYear(): string {
    return this.fiscalYear;
  }

  getVendorTIN(): TIN | undefined {
    return this.vendorTIN;
  }

  getVendorBIN(): BIN | undefined {
    return this.vendorBIN;
  }

  getCustomerTIN(): TIN | undefined {
    return this.customerTIN;
  }

  getCustomerBIN(): BIN | undefined {
    return this.customerBIN;
  }

  getTenantId(): TenantId {
    return this.tenantId;
  }

  /**
   * Serialize aggregate state to a snapshot for event sourcing optimization.
   * Converts all value objects and nested objects to plain JSON-serializable format.
   *
   * @returns Snapshot object containing all aggregate state
   */
  toSnapshot(): any {
    return {
      invoiceId: this.invoiceId.value,
      invoiceNumber: this.invoiceNumber.value,
      vendorId: this.vendorId.value,
      customerId: this.customerId.value,
      lineItems: this.lineItems.map(item => ({
        id: item.id.value,
        description: item.description,
        quantity: item.quantity,
        unitPrice: {
          amount: item.unitPrice.getAmount(),
          currency: item.unitPrice.getCurrency(),
        },
        amount: {
          amount: item.amount.getAmount(),
          currency: item.amount.getCurrency(),
        },
        vatCategory: item.vatCategory,
        vatRate: item.vatRate,
        vatAmount: {
          amount: item.vatAmount.getAmount(),
          currency: item.vatAmount.getCurrency(),
        },
        hsCode: item.hsCode,
        supplementaryDuty: item.supplementaryDuty ? {
          amount: item.supplementaryDuty.getAmount(),
          currency: item.supplementaryDuty.getCurrency(),
        } : undefined,
        advanceIncomeTax: item.advanceIncomeTax ? {
          amount: item.advanceIncomeTax.getAmount(),
          currency: item.advanceIncomeTax.getCurrency(),
        } : undefined,
      })),
      subtotal: {
        amount: this.subtotal.getAmount(),
        currency: this.subtotal.getCurrency(),
      },
      vatAmount: {
        amount: this.vatAmount.getAmount(),
        currency: this.vatAmount.getCurrency(),
      },
      supplementaryDuty: {
        amount: this.supplementaryDuty.getAmount(),
        currency: this.supplementaryDuty.getCurrency(),
      },
      advanceIncomeTax: {
        amount: this.advanceIncomeTax.getAmount(),
        currency: this.advanceIncomeTax.getCurrency(),
      },
      grandTotal: {
        amount: this.grandTotal.getAmount(),
        currency: this.grandTotal.getCurrency(),
      },
      status: this.status,
      mushakNumber: this.mushakNumber,
      challanNumber: this.challanNumber,
      invoiceDate: this.invoiceDate.toISOString(),
      dueDate: this.dueDate.toISOString(),
      tenantId: this.tenantId.value,
      fiscalYear: this.fiscalYear,
      vendorTIN: this.vendorTIN?.value,
      vendorBIN: this.vendorBIN?.value,
      customerTIN: this.customerTIN?.value,
      customerBIN: this.customerBIN?.value,
    };
  }

  /**
   * Deserialize a snapshot back to an Invoice aggregate.
   * Reconstructs all value objects and nested objects from plain JSON.
   *
   * @param state - Snapshot state object
   * @returns Reconstructed Invoice aggregate
   */
  static fromSnapshot(state: any): Invoice {
    const props: InvoiceProps = {
      invoiceId: new InvoiceId(state.invoiceId),
      invoiceNumber: InvoiceNumber.create(state.invoiceNumber),
      vendorId: new VendorId(state.vendorId),
      customerId: new CustomerId(state.customerId),
      lineItems: state.lineItems.map((item: any) => ({
        id: new LineItemId(item.id),
        description: item.description,
        quantity: item.quantity,
        unitPrice: Money.fromAmount(item.unitPrice.amount, item.unitPrice.currency),
        amount: Money.fromAmount(item.amount.amount, item.amount.currency),
        vatCategory: item.vatCategory,
        vatRate: item.vatRate,
        vatAmount: Money.fromAmount(item.vatAmount.amount, item.vatAmount.currency),
        hsCode: item.hsCode,
        supplementaryDuty: item.supplementaryDuty
          ? Money.fromAmount(item.supplementaryDuty.amount, item.supplementaryDuty.currency)
          : undefined,
        advanceIncomeTax: item.advanceIncomeTax
          ? Money.fromAmount(item.advanceIncomeTax.amount, item.advanceIncomeTax.currency)
          : undefined,
      })),
      subtotal: Money.fromAmount(state.subtotal.amount, state.subtotal.currency),
      vatAmount: Money.fromAmount(state.vatAmount.amount, state.vatAmount.currency),
      supplementaryDuty: Money.fromAmount(state.supplementaryDuty.amount, state.supplementaryDuty.currency),
      advanceIncomeTax: Money.fromAmount(state.advanceIncomeTax.amount, state.advanceIncomeTax.currency),
      grandTotal: Money.fromAmount(state.grandTotal.amount, state.grandTotal.currency),
      status: state.status,
      mushakNumber: state.mushakNumber,
      challanNumber: state.challanNumber,
      invoiceDate: new Date(state.invoiceDate),
      dueDate: new Date(state.dueDate),
      tenantId: new TenantId(state.tenantId),
      fiscalYear: state.fiscalYear,
      vendorTIN: state.vendorTIN ? TIN.create(state.vendorTIN) : undefined,
      vendorBIN: state.vendorBIN ? BIN.create(state.vendorBIN) : undefined,
      customerTIN: state.customerTIN ? TIN.create(state.customerTIN) : undefined,
      customerBIN: state.customerBIN ? BIN.create(state.customerBIN) : undefined,
    };

    const invoice = new Invoice(props, state.invoiceId);

    // Restore internal state
    invoice.invoiceId = props.invoiceId;
    invoice.invoiceNumber = props.invoiceNumber;
    invoice.vendorId = props.vendorId;
    invoice.customerId = props.customerId;
    invoice.lineItems = props.lineItems;
    invoice.subtotal = props.subtotal;
    invoice.vatAmount = props.vatAmount;
    invoice.supplementaryDuty = props.supplementaryDuty;
    invoice.advanceIncomeTax = props.advanceIncomeTax;
    invoice.grandTotal = props.grandTotal;
    invoice.status = props.status;
    invoice.mushakNumber = props.mushakNumber;
    invoice.challanNumber = props.challanNumber;
    invoice.invoiceDate = props.invoiceDate;
    invoice.dueDate = props.dueDate;
    invoice.tenantId = props.tenantId;
    invoice.fiscalYear = props.fiscalYear;
    invoice.vendorTIN = props.vendorTIN;
    invoice.vendorBIN = props.vendorBIN;
    invoice.customerTIN = props.customerTIN;
    invoice.customerBIN = props.customerBIN;

    return invoice;
  }
}