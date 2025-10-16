import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreateInvoiceReadModel
 *
 * Creates the invoices table for the CQRS read model in PostgreSQL.
 * This table stores projected invoice data from EventStore for optimized querying.
 *
 * Features:
 * - Multi-tenant isolation with tenantId
 * - Comprehensive indexes for query performance
 * - Bangladesh compliance fields (TIN/BIN, Mushak, Challan)
 * - JSONB storage for flexible line items
 * - Decimal precision for financial amounts
 *
 * Indexes:
 * - Composite unique: (tenantId, invoiceNumber)
 * - Tenant-scoped: customerId, vendorId, status, fiscalYear, invoiceDate
 * - Mushak number for NBR compliance queries
 *
 * Generated: 2025-01-14 (Phase 3: Infrastructure Layer)
 */
export class CreateInvoiceReadModel1736880000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create invoices table
    await queryRunner.createTable(
      new Table({
        name: 'invoices',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'tenantId',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'invoiceNumber',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'vendorId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'customerId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'lineItems',
            type: 'jsonb',
            default: "'[]'",
            isNullable: false,
          },
          {
            name: 'subtotal',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'vatAmount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'supplementaryDuty',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'advanceIncomeTax',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'grandTotal',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'CANCELLED', 'OVERDUE'],
            default: "'DRAFT'",
            isNullable: false,
          },
          {
            name: 'invoiceDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'dueDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'fiscalYear',
            type: 'varchar',
            length: '20',
            isNullable: false,
            comment: 'Bangladesh fiscal year format: YYYY-YYYY (July-June)',
          },
          {
            name: 'mushakNumber',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Mushak-6.3 compliant invoice number for NBR',
          },
          {
            name: 'challanNumber',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Treasury challan for tax payments',
          },
          {
            name: 'vendorTIN',
            type: 'varchar',
            length: '10',
            isNullable: true,
            comment: 'Vendor Tax Identification Number (10 digits)',
          },
          {
            name: 'vendorBIN',
            type: 'varchar',
            length: '9',
            isNullable: true,
            comment: 'Vendor Business Identification Number (9 digits)',
          },
          {
            name: 'customerTIN',
            type: 'varchar',
            length: '10',
            isNullable: true,
            comment: 'Customer Tax Identification Number (10 digits)',
          },
          {
            name: 'customerBIN',
            type: 'varchar',
            length: '9',
            isNullable: true,
            comment: 'Customer Business Identification Number (9 digits)',
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes
    // Composite unique index for tenant-scoped invoice number uniqueness
    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'IDX_invoices_tenant_invoice_number',
        columnNames: ['tenantId', 'invoiceNumber'],
        isUnique: true,
      }),
    );

    // Tenant ID index for filtering
    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'IDX_invoices_tenant_id',
        columnNames: ['tenantId'],
      }),
    );

    // Tenant + Customer index for customer invoice queries
    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'IDX_invoices_tenant_customer',
        columnNames: ['tenantId', 'customerId'],
      }),
    );

    // Tenant + Vendor index for vendor invoice queries
    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'IDX_invoices_tenant_vendor',
        columnNames: ['tenantId', 'vendorId'],
      }),
    );

    // Tenant + Status index for status filtering
    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'IDX_invoices_tenant_status',
        columnNames: ['tenantId', 'status'],
      }),
    );

    // Tenant + Fiscal Year index for fiscal period queries
    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'IDX_invoices_tenant_fiscal_year',
        columnNames: ['tenantId', 'fiscalYear'],
      }),
    );

    // Tenant + Invoice Date index for date range queries
    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'IDX_invoices_tenant_date',
        columnNames: ['tenantId', 'invoiceDate'],
      }),
    );

    // Mushak Number index for NBR compliance queries
    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'IDX_invoices_mushak_number',
        columnNames: ['mushakNumber'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.dropIndex('invoices', 'IDX_invoices_mushak_number');
    await queryRunner.dropIndex('invoices', 'IDX_invoices_tenant_date');
    await queryRunner.dropIndex('invoices', 'IDX_invoices_tenant_fiscal_year');
    await queryRunner.dropIndex('invoices', 'IDX_invoices_tenant_status');
    await queryRunner.dropIndex('invoices', 'IDX_invoices_tenant_vendor');
    await queryRunner.dropIndex('invoices', 'IDX_invoices_tenant_customer');
    await queryRunner.dropIndex('invoices', 'IDX_invoices_tenant_id');
    await queryRunner.dropIndex('invoices', 'IDX_invoices_tenant_invoice_number');

    // Drop table
    await queryRunner.dropTable('invoices');
  }
}
