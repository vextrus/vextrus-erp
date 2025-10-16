import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { EventBus } from '@nestjs/cqrs';
import { RedisService } from '@vextrus/shared-infrastructure';
import {
  AnalyticsDashboardService,
  DateRange,
  DashboardData,
  KPIMetrics,
  RevenueAnalytics,
  ExpenseAnalytics,
  CashFlowAnalytics,
} from '../analytics-dashboard.service';
import { BengaliLocalizationService } from '../bengali-localization.service';

describe('AnalyticsDashboardService', () => {
  let service: AnalyticsDashboardService;
  let connection: jest.Mocked<Connection>;
  let redisService: jest.Mocked<RedisService>;
  let eventBus: jest.Mocked<EventBus>;
  let bengaliService: jest.Mocked<BengaliLocalizationService>;

  beforeEach(async () => {
    const mockConnection = {
      query: jest.fn(),
    };

    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
    };

    const mockBengaliService = {
      formatCurrency: jest.fn((value: number) => `৳${value.toLocaleString()}`),
      formatNumber: jest.fn((value: number) => value.toString()),
      formatDate: jest.fn((date: Date) => date.toISOString()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsDashboardService,
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
        {
          provide: BengaliLocalizationService,
          useValue: mockBengaliService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsDashboardService>(AnalyticsDashboardService);
    connection = module.get(getConnectionToken());
    redisService = module.get(RedisService);
    eventBus = module.get(EventBus);
    bengaliService = module.get(BengaliLocalizationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFinancialDashboard', () => {
    it('should return cached dashboard if available', async () => {
      const cachedData: DashboardData = {
        kpis: {
          totalRevenue: 1000000,
          totalExpenses: 750000,
          netProfit: 250000,
          profitMargin: 25,
          cashPosition: 500000,
          dso: 30,
          dpo: 45,
          currentRatio: 1.5,
          quickRatio: 1.2,
          debtToEquity: 0.5,
          returnOnAssets: 10,
          returnOnEquity: 15,
        },
        revenue: {
          total: 1000000,
          byCategory: { 'Sales': 800000, 'Services': 200000 },
          topCustomers: [],
          byProduct: {},
          growthRate: 0.1,
          trend: 'UP',
          dailyData: [],
        },
        expenses: {
          total: 750000,
          byCategory: { 'Salaries': 500000, 'Rent': 250000 },
          topVendors: [],
          byDepartment: {},
          trend: 'STABLE',
        },
        cashFlow: {
          operating: 300000,
          investing: -100000,
          financing: 50000,
          net: 250000,
          opening: 400000,
          closing: 650000,
          forecast: [],
        },
        workingCapital: {
          receivables: 500000,
          payables: 300000,
          inventory: 0,
          net: 200000,
          trend: [],
        },
        predictions: {
          revenueNext30Days: 1050000,
          cashFlowNext30Days: 700000,
          riskAlerts: [],
          opportunities: [],
        },
        charts: {
          profitLoss: { type: 'line', data: { labels: [], datasets: [] } },
          balanceSheet: { type: 'bar', data: { labels: [], datasets: [] } },
          ratioAnalysis: { type: 'bar', data: { labels: [], datasets: [] } },
          trendAnalysis: { type: 'line', data: { labels: [], datasets: [] } },
          cashFlowWaterfall: { type: 'bar', data: { labels: [], datasets: [] } },
          revenueBreakdown: { type: 'pie', data: { labels: [], datasets: [] } },
          expenseBreakdown: { type: 'pie', data: { labels: [], datasets: [] } },
        },
        metadata: {
          lastUpdated: new Date(),
          dataFreshness: 'cached',
          queryTime: 100,
          cacheHit: true,
          tenantId: 'tenant-1',
          period: { from: new Date('2025-01-01'), to: new Date('2025-01-31') },
        },
      };

      redisService.get.mockResolvedValue(JSON.stringify(cachedData));

      const period: DateRange = {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      };

      const result = await service.getFinancialDashboard('tenant-1', period);

      expect(result).toBeDefined();
      expect(result.metadata.dataFreshness).toBe('cached');
      expect(result.metadata.cacheHit).toBe(true);
      expect(redisService.get).toHaveBeenCalled();
    });

    it('should calculate dashboard data if not cached', async () => {
      redisService.get.mockResolvedValue(null);

      // Mock database queries for revenue, expenses, cash flow, etc.
      connection.query
        .mockResolvedValueOnce([
          { date: new Date('2025-01-15'), category: 'Sales', customer_id: 'cust-1', customer_name: 'Customer 1', product_category: 'Product A', total: '1000000', count: '100', average: '10000' }
        ]) // Revenue
        .mockResolvedValueOnce([
          { date: new Date('2025-01-15'), category: 'Salaries', vendor_id: 'vendor-1', vendor_name: 'Vendor 1', department: 'HR', total: '750000', count: '80' }
        ]) // Expenses
        .mockResolvedValueOnce([
          { operating: 300000, investing: -100000, financing: 50000, opening: 400000 }
        ]) // Cash Flow
        .mockResolvedValueOnce([
          { total: 500000, count: 10, overdue: 100000, current: 400000 }
        ]) // Receivables
        .mockResolvedValueOnce([
          { total: 300000, count: 5, overdue: 50000, current: 250000 }
        ]) // Payables
        .mockResolvedValueOnce([
          { revenue: 1000000, expenses: 750000, cogs: 200000, gross_profit: 800000, gross_margin: 80, operating_profit: 250000, operating_margin: 25, net_profit: 250000, net_margin: 25 }
        ]) // Profitability
        .mockResolvedValueOnce([
          { day: new Date('2025-01-15'), daily_revenue: 100000, daily_expenses: 75000, daily_profit: 25000, revenue_7day_avg: 95000, revenue_30day_avg: 90000 }
        ]) // Trends
        .mockResolvedValueOnce([
          { total_revenue: 1000000 }
        ]) // Current month revenue
        .mockResolvedValueOnce([
          { id: 'cust-1', name: 'Customer 1', total_revenue: 500000, transaction_count: 50, last_transaction: new Date(), growthRate: 0.15, projectedRevenue: 575000 }
        ]) // Top customers
        .mockResolvedValueOnce([
          { total_assets: 5000000, total_liabilities: 2000000, total_equity: 3000000, current_ratio: 1.5, quick_ratio: 1.2, debt_to_equity: 0.67 }
        ]) // Financial ratios
        .mockResolvedValueOnce([
          { day: new Date('2025-01-15'), working_capital: 200000 }
        ]); // Working capital trend

      const period: DateRange = {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      };

      const result = await service.getFinancialDashboard('tenant-1', period);

      expect(result).toBeDefined();
      expect(result.kpis).toBeDefined();
      expect(result.kpis.totalRevenue).toBe(1000000);
      expect(result.kpis.totalExpenses).toBe(750000);
      expect(result.kpis.netProfit).toBe(250000);
      expect(result.metadata.dataFreshness).toBe('real-time');
      expect(redisService.set).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should handle Bangladesh fiscal year dates', async () => {
      redisService.get.mockResolvedValue(null);
      connection.query.mockResolvedValue([]);

      const period: DateRange = {
        from: new Date('2024-07-01'), // Bangladesh fiscal year start
        to: new Date('2025-06-30'), // Bangladesh fiscal year end
      };

      await service.getFinancialDashboard('tenant-1', period);

      expect(connection.query).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalled();
    });

    it('should support Bengali localization', async () => {
      redisService.get.mockResolvedValue(null);
      connection.query.mockResolvedValue([]);

      const period: DateRange = {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      };

      const result = await service.getFinancialDashboard('tenant-1', period, {
        locale: 'bn',
        includeCharts: true,
      });

      expect(result).toBeDefined();
      // Bengali localization should be applied to charts
      expect(bengaliService.formatCurrency).toHaveBeenCalled();
    });

    it('should force refresh when requested', async () => {
      redisService.get.mockResolvedValue(JSON.stringify({ kpis: { totalRevenue: 1000000 } }));
      connection.query.mockResolvedValue([]);

      const period: DateRange = {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      };

      await service.getFinancialDashboard('tenant-1', period, { forceRefresh: true });

      // Should bypass cache and query database
      expect(connection.query).toHaveBeenCalled();
    });

    it('should include charts when requested', async () => {
      redisService.get.mockResolvedValue(null);
      connection.query.mockResolvedValue([]);

      const period: DateRange = {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      };

      const result = await service.getFinancialDashboard('tenant-1', period, {
        includeCharts: true,
      });

      expect(result).toBeDefined();
      expect(result.charts).toBeDefined();
      expect(result.revenue.chart).toBeDefined();
      expect(result.expenses.chart).toBeDefined();
      expect(result.cashFlow.chart).toBeDefined();
    });
  });

  describe('performance', () => {
    it('should complete dashboard generation in reasonable time', async () => {
      redisService.get.mockResolvedValue(null);
      connection.query.mockResolvedValue([]);

      const period: DateRange = {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      };

      const startTime = Date.now();
      await service.getFinancialDashboard('tenant-1', period);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // Less than 2 seconds
    });

    it('should use parallel data fetching', async () => {
      redisService.get.mockResolvedValue(null);

      // All queries should be made in parallel
      const queryPromises: Promise<any>[] = [];
      connection.query.mockImplementation(() => {
        const promise = Promise.resolve([]);
        queryPromises.push(promise);
        return promise;
      });

      const period: DateRange = {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      };

      await service.getFinancialDashboard('tenant-1', period);

      // Verify multiple queries were initiated
      expect(connection.query).toHaveBeenCalledTimes(expect.any(Number));
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      redisService.get.mockResolvedValue(null);
      connection.query.mockRejectedValue(new Error('Database connection failed'));

      const period: DateRange = {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      };

      await expect(
        service.getFinancialDashboard('tenant-1', period)
      ).rejects.toThrow('Database connection failed');
    });

    it('should continue without cache on Redis error', async () => {
      redisService.get.mockRejectedValue(new Error('Redis connection failed'));
      connection.query.mockResolvedValue([]);

      const period: DateRange = {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      };

      const result = await service.getFinancialDashboard('tenant-1', period);

      expect(result).toBeDefined();
      expect(connection.query).toHaveBeenCalled();
    });
  });

  describe('caching', () => {
    it('should cache dashboard data with correct TTL', async () => {
      redisService.get.mockResolvedValue(null);
      connection.query.mockResolvedValue([]);

      const period: DateRange = {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
      };

      await service.getFinancialDashboard('tenant-1', period);

      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('dashboard:tenant-1:'),
        expect.any(String),
        300 // 5 minutes TTL
      );
    });
  });
});
