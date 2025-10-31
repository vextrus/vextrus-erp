---
name: bangladesh-erp-compliance
description: Bangladesh VAT, TDS, Mushak compliance patterns for construction & real estate ERP. Use when working with VAT calculations, TDS withholding, invoice generation, Mushak 6.3 forms, fiscal year operations, NBR compliance, tax processing, payment workflows, TIN/BIN validation, or Bangladesh financial operations.
---

# Bangladesh ERP Compliance - Complete Reference

**Auto-loaded when**: VAT, TDS, Mushak, NBR, Bangladesh, TIN, BIN, fiscal year keywords detected

---

## 1. VAT (Value Added Tax) - 15% Standard Rate

### Basic VAT Calculation
```typescript
export class VATCalculationService {
  private readonly STANDARD_VAT_RATE = 0.15;  // 15% for construction
  private readonly REDUCED_VAT_RATE = 0.05;   // 5% for some items
  private readonly ZERO_VAT_RATE = 0.0;       // 0% for exports

  calculateVAT(lineItem: LineItem, category: ProductCategory): Money {
    const rate = this.getVATRate(category);
    return lineItem.amount.multiply(rate);
  }

  private getVATRate(category: ProductCategory): number {
    switch (category) {
      case ProductCategory.CONSTRUCTION_MATERIALS:
        return this.STANDARD_VAT_RATE;  // 15%
      case ProductCategory.ESSENTIAL_GOODS:
        return this.ZERO_VAT_RATE;      // 0%
      default:
        return this.STANDARD_VAT_RATE;
    }
  }
}
```

### VAT Due Date
```typescript
// VAT returns due by 15th of next month
calculateVATDueDate(transactionDate: Date): Date {
  const dueDate = new Date(transactionDate);
  dueDate.setMonth(dueDate.getMonth() + 1);
  dueDate.setDate(15); // 15th of next month

  // Handle Bangladesh weekends (Friday-Saturday)
  const dayOfWeek = dueDate.getDay();
  if (dayOfWeek === 5) dueDate.setDate(dueDate.getDate() + 2); // Friday → Sunday
  else if (dayOfWeek === 6) dueDate.setDate(dueDate.getDate() + 1); // Saturday → Sunday

  return dueDate;
}
```

---

## 2. TDS/AIT (Tax Deducted at Source)

### TDS Rates by Vendor Type
```typescript
export class TDSCalculationService {
  private readonly TDS_RATES = {
    CONTRACTOR: 0.07,           // 7%
    PROFESSIONAL_SERVICE: 0.10, // 10%
    SUPPLIER: 0.04,             // 4%
    RENT: 0.05,                 // 5%
    TRANSPORT: 0.03,            // 3%
    VENDOR_WITH_TIN: 0.05,      // 5%
    VENDOR_WITHOUT_TIN: 0.075,  // 7.5% (1.5x penalty)
  };

  calculateTDS(payment: Payment, vendorType: VendorType, hasTIN: boolean): Money {
    let rate = vendorType === VendorType.VENDOR && !hasTIN
      ? this.TDS_RATES.VENDOR_WITHOUT_TIN  // 7.5% penalty
      : this.TDS_RATES.VENDOR_WITH_TIN;    // 5% standard

    return payment.amount.multiply(rate);
  }
}
```

### TDS Calculation with 1.5x Penalty (No TIN)
```typescript
private readonly NO_TIN_MULTIPLIER = 1.5;

calculateTDS(amount: Decimal, vendorType: VendorType, hasTIN: boolean) {
  let baseRate = this.TDS_RATES[vendorType] || 0;
  let rate = hasTIN ? baseRate : baseRate * this.NO_TIN_MULTIPLIER;

  return {
    tax: amount.mul(rate),
    rate,
    description: hasTIN
      ? `TDS for ${vendorType} @ ${rate * 100}%`
      : `TDS for ${vendorType} (No TIN - 1.5x rate) @ ${rate * 100}%`
  };
}
```

---

## 3. Mushak 6.3 (VAT Challan)

### Mushak 6.3 Generation
```typescript
export class Mushak63Service {
  async generateMushak63(invoice: Invoice): Promise<Mushak63Document> {
    return {
      challanNumber: invoice.challanNumber,
      buyerName: invoice.customer.name,
      buyerBIN: invoice.customer.binNumber,
      supplierBIN: process.env.COMPANY_BIN,

      items: invoice.lineItems.map((item, index) => ({
        slNo: index + 1,
        description: item.description,
        totalPrice: item.totalAmount.amount,
        vat: item.vatAmount.amount,
      })),

      totalVAT: invoice.totalVAT.amount,
      qrCode: await this.generateQRCode(invoice),
    };
  }
}
```

### NBR Submission
```typescript
async submitMushakForm(mushak: MushakSubmission): Promise<NBRSubmissionResponse> {
  const payload = {
    formType: '6.3',
    formData: this.encryptData(mushak.formData),
    submissionId: uuidv4(),
    timestamp: new Date().toISOString()
  };

  const response = await this.httpService.post(
    `${this.nbrApiUrl}/mushak/submit`,
    payload,
    { headers: { 'Authorization': `Bearer ${this.apiKey}` } }
  );

  return {
    submissionId: response.data.submissionId,
    status: response.data.status, // 'PENDING' | 'ACCEPTED' | 'REJECTED'
    referenceNumber: response.data.referenceNumber
  };
}
```

---

## 4. Fiscal Year (July 1 - June 30)

### Fiscal Year Calculation
```typescript
export class FiscalPeriodService {
  getFiscalYear(date: Date): number {
    const month = date.getMonth();
    const year = date.getFullYear();
    return month >= 6 ? year : year - 1;  // Fiscal year starts July
  }

  getFiscalYearStart(fiscalYear: number): Date {
    return new Date(fiscalYear, 6, 1);  // July 1st
  }

  getFiscalYearEnd(fiscalYear: number): Date {
    return new Date(fiscalYear + 1, 5, 30);  // June 30th
  }

  getCurrentFiscalYear(date?: Date): FiscalYear {
    const currentDate = date || new Date();
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    if (month >= 6) { // July-December
      return {
        year: `${year}-${year + 1}`,
        startDate: new Date(year, 6, 1),
        endDate: new Date(year + 1, 5, 30),
        currentQuarter: month >= 6 && month <= 8 ? 1 : 2
      };
    } else { // January-June
      return {
        year: `${year - 1}-${year}`,
        startDate: new Date(year - 1, 6, 1),
        endDate: new Date(year, 5, 30),
        currentQuarter: month <= 2 ? 3 : 4
      };
    }
  }
}
```

---

## 5. TIN/BIN Validation

### TIN (Tax Identification Number) - 10-12 digits
```typescript
class TIN {
  static create(value: string): TIN {
    const normalized = value.replace(/[\s-]/g, '');
    if (!/^\d{10,12}$/.test(normalized)) {
      throw new Error('TIN must be 10-12 digits');
    }
    if (normalized.startsWith('0')) {
      throw new Error('TIN cannot start with 0');
    }
    return new TIN(normalized);
  }

  getFormatted(): string {
    // 10 digits: XXX-XXXX-XXX, 12 digits: XXXX-XXXX-XXXX
    if (this.value.length === 10) {
      return `${this.value.slice(0, 3)}-${this.value.slice(3, 7)}-${this.value.slice(7)}`;
    }
    return `${this.value.slice(0, 4)}-${this.value.slice(4, 8)}-${this.value.slice(8)}`;
  }
}
```

### BIN (Business Identification Number) - Exactly 9 digits
```typescript
class BIN {
  static create(value: string): BIN {
    const normalized = value.trim().replace(/[\s-]/g, '');
    if (!/^\d{9}$/.test(normalized)) {
      throw new Error('BIN must be exactly 9 digits');
    }
    return new BIN(normalized);
  }

  format(): string {
    return `${this.value.substring(0, 3)}-${this.value.substring(3, 6)}-${this.value.substring(6, 9)}`;
  }
}
```

### NBR Verification
```typescript
async verifyTIN(tinNumber: string): Promise<TINVerificationResponse> {
  const response = await this.httpService.post(
    `${this.nbrApiUrl}/verification/tin`,
    { tinNumber },
    { headers: { 'Authorization': `Bearer ${this.apiKey}` } }
  );

  return {
    valid: response.data.valid,
    name: response.data.name,
    status: response.data.status, // 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
    taxCircle: response.data.taxCircle
  };
}
```

---

## 6. Combined Tax Calculations

### Invoice with VAT + TDS + Supplementary Duty
```typescript
async calculateCombinedTaxes(
  amount: number,
  vendorType: VendorType,
  productCategory: ProductCategory,
  hasTIN: boolean
): Promise<TaxCalculationResult> {
  let totalTax = new Decimal(0);
  const breakdown = [];

  // 1. Supplementary Duty (if luxury item)
  if (productCategory === ProductCategory.LUXURY) {
    const sd = amount * 0.20; // 20%
    breakdown.push({ component: 'Supplementary Duty', amount: sd, rate: 0.20 });
    totalTax = totalTax.add(sd);
    amount += sd; // SD is part of base for VAT
  }

  // 2. VAT (15% on base + SD)
  const vat = amount * 0.15;
  breakdown.push({ component: 'VAT', amount: vat, rate: 0.15 });
  totalTax = totalTax.add(vat);

  // 3. TDS (withholding from payment)
  const tdsRate = hasTIN ? 0.05 : 0.075; // 7.5% if no TIN
  const tds = amount * tdsRate;
  breakdown.push({ component: 'TDS', amount: tds, rate: tdsRate });
  totalTax = totalTax.add(tds);

  return {
    originalAmount: amount,
    totalTaxAmount: totalTax.toNumber(),
    breakdown
  };
}
```

---

## 7. Compliance Checklist

### Before Invoice Approval
```typescript
async checkInvoiceCompliance(invoice: Invoice): Promise<InvoiceComplianceCheck> {
  return {
    tinVerified: await this.verifyTIN(invoice.supplierTIN).then(r => r.valid),
    binVerified: await this.verifyBIN(invoice.supplierBIN).then(r => r.valid),
    vatRateCorrect: invoice.vatRate === 0.15,
    tdsCalculated: invoice.tdsAmount > 0,
    fiscalYearCorrect: this.isCurrentFiscalYear(invoice.fiscalYear),
    mushakConfigured: invoice.mushak63Generated === true
  };
}
```

### Monthly Compliance Tasks
```typescript
async monthlyComplianceTasks(tenantId: string, month: Date) {
  return {
    generateMushakForms: await this.generateMonthlyMushakForms(tenantId, month),
    calculateVATSummary: await this.calculateMonthlyVATSummary(tenantId, month),
    verifyTDSWithholdings: await this.verifyMonthlyTDSWithholdings(tenantId, month),
    prepareVATReturn: await this.prepareVATReturn(tenantId, month),
    scheduleNBRSubmission: await this.scheduleNBRSubmission(tenantId, month)
  };
}
```

---

## 8. Best Practices (CRITICAL)

✅ **ALWAYS**:
- Apply VAT to construction materials (15%)
- Withhold TDS for vendors without TIN (1.5x rate = 7.5%)
- Generate Mushak 6.3 on invoice approval
- Use fiscal year July-June for financial reports
- Validate TIN/BIN before invoice approval
- Submit VAT returns by 15th of next month

❌ **NEVER**:
- Charge VAT on exports (0%)
- Use calendar year for financial reporting
- Skip Mushak 6.3 generation
- Process payments without TDS calculation
- Accept invoices without valid TIN/BIN

---

**Self-Contained**: All patterns inline, NO external dependencies
**Production-Ready**: Extracted from live Vextrus ERP codebase
**NBR Compliant**: Follows National Board of Revenue regulations
