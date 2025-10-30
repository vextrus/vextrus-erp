import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Payment Read Model Entity
 *
 * PostgreSQL read model for payment queries (CQRS read side).
 * Optimized for query performance with appropriate indexes.
 *
 * Data Flow:
 * 1. Commands modify Payment aggregate → Events stored in EventStore
 * 2. Event handlers project events → PaymentReadModel in PostgreSQL
 * 3. Query handlers read from PaymentReadModel → Return DTOs to GraphQL
 *
 * Multi-Tenancy:
 * - tenantId column with index for schema-based isolation
 * - All queries filtered by tenantId
 * - Indexes optimized for tenant-scoped queries
 *
 * Bangladesh Mobile Wallet Integration:
 * - mobileWalletProvider: bKash, Nagad, Rocket, Upay, SureCash, mCash, tCash
 * - mobileNumber: Bangladesh mobile number format (01[3-9]XXXXXXXX)
 * - walletTransactionId: Transaction ID from mobile wallet provider
 * - merchantCode: Merchant code for mobile wallet transactions
 */
@Entity('payments')
@Index(['tenantId', 'paymentNumber'], { unique: true })
@Index(['tenantId', 'invoiceId'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'paymentDate'])
@Index(['tenantId', 'paymentMethod'])
@Index(['paymentNumber'], { unique: true })
export class PaymentReadModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  tenantId!: string;

  /**
   * Payment Number Format: PMT-YYYY-MM-DD-NNNNNN
   * Example: PMT-2024-10-16-000001
   * Unique across all tenants for system-wide tracking
   */
  @Column({ type: 'varchar', length: 50, unique: true })
  paymentNumber!: string;

  @Column({ type: 'uuid' })
  invoiceId!: string;

  /**
   * Financial amounts stored as decimal(12,2) for precision
   * Bangladesh Taka (BDT) currency assumed
   * Precision: 12 digits total, 2 decimal places
   * Range: -9999999999.99 to 9999999999.99
   */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'BDT' })
  currency!: string;

  /**
   * Payment Method Enum
   * CASH: Cash payment
   * BANK_TRANSFER: Bank transfer
   * CHECK: Check payment
   * MOBILE_WALLET: Mobile wallet (bKash, Nagad, etc.)
   * CREDIT_CARD: Credit card
   * DEBIT_CARD: Debit card
   * ONLINE_BANKING: Online banking
   */
  @Column({
    type: 'enum',
    enum: ['CASH', 'BANK_TRANSFER', 'CHECK', 'MOBILE_WALLET', 'CREDIT_CARD', 'DEBIT_CARD', 'ONLINE_BANKING'],
  })
  paymentMethod!: string;

  /**
   * Bank Account ID
   * Required for BANK_TRANSFER payment method
   * Links to bank account in master data
   */
  @Column({ type: 'uuid', nullable: true })
  bankAccountId?: string;

  /**
   * Check Number
   * Required for CHECK payment method
   * Used for reconciliation with bank statements
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  checkNumber?: string;

  /**
   * Mobile Wallet Provider (Bangladesh)
   * BKASH: bKash (most popular)
   * NAGAD: Nagad
   * ROCKET: Rocket (DBBL)
   * UPAY: Upay
   * SURECASH: SureCash
   * MCASH: mCash
   * TCASH: TeleCash
   */
  @Column({
    type: 'enum',
    enum: ['BKASH', 'NAGAD', 'ROCKET', 'UPAY', 'SURECASH', 'MCASH', 'TCASH'],
    nullable: true,
  })
  mobileWalletProvider?: string;

  /**
   * Bangladesh Mobile Number
   * Format: 01[3-9]XXXXXXXX or +8801[3-9]XXXXXXXX
   * Example: 01712345678 or +8801712345678
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  mobileNumber?: string;

  /**
   * Wallet Transaction ID
   * Transaction ID from mobile wallet provider
   * Used for reconciliation and dispute resolution
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  walletTransactionId?: string;

  /**
   * Merchant Code
   * Merchant code for mobile wallet transactions
   * Required for some mobile wallet providers
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  merchantCode?: string;

  /**
   * Payment Status Enum
   * PENDING: Initial creation state
   * PROCESSING: Payment in progress (mobile wallet)
   * COMPLETED: Payment successful
   * FAILED: Payment failed
   * CANCELLED: Payment cancelled
   * RECONCILED: Payment reconciled with bank statement
   * REVERSED: Payment reversed (refund/chargeback)
   */
  @Column({
    type: 'enum',
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'RECONCILED', 'REVERSED'],
  })
  status!: string;

  @Column({ type: 'date' })
  paymentDate!: Date;

  /**
   * Payment Reference
   * Optional reference number for tracking
   * Example: Invoice number, PO number, etc.
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  reference?: string;

  /**
   * Transaction Reference
   * Reference from payment gateway or bank
   * Set when payment is completed
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  transactionReference?: string;

  /**
   * Reconciliation Details
   * Set when payment is reconciled with bank statement
   */
  @Column({ type: 'timestamp', nullable: true })
  reconciledAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  reconciledBy?: string;

  /**
   * Bank Transaction ID
   * Transaction ID from bank statement
   * Used for reconciliation matching
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  bankTransactionId?: string;

  /**
   * Reversal Details
   * Set when payment is reversed
   */
  @Column({ type: 'timestamp', nullable: true })
  reversedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  reversedBy?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reversalReason?: string;

  /**
   * Failure Details
   * Set when payment fails
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  failureReason?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
