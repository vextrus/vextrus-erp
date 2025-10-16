import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EngineService } from './engine.service';

export interface VATCalculationInput {
  productCategory: string;
  customerType: string;
  amount: number;
  isExport?: boolean;
  hasExemptionCertificate?: boolean;
}

export interface VATCalculationResult {
  originalAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  exemptionApplied: boolean;
  exemptionReason?: string;
}

export interface AITCalculationInput {
  serviceType: string;
  vendorType: string;
  amount: number;
  hasTaxCertificate?: boolean;
}

export interface AITCalculationResult {
  originalAmount: number;
  aitRate: number;
  aitAmount: number;
  netAmount: number;
  description: string;
}

@Injectable()
export class TaxRulesService implements OnModuleInit {
  private readonly logger = new Logger(TaxRulesService.name);
  private readonly VAT_ENGINE_ID = 'bangladesh-vat-engine';
  private readonly AIT_ENGINE_ID = 'bangladesh-ait-engine';

  constructor(private readonly engineService: EngineService) {}

  async onModuleInit() {
    await this.initializeVATRules();
    await this.initializeAITRules();
    this.logger.log('Bangladesh tax rules initialized');
  }

  private async initializeVATRules() {
    const engine = this.engineService.getOrCreateEngine(this.VAT_ENGINE_ID);

    // Standard 15% VAT rule
    this.engineService.addRule(this.VAT_ENGINE_ID, {
      id: 'standard-vat',
      name: 'Standard VAT Rate',
      description: 'Apply standard 15% VAT rate for most goods and services',
      conditions: {
        all: [
          {
            fact: 'productCategory',
            operator: 'notIn',
            value: ['medicine', 'agriculture', 'education', 'basic-food']
          },
          {
            fact: 'customerType',
            operator: 'notEqual',
            value: 'government'
          },
          {
            fact: 'isExport',
            operator: 'notEqual',
            value: true
          },
          {
            fact: 'hasExemptionCertificate',
            operator: 'notEqual',
            value: true
          }
        ]
      },
      event: {
        type: 'apply-vat',
        params: {
          rate: 0.15,
          description: 'Standard VAT rate (15%)'
        }
      },
      priority: 10
    });

    // Zero VAT for exports
    this.engineService.addRule(this.VAT_ENGINE_ID, {
      id: 'export-zero-vat',
      name: 'Export Zero VAT',
      description: 'Zero VAT for export transactions',
      conditions: {
        all: [
          {
            fact: 'isExport',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: 'apply-vat',
        params: {
          rate: 0,
          description: 'Export - Zero VAT'
        }
      },
      priority: 100
    });

    // Zero VAT for essential items
    this.engineService.addRule(this.VAT_ENGINE_ID, {
      id: 'essential-items-zero-vat',
      name: 'Essential Items Zero VAT',
      description: 'Zero VAT for essential items like medicine, basic food, agriculture',
      conditions: {
        any: [
          {
            fact: 'productCategory',
            operator: 'in',
            value: ['medicine', 'basic-food', 'agriculture']
          }
        ]
      },
      event: {
        type: 'apply-vat',
        params: {
          rate: 0,
          description: 'Essential items - VAT exempt'
        }
      },
      priority: 90
    });

    // Reduced 5% VAT for education
    this.engineService.addRule(this.VAT_ENGINE_ID, {
      id: 'education-reduced-vat',
      name: 'Education Reduced VAT',
      description: 'Reduced 5% VAT for education services',
      conditions: {
        all: [
          {
            fact: 'productCategory',
            operator: 'equal',
            value: 'education'
          }
        ]
      },
      event: {
        type: 'apply-vat',
        params: {
          rate: 0.05,
          description: 'Education services - Reduced VAT (5%)'
        }
      },
      priority: 80
    });

    // Government exemption
    this.engineService.addRule(this.VAT_ENGINE_ID, {
      id: 'government-exemption',
      name: 'Government VAT Exemption',
      description: 'VAT exemption for government entities',
      conditions: {
        all: [
          {
            fact: 'customerType',
            operator: 'equal',
            value: 'government'
          }
        ]
      },
      event: {
        type: 'apply-vat',
        params: {
          rate: 0,
          description: 'Government entity - VAT exempt'
        }
      },
      priority: 95
    });

    // Construction materials special VAT
    this.engineService.addRule(this.VAT_ENGINE_ID, {
      id: 'construction-materials-vat',
      name: 'Construction Materials VAT',
      description: 'Special VAT treatment for construction materials',
      conditions: {
        all: [
          {
            fact: 'productCategory',
            operator: 'equal',
            value: 'construction-materials'
          },
          {
            fact: 'amount',
            operator: 'greaterThan',
            value: 1000000 // Above 10 lakh BDT
          }
        ]
      },
      event: {
        type: 'apply-vat',
        params: {
          rate: 0.075,
          description: 'Construction materials (bulk) - Reduced VAT (7.5%)'
        }
      },
      priority: 70
    });
  }

  private async initializeAITRules() {
    const engine = this.engineService.getOrCreateEngine(this.AIT_ENGINE_ID);

    // Construction contractor AIT - 7%
    this.engineService.addRule(this.AIT_ENGINE_ID, {
      id: 'construction-contractor-ait',
      name: 'Construction Contractor AIT',
      description: 'AIT for construction contractors',
      conditions: {
        all: [
          {
            fact: 'serviceType',
            operator: 'equal',
            value: 'construction'
          },
          {
            fact: 'vendorType',
            operator: 'equal',
            value: 'contractor'
          }
        ]
      },
      event: {
        type: 'apply-ait',
        params: {
          rate: 0.07,
          description: 'Construction contractor - AIT (7%)'
        }
      },
      priority: 10
    });

    // Supply of goods AIT - 3%
    this.engineService.addRule(this.AIT_ENGINE_ID, {
      id: 'supply-goods-ait',
      name: 'Supply of Goods AIT',
      description: 'AIT for supply of goods',
      conditions: {
        all: [
          {
            fact: 'serviceType',
            operator: 'equal',
            value: 'supply'
          }
        ]
      },
      event: {
        type: 'apply-ait',
        params: {
          rate: 0.03,
          description: 'Supply of goods - AIT (3%)'
        }
      },
      priority: 10
    });

    // Professional services AIT - 10%
    this.engineService.addRule(this.AIT_ENGINE_ID, {
      id: 'professional-services-ait',
      name: 'Professional Services AIT',
      description: 'AIT for professional services',
      conditions: {
        all: [
          {
            fact: 'serviceType',
            operator: 'in',
            value: ['consulting', 'legal', 'accounting', 'engineering']
          }
        ]
      },
      event: {
        type: 'apply-ait',
        params: {
          rate: 0.10,
          description: 'Professional services - AIT (10%)'
        }
      },
      priority: 10
    });

    // Transport services AIT - 3%
    this.engineService.addRule(this.AIT_ENGINE_ID, {
      id: 'transport-services-ait',
      name: 'Transport Services AIT',
      description: 'AIT for transport services',
      conditions: {
        all: [
          {
            fact: 'serviceType',
            operator: 'equal',
            value: 'transport'
          }
        ]
      },
      event: {
        type: 'apply-ait',
        params: {
          rate: 0.03,
          description: 'Transport services - AIT (3%)'
        }
      },
      priority: 10
    });

    // Reduced AIT with tax certificate - 2%
    this.engineService.addRule(this.AIT_ENGINE_ID, {
      id: 'reduced-ait-with-certificate',
      name: 'Reduced AIT with Certificate',
      description: 'Reduced AIT rate for vendors with tax certificate',
      conditions: {
        all: [
          {
            fact: 'hasTaxCertificate',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: 'apply-ait',
        params: {
          rate: 0.02,
          description: 'Reduced rate with tax certificate - AIT (2%)'
        }
      },
      priority: 100 // Higher priority to override other rules
    });
  }

  async calculateVAT(input: VATCalculationInput): Promise<VATCalculationResult> {
    const result = await this.engineService.evaluate(this.VAT_ENGINE_ID, input);
    
    if (!result.success || result.events.length === 0) {
      // Default to standard VAT if no rules match
      const vatRate = 0.15;
      const vatAmount = input.amount * vatRate;
      return {
        originalAmount: input.amount,
        vatRate,
        vatAmount,
        totalAmount: input.amount + vatAmount,
        exemptionApplied: false,
      };
    }

    const vatEvent = result.events[0];
    const vatRate = vatEvent.params.rate;
    const vatAmount = input.amount * vatRate;

    return {
      originalAmount: input.amount,
      vatRate,
      vatAmount,
      totalAmount: input.amount + vatAmount,
      exemptionApplied: vatRate === 0,
      exemptionReason: vatRate === 0 ? vatEvent.params.description : undefined,
    };
  }

  async calculateAIT(input: AITCalculationInput): Promise<AITCalculationResult> {
    const result = await this.engineService.evaluate(this.AIT_ENGINE_ID, input);
    
    if (!result.success || result.events.length === 0) {
      // No AIT if no rules match
      return {
        originalAmount: input.amount,
        aitRate: 0,
        aitAmount: 0,
        netAmount: input.amount,
        description: 'No AIT applicable',
      };
    }

    const aitEvent = result.events[0];
    const aitRate = aitEvent.params.rate;
    const aitAmount = input.amount * aitRate;

    return {
      originalAmount: input.amount,
      aitRate,
      aitAmount,
      netAmount: input.amount - aitAmount,
      description: aitEvent.params.description,
    };
  }

  // Validate TIN (Tax Identification Number)
  validateTIN(tin: string): { valid: boolean; message?: string } {
    if (!tin) {
      return { valid: false, message: 'TIN is required' };
    }

    // Bangladesh TIN should be 12 digits
    const tinRegex = /^\d{12}$/;
    if (!tinRegex.test(tin)) {
      return { valid: false, message: 'TIN must be exactly 12 digits' };
    }

    // Additional validation logic can be added here
    return { valid: true };
  }

  // Validate BIN (Business Identification Number)
  validateBIN(bin: string): { valid: boolean; message?: string } {
    if (!bin) {
      return { valid: false, message: 'BIN is required' };
    }

    // Bangladesh BIN should be 9 digits
    const binRegex = /^\d{9}$/;
    if (!binRegex.test(bin)) {
      return { valid: false, message: 'BIN must be exactly 9 digits' };
    }

    return { valid: true };
  }

  // Calculate withholding tax
  async calculateWithholdingTax(
    type: 'salary' | 'dividend' | 'interest' | 'rent',
    amount: number,
    isResident: boolean = true,
  ): Promise<{ rate: number; amount: number; netAmount: number }> {
    let rate = 0;

    switch (type) {
      case 'salary':
        // Progressive tax rates for salary
        if (amount <= 300000) rate = 0; // First 3 lakh exempt
        else if (amount <= 400000) rate = 0.05;
        else if (amount <= 700000) rate = 0.10;
        else if (amount <= 1100000) rate = 0.15;
        else if (amount <= 1600000) rate = 0.20;
        else rate = 0.25;
        break;
      
      case 'dividend':
        rate = isResident ? 0.10 : 0.20;
        break;
      
      case 'interest':
        rate = isResident ? 0.10 : 0.20;
        break;
      
      case 'rent':
        rate = 0.05; // Standard rate for rent
        break;
    }

    const taxAmount = amount * rate;
    return {
      rate,
      amount: taxAmount,
      netAmount: amount - taxAmount,
    };
  }
}