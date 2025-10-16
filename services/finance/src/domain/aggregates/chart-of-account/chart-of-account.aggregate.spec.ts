import {
  ChartOfAccount,
  AccountId,
  AccountCode,
  TenantId,
  AccountType,
  Currency,
  CreateAccountCommand,
  AccountCreatedEvent,
  AccountBalanceUpdatedEvent,
  AccountDeactivatedEvent,
  InvalidAccountCodeException,
  CurrencyMismatchException,
  InsufficientBalanceException,
} from './chart-of-account.aggregate';
import { Money } from '../../value-objects/money.value-object';

describe('ChartOfAccount Aggregate', () => {
  describe('Account Creation', () => {
    it('should create account with valid data', () => {
      // Arrange
      const command: CreateAccountCommand = {
        accountCode: '1000',
        accountName: 'Cash',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      };

      // Act
      const account = ChartOfAccount.create(command);

      // Assert
      expect(account).toBeDefined();
      expect(account.getId()).toBeInstanceOf(AccountId);
      expect(account.getAccountCode()).toBe('1000');
      expect(account.getAccountName()).toBe('Cash');
      expect(account.getAccountType()).toBe(AccountType.ASSET);
      expect(account.getCurrency()).toBe(Currency.BDT);
      expect(account.isAccountActive()).toBe(true);
      expect(account.getBalance().getAmount()).toBe(0);

      // Verify event
      const events = account.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AccountCreatedEvent);

      const createdEvent = events[0] as AccountCreatedEvent;
      expect(createdEvent.eventType).toBe('AccountCreated');
      expect(createdEvent.tenantId).toBe('tenant-789');
    });

    it('should create asset account', () => {
      // Arrange
      const command: CreateAccountCommand = {
        accountCode: '1100',
        accountName: 'Bank Account',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      };

      // Act
      const account = ChartOfAccount.create(command);

      // Assert
      expect(account.getAccountType()).toBe(AccountType.ASSET);
    });

    it('should create liability account', () => {
      // Arrange
      const command: CreateAccountCommand = {
        accountCode: '2000',
        accountName: 'Accounts Payable',
        accountType: AccountType.LIABILITY,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      };

      // Act
      const account = ChartOfAccount.create(command);

      // Assert
      expect(account.getAccountType()).toBe(AccountType.LIABILITY);
    });

    it('should create equity account', () => {
      // Arrange
      const command: CreateAccountCommand = {
        accountCode: '3000',
        accountName: 'Capital',
        accountType: AccountType.EQUITY,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      };

      // Act
      const account = ChartOfAccount.create(command);

      // Assert
      expect(account.getAccountType()).toBe(AccountType.EQUITY);
    });

    it('should create revenue account', () => {
      // Arrange
      const command: CreateAccountCommand = {
        accountCode: '4000',
        accountName: 'Sales Revenue',
        accountType: AccountType.REVENUE,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      };

      // Act
      const account = ChartOfAccount.create(command);

      // Assert
      expect(account.getAccountType()).toBe(AccountType.REVENUE);
    });

    it('should create expense account', () => {
      // Arrange
      const command: CreateAccountCommand = {
        accountCode: '5000',
        accountName: 'Office Expense',
        accountType: AccountType.EXPENSE,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      };

      // Act
      const account = ChartOfAccount.create(command);

      // Assert
      expect(account.getAccountType()).toBe(AccountType.EXPENSE);
    });

    it('should create account with parent', () => {
      // Arrange
      const parentId = AccountId.generate();
      const command: CreateAccountCommand = {
        accountCode: '1010',
        accountName: 'Petty Cash',
        accountType: AccountType.ASSET,
        parentAccountId: parentId,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      };

      // Act
      const account = ChartOfAccount.create(command);

      // Assert
      expect(account.getParentAccountId()).toBe(parentId);
    });

    it('should support hierarchical account codes', () => {
      // Test various valid hierarchical code formats
      const validCodes = [
        '1000',      // Main account
        '1000-01',   // Sub-account
        '1000-01-02', // Detail account
      ];

      validCodes.forEach(code => {
        const command: CreateAccountCommand = {
          accountCode: code,
          accountName: 'Test Account',
          accountType: AccountType.ASSET,
          currency: Currency.BDT,
          tenantId: new TenantId('tenant-789'),
        };

        expect(() => ChartOfAccount.create(command)).not.toThrow();
      });
    });

    it('should throw error for invalid account code format', () => {
      // Arrange
      const command: CreateAccountCommand = {
        accountCode: 'ABC123', // Invalid format
        accountName: 'Invalid Account',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      };

      // Act & Assert
      expect(() => {
        ChartOfAccount.create(command);
      }).toThrow(InvalidAccountCodeException);
    });

    it('should initialize with zero balance', () => {
      // Arrange
      const command: CreateAccountCommand = {
        accountCode: '1000',
        accountName: 'Cash',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      };

      // Act
      const account = ChartOfAccount.create(command);

      // Assert
      expect(account.getBalance().isZero()).toBe(true);
    });
  });

  describe('Account Code Validation', () => {
    it('should accept 4-digit account codes', () => {
      // Arrange
      const command: CreateAccountCommand = {
        accountCode: '1234',
        accountName: 'Test Account',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      };

      // Act & Assert
      expect(() => ChartOfAccount.create(command)).not.toThrow();
    });

    it('should accept hierarchical account codes', () => {
      // Arrange
      const command: CreateAccountCommand = {
        accountCode: '1000-12',
        accountName: 'Sub Account',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      };

      // Act & Assert
      expect(() => ChartOfAccount.create(command)).not.toThrow();
    });

    it('should reject non-numeric account codes', () => {
      // Arrange
      const command: CreateAccountCommand = {
        accountCode: 'ABCD',
        accountName: 'Invalid',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      };

      // Act & Assert
      expect(() => ChartOfAccount.create(command)).toThrow(InvalidAccountCodeException);
    });

    it('should reject account codes with invalid format', () => {
      const invalidCodes = [
        '123',        // Too short
        '12345',      // Too long
        '1000-1',     // Invalid sub-level format
        '1000-',      // Incomplete
        '-1000',      // Invalid start
      ];

      invalidCodes.forEach(code => {
        const command: CreateAccountCommand = {
          accountCode: code,
          accountName: 'Invalid Account',
          accountType: AccountType.ASSET,
          currency: Currency.BDT,
          tenantId: new TenantId('tenant-789'),
        };

        expect(() => ChartOfAccount.create(command)).toThrow();
      });
    });
  });

  describe('Debit Operations', () => {
    let assetAccount: ChartOfAccount;
    let liabilityAccount: ChartOfAccount;

    beforeEach(() => {
      assetAccount = ChartOfAccount.create({
        accountCode: '1000',
        accountName: 'Cash',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      });
      assetAccount.clearEvents();

      liabilityAccount = ChartOfAccount.create({
        accountCode: '2000',
        accountName: 'Accounts Payable',
        accountType: AccountType.LIABILITY,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      });
      liabilityAccount.clearEvents();
    });

    it('should increase asset account balance on debit', () => {
      // Arrange
      const amount = Money.create(10000, 'BDT');

      // Act
      assetAccount.debit(amount);

      // Assert
      expect(assetAccount.getBalance().getAmount()).toBe(10000);

      // Verify event
      const events = assetAccount.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AccountBalanceUpdatedEvent);

      const balanceEvent = events[0] as AccountBalanceUpdatedEvent;
      expect(balanceEvent.previousBalance.getAmount()).toBe(0);
      expect(balanceEvent.newBalance.getAmount()).toBe(10000);
    });

    it('should increase expense account balance on debit', () => {
      // Arrange
      const expenseAccount = ChartOfAccount.create({
        accountCode: '5000',
        accountName: 'Office Expense',
        accountType: AccountType.EXPENSE,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      });
      expenseAccount.clearEvents();

      const amount = Money.create(5000, 'BDT');

      // Act
      expenseAccount.debit(amount);

      // Assert
      expect(expenseAccount.getBalance().getAmount()).toBe(5000);
    });

    it('should decrease liability account balance on debit', () => {
      // Arrange - First add a credit to liability account
      liabilityAccount.credit(Money.create(10000, 'BDT'));
      liabilityAccount.clearEvents();

      const debitAmount = Money.create(3000, 'BDT');

      // Act
      liabilityAccount.debit(debitAmount);

      // Assert
      expect(liabilityAccount.getBalance().getAmount()).toBe(7000);
    });

    it('should throw error for currency mismatch on debit', () => {
      // Arrange
      const amount = Money.create(1000, 'USD'); // Wrong currency

      // Act & Assert
      expect(() => {
        assetAccount.debit(amount);
      }).toThrow(CurrencyMismatchException);
    });

    it('should throw error for insufficient balance on liability debit', () => {
      // Arrange - Liability account with 1000 balance
      liabilityAccount.credit(Money.create(1000, 'BDT'));
      liabilityAccount.clearEvents();

      const excessiveDebit = Money.create(2000, 'BDT');

      // Act & Assert
      expect(() => {
        liabilityAccount.debit(excessiveDebit);
      }).toThrow(InsufficientBalanceException);
    });
  });

  describe('Credit Operations', () => {
    let assetAccount: ChartOfAccount;
    let revenueAccount: ChartOfAccount;

    beforeEach(() => {
      assetAccount = ChartOfAccount.create({
        accountCode: '1000',
        accountName: 'Cash',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      });
      assetAccount.clearEvents();

      revenueAccount = ChartOfAccount.create({
        accountCode: '4000',
        accountName: 'Sales Revenue',
        accountType: AccountType.REVENUE,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      });
      revenueAccount.clearEvents();
    });

    it('should increase liability account balance on credit', () => {
      // Arrange
      const liabilityAccount = ChartOfAccount.create({
        accountCode: '2000',
        accountName: 'Accounts Payable',
        accountType: AccountType.LIABILITY,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      });
      liabilityAccount.clearEvents();

      const amount = Money.create(10000, 'BDT');

      // Act
      liabilityAccount.credit(amount);

      // Assert
      expect(liabilityAccount.getBalance().getAmount()).toBe(10000);
    });

    it('should increase equity account balance on credit', () => {
      // Arrange
      const equityAccount = ChartOfAccount.create({
        accountCode: '3000',
        accountName: 'Capital',
        accountType: AccountType.EQUITY,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      });
      equityAccount.clearEvents();

      const amount = Money.create(50000, 'BDT');

      // Act
      equityAccount.credit(amount);

      // Assert
      expect(equityAccount.getBalance().getAmount()).toBe(50000);
    });

    it('should increase revenue account balance on credit', () => {
      // Arrange
      const amount = Money.create(20000, 'BDT');

      // Act
      revenueAccount.credit(amount);

      // Assert
      expect(revenueAccount.getBalance().getAmount()).toBe(20000);
    });

    it('should decrease asset account balance on credit', () => {
      // Arrange - First debit asset account
      assetAccount.debit(Money.create(10000, 'BDT'));
      assetAccount.clearEvents();

      const creditAmount = Money.create(3000, 'BDT');

      // Act
      assetAccount.credit(creditAmount);

      // Assert
      expect(assetAccount.getBalance().getAmount()).toBe(7000);
    });

    it('should throw error for currency mismatch on credit', () => {
      // Arrange
      const amount = Money.create(1000, 'EUR'); // Wrong currency

      // Act & Assert
      expect(() => {
        revenueAccount.credit(amount);
      }).toThrow(CurrencyMismatchException);
    });

    it('should throw error for insufficient balance on asset credit', () => {
      // Arrange - Asset account with 1000 balance
      assetAccount.debit(Money.create(1000, 'BDT'));
      assetAccount.clearEvents();

      const excessiveCredit = Money.create(2000, 'BDT');

      // Act & Assert
      expect(() => {
        assetAccount.credit(excessiveCredit);
      }).toThrow(InsufficientBalanceException);
    });
  });

  describe('Account Deactivation', () => {
    let account: ChartOfAccount;

    beforeEach(() => {
      account = ChartOfAccount.create({
        accountCode: '1000',
        accountName: 'Cash',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      });
      account.clearEvents();
    });

    it('should deactivate account with zero balance', () => {
      // Arrange
      const reason = 'Account no longer needed';

      // Act
      account.deactivate(reason);

      // Assert
      expect(account.isAccountActive()).toBe(false);

      // Verify event
      const events = account.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AccountDeactivatedEvent);

      const deactivatedEvent = events[0] as AccountDeactivatedEvent;
      expect(deactivatedEvent.reason).toBe('Account no longer needed');
    });

    it('should throw error when deactivating account with non-zero balance', () => {
      // Arrange
      account.debit(Money.create(1000, 'BDT'));
      account.clearEvents();

      // Act & Assert
      expect(() => {
        account.deactivate('Has balance');
      }).toThrow('Cannot deactivate account with non-zero balance');
    });

    it('should throw error when deactivating already deactivated account', () => {
      // Arrange
      account.deactivate('First deactivation');
      account.clearEvents();

      // Act & Assert
      expect(() => {
        account.deactivate('Second deactivation');
      }).toThrow('Account is already deactivated');
    });

    it('should include deactivation timestamp in event', () => {
      // Arrange
      const reason = 'Test deactivation';
      const beforeDeactivation = new Date();

      // Act
      account.deactivate(reason);

      // Assert
      const events = account.getUncommittedEvents();
      const deactivatedEvent = events[0] as AccountDeactivatedEvent;
      const afterDeactivation = new Date();

      expect(deactivatedEvent.deactivatedAt).toBeDefined();
      expect(deactivatedEvent.deactivatedAt.getTime()).toBeGreaterThanOrEqual(beforeDeactivation.getTime());
      expect(deactivatedEvent.deactivatedAt.getTime()).toBeLessThanOrEqual(afterDeactivation.getTime());
    });
  });

  describe('Currency Support', () => {
    it('should support BDT currency', () => {
      // Arrange
      const command: CreateAccountCommand = {
        accountCode: '1000',
        accountName: 'Cash BDT',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      };

      // Act
      const account = ChartOfAccount.create(command);

      // Assert
      expect(account.getCurrency()).toBe(Currency.BDT);
    });

    it('should support USD currency', () => {
      // Arrange
      const command: CreateAccountCommand = {
        accountCode: '1100',
        accountName: 'Cash USD',
        accountType: AccountType.ASSET,
        currency: Currency.USD,
        tenantId: new TenantId('tenant-789'),
      };

      // Act
      const account = ChartOfAccount.create(command);

      // Assert
      expect(account.getCurrency()).toBe(Currency.USD);
    });

    it('should support EUR currency', () => {
      // Arrange
      const command: CreateAccountCommand = {
        accountCode: '1200',
        accountName: 'Cash EUR',
        accountType: AccountType.ASSET,
        currency: Currency.EUR,
        tenantId: new TenantId('tenant-789'),
      };

      // Act
      const account = ChartOfAccount.create(command);

      // Assert
      expect(account.getCurrency()).toBe(Currency.EUR);
    });

    it('should enforce same currency for all transactions', () => {
      // Arrange
      const account = ChartOfAccount.create({
        accountCode: '1000',
        accountName: 'Cash BDT',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      });

      // Act & Assert - Try to debit with different currency
      expect(() => {
        account.debit(Money.create(1000, 'USD'));
      }).toThrow(CurrencyMismatchException);

      // Act & Assert - Try to credit with different currency
      expect(() => {
        account.credit(Money.create(1000, 'EUR'));
      }).toThrow(CurrencyMismatchException);
    });
  });

  describe('Event Sourcing', () => {
    it('should track uncommitted events', () => {
      // Arrange
      const command: CreateAccountCommand = {
        accountCode: '1000',
        accountName: 'Cash',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      };

      // Act
      const account = ChartOfAccount.create(command);

      // Assert
      const events = account.getUncommittedEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toBeInstanceOf(AccountCreatedEvent);
    });

    it('should clear events after marking as committed', () => {
      // Arrange
      const command: CreateAccountCommand = {
        accountCode: '1000',
        accountName: 'Cash',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      };
      const account = ChartOfAccount.create(command);

      // Act
      account.markEventsAsCommitted();

      // Assert
      expect(account.getUncommittedEvents()).toHaveLength(0);
    });

    it('should reconstruct from history', () => {
      // Arrange
      const accountId = AccountId.generate();
      const events = [
        new AccountCreatedEvent(
          accountId,
          '1000',
          'Cash',
          AccountType.ASSET,
          undefined,
          Currency.BDT,
          'tenant-789'
        ),
      ];

      // Act
      const account = new ChartOfAccount();
      account.loadFromHistory(events);

      // Assert
      expect(account.getId().value).toBe(accountId.value);
      expect(account.getAccountCode()).toBe('1000');
      expect(account.getAccountName()).toBe('Cash');
      expect(account.getAccountType()).toBe(AccountType.ASSET);
      expect(account.getCurrency()).toBe(Currency.BDT);
      expect(account.version).toBe(1);
    });

    it('should increment version for each event', () => {
      // Arrange
      const command: CreateAccountCommand = {
        accountCode: '1000',
        accountName: 'Cash',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      };
      const account = ChartOfAccount.create(command);
      const initialVersion = account.version;
      account.clearEvents();

      // Act
      account.debit(Money.create(100, 'BDT'));

      // Assert
      expect(account.version).toBeGreaterThan(initialVersion);
    });
  });

  describe('Multi-Tenancy', () => {
    it('should include tenant ID in all events', () => {
      // Arrange
      const tenantId = 'tenant-special-456';
      const command: CreateAccountCommand = {
        accountCode: '1000',
        accountName: 'Cash',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId(tenantId),
      };

      // Act
      const account = ChartOfAccount.create(command);
      account.debit(Money.create(1000, 'BDT'));
      account.deactivate('Test');

      // Assert
      const events = account.getUncommittedEvents();
      events.forEach(event => {
        expect(event.tenantId).toBe(tenantId);
      });
    });

    it('should store tenant context in aggregate', () => {
      // Arrange
      const tenantId = 'tenant-context-789';
      const command: CreateAccountCommand = {
        accountCode: '1000',
        accountName: 'Cash',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId(tenantId),
      };

      // Act
      const account = ChartOfAccount.create(command);

      // Assert
      expect(account.getTenantId().value).toBe(tenantId);
    });
  });

  describe('Bangladesh Chart of Accounts Standards', () => {
    it('should support Bangladesh standard account codes', () => {
      const bangladeshAccounts = [
        { code: '1000', type: AccountType.ASSET, name: 'Current Assets' },
        { code: '2000', type: AccountType.LIABILITY, name: 'Current Liabilities' },
        { code: '3000', type: AccountType.EQUITY, name: 'Capital' },
        { code: '4000', type: AccountType.REVENUE, name: 'Sales Revenue' },
        { code: '5000', type: AccountType.EXPENSE, name: 'Operating Expenses' },
      ];

      bangladeshAccounts.forEach(({ code, type, name }) => {
        const command: CreateAccountCommand = {
          accountCode: code,
          accountName: name,
          accountType: type,
          currency: Currency.BDT,
          tenantId: new TenantId('tenant-789'),
        };

        expect(() => ChartOfAccount.create(command)).not.toThrow();
      });
    });

    it('should support hierarchical accounts for Bangladesh standard', () => {
      // Arrange
      const command: CreateAccountCommand = {
        accountCode: '1000-01-02',
        accountName: 'Petty Cash - Admin Office',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      };

      // Act & Assert
      expect(() => ChartOfAccount.create(command)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amount transactions', () => {
      // Arrange
      const account = ChartOfAccount.create({
        accountCode: '1000',
        accountName: 'Cash',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      });
      account.clearEvents();

      // Act
      account.debit(Money.zero('BDT'));

      // Assert
      expect(account.getBalance().getAmount()).toBe(0);
    });

    it('should handle very large balances', () => {
      // Arrange
      const account = ChartOfAccount.create({
        accountCode: '1000',
        accountName: 'Cash',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      });
      account.clearEvents();

      // Act
      account.debit(Money.create(1000000000, 'BDT')); // 1 billion

      // Assert
      expect(account.getBalance().getAmount()).toBe(1000000000);
    });

    it('should handle multiple sequential transactions', () => {
      // Arrange
      const account = ChartOfAccount.create({
        accountCode: '1000',
        accountName: 'Cash',
        accountType: AccountType.ASSET,
        currency: Currency.BDT,
        tenantId: new TenantId('tenant-789'),
      });
      account.clearEvents();

      // Act
      account.debit(Money.create(1000, 'BDT'));
      account.debit(Money.create(2000, 'BDT'));
      account.credit(Money.create(500, 'BDT'));
      account.debit(Money.create(300, 'BDT'));

      // Assert
      // 0 + 1000 + 2000 - 500 + 300 = 2800
      expect(account.getBalance().getAmount()).toBe(2800);
    });
  });
});
