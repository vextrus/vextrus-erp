import { AggregateRoot } from '../../base/aggregate-root.base';
import { DomainEvent } from '../../base/domain-event.base';
import { Money } from '../../value-objects/money.value-object';
import { TenantId, AccountId } from '../chart-of-account/chart-of-account.aggregate';
import { UserId } from '../invoice/invoice.aggregate';
import {
  JournalDescriptionUpdatedEvent,
  JournalReferenceUpdatedEvent,
  JournalDateUpdatedEvent,
  JournalLinesReplacedEvent,
  JournalLineRemovedEvent,
} from './events/journal-updated.events';

// Value Objects
export class JournalId {
  constructor(public readonly value: string) {}

  static generate(): JournalId {
    return new JournalId(`JRN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }
}

export class JournalLineId {
  constructor(public readonly value: string) {}

  static generate(): JournalLineId {
    return new JournalLineId(`JL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }
}

export enum JournalStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
  CANCELLED = 'CANCELLED',
  ERROR = 'ERROR',
}

export enum JournalType {
  GENERAL = 'GENERAL',
  SALES = 'SALES',
  PURCHASE = 'PURCHASE',
  CASH_RECEIPT = 'CASH_RECEIPT',
  CASH_PAYMENT = 'CASH_PAYMENT',
  ADJUSTMENT = 'ADJUSTMENT',
  REVERSING = 'REVERSING',
  CLOSING = 'CLOSING',
  OPENING = 'OPENING',
}

export interface JournalLine {
  lineId: JournalLineId;
  accountId: AccountId;
  debitAmount: Money;
  creditAmount: Money;
  description?: string;
  costCenter?: string;
  project?: string;
  reference?: string;
  taxCode?: string;
}

export interface CostCenter {
  id: string;
  name: string;
  code: string;
  departmentId?: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  clientId?: string;
}

// Events
export class JournalCreatedEvent extends DomainEvent {
  constructor(
    public readonly journalId: JournalId,
    public readonly journalNumber: string,
    public readonly journalDate: Date,
    public readonly journalType: JournalType,
    public readonly description: string,
    public readonly reference: string,
    public readonly tenantId: string,
    public readonly fiscalPeriod: string,
  ) {
    super(
      journalId.value,
      'JournalCreated',
      { journalNumber, journalDate, journalType, description, reference, fiscalPeriod },
      tenantId
    );
  }
}

export class JournalLineAddedEvent extends DomainEvent {
  constructor(
    public readonly journalId: JournalId,
    public readonly line: JournalLine,
    tenantId: string,
  ) {
    super(
      journalId.value,
      'JournalLineAdded',
      { line },
      tenantId
    );
  }
}

export class JournalPostedEvent extends DomainEvent {
  constructor(
    public readonly journalId: JournalId,
    public readonly postedAt: Date,
    public readonly postedBy: UserId,
    public readonly totalDebit: Money,
    public readonly totalCredit: Money,
    tenantId: string,
  ) {
    super(
      journalId.value,
      'JournalPosted',
      { postedAt, postedBy: postedBy.value, totalDebit, totalCredit },
      tenantId,
      postedBy.value
    );
  }
}

export class ReversingJournalCreatedEvent extends DomainEvent {
  constructor(
    public readonly originalJournalId: JournalId,
    public readonly reversingJournalId: JournalId,
    public readonly reversingDate: Date,
    public readonly lines: JournalLine[],
    tenantId: string,
  ) {
    super(
      reversingJournalId.value,
      'ReversingJournalCreated',
      { originalJournalId: originalJournalId.value, reversingDate, lines },
      tenantId
    );
  }
}

export class JournalValidatedEvent extends DomainEvent {
  constructor(
    public readonly journalId: JournalId,
    public readonly isValid: boolean,
    public readonly validationMessages: string[],
    tenantId: string,
  ) {
    super(
      journalId.value,
      'JournalValidated',
      { isValid, validationMessages },
      tenantId
    );
  }
}

// Commands
export interface CreateJournalCommand {
  journalDate: Date;
  journalType?: JournalType;
  description: string;
  reference?: string;
  tenantId: TenantId;
  lines?: JournalLineDto[];
  autoPost?: boolean;
}

export interface JournalLineDto {
  accountId: AccountId;
  debitAmount?: Money;
  creditAmount?: Money;
  description?: string;
  costCenter?: string;
  project?: string;
  reference?: string;
  taxCode?: string;
}

/**
 * JournalLineInput Interface
 *
 * Simplified input format for journal lines from GraphQL/commands.
 * Uses primitive types (string, number) instead of value objects.
 * Converted to domain objects (AccountId, Money) by the aggregate.
 */
export interface JournalLineInput {
  accountId: string;
  debitAmount?: number;
  creditAmount?: number;
  description?: string;
  costCenter?: string;
  project?: string;
  reference?: string;
  taxCode?: string;
}

// Exceptions
export class UnbalancedJournalException extends Error {
  constructor(totalDebit: Money, totalCredit: Money) {
    const debitAmount = totalDebit.getAmount();
    const creditAmount = totalCredit.getAmount();
    super(`Journal entry is not balanced. Debit: ${debitAmount}, Credit: ${creditAmount}`);
  }
}

export class InvalidJournalStatusException extends Error {
  constructor(current: JournalStatus, expected: JournalStatus) {
    super(`Invalid journal status. Current: ${current}, Expected: ${expected}`);
  }
}

export class EmptyJournalException extends Error {
  constructor() {
    super('Journal entry must have at least two lines');
  }
}

export class InvalidAccountingPeriodException extends Error {
  constructor(date: Date) {
    super(`Date ${date.toISOString()} is in a closed accounting period`);
  }
}

export class CannotReverseUnpostedJournalException extends Error {
  constructor(journalId: JournalId) {
    super(`Cannot reverse unposted journal ${journalId.value}`);
  }
}

// Aggregate
export class JournalEntry extends AggregateRoot<JournalId> {
  private journalId!: JournalId;
  private journalNumber!: string;
  private journalDate!: Date;
  private journalType!: JournalType;
  private description!: string;
  private reference!: string;
  private entries: JournalLine[] = [];
  private totalDebit!: Money;
  private totalCredit!: Money;
  private status!: JournalStatus;
  private isReversing!: boolean;
  private reversingDate?: Date;
  private originalJournalId?: JournalId;
  private tenantId!: TenantId;
  private fiscalPeriod!: string;
  private postedAt?: Date;
  private postedBy?: UserId;

  // Static sequence counter (in production, this would be from database)
  private static journalSequence = 0;

  constructor(props?: any, id?: string) {
    // Create default props if not provided
    const defaultProps = {
      journalId: JournalId.generate(),
    };
    super(props || defaultProps, id || defaultProps.journalId.value);
  }

  static create(command: CreateJournalCommand): JournalEntry {
    const journal = new JournalEntry();

    // Validate accounting period is open
    if (!this.isAccountingPeriodOpen(command.journalDate)) {
      throw new InvalidAccountingPeriodException(command.journalDate);
    }

    const fiscalPeriod = this.calculateFiscalPeriod(command.journalDate);
    const journalNumber = this.generateJournalNumber(command.journalDate, command.journalType);

    journal.apply(new JournalCreatedEvent(
      JournalId.generate(),
      journalNumber,
      command.journalDate,
      command.journalType || JournalType.GENERAL,
      command.description,
      command.reference || '',
      command.tenantId.value,
      fiscalPeriod,
    ));

    // Add journal lines if provided
    if (command.lines && command.lines.length > 0) {
      command.lines.forEach(line => {
        journal.addJournalLine(line);
      });

      // Validate double-entry bookkeeping
      journal.validateBalance();
    }

    // Auto-post if requested
    if (command.autoPost && journal.isValid()) {
      journal.post(new UserId('system'));
    }

    return journal;
  }

  private static isAccountingPeriodOpen(date: Date): boolean {
    // In production, this would check against closed periods in database
    // For now, only allow current and previous month
    const now = new Date();
    const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 +
                     (now.getMonth() - date.getMonth());

    return monthDiff >= -1 && monthDiff <= 1;
  }

  private static calculateFiscalPeriod(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // Bangladesh fiscal year: July 1 to June 30
    let fiscalYear: string;
    if (month >= 7) {
      fiscalYear = `FY${year}-${year + 1}`;
    } else {
      fiscalYear = `FY${year - 1}-${year}`;
    }

    // Period format: FY2024-2025-P01 (July = P01, June = P12)
    const period = month >= 7 ? month - 6 : month + 6;
    return `${fiscalYear}-P${String(period).padStart(2, '0')}`;
  }

  private static generateJournalNumber(date: Date, type?: JournalType): string {
    const typePrefix = {
      [JournalType.GENERAL]: 'GJ',
      [JournalType.SALES]: 'SJ',
      [JournalType.PURCHASE]: 'PJ',
      [JournalType.CASH_RECEIPT]: 'CR',
      [JournalType.CASH_PAYMENT]: 'CP',
      [JournalType.ADJUSTMENT]: 'AJ',
      [JournalType.REVERSING]: 'RJ',
      [JournalType.CLOSING]: 'CJ',
      [JournalType.OPENING]: 'OJ',
    };

    const prefix = typePrefix[type || JournalType.GENERAL];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const sequence = String(++this.journalSequence).padStart(6, '0');

    // Format: GJ-2024-01-000001
    return `${prefix}-${year}-${month}-${sequence}`;
  }

  addJournalLine(line: JournalLineDto): void {
    // Ensure amounts are provided
    const debitAmount = line.debitAmount || Money.zero('BDT');
    const creditAmount = line.creditAmount || Money.zero('BDT');

    // Validate that line has either debit or credit, not both
    if (!debitAmount.isZero() && !creditAmount.isZero()) {
      throw new Error('Journal line cannot have both debit and credit amounts');
    }

    // Validate that line has at least one amount
    if (debitAmount.isZero() && creditAmount.isZero()) {
      throw new Error('Journal line must have either debit or credit amount');
    }

    const journalLine: JournalLine = {
      lineId: JournalLineId.generate(),
      accountId: line.accountId,
      debitAmount,
      creditAmount,
      description: line.description,
      costCenter: line.costCenter,
      project: line.project,
      reference: line.reference,
      taxCode: line.taxCode,
    };

    this.apply(new JournalLineAddedEvent(this.journalId, journalLine, this.tenantId.value));
  }

  validateBalance(): void {
    if (this.entries.length < 2) {
      throw new EmptyJournalException();
    }

    const totalDebit = this.entries.reduce(
      (sum, entry) => sum.add(entry.debitAmount),
      Money.zero('BDT')
    );

    const totalCredit = this.entries.reduce(
      (sum, entry) => sum.add(entry.creditAmount),
      Money.zero('BDT')
    );

    if (!totalDebit.equals(totalCredit)) {
      throw new UnbalancedJournalException(totalDebit, totalCredit);
    }

    this.totalDebit = totalDebit;
    this.totalCredit = totalCredit;

    this.apply(new JournalValidatedEvent(
      this.journalId,
      true,
      ['Journal entry is balanced'],
      this.tenantId.value
    ));
  }

  private isValid(): boolean {
    try {
      this.validateBalance();
      return true;
    } catch {
      return false;
    }
  }

  post(postedBy: UserId): void {
    if (this.status !== JournalStatus.DRAFT) {
      throw new InvalidJournalStatusException(this.status, JournalStatus.DRAFT);
    }

    this.validateBalance();

    this.apply(new JournalPostedEvent(
      this.journalId,
      new Date(),
      postedBy,
      this.totalDebit,
      this.totalCredit,
      this.tenantId.value,
    ));
  }

  createReversingEntry(reversingDate: Date): JournalEntry {
    if (this.status !== JournalStatus.POSTED) {
      throw new CannotReverseUnpostedJournalException(this.journalId);
    }

    // Validate reversing date is in open period
    if (!JournalEntry.isAccountingPeriodOpen(reversingDate)) {
      throw new InvalidAccountingPeriodException(reversingDate);
    }

    const reversingJournal = new JournalEntry();

    // Reverse all entries (swap debit and credit)
    const reversedLines = this.entries.map(line => ({
      lineId: JournalLineId.generate(),
      accountId: line.accountId,
      debitAmount: line.creditAmount,  // Swap
      creditAmount: line.debitAmount,  // Swap
      description: `Reversing: ${line.description || this.description}`,
      costCenter: line.costCenter,
      project: line.project,
      reference: `REV-${this.journalNumber}`,
      taxCode: line.taxCode,
    }));

    reversingJournal.apply(new ReversingJournalCreatedEvent(
      this.journalId,
      JournalId.generate(),
      reversingDate,
      reversedLines,
      this.tenantId.value,
    ));

    return reversingJournal;
  }

  /**
   * Update journal description (DRAFT only)
   */
  updateDescription(description: string, updatedBy: UserId): void {
    if (this.status !== JournalStatus.DRAFT) {
      throw new InvalidJournalStatusException(this.status, JournalStatus.DRAFT);
    }

    this.apply(new JournalDescriptionUpdatedEvent(
      this.journalId,
      description,
      updatedBy,
      this.tenantId.value
    ));
  }

  /**
   * Update journal reference (DRAFT only)
   */
  updateReference(reference: string, updatedBy: UserId): void {
    if (this.status !== JournalStatus.DRAFT) {
      throw new InvalidJournalStatusException(this.status, JournalStatus.DRAFT);
    }

    this.apply(new JournalReferenceUpdatedEvent(
      this.journalId,
      reference,
      updatedBy,
      this.tenantId.value
    ));
  }

  /**
   * Update journal date (DRAFT only)
   * Recalculates fiscal period
   */
  updateJournalDate(journalDate: Date, updatedBy: UserId): void {
    if (this.status !== JournalStatus.DRAFT) {
      throw new InvalidJournalStatusException(this.status, JournalStatus.DRAFT);
    }

    // Validate new date is in open period
    if (!JournalEntry.isAccountingPeriodOpen(journalDate)) {
      throw new InvalidAccountingPeriodException(journalDate);
    }

    const newFiscalPeriod = JournalEntry.calculateFiscalPeriod(journalDate);

    this.apply(new JournalDateUpdatedEvent(
      this.journalId,
      journalDate,
      newFiscalPeriod,
      updatedBy,
      this.tenantId.value
    ));
  }

  /**
   * Update journal lines (DRAFT only)
   * Replaces all existing lines with new ones
   */
  updateLines(lines: JournalLineDto[] | JournalLineInput[], updatedBy: UserId): void {
    if (this.status !== JournalStatus.DRAFT) {
      throw new InvalidJournalStatusException(this.status, JournalStatus.DRAFT);
    }

    // Convert DTOs to domain objects
    const journalLines: JournalLine[] = lines.map(line => ({
      lineId: JournalLineId.generate(),
      accountId: typeof line.accountId === 'string' ? new AccountId(line.accountId) : line.accountId,
      debitAmount: line.debitAmount instanceof Money ? line.debitAmount : (line.debitAmount ? Money.create(line.debitAmount, 'BDT') : Money.zero('BDT')),
      creditAmount: line.creditAmount instanceof Money ? line.creditAmount : (line.creditAmount ? Money.create(line.creditAmount, 'BDT') : Money.zero('BDT')),
      description: line.description,
      costCenter: line.costCenter,
      project: line.project,
      reference: line.reference,
      taxCode: line.taxCode,
    }));

    this.apply(new JournalLinesReplacedEvent(
      this.journalId,
      journalLines,
      updatedBy,
      this.tenantId.value
    ));
  }

  /**
   * Remove a specific journal line (DRAFT only)
   */
  removeLine(lineId: string, updatedBy: UserId): void {
    if (this.status !== JournalStatus.DRAFT) {
      throw new InvalidJournalStatusException(this.status, JournalStatus.DRAFT);
    }

    const line = this.entries.find(e => e.lineId.value === lineId);
    if (!line) {
      throw new Error(`Journal line ${lineId} not found`);
    }

    this.apply(new JournalLineRemovedEvent(
      this.journalId,
      new JournalLineId(lineId),
      updatedBy,
      this.tenantId.value
    ));
  }

  // Batch operations for period-end processing
  static createClosingEntries(
    accountBalances: Map<AccountId, Money>,
    closingDate: Date,
    tenantId: TenantId
  ): JournalEntry[] {
    const closingJournals: JournalEntry[] = [];

    // Create income statement closing entry
    const incomeStatementJournal = new JournalEntry();
    const incomeLines: JournalLineDto[] = [];

    accountBalances.forEach((balance, accountId) => {
      // Close revenue and expense accounts
      if (this.isIncomeStatementAccount(accountId)) {
        incomeLines.push({
          accountId,
          debitAmount: balance.isPositive() ? balance : undefined,
          creditAmount: balance.isNegative() ? balance.negate() : undefined,
          description: 'Period-end closing',
        });
      }
    });

    if (incomeLines.length > 0) {
      incomeStatementJournal.apply(new JournalCreatedEvent(
        JournalId.generate(),
        this.generateJournalNumber(closingDate, JournalType.CLOSING),
        closingDate,
        JournalType.CLOSING,
        'Income Statement Closing Entry',
        `CLOSE-${closingDate.toISOString().slice(0, 10)}`,
        tenantId.value,
        this.calculateFiscalPeriod(closingDate),
      ));

      incomeLines.forEach(line => incomeStatementJournal.addJournalLine(line));
      closingJournals.push(incomeStatementJournal);
    }

    return closingJournals;
  }

  private static isIncomeStatementAccount(accountId: AccountId): boolean {
    // In production, would check account type from database
    // Revenue accounts typically start with 4, expenses with 5
    const accountCode = accountId.value;
    return accountCode.startsWith('4') || accountCode.startsWith('5');
  }

  // Event handlers
  protected when(event: DomainEvent): void {
    switch (event.constructor) {
      case JournalCreatedEvent:
        this.onJournalCreatedEvent(event as JournalCreatedEvent);
        break;
      case JournalLineAddedEvent:
        this.onJournalLineAddedEvent(event as JournalLineAddedEvent);
        break;
      case JournalPostedEvent:
        this.onJournalPostedEvent(event as JournalPostedEvent);
        break;
      case ReversingJournalCreatedEvent:
        this.onReversingJournalCreatedEvent(event as ReversingJournalCreatedEvent);
        break;
      case JournalValidatedEvent:
        this.onJournalValidatedEvent(event as JournalValidatedEvent);
        break;
      case JournalDescriptionUpdatedEvent:
        this.onJournalDescriptionUpdated(event as JournalDescriptionUpdatedEvent);
        break;
      case JournalReferenceUpdatedEvent:
        this.onJournalReferenceUpdated(event as JournalReferenceUpdatedEvent);
        break;
      case JournalDateUpdatedEvent:
        this.onJournalDateUpdated(event as JournalDateUpdatedEvent);
        break;
      case JournalLinesReplacedEvent:
        this.onJournalLinesReplaced(event as JournalLinesReplacedEvent);
        break;
      case JournalLineRemovedEvent:
        this.onJournalLineRemoved(event as JournalLineRemovedEvent);
        break;
    }
  }

  private onJournalCreatedEvent(event: JournalCreatedEvent): void {
    this.journalId = event.journalId;
    this.journalNumber = event.journalNumber;
    this.journalDate = event.journalDate;
    this.journalType = event.journalType;
    this.description = event.description;
    this.reference = event.reference;
    this.tenantId = new TenantId(event.tenantId);
    this.fiscalPeriod = event.fiscalPeriod;
    this.status = JournalStatus.DRAFT;
    this.entries = [];
    this.totalDebit = Money.zero('BDT');
    this.totalCredit = Money.zero('BDT');
    this.isReversing = false;
  }

  private onJournalLineAddedEvent(event: JournalLineAddedEvent): void {
    this.entries.push(event.line);

    // Update running totals
    this.totalDebit = this.entries.reduce(
      (sum, entry) => sum.add(entry.debitAmount),
      Money.zero('BDT')
    );

    this.totalCredit = this.entries.reduce(
      (sum, entry) => sum.add(entry.creditAmount),
      Money.zero('BDT')
    );
  }

  private onJournalPostedEvent(event: JournalPostedEvent): void {
    this.status = JournalStatus.POSTED;
    this.postedAt = event.postedAt;
    this.postedBy = event.postedBy;
  }

  private onReversingJournalCreatedEvent(event: ReversingJournalCreatedEvent): void {
    this.journalId = event.reversingJournalId;
    this.originalJournalId = event.originalJournalId;
    this.isReversing = true;
    this.entries = event.lines;
    this.status = JournalStatus.DRAFT;

    // Calculate totals
    this.totalDebit = this.entries.reduce(
      (sum, entry) => sum.add(entry.debitAmount),
      Money.zero('BDT')
    );

    this.totalCredit = this.entries.reduce(
      (sum, entry) => sum.add(entry.creditAmount),
      Money.zero('BDT')
    );
  }

  private onJournalValidatedEvent(event: JournalValidatedEvent): void {
    // Validation state could be tracked here if needed
  }

  private onJournalDescriptionUpdated(event: JournalDescriptionUpdatedEvent): void {
    this.description = event.description;
  }

  private onJournalReferenceUpdated(event: JournalReferenceUpdatedEvent): void {
    this.reference = event.reference;
  }

  private onJournalDateUpdated(event: JournalDateUpdatedEvent): void {
    this.journalDate = event.journalDate;
    this.fiscalPeriod = event.fiscalPeriod;
  }

  private onJournalLinesReplaced(event: JournalLinesReplacedEvent): void {
    this.entries = event.lines;

    // Recalculate totals
    this.totalDebit = this.entries.reduce(
      (sum, entry) => sum.add(entry.debitAmount),
      Money.zero('BDT')
    );

    this.totalCredit = this.entries.reduce(
      (sum, entry) => sum.add(entry.creditAmount),
      Money.zero('BDT')
    );
  }

  private onJournalLineRemoved(event: JournalLineRemovedEvent): void {
    this.entries = this.entries.filter(e => e.lineId.value !== event.lineId.value);

    // Recalculate totals
    this.totalDebit = this.entries.reduce(
      (sum, entry) => sum.add(entry.debitAmount),
      Money.zero('BDT')
    );

    this.totalCredit = this.entries.reduce(
      (sum, entry) => sum.add(entry.creditAmount),
      Money.zero('BDT')
    );
  }

  // Getters
  getId(): JournalId {
    return this.journalId;
  }

  getJournalNumber(): string {
    return this.journalNumber;
  }

  getJournalDate(): Date {
    return this.journalDate;
  }

  getDescription(): string {
    return this.description;
  }

  getEntries(): JournalLine[] {
    return [...this.entries];
  }

  getTotalDebit(): Money {
    return this.totalDebit;
  }

  getTotalCredit(): Money {
    return this.totalCredit;
  }

  getStatus(): JournalStatus {
    return this.status;
  }

  getFiscalPeriod(): string {
    return this.fiscalPeriod;
  }

  isPosted(): boolean {
    return this.status === JournalStatus.POSTED;
  }

  /**
   * Serialize aggregate state to a snapshot for event sourcing optimization.
   * Converts all value objects and nested objects to plain JSON-serializable format.
   *
   * @returns Snapshot object containing all aggregate state
   */
  toSnapshot(): any {
    return {
      journalId: this.journalId.value,
      journalNumber: this.journalNumber,
      journalDate: this.journalDate.toISOString(),
      journalType: this.journalType,
      description: this.description,
      reference: this.reference,
      entries: this.entries.map(entry => ({
        lineId: entry.lineId.value,
        accountId: entry.accountId.value,
        debitAmount: {
          amount: entry.debitAmount.getAmount(),
          currency: entry.debitAmount.getCurrency(),
        },
        creditAmount: {
          amount: entry.creditAmount.getAmount(),
          currency: entry.creditAmount.getCurrency(),
        },
        description: entry.description,
        costCenter: entry.costCenter,
        project: entry.project,
        reference: entry.reference,
        taxCode: entry.taxCode,
      })),
      totalDebit: {
        amount: this.totalDebit.getAmount(),
        currency: this.totalDebit.getCurrency(),
      },
      totalCredit: {
        amount: this.totalCredit.getAmount(),
        currency: this.totalCredit.getCurrency(),
      },
      status: this.status,
      isReversing: this.isReversing,
      reversingDate: this.reversingDate?.toISOString(),
      originalJournalId: this.originalJournalId?.value,
      tenantId: this.tenantId.value,
      fiscalPeriod: this.fiscalPeriod,
      postedAt: this.postedAt?.toISOString(),
      postedBy: this.postedBy?.value,
    };
  }

  /**
   * Deserialize a snapshot back to a JournalEntry aggregate.
   * Reconstructs all value objects and nested objects from plain JSON.
   *
   * @param state - Snapshot state object
   * @returns Reconstructed JournalEntry aggregate
   */
  static fromSnapshot(state: any): JournalEntry {
    const journal = new JournalEntry(undefined, state.journalId);

    // Restore internal state
    journal.journalId = new JournalId(state.journalId);
    journal.journalNumber = state.journalNumber;
    journal.journalDate = new Date(state.journalDate);
    journal.journalType = state.journalType;
    journal.description = state.description;
    journal.reference = state.reference;
    journal.entries = state.entries.map((entry: any) => ({
      lineId: new JournalLineId(entry.lineId),
      accountId: new AccountId(entry.accountId),
      debitAmount: Money.fromAmount(entry.debitAmount.amount, entry.debitAmount.currency),
      creditAmount: Money.fromAmount(entry.creditAmount.amount, entry.creditAmount.currency),
      description: entry.description,
      costCenter: entry.costCenter,
      project: entry.project,
      reference: entry.reference,
      taxCode: entry.taxCode,
    }));
    journal.totalDebit = Money.fromAmount(state.totalDebit.amount, state.totalDebit.currency);
    journal.totalCredit = Money.fromAmount(state.totalCredit.amount, state.totalCredit.currency);
    journal.status = state.status;
    journal.isReversing = state.isReversing;
    journal.reversingDate = state.reversingDate ? new Date(state.reversingDate) : undefined;
    journal.originalJournalId = state.originalJournalId ? new JournalId(state.originalJournalId) : undefined;
    journal.tenantId = new TenantId(state.tenantId);
    journal.fiscalPeriod = state.fiscalPeriod;
    journal.postedAt = state.postedAt ? new Date(state.postedAt) : undefined;
    journal.postedBy = state.postedBy ? new UserId(state.postedBy) : undefined;

    return journal;
  }
}