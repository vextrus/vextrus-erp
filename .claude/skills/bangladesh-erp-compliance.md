# Bangladesh ERP Compliance Skill

## VAT (Value Added Tax) Calculation

### Rates
- **Standard Rate**: 15% (applies to most construction services and general business transactions)
- **Reduced Rate**: 7.5% (applies to specific goods/services as defined by NBR)
- **Zero-Rated**: 0% (exports and specific sectors designated by NBR)

### Implementation Pattern
```typescript
export enum VATRate {
  STANDARD = 0.15,    // 15%
  REDUCED = 0.075,    // 7.5%
  ZERO_RATED = 0.00   // 0%
}

export function calculateVAT(amount: number, rate: VATRate): number {
  return amount * rate;
}
```

---

## TDS/AIT (Tax Deducted at Source / Advance Income Tax) Withholding

### Rates
- **With TIN (Tax Identification Number)**: 5%
- **Without TIN**: 7.5%
- **Professional Services**: 10% (consultants, contractors, professionals)

### Implementation Pattern
```typescript
export enum TDSRate {
  WITH_TIN = 0.05,           // 5%
  WITHOUT_TIN = 0.075,       // 7.5%
  PROFESSIONAL = 0.10        // 10%
}

export function calculateTDS(
  amount: number,
  hasTIN: boolean,
  isProfessional: boolean
): number {
  if (isProfessional) {
    return amount * TDSRate.PROFESSIONAL;
  }
  return amount * (hasTIN ? TDSRate.WITH_TIN : TDSRate.WITHOUT_TIN);
}
```

---

## Mushak 6.3 (VAT Challan) Generation

### Requirements
1. **Auto-generate** on invoice approval
2. **Include**:
   - Company TIN/BIN
   - Customer TIN/BIN (if available)
   - VAT breakdown by rate
   - QR code for verification
   - Mushak form reference number
3. **Format**: PDF compliant with NBR specifications

### Implementation Pattern
```typescript
export interface Mushak63Data {
  invoiceId: string;
  invoiceNumber: string;
  supplierTIN: string;
  supplierBIN: string;
  customerTIN?: string;
  customerBIN?: string;
  vatBreakdown: {
    rate: VATRate;
    taxableAmount: number;
    vatAmount: number;
  }[];
  totalVAT: number;
  qrCode: string; // Generated QR code data
  fiscalYear: string; // Format: "YYYY-YYYY" (e.g., "2024-2025")
  mushakNumber: string;
}

export function generateMushak63(invoice: Invoice): Mushak63Data {
  // Auto-generate on invoice approval
  // Include all required fields
  // Generate QR code
  // Return structured data for PDF generation
}
```

---

## Fiscal Year

### Definition
**Bangladesh Fiscal Year**: July 1 - June 30

**NOT** calendar year (January 1 - December 31)

### Examples
- FY 2024-2025: July 1, 2024 - June 30, 2025
- FY 2025-2026: July 1, 2025 - June 30, 2026

### Implementation Pattern
```typescript
export function getCurrentFiscalYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  if (month >= 7) {
    // July-December: Current year to next year
    return `${year}-${year + 1}`;
  } else {
    // January-June: Previous year to current year
    return `${year - 1}-${year}`;
  }
}

export function getFiscalYearRange(fiscalYear: string): {
  startDate: Date;
  endDate: Date;
} {
  const [startYear, endYear] = fiscalYear.split('-').map(Number);
  return {
    startDate: new Date(startYear, 6, 1), // July 1
    endDate: new Date(endYear, 5, 30, 23, 59, 59) // June 30
  };
}
```

---

## Submission Deadlines

### Mushak 6.3 Submission
- **Deadline**: Within 15 days of month-end
- **Example**: February transactions must be submitted by March 15

### Implementation Pattern
```typescript
export function getMushakSubmissionDeadline(transactionDate: Date): Date {
  const deadline = new Date(
    transactionDate.getFullYear(),
    transactionDate.getMonth() + 1, // Next month
    15 // 15th day
  );
  return deadline;
}
```

---

## Compliance Validation

### Pre-Invoice Approval Checklist
- [ ] TIN/BIN verified and valid
- [ ] VAT rate correctly applied
- [ ] TDS calculation correct (if applicable)
- [ ] Fiscal year correctly identified
- [ ] Mushak 6.3 generation configured

### Implementation Pattern
```typescript
export function validateCompliance(invoice: Invoice): ValidationResult {
  const errors: string[] = [];

  // Validate TIN/BIN
  if (!isValidTIN(invoice.supplierTIN)) {
    errors.push('Invalid supplier TIN');
  }

  // Validate VAT rate
  if (!isValidVATRate(invoice.vatRate)) {
    errors.push('Invalid VAT rate');
  }

  // Validate fiscal year
  if (!isCorrectFiscalYear(invoice.fiscalYear, invoice.date)) {
    errors.push('Incorrect fiscal year');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

---

## Reference

For detailed rules and updates, refer to:
- **National Board of Revenue (NBR)**: https://nbr.gov.bd
- **VEXTRUS-PATTERNS.md**: Sections 11-13 (Bangladesh-specific compliance patterns)

---

## Usage in Vextrus ERP

This skill is automatically activated when working on:
- Invoice generation/approval
- Payment processing
- Tax calculation
- Compliance reporting
- Financial transactions

**Always ensure Bangladesh compliance rules are followed for all financial operations.**
