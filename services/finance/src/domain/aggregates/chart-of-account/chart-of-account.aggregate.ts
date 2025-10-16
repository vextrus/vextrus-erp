import { AggregateRoot } from '../../base/aggregate-root.base';
import { DomainEvent } from '../../base/domain-event.base';
import { Money } from '../../value-objects/money.value-object';

// Value Objects
export class AccountId {
  constructor(public readonly value: string) {}

  static generate(): AccountId {
    return new AccountId(`ACC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }
}

export class AccountCode {
  constructor(public readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid account code format');
    }
  }

  private isValid(code: string): boolean {
    // Bangladesh standard: 4-digit hierarchical code
    return /^\d{4}(-\d{2})*$/.test(code);
  }
}

export class TenantId {
  constructor(public readonly value: string) {}
}

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export enum Currency {
  BDT = 'BDT',
  USD = 'USD',
  EUR = 'EUR',
}

// Events
export class AccountCreatedEvent extends DomainEvent {
  constructor(
    public readonly accountId: AccountId,
    public readonly accountCode: string,
    public readonly accountName: string,
    public readonly accountType: AccountType,
    public readonly parentAccountId: AccountId | undefined,
    public readonly currency: Currency,
    public readonly tenantId: string,
  ) {
    super(
      accountId.value,
      'AccountCreated',
      { accountCode, accountName, accountType, parentAccountId, currency },
      tenantId
    );
  }
}

export class AccountBalanceUpdatedEvent extends DomainEvent {
  constructor(
    public readonly accountId: AccountId,
    public readonly previousBalance: Money,
    public readonly newBalance: Money,
    public readonly timestamp: Date,
    tenantId: string,
  ) {
    super(
      accountId.value,
      'AccountBalanceUpdated',
      { previousBalance, newBalance, timestamp },
      tenantId
    );
  }
}

export class AccountDeactivatedEvent extends DomainEvent {
  constructor(
    public readonly accountId: AccountId,
    public readonly reason: string,
    public readonly deactivatedAt: Date,
    tenantId: string,
  ) {
    super(
      accountId.value,
      'AccountDeactivated',
      { reason, deactivatedAt },
      tenantId
    );
  }
}

// Commands
export interface CreateAccountCommand {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  parentAccountId?: AccountId;
  currency: Currency;
  tenantId: TenantId;
}

// Exceptions
export class InvalidAccountCodeException extends Error {
  constructor(code: string) {
    super(`Invalid account code: ${code}`);
  }
}

export class CurrencyMismatchException extends Error {
  constructor(expected: Currency, actual: Currency) {
    super(`Currency mismatch: expected ${expected}, got ${actual}`);
  }
}

export class InsufficientBalanceException extends Error {
  constructor(available: Money, required: Money) {
    super(`Insufficient balance: available ${available.getAmount()}, required ${required.getAmount()}`);
  }
}

// Aggregate
export class ChartOfAccount extends AggregateRoot<AccountId> {
  private accountId!: AccountId;
  private accountCode!: AccountCode;
  private accountName!: string;
  private accountType!: AccountType;
  private parentAccountId?: AccountId;
  private balance!: Money;
  private currency!: Currency;
  private isActive!: boolean;
  private tenantId!: TenantId;
  private children: AccountId[] = [];

  constructor(props?: any, id?: string) {
    // Create default props if not provided
    const defaultProps = {
      accountId: AccountId.generate(),
    };
    super(props || defaultProps, id || defaultProps.accountId.value);
  }

  // Factory method
  static create(command: CreateAccountCommand): ChartOfAccount {
    const account = new ChartOfAccount();

    // Validate business rules
    if (!this.isValidAccountCode(command.accountCode)) {
      throw new InvalidAccountCodeException(command.accountCode);
    }

    // Validate account hierarchy
    if (!this.isValidHierarchy(command.accountType, command.parentAccountId)) {
      throw new Error('Invalid account hierarchy');
    }

    // Apply event
    account.apply(new AccountCreatedEvent(
      AccountId.generate(),
      command.accountCode,
      command.accountName,
      command.accountType,
      command.parentAccountId,
      command.currency,
      command.tenantId.value,
    ));

    return account;
  }

  private static isValidAccountCode(code: string): boolean {
    // Bangladesh Chart of Accounts standard
    // Format: XXXX-YY-ZZ (Main-Sub-Detail)
    return /^\d{4}(-\d{2})*$/.test(code);
  }

  private static isValidHierarchy(
    accountType: AccountType,
    parentAccountId?: AccountId,
  ): boolean {
    // Validate that child accounts match parent type
    // This would check against parent in real implementation
    return true;
  }

  // Business methods
  updateBalance(amount: Money): void {
    if (!amount.isSameCurrency(this.currency)) {
      throw new CurrencyMismatchException(this.currency, amount.getCurrency() as Currency);
    }

    const newBalance = this.accountType === AccountType.ASSET ||
                      this.accountType === AccountType.EXPENSE
      ? this.balance.add(amount)
      : this.balance.subtract(amount);

    this.apply(new AccountBalanceUpdatedEvent(
      this.accountId,
      this.balance,
      newBalance,
      new Date(),
      this.tenantId.value,
    ));
  }

  debit(amount: Money): void {
    if (!amount.isSameCurrency(this.currency)) {
      throw new CurrencyMismatchException(this.currency, amount.getCurrency() as Currency);
    }

    // Normal debit balance accounts: Assets, Expenses
    if (this.accountType === AccountType.ASSET || this.accountType === AccountType.EXPENSE) {
      this.updateBalance(amount);
    } else {
      // Credit balance accounts: decrease balance
      const newBalance = this.balance.subtract(amount);
      if (newBalance.isNegative() && !this.allowsNegativeBalance()) {
        throw new InsufficientBalanceException(this.balance, amount);
      }
      this.apply(new AccountBalanceUpdatedEvent(
        this.accountId,
        this.balance,
        newBalance,
        new Date(),
        this.tenantId.value,
      ));
    }
  }

  credit(amount: Money): void {
    if (!amount.isSameCurrency(this.currency)) {
      throw new CurrencyMismatchException(this.currency, amount.getCurrency() as Currency);
    }

    // Normal credit balance accounts: Liabilities, Equity, Revenue
    if (this.accountType === AccountType.LIABILITY ||
        this.accountType === AccountType.EQUITY ||
        this.accountType === AccountType.REVENUE) {
      this.updateBalance(amount);
    } else {
      // Debit balance accounts: decrease balance
      const newBalance = this.balance.subtract(amount);
      if (newBalance.isNegative() && !this.allowsNegativeBalance()) {
        throw new InsufficientBalanceException(this.balance, amount);
      }
      this.apply(new AccountBalanceUpdatedEvent(
        this.accountId,
        this.balance,
        newBalance,
        new Date(),
        this.tenantId.value,
      ));
    }
  }

  deactivate(reason: string): void {
    if (!this.isActive) {
      throw new Error('Account is already deactivated');
    }

    if (this.children.length > 0) {
      throw new Error('Cannot deactivate account with active children');
    }

    if (!this.balance.isZero()) {
      throw new Error('Cannot deactivate account with non-zero balance');
    }

    this.apply(new AccountDeactivatedEvent(
      this.accountId,
      reason,
      new Date(),
      this.tenantId.value,
    ));
  }

  private allowsNegativeBalance(): boolean {
    // Some accounts like bank overdrafts can have negative balances
    return this.accountCode.value.startsWith('1120'); // Bank overdraft accounts
  }

  // Event handlers
  protected when(event: DomainEvent): void {
    switch (event.constructor) {
      case AccountCreatedEvent:
        this.onAccountCreatedEvent(event as AccountCreatedEvent);
        break;
      case AccountBalanceUpdatedEvent:
        this.onAccountBalanceUpdatedEvent(event as AccountBalanceUpdatedEvent);
        break;
      case AccountDeactivatedEvent:
        this.onAccountDeactivatedEvent(event as AccountDeactivatedEvent);
        break;
    }
  }

  private onAccountCreatedEvent(event: AccountCreatedEvent): void {
    this.accountId = event.accountId;
    this.accountCode = new AccountCode(event.accountCode);
    this.accountName = event.accountName;
    this.accountType = event.accountType;
    this.parentAccountId = event.parentAccountId;
    this.balance = Money.zero(event.currency);
    this.currency = event.currency;
    this.isActive = true;
    this.tenantId = new TenantId(event.tenantId);
  }

  private onAccountBalanceUpdatedEvent(event: AccountBalanceUpdatedEvent): void {
    this.balance = event.newBalance;
  }

  private onAccountDeactivatedEvent(event: AccountDeactivatedEvent): void {
    this.isActive = false;
  }

  // Getters
  getId(): AccountId {
    return this.accountId;
  }

  getAccountCode(): string {
    return this.accountCode.value;
  }

  getAccountName(): string {
    return this.accountName;
  }

  getAccountType(): AccountType {
    return this.accountType;
  }

  getBalance(): Money {
    return this.balance;
  }

  getCurrency(): Currency {
    return this.currency;
  }

  isAccountActive(): boolean {
    return this.isActive;
  }

  getTenantId(): TenantId {
    return this.tenantId;
  }

  getParentAccountId(): AccountId | undefined {
    return this.parentAccountId;
  }
}