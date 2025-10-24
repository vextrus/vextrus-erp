---
name: Vextrus Domain Expert
version: 3.0.0
triggers:
  - "Bangladesh"
  - "VAT"
  - "TDS"
  - "AIT"
  - "Mushak"
  - "NBR"
  - "RAJUK"
  - "compliance"
  - "fiscal year"
  - "construction"
  - "real estate"
  - "property"
  - "lease"
---

# Vextrus Domain Expert Skill

## Purpose
**Bangladesh Construction & Real Estate ERP domain expertise**. Provides instant access to compliance rules, industry patterns, and copy-paste templates for Bangladesh-specific features.

---

## When This Skill Activates

**Automatic activation on**:
- Bangladesh compliance keywords (VAT, TDS, Mushak, NBR)
- Construction management (progress billing, retention, RAJUK)
- Real Estate management (property, lease, sales pipeline)
- Fiscal year calculations (July-June)

---

## 1. Bangladesh Compliance (NBR)

### VAT Rates
```typescript
// Standard rates (VAT Act 2012)
const VAT_RATES = {
  CONSTRUCTION_MATERIALS: 0.15,  // 15% standard
  ESSENTIAL_GOODS: 0.00,          // 0% exempt
  FOOD: 0.05,                     // 5% reduced
  EXPORTS: 0.00,                  // 0% zero-rated
};

// Implementation
calculateVAT(amount: Money, category: ProductCategory): Money {
  const rate = this.getVATRate(category);
  return amount.multiply(rate);
}
```

### TDS/AIT Withholding
```typescript
// TDS rates (Income Tax Ordinance 1984)
const TDS_RATES = {
  VENDOR_WITH_TIN: 0.05,      // 5% standard
  VENDOR_WITHOUT_TIN: 0.075,  // 7.5% (1.5x penalty)
  CONTRACTOR: 0.03,           // 3% for contractors
  PROFESSIONAL_SERVICE: 0.10, // 10% for professionals
  IMPORT_AIT: 0.05,           // 5% advance income tax
};

// Implementation
calculateTDS(amount: Money, vendorType: VendorType, hasTIN: boolean): Money {
  let rate = TDS_RATES.VENDOR_WITH_TIN;

  if (vendorType === VendorType.VENDOR && !hasTIN) {
    rate = TDS_RATES.VENDOR_WITHOUT_TIN;  // Penalty for no TIN
  } else if (vendorType === VendorType.CONTRACTOR) {
    rate = TDS_RATES.CONTRACTOR;
  } else if (vendorType === VendorType.PROFESSIONAL) {
    rate = TDS_RATES.PROFESSIONAL_SERVICE;
  }

  return amount.multiply(rate);
}
```

### Mushak 6.3 Generation
```typescript
// Mushak 6.3 (Commercial Invoice) - NBR Form
interface Mushak63Document {
  // Header
  challanNumber: string;
  challanDate: Date;
  buyerName: string;
  buyerBIN: string;          // 13 digits
  supplierBIN: string;       // 13 digits

  // Line items
  items: Array<{
    slNo: number;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    supplementaryDuty: number;  // If applicable
    vat: number;                // 15% standard
  }>;

  // Totals
  totalValueExcludingVAT: number;
  totalVAT: number;
  totalValue: number;

  // Signature
  issuedBy: string;
  issuedDate: Date;
  qrCode: string;  // NBR requirement
}

// Auto-generate on invoice approval
async generateMushak63(invoice: Invoice): Promise<Mushak63Document> {
  return {
    challanNumber: invoice.number,
    challanDate: invoice.issuedDate,
    buyerBIN: invoice.customer.binNumber,
    supplierBIN: process.env.COMPANY_BIN,
    items: invoice.lineItems.map((item, idx) => ({
      slNo: idx + 1,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice.amount,
      totalPrice: item.totalAmount.amount,
      supplementaryDuty: 0,
      vat: item.vatAmount.amount,
    })),
    totalValueExcludingVAT: invoice.subtotal.amount,
    totalVAT: invoice.totalVAT.amount,
    totalValue: invoice.totalAmount.amount,
    qrCode: await this.generateQRCode(invoice),
  };
}
```

### Fiscal Year (July-June, NOT calendar year)
```typescript
// Bangladesh fiscal year: July 1 - June 30
class FiscalPeriodService {
  getFiscalYear(date: Date): number {
    const month = date.getMonth();  // 0-11
    const year = date.getFullYear();

    // If July-December (months 6-11), FY = current year
    // If January-June (months 0-5), FY = previous year
    return month >= 6 ? year : year - 1;
  }

  getFiscalYearStart(fy: number): Date {
    return new Date(fy, 6, 1);  // July 1
  }

  getFiscalYearEnd(fy: number): Date {
    return new Date(fy + 1, 5, 30);  // June 30
  }

  // Q1: Jul-Sep, Q2: Oct-Dec, Q3: Jan-Mar, Q4: Apr-Jun
  getFiscalQuarter(date: Date): number {
    const fy = this.getFiscalYear(date);
    const fyStart = this.getFiscalYearStart(fy);
    const monthsSince = (date.getMonth() - fyStart.getMonth() + 12) % 12;
    return Math.floor(monthsSince / 3) + 1;
  }
}

// Example usage
// Date: August 15, 2024 → FY 2024 (July 2024 - June 2025)
// Date: March 20, 2024 → FY 2023 (July 2023 - June 2024)
```

---

## 2. Construction Project Management

### Progress Billing (% Completion)
```typescript
// Construction contract: Bill based on % completion with retention
class ProgressBillingService {
  async generateProgressInvoice(
    project: Project,
    completionPercentage: number  // 0-100
  ): Promise<Invoice> {
    // Calculate current billing amount
    const totalContractValue = project.contractValue;
    const previouslyBilled = await this.getPreviouslyBilled(project.id);
    const currentValue = totalContractValue.multiply(completionPercentage / 100);
    const billingAmount = currentValue.subtract(previouslyBilled);

    // Apply 10% retention (standard in Bangladesh)
    const retentionPercentage = 0.10;
    const retentionAmount = billingAmount.multiply(retentionPercentage);
    const netAmount = billingAmount.subtract(retentionAmount);

    // Create invoice with retention line item
    return Invoice.create(
      project.customerId,
      [
        {
          description: `Progress billing - ${completionPercentage}% complete`,
          amount: billingAmount,
        },
        {
          description: `Retention (${retentionPercentage * 100}%)`,
          amount: retentionAmount.multiply(-1),  // Deduction
        },
      ],
      project.tenantId,
    );
  }
}
```

### Project Budget Tracking
```typescript
// Track: Allocated, Spent, Committed, Available
class ProjectBudget {
  getAvailableBudget(): Money {
    return this.totalBudget
      .subtract(this.allocatedAmount)
      .subtract(this.spentAmount)
      .subtract(this.committedAmount);  // Purchase orders
  }

  allocateBudget(amount: Money, category: BudgetCategory): void {
    const available = this.getAvailableBudget();
    if (amount.isGreaterThan(available)) {
      throw new InsufficientBudgetException();
    }
    this.apply(new BudgetAllocatedEvent(category, amount));
  }
}
```

### RAJUK Approval Integration
```typescript
// RAJUK (Rajdhani Unnayan Kartripakkha) - Dhaka development authority
interface RAJUKApprovalDocument {
  approvalNumber: string;
  approvalDate: Date;
  projectType: 'RESIDENTIAL' | 'COMMERCIAL' | 'MIXED';
  plotNumber: string;
  area: number;  // Square meters
  floors: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  expiryDate: Date;
}

// Track RAJUK approval status
class ConstructionPermit {
  private rajukApproval?: RAJUKApprovalDocument;

  isApproved(): boolean {
    return this.rajukApproval?.status === 'APPROVED' &&
           new Date() < this.rajukApproval.expiryDate;
  }
}
```

---

## 3. Real Estate Management

### Property Lifecycle
```typescript
// Acquire → Develop → List → Sell/Lease
enum PropertyStatus {
  ACQUIRED = 'ACQUIRED',
  UNDER_DEVELOPMENT = 'UNDER_DEVELOPMENT',
  AVAILABLE = 'AVAILABLE',        // Ready for sale/lease
  LISTED = 'LISTED',               // On market
  SOLD = 'SOLD',
  LEASED = 'LEASED',
}

class Property {
  startDevelopment(project: DevelopmentProject): void {
    if (this.status !== PropertyStatus.ACQUIRED) {
      throw new InvalidPropertyStatusException();
    }
    this.apply(new DevelopmentStartedEvent(project));
  }

  listForSale(askingPrice: Money): void {
    if (this.status !== PropertyStatus.AVAILABLE) {
      throw new PropertyNotAvailableException();
    }
    this.apply(new PropertyListedForSaleEvent(askingPrice));
  }
}
```

### Lease Management
```typescript
// Monthly rent + security deposit + automatic invoice generation
class Lease {
  private monthlyRent: Money;
  private securityDeposit: Money;
  private paymentDay: number;  // Day of month (1-31)

  generateMonthlyInvoice(month: Date): Invoice {
    // Auto-generate rent invoice on payment day
    const dueDate = new Date(
      month.getFullYear(),
      month.getMonth(),
      this.paymentDay
    );

    return Invoice.create(
      this.tenantId,
      [
        {
          description: `Monthly rent - ${month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`,
          amount: this.monthlyRent,
        },
      ],
      dueDate,
    );
  }

  terminate(reason: LeaseTerminationReason): void {
    // Check outstanding rent before refunding security deposit
    const outstanding = this.getOutstandingRentAmount();
    const refundable = this.securityDeposit.subtract(outstanding);

    this.apply(new LeaseTerminatedEvent(reason, refundable));
  }
}
```

### Sales Pipeline
```typescript
// Lead → Viewing → Negotiation → Closed Won/Lost
enum SalesStage {
  LEAD = 'LEAD',
  QUALIFIED = 'QUALIFIED',
  VIEWING = 'VIEWING',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

class SalesOpportunity {
  scheduleViewing(date: Date): void {
    if (this.stage !== SalesStage.QUALIFIED) {
      throw new InvalidSalesStageException();
    }
    this.apply(new ViewingScheduledEvent(date));
  }

  recordOffer(amount: Money): void {
    if (this.stage !== SalesStage.NEGOTIATION) {
      throw new InvalidSalesStageException();
    }
    this.apply(new OfferReceivedEvent(amount));
  }
}
```

### Required Documents (Bangladesh)
```typescript
// Property documents required for Bangladesh real estate
const REQUIRED_DOCUMENTS = {
  LAND: ['DEED', 'SURVEY_MAP', 'RAJUK_APPROVAL', 'MUTATION'],
  APARTMENT: ['DEED', 'HOLDING_TAX_CERTIFICATE', 'OCCUPATION_CERTIFICATE'],
  COMMERCIAL: ['DEED', 'TRADE_LICENSE', 'FIRE_LICENSE', 'RAJUK_APPROVAL'],
};

// TIN/BIN validation (13 digits)
validateTIN(tin: string): boolean {
  return /^\d{13}$/.test(tin);
}
```

---

## Quick Reference

### Bangladesh Compliance
- VAT: 15% (construction), 5% (food), 0% (exports/essentials)
- TDS: 5% (with TIN), 7.5% (without TIN), 10% (professionals)
- Mushak 6.3: Auto-generate on invoice approval with QR code
- Fiscal Year: July 1 - June 30 (NOT calendar year)
- TIN/BIN: 13 digits mandatory

### Construction
- Progress billing: Based on % completion
- Retention: 10% standard (released after defect liability)
- RAJUK: Approval required for Dhaka development
- Budget: Track allocated, spent, committed, available

### Real Estate
- Property lifecycle: Acquire → Develop → List → Sell/Lease
- Lease: Monthly rent + security deposit + auto-invoicing
- Sales: Lead → Viewing → Negotiation → Closed
- Documents: Deed, RAJUK, tax certificates, licenses (depends on type)

---

**Version**: 3.0.0
**Coverage**: Bangladesh compliance + Construction + Real Estate
**Patterns Source**: VEXTRUS-PATTERNS.md sections 14, 16, 17

**See Also**:
- [VEXTRUS-PATTERNS.md](../../VEXTRUS-PATTERNS.md) - Complete patterns (sections 14, 16, 17)
- [Bangladesh Compliance Laws](https://nbr.gov.bd) - NBR official site
- [RAJUK](http://www.rajuk.gov.bd) - Dhaka development authority
