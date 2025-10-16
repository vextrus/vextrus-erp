import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AccountType } from '../../../../domain/aggregates/chart-of-account/chart-of-account.aggregate';

/**
 * Chart of Account Read Model Entity
 *
 * PostgreSQL read model for account queries (CQRS read side).
 * Optimized for query performance with appropriate indexes.
 *
 * Data Flow:
 * 1. Commands modify ChartOfAccount aggregate → Events stored in EventStore
 * 2. Event handlers project events → ChartOfAccountReadModel in PostgreSQL
 * 3. Query handlers read from ChartOfAccountReadModel → Return DTOs to GraphQL
 *
 * Multi-Tenancy:
 * - tenantId column with index for schema-based isolation
 * - All queries filtered by tenantId
 * - Indexes optimized for tenant-scoped queries
 *
 * Bangladesh Compliance:
 * - accountCode follows Bangladesh standard format (XXXX or XXXX-YY-ZZ)
 * - Hierarchical chart of accounts structure
 * - Support for multi-currency (BDT primary)
 * - Account type aligned with Bangladesh accounting standards
 */
@Entity('chart_of_accounts')
@Index(['tenantId', 'accountCode'], { unique: true })
@Index(['tenantId', 'accountType'])
@Index(['tenantId', 'isActive'])
@Index(['tenantId', 'parentAccountId'])
@Index(['accountCode'])
export class ChartOfAccountReadModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  tenantId!: string;

  /**
   * Account Code - Bangladesh Standard Format
   * Format: XXXX or XXXX-YY-ZZ (hierarchical)
   * Example: 1010 (Cash), 1010-01 (Petty Cash), 1010-01-01 (Office Petty Cash)
   */
  @Column({ type: 'varchar', length: 50 })
  accountCode!: string;

  /**
   * Account Name (descriptive name)
   * Example: "Cash at Bank", "Accounts Receivable", "VAT Payable"
   */
  @Column({ type: 'varchar', length: 255 })
  accountName!: string;

  /**
   * Account Type Enum
   * ASSET: 1000-1999 (Current Assets, Fixed Assets, etc.)
   * LIABILITY: 2000-2999 (Current Liabilities, Long-term Liabilities, etc.)
   * EQUITY: 3000-3999 (Share Capital, Retained Earnings, etc.)
   * REVENUE: 4000-4999 (Sales Revenue, Service Revenue, etc.)
   * EXPENSE: 5000-5999 (Operating Expenses, Cost of Goods Sold, etc.)
   */
  @Column({
    type: 'enum',
    enum: AccountType,
  })
  accountType!: AccountType;

  /**
   * Parent Account ID for hierarchical structure
   * Null for root accounts (e.g., main account categories)
   * Set for sub-accounts and detail accounts
   */
  @Column({ type: 'uuid', nullable: true })
  parentAccountId?: string | null;

  /**
   * Balance stored as decimal(15,2) for precision
   * Positive for debit balance accounts (Assets, Expenses)
   * Positive for credit balance accounts (Liabilities, Equity, Revenue)
   * Precision: 15 digits total, 2 decimal places
   * Range: -9,999,999,999,999.99 to 9,999,999,999,999.99
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance!: number;

  /**
   * Currency Code (ISO 4217)
   * Primary: BDT (Bangladesh Taka)
   * Supported: USD, EUR, GBP, etc.
   */
  @Column({ type: 'varchar', length: 3, default: 'BDT' })
  currency!: string;

  /**
   * Active Status
   * true: Account is active and can be used in transactions
   * false: Account is deactivated (cannot be used, but data retained for historical reporting)
   */
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  /**
   * Deactivation Reason (audit trail)
   * Populated when account is deactivated
   * Required for compliance and audit purposes
   */
  @Column({ type: 'text', nullable: true })
  deactivationReason?: string | null;

  /**
   * Deactivated At timestamp
   * Populated when account is deactivated
   */
  @Column({ type: 'timestamp with time zone', nullable: true })
  deactivatedAt?: Date | null;

  /**
   * Deactivated By (user ID)
   * User who deactivated the account
   */
  @Column({ type: 'uuid', nullable: true })
  deactivatedBy?: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
