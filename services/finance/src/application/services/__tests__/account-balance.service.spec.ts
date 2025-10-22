import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { AccountBalanceService } from '../account-balance.service';
import { ChartOfAccountReadModel } from '../../../infrastructure/persistence/typeorm/entities/chart-of-account.entity';
import { FinanceCacheService } from '../../../infrastructure/cache/cache.service';
import { AccountType } from '../../../domain/aggregates/chart-of-account/chart-of-account.aggregate';
import { AccountBalanceDto } from '../../dtos/account-balance.dto';
import { Money } from '../../../domain/value-objects/money.value-object';

describe('AccountBalanceService', () => {
  let service: AccountBalanceService;
  let accountRepository: jest.Mocked<Repository<ChartOfAccountReadModel>>;
  let cacheService: jest.Mocked<FinanceCacheService>;

  // Test data
  const tenantId = 'tenant-123';
  const accountId = 'account-456';
  const accountCode = '1010';

  const mockAssetAccount: ChartOfAccountReadModel = {
    id: accountId,
    accountCode,
    accountName: 'Cash on Hand',
    accountType: AccountType.ASSET,
    balance: 5000,
    currency: 'BDT',
    isActive: true,
    tenantId,
    parentAccountId: null,
    level: 1,
    hasChildren: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-10-20'),
  } as ChartOfAccountReadModel;

  const mockLiabilityAccount: ChartOfAccountReadModel = {
    id: 'account-789',
    accountCode: '2010',
    accountName: 'Accounts Payable',
    accountType: AccountType.LIABILITY,
    balance: 3000,
    currency: 'BDT',
    isActive: true,
    tenantId,
    parentAccountId: null,
    level: 1,
    hasChildren: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-10-20'),
  } as ChartOfAccountReadModel;

  const mockExpenseAccount: ChartOfAccountReadModel = {
    id: 'account-999',
    accountCode: '5010',
    accountName: 'Office Supplies',
    accountType: AccountType.EXPENSE,
    balance: 1500,
    currency: 'BDT',
    isActive: true,
    tenantId,
    parentAccountId: null,
    level: 1,
    hasChildren: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-10-20'),
  } as ChartOfAccountReadModel;

  const mockRevenueAccount: ChartOfAccountReadModel = {
    id: 'account-888',
    accountCode: '4010',
    accountName: 'Sales Revenue',
    accountType: AccountType.REVENUE,
    balance: 10000,
    currency: 'BDT',
    isActive: true,
    tenantId,
    parentAccountId: null,
    level: 1,
    hasChildren: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-10-20'),
  } as ChartOfAccountReadModel;

  const mockEquityAccount: ChartOfAccountReadModel = {
    id: 'account-777',
    accountCode: '3010',
    accountName: 'Owner Equity',
    accountType: AccountType.EQUITY,
    balance: 20000,
    currency: 'BDT',
    isActive: true,
    tenantId,
    parentAccountId: null,
    level: 1,
    hasChildren: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-10-20'),
  } as ChartOfAccountReadModel;

  const mockNegativeBalanceAsset: ChartOfAccountReadModel = {
    id: 'account-negative',
    accountCode: '1020',
    accountName: 'Overdrawn Cash',
    accountType: AccountType.ASSET,
    balance: -500, // Negative balance for debit normal account
    currency: 'BDT',
    isActive: true,
    tenantId,
    parentAccountId: null,
    level: 1,
    hasChildren: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-10-20'),
  } as ChartOfAccountReadModel;

  beforeEach(async () => {
    // Create mock repository
    const mockRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    // Create mock cache service
    const mockCache = {
      getAccountBalance: jest.fn(),
      setAccountBalance: jest.fn(),
      getAccountByCode: jest.fn(),
      setAccountByCode: jest.fn(),
      getAccountsList: jest.fn(),
      setAccountsList: jest.fn(),
      getChartOfAccounts: jest.fn(),
      setChartOfAccounts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountBalanceService,
        {
          provide: getRepositoryToken(ChartOfAccountReadModel),
          useValue: mockRepo,
        },
        {
          provide: FinanceCacheService,
          useValue: mockCache,
        },
      ],
    }).compile();

    service = module.get<AccountBalanceService>(AccountBalanceService);
    accountRepository = module.get(getRepositoryToken(ChartOfAccountReadModel));
    cacheService = module.get(FinanceCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAccountBalance', () => {
    it('should return cached balance if available (cache HIT)', async () => {
      // Arrange
      const cachedDto = new AccountBalanceDto({
        accountId,
        accountCode,
        accountName: 'Cash on Hand',
        accountType: AccountType.ASSET,
        balance: 5000,
        currency: 'BDT',
        debitBalance: 5000,
        creditBalance: 0,
        netBalance: 5000,
        isActive: true,
      });

      cacheService.getAccountBalance.mockResolvedValue(cachedDto);

      // Act
      const result = await service.getAccountBalance(tenantId, accountId);

      // Assert
      expect(result).toBe(cachedDto);
      expect(cacheService.getAccountBalance).toHaveBeenCalledWith(tenantId, accountId);
      expect(accountRepository.findOne).not.toHaveBeenCalled(); // Should not hit DB
      expect(cacheService.setAccountBalance).not.toHaveBeenCalled();
    });

    it('should query database and cache result on cache MISS', async () => {
      // Arrange
      cacheService.getAccountBalance.mockResolvedValue(null); // Cache MISS
      accountRepository.findOne.mockResolvedValue(mockAssetAccount);
      cacheService.setAccountBalance.mockResolvedValue(undefined);

      // Act
      const result = await service.getAccountBalance(tenantId, accountId);

      // Assert
      expect(cacheService.getAccountBalance).toHaveBeenCalledWith(tenantId, accountId);
      expect(accountRepository.findOne).toHaveBeenCalledWith({
        where: { id: accountId, tenantId },
      });
      expect(result).toBeInstanceOf(AccountBalanceDto);
      expect(result.accountId).toBe(accountId);
      expect(result.accountCode).toBe(accountCode);
      expect(result.balance).toBe(5000);
      expect(result.debitBalance).toBe(5000); // Asset with positive balance = debit
      expect(result.creditBalance).toBe(0);
      expect(cacheService.setAccountBalance).toHaveBeenCalledWith(
        tenantId,
        accountId,
        expect.any(AccountBalanceDto),
      );
    });

    it('should throw NotFoundException when account not found', async () => {
      // Arrange
      cacheService.getAccountBalance.mockResolvedValue(null);
      accountRepository.findOne.mockResolvedValue(null); // Account not found

      // Act & Assert
      await expect(service.getAccountBalance(tenantId, accountId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getAccountBalance(tenantId, accountId)).rejects.toThrow(
        `Account ${accountId} not found for tenant ${tenantId}`,
      );
      expect(cacheService.setAccountBalance).not.toHaveBeenCalled();
    });

    it('should correctly map ASSET account with positive balance to debit', async () => {
      // Arrange
      cacheService.getAccountBalance.mockResolvedValue(null);
      accountRepository.findOne.mockResolvedValue(mockAssetAccount);

      // Act
      const result = await service.getAccountBalance(tenantId, accountId);

      // Assert
      expect(result.accountType).toBe(AccountType.ASSET);
      expect(result.balance).toBe(5000);
      expect(result.debitBalance).toBe(5000); // Positive asset balance → debit column
      expect(result.creditBalance).toBe(0);
      expect(result.netBalance).toBe(5000);
    });

    it('should correctly map ASSET account with negative balance to credit', async () => {
      // Arrange
      cacheService.getAccountBalance.mockResolvedValue(null);
      accountRepository.findOne.mockResolvedValue(mockNegativeBalanceAsset);

      // Act
      const result = await service.getAccountBalance(tenantId, 'account-negative');

      // Assert
      expect(result.accountType).toBe(AccountType.ASSET);
      expect(result.balance).toBe(-500);
      expect(result.debitBalance).toBe(0);
      expect(result.creditBalance).toBe(500); // Negative asset balance → credit column
      expect(result.netBalance).toBe(-500);
    });

    it('should correctly map LIABILITY account with positive balance to credit', async () => {
      // Arrange
      cacheService.getAccountBalance.mockResolvedValue(null);
      accountRepository.findOne.mockResolvedValue(mockLiabilityAccount);

      // Act
      const result = await service.getAccountBalance(tenantId, mockLiabilityAccount.id);

      // Assert
      expect(result.accountType).toBe(AccountType.LIABILITY);
      expect(result.balance).toBe(3000);
      expect(result.debitBalance).toBe(0);
      expect(result.creditBalance).toBe(3000); // Positive liability balance → credit column
      expect(result.netBalance).toBe(3000);
    });
  });

  describe('getAccountBalanceByCode', () => {
    it('should return cached balance if available (cache HIT)', async () => {
      // Arrange
      const cachedDto = new AccountBalanceDto({
        accountId,
        accountCode,
        accountName: 'Cash on Hand',
        accountType: AccountType.ASSET,
        balance: 5000,
        currency: 'BDT',
        debitBalance: 5000,
        creditBalance: 0,
        netBalance: 5000,
        isActive: true,
      });

      cacheService.getAccountByCode.mockResolvedValue(cachedDto);

      // Act
      const result = await service.getAccountBalanceByCode(tenantId, accountCode);

      // Assert
      expect(result).toBe(cachedDto);
      expect(cacheService.getAccountByCode).toHaveBeenCalledWith(tenantId, accountCode);
      expect(accountRepository.findOne).not.toHaveBeenCalled();
    });

    it('should query database and cache result on cache MISS', async () => {
      // Arrange
      cacheService.getAccountByCode.mockResolvedValue(null);
      accountRepository.findOne.mockResolvedValue(mockAssetAccount);
      cacheService.setAccountByCode.mockResolvedValue(undefined);

      // Act
      const result = await service.getAccountBalanceByCode(tenantId, accountCode);

      // Assert
      expect(accountRepository.findOne).toHaveBeenCalledWith({
        where: { accountCode, tenantId },
      });
      expect(result.accountCode).toBe(accountCode);
      expect(cacheService.setAccountByCode).toHaveBeenCalledWith(
        tenantId,
        accountCode,
        expect.any(AccountBalanceDto),
      );
    });

    it('should throw NotFoundException when account code not found', async () => {
      // Arrange
      cacheService.getAccountByCode.mockResolvedValue(null);
      accountRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getAccountBalanceByCode(tenantId, 'INVALID'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getAccountBalanceByCode(tenantId, 'INVALID'),
      ).rejects.toThrow(
        `Account with code INVALID not found for tenant ${tenantId}`,
      );
    });
  });

  describe('getAccountsBalanceByType', () => {
    const mockAssetAccounts = [
      mockAssetAccount,
      mockNegativeBalanceAsset,
    ];

    it('should return cached accounts if available (cache HIT)', async () => {
      // Arrange
      const cachedDtos = mockAssetAccounts.map(acc => new AccountBalanceDto({
        accountId: acc.id,
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        accountType: acc.accountType,
        balance: acc.balance,
        currency: acc.currency,
        debitBalance: acc.balance >= 0 ? acc.balance : 0,
        creditBalance: acc.balance < 0 ? Math.abs(acc.balance) : 0,
        netBalance: acc.balance,
        isActive: acc.isActive,
      }));

      cacheService.getAccountsList.mockResolvedValue(cachedDtos);

      // Act
      const result = await service.getAccountsBalanceByType(
        tenantId,
        AccountType.ASSET,
        true,
      );

      // Assert
      expect(result).toBe(cachedDtos);
      expect(cacheService.getAccountsList).toHaveBeenCalledWith(
        tenantId,
        'ASSET:true',
      );
      expect(accountRepository.find).not.toHaveBeenCalled();
    });

    it('should query database and cache result on cache MISS', async () => {
      // Arrange
      cacheService.getAccountsList.mockResolvedValue(null);
      accountRepository.find.mockResolvedValue(mockAssetAccounts);
      cacheService.setAccountsList.mockResolvedValue(undefined);

      // Act
      const result = await service.getAccountsBalanceByType(
        tenantId,
        AccountType.ASSET,
        true,
      );

      // Assert
      expect(accountRepository.find).toHaveBeenCalledWith({
        where: { accountType: AccountType.ASSET, tenantId, isActive: true },
        order: { accountCode: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].accountType).toBe(AccountType.ASSET);
      expect(cacheService.setAccountsList).toHaveBeenCalledWith(
        tenantId,
        expect.any(Array),
        'ASSET:true',
      );
    });

    it('should query all accounts when activeOnly is false', async () => {
      // Arrange
      cacheService.getAccountsList.mockResolvedValue(null);
      accountRepository.find.mockResolvedValue(mockAssetAccounts);

      // Act
      await service.getAccountsBalanceByType(tenantId, AccountType.ASSET, false);

      // Assert
      expect(accountRepository.find).toHaveBeenCalledWith({
        where: { accountType: AccountType.ASSET, tenantId },
        order: { accountCode: 'ASC' },
      });
      expect(cacheService.getAccountsList).toHaveBeenCalledWith(
        tenantId,
        'ASSET:false',
      );
    });

    it('should return empty array when no accounts found', async () => {
      // Arrange
      cacheService.getAccountsList.mockResolvedValue(null);
      accountRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.getAccountsBalanceByType(
        tenantId,
        AccountType.ASSET,
        true,
      );

      // Assert
      expect(result).toEqual([]);
      expect(cacheService.setAccountsList).toHaveBeenCalled();
    });

    it('should correctly map all account types', async () => {
      // Arrange
      cacheService.getAccountsList.mockResolvedValue(null);
      const allTypeAccounts = [
        mockAssetAccount,
        mockLiabilityAccount,
        mockEquityAccount,
        mockRevenueAccount,
        mockExpenseAccount,
      ];
      accountRepository.find.mockResolvedValue(allTypeAccounts);

      // Act
      const result = await service.getAccountsBalanceByType(
        tenantId,
        AccountType.ASSET,
        true,
      );

      // Assert - verify each account type mapped correctly
      const assetDto = result.find(r => r.accountType === AccountType.ASSET);
      expect(assetDto?.debitBalance).toBeGreaterThan(0); // Asset with positive balance

      const liabilityDto = result.find(r => r.accountType === AccountType.LIABILITY);
      if (liabilityDto) {
        expect(liabilityDto.creditBalance).toBeGreaterThan(0); // Liability with positive balance
      }
    });
  });

  describe('getTotalBalanceByType', () => {
    it('should sum all account balances for the given type', async () => {
      // Arrange
      const mockAssetAccounts = [
        mockAssetAccount, // balance: 5000
        mockNegativeBalanceAsset, // balance: -500
      ];

      cacheService.getAccountsList.mockResolvedValue(null);
      accountRepository.find.mockResolvedValue(mockAssetAccounts);

      // Act
      const result = await service.getTotalBalanceByType(tenantId, AccountType.ASSET);

      // Assert
      expect(result).toBeInstanceOf(Money);
      expect(result.getAmount()).toBe(4500); // 5000 + (-500)
      expect(result.getCurrency()).toBe('BDT');
    });

    it('should return zero Money when no accounts exist', async () => {
      // Arrange
      cacheService.getAccountsList.mockResolvedValue(null);
      accountRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.getTotalBalanceByType(tenantId, AccountType.EXPENSE);

      // Assert
      expect(result.getAmount()).toBe(0);
      expect(result.getCurrency()).toBe('BDT');
    });

    it('should leverage caching from getAccountsBalanceByType', async () => {
      // Arrange - set up cache HIT
      const cachedDtos = [
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
        new AccountBalanceDto({
          accountId: 'acc2',
          accountCode: '1020',
          accountName: 'Bank',
          accountType: AccountType.ASSET,
          balance: 2000,
          currency: 'BDT',
          debitBalance: 2000,
          creditBalance: 0,
          netBalance: 2000,
          isActive: true,
        }),
      ];

      cacheService.getAccountsList.mockResolvedValue(cachedDtos);

      // Act
      const result = await service.getTotalBalanceByType(tenantId, AccountType.ASSET);

      // Assert
      expect(result.getAmount()).toBe(3000); // 1000 + 2000
      expect(accountRepository.find).not.toHaveBeenCalled(); // Should use cache
    });
  });

  describe('getAllActiveAccountBalances', () => {
    const allAccounts = [
      mockAssetAccount,
      mockLiabilityAccount,
      mockEquityAccount,
      mockRevenueAccount,
      mockExpenseAccount,
    ];

    it('should return cached accounts if available (cache HIT)', async () => {
      // Arrange
      const cachedDtos = allAccounts.map(acc => new AccountBalanceDto({
        accountId: acc.id,
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        accountType: acc.accountType,
        balance: acc.balance,
        currency: acc.currency,
        debitBalance: 0,
        creditBalance: 0,
        netBalance: acc.balance,
        isActive: acc.isActive,
      }));

      cacheService.getChartOfAccounts.mockResolvedValue(cachedDtos);

      // Act
      const result = await service.getAllActiveAccountBalances(tenantId);

      // Assert
      expect(result).toBe(cachedDtos);
      expect(cacheService.getChartOfAccounts).toHaveBeenCalledWith(tenantId);
      expect(accountRepository.find).not.toHaveBeenCalled();
    });

    it('should query database and cache result on cache MISS', async () => {
      // Arrange
      cacheService.getChartOfAccounts.mockResolvedValue(null);
      accountRepository.find.mockResolvedValue(allAccounts);
      cacheService.setChartOfAccounts.mockResolvedValue(undefined);

      // Act
      const result = await service.getAllActiveAccountBalances(tenantId);

      // Assert
      expect(accountRepository.find).toHaveBeenCalledWith({
        where: { tenantId, isActive: true },
        order: { accountCode: 'ASC' },
      });
      expect(result).toHaveLength(5);
      expect(cacheService.setChartOfAccounts).toHaveBeenCalledWith(
        tenantId,
        expect.any(Array),
      );
    });

    it('should return accounts sorted by account code', async () => {
      // Arrange
      cacheService.getChartOfAccounts.mockResolvedValue(null);
      accountRepository.find.mockResolvedValue(allAccounts);

      // Act
      const result = await service.getAllActiveAccountBalances(tenantId);

      // Assert
      expect(accountRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { accountCode: 'ASC' },
        }),
      );
    });

    it('should include all account types in result', async () => {
      // Arrange
      cacheService.getChartOfAccounts.mockResolvedValue(null);
      accountRepository.find.mockResolvedValue(allAccounts);

      // Act
      const result = await service.getAllActiveAccountBalances(tenantId);

      // Assert
      const accountTypes = result.map(r => r.accountType);
      expect(accountTypes).toContain(AccountType.ASSET);
      expect(accountTypes).toContain(AccountType.LIABILITY);
      expect(accountTypes).toContain(AccountType.EQUITY);
      expect(accountTypes).toContain(AccountType.REVENUE);
      expect(accountTypes).toContain(AccountType.EXPENSE);
    });
  });

  describe('mapToBalanceDto (via getAccountBalance)', () => {
    it('should correctly map EXPENSE account with positive balance to debit', async () => {
      // Arrange
      cacheService.getAccountBalance.mockResolvedValue(null);
      accountRepository.findOne.mockResolvedValue(mockExpenseAccount);

      // Act
      const result = await service.getAccountBalance(tenantId, mockExpenseAccount.id);

      // Assert
      expect(result.accountType).toBe(AccountType.EXPENSE);
      expect(result.balance).toBe(1500);
      expect(result.debitBalance).toBe(1500); // Expense with positive balance → debit
      expect(result.creditBalance).toBe(0);
    });

    it('should correctly map REVENUE account with positive balance to credit', async () => {
      // Arrange
      cacheService.getAccountBalance.mockResolvedValue(null);
      accountRepository.findOne.mockResolvedValue(mockRevenueAccount);

      // Act
      const result = await service.getAccountBalance(tenantId, mockRevenueAccount.id);

      // Assert
      expect(result.accountType).toBe(AccountType.REVENUE);
      expect(result.balance).toBe(10000);
      expect(result.debitBalance).toBe(0);
      expect(result.creditBalance).toBe(10000); // Revenue with positive balance → credit
    });

    it('should correctly map EQUITY account with positive balance to credit', async () => {
      // Arrange
      cacheService.getAccountBalance.mockResolvedValue(null);
      accountRepository.findOne.mockResolvedValue(mockEquityAccount);

      // Act
      const result = await service.getAccountBalance(tenantId, mockEquityAccount.id);

      // Assert
      expect(result.accountType).toBe(AccountType.EQUITY);
      expect(result.balance).toBe(20000);
      expect(result.debitBalance).toBe(0);
      expect(result.creditBalance).toBe(20000); // Equity with positive balance → credit
    });

    it('should handle zero balance correctly', async () => {
      // Arrange
      const zeroBalanceAccount = {
        ...mockAssetAccount,
        balance: 0,
      };
      cacheService.getAccountBalance.mockResolvedValue(null);
      accountRepository.findOne.mockResolvedValue(zeroBalanceAccount);

      // Act
      const result = await service.getAccountBalance(tenantId, accountId);

      // Assert
      expect(result.balance).toBe(0);
      expect(result.debitBalance).toBe(0);
      expect(result.creditBalance).toBe(0);
      expect(result.netBalance).toBe(0);
    });

    it('should handle undefined balance as zero', async () => {
      // Arrange
      const undefinedBalanceAccount = {
        ...mockAssetAccount,
        balance: undefined as any,
      };
      cacheService.getAccountBalance.mockResolvedValue(null);
      accountRepository.findOne.mockResolvedValue(undefinedBalanceAccount);

      // Act
      const result = await service.getAccountBalance(tenantId, accountId);

      // Assert
      expect(result.balance).toBe(0);
      expect(result.debitBalance).toBe(0);
      expect(result.creditBalance).toBe(0);
    });

    it('should include parentAccountId when present', async () => {
      // Arrange
      const childAccount = {
        ...mockAssetAccount,
        parentAccountId: 'parent-account-123',
      };
      cacheService.getAccountBalance.mockResolvedValue(null);
      accountRepository.findOne.mockResolvedValue(childAccount);

      // Act
      const result = await service.getAccountBalance(tenantId, accountId);

      // Assert
      expect(result.parentAccountId).toBe('parent-account-123');
    });

    it('should set parentAccountId to undefined when null', async () => {
      // Arrange
      cacheService.getAccountBalance.mockResolvedValue(null);
      accountRepository.findOne.mockResolvedValue(mockAssetAccount);

      // Act
      const result = await service.getAccountBalance(tenantId, accountId);

      // Assert
      expect(result.parentAccountId).toBeUndefined();
    });
  });

  describe('Multi-tenant isolation', () => {
    it('should query with tenantId in all methods', async () => {
      // Arrange
      cacheService.getAccountBalance.mockResolvedValue(null);
      accountRepository.findOne.mockResolvedValue(mockAssetAccount);

      // Act
      await service.getAccountBalance(tenantId, accountId);

      // Assert
      expect(accountRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId }),
        }),
      );
    });

    it('should not return account from different tenant', async () => {
      // Arrange
      const differentTenantId = 'different-tenant-999';
      cacheService.getAccountBalance.mockResolvedValue(null);
      accountRepository.findOne.mockResolvedValue(null); // Simulates tenant isolation

      // Act & Assert
      await expect(
        service.getAccountBalance(differentTenantId, accountId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Caching behavior', () => {
    it('should use different cache keys for different methods', async () => {
      // Test getAccountBalance cache key
      cacheService.getAccountBalance.mockResolvedValue(null);
      accountRepository.findOne.mockResolvedValue(mockAssetAccount);
      await service.getAccountBalance(tenantId, accountId);
      expect(cacheService.getAccountBalance).toHaveBeenCalledWith(tenantId, accountId);

      // Test getAccountBalanceByCode cache key
      jest.clearAllMocks();
      cacheService.getAccountByCode.mockResolvedValue(null);
      accountRepository.findOne.mockResolvedValue(mockAssetAccount);
      await service.getAccountBalanceByCode(tenantId, accountCode);
      expect(cacheService.getAccountByCode).toHaveBeenCalledWith(tenantId, accountCode);

      // Test getAccountsBalanceByType cache key
      jest.clearAllMocks();
      cacheService.getAccountsList.mockResolvedValue(null);
      accountRepository.find.mockResolvedValue([mockAssetAccount]);
      await service.getAccountsBalanceByType(tenantId, AccountType.ASSET, true);
      expect(cacheService.getAccountsList).toHaveBeenCalledWith(tenantId, 'ASSET:true');
    });

    it('should cache with activeOnly flag in cache key', async () => {
      // Arrange
      cacheService.getAccountsList.mockResolvedValue(null);
      accountRepository.find.mockResolvedValue([mockAssetAccount]);

      // Act - activeOnly = true
      await service.getAccountsBalanceByType(tenantId, AccountType.ASSET, true);
      expect(cacheService.getAccountsList).toHaveBeenCalledWith(tenantId, 'ASSET:true');

      jest.clearAllMocks();

      // Act - activeOnly = false
      await service.getAccountsBalanceByType(tenantId, AccountType.ASSET, false);
      expect(cacheService.getAccountsList).toHaveBeenCalledWith(tenantId, 'ASSET:false');
    });
  });
});
