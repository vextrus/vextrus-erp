import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { InvoiceStatus } from '../../../../domain/aggregates/invoice/invoice.aggregate';

/**
 * Invoice Read Model Entity
 *
 * PostgreSQL read model for invoice queries (CQRS read side).
 * Optimized for query performance with appropriate indexes.
 *
 * Data Flow:
 * 1. Commands modify Invoice aggregate → Events stored in EventStore
 * 2. Event handlers project events → InvoiceReadModel in PostgreSQL
 * 3. Query handlers read from InvoiceReadModel → Return DTOs to GraphQL
 *
 * Multi-Tenancy:
 * - tenantId column with index for schema-based isolation
 * - All queries filtered by tenantId
 * - Indexes optimized for tenant-scoped queries
 *
 * Bangladesh Compliance Fields:
 * - mushakNumber: Mushak-6.3 compliant invoice number (NBR requirement)
 * - challanNumber: Treasury challan for tax payments
 * - vendorTIN/BIN: 10-digit/9-digit Bangladesh tax identifiers
 * - customerTIN/BIN: Customer tax identifiers
 * - fiscalYear: July-June fiscal year format (YYYY-YYYY)
 */
@Entity('invoices')
@Index(['tenantId', 'invoiceNumber'], { unique: true })
@Index(['tenantId', 'customerId'])
@Index(['tenantId', 'vendorId'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'fiscalYear'])
@Index(['tenantId', 'invoiceDate'])
@Index(['mushakNumber'])
export class InvoiceReadModel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  tenantId!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  invoiceNumber!: string;

  @Column({ type: 'uuid' })
  vendorId!: string;

  @Column({ type: 'uuid' })
  customerId!: string;

  /**
   * Line items stored as JSONB for flexibility
   * Schema:
   * {
   *   id: string,
   *   description: string,
   *   quantity: number,
   *   unitPrice: { amount: number, currency: string },
   *   amount: { amount: number, currency: string },
   *   vatCategory: string,
   *   vatRate: number,
   *   vatAmount: { amount: number, currency: string },
   *   hsCode?: string,
   *   supplementaryDuty?: { amount: number, currency: string },
   *   advanceIncomeTax?: { amount: number, currency: string }
   * }
   */
  @Column({ type: 'jsonb', default: [] })
  lineItems!: any[];

  /**
   * Financial amounts stored as decimal(12,2) for precision
   * Bangladesh Taka (BDT) currency assumed
   * Precision: 12 digits total, 2 decimal places
   * Range: -9999999999.99 to 9999999999.99
   */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  vatAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  supplementaryDuty!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  advanceIncomeTax!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  grandTotal!: number;

  /**
   * Invoice Status Enum
   * DRAFT: Initial creation state
   * PENDING_APPROVAL: Submitted for approval
   * APPROVED: Approved and ready for payment
   * PAID: Payment received
   * CANCELLED: Invoice cancelled with reason
   * OVERDUE: Payment past due date
   */
  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status!: InvoiceStatus;

  @Column({ type: 'date' })
  invoiceDate!: Date;

  @Column({ type: 'date' })
  dueDate!: Date;

  /**
   * Bangladesh fiscal year format: YYYY-YYYY
   * Example: 2024-2025 (July 1, 2024 to June 30, 2025)
   */
  @Column({ type: 'varchar', length: 20 })
  fiscalYear!: string;

  /**
   * Mushak Number: Mushak-6.3 compliant invoice number
   * Format: MUSHAK-6.3-YYYY-MM-NNNNNN
   * Required for NBR (National Board of Revenue) reporting
   * Generated on invoice approval
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  mushakNumber?: string | null;

  /**
   * Challan Number: Treasury challan for tax payments
   * Bangladesh government-defined format
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  challanNumber?: string | null;

  /**
   * Vendor TIN (Tax Identification Number)
   * Bangladesh format: 10 digits
   * Example: 1234567890
   */
  @Column({ type: 'varchar', length: 10, nullable: true })
  vendorTIN?: string | null;

  /**
   * Vendor BIN (Business Identification Number)
   * Bangladesh format: 9 digits
   * Example: 123456789
   */
  @Column({ type: 'varchar', length: 9, nullable: true })
  vendorBIN?: string | null;

  /**
   * Customer TIN (Tax Identification Number)
   * Bangladesh format: 10 digits
   */
  @Column({ type: 'varchar', length: 10, nullable: true })
  customerTIN?: string | null;

  /**
   * Customer BIN (Business Identification Number)
   * Bangladesh format: 9 digits
   */
  @Column({ type: 'varchar', length: 9, nullable: true })
  customerBIN?: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
