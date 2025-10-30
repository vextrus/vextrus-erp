import { Test, TestingModule } from '@nestjs/testing';
import { GetTrialBalanceHandler } from '../get-trial-balance.handler';
import { GetTrialBalanceQuery } from '../../get-trial-balance.query';
import { AccountBalanceService } from '../../../services/account-balance.service';
import { FinanceCacheService } from '../../../../infrastructure/cache/cache.service';
import { AccountBalanceDto } from '../../../dtos/account-balance.dto';
import { AccountType } from '../../../../domain/aggregates/chart-of-account/chart-of-account.aggregate';

/**
 * Performance Tests for Trial Balance Generation
 *
 * Target: <500ms for 10,000 accounts without cache
 * Target: <50ms with cache HIT
 *
 * These tests verify that trial balance generation meets performance SLAs
 * for production workloads with large account hierarchies.
 */
describe('GetTrialBalanceHandler - Performance Tests', () => {
  let handler: GetTrialBalanceHandler;
  let accountBalanceService: jest.Mocked<AccountBalanceService>;
  let cacheService: jest.Mocked<FinanceCacheService>;

  const tenantId = 'tenant-perf-test';
  const fiscalYear = 'FY2024-2025';

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

  /**
   * Generate mock account balances for performance testing
   * @param count Number of accounts to generate
   */
  function generateMockAccounts(count: number): AccountBalanceDto[] {
    const accounts: AccountBalanceDto[] = [];
    const accountTypes = Object.values(AccountType);

    for (let i = 0; i < count; i++) {
      const accountType = accountTypes[i % accountTypes.length];
      const balance = Math.random() * 100000;
      const isDebitNormal =
        accountType === AccountType.ASSET || accountType === AccountType.EXPENSE;

      accounts.push(
        new AccountBalanceDto({
          accountId: `account-${i}`,
          accountCode: `${1000 + i}`,
          accountName: `Test Account ${i}`,
          accountType,
          balance,
          currency: 'BDT',
          debitBalance: isDebitNormal && balance >= 0 ? balance : 0,
          creditBalance: !isDebitNormal && balance >= 0 ? balance : 0,
          netBalance: balance,
          isActive: true,
        }),
      );
    }

    return accounts;
  }

  describe('Performance Benchmarks', () => {
    it('should generate trial balance for 100 accounts in <100ms (cache MISS)', async () => {
      // Arrange
      const accounts = generateMockAccounts(100);
      cacheService.getTrialBalance.mockResolvedValue(null); // Cache MISS
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue(accounts);

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear);

      // Act
      const startTime = Date.now();
      const result = await handler.execute(query);
      const elapsedTime = Date.now() - startTime;

      // Assert
      expect(result).toBeDefined();
      expect(result.entries).toHaveLength(100);
      expect(elapsedTime).toBeLessThan(100); // <100ms target
      console.log(`✓ 100 accounts: ${elapsedTime}ms`);
    });

    it('should generate trial balance for 1,000 accounts in <200ms (cache MISS)', async () => {
      // Arrange
      const accounts = generateMockAccounts(1000);
      cacheService.getTrialBalance.mockResolvedValue(null);
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue(accounts);

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear);

      // Act
      const startTime = Date.now();
      const result = await handler.execute(query);
      const elapsedTime = Date.now() - startTime;

      // Assert
      expect(result).toBeDefined();
      expect(result.entries).toHaveLength(1000);
      expect(elapsedTime).toBeLessThan(200); // <200ms target
      console.log(`✓ 1,000 accounts: ${elapsedTime}ms`);
    });

    it('should generate trial balance for 10,000 accounts in <500ms (cache MISS)', async () => {
      // Arrange
      const accounts = generateMockAccounts(10000);
      cacheService.getTrialBalance.mockResolvedValue(null);
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue(accounts);

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear);

      // Act
      const startTime = Date.now();
      const result = await handler.execute(query);
      const elapsedTime = Date.now() - startTime;

      // Assert
      expect(result).toBeDefined();
      expect(result.entries).toHaveLength(10000);
      expect(elapsedTime).toBeLessThan(500); // <500ms target (CRITICAL SLA)
      console.log(`✓ 10,000 accounts: ${elapsedTime}ms`);
    });

    it('should return cached trial balance in <50ms (cache HIT)', async () => {
      // Arrange
      const cachedResult = {
        fiscalYear,
        asOfDate: new Date(),
        entries: generateMockAccounts(10000).map(acc => ({
          accountCode: acc.accountCode,
          accountName: acc.accountName,
          accountType: acc.accountType,
          debitBalance: acc.debitBalance,
          creditBalance: acc.creditBalance,
          netBalance: acc.netBalance,
        })),
        summary: {
          totalDebits: 500000,
          totalCredits: 500000,
          isBalanced: true,
          variance: 0,
          accountCount: 10000,
        },
        groupedByType: {} as any,
        metadata: {
          generatedAt: new Date(),
          tenantId,
          currency: 'BDT',
        },
      };

      cacheService.getTrialBalance.mockResolvedValue(cachedResult as any);

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear);

      // Act
      const startTime = Date.now();
      const result = await handler.execute(query);
      const elapsedTime = Date.now() - startTime;

      // Assert
      expect(result).toBe(cachedResult);
      expect(elapsedTime).toBeLessThan(50); // <50ms for cache HIT
      expect(accountBalanceService.getAllActiveAccountBalances).not.toHaveBeenCalled();
      console.log(`✓ Cache HIT (10,000 accounts): ${elapsedTime}ms`);
    });
  });

  describe('Memory Efficiency', () => {
    it('should handle large datasets without excessive memory allocation', async () => {
      // Arrange
      const accounts = generateMockAccounts(10000);
      cacheService.getTrialBalance.mockResolvedValue(null);
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue(accounts);

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear);

      // Act
      const memBefore = process.memoryUsage().heapUsed;
      const result = await handler.execute(query);
      const memAfter = process.memoryUsage().heapUsed;
      const memDelta = (memAfter - memBefore) / 1024 / 1024; // Convert to MB

      // Assert
      expect(result).toBeDefined();
      expect(memDelta).toBeLessThan(50); // <50MB memory increase for 10k accounts
      console.log(`✓ Memory delta for 10,000 accounts: ${memDelta.toFixed(2)}MB`);
    });
  });

  describe('Scalability', () => {
    it('should maintain linear time complexity O(n) for account processing', async () => {
      // Test with different dataset sizes to verify O(n) complexity
      const sizes = [100, 500, 1000, 5000, 10000];
      const timings: number[] = [];

      for (const size of sizes) {
        const accounts = generateMockAccounts(size);
        cacheService.getTrialBalance.mockResolvedValue(null);
        accountBalanceService.getAllActiveAccountBalances.mockResolvedValue(accounts);

        const query = new GetTrialBalanceQuery(tenantId, fiscalYear);

        const startTime = Date.now();
        await handler.execute(query);
        const elapsedTime = Date.now() - startTime;

        timings.push(elapsedTime);
        console.log(`  ${size} accounts: ${elapsedTime}ms`);
      }

      // Verify roughly linear scaling (time per account should be relatively constant)
      // All timings should be very fast (<10ms)
      const maxTiming = Math.max(...timings);
      expect(maxTiming).toBeLessThan(10); // All sizes should complete in <10ms

      // If measurable, verify scaling is reasonable
      if (timings[2] > 0) {
        const ratio = timings[4] / timings[2]; // 10,000 vs 1,000
        expect(ratio).toBeLessThan(15); // Allow some overhead
        console.log(`✓ Scaling ratio (10k/1k): ${ratio.toFixed(2)}x`);
      } else {
        console.log(`✓ Execution too fast to measure scaling (<1ms for all sizes)`);
      }
    });
  });

  describe('Edge Cases - Performance', () => {
    it('should handle empty account list quickly (<10ms)', async () => {
      // Arrange
      cacheService.getTrialBalance.mockResolvedValue(null);
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue([]);

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear);

      // Act
      const startTime = Date.now();
      const result = await handler.execute(query);
      const elapsedTime = Date.now() - startTime;

      // Assert
      expect(result.entries).toHaveLength(0);
      expect(elapsedTime).toBeLessThan(10);
      console.log(`✓ Empty account list: ${elapsedTime}ms`);
    });

    it('should handle single account quickly (<10ms)', async () => {
      // Arrange
      const accounts = generateMockAccounts(1);
      cacheService.getTrialBalance.mockResolvedValue(null);
      accountBalanceService.getAllActiveAccountBalances.mockResolvedValue(accounts);

      const query = new GetTrialBalanceQuery(tenantId, fiscalYear);

      // Act
      const startTime = Date.now();
      const result = await handler.execute(query);
      const elapsedTime = Date.now() - startTime;

      // Assert
      expect(result.entries).toHaveLength(1);
      expect(elapsedTime).toBeLessThan(10);
      console.log(`✓ Single account: ${elapsedTime}ms`);
    });
  });
});
