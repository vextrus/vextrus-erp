import { AggregateRoot } from '../../base/aggregate-root.base';
import { DomainEvent } from '../../base/domain-event.base';
import { Money } from '../../value-objects/money.value-object';
import { TIN } from '../../value-objects/tin.value-object';
import { BIN } from '../../value-objects/bin.value-object';
import { InvoiceNumber } from '../../value-objects/invoice-number.value-object';
import { TenantId } from '../chart-of-account/chart-of-account.aggregate';

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
}