import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Add paidAt field to invoice_projections table
 *
 * Purpose:
 * - Tracks when invoice was fully paid (status changed to PAID)
 * - Required for reporting: "Invoices paid in last 30 days", "Average time to payment"
 * - Set from InvoiceFullyPaidEvent.paidAt
 *
 * Schema Changes:
 * - Add nullable paidAt column to invoice_projections table
 *
 * Notes:
 * - paidAmount and balanceAmount already exist (added in InitialFinanceSchema)
 * - Column is nullable (existing invoices won't have paidAt until next payment)
 * - No data migration needed for existing records
 *
 * Related:
 * - Phase 2 Day 7-8: Invoice-Payment Linking implementation
 * - InvoiceProjectionHandler.handleInvoiceFullyPaid() sets paidAt field
 */
export class AddInvoicePaidAtField1760975467282 implements MigrationInterface {
    name = 'AddInvoicePaidAtField1760975467282'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add paidAt column to invoice_projections table
        await queryRunner.query(`
            ALTER TABLE "invoice_projections"
            ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP NULL;
        `);

        // Add comment for documentation
        await queryRunner.query(`
            COMMENT ON COLUMN "invoice_projections"."paidAt" IS
            'Timestamp when invoice was fully paid (status = PAID). Used for cash flow reporting and payment analytics.';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove paidAt column
        await queryRunner.query(`
            ALTER TABLE "invoice_projections"
            DROP COLUMN IF EXISTS "paidAt";
        `);
    }
}
