import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Initial Finance Schema Migration
 *
 * Creates all finance-related tables and enum types for the Vextrus ERP Finance Service.
 * This migration represents the initial database schema generated from TypeORM entities.
 *
 * Tables created:
 * - invoices: Bangladesh-compliant invoice management
 * - payments: Multi-method payment processing
 * - chart_of_accounts: Hierarchical account structure
 * - journal_entries: Double-entry bookkeeping
 *
 * Features:
 * - Multi-tenant isolation via tenantId
 * - Bangladesh tax compliance (TIN/BIN, Mushak numbers)
 * - Event sourcing compatible (read models)
 * - Comprehensive indexing for query performance
 */
export class InitialFinanceSchema1760701516749 implements MigrationInterface {
    name = 'InitialFinanceSchema1760701516749'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types
        await queryRunner.query(`
            CREATE TYPE "public"."chart_of_accounts_accounttype_enum" AS ENUM (
                'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."invoices_status_enum" AS ENUM (
                'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'CANCELLED', 'OVERDUE'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."journal_entries_journaltype_enum" AS ENUM (
                'GENERAL', 'SALES', 'PURCHASE', 'CASH_RECEIPT', 'CASH_PAYMENT',
                'ADJUSTMENT', 'REVERSING', 'CLOSING', 'OPENING'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."journal_entries_status_enum" AS ENUM (
                'DRAFT', 'POSTED', 'CANCELLED', 'REVERSED', 'ERROR'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."payments_paymentmethod_enum" AS ENUM (
                'CASH', 'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD', 'DEBIT_CARD',
                'MOBILE_WALLET', 'ONLINE_BANKING'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."payments_mobilewalletprovider_enum" AS ENUM (
                'BKASH', 'NAGAD', 'ROCKET', 'UPAY', 'SURECASH', 'MCASH', 'TCASH'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."payments_status_enum" AS ENUM (
                'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'RECONCILED', 'REVERSED'
            )
        `);

        // Create invoices table
        await queryRunner.query(`
            CREATE TABLE "invoices" (
                "id" uuid NOT NULL,
                "tenantId" character varying(100) NOT NULL,
                "invoiceNumber" character varying(50) NOT NULL,
                "vendorId" uuid NOT NULL,
                "customerId" uuid NOT NULL,
                "lineItems" jsonb NOT NULL DEFAULT '[]',
                "subtotal" numeric(12,2) NOT NULL DEFAULT 0,
                "vatAmount" numeric(12,2) NOT NULL DEFAULT 0,
                "supplementaryDuty" numeric(12,2) NOT NULL DEFAULT 0,
                "advanceIncomeTax" numeric(12,2) NOT NULL DEFAULT 0,
                "grandTotal" numeric(12,2) NOT NULL DEFAULT 0,
                "status" "public"."invoices_status_enum" NOT NULL DEFAULT 'DRAFT',
                "invoiceDate" date NOT NULL,
                "dueDate" date NOT NULL,
                "fiscalYear" character varying(20) NOT NULL,
                "mushakNumber" character varying(100),
                "challanNumber" character varying(100),
                "vendorTIN" character varying(10),
                "vendorBIN" character varying(9),
                "customerTIN" character varying(10),
                "customerBIN" character varying(9),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_bf8e0f9dd4558ef209ec111782d" UNIQUE ("invoiceNumber")
            )
        `);

        // Create invoices indexes
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0d74c67b90d3ecc011295c688a" ON "invoices" ("tenantId", "invoiceNumber")`);
        await queryRunner.query(`CREATE INDEX "IDX_89c82485e364081f457b210120" ON "invoices" ("tenantId")`);
        await queryRunner.query(`CREATE INDEX "IDX_71233f061cbd05ef49d8042030" ON "invoices" ("tenantId", "vendorId")`);
        await queryRunner.query(`CREATE INDEX "IDX_d59d3105be1d22159e3c461634" ON "invoices" ("tenantId", "customerId")`);
        await queryRunner.query(`CREATE INDEX "IDX_4e1de0d71d5dbf91dd6bb09c9b" ON "invoices" ("tenantId", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_d74e653308f1abc11414c271eb" ON "invoices" ("tenantId", "fiscalYear")`);
        await queryRunner.query(`CREATE INDEX "IDX_9a2548d3a570f8af572f8d2e7a" ON "invoices" ("tenantId", "invoiceDate")`);
        await queryRunner.query(`CREATE INDEX "IDX_51987d4a7e5bce33114facf290" ON "invoices" ("mushakNumber")`);

        // Create chart_of_accounts table
        await queryRunner.query(`
            CREATE TABLE "chart_of_accounts" (
                "id" uuid NOT NULL,
                "tenantId" character varying(100) NOT NULL,
                "accountCode" character varying(50) NOT NULL,
                "accountName" character varying(255) NOT NULL,
                "accountType" "public"."chart_of_accounts_accounttype_enum" NOT NULL,
                "parentAccountId" uuid,
                "balance" numeric(15,2) NOT NULL DEFAULT 0,
                "currency" character varying(3) NOT NULL DEFAULT 'BDT',
                "isActive" boolean NOT NULL DEFAULT true,
                "deactivationReason" text,
                "deactivatedAt" TIMESTAMP WITH TIME ZONE,
                "deactivatedBy" uuid,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_467c08a2efc78393c647da32bac" PRIMARY KEY ("id")
            )
        `);

        // Create chart_of_accounts indexes
        await queryRunner.query(`CREATE INDEX "IDX_1d5ed6ca50597ce065aee835ac" ON "chart_of_accounts" ("tenantId")`);
        await queryRunner.query(`CREATE INDEX "IDX_4cb7d4663a389456682a1c4f35" ON "chart_of_accounts" ("accountCode")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_997619f2cc130b49c1703b232b" ON "chart_of_accounts" ("tenantId", "accountCode")`);
        await queryRunner.query(`CREATE INDEX "IDX_32a5cfc89194d5fecf08c8eb7f" ON "chart_of_accounts" ("tenantId", "accountType")`);
        await queryRunner.query(`CREATE INDEX "IDX_a52d1eedb7683cc2c2120ea2de" ON "chart_of_accounts" ("tenantId", "isActive")`);
        await queryRunner.query(`CREATE INDEX "IDX_b2b496a291fd32408d5f14e958" ON "chart_of_accounts" ("tenantId", "parentAccountId")`);

        // Create payments table
        await queryRunner.query(`
            CREATE TABLE "payments" (
                "id" uuid NOT NULL,
                "tenantId" character varying(100) NOT NULL,
                "paymentNumber" character varying(50) NOT NULL,
                "invoiceId" uuid NOT NULL,
                "amount" numeric(12,2) NOT NULL,
                "currency" character varying(3) NOT NULL DEFAULT 'BDT',
                "paymentMethod" "public"."payments_paymentmethod_enum" NOT NULL,
                "bankAccountId" uuid,
                "checkNumber" character varying(50),
                "mobileWalletProvider" "public"."payments_mobilewalletprovider_enum",
                "mobileNumber" character varying(20),
                "walletTransactionId" character varying(100),
                "merchantCode" character varying(50),
                "status" "public"."payments_status_enum" NOT NULL,
                "paymentDate" date NOT NULL,
                "reference" character varying(255),
                "transactionReference" character varying(255),
                "reconciledAt" TIMESTAMP,
                "reconciledBy" uuid,
                "bankTransactionId" character varying(100),
                "reversedAt" TIMESTAMP,
                "reversedBy" uuid,
                "reversalReason" character varying(500),
                "failureReason" character varying(500),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_a4faec749345edbe3aa3e3b4d47" UNIQUE ("paymentNumber")
            )
        `);

        // Create payments indexes
        await queryRunner.query(`CREATE INDEX "IDX_98a04cdcbac4f6a2c55c7d1935" ON "payments" ("tenantId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fc4d9f734277a35e4d8b391252" ON "payments" ("tenantId", "paymentNumber")`);
        await queryRunner.query(`CREATE INDEX "IDX_78927748eb42858d3fe65d7732" ON "payments" ("tenantId", "invoiceId")`);
        await queryRunner.query(`CREATE INDEX "IDX_63a284e4446aa8efee9dff1ea8" ON "payments" ("tenantId", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_c4b9450e05b9d009d05dd92afd" ON "payments" ("tenantId", "paymentDate")`);
        await queryRunner.query(`CREATE INDEX "IDX_dd067c2805c38336787cfc1df1" ON "payments" ("tenantId", "paymentMethod")`);

        // Create journal_entries table
        await queryRunner.query(`
            CREATE TABLE "journal_entries" (
                "id" uuid NOT NULL,
                "tenantId" character varying(100) NOT NULL,
                "journalNumber" character varying(50) NOT NULL,
                "journalDate" date NOT NULL,
                "journalType" "public"."journal_entries_journaltype_enum" NOT NULL,
                "description" character varying(500) NOT NULL,
                "reference" character varying(255),
                "lines" jsonb NOT NULL DEFAULT '[]',
                "totalDebit" numeric(12,2) NOT NULL,
                "totalCredit" numeric(12,2) NOT NULL,
                "currency" character varying(3) NOT NULL DEFAULT 'BDT',
                "status" "public"."journal_entries_status_enum" NOT NULL,
                "fiscalPeriod" character varying(50) NOT NULL,
                "isReversing" boolean NOT NULL DEFAULT false,
                "originalJournalId" uuid,
                "postedAt" TIMESTAMP,
                "postedBy" uuid,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_a70368e64230434457c8d007ab3" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_cb4a1027392721c1ea5eaf3c764" UNIQUE ("journalNumber")
            )
        `);

        // Create journal_entries indexes
        await queryRunner.query(`CREATE INDEX "IDX_8ddb19c8d608eda820581b1df7" ON "journal_entries" ("tenantId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_872921c6fc95abf2bb864e38c4" ON "journal_entries" ("tenantId", "journalNumber")`);
        await queryRunner.query(`CREATE INDEX "IDX_11b6aefd7cf11d852e2377e9be" ON "journal_entries" ("tenantId", "journalType")`);
        await queryRunner.query(`CREATE INDEX "IDX_4f83a0159732fd4dcaf4bcea8e" ON "journal_entries" ("tenantId", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_737eee0fc249bfb0c22a34f32d" ON "journal_entries" ("tenantId", "journalDate")`);
        await queryRunner.query(`CREATE INDEX "IDX_960473931d4e1aea08ca40c60d" ON "journal_entries" ("tenantId", "fiscalPeriod")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_960473931d4e1aea08ca40c60d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_737eee0fc249bfb0c22a34f32d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4f83a0159732fd4dcaf4bcea8e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_11b6aefd7cf11d852e2377e9be"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_872921c6fc95abf2bb864e38c4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8ddb19c8d608eda820581b1df7"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_dd067c2805c38336787cfc1df1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c4b9450e05b9d009d05dd92afd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_63a284e4446aa8efee9dff1ea8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_78927748eb42858d3fe65d7732"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fc4d9f734277a35e4d8b391252"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_98a04cdcbac4f6a2c55c7d1935"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_b2b496a291fd32408d5f14e958"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a52d1eedb7683cc2c2120ea2de"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_32a5cfc89194d5fecf08c8eb7f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_997619f2cc130b49c1703b232b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4cb7d4663a389456682a1c4f35"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1d5ed6ca50597ce065aee835ac"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_51987d4a7e5bce33114facf290"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9a2548d3a570f8af572f8d2e7a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d74e653308f1abc11414c271eb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4e1de0d71d5dbf91dd6bb09c9b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d59d3105be1d22159e3c461634"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_71233f061cbd05ef49d8042030"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_89c82485e364081f457b210120"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0d74c67b90d3ecc011295c688a"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "journal_entries"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TABLE "chart_of_accounts"`);
        await queryRunner.query(`DROP TABLE "invoices"`);

        // Drop enum types
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_mobilewalletprovider_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_paymentmethod_enum"`);
        await queryRunner.query(`DROP TYPE "public"."journal_entries_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."journal_entries_journaltype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."chart_of_accounts_accounttype_enum"`);
    }

}
