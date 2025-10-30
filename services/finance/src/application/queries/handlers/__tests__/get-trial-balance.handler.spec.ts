import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { GetTrialBalanceHandler } from '../get-trial-balance.handler';
import { GetTrialBalanceQuery } from '../../get-trial-balance.query';
import { AccountBalanceService } from '../../../services/account-balance.service';
import { FinanceCacheService } from '../../../../infrastructure/cache/cache.service';
import { AccountBalanceDto } from '../../../dtos/account-balance.dto';
import { TrialBalanceDto } from '../../../dtos/trial-balance.dto';
import { AccountType } from '../../../../domain/aggregates/chart-of-account/chart-of-account.aggregate';

describe('GetTrialBalanceHandler', () => {
  let handler: GetTrialBalanceHandler;
  let accountBalanceService: jest.Mocked<AccountBalanceService>;
  let cacheService: jest.Mocked<FinanceCacheService>;

  // Test data
  const tenantId = 'tenant-123';
  const fiscalYear = 'FY2024-2025';
  const asOfDate = new Date('2024-10-20');

  // Mock account balances for a balanced trial balance
  const mockBalancedAccounts: AccountBalanceDto[] = [
    // Assets (debit normal) - Total: 15,000 debit
    new AccountBalanceDto({
      accountId: 'acc1',
      accountCode: '1010',
      accountName: 'Cash on Hand',
      accountType: AccountType.ASSET,
      balance: 10000,
      currency: 'BDT',
      debitBalance: 10000,
      creditBalance: 0,
      netBalance: 10000,
      isActive: true,
    }),
    new AccountBalanceDto({
      accountId: 'acc2',
      accountCode: '1020',
      accountName: 'Bank Account',
      accountType: AccountType.ASSET,
      balance: 5000,
      currency: 'BDT',
      debitBalance: 5000,
      creditBalance: 0,
      netBalance: 5000,
      isActive: true,
    }),

    // Liabilities (credit normal) - Total: 8,000 credit
    new AccountBalanceDto({
      accountId: 'acc3',
      accountCode: '2010',
      accountName: 'Accounts Payable',
      accountType: AccountType.LIABILITY,
      balance: 8000,
      currency: 'BDT',
      debitBalance: 0,
      creditBalance: 8000,
      netBalance: 8000,
      isActive: true,
    }),

    // Equity (credit normal) - Total: 12,000 credit
    new AccountBalanceDto({
      accountId: 'acc4',
      accountCode: '3010',
      accountName: 'Owner Equity',
      accountType: AccountType.EQUITY,
      balance: 12000,
      currency: 'BDT',
      debitBalance: 0,
      creditBalance: 12000,
      netBalance: 12000,
      isActive: true,
    }),

    // Revenue (credit normal) - Total: 20,000 credit
    new AccountBalanceDto({
      accountId: 'acc5',
      accountCode: '4010',
      accountName: 'Sales Revenue',
      accountType: AccountType.REVENUE,
      balance: 20000,
      currency: 'BDT',
      debitBalance: 0,
      creditBalance: 20000,
      netBalance: 20000,
      isActive: true,
    }),

    // Expenses (debit normal) - Total: 25,000 debit
    new AccountBalanceDto({
      accountId: 'acc6',
      accountCode: '5010',
      accountName: 'Office Supplies',
      accountType: AccountType.EXPENSE,
      balance: 15000,
      currency: 'BDT',
      debitBalance: 15000,
      creditBalance: 0,
      netBalance: 15000,
      isActive: true,
    }),
    new AccountBalanceDto({
      accountId: 'acc7',
      accountCode: '5020',
      accountName: 'Rent Expense',
      accountType: AccountType.EXPENSE,
      balance: 10000,
      currency: 'BDT',
      debitBalance: 10000,
      creditBalance: 0,
      netBalance: 10000,
      isActive: true,
    }),
  ];

  // Mock unbalanced accounts (debits != credits)
  const mockUnbalancedAccounts: AccountBalanceDto[] = [
    new AccountBalanceDto({
      accountId: 'acc1',
      accountCode: '1010',
      accountName: 'Cash',
      accountType: AccountType.ASSET,
      balance: 10000,
      currency: 'BDT',
      debitBalance: 10000,
      creditBalance: 0,
      netBalance: 10000,
      isActive: true,
    }),
    new AccountBalanceDto({
      accountId: 'acc2',
      accountCode: '2010',
      accountName: 'Accounts Payable',
      accountType: AccountType.LIABILITY,
      balance: 5000, // Unbalanced: 10,000 debit vs 5,000 credit
      currency: 'BDT',
      debitBalance: 0,
      creditBalance: 5000,
      netBalance: 5000,
      isActive: true,
    }),
  ];

  beforeEach(async () => {
    const mockAccountBalanceService = {
      getAllActiveAccountBalances: jest.fn(),
    };

    const mockCacheService = {
      getTrialBalance: jest.fn(),
      setTrialBalance: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTrialBalanceHandler,
        {
          provide: AccountBalanceService,
          useValue: mockAccountBalanceService,
        },
        {
          provide: FinanceCacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    handler = module.get<GetTrialBalanceHandler>(GetTrialBalanceHandler);
    accountBalanceService = module.get(AccountBalanceService);
    cacheService = module.get(FinanceCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute - Cache behavior', () => {
    it('should return cached trial balance if available (cache HIT)', async () => {
      // Arrange
      const cachedTrialBalance = new TrialBalanceDto({
        fiscalYear,
        asOfDate,
        entries: [],
        summary: {
          totalDebits: 10000,
          totalCredits: 10000,
          isBalanced: true,
          variance: 0,
          accountCount: 5,
        },
        groupedByType: {} as any,
        metadata: {
          generatedAt: new Date(),
          tenantId,
          currency: 'BDT',
        },
      });

      cacheService.getTrialBalance.mockResolvedValue(cachedTrialBalance);

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear, asOfDate);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBe(cachedTrialBalance);
      expect(cacheService.getTrialBalance).toHaveBeenCalledWith(tenantId, fiscalYear);
      expect(accountBalanceService.getAllActiveAccountBalances).not.toHaveBeenCalled();
      expect(cacheService.setTrialBalance).not.toHaveBeenCalled();
    });

    it('should generate trial balance on cache MISS', async () => {
      // Arrange
      cacheService.getTrialBalance.mockResolvedValue(null);
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue(
        mockBalancedAccounts,
      );
      cacheService.setTrialBalance.mockResolvedValue(undefined);

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear, asOfDate);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(cacheService.getTrialBalance).toHaveBeenCalledWith(tenantId, fiscalYear);
      expect(accountBalanceService.getAllActiveAccountBalances).toHaveBeenCalledWith(tenantId);
      expect(result).toBeInstanceOf(TrialBalanceDto);
      expect(cacheService.setTrialBalance).toHaveBeenCalledWith(
        tenantId,
        fiscalYear,
        expect.any(TrialBalanceDto),
      );
    });
  });

  describe('execute - Trial balance generation', () => {
    it('should generate balanced trial balance correctly', async () => {
      // Arrange
      cacheService.getTrialBalance.mockResolvedValue(null);
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue(
        mockBalancedAccounts,
      );

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear, asOfDate);

      // Act
      const result = await handler.execute(query);

      // Assert - Trial balance structure
      expect(result).toBeInstanceOf(TrialBalanceDto);
      expect(result.fiscalYear).toBe(fiscalYear);
      expect(result.asOfDate).toEqual(asOfDate);
      expect(result.entries).toHaveLength(7);

      // Assert - Summary totals (debits = credits)
      expect(result.summary.totalDebits).toBe(40000); // 10,000 + 5,000 + 15,000 + 10,000
      expect(result.summary.totalCredits).toBe(40000); // 8,000 + 12,000 + 20,000
      expect(result.summary.isBalanced).toBe(true);
      expect(result.summary.variance).toBeLessThan(0.01);
      expect(result.summary.accountCount).toBe(7);

      // Assert - Metadata
      expect(result.metadata.tenantId).toBe(tenantId);
      expect(result.metadata.currency).toBe('BDT');
      expect(result.metadata.generatedAt).toBeInstanceOf(Date);
    });

    it('should detect unbalanced trial balance', async () => {
      // Arrange
      cacheService.getTrialBalance.mockResolvedValue(null);
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue(
        mockUnbalancedAccounts,
      );

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear, asOfDate);

      // Spy on logger.warn
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.summary.totalDebits).toBe(10000);
      expect(result.summary.totalCredits).toBe(5000);
      expect(result.summary.variance).toBe(5000);
      expect(result.summary.isBalanced).toBe(false);

      // Verify warning logged
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Trial balance is UNBALANCED'),
      );

      warnSpy.mockRestore();
    });

    it('should handle rounding tolerance (variance < 0.01)', async () => {
      // Arrange - Create accounts with tiny variance due to rounding
      const accountsWithRounding: AccountBalanceDto[] = [
        new AccountBalanceDto({
          accountId: 'acc1',
          accountCode: '1010',
          accountName: 'Cash',
          accountType: AccountType.ASSET,
          balance: 100.005, // Will round in calculations
          currency: 'BDT',
          debitBalance: 100.005,
          creditBalance: 0,
          netBalance: 100.005,
          isActive: true,
        }),
        new AccountBalanceDto({
          accountId: 'acc2',
          accountCode: '2010',
          accountName: 'Payable',
          accountType: AccountType.LIABILITY,
          balance: 100.004, // Tiny variance: 0.001
          currency: 'BDT',
          debitBalance: 0,
          creditBalance: 100.004,
          netBalance: 100.004,
          isActive: true,
        }),
      ];

      cacheService.getTrialBalance.mockResolvedValue(null);
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue(
        accountsWithRounding,
      );

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear, asOfDate);

      // Act
      const result = await handler.execute(query);

      // Assert - Should be considered balanced (variance < 0.01)
      expect(result.summary.variance).toBeLessThan(0.01);
      expect(result.summary.isBalanced).toBe(true);
    });

    it('should handle empty account list', async () => {
      // Arrange
      cacheService.getTrialBalance.mockResolvedValue(null);
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue([]);

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear, asOfDate);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.entries).toHaveLength(0);
      expect(result.summary.totalDebits).toBe(0);
      expect(result.summary.totalCredits).toBe(0);
      expect(result.summary.isBalanced).toBe(true); // 0 = 0
      expect(result.summary.variance).toBe(0);
      expect(result.summary.accountCount).toBe(0);
    });

    it('should use current date for asOfDate when not provided', async () => {
      // Arrange
      cacheService.getTrialBalance.mockResolvedValue(null);
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue(
        mockBalancedAccounts,
      );

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear, undefined);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.asOfDate).toBeInstanceOf(Date);
      // Should be within 1 second of now
      expect(Date.now() - result.asOfDate.getTime()).toBeLessThan(1000);
    });
  });

  describe('execute - Trial balance entries', () => {
    it('should map account balances to trial balance entries correctly', async () => {
      // Arrange
      cacheService.getTrialBalance.mockResolvedValue(null);
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue(
        mockBalancedAccounts,
      );

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear, asOfDate);

      // Act
      const result = await handler.execute(query);

      // Assert - Check first entry (Cash on Hand)
      const cashEntry = result.entries.find(e => e.accountCode === '1010');
      expect(cashEntry).toBeDefined();
      expect(cashEntry?.accountName).toBe('Cash on Hand');
      expect(cashEntry?.accountType).toBe(AccountType.ASSET);
      expect(cashEntry?.debitBalance).toBe(10000);
      expect(cashEntry?.creditBalance).toBe(0);
      expect(cashEntry?.netBalance).toBe(10000);

      // Assert - Check liability entry (Accounts Payable)
      const payableEntry = result.entries.find(e => e.accountCode === '2010');
      expect(payableEntry).toBeDefined();
      expect(payableEntry?.accountType).toBe(AccountType.LIABILITY);
      expect(payableEntry?.debitBalance).toBe(0);
      expect(payableEntry?.creditBalance).toBe(8000);
      expect(payableEntry?.netBalance).toBe(8000);
    });

    it('should include all provided accounts in entries', async () => {
      // Arrange
      cacheService.getTrialBalance.mockResolvedValue(null);
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue(
        mockBalancedAccounts,
      );

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear, asOfDate);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.entries).toHaveLength(mockBalancedAccounts.length);

      const accountCodes = result.entries.map(e => e.accountCode);
      expect(accountCodes).toContain('1010');
      expect(accountCodes).toContain('1020');
      expect(accountCodes).toContain('2010');
      expect(accountCodes).toContain('3010');
      expect(accountCodes).toContain('4010');
      expect(accountCodes).toContain('5010');
      expect(accountCodes).toContain('5020');
    });
  });

  describe('execute - Grouped by account type', () => {
    it('should group entries by account type correctly', async () => {
      // Arrange
      cacheService.getTrialBalance.mockResolvedValue(null);
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue(
        mockBalancedAccounts,
      );

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear, asOfDate);

      // Act
      const result = await handler.execute(query);

      // Assert - ASSET group
      const assetGroup = result.groupedByType[AccountType.ASSET];
      expect(assetGroup.accountCount).toBe(2); // Cash + Bank
      expect(assetGroup.totalDebit).toBe(15000); // 10,000 + 5,000
      expect(assetGroup.totalCredit).toBe(0);
      expect(assetGroup.netBalance).toBe(15000);

      // Assert - LIABILITY group
      const liabilityGroup = result.groupedByType[AccountType.LIABILITY];
      expect(liabilityGroup.accountCount).toBe(1);
      expect(liabilityGroup.totalDebit).toBe(0);
      expect(liabilityGroup.totalCredit).toBe(8000);
      expect(liabilityGroup.netBalance).toBe(8000);

      // Assert - EQUITY group
      const equityGroup = result.groupedByType[AccountType.EQUITY];
      expect(equityGroup.accountCount).toBe(1);
      expect(equityGroup.totalDebit).toBe(0);
      expect(equityGroup.totalCredit).toBe(12000);
      expect(equityGroup.netBalance).toBe(12000);

      // Assert - REVENUE group
      const revenueGroup = result.groupedByType[AccountType.REVENUE];
      expect(revenueGroup.accountCount).toBe(1);
      expect(revenueGroup.totalDebit).toBe(0);
      expect(revenueGroup.totalCredit).toBe(20000);
      expect(revenueGroup.netBalance).toBe(20000);

      // Assert - EXPENSE group
      const expenseGroup = result.groupedByType[AccountType.EXPENSE];
      expect(expenseGroup.accountCount).toBe(2); // Office Supplies + Rent
      expect(expenseGroup.totalDebit).toBe(25000); // 15,000 + 10,000
      expect(expenseGroup.totalCredit).toBe(0);
      expect(expenseGroup.netBalance).toBe(25000);
    });

    it('should initialize all account types even if no accounts exist', async () => {
      // Arrange - Only ASSET accounts
      const onlyAssets: AccountBalanceDto[] = [
        new AccountBalanceDto({
          accountId: 'acc1',
          accountCode: '1010',
          accountName: 'Cash',
          accountType: AccountType.ASSET,
          balance: 1000,
          currency: 'BDT',
          debitBalance: 1000,
          creditBalance: 0,
          netBalance: 1000,
          isActive: true,
        }),
      ];

      cacheService.getTrialBalance.mockResolvedValue(null);
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue(onlyAssets);

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear, asOfDate);

      // Act
      const result = await handler.execute(query);

      // Assert - All 5 account types should exist in groupedByType
      expect(result.groupedByType[AccountType.ASSET]).toBeDefined();
      expect(result.groupedByType[AccountType.LIABILITY]).toBeDefined();
      expect(result.groupedByType[AccountType.EQUITY]).toBeDefined();
      expect(result.groupedByType[AccountType.REVENUE]).toBeDefined();
      expect(result.groupedByType[AccountType.EXPENSE]).toBeDefined();

      // Assert - Empty types should have zero values
      expect(result.groupedByType[AccountType.LIABILITY].accountCount).toBe(0);
      expect(result.groupedByType[AccountType.LIABILITY].totalDebit).toBe(0);
      expect(result.groupedByType[AccountType.LIABILITY].totalCredit).toBe(0);
      expect(result.groupedByType[AccountType.LIABILITY].netBalance).toBe(0);
    });

    it('should aggregate multiple accounts of same type correctly', async () => {
      // Arrange
      cacheService.getTrialBalance.mockResolvedValue(null);
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue(
        mockBalancedAccounts,
      );

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear, asOfDate);

      // Act
      const result = await handler.execute(query);

      // Assert - EXPENSE has 2 accounts
      const expenseGroup = result.groupedByType[AccountType.EXPENSE];
      expect(expenseGroup.accountCount).toBe(2);
      expect(expenseGroup.totalDebit).toBe(25000); // 15,000 + 10,000
    });
  });

  describe('execute - Performance and logging', () => {
    it('should log performance metrics', async () => {
      // Arrange
      cacheService.getTrialBalance.mockResolvedValue(null);
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue(
        mockBalancedAccounts,
      );

      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      const debugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear, asOfDate);

      // Act
      await handler.execute(query);

      // Assert
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Generating trial balance for ${fiscalYear}`),
      );
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('Retrieved'),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Trial balance generated in'),
      );

      logSpy.mockRestore();
      debugSpy.mockRestore();
    });

    it('should log balanced status', async () => {
      // Arrange
      cacheService.getTrialBalance.mockResolvedValue(null);
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue(
        mockBalancedAccounts,
      );

      const debugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear, asOfDate);

      // Act
      await handler.execute(query);

      // Assert
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('Trial balance is balanced'),
      );

      debugSpy.mockRestore();
    });
  });

  describe('Multi-tenant isolation', () => {
    it('should include tenantId in metadata', async () => {
      // Arrange
      cacheService.getTrialBalance.mockResolvedValue(null);
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue(
        mockBalancedAccounts,
      );

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear, asOfDate);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.metadata.tenantId).toBe(tenantId);
    });

    it('should query accounts for correct tenant', async () => {
      // Arrange
      cacheService.getTrialBalance.mockResolvedValue(null);
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue(
        mockBalancedAccounts,
      );

      const differentTenantId = 'tenant-999';
      const query = new GetTrialBalanceQuery(differentTenantId, fiscalYear, asOfDate);

      // Act
      await handler.execute(query);

      // Assert
      expect(accountBalanceService.getAllActiveAccountBalances).toHaveBeenCalledWith(
        differentTenantId,
      );
    });
  });
});
