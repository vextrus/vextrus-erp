import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Journal Entry Read Model Entity
 *
 * PostgreSQL read model for journal entry queries (CQRS read side).
 * Optimized for query performance with JSONB lines storage and appropriate indexes.
 *
 * Data Flow:
 * 1. Commands modify JournalEntry aggregate → Events stored in EventStore
 * 2. Event handlers project events → JournalEntryReadModel in PostgreSQL
 * 3. Query handlers read from JournalEntryReadModel → Return DTOs to GraphQL
 *
 * Multi-Tenancy:
 * - tenantId column with index for schema-based isolation
 * - All queries filtered by tenantId
 * - Indexes optimized for tenant-scoped queries
 *
 * Bangladesh Fiscal Year Compliance:
 * - Fiscal year: July 1 to June 30
 * - Fiscal period format: FY2024-2025-P01 (P01 = July, P12 = June)
 * - Journal number format: {TYPE}-YYYY-MM-NNNNNN (e.g., GJ-2024-01-000001)
 *
 * JSONB Lines Storage:
 * - lines column stores all journal lines as JSONB array
 * - Structure: [{ lineId, accountId, debitAmount, creditAmount, description, costCenter, project, reference, taxCode }]
 * - Optimized for read performance (no joins required)
 * - Supports efficient querying and filtering
 */
@Entity('journal_entries')
@Index(['tenantId', 'journalNumber'], { unique: true })
@Index(['tenantId', 'journalType'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'fiscalPeriod'])
@Index(['tenantId', 'journalDate'])
@Index(['journalNumber'], { unique: true })
export class JournalEntryReadModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  tenantId!: string;

  /**
   * Journal Number Format: {TYPE}-YYYY-MM-NNNNNN
   * Examples:
   * - GJ-2024-10-000001 (General Journal)
   * - SJ-2024-10-000002 (Sales Journal)
   * - PJ-2024-10-000003 (Purchase Journal)
   * - CR-2024-10-000004 (Cash Receipt)
   * - CP-2024-10-000005 (Cash Payment)
   * - AJ-2024-10-000006 (Adjustment Journal)
   * - RJ-2024-10-000007 (Reversing Journal)
   * - CJ-2024-10-000008 (Closing Journal)
   * - OJ-2024-10-000009 (Opening Journal)
   * Unique across all tenants for system-wide tracking
   */
  @Column({ type: 'varchar', length: 50, unique: true })
  journalNumber!: string;

  @Column({ type: 'date' })
  journalDate!: Date;

  /**
   * Journal Type Enum
   * GENERAL: General journal entries
   * SALES: Sales journal (from invoices)
   * PURCHASE: Purchase journal (from bills)
   * CASH_RECEIPT: Cash receipt journal
   * CASH_PAYMENT: Cash payment journal
   * ADJUSTMENT: Adjustment journal (corrections)
   * REVERSING: Reversing journal (reverses previous entries)
   * CLOSING: Closing journal (period-end closing)
   * OPENING: Opening journal (period-start opening balances)
   */
  @Column({
    type: 'enum',
    enum: ['GENERAL', 'SALES', 'PURCHASE', 'CASH_RECEIPT', 'CASH_PAYMENT', 'ADJUSTMENT', 'REVERSING', 'CLOSING', 'OPENING'],
  })
  journalType!: string;

  @Column({ type: 'varchar', length: 500 })
  description!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference?: string;

  /**
   * Journal Lines (JSONB Array)
   *
   * Stores all journal lines for efficient querying.
   * Structure:
   * [
   *   {
   *     lineId: string (UUID),
   *     accountId: string (UUID),
   *     debitAmount: number (decimal),
   *     creditAmount: number (decimal),
   *     description?: string,
   *     costCenter?: string,
   *     project?: string,
   *     reference?: string,
   *     taxCode?: string
   *   },
   *   ...
   * ]
   *
   * Benefits:
   * - No joins required for line retrieval
   * - Fast read performance
   * - Supports filtering and aggregation
   * - PostgreSQL JSONB indexing capabilities
   */
  @Column({ type: 'jsonb', default: [] })
  lines!: any[];

  /**
   * Financial amounts stored as decimal(12,2) for precision
   * Bangladesh Taka (BDT) currency assumed
   * Precision: 12 digits total, 2 decimal places
   * Range: -9999999999.99 to 9999999999.99
   */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalDebit!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalCredit!: number;

  @Column({ type: 'varchar', length: 3, default: 'BDT' })
  currency!: string;

  /**
   * Journal Status Enum
   * DRAFT: Initial creation state, can be edited
   * POSTED: Posted to ledger, immutable
   * REVERSED: Reversed by reversing journal
   * CANCELLED: Cancelled before posting
   * ERROR: Error state (balance issues, validation failures)
   */
  @Column({
    type: 'enum',
    enum: ['DRAFT', 'POSTED', 'REVERSED', 'CANCELLED', 'ERROR'],
  })
  status!: string;

  /**
   * Fiscal Period Format: FY2024-2025-P01
   * Bangladesh fiscal year: July 1 to June 30
   * Period numbering:
   * - P01 = July (start of fiscal year)
   * - P02 = August
   * - ...
   * - P12 = June (end of fiscal year)
   *
   * Example: FY2024-2025-P01 = July 2024
   */
  @Column({ type: 'varchar', length: 50 })
  fiscalPeriod!: string;

  /**
   * Reversing Journal Flags
   * isReversing: True if this journal reverses another journal
   * originalJournalId: ID of original journal being reversed (if isReversing = true)
   */
  @Column({ type: 'boolean', default: false })
  isReversing!: boolean;

  @Column({ type: 'uuid', nullable: true })
  originalJournalId?: string;

  /**
   * Posted Journal Metadata
   * Set when journal is posted (status = POSTED)
   */
  @Column({ type: 'timestamp', nullable: true })
  postedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  postedBy?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
