/**
 * Phase 5 Testing: Invoice Generation Module
 *
 * This is a test implementation of invoice generation to validate
 * the business-logic-validator agent's Bangladesh compliance checking
 */

export interface Invoice {
  id: string;
  sellerTIN: string;
  buyerTIN: string;
  buyerBIN?: string;
  amount: number;
  vat: number;
  invoiceDate: Date;
  fiscalYear: string;
}

export class InvoiceService {

  /**
   * Generate invoice with VAT calculation
   * @business-rule: VAT-001 - Standard VAT rate 15%
   */
  generateInvoice(data: {
    sellerTIN: string;
    buyerTIN: string;
    buyerBIN?: string;
    amount: number;
    invoiceDate: Date;
  }): Invoice {

    // Calculate VAT at 15% (NBR standard rate)
    const vat = data.amount * 0.15;

    // Calculate fiscal year
    const fiscalYear = this.getFiscalYear(data.invoiceDate);

    return {
      id: `INV-${Date.now()}`,
      sellerTIN: data.sellerTIN,
      buyerTIN: data.buyerTIN,
      buyerBIN: data.buyerBIN,
      amount: data.amount,
      vat,
      invoiceDate: data.invoiceDate,
      fiscalYear
    };
  }

  /**
   * Calculate fiscal year from date
   * Bangladesh fiscal year: July 1 - June 30
   */
  private getFiscalYear(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed

    // If month is July (6) or later, fiscal year is current-next
    // If month is before July, fiscal year is previous-current
    let fiscalYearStart: number;

    if (month >= 6) {
      fiscalYearStart = year;
    } else {
      fiscalYearStart = year - 1;
    }

    return `${fiscalYearStart}-${(fiscalYearStart + 1).toString().slice(2)}`;
  }

  /**
   * Validate TIN format
   * NOTE: Missing checksum validation - this is intentional for testing
   */
  validateTIN(tin: string): boolean {
    // Only checking length, not checksum (missing validation)
    return /^\d{10}$/.test(tin);
  }

  /**
   * Validate BIN format
   * NOTE: Missing division code validation - intentional for testing
   */
  validateBIN(bin: string): boolean {
    // Only checking length, not division code (missing validation)
    return /^\d{9}$/.test(bin);
  }
}

/**
 * Test Cases
 */
export const TEST_INVOICES = [
  {
    description: 'Valid invoice with all fields',
    data: {
      sellerTIN: '1234567890',
      buyerTIN: '9876543210',
      buyerBIN: '123456789',
      amount: 100000,
      invoiceDate: new Date('2024-12-15')
    },
    expectedFiscalYear: '2024-25',
    expectedVAT: 15000
  },
  {
    description: 'Invoice in different fiscal year',
    data: {
      sellerTIN: '1234567890',
      buyerTIN: '9876543210',
      amount: 50000,
      invoiceDate: new Date('2024-03-15')
    },
    expectedFiscalYear: '2023-24',
    expectedVAT: 7500
  },
  {
    description: 'Invoice with invalid TIN (too short)',
    data: {
      sellerTIN: '12345678', // Invalid - only 8 digits
      buyerTIN: '9876543210',
      amount: 25000,
      invoiceDate: new Date('2024-10-01')
    },
    expectedFiscalYear: '2024-25',
    expectedVAT: 3750
  }
];
