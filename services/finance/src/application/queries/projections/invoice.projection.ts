import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Money } from '../../../domain/value-objects/money.value-object';

@Entity('invoice_projections')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'vendorId'])
@Index(['tenantId', 'customerId'])
@Index(['tenantId', 'invoiceDate'])
@Index(['tenantId', 'dueDate'])
@Index(['tenantId', 'mushakNumber'])
export class InvoiceProjection {
  @PrimaryColumn()
  id!: string;

  @Column()
  invoiceNumber!: string;

  @Column()
  @Index()
  tenantId!: string;

  @Column()
  vendorId!: string;

  @Column({ nullable: true })
  vendorName?: string;

  @Column({ nullable: true })
  vendorTin?: string;

  @Column({ nullable: true })
  vendorBin?: string;

  @Column()
  customerId!: string;

  @Column({ nullable: true })
  customerName?: string;

  @Column({ nullable: true })
  customerTin?: string;

  @Column({ nullable: true })
  customerBin?: string;

  @Column('jsonb')
  lineItems!: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    vatCategory: string;
    vatRate: number;
    vatAmount: number;
    hsCode?: string;
    supplementaryDuty?: number;
    advanceIncomeTax?: number;
  }>;

  @Column('decimal', { precision: 15, scale: 2 })
  subtotal!: number;

  @Column('decimal', { precision: 15, scale: 2 })
  vatAmount!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  supplementaryDuty!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  advanceIncomeTax!: number;

  @Column('decimal', { precision: 15, scale: 2 })
  grandTotal!: number;

  @Column({ default: 'BDT' })
  currency!: string;

  @Column()
  status!: string;

  @Column({ nullable: true })
  mushakNumber?: string;

  @Column({ nullable: true })
  challanNumber?: string;

  @Column('date')
  invoiceDate!: Date;

  @Column('date')
  dueDate!: Date;

  @Column()
  fiscalYear!: string;

  @Column({ nullable: true })
  approvedBy?: string;

  @Column({ nullable: true })
  approvedAt?: Date;

  @Column({ nullable: true })
  workflowId?: string;

  @Column({ nullable: true })
  paymentStatus?: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  paidAmount!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  balanceAmount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true })
  lastEventSequence?: number;
}

@Entity('payment_projections')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'invoiceId'])
@Index(['tenantId', 'paymentDate'])
@Index(['tenantId', 'paymentMethod'])
export class PaymentProjection {
  @PrimaryColumn()
  id!: string;

  @Column()
  paymentNumber!: string;

  @Column()
  @Index()
  tenantId!: string;

  @Column()
  invoiceId!: string;

  @Column({ nullable: true })
  invoiceNumber?: string;

  @Column('decimal', { precision: 15, scale: 2 })
  amount!: number;

  @Column({ default: 'BDT' })
  currency!: string;

  @Column()
  paymentMethod!: string;

  @Column({ nullable: true })
  bankAccountId?: string;

  @Column({ nullable: true })
  checkNumber?: string;

  @Column('jsonb', { nullable: true })
  mobileWallet?: {
    provider: string;
    mobileNumber: string;
    transactionId: string;
    merchantCode?: string;
  };

  @Column()
  status!: string;

  @Column('date')
  paymentDate!: Date;

  @Column({ nullable: true })
  reference?: string;

  @Column({ nullable: true })
  transactionReference?: string;

  @Column({ nullable: true })
  reconciledAt?: Date;

  @Column({ nullable: true })
  reconciledBy?: string;

  @Column({ nullable: true })
  bankTransactionId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true })
  lastEventSequence?: number;
}

@Entity('journal_projections')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'journalDate'])
@Index(['tenantId', 'journalType'])
@Index(['tenantId', 'fiscalPeriod'])
export class JournalProjection {
  @PrimaryColumn()
  id!: string;

  @Column()
  journalNumber!: string;

  @Column()
  @Index()
  tenantId!: string;

  @Column('date')
  journalDate!: Date;

  @Column()
  journalType!: string;

  @Column()
  description!: string;

  @Column({ nullable: true })
  reference?: string;

  @Column('jsonb')
  entries!: Array<{
    lineId: string;
    accountId: string;
    accountCode?: string;
    accountName?: string;
    debitAmount: number;
    creditAmount: number;
    description?: string;
    costCenter?: string;
    project?: string;
    taxCode?: string;
  }>;

  @Column('decimal', { precision: 15, scale: 2 })
  totalDebit!: number;

  @Column('decimal', { precision: 15, scale: 2 })
  totalCredit!: number;

  @Column({ default: 'BDT' })
  currency!: string;

  @Column()
  status!: string;

  @Column()
  fiscalPeriod!: string;

  @Column({ nullable: true })
  postedBy?: string;

  @Column({ nullable: true })
  postedAt?: Date;

  @Column({ default: false })
  isReversing!: boolean;

  @Column({ nullable: true })
  originalJournalId?: string;

  @Column({ nullable: true })
  reversingDate?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true })
  lastEventSequence?: number;
}

@Entity('account_balance_projections')
@Index(['tenantId', 'accountId'])
@Index(['tenantId', 'accountCode'])
@Index(['tenantId', 'accountType'])
@Index(['tenantId', 'period'])
export class AccountBalanceProjection {
  @PrimaryColumn()
  id!: string;

  @Column()
  @Index()
  tenantId!: string;

  @Column()
  accountId!: string;

  @Column()
  accountCode!: string;

  @Column()
  accountName!: string;

  @Column()
  accountType!: string;

  @Column({ nullable: true })
  parentAccountId?: string;

  @Column()
  period!: string; // Format: YYYY-MM

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  openingBalance!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  debitAmount!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  creditAmount!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  closingBalance!: number;

  @Column({ default: 'BDT' })
  currency!: string;

  @Column({ default: 0 })
  transactionCount!: number;

  @Column({ nullable: true })
  lastTransactionDate?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

// Financial Summary Projections for Dashboard
@Entity('financial_summary_projections')
@Index(['tenantId', 'period'])
@Index(['tenantId', 'fiscalYear'])
export class FinancialSummaryProjection {
  @PrimaryColumn()
  id!: string;

  @Column()
  @Index()
  tenantId!: string;

  @Column()
  period!: string; // Format: YYYY-MM

  @Column()
  fiscalYear!: string;

  // Revenue Summary
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalRevenue!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalVATCollected!: number;

  @Column({ default: 0 })
  invoiceCount!: number;

  // Expense Summary
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalExpenses!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalVATPaid!: number;

  @Column({ default: 0 })
  billCount!: number;

  // Payment Summary
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalPaymentsReceived!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalPaymentsMade!: number;

  @Column({ default: 0 })
  paymentCount!: number;

  // Outstanding Summary
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  accountsReceivable!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  accountsPayable!: number;

  @Column({ default: 0 })
  overdueInvoices!: number;

  @Column({ default: 0 })
  overdueBills!: number;

  // Cash Flow
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  netCashFlow!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  operatingCashFlow!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  investingCashFlow!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  financingCashFlow!: number;

  // Profitability
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  grossProfit!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  netProfit!: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  profitMargin!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

// Vendor/Customer Transaction Summary
@Entity('entity_transaction_projections')
@Index(['tenantId', 'entityType', 'entityId'])
@Index(['tenantId', 'entityType', 'period'])
export class EntityTransactionProjection {
  @PrimaryColumn()
  id!: string;

  @Column()
  @Index()
  tenantId!: string;

  @Column()
  entityType!: 'VENDOR' | 'CUSTOMER';

  @Column()
  entityId!: string;

  @Column()
  entityName!: string;

  @Column({ nullable: true })
  entityTin?: string;

  @Column({ nullable: true })
  entityBin?: string;

  @Column()
  period!: string; // Format: YYYY-MM

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  openingBalance!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalInvoiced!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalPaid!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  closingBalance!: number;

  @Column({ default: 0 })
  transactionCount!: number;

  @Column({ default: 0 })
  overdueCount!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  overdueAmount!: number;

  @Column({ nullable: true })
  lastTransactionDate?: Date;

  @Column({ nullable: true })
  creditLimit?: number;

  @Column({ nullable: true })
  paymentTerms?: number;

  @Column('jsonb', { nullable: true })
  topProducts?: Array<{
    productCode: string;
    description: string;
    quantity: number;
    amount: number;
  }>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}