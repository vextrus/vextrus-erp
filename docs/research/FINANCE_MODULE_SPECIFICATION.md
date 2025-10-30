# Finance Module Specification - Vextrus ERP

## Executive Summary
This specification defines the comprehensive Finance module for Vextrus ERP, designed specifically for Bangladesh's construction and real estate industry. It incorporates NBR compliance, Bangladesh Accounting Standards (BAS), and local payment gateway integrations.

## Domain Model

### Core Entities

```typescript
// 1. Chart of Accounts
interface ChartOfAccount {
  id: string
  code: string // Unique account code
  name: string
  nameBengali: string
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
  subType: string // Current Asset, Fixed Asset, etc.
  parentAccountId?: string // For hierarchical structure
  currency: 'BDT' | 'USD' | 'EUR'
  isActive: boolean
  taxCategory?: 'VAT' | 'AIT' | 'EXEMPT'
  nbrCode?: string // NBR mapping code for reports
  createdAt: Date
  updatedAt: Date
}

// 2. Journal Entry (Double-Entry Bookkeeping)
interface JournalEntry {
  id: string
  entryNumber: string // JE-2024-001
  date: Date
  description: string
  status: 'DRAFT' | 'POSTED' | 'REVERSED'
  fiscalYear: string // 2024-2025 (July-June)
  fiscalPeriod: number // 1-12
  source: 'MANUAL' | 'INVOICE' | 'PAYMENT' | 'PAYROLL' | 'IMPORT'
  sourceDocumentId?: string
  reversalOf?: string // For reversed entries
  approvedBy?: string
  postedBy?: string
  postedAt?: Date
  totalDebit: Decimal
  totalCredit: Decimal
  attachments: Attachment[]
  auditLog: AuditEntry[]
}

// 3. Journal Line Items
interface JournalLine {
  id: string
  journalEntryId: string
  lineNumber: number
  accountId: string
  debitAmount?: Decimal
  creditAmount?: Decimal
  currency: string
  exchangeRate: Decimal // To BDT
  baseCurrencyAmount: Decimal // Always in BDT
  description?: string
  projectId?: string // For project accounting
  costCenterId?: string
  dimensionData?: JsonObject // Flexible dimensions
  taxData?: {
    vatAmount?: Decimal
    aitAmount?: Decimal
    taxCode?: string
  }
}

// 4. Invoice (Sales/Purchase)
interface Invoice {
  id: string
  invoiceNumber: string // INV-2024-001
  type: 'SALES' | 'PURCHASE'
  customerId?: string
  vendorId?: string
  date: Date
  dueDate: Date
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'PAID' | 'OVERDUE' | 'CANCELLED'

  // Bangladesh Specific
  tin?: string // Tax Identification Number
  bin?: string // Business Identification Number
  vatChallanNo?: string
  mushakNumber?: string // NBR form number

  // Amounts
  subtotal: Decimal
  vatAmount: Decimal // 15% standard
  aitAmount: Decimal // Advance Income Tax
  discountAmount: Decimal
  totalAmount: Decimal
  currency: string
  exchangeRate: Decimal

  // Payment terms
  paymentTerms: string
  paymentMethod?: 'CASH' | 'BANK' | 'BKASH' | 'NAGAD' | 'CHECK'

  items: InvoiceItem[]
  payments: Payment[]
  attachments: Attachment[]
}

// 5. Payment
interface Payment {
  id: string
  paymentNumber: string // PAY-2024-001
  type: 'INCOMING' | 'OUTGOING'
  date: Date
  amount: Decimal
  currency: string
  exchangeRate: Decimal
  method: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'BKASH' | 'NAGAD' | 'CARD'

  // Bank/Gateway Details
  bankAccountId?: string
  checkNumber?: string
  transactionId?: string // From payment gateway
  gatewayResponse?: JsonObject

  // References
  invoiceIds: string[] // Can pay multiple invoices
  customerId?: string
  vendorId?: string

  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  reconciledAt?: Date

  // Bangladesh Specific
  vatOnPayment?: Decimal
  tdsAmount?: Decimal // Tax Deducted at Source

  attachments: Attachment[]
}

// 6. Tax Configuration
interface TaxConfiguration {
  id: string
  name: string
  type: 'VAT' | 'AIT' | 'TDS' | 'CUSTOMS'
  rate: Decimal
  effectiveFrom: Date
  effectiveTo?: Date

  // NBR Requirements
  nbrCode: string
  mushakForm?: string

  // Calculation Rules
  calculationMethod: 'PERCENTAGE' | 'FIXED' | 'TIERED'
  tiers?: TaxTier[]

  // Applicability
  applicableToSales: boolean
  applicableToPurchase: boolean
  applicableToImport: boolean
  exemptCategories: string[]
}

// 7. Bank Account
interface BankAccount {
  id: string
  accountName: string
  accountNumber: string
  bankName: string
  branch: string
  routingNumber: string // Bangladesh Bank routing
  accountType: 'CURRENT' | 'SAVINGS' | 'LOAN' | 'CC'
  currency: string
  currentBalance: Decimal

  // Integration
  isIntegrated: boolean
  integrationProvider?: 'BRAC' | 'DBBL' | 'EBL' | 'CUSTOM'
  lastSyncAt?: Date

  // Reconciliation
  lastReconciledDate?: Date
  reconciledBalance?: Decimal
}
```

## Business Rules & Calculations

### 1. VAT Calculation (NBR Compliant)

```typescript
class VATCalculator {
  private readonly STANDARD_RATE = 0.15 // 15% as per NBR
  private readonly REDUCED_RATES = {
    'ESSENTIAL_GOODS': 0.05,
    'EXPORT': 0,
    'CONSTRUCTION_RAW_MATERIAL': 0.075
  }

  calculateVAT(amount: Decimal, category: string): VATResult {
    const rate = this.getApplicableRate(category)
    const vatExclusive = amount
    const vatAmount = amount * rate
    const vatInclusive = amount + vatAmount

    return {
      rate,
      vatExclusive,
      vatAmount,
      vatInclusive,
      mushakApplicable: this.getMushakForm(category)
    }
  }

  // Reverse VAT calculation for inclusive amounts
  reverseCalculateVAT(inclusiveAmount: Decimal, rate: Decimal): VATResult {
    const vatExclusive = inclusiveAmount / (1 + rate)
    const vatAmount = inclusiveAmount - vatExclusive

    return { vatExclusive, vatAmount, vatInclusive: inclusiveAmount, rate }
  }

  private getMushakForm(category: string): string {
    const mushakMapping = {
      'SALES': 'Mushak-6.3',
      'PURCHASE': 'Mushak-6.1',
      'RETURN': 'Mushak-6.2',
      'SERVICE': 'Mushak-6.4'
    }
    return mushakMapping[category] || 'Mushak-6.3'
  }
}
```

### 2. Fiscal Year Management (Bangladesh)

```typescript
class FiscalYearManager {
  // Bangladesh fiscal year: July 1 - June 30

  getCurrentFiscalYear(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    if (month >= 7) {
      return `${year}-${year + 1}`
    } else {
      return `${year - 1}-${year}`
    }
  }

  getFiscalPeriod(date: Date): number {
    const month = date.getMonth() + 1
    // July = Period 1, June = Period 12
    return month >= 7 ? month - 6 : month + 6
  }

  getFiscalQuarter(period: number): number {
    return Math.ceil(period / 3)
  }

  // NBR Tax Year (July - June)
  getTaxYear(date: Date): string {
    return this.getCurrentFiscalYear()
  }
}
```

### 3. Double-Entry Validation

```typescript
class DoubleEntryValidator {
  validateJournalEntry(entry: JournalEntry, lines: JournalLine[]): ValidationResult {
    const errors: string[] = []

    // Rule 1: Must have at least 2 lines
    if (lines.length < 2) {
      errors.push('Journal entry must have at least 2 lines')
    }

    // Rule 2: Total debits must equal total credits
    const totalDebits = lines.reduce((sum, line) =>
      sum + (line.debitAmount || 0), 0)
    const totalCredits = lines.reduce((sum, line) =>
      sum + (line.creditAmount || 0), 0)

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      errors.push(`Debits (${totalDebits}) must equal Credits (${totalCredits})`)
    }

    // Rule 3: Each line must have either debit or credit, not both
    lines.forEach((line, index) => {
      if (line.debitAmount && line.creditAmount) {
        errors.push(`Line ${index + 1}: Cannot have both debit and credit`)
      }
      if (!line.debitAmount && !line.creditAmount) {
        errors.push(`Line ${index + 1}: Must have either debit or credit`)
      }
    })

    // Rule 4: Account validation
    lines.forEach((line, index) => {
      if (!line.accountId) {
        errors.push(`Line ${index + 1}: Account is required`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
```

## Feature Specifications

### 1. Chart of Accounts Management

**Features:**
- Hierarchical account structure (up to 5 levels)
- Account templates for construction industry
- NBR-compliant account codes
- Multi-currency support
- Account mapping for financial reports

**Bangladesh-Specific Requirements:**
- Pre-configured accounts for VAT, AIT, TDS
- Mushak form mapping
- NBR report code mapping

### 2. Invoice Management

**Features:**
- Sales & Purchase invoices
- Recurring invoices
- Multi-currency invoicing
- Partial payments
- Credit notes and debit notes

**NBR Compliance:**
- Auto-generate Mushak 6.3 for sales
- VAT calculation as per NBR rules
- TIN/BIN validation
- VAT challan number tracking

### 3. Payment Processing

**Supported Gateways:**
```typescript
interface PaymentGatewayConfig {
  bkash: {
    appKey: string
    appSecret: string
    username: string
    password: string
    baseUrl: string
  }
  nagad: {
    merchantId: string
    publicKey: string
    privateKey: string
    baseUrl: string
  }
  sslcommerz: {
    storeId: string
    storePassword: string
    baseUrl: string
  }
}
```

### 4. Financial Reports

**Standard Reports:**
1. **Balance Sheet** (Statement of Financial Position)
2. **Income Statement** (Profit & Loss)
3. **Cash Flow Statement**
4. **Trial Balance**
5. **General Ledger**
6. **Aged Receivables/Payables**

**NBR Required Reports:**
1. **Mushak Returns:**
   - Mushak 9.1 (VAT Return)
   - Mushak 6.3 (Sales Invoice)
   - Mushak 6.1 (Purchase Record)
   - Mushak 6.2.1 (Credit Note)

2. **Tax Reports:**
   - VAT Report (Monthly)
   - AIT Report (Quarterly)
   - TDS Statement
   - Annual Tax Return

**Construction Industry Reports:**
1. Project-wise Profit & Loss
2. Work-in-Progress (WIP) Report
3. Project Cost Analysis
4. Contractor Payment Summary
5. Material Cost Variance Report

### 5. Bank Reconciliation

**Features:**
- Auto-import bank statements
- Smart matching algorithms
- Manual reconciliation override
- Reconciliation reports

**Bangladesh Bank Integration:**
- BEFTN transaction import
- RTGS tracking
- Mobile banking reconciliation (bKash/Nagad)

## GraphQL Schema

```graphql
type FinanceModule {
  # Chart of Accounts
  accounts(filter: AccountFilter, page: Int, limit: Int): AccountConnection!
  account(id: ID!): ChartOfAccount

  # Journal Entries
  journalEntries(filter: JournalFilter, page: Int, limit: Int): JournalConnection!
  journalEntry(id: ID!): JournalEntry

  # Invoices
  invoices(filter: InvoiceFilter, page: Int, limit: Int): InvoiceConnection!
  invoice(id: ID!): Invoice

  # Payments
  payments(filter: PaymentFilter, page: Int, limit: Int): PaymentConnection!
  payment(id: ID!): Payment

  # Reports
  balanceSheet(date: Date!): BalanceSheetReport!
  incomeStatement(startDate: Date!, endDate: Date!): IncomeStatementReport!
  vatReturn(period: String!): VATReturnReport!

  # Dashboard Metrics
  dashboardMetrics: FinanceDashboard!
}

type Mutation {
  # Journal Operations
  createJournalEntry(input: JournalEntryInput!): JournalEntry!
  postJournalEntry(id: ID!): JournalEntry!
  reverseJournalEntry(id: ID!, reason: String!): JournalEntry!

  # Invoice Operations
  createInvoice(input: InvoiceInput!): Invoice!
  sendInvoice(id: ID!): Invoice!
  approveInvoice(id: ID!): Invoice!

  # Payment Operations
  recordPayment(input: PaymentInput!): Payment!
  reconcilePayments(paymentIds: [ID!]!): ReconciliationResult!

  # Gateway Operations
  initiateBkashPayment(input: BkashPaymentInput!): BkashPaymentResponse!
  confirmBkashPayment(paymentId: String!): Payment!
}

type Subscription {
  invoiceStatusChanged(invoiceId: ID!): Invoice!
  paymentReceived(customerId: ID!): Payment!
  journalPosted: JournalEntry!
}
```

## Database Schema

```sql
-- Core Tables
CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_bengali VARCHAR(255),
  type VARCHAR(20) NOT NULL,
  sub_type VARCHAR(50),
  parent_account_id UUID REFERENCES chart_of_accounts(id),
  currency CHAR(3) DEFAULT 'BDT',
  is_active BOOLEAN DEFAULT true,
  tax_category VARCHAR(20),
  nbr_code VARCHAR(20),
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal Entries
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_number VARCHAR(20) UNIQUE NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'DRAFT',
  fiscal_year VARCHAR(9) NOT NULL,
  fiscal_period INT NOT NULL,
  source VARCHAR(20),
  source_document_id UUID,
  reversal_of UUID REFERENCES journal_entries(id),
  approved_by UUID,
  posted_by UUID,
  posted_at TIMESTAMPTZ,
  total_debit DECIMAL(20,4) NOT NULL,
  total_credit DECIMAL(20,4) NOT NULL,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT debit_credit_balance CHECK (total_debit = total_credit)
);

-- Journal Lines
CREATE TABLE journal_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id),
  line_number INT NOT NULL,
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  debit_amount DECIMAL(20,4),
  credit_amount DECIMAL(20,4),
  currency CHAR(3) DEFAULT 'BDT',
  exchange_rate DECIMAL(10,6) DEFAULT 1,
  base_currency_amount DECIMAL(20,4) NOT NULL,
  description TEXT,
  project_id UUID,
  cost_center_id UUID,
  dimension_data JSONB,
  tax_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT either_debit_or_credit CHECK (
    (debit_amount IS NOT NULL AND credit_amount IS NULL) OR
    (debit_amount IS NULL AND credit_amount IS NOT NULL)
  )
);

-- Add audit trigger
CREATE TRIGGER journal_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION create_audit_entry();

-- Indexes for performance
CREATE INDEX idx_journal_entries_date ON journal_entries(date);
CREATE INDEX idx_journal_entries_fiscal ON journal_entries(fiscal_year, fiscal_period);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_payments_date ON payments(date);
```

## Integration Specifications

### 1. bKash Integration

```typescript
class BkashIntegration {
  async createPayment(invoice: Invoice): Promise<BkashPaymentResponse> {
    // Step 1: Get token
    const token = await this.authenticate()

    // Step 2: Create payment
    const payload = {
      mode: '0011', // Checkout
      payerReference: invoice.customerId,
      callbackURL: `${BASE_URL}/api/webhooks/bkash/callback`,
      merchantAssociationInfo: 'MI05MID54RF09123456One',
      amount: invoice.totalAmount.toString(),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: invoice.invoiceNumber
    }

    const response = await fetch(`${BKASH_API}/checkout/payment/create`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'X-APP-Key': process.env.BKASH_APP_KEY
      },
      body: JSON.stringify(payload)
    })

    return response.json()
  }

  async executePayment(paymentId: string): Promise<Payment> {
    // Execute payment after customer authorization
    const response = await fetch(`${BKASH_API}/checkout/payment/execute/${paymentId}`, {
      method: 'POST',
      headers: this.getHeaders()
    })

    const result = await response.json()

    // Record in our system
    return this.recordPayment(result)
  }
}
```

### 2. NBR API Integration

```typescript
class NBRIntegration {
  async submitVATReturn(period: string): Promise<NBRSubmissionResult> {
    const vatData = await this.prepareVATReturn(period)

    // Generate Mushak 9.1
    const mushak91 = {
      taxPeriod: period,
      tin: process.env.COMPANY_TIN,
      totalSales: vatData.totalSales,
      totalVATCollected: vatData.vatCollected,
      totalPurchases: vatData.totalPurchases,
      totalVATPaid: vatData.vatPaid,
      netVATPayable: vatData.vatCollected - vatData.vatPaid
    }

    // Submit to NBR
    const response = await fetch(`${NBR_API}/vat-return/submit`, {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.NBR_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mushak91)
    })

    return response.json()
  }
}
```

## Security & Compliance

### 1. Data Encryption
- All financial data encrypted at rest using AES-256
- PII fields (TIN, BIN, bank accounts) use field-level encryption
- Audit logs are immutable and tamper-proof

### 2. Access Control
```typescript
const FINANCE_PERMISSIONS = {
  // Read permissions
  'finance.accounts.read': 'View chart of accounts',
  'finance.journals.read': 'View journal entries',
  'finance.invoices.read': 'View invoices',
  'finance.reports.read': 'View financial reports',

  // Write permissions
  'finance.journals.create': 'Create journal entries',
  'finance.journals.post': 'Post journal entries',
  'finance.invoices.create': 'Create invoices',
  'finance.invoices.approve': 'Approve invoices',
  'finance.payments.create': 'Record payments',

  // Admin permissions
  'finance.accounts.manage': 'Manage chart of accounts',
  'finance.period.close': 'Close financial periods',
  'finance.audit.view': 'View audit logs'
}
```

### 3. Audit Requirements
- All financial transactions logged with user, timestamp, and changes
- Audit trail cannot be modified or deleted
- Compliant with Bangladesh Financial Reporting Act

## Performance Requirements

### Response Times
- Dashboard load: < 2 seconds
- Report generation: < 5 seconds
- Invoice creation: < 1 second
- Payment processing: < 3 seconds

### Scalability
- Support 10,000+ invoices per month
- Handle 100+ concurrent users
- Process 1,000+ journal entries daily
- Store 7 years of financial data

## Testing Requirements

### Unit Tests
- 90% code coverage for business logic
- All tax calculations tested
- Currency conversion accuracy

### Integration Tests
- Payment gateway mock testing
- NBR API integration testing
- Bank reconciliation scenarios

### Compliance Tests
- VAT calculation accuracy
- Mushak form generation
- Fiscal year boundaries
- Audit trail completeness

## Implementation Timeline

### Phase 1: Core Finance (Week 1-3)
- Chart of Accounts
- Journal Entries
- Basic Reports

### Phase 2: Invoicing (Week 4-5)
- Invoice Management
- VAT Calculations
- Mushak Forms

### Phase 3: Payments (Week 6-7)
- Payment Recording
- Gateway Integration
- Reconciliation

### Phase 4: Reporting (Week 8-9)
- Financial Statements
- NBR Reports
- Analytics Dashboard

### Phase 5: Integration (Week 10)
- Testing
- Security Audit
- Go-Live Preparation

---

This specification provides a comprehensive blueprint for implementing a fully-featured, Bangladesh-compliant Finance module for Vextrus ERP.