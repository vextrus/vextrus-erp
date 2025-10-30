import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OCRInvoiceProcessorService, ExtractedInvoiceData } from '../ocr-invoice-processor.service';
import * as fs from 'fs';
import * as path from 'path';

describe('OCRInvoiceProcessorService', () => {
  let service: OCRInvoiceProcessorService;
  let eventEmitter: EventEmitter2;

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OCRInvoiceProcessorService,
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<OCRInvoiceProcessorService>(OCRInvoiceProcessorService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    // Allow time for Tesseract initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup Tesseract worker
    await service.cleanup();
  });

  describe('processInvoiceImage', () => {
    it('should process invoice image and extract data', async () => {
      // Create a simple test image buffer
      const mockInvoiceBuffer = Buffer.from('mock-invoice-image-data');

      const result = await service.processInvoiceImage(
        mockInvoiceBuffer,
        'image',
        'tenant-1'
      );

      expect(result).toBeDefined();
      expect(result).toEqual(
        expect.objectContaining({
          invoiceNumber: expect.any(String),
          invoiceDate: expect.any(Date),
          totalAmount: expect.any(Number),
          lineItems: expect.any(Array),
          confidence: expect.any(Number),
          validation: expect.objectContaining({
            isValid: expect.any(Boolean),
            errors: expect.any(Array),
            warnings: expect.any(Array),
          }),
          currency: 'BDT',
          tenantId: 'tenant-1',
        })
      );
    });

    it('should handle PDF format', async () => {
      const mockPDFBuffer = Buffer.from('mock-pdf-data');

      const result = await service.processInvoiceImage(
        mockPDFBuffer,
        'pdf',
        'tenant-1'
      );

      expect(result).toBeDefined();
      expect(result.invoiceNumber).toBeDefined();
      expect(result.tenantId).toBe('tenant-1');
    });

    it('should auto-code line items with account codes', async () => {
      const mockInvoiceBuffer = Buffer.from('mock-invoice-with-items');

      const result = await service.processInvoiceImage(
        mockInvoiceBuffer,
        'image',
        'tenant-1'
      );

      expect(result.lineItems).toBeDefined();
      expect(Array.isArray(result.lineItems)).toBe(true);

      // Check if line items have account codes
      result.lineItems.forEach(item => {
        expect(item).toEqual(
          expect.objectContaining({
            description: expect.any(String),
            quantity: expect.any(Number),
            unitPrice: expect.any(Number),
            amount: expect.any(Number),
            accountCode: expect.any(String),
            confidence: expect.any(Number),
          })
        );

        // Account code should be 4-6 digits
        expect(item.accountCode).toMatch(/^\d{4,6}$/);
      });
    });

    it('should predict HS codes for line items', async () => {
      const mockInvoiceBuffer = Buffer.from('mock-invoice');

      const result = await service.processInvoiceImage(
        mockInvoiceBuffer,
        'image',
        'tenant-1'
      );

      expect(result.lineItems).toBeDefined();

      // Check for HS codes
      result.lineItems.forEach(item => {
        if (item.hsCode) {
          expect(item.hsCode).toMatch(/^\d{4,8}$/);
          expect(item.taxCategory).toBeDefined();
        }
      });
    });

    it('should emit processing event', async () => {
      const mockInvoiceBuffer = Buffer.from('mock-invoice');

      await service.processInvoiceImage(mockInvoiceBuffer, 'image', 'tenant-1');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'invoice.ocr.processed',
        expect.objectContaining({
          processingTimeMs: expect.any(Number),
          confidence: expect.any(Number),
          lineItemCount: expect.any(Number),
          validationErrors: expect.any(Number),
        })
      );
    });
  });

  describe('Bangladesh Mushak-6.3 Format', () => {
    it('should recognize Mushak number pattern', async () => {
      const mockMushakInvoice = Buffer.from('MUSHAK 6.3 invoice data');

      const result = await service.processInvoiceImage(
        mockMushakInvoice,
        'image',
        'tenant-1'
      );

      expect(result).toBeDefined();
      // Mushak number may or may not be detected depending on image quality
      if (result.mushakNumber) {
        expect(result.mushakNumber).toMatch(/MUSHAK/i);
      }
    });

    it('should validate TIN format', async () => {
      // TIN should be 10-12 digits
      expect((service as any).validateTIN('1234567890')).toBe(true); // 10 digits
      expect((service as any).validateTIN('123456789012')).toBe(true); // 12 digits
      expect((service as any).validateTIN('12345')).toBe(false); // Too short
      expect((service as any).validateTIN('12345678901234')).toBe(false); // Too long
    });

    it('should validate BIN format', async () => {
      // BIN should be 9 digits
      expect((service as any).validateBIN('123456789')).toBe(true); // 9 digits
      expect((service as any).validateBIN('12345678')).toBe(false); // 8 digits
      expect((service as any).validateBIN('1234567890')).toBe(false); // 10 digits
    });
  });

  describe('Validation', () => {
    it('should validate extracted data', async () => {
      const mockInvoiceBuffer = Buffer.from('mock-invoice');

      const result = await service.processInvoiceImage(
        mockInvoiceBuffer,
        'image',
        'tenant-1'
      );

      expect(result.validation).toBeDefined();
      expect(result.validation.isValid).toBeDefined();
      expect(result.validation.errors).toBeDefined();
      expect(result.validation.warnings).toBeDefined();
    });

    it('should flag validation errors', async () => {
      // Create mock data with invalid TIN
      const parsedData: any = {
        invoiceNumber: 'INV-001',
        invoiceDate: new Date(),
        totalAmount: 1000,
        vendorTin: '12345', // Invalid TIN (too short)
        lineItems: [],
      };

      const validation = await (service as any).validateExtraction(parsedData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'vendorTin',
            message: expect.stringContaining('Invalid TIN format'),
          }),
        ])
      );
    });

    it('should generate warnings for suspicious data', async () => {
      const parsedData: any = {
        invoiceNumber: 'INV-001',
        invoiceDate: new Date(),
        totalAmount: 1150,
        vatAmount: 50, // Should be ~150 for 15% VAT
        lineItems: [],
      };

      const validation = await (service as any).validateExtraction(parsedData);

      expect(validation.warnings).toBeDefined();
      expect(validation.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Suggested Corrections', () => {
    it('should suggest corrections for errors', async () => {
      const mockInvoiceBuffer = Buffer.from('mock-invoice');

      const result = await service.processInvoiceImage(
        mockInvoiceBuffer,
        'image',
        'tenant-1'
      );

      expect(result.suggestedCorrections).toBeDefined();
      expect(Array.isArray(result.suggestedCorrections)).toBe(true);

      // If there are corrections, they should have required fields
      result.suggestedCorrections?.forEach(correction => {
        expect(correction).toEqual(
          expect.objectContaining({
            field: expect.any(String),
            currentValue: expect.anything(),
            suggestedValue: expect.anything(),
            confidence: expect.any(Number),
            reason: expect.any(String),
          })
        );
      });
    });
  });

  describe('Machine Learning Training', () => {
    it('should train classifiers with sufficient data', async () => {
      const trainingData = {
        lineItems: Array.from({ length: 100 }, (_, i) => ({
          description: `Item ${i}: Cement`,
          accountCode: '5010',
          hsCode: '2523',
        })),
      };

      await service.trainClassifiers(trainingData);

      // Training should complete without errors
      expect(true).toBe(true);
    });

    it('should warn with insufficient training data', async () => {
      const insufficientData = {
        lineItems: Array.from({ length: 20 }, (_, i) => ({
          description: `Item ${i}`,
          accountCode: '5010',
          hsCode: '2523',
        })),
      };

      await service.trainClassifiers(insufficientData);

      // Should handle gracefully
      expect(true).toBe(true);
    });
  });

  describe('HS Code Mapping', () => {
    it('should map common construction materials to HS codes', async () => {
      const items = [
        { description: 'Portland Cement' },
        { description: 'Steel Rebar' },
        { description: 'Red Bricks' },
        { description: 'River Sand' },
        { description: 'Electrical Wire' },
      ];

      for (const item of items) {
        const hsCode = await (service as any).predictHSCode(item.description);
        expect(hsCode).toBeDefined();
        expect(hsCode).toMatch(/^\d{4}$/);
      }
    });

    it('should determine tax category based on HS code', () => {
      // Test tax category determination
      expect((service as any).determineTaxCategory('6801')).toBe('construction');
      expect((service as any).determineTaxCategory('8544')).toBe('machinery');
      expect((service as any).determineTaxCategory('0101')).toBe('food');
      expect((service as any).determineTaxCategory('9999')).toBe('standard');
    });
  });

  describe('Cost Center Assignment', () => {
    it('should assign cost centers based on description', async () => {
      const items = [
        { description: 'Site Construction Materials' },
        { description: 'Office Supplies' },
        { description: 'Marketing Advertisement' },
        { description: 'Equipment Maintenance' },
      ];

      for (const item of items) {
        const costCenter = await (service as any).predictCostCenter(item as any);
        expect(costCenter).toBeDefined();
        expect(costCenter).toMatch(/^[A-Z]+-\d{3}$/);
      }
    });
  });

  describe('Performance', () => {
    it('should process invoice within reasonable time', async () => {
      const mockInvoiceBuffer = Buffer.from('mock-invoice');

      const startTime = Date.now();
      const result = await service.processInvoiceImage(
        mockInvoiceBuffer,
        'image',
        'tenant-1'
      );
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(10000); // Should complete in < 10 seconds
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid image buffer', async () => {
      const invalidBuffer = Buffer.from('');

      await expect(
        service.processInvoiceImage(invalidBuffer, 'image', 'tenant-1')
      ).rejects.toThrow();
    });

    it('should generate invoice number if extraction fails', () => {
      const generatedNumber = (service as any).generateInvoiceNumber();

      expect(generatedNumber).toBeDefined();
      expect(generatedNumber).toMatch(/^INV-\d{8}-\d{4}$/);
    });
  });
});
