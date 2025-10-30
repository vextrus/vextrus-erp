import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TaxCalculationService, TaxType, VendorType, ProductCategory } from '../tax-calculation.service';
import Decimal from 'decimal.js';

describe('TaxCalculationService', () => {
  let service: TaxCalculationService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxCalculationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-value'),
          },
        },
      ],
    }).compile();

    service = module.get<TaxCalculationService>(TaxCalculationService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('VAT Calculation', () => {
    it('should calculate standard VAT at 15%', async () => {
      const result = await service.calculateTax({
        amount: 1000,
        taxType: TaxType.VAT,
        isExempt: false,
      });

      expect(result.taxAmount).toBe(150); // 15% of 1000
      expect(result.totalAmount).toBe(1150);
      expect(result.taxRate).toBe(0.15);
    });

    it('should return zero VAT for exempt products', async () => {
      const result = await service.calculateTax({
        amount: 1000,
        taxType: TaxType.VAT,
        isExempt: true,
      });

      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(1000);
    });

    it('should return zero VAT for exempt product category', async () => {
      const result = await service.calculateTax({
        amount: 1000,
        taxType: TaxType.VAT,
        productCategory: ProductCategory.EXEMPT,
      });

      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(1000);
    });
  });

  describe('TDS Calculation', () => {
    it('should calculate TDS for contractor at 7%', async () => {
      const result = await service.calculateTax({
        amount: 10000,
        taxType: TaxType.TDS,
        vendorType: VendorType.CONTRACTOR,
        hasTIN: true,
      });

      expect(result.taxAmount).toBe(700); // 7% of 10000
      expect(result.taxRate).toBe(0.07);
    });

    it('should calculate TDS for professional at 10%', async () => {
      const result = await service.calculateTax({
        amount: 10000,
        taxType: TaxType.TDS,
        vendorType: VendorType.PROFESSIONAL,
        hasTIN: true,
      });

      expect(result.taxAmount).toBe(1000); // 10% of 10000
      expect(result.taxRate).toBe(0.1);
    });

    it('should apply 1.5x rate for vendors without TIN', async () => {
      const result = await service.calculateTax({
        amount: 10000,
        taxType: TaxType.TDS,
        vendorType: VendorType.CONTRACTOR,
        hasTIN: false,
      });

      expect(result.taxAmount).toBe(1050); // 7% * 1.5 = 10.5% of 10000
      expect(result.taxRate).toBe(0.105);
    });

    it('should calculate TDS for supplier at 4%', async () => {
      const result = await service.calculateTax({
        amount: 10000,
        taxType: TaxType.TDS,
        vendorType: VendorType.SUPPLIER,
        hasTIN: true,
      });

      expect(result.taxAmount).toBe(400); // 4% of 10000
    });

    it('should calculate TDS for rent at 5%', async () => {
      const result = await service.calculateTax({
        amount: 50000,
        taxType: TaxType.TDS,
        vendorType: VendorType.RENT,
        hasTIN: true,
      });

      expect(result.taxAmount).toBe(2500); // 5% of 50000
    });

    it('should calculate TDS for transport at 3%', async () => {
      const result = await service.calculateTax({
        amount: 20000,
        taxType: TaxType.TDS,
        vendorType: VendorType.TRANSPORT,
        hasTIN: true,
      });

      expect(result.taxAmount).toBe(600); // 3% of 20000
    });
  });

  describe('AIT Calculation', () => {
    it('should calculate AIT for import at 5%', async () => {
      const result = await service.calculateTax({
        amount: 100000,
        taxType: TaxType.AIT,
        vendorType: VendorType.IMPORT,
      });

      expect(result.taxAmount).toBe(5000); // 5% of 100000
      expect(result.taxRate).toBe(0.05);
    });

    it('should calculate AIT for export at 1%', async () => {
      const result = await service.calculateTax({
        amount: 100000,
        taxType: TaxType.AIT,
        vendorType: VendorType.EXPORT,
      });

      expect(result.taxAmount).toBe(1000); // 1% of 100000
      expect(result.taxRate).toBe(0.01);
    });

    it('should calculate AIT for contractor at 6%', async () => {
      const result = await service.calculateTax({
        amount: 100000,
        taxType: TaxType.AIT,
        vendorType: VendorType.CONTRACTOR,
      });

      expect(result.taxAmount).toBe(6000); // 6% of 100000
    });

    it('should calculate AIT for supplier at 4%', async () => {
      const result = await service.calculateTax({
        amount: 100000,
        taxType: TaxType.AIT,
        vendorType: VendorType.SUPPLIER,
      });

      expect(result.taxAmount).toBe(4000); // 4% of 100000
    });
  });

  describe('Supplementary Duty Calculation', () => {
    it('should calculate supplementary duty for luxury items at 20%', async () => {
      const result = await service.calculateTax({
        amount: 50000,
        taxType: TaxType.SUPPLEMENTARY_DUTY,
        productCategory: ProductCategory.LUXURY,
      });

      expect(result.taxAmount).toBe(10000); // 20% of 50000
      expect(result.taxRate).toBe(0.2);
    });

    it('should calculate supplementary duty for tobacco at 35%', async () => {
      const result = await service.calculateTax({
        amount: 10000,
        taxType: TaxType.SUPPLEMENTARY_DUTY,
        productCategory: ProductCategory.TOBACCO,
      });

      expect(result.taxAmount).toBe(3500); // 35% of 10000
      expect(result.taxRate).toBe(0.35);
    });

    it('should calculate supplementary duty for beverages at 25%', async () => {
      const result = await service.calculateTax({
        amount: 10000,
        taxType: TaxType.SUPPLEMENTARY_DUTY,
        productCategory: ProductCategory.BEVERAGE,
      });

      expect(result.taxAmount).toBe(2500); // 25% of 10000
    });

    it('should calculate supplementary duty for electronics at 10%', async () => {
      const result = await service.calculateTax({
        amount: 100000,
        taxType: TaxType.SUPPLEMENTARY_DUTY,
        productCategory: ProductCategory.ELECTRONICS,
      });

      expect(result.taxAmount).toBe(10000); // 10% of 100000
    });

    it('should return zero for standard products', async () => {
      const result = await service.calculateTax({
        amount: 10000,
        taxType: TaxType.SUPPLEMENTARY_DUTY,
        productCategory: ProductCategory.STANDARD,
      });

      expect(result.taxAmount).toBe(0);
    });
  });

  describe('Fiscal Year Calculation', () => {
    it('should correctly determine fiscal year for July-December', () => {
      const testDate = new Date(2024, 6, 15); // July 15, 2024
      const fiscalYear = service.getCurrentFiscalYear(testDate);

      expect(fiscalYear.year).toBe('2024-2025');
      expect(fiscalYear.startDate).toEqual(new Date(2024, 6, 1));
      expect(fiscalYear.endDate).toEqual(new Date(2025, 5, 30));
      expect(fiscalYear.currentQuarter).toBe(1);
      expect(fiscalYear.currentMonth).toBe(1); // July is month 1 of fiscal year
    });

    it('should correctly determine fiscal year for January-June', () => {
      const testDate = new Date(2025, 0, 15); // January 15, 2025
      const fiscalYear = service.getCurrentFiscalYear(testDate);

      expect(fiscalYear.year).toBe('2024-2025');
      expect(fiscalYear.startDate).toEqual(new Date(2024, 6, 1));
      expect(fiscalYear.endDate).toEqual(new Date(2025, 5, 30));
      expect(fiscalYear.currentQuarter).toBe(3);
      expect(fiscalYear.currentMonth).toBe(7); // January is month 7 of fiscal year
    });

    it('should correctly calculate quarters', () => {
      // Q1: July-September
      let fiscalYear = service.getCurrentFiscalYear(new Date(2024, 7, 15)); // August
      expect(fiscalYear.currentQuarter).toBe(1);

      // Q2: October-December
      fiscalYear = service.getCurrentFiscalYear(new Date(2024, 10, 15)); // November
      expect(fiscalYear.currentQuarter).toBe(2);

      // Q3: January-March
      fiscalYear = service.getCurrentFiscalYear(new Date(2025, 1, 15)); // February
      expect(fiscalYear.currentQuarter).toBe(3);

      // Q4: April-June
      fiscalYear = service.getCurrentFiscalYear(new Date(2025, 4, 15)); // May
      expect(fiscalYear.currentQuarter).toBe(4);
    });
  });

  describe('Tax Due Date Calculation', () => {
    it('should calculate VAT due date as 15th of next month', () => {
      const transactionDate = new Date(2024, 0, 20); // January 20, 2024
      const dueDate = service.calculateTaxDueDate(TaxType.VAT, transactionDate);

      expect(dueDate.getDate()).toBe(15);
      expect(dueDate.getMonth()).toBe(1); // February
    });

    it('should calculate TDS due date as 7 days from transaction', () => {
      const transactionDate = new Date(2024, 0, 10);
      const dueDate = service.calculateTaxDueDate(TaxType.TDS, transactionDate);

      const expectedDate = new Date(2024, 0, 17);
      expect(dueDate.getDate()).toBe(expectedDate.getDate());
    });

    it('should adjust weekend due dates to next working day', () => {
      // If due date falls on Friday (weekend in Bangladesh)
      const transactionDate = new Date(2024, 0, 8); // Results in Friday the 15th
      const dueDate = service.calculateTaxDueDate(TaxType.TDS, transactionDate);

      const dayOfWeek = dueDate.getDay();
      expect(dayOfWeek).not.toBe(5); // Not Friday
      expect(dayOfWeek).not.toBe(6); // Not Saturday
    });
  });

  describe('Combined Tax Calculation', () => {
    it('should calculate multiple taxes correctly', async () => {
      const result = await service.calculateCombinedTaxes(
        10000,
        VendorType.SUPPLIER,
        ProductCategory.STANDARD,
        true,
        true,  // includeVAT
        true,  // includeTDS
        false  // includeSupplementaryDuty
      );

      expect(result.originalAmount).toBe(10000);
      expect(result.breakdown).toHaveLength(2); // VAT and TDS

      // VAT: 15% = 1500
      // TDS: 4% = 400
      // Total tax = 1900
      expect(result.totalTaxAmount).toBe(1900);
      expect(result.totalAmount).toBe(11900);
    });

    it('should handle exemptions in combined calculation', async () => {
      const result = await service.calculateCombinedTaxes(
        10000,
        VendorType.SUPPLIER,
        ProductCategory.EXEMPT,
        true,
        true,  // includeVAT
        true,  // includeTDS
        false  // includeSupplementaryDuty
      );

      // VAT should be 0 for exempt category
      // TDS should still apply
      expect(result.totalTaxAmount).toBe(400); // Only TDS
    });
  });

  describe('Validation Methods', () => {
    it('should validate correct TIN format (10-12 digits)', () => {
      expect(service.validateTIN('1234567890')).toBe(true);    // 10 digits
      expect(service.validateTIN('12345678901')).toBe(true);   // 11 digits
      expect(service.validateTIN('123456789012')).toBe(true);  // 12 digits
      expect(service.validateTIN('123456789')).toBe(false);    // 9 digits
      expect(service.validateTIN('1234567890123')).toBe(false); // 13 digits
      expect(service.validateTIN('12345abc90')).toBe(false);   // Contains letters
    });

    it('should validate correct BIN format (9 digits)', () => {
      expect(service.validateBIN('123456789')).toBe(true);   // 9 digits
      expect(service.validateBIN('12345678')).toBe(false);   // 8 digits
      expect(service.validateBIN('1234567890')).toBe(false); // 10 digits
      expect(service.validateBIN('12345678a')).toBe(false);  // Contains letter
    });
  });

  describe('Late Payment Penalty', () => {
    it('should calculate no penalty for on-time payment', () => {
      const dueDate = new Date(2024, 0, 15);
      const paymentDate = new Date(2024, 0, 14); // Before due date

      const penalty = service.calculateLatePenalty(1000, dueDate, paymentDate);

      expect(penalty.penaltyAmount).toBe(0);
      expect(penalty.daysLate).toBe(0);
      expect(penalty.penaltyRate).toBe(0);
    });

    it('should calculate penalty for late payment', () => {
      const dueDate = new Date(2024, 0, 15);
      const paymentDate = new Date(2024, 1, 20); // 36 days late

      const penalty = service.calculateLatePenalty(10000, dueDate, paymentDate);

      expect(penalty.daysLate).toBe(36);
      // 2% per month, 2 months = 4%
      expect(penalty.penaltyRate).toBe(0.04);
      expect(penalty.penaltyAmount).toBe(400);
    });

    it('should round up partial months for penalty calculation', () => {
      const dueDate = new Date(2024, 0, 15);
      const paymentDate = new Date(2024, 0, 25); // 10 days late (less than a month)

      const penalty = service.calculateLatePenalty(10000, dueDate, paymentDate);

      expect(penalty.daysLate).toBe(10);
      // Even partial month counts as full month: 2%
      expect(penalty.penaltyRate).toBe(0.02);
      expect(penalty.penaltyAmount).toBe(200);
    });
  });

  describe('Exemption Categories', () => {
    it('should return correct exemption categories', () => {
      const categories = service.getExemptionCategories();

      expect(categories).toContain('Agricultural products');
      expect(categories).toContain('Educational materials');
      expect(categories).toContain('Medical supplies');
      expect(categories).toContain('Export goods');
      expect(categories).toContain('Diplomatic imports');
      expect(categories).toContain('Government purchases');
      expect(categories.length).toBe(6);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle negative amounts gracefully', async () => {
      const result = await service.calculateTax({
        amount: -1000,
        taxType: TaxType.VAT,
      });

      // Should still calculate tax on absolute value
      expect(Math.abs(result.taxAmount)).toBe(150);
    });

    it('should handle very large amounts with precision', async () => {
      const largeAmount = 999999999999.99;
      const result = await service.calculateTax({
        amount: largeAmount,
        taxType: TaxType.VAT,
      });

      const expectedTax = new Decimal(largeAmount).mul(0.15).toNumber();
      expect(result.taxAmount).toBeCloseTo(expectedTax, 2);
    });

    it('should handle zero amount', async () => {
      const result = await service.calculateTax({
        amount: 0,
        taxType: TaxType.VAT,
      });

      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(0);
    });
  });
});