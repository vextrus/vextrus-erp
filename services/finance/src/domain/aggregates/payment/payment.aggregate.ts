import { AggregateRoot } from '../../base/aggregate-root.base';
import { DomainEvent } from '../../base/domain-event.base';
import { Money } from '../../value-objects/money.value-object';
import { InvoiceId, UserId } from '../invoice/invoice.aggregate';
import { TenantId } from '../chart-of-account/chart-of-account.aggregate';

// Value Objects
export class PaymentId {
  constructor(public readonly value: string) {}

  static generate(): PaymentId {
    return new PaymentId(`PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }
}

export class BankAccountId {
  constructor(public readonly value: string) {}
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  MOBILE_WALLET = 'MOBILE_WALLET',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  ONLINE_BANKING = 'ONLINE_BANKING',
}

export enum MobileWalletProvider {
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  ROCKET = 'ROCKET',
  UPAY = 'UPAY',
  SURECASH = 'SURECASH',
  MCASH = 'MCASH',
  TCASH = 'TCASH',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  RECONCILED = 'RECONCILED',
  REVERSED = 'REVERSED',
}

export interface MobileWallet {
  provider: MobileWalletProvider;
  mobileNumber: string;
  transactionId: string;
  accountNumber?: string;
  merchantCode?: string;
  pin?: string; // Encrypted
}

export interface BankStatement {
  bankAccountId: string;
  transactions: BankTransaction[];
  startDate: Date;
  endDate: Date;
  openingBalance: Money;
  closingBalance: Money;
}

export interface BankTransaction {
  transactionId: string;
  date: Date;
  description: string;
  reference: string;
  amount: Money;
  type: 'DEBIT' | 'CREDIT';
  balance: Money;
}

// Events
export class PaymentCreatedEvent extends DomainEvent {
  constructor(
    public readonly paymentId: PaymentId,
    public readonly paymentNumber: string,
    public readonly invoiceId: InvoiceId,
    public readonly amount: Money,
    public readonly paymentMethod: PaymentMethod,
    public readonly paymentDate: Date,
    public readonly reference: string,
    public readonly tenantId: string,
  ) {
    super(
      paymentId.value,
      'PaymentCreated',
      { paymentNumber, invoiceId: invoiceId.value, amount, paymentMethod, paymentDate, reference },
      tenantId
    );
  }
}

export class MobileWalletPaymentInitiatedEvent extends DomainEvent {
  constructor(
    public readonly paymentId: PaymentId,
    public readonly provider: MobileWalletProvider,
    public readonly mobileNumber: string,
    public readonly transactionId: string,
    tenantId: string,
    public readonly merchantCode?: string,
  ) {
    super(
      paymentId.value,
      'MobileWalletPaymentInitiated',
      { provider, mobileNumber, transactionId, merchantCode },
      tenantId
    );
  }
}

export class PaymentCompletedEvent extends DomainEvent {
  constructor(
    public readonly paymentId: PaymentId,
    public readonly completedAt: Date,
    public readonly transactionReference: string,
    tenantId: string,
  ) {
    super(
      paymentId.value,
      'PaymentCompleted',
      { completedAt, transactionReference },
      tenantId
    );
  }
}

export class PaymentFailedEvent extends DomainEvent {
  constructor(
    public readonly paymentId: PaymentId,
    public readonly failedAt: Date,
    public readonly reason: string,
    tenantId: string,
  ) {
    super(
      paymentId.value,
      'PaymentFailed',
      { failedAt, reason },
      tenantId
    );
  }
}

export class PaymentReconciledEvent extends DomainEvent {
  constructor(
    public readonly paymentId: PaymentId,
    public readonly bankTransactionId: string,
    public readonly reconciledAt: Date,
    public readonly reconciledBy: UserId,
    tenantId: string,
  ) {
    super(
      paymentId.value,
      'PaymentReconciled',
      { bankTransactionId, reconciledAt, reconciledBy: reconciledBy.value },
      tenantId,
      reconciledBy.value
    );
  }
}

export class PaymentReversedEvent extends DomainEvent {
  constructor(
    public readonly paymentId: PaymentId,
    public readonly reversedAt: Date,
    public readonly reversedBy: UserId,
    public readonly reason: string,
    tenantId: string,
  ) {
    super(
      paymentId.value,
      'PaymentReversed',
      { reversedAt, reversedBy: reversedBy.value, reason },
      tenantId,
      reversedBy.value
    );
  }
}

// Commands
export interface CreatePaymentCommand {
  invoiceId: InvoiceId;
  amount: Money;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  reference?: string;
  tenantId: TenantId;
  // Bank payment fields
  bankAccountId?: BankAccountId;
  checkNumber?: string;
  // Mobile wallet fields
  walletProvider?: MobileWalletProvider;
  mobileNumber?: string;
  walletTransactionId?: string;
  merchantCode?: string;
}

export interface ProcessMobileWalletCommand {
  paymentId: PaymentId;
  provider: MobileWalletProvider;
  mobileNumber: string;
  amount: Money;
  merchantCode?: string;
}

// Exceptions
export class InvalidPaymentMethodException extends Error {
  constructor(method: PaymentMethod) {
    super(`Invalid payment method: ${method}`);
  }
}

export class PaymentAlreadyReconciledException extends Error {
  constructor(paymentId: PaymentId) {
    super(`Payment ${paymentId.value} is already reconciled`);
  }
}

export class NoMatchingTransactionException extends Error {
  constructor(paymentId: PaymentId) {
    super(`No matching transaction found for payment ${paymentId.value}`);
  }
}

export class InvalidMobileNumberException extends Error {
  constructor(number: string) {
    super(`Invalid Bangladesh mobile number: ${number}`);
  }
}

export class PaymentAlreadyCompletedException extends Error {
  constructor(paymentId: PaymentId) {
    super(`Payment ${paymentId.value} is already completed`);
  }
}

// Aggregate
export class Payment extends AggregateRoot<PaymentId> {
  private paymentId!: PaymentId;
  private paymentNumber!: string;
  private invoiceId!: InvoiceId;
  private amount!: Money;
  private paymentMethod!: PaymentMethod;
  private bankAccount?: BankAccountId;
  private mobileWallet?: MobileWallet;
  private status!: PaymentStatus;
  private paymentDate!: Date;
  private reference!: string;
  private reconciledAt?: Date;
  private transactionReference?: string;
  private tenantId!: TenantId;
  private checkNumber?: string;

  // Static sequence counter (in production, this would be from database)
  private static paymentSequence = 0;

  constructor(props?: any, id?: string) {
    // Create default props if not provided
    const defaultProps = {
      paymentId: PaymentId.generate(),
    };
    super(props || defaultProps, id || defaultProps.paymentId.value);
  }

  static create(command: CreatePaymentCommand): Payment {
    const payment = new Payment();

    // Validate payment method for Bangladesh
    if (!this.isValidPaymentMethod(command.paymentMethod)) {
      throw new InvalidPaymentMethodException(command.paymentMethod);
    }

    const paymentNumber = this.generatePaymentNumber(command.paymentDate);

    payment.apply(new PaymentCreatedEvent(
      PaymentId.generate(),
      paymentNumber,
      command.invoiceId,
      command.amount,
      command.paymentMethod,
      command.paymentDate,
      command.reference || '',
      command.tenantId.value,
    ));

    // Handle mobile wallet payments
    if (command.paymentMethod === PaymentMethod.MOBILE_WALLET) {
      payment.processMobileWalletPayment(command);
    }

    // Store additional fields
    payment.bankAccount = command.bankAccountId;
    payment.checkNumber = command.checkNumber;

    return payment;
  }

  private static isValidPaymentMethod(method: PaymentMethod): boolean {
    return Object.values(PaymentMethod).includes(method);
  }

  private static generatePaymentNumber(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const sequence = String(++this.paymentSequence).padStart(6, '0');

    // Format: PMT-YYYY-MM-DD-NNNNNN
    return `PMT-${year}-${month}-${day}-${sequence}`;
  }

  private static isMobileWallet(method: PaymentMethod): boolean {
    return method === PaymentMethod.MOBILE_WALLET;
  }

  private processMobileWalletPayment(command: CreatePaymentCommand): void {
    if (!command.walletProvider || !command.mobileNumber) {
      throw new Error('Mobile wallet provider and number are required');
    }

    // Validate Bangladesh mobile number format
    if (!this.isValidBangladeshMobileNumber(command.mobileNumber)) {
      throw new InvalidMobileNumberException(command.mobileNumber);
    }

    this.apply(new MobileWalletPaymentInitiatedEvent(
      this.paymentId,
      command.walletProvider,
      command.mobileNumber,
      command.walletTransactionId || this.generateWalletTransactionId(),
      this.tenantId.value,
      command.merchantCode,
    ));
  }

  private isValidBangladeshMobileNumber(number: string): boolean {
    // Bangladesh mobile number format: 01[3-9]XXXXXXXX
    const regex = /^01[3-9]\d{8}$/;
    // Also accept with country code +880
    const regexWithCountry = /^\+8801[3-9]\d{8}$/;

    return regex.test(number) || regexWithCountry.test(number);
  }

  private generateWalletTransactionId(): string {
    return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  reconcile(bankStatement: BankStatement, reconciledBy: UserId): void {
    if (this.status === PaymentStatus.RECONCILED) {
      throw new PaymentAlreadyReconciledException(this.paymentId);
    }

    if (this.status !== PaymentStatus.COMPLETED) {
      throw new Error(`Cannot reconcile payment in ${this.status} status`);
    }

    // Match payment with bank statement transaction
    const match = this.findMatchingTransaction(bankStatement);

    if (!match) {
      throw new NoMatchingTransactionException(this.paymentId);
    }

    this.apply(new PaymentReconciledEvent(
      this.paymentId,
      match.transactionId,
      new Date(),
      reconciledBy,
      this.tenantId.value,
    ));
  }

  private findMatchingTransaction(bankStatement: BankStatement): BankTransaction | null {
    // Match by amount and date range
    const matchingTransactions = bankStatement.transactions.filter(tx => {
      const amountMatches = tx.amount.equals(this.amount);
      const dateMatches = this.isDateWithinRange(tx.date, this.paymentDate);
      const referenceMatches = this.reference && tx.reference.includes(this.reference);

      return amountMatches && (dateMatches || referenceMatches);
    });

    // If multiple matches, try to match by reference
    if (matchingTransactions.length > 1 && this.reference) {
      const exactMatch = matchingTransactions.find(tx =>
        tx.reference === this.reference ||
        tx.description.includes(this.paymentNumber)
      );
      if (exactMatch) return exactMatch;
    }

    return matchingTransactions.length > 0 ? matchingTransactions[0] : null;
  }

  private isDateWithinRange(txDate: Date, paymentDate: Date): boolean {
    // Consider transaction within 3 days of payment date
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    return Math.abs(txDate.getTime() - paymentDate.getTime()) <= threeDaysInMs;
  }

  complete(transactionReference: string): void {
    if (this.status === PaymentStatus.COMPLETED) {
      throw new PaymentAlreadyCompletedException(this.paymentId);
    }

    if (this.status !== PaymentStatus.PROCESSING && this.status !== PaymentStatus.PENDING) {
      throw new Error(`Cannot complete payment in ${this.status} status`);
    }

    this.apply(new PaymentCompletedEvent(
      this.paymentId,
      new Date(),
      transactionReference,
      this.tenantId.value,
    ));
  }

  fail(reason: string): void {
    if (this.status !== PaymentStatus.PENDING && this.status !== PaymentStatus.PROCESSING) {
      throw new Error(`Cannot fail payment in ${this.status} status`);
    }

    this.apply(new PaymentFailedEvent(
      this.paymentId,
      new Date(),
      reason,
      this.tenantId.value,
    ));
  }

  reverse(reversedBy: UserId, reason: string): void {
    if (this.status !== PaymentStatus.COMPLETED && this.status !== PaymentStatus.RECONCILED) {
      throw new Error(`Cannot reverse payment in ${this.status} status`);
    }

    this.apply(new PaymentReversedEvent(
      this.paymentId,
      new Date(),
      reversedBy,
      reason,
      this.tenantId.value,
    ));
  }

  // Event handlers
  protected when(event: DomainEvent): void {
    switch (event.constructor) {
      case PaymentCreatedEvent:
        this.onPaymentCreatedEvent(event as PaymentCreatedEvent);
        break;
      case MobileWalletPaymentInitiatedEvent:
        this.onMobileWalletPaymentInitiatedEvent(event as MobileWalletPaymentInitiatedEvent);
        break;
      case PaymentCompletedEvent:
        this.onPaymentCompletedEvent(event as PaymentCompletedEvent);
        break;
      case PaymentFailedEvent:
        this.onPaymentFailedEvent(event as PaymentFailedEvent);
        break;
      case PaymentReconciledEvent:
        this.onPaymentReconciledEvent(event as PaymentReconciledEvent);
        break;
      case PaymentReversedEvent:
        this.onPaymentReversedEvent(event as PaymentReversedEvent);
        break;
    }
  }

  private onPaymentCreatedEvent(event: PaymentCreatedEvent): void {
    this.paymentId = event.paymentId;
    this.paymentNumber = event.paymentNumber;
    this.invoiceId = event.invoiceId;
    this.amount = event.amount;
    this.paymentMethod = event.paymentMethod;
    this.paymentDate = event.paymentDate;
    this.reference = event.reference;
    this.tenantId = new TenantId(event.tenantId);
    this.status = PaymentStatus.PENDING;
  }

  private onMobileWalletPaymentInitiatedEvent(event: MobileWalletPaymentInitiatedEvent): void {
    this.mobileWallet = {
      provider: event.provider,
      mobileNumber: event.mobileNumber,
      transactionId: event.transactionId,
      merchantCode: event.merchantCode,
    };
    this.status = PaymentStatus.PROCESSING;
  }

  private onPaymentCompletedEvent(event: PaymentCompletedEvent): void {
    this.status = PaymentStatus.COMPLETED;
    this.transactionReference = event.transactionReference;
  }

  private onPaymentFailedEvent(event: PaymentFailedEvent): void {
    this.status = PaymentStatus.FAILED;
  }

  private onPaymentReconciledEvent(event: PaymentReconciledEvent): void {
    this.status = PaymentStatus.RECONCILED;
    this.reconciledAt = event.reconciledAt;
  }

  private onPaymentReversedEvent(event: PaymentReversedEvent): void {
    this.status = PaymentStatus.REVERSED;
  }

  // Getters
  getId(): PaymentId {
    return this.paymentId;
  }

  getPaymentNumber(): string {
    return this.paymentNumber;
  }

  getInvoiceId(): InvoiceId {
    return this.invoiceId;
  }

  getAmount(): Money {
    return this.amount;
  }

  getPaymentMethod(): PaymentMethod {
    return this.paymentMethod;
  }

  getStatus(): PaymentStatus {
    return this.status;
  }

  getMobileWallet(): MobileWallet | undefined {
    return this.mobileWallet;
  }

  getTransactionReference(): string | undefined {
    return this.transactionReference;
  }

  isReconciled(): boolean {
    return this.status === PaymentStatus.RECONCILED;
  }

  /**
   * Serialize aggregate state to a snapshot for event sourcing optimization.
   * Converts all value objects and nested objects to plain JSON-serializable format.
   *
   * @returns Snapshot object containing all aggregate state
   */
  toSnapshot(): any {
    return {
      paymentId: this.paymentId.value,
      paymentNumber: this.paymentNumber,
      invoiceId: this.invoiceId.value,
      amount: {
        amount: this.amount.getAmount(),
        currency: this.amount.getCurrency(),
      },
      paymentMethod: this.paymentMethod,
      bankAccount: this.bankAccount?.value,
      mobileWallet: this.mobileWallet ? {
        provider: this.mobileWallet.provider,
        mobileNumber: this.mobileWallet.mobileNumber,
        transactionId: this.mobileWallet.transactionId,
        accountNumber: this.mobileWallet.accountNumber,
        merchantCode: this.mobileWallet.merchantCode,
        // Note: pin is omitted for security
      } : undefined,
      status: this.status,
      paymentDate: this.paymentDate.toISOString(),
      reference: this.reference,
      reconciledAt: this.reconciledAt?.toISOString(),
      transactionReference: this.transactionReference,
      tenantId: this.tenantId.value,
      checkNumber: this.checkNumber,
    };
  }

  /**
   * Deserialize a snapshot back to a Payment aggregate.
   * Reconstructs all value objects and nested objects from plain JSON.
   *
   * @param state - Snapshot state object
   * @returns Reconstructed Payment aggregate
   */
  static fromSnapshot(state: any): Payment {
    const payment = new Payment(undefined, state.paymentId);

    // Restore internal state
    payment.paymentId = new PaymentId(state.paymentId);
    payment.paymentNumber = state.paymentNumber;
    payment.invoiceId = new InvoiceId(state.invoiceId);
    payment.amount = Money.fromAmount(state.amount.amount, state.amount.currency);
    payment.paymentMethod = state.paymentMethod;
    payment.bankAccount = state.bankAccount ? new BankAccountId(state.bankAccount) : undefined;
    payment.mobileWallet = state.mobileWallet ? {
      provider: state.mobileWallet.provider,
      mobileNumber: state.mobileWallet.mobileNumber,
      transactionId: state.mobileWallet.transactionId,
      accountNumber: state.mobileWallet.accountNumber,
      merchantCode: state.mobileWallet.merchantCode,
    } : undefined;
    payment.status = state.status;
    payment.paymentDate = new Date(state.paymentDate);
    payment.reference = state.reference;
    payment.reconciledAt = state.reconciledAt ? new Date(state.reconciledAt) : undefined;
    payment.transactionReference = state.transactionReference;
    payment.tenantId = new TenantId(state.tenantId);
    payment.checkNumber = state.checkNumber;

    return payment;
  }
}