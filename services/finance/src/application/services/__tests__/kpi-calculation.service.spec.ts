import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { EventBus } from '@nestjs/cqrs';
import { RedisService } from '@vextrus/shared-infrastructure';
import { KPICalculationService, RealTimeKPIs, SmartAlert } from '../kpi-calculation.service';

describe('KPICalculationService', () => {
  let service: KPICalculationService;
  let connection: jest.Mocked<Connection>;
  let eventBus: jest.Mocked<EventBus>;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const mockConnection = {
      query: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
    };

    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KPICalculationService,
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<KPICalculationService>(KPICalculationService);
    connection = module.get(getConnectionToken());
    eventBus = module.get(EventBus);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateRealTimeKPIs', () => {
    it('should calculate all financial KPIs correctly', async () => {
      // Mock all parallel queries
      connection.query
        .mockResolvedValueOnce([
          {
            total_assets: 5000000,
            total_liabilities: 2000000,
            total_equity: 3000000,
            current_assets: 2000000,
            current_liabilities: 1000000,
            quick_assets: 1500000,
            current_ratio: 2.0,
            quick_ratio: 1.5,
            debt_to_equity: 0.67,
            return_on_assets: 10.0,
            return_on_equity: 15.0,
          },
        ]) // Financial health
        .mockResolvedValueOnce([
          {
            asset_turnover: 2.5,
            inventory_turnover: 8.0,
            receivables_turnover: 6.0,
          },
        ]) // Operational
        .mockResolvedValueOnce([
          {
            cash_conversion_cycle: 45,
            working_capital_ratio: 0.3,
            operating_cash_flow_ratio: 1.2,
          },
        ]) // Liquidity
        .mockResolvedValueOnce([
          {
            gross_profit_margin: 40,
            operating_profit_margin: 25,
            net_profit_margin: 20,
            ebitda: 500000,
          },
        ]) // Profitability
        .mockResolvedValueOnce([
          {
            revenue_growth_rate: 15,
            expense_growth_rate: 8,
            customer_growth_rate: 10,
          },
        ]) // Growth
        .mockResolvedValueOnce([
          {
            debt_service_coverage: 2.5,
            interest_coverage: 8.0,
            credit_risk: 5,
          },
        ]) // Risk
        .mockResolvedValueOnce([
          {
            vat_compliance: 98,
            tds_compliance: 99,
            nbr_reporting_status: 'COMPLIANT',
          },
        ]); // Compliance

      const result = await service.calculateRealTimeKPIs('tenant-1');

      expect(result).toBeDefined();
      expect(result.currentRatio).toBe(2.0);
      expect(result.quickRatio).toBe(1.5);
      expect(result.debtToEquity).toBe(0.67);
      expect(result.assetTurnover).toBe(2.5);
      expect(result.grossProfitMargin).toBe(40);
      expect(result.revenueGrowthRate).toBe(15);
      expect(result.vatCompliance).toBe(98);
      expect(result.nbrReportingStatus).toBe('COMPLIANT');
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    it('should use cached data when available and valid', async () => {
      const cachedKPIs: RealTimeKPIs = {
        quickRatio: 1.5,
        currentRatio: 2.0,
        debtToEquity: 0.67,
        returnOnAssets: 10,
        returnOnEquity: 15,
        assetTurnover: 2.5,
        inventoryTurnover: 8,
        receivablesTurnover: 6,
        cashConversionCycle: 45,
        workingCapitalRatio: 0.3,
        operatingCashFlowRatio: 1.2,
        grossProfitMargin: 40,
        operatingProfitMargin: 25,
        netProfitMargin: 20,
        ebitda: 500000,
        revenueGrowthRate: 15,
        expenseGrowthRate: 8,
        customerGrowthRate: 10,
        debtServiceCoverage: 2.5,
        interestCoverage: 8,
        creditRisk: 5,
        vatCompliance: 98,
        tdsCompliance: 99,
        nbrReportingStatus: 'COMPLIANT',
        lastUpdated: new Date(),
      };

      redisService.get.mockResolvedValue(JSON.stringify(cachedKPIs));

      const result = await service.calculateRealTimeKPIs('tenant-1', false);

      expect(result).toBeDefined();
      expect(result.currentRatio).toBe(2.0);
      expect(connection.query).not.toHaveBeenCalled();
    });

    it('should force refresh when requested', async () => {
      connection.query.mockResolvedValue([{}]);

      await service.calculateRealTimeKPIs('tenant-1', true);

      // Should query database even if cache exists
      expect(connection.query).toHaveBeenCalled();
    });
  });

  describe('generateSmartAlerts', () => {
    it('should generate alerts for low liquidity', async () => {
      connection.query
        .mockResolvedValueOnce([{ current_ratio: 0.8 }])
        .mockResolvedValueOnce([{ projected_balance: -50000, days_to_shortage: 15 }])
        .mockResolvedValueOnce([{ total: 500000, over90Days: 150000 }]);

      const alerts = await service.generateSmartAlerts('tenant-1');

      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);

      const liquidityAlert = alerts.find(a => a.category === 'LIQUIDITY');
      expect(liquidityAlert).toBeDefined();
      expect(liquidityAlert?.type).toBe('CRITICAL');
    });

    it('should generate alerts for declining profitability', async () => {
      connection.query.mockResolvedValue([{}]);

      // Mock KPI data with negative profit margin
      const kpis: RealTimeKPIs = {
        quickRatio: 1.5,
        currentRatio: 2.0,
        debtToEquity: 0.5,
        returnOnAssets: 10,
        returnOnEquity: 15,
        assetTurnover: 2.0,
        inventoryTurnover: 8,
        receivablesTurnover: 6,
        cashConversionCycle: 45,
        workingCapitalRatio: 0.3,
        operatingCashFlowRatio: 1.2,
        grossProfitMargin: 20,
        operatingProfitMargin: 5,
        netProfitMargin: -5, // Negative margin
        ebitda: 100000,
        revenueGrowthRate: -15, // Declining revenue
        expenseGrowthRate: 10,
        customerGrowthRate: 5,
        debtServiceCoverage: 2.0,
        interestCoverage: 5.0,
        creditRisk: 10,
        vatCompliance: 95,
        tdsCompliance: 95,
        nbrReportingStatus: 'COMPLIANT',
        lastUpdated: new Date(),
      };

      // Create service instance with mock cache
      const serviceWithCache = service as any;
      serviceWithCache.kpiCache.set('tenant-1', kpis);

      const alerts = await service.generateSmartAlerts('tenant-1');

      expect(alerts).toBeDefined();
      const profitAlert = alerts.find(a => a.category === 'PROFITABILITY');
      expect(profitAlert).toBeDefined();
      expect(profitAlert?.type).toBe('CRITICAL');

      const growthAlert = alerts.find(a => a.category === 'GROWTH');
      expect(growthAlert).toBeDefined();
      expect(growthAlert?.type).toBe('WARNING');
    });

    it('should generate alerts for compliance issues', async () => {
      connection.query.mockResolvedValue([{}]);

      const kpis: RealTimeKPIs = {
        quickRatio: 1.5,
        currentRatio: 2.0,
        debtToEquity: 0.5,
        returnOnAssets: 10,
        returnOnEquity: 15,
        assetTurnover: 2.0,
        inventoryTurnover: 8,
        receivablesTurnover: 6,
        cashConversionCycle: 45,
        workingCapitalRatio: 0.3,
        operatingCashFlowRatio: 1.2,
        grossProfitMargin: 25,
        operatingProfitMargin: 15,
        netProfitMargin: 10,
        ebitda: 500000,
        revenueGrowthRate: 10,
        expenseGrowthRate: 8,
        customerGrowthRate: 5,
        debtServiceCoverage: 2.0,
        interestCoverage: 5.0,
        creditRisk: 10,
        vatCompliance: 85, // Below 95% threshold
        tdsCompliance: 90,
        nbrReportingStatus: 'OVERDUE', // Overdue status
        lastUpdated: new Date(),
      };

      const serviceWithCache = service as any;
      serviceWithCache.kpiCache.set('tenant-1', kpis);

      const alerts = await service.generateSmartAlerts('tenant-1');

      expect(alerts).toBeDefined();
      const vatAlert = alerts.find(a => a.message.includes('VAT compliance'));
      expect(vatAlert).toBeDefined();

      const nbrAlert = alerts.find(a => a.message.includes('NBR reporting'));
      expect(nbrAlert).toBeDefined();
      expect(nbrAlert?.type).toBe('CRITICAL');
    });
  });

  describe('Event Handlers', () => {
    it('should handle InvoicePaidEvent', async () => {
      connection.query.mockResolvedValue([{ revenue: 1000000 }]);

      const event = {
        invoiceId: 'INV-001',
        tenantId: 'tenant-1',
        amount: 50000,
        customerId: 'customer-1',
      };

      await service.handleInvoicePaid(event);

      expect(connection.query).toHaveBeenCalled();
    });

    it('should handle ExpenseApprovedEvent', async () => {
      connection.query.mockResolvedValue([{ expenses: 750000 }]);

      const event = {
        expenseId: 'EXP-001',
        tenantId: 'tenant-1',
        amount: 25000,
        category: 'Operating',
      };

      await service.handleExpenseApproved(event);

      expect(connection.query).toHaveBeenCalled();
    });

    it('should handle PaymentProcessedEvent', async () => {
      connection.query.mockResolvedValue([{ cash_position: 1000000 }]);

      const event = {
        paymentId: 'PAY-001',
        tenantId: 'tenant-1',
        amount: 75000,
        type: 'INFLOW' as const,
      };

      await service.handlePaymentProcessed(event);

      expect(connection.query).toHaveBeenCalled();
    });
  });

  describe('KPI Thresholds', () => {
    it('should allow setting custom thresholds', async () => {
      const thresholds = [
        {
          kpiName: 'currentRatio',
          minValue: 1.5,
          targetValue: 2.0,
          criticalMin: 1.0,
        },
        {
          kpiName: 'grossProfitMargin',
          minValue: 25,
          targetValue: 35,
          criticalMin: 20,
        },
      ];

      connection.query.mockResolvedValue([]);

      await service.setKPIThresholds('tenant-1', thresholds);

      expect(connection.query).toHaveBeenCalledWith(
        expect.stringContaining('kpi_thresholds'),
        expect.arrayContaining(['tenant-1'])
      );
    });
  });

  describe('KPI Streaming', () => {
    it('should subscribe to KPI updates', () => {
      const stream = service.subscribeToKPIUpdates('tenant-1');

      expect(stream).toBeDefined();
      expect(stream.subscribe).toBeDefined();
    });

    it('should broadcast KPI updates to subscribers', () => {
      const stream = service.subscribeToKPIUpdates('tenant-1');
      const mockObserver = {
        next: jest.fn(),
        error: jest.fn(),
        complete: jest.fn(),
      };

      stream.subscribe(mockObserver);

      const kpis: RealTimeKPIs = {
        quickRatio: 1.5,
        currentRatio: 2.0,
        debtToEquity: 0.5,
        returnOnAssets: 10,
        returnOnEquity: 15,
        assetTurnover: 2.0,
        inventoryTurnover: 8,
        receivablesTurnover: 6,
        cashConversionCycle: 45,
        workingCapitalRatio: 0.3,
        operatingCashFlowRatio: 1.2,
        grossProfitMargin: 25,
        operatingProfitMargin: 15,
        netProfitMargin: 10,
        ebitda: 500000,
        revenueGrowthRate: 10,
        expenseGrowthRate: 8,
        customerGrowthRate: 5,
        debtServiceCoverage: 2.0,
        interestCoverage: 5.0,
        creditRisk: 10,
        vatCompliance: 98,
        tdsCompliance: 99,
        nbrReportingStatus: 'COMPLIANT',
        lastUpdated: new Date(),
      };

      // Broadcast update
      const serviceInternal = service as any;
      serviceInternal.broadcastKPIUpdate('tenant-1', kpis);

      // Should have emitted updates
      expect(mockObserver.next).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should complete KPI calculation within performance target', async () => {
      connection.query.mockResolvedValue([{}]);

      const startTime = Date.now();
      await service.calculateRealTimeKPIs('tenant-1');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
    });

    it('should handle database errors gracefully', async () => {
      connection.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.calculateRealTimeKPIs('tenant-1')).rejects.toThrow(
        'Database connection failed'
      );
    });
  });
});
