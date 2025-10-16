import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StreamingAnalyticsService } from '../streaming-analytics.service';

describe('StreamingAnalyticsService', () => {
  let service: StreamingAnalyticsService;
  let eventEmitter: EventEmitter2;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'KAFKA_BROKERS') return 'localhost:9092';
      return defaultValue || 'test-value';
    }),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
    on: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreamingAnalyticsService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<StreamingAnalyticsService>(StreamingAnalyticsService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    // Mock Kafka connection issues to use in-memory processing
    jest.spyOn(service as any, 'connectKafka').mockImplementation(async () => {
      (service as any).setupInMemoryProcessing();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('real-time event processing', () => {
    it('should process financial events in real-time', async () => {
      const event = {
        id: 'event-1',
        timestamp: new Date(),
        type: 'transaction' as const,
        source: 'bank-api',
        amount: 50000,
        currency: 'BDT',
        accountId: 'acc-123',
        metadata: {
          direction: 'credit',
          description: 'Customer payment',
        },
      };

      await (service as any).processInMemoryEvent(event);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'streaming.event.processed',
        expect.objectContaining({
          event: expect.objectContaining({ id: 'event-1' }),
          anomalyScore: expect.any(Number),
          latency: expect.any(Number),
        })
      );
    });

    it('should maintain event buffer for sliding window analysis', async () => {
      const events = Array.from({ length: 100 }, (_, i) => ({
        id: `event-${i}`,
        timestamp: new Date(Date.now() - (100 - i) * 1000),
        type: 'transaction' as const,
        source: 'test',
        amount: 10000 + Math.random() * 5000,
        currency: 'BDT',
        accountId: `acc-${i % 10}`,
        metadata: { direction: i % 2 === 0 ? 'credit' : 'debit' },
      }));

      for (const event of events) {
        await (service as any).processInMemoryEvent(event);
      }

      const buffer = (service as any).eventBuffer;
      expect(buffer.length).toBeLessThanOrEqual(1000); // Buffer size limit
    });
  });

  describe('anomaly detection', () => {
    it('should detect unusual transaction amounts', async () => {
      // Normal transactions
      for (let i = 0; i < 50; i++) {
        await (service as any).processInMemoryEvent({
          id: `normal-${i}`,
          timestamp: new Date(),
          type: 'transaction',
          source: 'test',
          amount: 10000 + Math.random() * 5000,
          currency: 'BDT',
          accountId: 'acc-normal',
          metadata: { direction: 'credit' },
        });
      }

      // Anomalous transaction
      const anomalousEvent = {
        id: 'anomaly-1',
        timestamp: new Date(),
        type: 'transaction' as const,
        source: 'test',
        amount: 10000000, // Very large amount
        currency: 'BDT',
        accountId: 'acc-anomaly',
        metadata: { direction: 'credit' },
      };

      await (service as any).processInMemoryEvent(anomalousEvent);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'anomaly.detected',
        expect.objectContaining({
          type: 'unusual_pattern',
          severity: expect.stringMatching(/high|critical/),
          event: expect.objectContaining({ id: 'anomaly-1' }),
          score: expect.any(Number),
        })
      );
    });

    it('should detect rapid transaction patterns', async () => {
      // Generate rapid transactions
      const rapidEvents = Array.from({ length: 30 }, (_, i) => ({
        id: `rapid-${i}`,
        timestamp: new Date(),
        type: 'transaction' as const,
        source: 'test',
        amount: 5000,
        currency: 'BDT',
        accountId: 'acc-rapid',
        metadata: { direction: 'debit' },
      }));

      for (const event of rapidEvents) {
        await (service as any).processInMemoryEvent(event);
      }

      // Pattern matching should trigger
      await (service as any).processEventWindow();

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'pattern.rapid_transactions',
        expect.any(Array)
      );
    });

    it('should identify duplicate transactions', async () => {
      const duplicateEvent = {
        id: 'dup-1',
        timestamp: new Date(),
        type: 'transaction' as const,
        source: 'test',
        amount: 25000,
        currency: 'BDT',
        accountId: 'acc-dup',
        metadata: { direction: 'credit' },
      };

      // Process same transaction twice
      await (service as any).processInMemoryEvent(duplicateEvent);
      await (service as any).processInMemoryEvent({ ...duplicateEvent, id: 'dup-2' });

      await (service as any).processEventWindow();

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'pattern.duplicates',
        expect.any(Array)
      );
    });

    it('should detect currency fluctuations', async () => {
      const currencyEvents = [
        {
          id: 'curr-1',
          timestamp: new Date(),
          type: 'transaction' as const,
          source: 'forex',
          amount: 1000,
          currency: 'USD',
          accountId: 'acc-forex',
          metadata: { exchangeRate: 110.0, direction: 'credit' },
        },
        {
          id: 'curr-2',
          timestamp: new Date(Date.now() + 60000),
          type: 'transaction' as const,
          source: 'forex',
          amount: 1000,
          currency: 'USD',
          accountId: 'acc-forex',
          metadata: { exchangeRate: 116.0, direction: 'credit' }, // 5.5% fluctuation
        },
      ];

      for (const event of currencyEvents) {
        await (service as any).processInMemoryEvent(event);
      }

      await (service as any).processEventWindow();

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'pattern.currency_fluctuation',
        expect.any(Array)
      );
    });
  });

  describe('cash position monitoring', () => {
    it('should maintain real-time cash position', async () => {
      const events = [
        {
          id: 'cash-1',
          timestamp: new Date(),
          type: 'transaction' as const,
          source: 'bank',
          amount: 100000,
          currency: 'BDT',
          accountId: 'acc-main',
          metadata: { direction: 'credit' },
        },
        {
          id: 'cash-2',
          timestamp: new Date(),
          type: 'payment' as const,
          source: 'bank',
          amount: 30000,
          currency: 'BDT',
          accountId: 'acc-main',
          metadata: { direction: 'debit' },
        },
        {
          id: 'cash-3',
          timestamp: new Date(),
          type: 'transaction' as const,
          source: 'bank',
          amount: 50000,
          currency: 'BDT',
          accountId: 'acc-secondary',
          metadata: { direction: 'credit' },
        },
      ];

      for (const event of events) {
        await (service as any).processInMemoryEvent(event);
      }

      const cashPosition = await service.getCashPosition();

      expect(cashPosition.totalCash).toBe(120000); // 100000 - 30000 + 50000
      expect(cashPosition.byAccount.size).toBe(2);
      expect(cashPosition.byAccount.get('acc-main')).toBe(70000);
      expect(cashPosition.byAccount.get('acc-secondary')).toBe(50000);
    });

    it('should track multi-currency positions', async () => {
      const events = [
        {
          id: 'multi-1',
          timestamp: new Date(),
          type: 'transaction' as const,
          source: 'bank',
          amount: 100000,
          currency: 'BDT',
          accountId: 'acc-1',
          metadata: { direction: 'credit' },
        },
        {
          id: 'multi-2',
          timestamp: new Date(),
          type: 'transaction' as const,
          source: 'bank',
          amount: 1000,
          currency: 'USD',
          accountId: 'acc-2',
          metadata: { direction: 'credit' },
        },
        {
          id: 'multi-3',
          timestamp: new Date(),
          type: 'transaction' as const,
          source: 'bank',
          amount: 500,
          currency: 'EUR',
          accountId: 'acc-3',
          metadata: { direction: 'credit' },
        },
      ];

      for (const event of events) {
        await (service as any).processInMemoryEvent(event);
      }

      const cashPosition = await service.getCashPosition();

      expect(cashPosition.byCurrency.size).toBe(3);
      expect(cashPosition.byCurrency.get('BDT')).toBe(100000);
      expect(cashPosition.byCurrency.get('USD')).toBe(1000);
      expect(cashPosition.byCurrency.get('EUR')).toBe(500);
    });

    it('should alert on liquidity shortfalls', async () => {
      // Create liability event
      const liabilityEvent = {
        id: 'liability-1',
        timestamp: new Date(),
        type: 'transaction' as const,
        source: 'test',
        amount: 1000000,
        currency: 'BDT',
        accountId: 'acc-payable',
        metadata: {
          direction: 'credit',
          isLiability: true,
        },
      };

      // Create small cash position
      const cashEvent = {
        id: 'cash-small',
        timestamp: new Date(),
        type: 'transaction' as const,
        source: 'test',
        amount: 300000, // Only 30% of liability
        currency: 'BDT',
        accountId: 'acc-cash',
        metadata: { direction: 'credit' },
      };

      await (service as any).processInMemoryEvent(liabilityEvent);
      await (service as any).processInMemoryEvent(cashEvent);

      const cashPosition = await service.getCashPosition();

      expect(cashPosition.liquidityRatio).toBeLessThan(0.5);
      expect(cashPosition.projectedShortfall).toBeDefined();
      expect(cashPosition.projectedShortfall).toBeGreaterThan(0);
    });
  });

  describe('metrics and performance', () => {
    it('should track streaming metrics', async () => {
      const events = Array.from({ length: 100 }, (_, i) => ({
        id: `metric-${i}`,
        timestamp: new Date(),
        type: 'transaction' as const,
        source: 'test',
        amount: 10000,
        currency: 'BDT',
        accountId: `acc-${i % 5}`,
        metadata: { direction: 'credit' },
      }));

      for (const event of events) {
        await (service as any).processInMemoryEvent(event);
      }

      const metrics = await service.getRealtimeMetrics();

      expect(metrics.eventsProcessed).toBe(100);
      expect(metrics.averageLatency).toBeGreaterThan(0);
      expect(metrics.throughput).toBeGreaterThan(0);
    });

    it('should calculate cash flow variance', async () => {
      const events = Array.from({ length: 60 }, (_, i) => ({
        id: `variance-${i}`,
        timestamp: new Date(Date.now() - (60 - i) * 1000),
        type: 'transaction' as const,
        source: 'test',
        amount: 10000 + Math.sin(i * 0.5) * 5000, // Varying amounts
        currency: 'BDT',
        accountId: 'acc-var',
        metadata: { direction: 'credit' },
      }));

      for (const event of events) {
        await (service as any).processInMemoryEvent(event);
      }

      await (service as any).processEventWindow();

      const metrics = await service.getRealtimeMetrics();

      expect(metrics.cashFlowVariance).toBeGreaterThan(0);
    });

    it('should emit window processing statistics', async () => {
      const events = Array.from({ length: 50 }, (_, i) => ({
        id: `window-${i}`,
        timestamp: new Date(Date.now() - i * 500), // Last 25 seconds
        type: 'transaction' as const,
        source: 'test',
        amount: 20000,
        currency: 'BDT',
        accountId: 'acc-window',
        metadata: { direction: 'credit' },
      }));

      for (const event of events) {
        await (service as any).processInMemoryEvent(event);
      }

      await (service as any).processEventWindow();

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'streaming.window.processed',
        expect.objectContaining({
          timestamp: expect.any(Date),
          eventCount: expect.any(Number),
          totalAmount: expect.any(Number),
          avgAmount: expect.any(Number),
          variance: expect.any(Number),
          throughput: expect.any(Number),
        })
      );
    });
  });

  describe('recent anomalies retrieval', () => {
    it('should return recent anomalies', async () => {
      // Generate some anomalies
      const anomalyEvents = [
        {
          id: 'recent-anomaly-1',
          timestamp: new Date(),
          type: 'adjustment' as const,
          source: 'test',
          amount: 5000000, // Large adjustment
          currency: 'BDT',
          accountId: 'acc-anomaly',
          metadata: {
            direction: 'credit',
            anomalyScore: 0.95,
          },
        },
        {
          id: 'recent-anomaly-2',
          timestamp: new Date(),
          type: 'transaction' as const,
          source: 'test',
          amount: 10000000,
          currency: 'BDT',
          accountId: 'acc-anomaly-2',
          metadata: {
            direction: 'debit',
            anomalyScore: 0.88,
          },
        },
      ];

      for (const event of anomalyEvents) {
        await (service as any).processInMemoryEvent(event);
      }

      const recentAnomalies = await service.getRecentAnomalies(5);

      expect(recentAnomalies).toHaveLength(2);
      expect(recentAnomalies[0]).toEqual(
        expect.objectContaining({
          type: 'detected',
          severity: expect.stringMatching(/medium|high|critical/),
          score: expect.any(Number),
        })
      );
    });
  });

  describe('event publishing', () => {
    it('should publish events to appropriate topics', async () => {
      const event = {
        id: 'publish-1',
        timestamp: new Date(),
        type: 'transaction' as const,
        source: 'api',
        amount: 50000,
        currency: 'BDT',
        accountId: 'acc-pub',
        metadata: { direction: 'credit' },
      };

      // Mock producer send
      const producerSpy = jest.spyOn((service as any).producer, 'send')
        .mockResolvedValue(undefined);

      await service.publishEvent(event);

      expect(producerSpy).toHaveBeenCalledWith({
        topic: 'financial.transactions',
        messages: [{
          key: 'publish-1',
          value: JSON.stringify(event),
        }],
      });
    });
  });

  describe('model training', () => {
    it('should train anomaly detection model', async () => {
      const trainingData = Array.from({ length: 100 }, (_, i) => ({
        id: `train-${i}`,
        timestamp: new Date(),
        type: 'transaction' as const,
        source: 'historical',
        amount: 10000 + Math.random() * 90000,
        currency: 'BDT',
        accountId: `acc-${i % 10}`,
        metadata: {
          direction: i % 2 === 0 ? 'credit' : 'debit',
          isAnomaly: i > 95, // Last 5 are anomalies
        },
      }));

      await service.trainAnomalyModel(trainingData);

      // Model should be trained
      expect((service as any).anomalyModel).toBeDefined();
    });
  });

  describe('pattern rules', () => {
    it('should initialize and apply pattern rules', async () => {
      const rules = (service as any).patternRules;

      expect(rules).toBeDefined();
      expect(rules.length).toBeGreaterThan(0);

      const ruleNames = rules.map((r: any) => r.name);
      expect(ruleNames).toContain('rapid_transactions');
      expect(ruleNames).toContain('large_adjustment');
      expect(ruleNames).toContain('duplicate_transactions');
      expect(ruleNames).toContain('currency_fluctuation');
    });

    it('should trigger large adjustment pattern', async () => {
      const largeAdjustment = {
        id: 'large-adj-1',
        timestamp: new Date(),
        type: 'adjustment' as const,
        source: 'test',
        amount: 2000000, // Large adjustment
        currency: 'BDT',
        accountId: 'acc-adj',
        metadata: { direction: 'credit' },
      };

      await (service as any).processInMemoryEvent(largeAdjustment);
      await (service as any).processEventWindow();

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'pattern.large_adjustment',
        expect.any(Array)
      );
    });
  });

  describe('performance requirements', () => {
    it('should process events with low latency', async () => {
      const event = {
        id: 'perf-1',
        timestamp: new Date(),
        type: 'transaction' as const,
        source: 'test',
        amount: 10000,
        currency: 'BDT',
        accountId: 'acc-perf',
        metadata: { direction: 'credit' },
      };

      const times: number[] = [];
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        await (service as any).processInMemoryEvent({ ...event, id: `perf-${i}` });
        times.push(performance.now() - start);
      }

      const avgLatency = times.reduce((a, b) => a + b) / times.length;
      expect(avgLatency).toBeLessThan(10); // Less than 10ms average
    });

    it('should handle high throughput', async () => {
      const events = Array.from({ length: 1000 }, (_, i) => ({
        id: `throughput-${i}`,
        timestamp: new Date(),
        type: 'transaction' as const,
        source: 'test',
        amount: 10000,
        currency: 'BDT',
        accountId: `acc-${i % 100}`,
        metadata: { direction: i % 2 === 0 ? 'credit' : 'debit' },
      }));

      const start = performance.now();
      for (const event of events) {
        await (service as any).processInMemoryEvent(event);
      }
      const duration = performance.now() - start;

      const throughput = 1000 / (duration / 1000); // Events per second
      expect(throughput).toBeGreaterThan(100); // At least 100 events per second
    });
  });
});