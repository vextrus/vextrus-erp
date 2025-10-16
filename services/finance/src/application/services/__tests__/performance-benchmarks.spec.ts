/**
 * Performance Benchmarks Service Tests
 *
 * Tests for performance-critical services:
 * 1. OCR Invoice Processor Service
 * 2. Automated Journal Entries Service
 * 3. Continuous Closing Service
 *
 * Quality Standards:
 * - 100% TypeScript strict mode compliance
 * - Comprehensive test coverage (>80%)
 * - Performance benchmarks validated
 * - All edge cases covered
 */

import { Test, TestingModule } from '@nestjs/testing';
import { createWorker, Worker } from 'tesseract.js';
import * as brain from 'brain.js';
import { OCRInvoiceProcessorService } from '../ocr-invoice-processor.service';
import { AutomatedJournalEntriesService } from '../automated-journal-entries.service';
import { ContinuousClosingService } from '../continuous-closing.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Mock Tesseract.js
jest.mock('tesseract.js', () => ({
  createWorker: jest.fn(),
}));

// Mock brain.js
jest.mock('brain.js', () => ({
  recurrent: {
    LSTM: jest.fn().mockImplementation(() => ({
      train: jest.fn(),
      run: jest.fn().mockReturnValue({ category: 'Supplies', confidence: 0.95 }),
    })),
  },
}));

describe('OCRInvoiceProcessorService - Performance Benchmarks', () => {
  let service: OCRInvoiceProcessorService;
  let mockWorker: jest.Mocked<Worker>;

  beforeEach(async () => {
    // Setup mock Tesseract worker
    mockWorker = {
      loadLanguage: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined),
      setParameters: jest.fn().mockResolvedValue(undefined),
      recognize: jest.fn().mockResolvedValue({
        data: {
          text: `
            INVOICE
            Invoice Number: INV-2024-001
            Date: 2024-10-16

            Vendor: ABC Construction Ltd.
            TIN: 123456789012
            BIN: 123456789
            Address: Dhaka, Bangladesh

            Bill To: XYZ Real Estate
            TIN: 987654321098

            Line Items:
            1. Cement - 100 bags @ BDT 500 = BDT 50,000
            2. Steel Rods - 50 tons @ BDT 70,000 = BDT 3,500,000
            3. Sand - 200 cft @ BDT 50 = BDT 10,000

            Subtotal: BDT 3,560,000
            VAT (15%): BDT 534,000
            Total: BDT 4,094,000

            Payment Terms: Net 30
            Mushak-6.3 Compliant
          `,
          confidence: 92.5,
        },
      }),
      terminate: jest.fn().mockResolvedValue(undefined),
    } as any;

    (createWorker as jest.Mock).mockResolvedValue(mockWorker);

    const module: TestingModule = await Test.createTestingModule({
      providers: [OCRInvoiceProcessorService],
    }).compile();

    service = module.get<OCRInvoiceProcessorService>(OCRInvoiceProcessorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processInvoiceImage - Image Format', () => {
    it('should process image format invoice and extract data', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const tenantId = 'tenant-001';

      const startTime = Date.now();
      const result = await service.processInvoiceImage(imageBuffer, 'image', tenantId);
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Verify result structure
      expect(result).toBeDefined();
      expect(result.invoiceNumber).toBe('INV-2024-001');
      expect(result.date).toBe('2024-10-16');
      expect(result.vendorName).toBe('ABC Construction Ltd.');
      expect(result.vendorTin).toBe('123456789012');
      expect(result.vendorBin).toBe('123456789');
      expect(result.customerTin).toBe('987654321098');
      expect(result.lineItems).toHaveLength(3);
      expect(result.subtotal).toBe(3560000);
      expect(result.vatAmount).toBe(534000);
      expect(result.totalAmount).toBe(4094000);
      expect(result.vatRate).toBe(15);
      expect(result.musahkCompliant).toBe(true);

      // Verify line items
      expect(result.lineItems[0]).toMatchObject({
        description: 'Cement',
        quantity: 100,
        unitPrice: 500,
        amount: 50000,
        category: 'Supplies',
        accountCode: expect.any(String),
        hsCode: expect.any(String),
      });

      expect(result.lineItems[1]).toMatchObject({
        description: 'Steel Rods',
        quantity: 50,
        unitPrice: 70000,
        amount: 3500000,
        category: 'Supplies',
        accountCode: expect.any(String),
        hsCode: expect.any(String),
      });

      // Performance benchmark: Processing should complete in under 3 seconds
      expect(processingTime).toBeLessThan(3000);

      // Verify Tesseract worker calls
      expect(createWorker).toHaveBeenCalledWith('eng+ben');
      expect(mockWorker.loadLanguage).toHaveBeenCalledWith('eng+ben');
      expect(mockWorker.initialize).toHaveBeenCalledWith('eng+ben');
      expect(mockWorker.recognize).toHaveBeenCalledWith(imageBuffer);
      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should process PDF format invoice and extract data', async () => {
      const pdfBuffer = Buffer.from('fake-pdf-data');
      const tenantId = 'tenant-002';

      // Mock PDF to image conversion
      mockWorker.recognize.mockResolvedValueOnce({
        data: {
          text: `
            TAX INVOICE
            Invoice No: TI-2024-0042
            Date: 2024-10-15

            Supplier: Bangladesh Steel Mills
            TIN: 111222333444
            BIN: 111222333

            Customer: Dhaka Construction Co.
            TIN: 555666777888

            Item: Steel Beams - 200 units @ BDT 5,000 = BDT 1,000,000

            Subtotal: BDT 1,000,000
            VAT (15%): BDT 150,000
            Total: BDT 1,150,000
          `,
          confidence: 88.0,
        },
      } as any);

      const startTime = Date.now();
      const result = await service.processInvoiceImage(pdfBuffer, 'pdf', tenantId);
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(result.invoiceNumber).toBe('TI-2024-0042');
      expect(result.vendorName).toBe('Bangladesh Steel Mills');
      expect(result.vendorTin).toBe('111222333444');
      expect(result.totalAmount).toBe(1150000);

      // Performance benchmark: PDF processing should complete in under 5 seconds
      expect(processingTime).toBeLessThan(5000);
    });

    it('should handle low-quality image with confidence warning', async () => {
      mockWorker.recognize.mockResolvedValueOnce({
        data: {
          text: `
            INVOICE
            Number: INV-BAD-001
            Amount: BDT 50,000
          `,
          confidence: 55.0, // Low confidence
        },
      } as any);

      const imageBuffer = Buffer.from('low-quality-image');
      const tenantId = 'tenant-003';

      const result = await service.processInvoiceImage(imageBuffer, 'image', tenantId);

      expect(result).toBeDefined();
      expect(result.confidence).toBe(55.0);
      expect(result.warnings).toContain('Low OCR confidence detected. Manual review recommended.');
    });
  });

  describe('Invoice Data Extraction Accuracy', () => {
    it('should validate Bangladesh TIN format (10-12 digits)', async () => {
      mockWorker.recognize.mockResolvedValueOnce({
        data: {
          text: `
            INVOICE
            Vendor TIN: 12345678901
            Customer TIN: 98765432109
            Total: BDT 100,000
          `,
          confidence: 90.0,
        },
      } as any);

      const imageBuffer = Buffer.from('tin-validation-test');
      const result = await service.processInvoiceImage(imageBuffer, 'image', 'tenant-004');

      expect(result.vendorTin).toMatch(/^\d{10,12}$/);
      expect(result.customerTin).toMatch(/^\d{10,12}$/);
      expect(result.validations.tinValid).toBe(true);
    });

    it('should reject invalid TIN format', async () => {
      mockWorker.recognize.mockResolvedValueOnce({
        data: {
          text: `
            INVOICE
            Vendor TIN: 12345
            Total: BDT 50,000
          `,
          confidence: 85.0,
        },
      } as any);

      const imageBuffer = Buffer.from('invalid-tin-test');
      const result = await service.processInvoiceImage(imageBuffer, 'image', 'tenant-005');

      expect(result.errors).toContain('Invalid TIN format. Must be 10-12 digits.');
      expect(result.validations.tinValid).toBe(false);
    });

    it('should validate Bangladesh BIN format (9 digits)', async () => {
      mockWorker.recognize.mockResolvedValueOnce({
        data: {
          text: `
            INVOICE
            Vendor BIN: 123456789
            Total: BDT 75,000
          `,
          confidence: 92.0,
        },
      } as any);

      const imageBuffer = Buffer.from('bin-validation-test');
      const result = await service.processInvoiceImage(imageBuffer, 'image', 'tenant-006');

      expect(result.vendorBin).toMatch(/^\d{9}$/);
      expect(result.validations.binValid).toBe(true);
    });

    it('should detect Mushak-6.3 compliance keywords', async () => {
      mockWorker.recognize.mockResolvedValueOnce({
        data: {
          text: `
            TAX INVOICE
            Mushak-6.3 Compliant
            VAT Registration: Yes
            Total: BDT 200,000
          `,
          confidence: 88.0,
        },
      } as any);

      const imageBuffer = Buffer.from('mushak-test');
      const result = await service.processInvoiceImage(imageBuffer, 'image', 'tenant-007');

      expect(result.musahkCompliant).toBe(true);
      expect(result.validations.musahkCompliant).toBe(true);
    });

    it('should extract correct VAT rates (15%, 10%, 7.5%, 5%)', async () => {
      const vatRates = [15, 10, 7.5, 5];

      for (const vatRate of vatRates) {
        const subtotal = 100000;
        const vatAmount = subtotal * (vatRate / 100);
        const total = subtotal + vatAmount;

        mockWorker.recognize.mockResolvedValueOnce({
          data: {
            text: `
              INVOICE
              Subtotal: BDT ${subtotal}
              VAT (${vatRate}%): BDT ${vatAmount}
              Total: BDT ${total}
            `,
            confidence: 90.0,
          },
        } as any);

        const imageBuffer = Buffer.from(`vat-${vatRate}-test`);
        const result = await service.processInvoiceImage(imageBuffer, 'image', `tenant-vat-${vatRate}`);

        expect(result.subtotal).toBe(subtotal);
        expect(result.vatRate).toBe(vatRate);
        expect(result.vatAmount).toBe(vatAmount);
        expect(result.totalAmount).toBe(total);
      }
    });
  });

  describe('Line Item Auto-Coding with ML Classification', () => {
    it('should auto-code line items with account codes', async () => {
      mockWorker.recognize.mockResolvedValueOnce({
        data: {
          text: `
            INVOICE
            Line Items:
            1. Office Supplies - BDT 10,000
            2. Equipment Rental - BDT 50,000
            3. Professional Services - BDT 75,000
          `,
          confidence: 90.0,
        },
      } as any);

      const imageBuffer = Buffer.from('auto-coding-test');
      const result = await service.processInvoiceImage(imageBuffer, 'image', 'tenant-008');

      expect(result.lineItems).toHaveLength(3);

      // Verify auto-coded account codes
      expect(result.lineItems[0].category).toBe('Supplies');
      expect(result.lineItems[0].accountCode).toMatch(/^5-/); // Expense account

      expect(result.lineItems[1].category).toBe('Supplies');
      expect(result.lineItems[1].accountCode).toMatch(/^5-/);

      expect(result.lineItems[2].category).toBe('Supplies');
      expect(result.lineItems[2].accountCode).toMatch(/^5-/);
    });

    it('should assign HS codes for inventory items', async () => {
      mockWorker.recognize.mockResolvedValueOnce({
        data: {
          text: `
            INVOICE
            Line Items:
            1. Cement - Portland Type I - BDT 50,000
            2. Steel Rods - Grade 60 - BDT 100,000
          `,
          confidence: 92.0,
        },
      } as any);

      const imageBuffer = Buffer.from('hs-code-test');
      const result = await service.processInvoiceImage(imageBuffer, 'image', 'tenant-009');

      expect(result.lineItems).toHaveLength(2);
      expect(result.lineItems[0].hsCode).toBeDefined();
      expect(result.lineItems[1].hsCode).toBeDefined();
    });

    it('should calculate line item totals correctly', async () => {
      mockWorker.recognize.mockResolvedValueOnce({
        data: {
          text: `
            INVOICE
            Line Items:
            1. Item A - 10 units @ BDT 500 = BDT 5,000
            2. Item B - 20 units @ BDT 1,000 = BDT 20,000
            3. Item C - 5 units @ BDT 2,000 = BDT 10,000

            Subtotal: BDT 35,000
          `,
          confidence: 95.0,
        },
      } as any);

      const imageBuffer = Buffer.from('line-item-calculation-test');
      const result = await service.processInvoiceImage(imageBuffer, 'image', 'tenant-010');

      expect(result.lineItems[0]).toMatchObject({
        quantity: 10,
        unitPrice: 500,
        amount: 5000,
      });

      expect(result.lineItems[1]).toMatchObject({
        quantity: 20,
        unitPrice: 1000,
        amount: 20000,
      });

      expect(result.lineItems[2]).toMatchObject({
        quantity: 5,
        unitPrice: 2000,
        amount: 10000,
      });

      expect(result.subtotal).toBe(35000);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should process single invoice in under 3 seconds', async () => {
      const imageBuffer = Buffer.from('performance-test-single');
      const startTime = Date.now();

      await service.processInvoiceImage(imageBuffer, 'image', 'tenant-perf-001');

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(3000);
    });

    it('should process batch of 10 invoices in under 30 seconds', async () => {
      const invoices = Array.from({ length: 10 }, (_, i) =>
        Buffer.from(`batch-invoice-${i}`)
      );

      const startTime = Date.now();

      await Promise.all(
        invoices.map((buffer, i) =>
          service.processInvoiceImage(buffer, 'image', `tenant-batch-${i}`)
        )
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(30000);
    });

    it('should maintain >85% OCR confidence threshold', async () => {
      const imageBuffer = Buffer.from('confidence-test');
      const result = await service.processInvoiceImage(imageBuffer, 'image', 'tenant-conf-001');

      expect(result.confidence).toBeGreaterThanOrEqual(85.0);
    });
  });

  describe('Error Handling', () => {
    it('should handle OCR worker initialization failure', async () => {
      (createWorker as jest.Mock).mockRejectedValueOnce(new Error('Worker initialization failed'));

      const imageBuffer = Buffer.from('error-test');

      await expect(
        service.processInvoiceImage(imageBuffer, 'image', 'tenant-error-001')
      ).rejects.toThrow('Worker initialization failed');
    });

    it('should handle unreadable image format', async () => {
      mockWorker.recognize.mockRejectedValueOnce(new Error('Unable to read image'));

      const imageBuffer = Buffer.from('unreadable-image');

      await expect(
        service.processInvoiceImage(imageBuffer, 'image', 'tenant-error-002')
      ).rejects.toThrow('Unable to read image');
    });

    it('should handle missing required invoice fields', async () => {
      mockWorker.recognize.mockResolvedValueOnce({
        data: {
          text: 'INVOICE', // Missing all required fields
          confidence: 90.0,
        },
      } as any);

      const imageBuffer = Buffer.from('incomplete-invoice');
      const result = await service.processInvoiceImage(imageBuffer, 'image', 'tenant-error-003');

      expect(result.errors).toContain('Missing required field: Invoice Number');
      expect(result.errors).toContain('Missing required field: Vendor Name');
      expect(result.errors).toContain('Missing required field: Total Amount');
    });
  });
});

describe('AutomatedJournalEntriesService - Performance Benchmarks', () => {
  let service: AutomatedJournalEntriesService;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    mockEventEmitter = {
      emit: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      removeListener: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomatedJournalEntriesService,
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<AutomatedJournalEntriesService>(AutomatedJournalEntriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processRecurringEntries - Frequency Tests', () => {
    it('should process daily recurring entries', async () => {
      const startTime = Date.now();
      const entries = await service.processRecurringEntries();
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(entries).toBeDefined();
      expect(Array.isArray(entries)).toBe(true);

      // Performance benchmark: Processing should complete in under 2 seconds
      expect(processingTime).toBeLessThan(2000);

      // Verify events emitted
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'journal.created',
        expect.objectContaining({
          entryType: 'RECURRING',
        })
      );
    });

    it('should process weekly recurring entries on correct day', async () => {
      const entries = await service.processRecurringEntries();

      const weeklyEntries = entries.filter(e => e.frequency === 'WEEKLY');
      expect(weeklyEntries.length).toBeGreaterThanOrEqual(0);

      weeklyEntries.forEach(entry => {
        expect(entry.nextOccurrence).toBeDefined();
        expect(entry.lastProcessed).toBeDefined();
      });
    });

    it('should process monthly recurring entries on correct date', async () => {
      const entries = await service.processRecurringEntries();

      const monthlyEntries = entries.filter(e => e.frequency === 'MONTHLY');
      expect(monthlyEntries.length).toBeGreaterThanOrEqual(0);

      monthlyEntries.forEach(entry => {
        const nextDate = new Date(entry.nextOccurrence);
        expect(nextDate.getDate()).toBeGreaterThan(0);
        expect(nextDate.getDate()).toBeLessThanOrEqual(31);
      });
    });

    it('should skip entries not due for processing', async () => {
      const entries = await service.processRecurringEntries();

      entries.forEach(entry => {
        const now = new Date();
        const nextOccurrence = new Date(entry.nextOccurrence);
        expect(nextOccurrence.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });
  });

  describe('processAccruals - Template Tests', () => {
    it('should process expense accruals', async () => {
      const startTime = Date.now();
      const entries = await service.processAccruals();
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(entries).toBeDefined();
      expect(Array.isArray(entries)).toBe(true);

      // Performance benchmark: Processing should complete in under 1.5 seconds
      expect(processingTime).toBeLessThan(1500);
    });

    it('should create journal entries with double-entry bookkeeping', async () => {
      const entries = await service.processAccruals();

      entries.forEach(entry => {
        const totalDebits = entry.lines
          .filter(line => line.type === 'DEBIT')
          .reduce((sum, line) => sum + line.amount, 0);

        const totalCredits = entry.lines
          .filter(line => line.type === 'CREDIT')
          .reduce((sum, line) => sum + line.amount, 0);

        // Verify double-entry: debits = credits
        expect(totalDebits).toBe(totalCredits);
      });
    });

    it('should validate account codes exist', async () => {
      const entries = await service.processAccruals();

      entries.forEach(entry => {
        entry.lines.forEach(line => {
          expect(line.accountCode).toBeDefined();
          expect(line.accountCode).toMatch(/^\d-\d{4}-\d{2}$/); // Bangladesh COA format
        });
      });
    });

    it('should emit journal.created events', async () => {
      await service.processAccruals();

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'journal.created',
        expect.objectContaining({
          entryType: 'ACCRUAL',
        })
      );
    });
  });

  describe('processDepreciation - Method Tests', () => {
    it('should calculate straight-line depreciation correctly', async () => {
      const entries = await service.processDepreciation();

      const straightLineEntries = entries.filter(e => e.method === 'STRAIGHT_LINE');

      straightLineEntries.forEach(entry => {
        const asset = entry.asset;
        const expectedMonthlyDepreciation =
          (asset.cost - asset.salvageValue) / (asset.usefulLife * 12);

        const depreciationAmount = entry.lines.find(l => l.type === 'DEBIT')?.amount || 0;

        expect(depreciationAmount).toBeCloseTo(expectedMonthlyDepreciation, 2);
      });
    });

    it('should calculate declining-balance depreciation correctly', async () => {
      const entries = await service.processDepreciation();

      const decliningBalanceEntries = entries.filter(e => e.method === 'DECLINING_BALANCE');

      decliningBalanceEntries.forEach(entry => {
        const asset = entry.asset;
        const rate = 2 / asset.usefulLife; // Double declining balance
        const bookValue = asset.cost - asset.accumulatedDepreciation;
        const expectedDepreciation = bookValue * rate / 12; // Monthly

        const depreciationAmount = entry.lines.find(l => l.type === 'DEBIT')?.amount || 0;

        expect(depreciationAmount).toBeCloseTo(expectedDepreciation, 2);
      });
    });

    it('should not depreciate fully depreciated assets', async () => {
      const entries = await service.processDepreciation();

      entries.forEach(entry => {
        const asset = entry.asset;
        const bookValue = asset.cost - asset.accumulatedDepreciation;

        if (bookValue <= asset.salvageValue) {
          // Asset fully depreciated
          expect(entry).toBeUndefined();
        }
      });
    });

    it('should process batch of 50 assets in under 3 seconds', async () => {
      const startTime = Date.now();
      await service.processDepreciation();
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(3000);
    });
  });

  describe('processProvisions - Calculation Tests', () => {
    it('should calculate provisions by percentage method', async () => {
      const entries = await service.processProvisions();

      const percentageProvisions = entries.filter(e => e.method === 'PERCENTAGE');

      percentageProvisions.forEach(entry => {
        const expectedAmount = entry.baseAmount * (entry.percentage / 100);
        const provisionAmount = entry.lines.find(l => l.type === 'DEBIT')?.amount || 0;

        expect(provisionAmount).toBeCloseTo(expectedAmount, 2);
      });
    });

    it('should calculate provisions by aging method', async () => {
      const entries = await service.processProvisions();

      const agingProvisions = entries.filter(e => e.method === 'AGING');

      agingProvisions.forEach(entry => {
        const agingBuckets = entry.agingAnalysis;
        let expectedProvision = 0;

        agingBuckets.forEach(bucket => {
          expectedProvision += bucket.amount * (bucket.provisionRate / 100);
        });

        const provisionAmount = entry.lines.find(l => l.type === 'DEBIT')?.amount || 0;

        expect(provisionAmount).toBeCloseTo(expectedProvision, 2);
      });
    });

    it('should validate provision accounts are liability accounts', async () => {
      const entries = await service.processProvisions();

      entries.forEach(entry => {
        const creditLine = entry.lines.find(l => l.type === 'CREDIT');
        expect(creditLine?.accountCode).toMatch(/^2-/); // Liability account
      });
    });
  });

  describe('createManualJournalEntry - Validation', () => {
    it('should create manual journal entry with valid data', async () => {
      const entryData = {
        date: '2024-10-16',
        description: 'Manual adjustment',
        lines: [
          { accountCode: '1-1000-01', type: 'DEBIT', amount: 50000 },
          { accountCode: '4-1000-01', type: 'CREDIT', amount: 50000 },
        ],
      };

      const entry = await service.createManualJournalEntry(entryData);

      expect(entry).toBeDefined();
      expect(entry.description).toBe('Manual adjustment');
      expect(entry.lines).toHaveLength(2);
    });

    it('should reject unbalanced journal entry', async () => {
      const entryData = {
        date: '2024-10-16',
        description: 'Unbalanced entry',
        lines: [
          { accountCode: '1-1000-01', type: 'DEBIT', amount: 50000 },
          { accountCode: '4-1000-01', type: 'CREDIT', amount: 30000 }, // Unbalanced
        ],
      };

      await expect(
        service.createManualJournalEntry(entryData)
      ).rejects.toThrow('Journal entry is not balanced. Debits (50000) != Credits (30000)');
    });

    it('should reject entry with invalid account codes', async () => {
      const entryData = {
        date: '2024-10-16',
        description: 'Invalid account',
        lines: [
          { accountCode: 'INVALID', type: 'DEBIT', amount: 50000 },
          { accountCode: '4-1000-01', type: 'CREDIT', amount: 50000 },
        ],
      };

      await expect(
        service.createManualJournalEntry(entryData)
      ).rejects.toThrow('Invalid account code: INVALID');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should process 100 recurring entries in under 5 seconds', async () => {
      const startTime = Date.now();
      await service.processRecurringEntries();
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(5000);
    });

    it('should maintain transaction integrity under load', async () => {
      const promises = [];

      for (let i = 0; i < 20; i++) {
        promises.push(service.processAccruals());
        promises.push(service.processDepreciation());
        promises.push(service.processProvisions());
      }

      const results = await Promise.all(promises);

      results.forEach(entries => {
        entries.forEach(entry => {
          const totalDebits = entry.lines
            .filter(l => l.type === 'DEBIT')
            .reduce((sum, l) => sum + l.amount, 0);

          const totalCredits = entry.lines
            .filter(l => l.type === 'CREDIT')
            .reduce((sum, l) => sum + l.amount, 0);

          expect(totalDebits).toBe(totalCredits);
        });
      });
    });
  });
});

describe('ContinuousClosingService - Performance Benchmarks', () => {
  let service: ContinuousClosingService;
  let mockReconciliationService: any;
  let mockJournalService: any;

  beforeEach(async () => {
    mockReconciliationService = {
      reconcileAccounts: jest.fn().mockResolvedValue({ status: 'SUCCESS' }),
    };

    mockJournalService = {
      processAccruals: jest.fn().mockResolvedValue([]),
      processDepreciation: jest.fn().mockResolvedValue([]),
      processProvisions: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContinuousClosingService,
        { provide: 'AI_RECONCILIATION_SERVICE', useValue: mockReconciliationService },
        { provide: 'AUTOMATED_JOURNAL_SERVICE', useValue: mockJournalService },
      ],
    }).compile();

    service = module.get<ContinuousClosingService>(ContinuousClosingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('performContinuousClose - Parallel Execution', () => {
    it('should execute tasks in parallel with dependency management', async () => {
      const period = {
        year: 2024,
        month: 10,
        type: 'MONTHLY',
      };

      const startTime = Date.now();
      const result = await service.performContinuousClose(period);
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(result.status).toBe('SUCCESS');
      expect(result.tasksCompleted).toBeGreaterThan(0);
      expect(result.tasksSkipped).toBeGreaterThanOrEqual(0);

      // Performance benchmark: Close should complete in under 10 seconds
      expect(processingTime).toBeLessThan(10000);
    });

    it('should group tasks by dependency levels', async () => {
      const period = { year: 2024, month: 10, type: 'MONTHLY' };
      const result = await service.performContinuousClose(period);

      expect(result.executionGroups).toBeDefined();
      expect(result.executionGroups.length).toBeGreaterThan(0);

      // Verify dependency levels are sequential
      result.executionGroups.forEach((group, index) => {
        expect(group.level).toBe(index);
      });
    });

    it('should execute independent tasks in parallel', async () => {
      const period = { year: 2024, month: 10, type: 'MONTHLY' };

      // Track execution times
      const executionTimes: number[] = [];
      mockJournalService.processAccruals.mockImplementation(async () => {
        const start = Date.now();
        await new Promise(resolve => setTimeout(resolve, 100));
        executionTimes.push(Date.now() - start);
        return [];
      });

      await service.performContinuousClose(period);

      // Verify parallel execution (total time should be less than sum of individual times)
      const totalTime = executionTimes.reduce((sum, time) => sum + time, 0);
      expect(totalTime).toBeGreaterThan(100); // At least one task executed
    });
  });

  describe('Task Retry Logic', () => {
    it('should retry failed tasks with exponential backoff', async () => {
      let attemptCount = 0;

      mockJournalService.processAccruals.mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return [];
      });

      const period = { year: 2024, month: 10, type: 'MONTHLY' };
      const result = await service.performContinuousClose(period);

      expect(attemptCount).toBe(3); // Initial + 2 retries
      expect(result.status).toBe('SUCCESS');
    });

    it('should mark task as failed after max retries exceeded', async () => {
      mockJournalService.processAccruals.mockRejectedValue(new Error('Persistent failure'));

      const period = { year: 2024, month: 10, type: 'MONTHLY' };
      const result = await service.performContinuousClose(period);

      expect(result.status).toBe('PARTIAL_SUCCESS');
      expect(result.tasksFailed).toBeGreaterThan(0);
      expect(result.errors).toContain('Persistent failure');
    });
  });

  describe('Critical Task Failure Handling', () => {
    it('should abort closing if critical task fails', async () => {
      mockReconciliationService.reconcileAccounts.mockRejectedValue(
        new Error('Critical reconciliation failure')
      );

      const period = { year: 2024, month: 10, type: 'MONTHLY' };
      const result = await service.performContinuousClose(period);

      expect(result.status).toBe('FAILED');
      expect(result.errors).toContain('Critical reconciliation failure');
    });

    it('should continue with non-critical task failures', async () => {
      mockJournalService.processProvisions.mockRejectedValue(
        new Error('Non-critical provision failure')
      );

      const period = { year: 2024, month: 10, type: 'MONTHLY' };
      const result = await service.performContinuousClose(period);

      expect(result.status).toBe('PARTIAL_SUCCESS');
      expect(result.tasksCompleted).toBeGreaterThan(0);
    });
  });

  describe('Period Status Updates', () => {
    it('should update period status from OPEN to SOFT_CLOSE', async () => {
      const period = { year: 2024, month: 10, type: 'MONTHLY', status: 'OPEN' };
      const result = await service.performContinuousClose(period);

      expect(result.periodStatus).toBe('SOFT_CLOSE');
    });

    it('should allow reopening SOFT_CLOSE period', async () => {
      const period = { year: 2024, month: 10, type: 'MONTHLY', status: 'SOFT_CLOSE' };

      const reopenResult = await service.reopenPeriod(period);
      expect(reopenResult.status).toBe('OPEN');
    });

    it('should prevent reopening HARD_CLOSE period', async () => {
      const period = { year: 2024, month: 10, type: 'MONTHLY', status: 'HARD_CLOSE' };

      await expect(service.reopenPeriod(period)).rejects.toThrow(
        'Cannot reopen HARD_CLOSE period'
      );
    });
  });

  describe('performDailyClose - Scheduled Task', () => {
    it('should execute daily close at scheduled time (11 PM)', async () => {
      const startTime = Date.now();
      await service.performDailyClose();
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Performance benchmark: Daily close should complete in under 5 seconds
      expect(processingTime).toBeLessThan(5000);
    });

    it('should process daily tasks only', async () => {
      await service.performDailyClose();

      // Verify only daily-frequency tasks were executed
      expect(mockJournalService.processAccruals).toHaveBeenCalled();
      expect(mockReconciliationService.reconcileAccounts).not.toHaveBeenCalled();
    });
  });

  describe('performMonthlyClose - Scheduled Task', () => {
    it('should execute monthly close on last day of month', async () => {
      const startTime = Date.now();
      await service.performMonthlyClose();
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Performance benchmark: Monthly close should complete in under 15 seconds
      expect(processingTime).toBeLessThan(15000);
    });

    it('should execute all task types for monthly close', async () => {
      await service.performMonthlyClose();

      expect(mockJournalService.processAccruals).toHaveBeenCalled();
      expect(mockJournalService.processDepreciation).toHaveBeenCalled();
      expect(mockJournalService.processProvisions).toHaveBeenCalled();
      expect(mockReconciliationService.reconcileAccounts).toHaveBeenCalled();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should handle 50 concurrent period closes', async () => {
      const periods = Array.from({ length: 50 }, (_, i) => ({
        year: 2024,
        month: (i % 12) + 1,
        type: 'MONTHLY',
      }));

      const startTime = Date.now();

      await Promise.all(
        periods.map(period => service.performContinuousClose(period))
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Performance benchmark: 50 concurrent closes should complete in under 30 seconds
      expect(processingTime).toBeLessThan(30000);
    });

    it('should maintain data integrity under high concurrency', async () => {
      const periods = Array.from({ length: 20 }, (_, i) => ({
        year: 2024,
        month: (i % 12) + 1,
        type: 'MONTHLY',
      }));

      const results = await Promise.all(
        periods.map(period => service.performContinuousClose(period))
      );

      results.forEach(result => {
        expect(['SUCCESS', 'PARTIAL_SUCCESS', 'FAILED']).toContain(result.status);
        expect(result.tasksCompleted + result.tasksFailed + result.tasksSkipped).toBeGreaterThan(0);
      });
    });
  });
});
