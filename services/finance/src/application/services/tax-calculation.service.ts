import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Decimal from 'decimal.js';

export enum TaxType {
  VAT = 'VAT',
  TDS = 'TDS',
  AIT = 'AIT',
  SUPPLEMENTARY_DUTY = 'SUPPLEMENTARY_DUTY',
  EXCISE_DUTY = 'EXCISE_DUTY',
  CUSTOMS_DUTY = 'CUSTOMS_DUTY'
}

export enum VendorType {
  CONTRACTOR = 'CONTRACTOR',
  PROFESSIONAL = 'PROFESSIONAL',
  SUPPLIER = 'SUPPLIER',
  RENT = 'RENT',
  TRANSPORT = 'TRANSPORT',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT'
}

export enum ProductCategory {
  LUXURY = 'LUXURY',
  TOBACCO = 'TOBACCO',
  BEVERAGE = 'BEVERAGE',
  ELECTRONICS = 'ELECTRONICS',
  STANDARD = 'STANDARD',
  EXEMPT = 'EXEMPT'
}

export interface TaxCalculationRequest {
  amount: number;
  taxType: TaxType;
  vendorType?: VendorType;
  productCategory?: ProductCategory;
  hasTIN?: boolean;
  isExempt?: boolean;
  fiscalYear?: string;
  transactionDate?: Date;
}

export interface TaxCalculationResult {
  originalAmount: number;
  taxAmount: number;
  totalAmount: number;
  taxRate: number;
  taxType: TaxType;
  fiscalYear: string;
  dueDate?: Date;
  breakdown: TaxBreakdown[];
}

export interface TaxBreakdown {
  component: string;
  rate: number;
  amount: number;
  description: string;
}

export interface FiscalYear {
  year: string;
  startDate: Date;
  endDate: Date;
  currentQuarter: number;
  currentMonth: number;
}

@Injectable()
export class TaxCalculationService {
  private readonly logger = new Logger(TaxCalculationService.name);
  private readonly VAT_RATE = 0.15; // 15% standard VAT rate in Bangladesh

  // TDS (Tax Deducted at Source) rates
  private readonly TDS_RATES = {
    [VendorType.CONTRACTOR]: 0.07,     // 7% for contractors
    [VendorType.PROFESSIONAL]: 0.10,   // 10% for professional services
    [VendorType.SUPPLIER]: 0.04,       // 4% for suppliers
    [VendorType.RENT]: 0.05,           // 5% for rent
    [VendorType.TRANSPORT]: 0.03,      // 3% for transport
  };

  // AIT (Advance Income Tax) rates
  private readonly AIT_RATES = {
    [VendorType.IMPORT]: 0.05,         // 5% for imports
    [VendorType.EXPORT]: 0.01,         // 1% for exports
    [VendorType.CONTRACTOR]: 0.06,     // 6% for contractors
    [VendorType.SUPPLIER]: 0.04,       // 4% for suppliers
  };

  // Supplementary Duty rates
  private readonly SUPPLEMENTARY_DUTY_RATES = {
    [ProductCategory.LUXURY]: 0.20,       // 20% for luxury items
    [ProductCategory.TOBACCO]: 0.35,      // 35% for tobacco products
    [ProductCategory.BEVERAGE]: 0.25,     // 25% for beverages
    [ProductCategory.ELECTRONICS]: 0.10,  // 10% for electronics
    [ProductCategory.STANDARD]: 0,        // 0% for standard items
    [ProductCategory.EXEMPT]: 0,          // 0% for exempt items
  };

  // Higher TDS rate multiplier for vendors without TIN
  private readonly NO_TIN_MULTIPLIER = 1.5;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Calculate tax based on Bangladesh regulations
   */
  async calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResult> {
    try {
      const fiscalYear = this.getCurrentFiscalYear(request.transactionDate);
      const breakdown: TaxBreakdown[] = [];
      let totalTax = new Decimal(0);

      const amount = new Decimal(request.amount);

      // Calculate based on tax type
      switch (request.taxType) {
        case TaxType.VAT:
          const vatResult = this.calculateVAT(amount, request.isExempt, request.productCategory);
          totalTax = totalTax.add(vatResult.tax);
          breakdown.push({
            component: 'VAT',
            rate: vatResult.rate,
            amount: vatResult.tax.toNumber(),
            description: vatResult.description
          });
          break;

        case TaxType.TDS:
          const tdsResult = this.calculateTDS(amount, request.vendorType!, request.hasTIN);
          totalTax = totalTax.add(tdsResult.tax);
          breakdown.push({
            component: 'TDS',
            rate: tdsResult.rate,
            amount: tdsResult.tax.toNumber(),
            description: tdsResult.description
          });
          break;

        case TaxType.AIT:
          const aitResult = this.calculateAIT(amount, request.vendorType!);
          totalTax = totalTax.add(aitResult.tax);
          breakdown.push({
            component: 'AIT',
            rate: aitResult.rate,
            amount: aitResult.tax.toNumber(),
            description: aitResult.description
          });
          break;

        case TaxType.SUPPLEMENTARY_DUTY:
          const sdResult = this.calculateSupplementaryDuty(amount, request.productCategory!);
          totalTax = totalTax.add(sdResult.tax);
          breakdown.push({
            component: 'Supplementary Duty',
            rate: sdResult.rate,
            amount: sdResult.tax.toNumber(),
            description: sdResult.description
          });
          break;
      }

      // Calculate due date based on tax type
      const dueDate = this.calculateTaxDueDate(request.taxType, request.transactionDate);

      return {
        originalAmount: request.amount,
        taxAmount: totalTax.toNumber(),
        totalAmount: amount.add(totalTax).toNumber(),
        taxRate: totalTax.div(amount).toNumber(),
        taxType: request.taxType,
        fiscalYear: fiscalYear.year,
        dueDate,
        breakdown
      };
    } catch (error) {
      this.logger.error(`Tax calculation failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Calculate VAT with exemptions
   */
  private calculateVAT(
    amount: Decimal,
    isExempt?: boolean,
    productCategory?: ProductCategory
  ): { tax: Decimal; rate: number; description: string } {
    if (isExempt || productCategory === ProductCategory.EXEMPT) {
      return {
        tax: new Decimal(0),
        rate: 0,
        description: 'VAT Exempt'
      };
    }

    const rate = this.VAT_RATE;
    const tax = amount.mul(rate);

    return {
      tax,
      rate,
      description: `Standard VAT @ ${rate * 100}%`
    };
  }

  /**
   * Calculate TDS (Tax Deducted at Source)
   */
  private calculateTDS(
    amount: Decimal,
    vendorType: VendorType,
    hasTIN?: boolean
  ): { tax: Decimal; rate: number; description: string } {
    let baseRate = (this.TDS_RATES as any)[vendorType] || 0;

    if (!baseRate) {
      return {
        tax: new Decimal(0),
        rate: 0,
        description: 'No TDS applicable'
      };
    }

    // Apply higher rate for vendors without TIN
    let rate = baseRate;
    let description = `TDS for ${vendorType}`;

    if (hasTIN === false) {
      rate = baseRate * this.NO_TIN_MULTIPLIER;
      description += ' (No TIN - 1.5x rate)';
    }

    const tax = amount.mul(rate);

    return {
      tax,
      rate,
      description: `${description} @ ${rate * 100}%`
    };
  }

  /**
   * Calculate AIT (Advance Income Tax)
   */
  private calculateAIT(
    amount: Decimal,
    vendorType: VendorType
  ): { tax: Decimal; rate: number; description: string } {
    const rate = (this.AIT_RATES as any)[vendorType] || 0;

    if (!rate) {
      return {
        tax: new Decimal(0),
        rate: 0,
        description: 'No AIT applicable'
      };
    }

    const tax = amount.mul(rate);

    return {
      tax,
      rate,
      description: `AIT for ${vendorType} @ ${rate * 100}%`
    };
  }

  /**
   * Calculate Supplementary Duty
   */
  private calculateSupplementaryDuty(
    amount: Decimal,
    productCategory: ProductCategory
  ): { tax: Decimal; rate: number; description: string } {
    const rate = this.SUPPLEMENTARY_DUTY_RATES[productCategory] || 0;

    if (!rate) {
      return {
        tax: new Decimal(0),
        rate: 0,
        description: 'No Supplementary Duty applicable'
      };
    }

    const tax = amount.mul(rate);

    return {
      tax,
      rate,
      description: `Supplementary Duty for ${productCategory} @ ${rate * 100}%`
    };
  }

  /**
   * Get current fiscal year (July 1 - June 30)
   */
  getCurrentFiscalYear(date?: Date): FiscalYear {
    const currentDate = date || new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11

    let fiscalYear: string;
    let startDate: Date;
    let endDate: Date;

    // Fiscal year starts July 1 (month = 6 in JavaScript)
    if (currentMonth >= 6) { // July-December
      fiscalYear = `${currentYear}-${currentYear + 1}`;
      startDate = new Date(currentYear, 6, 1); // July 1
      endDate = new Date(currentYear + 1, 5, 30); // June 30
    } else { // January-June
      fiscalYear = `${currentYear - 1}-${currentYear}`;
      startDate = new Date(currentYear - 1, 6, 1); // July 1
      endDate = new Date(currentYear, 5, 30); // June 30
    }

    // Calculate quarter (Q1: Jul-Sep, Q2: Oct-Dec, Q3: Jan-Mar, Q4: Apr-Jun)
    let currentQuarter: number;
    if (currentMonth >= 6 && currentMonth <= 8) currentQuarter = 1;
    else if (currentMonth >= 9 && currentMonth <= 11) currentQuarter = 2;
    else if (currentMonth >= 0 && currentMonth <= 2) currentQuarter = 3;
    else currentQuarter = 4;

    // Calculate fiscal month (1-12, July = 1)
    let fiscalMonth: number;
    if (currentMonth >= 6) {
      fiscalMonth = currentMonth - 5; // July(6) = 1, Aug(7) = 2, etc.
    } else {
      fiscalMonth = currentMonth + 7; // Jan(0) = 7, Feb(1) = 8, etc.
    }

    return {
      year: fiscalYear,
      startDate,
      endDate,
      currentQuarter,
      currentMonth: fiscalMonth
    };
  }

  /**
   * Calculate tax due date based on Bangladesh regulations
   */
  calculateTaxDueDate(taxType: TaxType, transactionDate?: Date): Date {
    const date = transactionDate || new Date();
    const dueDate = new Date(date);

    switch (taxType) {
      case TaxType.VAT:
        // VAT returns due by 15th of next month
        dueDate.setMonth(dueDate.getMonth() + 1);
        dueDate.setDate(15);
        break;

      case TaxType.TDS:
        // TDS payment due within 7 days of deduction
        dueDate.setDate(dueDate.getDate() + 7);
        break;

      case TaxType.AIT:
        // AIT payment due at the time of import/export clearance
        // Same day for immediate payment
        break;

      case TaxType.SUPPLEMENTARY_DUTY:
        // Supplementary duty due with VAT return
        dueDate.setMonth(dueDate.getMonth() + 1);
        dueDate.setDate(15);
        break;
    }

    // If due date falls on weekend, move to next working day
    const dayOfWeek = dueDate.getDay();
    if (dayOfWeek === 5) { // Friday (weekend in Bangladesh)
      dueDate.setDate(dueDate.getDate() + 2); // Move to Sunday
    } else if (dayOfWeek === 6) { // Saturday (weekend in Bangladesh)
      dueDate.setDate(dueDate.getDate() + 1); // Move to Sunday
    }

    return dueDate;
  }

  /**
   * Calculate combined taxes for a transaction
   */
  async calculateCombinedTaxes(
    amount: number,
    vendorType: VendorType,
    productCategory: ProductCategory,
    hasTIN: boolean,
    includeVAT: boolean = true,
    includeTDS: boolean = true,
    includeSupplementaryDuty: boolean = false
  ): Promise<{
    originalAmount: number;
    totalTaxAmount: number;
    totalAmount: number;
    breakdown: TaxCalculationResult[];
  }> {
    const results: TaxCalculationResult[] = [];
    let totalTax = new Decimal(0);
    const originalAmount = new Decimal(amount);

    // Calculate VAT
    if (includeVAT) {
      const vatResult = await this.calculateTax({
        amount,
        taxType: TaxType.VAT,
        productCategory,
        isExempt: productCategory === ProductCategory.EXEMPT
      });
      results.push(vatResult);
      totalTax = totalTax.add(vatResult.taxAmount);
    }

    // Calculate TDS
    if (includeTDS) {
      const tdsResult = await this.calculateTax({
        amount,
        taxType: TaxType.TDS,
        vendorType,
        hasTIN
      });
      results.push(tdsResult);
      totalTax = totalTax.add(tdsResult.taxAmount);
    }

    // Calculate Supplementary Duty
    if (includeSupplementaryDuty) {
      const sdResult = await this.calculateTax({
        amount,
        taxType: TaxType.SUPPLEMENTARY_DUTY,
        productCategory
      });
      results.push(sdResult);
      totalTax = totalTax.add(sdResult.taxAmount);
    }

    return {
      originalAmount: amount,
      totalTaxAmount: totalTax.toNumber(),
      totalAmount: originalAmount.add(totalTax).toNumber(),
      breakdown: results
    };
  }

  /**
   * Validate TIN (Tax Identification Number)
   */
  validateTIN(tin: string): boolean {
    // TIN in Bangladesh is 10-12 digits
    const tinRegex = /^\d{10,12}$/;
    return tinRegex.test(tin);
  }

  /**
   * Validate BIN (Business Identification Number)
   */
  validateBIN(bin: string): boolean {
    // BIN in Bangladesh is 9 digits
    const binRegex = /^\d{9}$/;
    return binRegex.test(bin);
  }

  /**
   * Get tax exemption categories
   */
  getExemptionCategories(): string[] {
    return [
      'Agricultural products',
      'Educational materials',
      'Medical supplies',
      'Export goods',
      'Diplomatic imports',
      'Government purchases'
    ];
  }

  /**
   * Calculate late payment penalty
   */
  calculateLatePenalty(
    taxAmount: number,
    dueDate: Date,
    paymentDate?: Date
  ): { penaltyAmount: number; daysLate: number; penaltyRate: number } {
    const payment = paymentDate || new Date();
    const timeDiff = payment.getTime() - dueDate.getTime();
    const daysLate = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));

    if (daysLate === 0) {
      return { penaltyAmount: 0, daysLate: 0, penaltyRate: 0 };
    }

    // NBR penalty rate: 2% per month or fraction thereof
    const monthsLate = Math.ceil(daysLate / 30);
    const penaltyRate = 0.02 * monthsLate;
    const penaltyAmount = new Decimal(taxAmount).mul(penaltyRate).toNumber();

    return { penaltyAmount, daysLate, penaltyRate };
  }
}