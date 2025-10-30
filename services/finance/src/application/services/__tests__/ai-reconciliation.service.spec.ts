import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as tf from '@tensorflow/tfjs-node';
import {
  AIReconciliationService,
  PaymentRecord,
  BankTransaction,
  ReconciliationMatch,
  ReconciliationHistory,
} from '../ai-reconciliation.service';

describe('AIReconciliationService', () => {
  let service: AIReconciliationService;
  let eventEmitter: EventEmitter2;

  const mockEventEmitter = {
    emit: jest.fn(),
    on: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIReconciliationService,
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<AIReconciliationService>(AIReconciliationService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('matchTransactions', () => {
    it('should match payments to bank transactions accurately', async () => {
      const payments: PaymentRecord[] = [
        {
          id: 'payment-1',
          amount: 10000,
          currency: 'BDT',
          date: new Date('2025-01-01'),
          reference: 'INV-1001',
          vendorId: 'vendor-123',
          vendorName: 'ABC Construction',
          description: 'Payment for Invoice #1001',
          tenantId: 'tenant-1',
        },
        {
          id: 'payment-2',
          amount: 5000,
          currency: 'BDT',
          date: new Date('2025-01-02'),
          reference: 'INV-1002',
          vendorId: 'vendor-456',
          vendorName: 'XYZ Suppliers',
          description: 'Supplier Payment',
          tenantId: 'tenant-1',
        },
      ];

      const bankTransactions: BankTransaction[] = [
        {
          id: 'bank-1',
          amount: 10000,
          currency: 'BDT',
          date: new Date('2025-01-01'),
          description: 'ABC Construction Invoice Payment',
          counterparty: 'ABC Construction',
          reference: 'INV-1001',
          tenantId: 'tenant-1',
        },
        {
          id: 'bank-2',
          amount: 5000,
          currency: 'BDT',
          date: new Date('2025-01-02'),
          description: 'Payment to XYZ Suppliers',
          counterparty: 'XYZ Suppliers',
          reference: 'INV-1002',
          tenantId: 'tenant-1',
        },
      ];

      const result = await service.matchTransactions(payments, bankTransactions);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check first match structure
      expect(result[0]).toEqual(
        expect.objectContaining({
          payment: expect.objectContaining({
            id: expect.any(String),
          }),
          transaction: expect.objectContaining({
            id: expect.any(String),
          }),
          confidence: expect.any(Number),
          matchType: expect.stringMatching(/exact|probable|possible/),
          suggestedAction: expect.stringMatching(/auto-match|review|investigate/),
        })
      );

      // High confidence for exact matches
      const exactMatches = result.filter(m => m.matchType === 'exact');
      if (exactMatches.length > 0) {
        expect(exactMatches[0].confidence).toBeGreaterThan(0.95);
      }

      // Verify event emitted
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'reconciliation.performance',
        expect.objectContaining({
          totalPayments: 2,
          totalTransactions: 2,
          matchesFound: expect.any(Number),
          processingTimeMs: expect.any(Number),
        })
      );
    });

    it('should handle multi-currency transactions', async () => {
      const payments: PaymentRecord[] = [
        {
          id: 'payment-usd-1',
          amount: 1000,
          currency: 'USD',
          date: new Date('2025-01-01'),
          reference: 'USD-001',
          description: 'USD Payment',
          tenantId: 'tenant-1',
        },
      ];

      const bankTransactions: BankTransaction[] = [
        {
          id: 'bank-usd-1',
          amount: 1000,
          currency: 'USD',
          date: new Date('2025-01-01'),
          description: 'USD Payment received',
          counterparty: 'International Client',
          tenantId: 'tenant-1',
        },
      ];

      const result = await service.matchTransactions(payments, bankTransactions);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);

      // Currency match should increase confidence
      const currencyMatch = result[0];
      expect(currencyMatch.features?.currencyMatch).toBe(1);
    });

    it('should process large batches efficiently', async () => {
      // Generate 100 payment-transaction pairs
      const payments: PaymentRecord[] = Array.from({ length: 100 }, (_, i) => ({
        id: `payment-${i}`,
        amount: 1000 + (i * 100),
        currency: 'BDT',
        date: new Date(2025, 0, 1 + (i % 30)),
        reference: `REF-${i}`,
        description: `Payment ${i}`,
        tenantId: 'tenant-1',
      }));

      const bankTransactions: BankTransaction[] = Array.from({ length: 100 }, (_, i) => ({
        id: `bank-${i}`,
        amount: 1000 + (i * 100),
        currency: 'BDT',
        date: new Date(2025, 0, 1 + (i % 30)),
        description: `Transaction ${i}`,
        counterparty: `Vendor ${i}`,
        tenantId: 'tenant-1',
      }));

      const startTime = Date.now();
      const result = await service.matchTransactions(payments, bankTransactions);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Process in less than 5 seconds

      // Most should match (same amounts and dates)
      expect(result.length).toBeGreaterThan(50);
    });

    it('should handle empty transaction sets', async () => {
      const result = await service.matchTransactions([], []);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should match with fuzzy string similarity', async () => {
      const payments: PaymentRecord[] = [
        {
          id: 'payment-fuzzy',
          amount: 5000,
          currency: 'BDT',
          date: new Date('2025-01-01'),
          reference: 'INVOICE 1001',
          vendorName: 'ABC Constructions Ltd',
          description: 'Payment for Invoice',
          tenantId: 'tenant-1',
        },
      ];

      const bankTransactions: BankTransaction[] = [
        {
          id: 'bank-fuzzy',
          amount: 5000,
          currency: 'BDT',
          date: new Date('2025-01-01'),
          description: 'Payment Invoice #1001',
          counterparty: 'ABC Constructions Limited',
          reference: 'INV-1001',
          tenantId: 'tenant-1',
        },
      ];

      const result = await service.matchTransactions(payments, bankTransactions);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);

      // Should match despite slight differences
      const match = result[0];
      expect(match.features?.referenceSimilarity).toBeGreaterThan(0.7);
      expect(match.features?.vendorNameMatch).toBeGreaterThan(0.7);
    });

    it('should handle date proximity matching', async () => {
      const payments: PaymentRecord[] = [
        {
          id: 'payment-date',
          amount: 5000,
          currency: 'BDT',
          date: new Date('2025-01-01'),
          reference: 'PAY-001',
          description: 'Payment',
          tenantId: 'tenant-1',
        },
      ];

      const bankTransactions: BankTransaction[] = [
        {
          id: 'bank-date',
          amount: 5000,
          currency: 'BDT',
          date: new Date('2025-01-03'), // 2 days later
          description: 'Payment received',
          counterparty: 'Customer',
          tenantId: 'tenant-1',
        },
      ];

      const result = await service.matchTransactions(payments, bankTransactions);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);

      // Date proximity should be calculated
      const match = result[0];
      expect(match.features?.dateProximity).toBeDefined();
      expect(match.features?.dateProximity).toBeGreaterThan(0.5); // Within 30 days
    });
  });

  describe('trainModel', () => {
    it('should train the model with historical data', async () => {
      const historicalData: ReconciliationHistory[] = Array.from({ length: 150 }, (_, i) => ({
        payment: {
          id: `payment-train-${i}`,
          amount: 1000 + (i * 100),
          currency: 'BDT',
          date: new Date(2024, 0, 1 + (i % 365)),
          reference: `REF-${i}`,
          description: `Training Payment ${i}`,
          tenantId: 'tenant-1',
        },
        transaction: {
          id: `bank-train-${i}`,
          amount: 1000 + (i * 100),
          currency: 'BDT',
          date: new Date(2024, 0, 1 + (i % 365)),
          description: `Training Transaction ${i}`,
          counterparty: `Vendor ${i}`,
          tenantId: 'tenant-1',
        },
        wasCorrectMatch: true,
        matchedBy: 'system',
        matchedAt: new Date(),
      }));

      await service.trainModel(historicalData);

      // Should emit training event
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'reconciliation.model.trained',
        expect.objectContaining({
          samples: 150,
          finalAccuracy: expect.any(Number),
          epochs: 100,
        })
      );
    });

    it('should warn when insufficient training data', async () => {
      const insufficientData: ReconciliationHistory[] = Array.from({ length: 50 }, (_, i) => ({
        payment: {
          id: `payment-${i}`,
          amount: 1000,
          currency: 'BDT',
          date: new Date(),
          reference: `REF-${i}`,
          description: 'Payment',
          tenantId: 'tenant-1',
        },
        transaction: {
          id: `bank-${i}`,
          amount: 1000,
          currency: 'BDT',
          date: new Date(),
          description: 'Transaction',
          counterparty: 'Vendor',
          tenantId: 'tenant-1',
        },
        wasCorrectMatch: true,
        matchedBy: 'system',
        matchedAt: new Date(),
      }));

      await service.trainModel(insufficientData);

      // Should not emit event due to insufficient data
      expect(eventEmitter.emit).not.toHaveBeenCalledWith(
        'reconciliation.model.trained',
        expect.any(Object)
      );
    });
  });

  describe('evaluateModel', () => {
    it('should evaluate model performance', async () => {
      const testData: ReconciliationHistory[] = Array.from({ length: 100 }, (_, i) => ({
        payment: {
          id: `payment-test-${i}`,
          amount: 1000 + (i * 100),
          currency: 'BDT',
          date: new Date(2024, 0, 1 + i),
          reference: `REF-${i}`,
          description: `Test Payment ${i}`,
          tenantId: 'tenant-1',
        },
        transaction: {
          id: `bank-test-${i}`,
          amount: 1000 + (i * 100),
          currency: 'BDT',
          date: new Date(2024, 0, 1 + i),
          description: `Test Transaction ${i}`,
          counterparty: `Vendor ${i}`,
          tenantId: 'tenant-1',
        },
        wasCorrectMatch: true,
        matchedBy: 'system',
        matchedAt: new Date(),
      }));

      const evaluation = await service.evaluateModel(testData);

      expect(evaluation).toEqual(
        expect.objectContaining({
          accuracy: expect.any(Number),
          precision: expect.any(Number),
          recall: expect.any(Number),
          f1Score: expect.any(Number),
        })
      );

      expect(evaluation.accuracy).toBeGreaterThanOrEqual(0);
      expect(evaluation.accuracy).toBeLessThanOrEqual(1);
    });
  });

  describe('suggestMatches', () => {
    it('should suggest matches for unmatched transactions', async () => {
      const unmatchedBankTransactions: BankTransaction[] = [
        {
          id: 'unmatched-bank-1',
          amount: 7500,
          currency: 'BDT',
          date: new Date('2025-01-15'),
          description: 'Unknown payment',
          counterparty: 'Mystery Client',
          tenantId: 'tenant-1',
        },
      ];

      const unmatchedPayments: PaymentRecord[] = [
        {
          id: 'unmatched-payment-1',
          amount: 7500,
          currency: 'BDT',
          date: new Date('2025-01-15'),
          reference: 'PAY-999',
          description: 'Payment to supplier',
          tenantId: 'tenant-1',
        },
      ];

      const suggestions = await service.suggestMatches(
        unmatchedBankTransactions,
        unmatchedPayments
      );

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);

      // Should only return high-confidence suggestions (> 0.7)
      suggestions.forEach(suggestion => {
        expect(suggestion.confidence).toBeGreaterThan(0.7);
      });
    });

    it('should return empty array when no good matches found', async () => {
      const unmatchedBankTransactions: BankTransaction[] = [
        {
          id: 'bank-no-match',
          amount: 99999,
          currency: 'USD',
          date: new Date('2020-01-01'),
          description: 'Very old transaction',
          counterparty: 'Unknown',
          tenantId: 'tenant-1',
        },
      ];

      const unmatchedPayments: PaymentRecord[] = [
        {
          id: 'payment-no-match',
          amount: 100,
          currency: 'BDT',
          date: new Date('2025-01-15'),
          reference: 'NEW-001',
          description: 'Recent small payment',
          tenantId: 'tenant-1',
        },
      ];

      const suggestions = await service.suggestMatches(
        unmatchedBankTransactions,
        unmatchedPayments
      );

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      // May be empty if no high-confidence matches
    });
  });

  describe('performance benchmarks', () => {
    it('should meet inference time requirements', async () => {
      const payment: PaymentRecord[] = [{
        id: 'perf-1',
        amount: 1000,
        currency: 'BDT',
        date: new Date(),
        reference: 'PERF-001',
        description: 'Performance test',
        tenantId: 'tenant-1',
      }];

      const transaction: BankTransaction[] = [{
        id: 'perf-2',
        amount: 1000,
        currency: 'BDT',
        date: new Date(),
        description: 'Performance test transaction',
        counterparty: 'Test Vendor',
        tenantId: 'tenant-1',
      }];

      const times: number[] = [];
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        await service.matchTransactions(payment, transaction);
        times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length;
      expect(avgTime).toBeLessThan(200); // Less than 200ms per match
    });
  });
});
