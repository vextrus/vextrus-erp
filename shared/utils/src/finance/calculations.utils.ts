import { Decimal } from 'decimal.js';
import { Money } from './money.value-object';

export enum TaxType {
  VAT = 'VAT',
  AIT = 'AIT',
  WITHHOLDING = 'WITHHOLDING',
  CUSTOMS = 'CUSTOMS',
  SUPPLEMENTARY = 'SUPPLEMENTARY'
}

export enum WithholdingType {
  CONTRACTOR = 'CONTRACTOR',
  SUPPLIER = 'SUPPLIER',
  PROFESSIONAL = 'PROFESSIONAL',
  CONSULTANCY = 'CONSULTANCY',
  TRANSPORT = 'TRANSPORT'
}

export interface TaxCalculation {
  baseAmount: Money;
  taxAmount: Money;
  totalAmount: Money;
  taxRate: number;
  taxType: TaxType;
}

export interface InterestCalculation {
  principal: Money;
  interest: Money;
  totalAmount: Money;
  rate: number;
  period: number;
  periodUnit: 'days' | 'months' | 'years';
}

export class FinancialCalculations {
  // Bangladesh standard VAT rate is 15%
  private static readonly STANDARD_VAT_RATE = 15;
  
  // AIT (Advance Income Tax) rates for different categories
  private static readonly AIT_RATES = {
    GOODS: 3,
    SERVICES: 10,
    CONTRACTOR: 7,
    PROFESSIONAL: 10,
    IMPORT: 5
  };

  // Withholding tax rates
  private static readonly WITHHOLDING_RATES = {
    [WithholdingType.CONTRACTOR]: 7,
    [WithholdingType.SUPPLIER]: 3,
    [WithholdingType.PROFESSIONAL]: 10,
    [WithholdingType.CONSULTANCY]: 10,
    [WithholdingType.TRANSPORT]: 3
  };

  /**
   * Calculate VAT (Value Added Tax) for Bangladesh
   */
  static calculateVAT(amount: Money, rate: number = this.STANDARD_VAT_RATE): TaxCalculation {
    const taxAmount = amount.percentage(rate);
    const totalAmount = amount.add(taxAmount);
    
    return {
      baseAmount: amount,
      taxAmount,
      totalAmount,
      taxRate: rate,
      taxType: TaxType.VAT
    };
  }

  /**
   * Calculate AIT (Advance Income Tax)
   */
  static calculateAIT(amount: Money, category: keyof typeof FinancialCalculations.AIT_RATES): TaxCalculation {
    const rate = this.AIT_RATES[category];
    const taxAmount = amount.percentage(rate);
    const totalAmount = amount.add(taxAmount);
    
    return {
      baseAmount: amount,
      taxAmount,
      totalAmount,
      taxRate: rate,
      taxType: TaxType.AIT
    };
  }

  /**
   * Calculate Withholding Tax
   */
  static calculateWithholdingTax(amount: Money, type: WithholdingType): TaxCalculation {
    const rate = this.WITHHOLDING_RATES[type];
    const taxAmount = amount.percentage(rate);
    const totalAmount = amount.subtract(taxAmount); // Withholding is deducted
    
    return {
      baseAmount: amount,
      taxAmount,
      totalAmount,
      taxRate: rate,
      taxType: TaxType.WITHHOLDING
    };
  }

  /**
   * Calculate multiple taxes on the same amount
   */
  static calculateMultipleTaxes(amount: Money, taxes: Array<{ type: TaxType; rate: number }>): {
    baseAmount: Money;
    taxes: TaxCalculation[];
    totalTaxAmount: Money;
    finalAmount: Money;
  } {
    let totalTaxAmount = Money.zero(amount.currency);
    const taxCalculations: TaxCalculation[] = [];
    
    for (const tax of taxes) {
      const taxAmount = amount.percentage(tax.rate);
      totalTaxAmount = totalTaxAmount.add(taxAmount);
      
      taxCalculations.push({
        baseAmount: amount,
        taxAmount,
        totalAmount: amount.add(taxAmount),
        taxRate: tax.rate,
        taxType: tax.type
      });
    }
    
    return {
      baseAmount: amount,
      taxes: taxCalculations,
      totalTaxAmount,
      finalAmount: amount.add(totalTaxAmount)
    };
  }

  /**
   * Calculate simple interest
   */
  static calculateSimpleInterest(
    principal: Money,
    annualRate: number,
    period: number,
    periodUnit: 'days' | 'months' | 'years' = 'years'
  ): InterestCalculation {
    let timeInYears: Decimal;
    
    switch (periodUnit) {
      case 'days':
        timeInYears = new Decimal(period).dividedBy(365);
        break;
      case 'months':
        timeInYears = new Decimal(period).dividedBy(12);
        break;
      case 'years':
        timeInYears = new Decimal(period);
        break;
    }
    
    const interest = principal.multiply(new Decimal(annualRate).dividedBy(100).times(timeInYears));
    const totalAmount = principal.add(interest);
    
    return {
      principal,
      interest,
      totalAmount,
      rate: annualRate,
      period,
      periodUnit
    };
  }

  /**
   * Calculate compound interest
   */
  static calculateCompoundInterest(
    principal: Money,
    annualRate: number,
    period: number,
    periodUnit: 'days' | 'months' | 'years' = 'years',
    compoundingFrequency: number = 12 // Monthly compounding by default
  ): InterestCalculation {
    let timeInYears: Decimal;
    
    switch (periodUnit) {
      case 'days':
        timeInYears = new Decimal(period).dividedBy(365);
        break;
      case 'months':
        timeInYears = new Decimal(period).dividedBy(12);
        break;
      case 'years':
        timeInYears = new Decimal(period);
        break;
    }
    
    const rate = new Decimal(annualRate).dividedBy(100);
    const n = new Decimal(compoundingFrequency);
    const nt = n.times(timeInYears);
    const rn = rate.dividedBy(n);
    const compound = rn.plus(1).pow(nt);
    
    const totalAmount = principal.multiply(compound);
    const interest = totalAmount.subtract(principal);
    
    return {
      principal,
      interest,
      totalAmount,
      rate: annualRate,
      period,
      periodUnit
    };
  }

  /**
   * Calculate discount amount
   */
  static calculateDiscount(amount: Money, discountPercent: number): {
    originalAmount: Money;
    discountAmount: Money;
    finalAmount: Money;
    discountRate: number;
  } {
    const discountAmount = amount.percentage(discountPercent);
    const finalAmount = amount.subtract(discountAmount);
    
    return {
      originalAmount: amount,
      discountAmount,
      finalAmount,
      discountRate: discountPercent
    };
  }

  /**
   * Calculate markup amount
   */
  static calculateMarkup(cost: Money, markupPercent: number): {
    costAmount: Money;
    markupAmount: Money;
    sellingPrice: Money;
    markupRate: number;
  } {
    const markupAmount = cost.percentage(markupPercent);
    const sellingPrice = cost.add(markupAmount);
    
    return {
      costAmount: cost,
      markupAmount,
      sellingPrice,
      markupRate: markupPercent
    };
  }

  /**
   * Calculate profit margin
   */
  static calculateProfitMargin(revenue: Money, cost: Money): {
    revenue: Money;
    cost: Money;
    profit: Money;
    marginPercent: number;
  } {
    if (revenue.currency !== cost.currency) {
      throw new Error('Currency mismatch between revenue and cost');
    }
    
    const profit = revenue.subtract(cost);
    const marginPercent = profit.amount.dividedBy(revenue.amount).times(100).toNumber();
    
    return {
      revenue,
      cost,
      profit,
      marginPercent
    };
  }

  /**
   * Calculate EMI (Equated Monthly Installment) for loans
   */
  static calculateEMI(
    principal: Money,
    annualRate: number,
    tenureMonths: number
  ): {
    principal: Money;
    monthlyPayment: Money;
    totalPayment: Money;
    totalInterest: Money;
    rate: number;
    tenure: number;
  } {
    const monthlyRate = new Decimal(annualRate).dividedBy(12).dividedBy(100);
    const n = new Decimal(tenureMonths);
    
    if (monthlyRate.isZero()) {
      // No interest case
      const monthlyPayment = principal.divide(tenureMonths);
      return {
        principal,
        monthlyPayment,
        totalPayment: principal,
        totalInterest: Money.zero(principal.currency),
        rate: annualRate,
        tenure: tenureMonths
      };
    }
    
    // EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
    const onePlusR = monthlyRate.plus(1);
    const onePlusRPowN = onePlusR.pow(n);
    const numerator = principal.amount.times(monthlyRate).times(onePlusRPowN);
    const denominator = onePlusRPowN.minus(1);
    
    const emiAmount = numerator.dividedBy(denominator);
    const monthlyPayment = Money.create(emiAmount, principal.currency);
    const totalPayment = monthlyPayment.multiply(tenureMonths);
    const totalInterest = totalPayment.subtract(principal);
    
    return {
      principal,
      monthlyPayment,
      totalPayment,
      totalInterest,
      rate: annualRate,
      tenure: tenureMonths
    };
  }

  /**
   * Calculate depreciation using straight-line method
   */
  static calculateStraightLineDepreciation(
    assetCost: Money,
    salvageValue: Money,
    usefulLifeYears: number
  ): {
    assetCost: Money;
    salvageValue: Money;
    annualDepreciation: Money;
    monthlyDepreciation: Money;
    depreciableAmount: Money;
    usefulLife: number;
  } {
    if (assetCost.currency !== salvageValue.currency) {
      throw new Error('Currency mismatch between asset cost and salvage value');
    }
    
    const depreciableAmount = assetCost.subtract(salvageValue);
    const annualDepreciation = depreciableAmount.divide(usefulLifeYears);
    const monthlyDepreciation = annualDepreciation.divide(12);
    
    return {
      assetCost,
      salvageValue,
      annualDepreciation,
      monthlyDepreciation,
      depreciableAmount,
      usefulLife: usefulLifeYears
    };
  }

  /**
   * Round to nearest 5 taka (common in Bangladesh for cash transactions)
   */
  static roundToNearestFive(amount: Money): Money {
    const rounded = amount.amount.dividedBy(5).round().times(5);
    return Money.create(rounded, amount.currency);
  }

  /**
   * Apply banker's rounding (round half to even)
   */
  static bankersRounding(amount: Money, decimalPlaces: number = 2): Money {
    return amount.roundBankers(decimalPlaces);
  }
}