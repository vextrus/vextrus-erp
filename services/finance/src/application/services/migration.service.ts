import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface MigrationPackage {
  preMigration: MigrationScript;
  migration: MigrationScript;
  postMigration: MigrationScript;
  rollback: MigrationScript;
  validation: MigrationScript;
  seedData?: MigrationScript;
  version: string;
  checksum: string;
  timestamp: Date;
}

export interface MigrationScript {
  name: string;
  sql: string;
  description: string;
  estimatedTime?: number; // Seconds
  requiresDowntime?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  warnings: string[];
  summary: ValidationSummary;
}

export interface ValidationIssue {
  type: 'SCHEMA' | 'INDEX' | 'CONSTRAINT' | 'DATA' | 'PERMISSION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  table?: string;
  column?: string;
  recommendation?: string;
}

export interface ValidationSummary {
  tablesCreated: number;
  indexesCreated: number;
  constraintsCreated: number;
  viewsCreated: number;
  functionsCreated: number;
  triggersCreated: number;
  dataIntegrity: boolean;
  performanceImpact: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface MigrationStatus {
  version: string;
  appliedAt: Date;
  executionTime: number;
  checksum: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  error?: string;
}

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);
  private readonly migrationPath: string;
  private readonly currentVersion = '2.0.0';

  constructor(
    @InjectConnection() private connection: Connection,
  ) {
    this.migrationPath = path.join(process.cwd(), 'migrations');
    this.ensureMigrationDirectory();
  }

  async generateMigrationScripts(): Promise<MigrationPackage> {
    this.logger.log('Generating comprehensive migration scripts...');

    const migrationPackage: MigrationPackage = {
      preMigration: await this.generatePreMigrationScript(),
      migration: await this.generateMigrationScript(),
      postMigration: await this.generatePostMigrationScript(),
      rollback: await this.generateRollbackScript(),
      validation: await this.generateValidationScript(),
      seedData: await this.generateSeedDataScript(),
      version: this.currentVersion,
      checksum: '',
      timestamp: new Date(),
    };

    // Calculate checksum
    migrationPackage.checksum = this.calculateChecksum(migrationPackage);

    // Save migration package
    await this.saveMigrationPackage(migrationPackage);

    return migrationPackage;
  }

  private async generatePreMigrationScript(): Promise<MigrationScript> {
    const sql = `
      -- Finance Module Pre-Migration Script
      -- Version: ${this.currentVersion}
      -- Date: ${new Date().toISOString()}

      BEGIN;

      -- 1. Create backup of existing data
      DO $$
      BEGIN
        -- Create backup schema if not exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'finance_backup') THEN
          CREATE SCHEMA finance_backup;
        END IF;

        -- Backup existing tables if they exist
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'finance') THEN
          -- Create backup timestamp
          EXECUTE 'CREATE TABLE IF NOT EXISTS finance_backup.migration_log (
            id SERIAL PRIMARY KEY,
            backup_date TIMESTAMPTZ DEFAULT NOW(),
            version VARCHAR(20),
            tables_backed_up TEXT[]
          )';

          -- Backup each table
          FOR table_record IN
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'finance'
          LOOP
            EXECUTE format('CREATE TABLE finance_backup.%I AS SELECT * FROM finance.%I',
              table_record.table_name || '_' || to_char(NOW(), 'YYYYMMDD_HH24MISS'),
              table_record.table_name
            );
          END LOOP;
        END IF;
      END $$;

      -- 2. Check database prerequisites
      DO $$
      BEGIN
        -- Check PostgreSQL version
        IF current_setting('server_version_num')::integer < 130000 THEN
          RAISE EXCEPTION 'PostgreSQL version 13 or higher is required';
        END IF;

        -- Check required extensions
        IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
          CREATE EXTENSION IF NOT EXISTS pgcrypto;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
          CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
        END IF;
      END $$;

      -- 3. Store current settings
      CREATE TEMPORARY TABLE migration_settings AS
      SELECT name, setting
      FROM pg_settings
      WHERE name IN ('work_mem', 'maintenance_work_mem', 'max_parallel_workers');

      -- 4. Optimize settings for migration
      SET work_mem = '256MB';
      SET maintenance_work_mem = '1GB';
      SET max_parallel_workers = 8;

      -- 5. Disable triggers and constraints temporarily
      SET session_replication_role = replica;

      COMMIT;
    `;

    return {
      name: 'pre-migration',
      sql,
      description: 'Prepare database for migration with backups and optimizations',
      estimatedTime: 60,
      requiresDowntime: false,
    };
  }

  private async generateMigrationScript(): Promise<MigrationScript> {
    const sql = `
      -- Finance Module Migration Script
      -- Version: ${this.currentVersion}
      -- Date: ${new Date().toISOString()}

      BEGIN;

      -- ============================================
      -- SCHEMAS
      -- ============================================

      -- Create finance schema
      CREATE SCHEMA IF NOT EXISTS finance;
      CREATE SCHEMA IF NOT EXISTS finance_audit;
      CREATE SCHEMA IF NOT EXISTS finance_ml;

      -- Set search path
      SET search_path TO finance, public;

      -- ============================================
      -- TYPES AND ENUMS
      -- ============================================

      -- Account Types
      DO $$ BEGIN
        CREATE TYPE account_type AS ENUM (
          'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE',
          'CURRENT_ASSET', 'FIXED_ASSET', 'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY'
        );
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      -- Transaction Types
      DO $$ BEGIN
        CREATE TYPE transaction_type AS ENUM (
          'DEBIT', 'CREDIT', 'JOURNAL_ENTRY', 'PAYMENT', 'RECEIPT',
          'INVOICE', 'BILL', 'TRANSFER', 'ADJUSTMENT'
        );
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      -- Payment Status
      DO $$ BEGIN
        CREATE TYPE payment_status AS ENUM (
          'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'
        );
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      -- Tax Types (Bangladesh specific)
      DO $$ BEGIN
        CREATE TYPE tax_type AS ENUM (
          'VAT', 'TDS', 'AIT', 'SUPPLEMENTARY_DUTY', 'CUSTOMS_DUTY', 'EXCISE_DUTY'
        );
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      -- ============================================
      -- CORE TABLES
      -- ============================================

      -- Event Store (for Event Sourcing)
      CREATE TABLE IF NOT EXISTS finance.event_store (
        event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        aggregate_id UUID NOT NULL,
        aggregate_type VARCHAR(255) NOT NULL,
        event_type VARCHAR(255) NOT NULL,
        event_version INTEGER NOT NULL,
        event_data JSONB NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID,
        tenant_id UUID NOT NULL
      );

      -- Chart of Accounts
      CREATE TABLE IF NOT EXISTS finance.chart_of_accounts (
        account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        account_code VARCHAR(20) NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        account_name_bn VARCHAR(255), -- Bengali name
        account_type account_type NOT NULL,
        parent_id UUID REFERENCES finance.chart_of_accounts(account_id),
        is_active BOOLEAN DEFAULT true,
        is_system BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID,
        UNIQUE(tenant_id, account_code)
      );

      -- Journal Entries
      CREATE TABLE IF NOT EXISTS finance.journal_entries (
        entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        entry_date DATE NOT NULL,
        entry_number VARCHAR(50) NOT NULL,
        description TEXT,
        account_id UUID NOT NULL REFERENCES finance.chart_of_accounts(account_id),
        debit DECIMAL(15,2) DEFAULT 0,
        credit DECIMAL(15,2) DEFAULT 0,
        reference_type VARCHAR(50),
        reference_id UUID,
        is_posted BOOLEAN DEFAULT false,
        posted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID,
        UNIQUE(tenant_id, entry_number),
        CHECK (debit >= 0 AND credit >= 0),
        CHECK (debit > 0 OR credit > 0)
      );

      -- Invoices
      CREATE TABLE IF NOT EXISTS finance.invoices (
        invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        invoice_number VARCHAR(50) NOT NULL,
        invoice_date DATE NOT NULL,
        due_date DATE NOT NULL,
        customer_id UUID NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_tin VARCHAR(12),
        customer_bin VARCHAR(9),
        subtotal DECIMAL(15,2) NOT NULL,
        vat_amount DECIMAL(15,2) DEFAULT 0,
        supplementary_duty DECIMAL(15,2) DEFAULT 0,
        discount_amount DECIMAL(15,2) DEFAULT 0,
        total DECIMAL(15,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'DRAFT',
        mushak_form_type VARCHAR(10), -- 6.1, 6.2.1, etc.
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID,
        UNIQUE(tenant_id, invoice_number)
      );

      -- Invoice Items
      CREATE TABLE IF NOT EXISTS finance.invoice_items (
        item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id UUID NOT NULL REFERENCES finance.invoices(invoice_id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        hs_code VARCHAR(20), -- Harmonized System code for Bangladesh
        quantity DECIMAL(10,3) NOT NULL,
        unit_price DECIMAL(15,2) NOT NULL,
        vat_rate DECIMAL(5,2) DEFAULT 15, -- Bangladesh VAT rate
        amount DECIMAL(15,2) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Payments
      CREATE TABLE IF NOT EXISTS finance.payments (
        payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        payment_number VARCHAR(50) NOT NULL,
        payment_date DATE NOT NULL,
        invoice_id UUID REFERENCES finance.invoices(invoice_id),
        amount DECIMAL(15,2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL, -- CASH, BANK, BKASH, NAGAD, etc.
        mobile_number VARCHAR(14), -- For mobile payments
        transaction_id VARCHAR(100), -- External transaction reference
        bank_account_id UUID,
        status payment_status DEFAULT 'PENDING',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID,
        UNIQUE(tenant_id, payment_number)
      );

      -- Expenses
      CREATE TABLE IF NOT EXISTS finance.expenses (
        expense_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        expense_number VARCHAR(50) NOT NULL,
        expense_date DATE NOT NULL,
        vendor_id UUID,
        vendor_name VARCHAR(255),
        vendor_tin VARCHAR(12),
        category VARCHAR(100) NOT NULL,
        department VARCHAR(100),
        amount DECIMAL(15,2) NOT NULL,
        vat_amount DECIMAL(15,2) DEFAULT 0,
        tds_amount DECIMAL(15,2) DEFAULT 0,
        description TEXT,
        status VARCHAR(50) DEFAULT 'DRAFT',
        approved_by UUID,
        approved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID,
        UNIQUE(tenant_id, expense_number)
      );

      -- Tax Calculations
      CREATE TABLE IF NOT EXISTS finance.tax_calculations (
        calculation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        reference_type VARCHAR(50) NOT NULL,
        reference_id UUID NOT NULL,
        tax_type tax_type NOT NULL,
        base_amount DECIMAL(15,2) NOT NULL,
        tax_rate DECIMAL(5,2) NOT NULL,
        tax_amount DECIMAL(15,2) NOT NULL,
        fiscal_year VARCHAR(10) NOT NULL,
        calculated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID
      );

      -- NBR Submissions
      CREATE TABLE IF NOT EXISTS finance.nbr_submissions (
        submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        submission_type VARCHAR(50) NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        submission_data JSONB NOT NULL,
        submission_status VARCHAR(50) DEFAULT 'PENDING',
        submission_reference VARCHAR(100),
        submitted_at TIMESTAMPTZ,
        response_data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID
      );

      -- Receivables
      CREATE TABLE IF NOT EXISTS finance.receivables (
        receivable_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        invoice_id UUID REFERENCES finance.invoices(invoice_id),
        customer_id UUID NOT NULL,
        amount_due DECIMAL(15,2) NOT NULL,
        due_date DATE NOT NULL,
        days_overdue INTEGER GENERATED ALWAYS AS (
          GREATEST(0, EXTRACT(DAY FROM CURRENT_DATE - due_date)::INTEGER)
        ) STORED,
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Payables
      CREATE TABLE IF NOT EXISTS finance.payables (
        payable_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        expense_id UUID REFERENCES finance.expenses(expense_id),
        vendor_id UUID,
        amount_due DECIMAL(15,2) NOT NULL,
        due_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Bank Accounts
      CREATE TABLE IF NOT EXISTS finance.bank_accounts (
        account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        bank_name VARCHAR(255) NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        account_type VARCHAR(50),
        routing_number VARCHAR(20),
        balance DECIMAL(15,2) DEFAULT 0,
        is_primary BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, account_number)
      );

      -- Cash Transactions
      CREATE TABLE IF NOT EXISTS finance.cash_transactions (
        transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        transaction_date DATE NOT NULL,
        type VARCHAR(50) NOT NULL, -- INFLOW, OUTFLOW
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        description TEXT,
        bank_account_id UUID REFERENCES finance.bank_accounts(account_id),
        reference_type VARCHAR(50),
        reference_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID
      );

      -- Audit Trail
      CREATE TABLE IF NOT EXISTS finance_audit.audit_log (
        audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        table_name VARCHAR(100) NOT NULL,
        operation VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
        record_id UUID NOT NULL,
        old_data JSONB,
        new_data JSONB,
        changed_by UUID NOT NULL,
        changed_at TIMESTAMPTZ DEFAULT NOW(),
        ip_address INET,
        user_agent TEXT,
        session_id VARCHAR(100)
      );

      -- Tenants
      CREATE TABLE IF NOT EXISTS finance.tenants (
        tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_name VARCHAR(255) NOT NULL,
        tenant_name_bn VARCHAR(255),
        bin VARCHAR(9),
        tin VARCHAR(12),
        address TEXT,
        phone VARCHAR(14),
        email VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        subscription_status VARCHAR(50) DEFAULT 'TRIAL',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- ============================================
      -- INDEXES
      -- ============================================

      -- Event Store Indexes
      CREATE INDEX idx_event_aggregate ON finance.event_store(aggregate_id, event_version);
      CREATE INDEX idx_event_tenant_date ON finance.event_store(tenant_id, created_at DESC);
      CREATE INDEX idx_event_type ON finance.event_store(event_type);

      -- Chart of Accounts Indexes
      CREATE INDEX idx_coa_tenant ON finance.chart_of_accounts(tenant_id);
      CREATE INDEX idx_coa_parent ON finance.chart_of_accounts(parent_id);
      CREATE INDEX idx_coa_type ON finance.chart_of_accounts(account_type);

      -- Journal Entries Indexes
      CREATE INDEX idx_journal_tenant_date ON finance.journal_entries(tenant_id, entry_date DESC);
      CREATE INDEX idx_journal_account ON finance.journal_entries(account_id);
      CREATE INDEX idx_journal_posted ON finance.journal_entries(is_posted);

      -- Invoices Indexes
      CREATE INDEX idx_invoice_tenant_date ON finance.invoices(tenant_id, invoice_date DESC);
      CREATE INDEX idx_invoice_customer ON finance.invoices(customer_id);
      CREATE INDEX idx_invoice_status ON finance.invoices(status);
      CREATE INDEX idx_invoice_due ON finance.invoices(due_date);

      -- Payments Indexes
      CREATE INDEX idx_payment_tenant_date ON finance.payments(tenant_id, payment_date DESC);
      CREATE INDEX idx_payment_invoice ON finance.payments(invoice_id);
      CREATE INDEX idx_payment_status ON finance.payments(status);

      -- Expenses Indexes
      CREATE INDEX idx_expense_tenant_date ON finance.expenses(tenant_id, expense_date DESC);
      CREATE INDEX idx_expense_vendor ON finance.expenses(vendor_id);
      CREATE INDEX idx_expense_category ON finance.expenses(category);
      CREATE INDEX idx_expense_status ON finance.expenses(status);

      -- Tax Calculations Indexes
      CREATE INDEX idx_tax_tenant_type ON finance.tax_calculations(tenant_id, tax_type);
      CREATE INDEX idx_tax_reference ON finance.tax_calculations(reference_type, reference_id);
      CREATE INDEX idx_tax_fiscal_year ON finance.tax_calculations(fiscal_year);

      -- NBR Submissions Indexes
      CREATE INDEX idx_nbr_tenant_type ON finance.nbr_submissions(tenant_id, submission_type);
      CREATE INDEX idx_nbr_period ON finance.nbr_submissions(period_start, period_end);
      CREATE INDEX idx_nbr_status ON finance.nbr_submissions(submission_status);

      -- Receivables Indexes
      CREATE INDEX idx_receivable_tenant_due ON finance.receivables(tenant_id, due_date);
      CREATE INDEX idx_receivable_customer ON finance.receivables(customer_id);
      CREATE INDEX idx_receivable_overdue ON finance.receivables(days_overdue) WHERE status = 'PENDING';

      -- Audit Log Indexes
      CREATE INDEX idx_audit_tenant_table ON finance_audit.audit_log(tenant_id, table_name);
      CREATE INDEX idx_audit_record ON finance_audit.audit_log(record_id);
      CREATE INDEX idx_audit_date ON finance_audit.audit_log(changed_at DESC);

      -- ============================================
      -- CONSTRAINTS AND TRIGGERS
      -- ============================================

      -- Add updated_at trigger function
      CREATE OR REPLACE FUNCTION finance.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Apply updated_at triggers
      CREATE TRIGGER update_chart_of_accounts_updated_at BEFORE UPDATE
        ON finance.chart_of_accounts FOR EACH ROW
        EXECUTE FUNCTION finance.update_updated_at_column();

      CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE
        ON finance.invoices FOR EACH ROW
        EXECUTE FUNCTION finance.update_updated_at_column();

      CREATE TRIGGER update_payments_updated_at BEFORE UPDATE
        ON finance.payments FOR EACH ROW
        EXECUTE FUNCTION finance.update_updated_at_column();

      -- Journal Entry Balance Check
      CREATE OR REPLACE FUNCTION finance.check_journal_balance()
      RETURNS TRIGGER AS $$
      DECLARE
        total_debits DECIMAL;
        total_credits DECIMAL;
      BEGIN
        SELECT SUM(debit), SUM(credit) INTO total_debits, total_credits
        FROM finance.journal_entries
        WHERE entry_number = NEW.entry_number AND tenant_id = NEW.tenant_id;

        IF ABS(total_debits - total_credits) > 0.01 THEN
          RAISE EXCEPTION 'Journal entry must balance. Debits: %, Credits: %', total_debits, total_credits;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE CONSTRAINT TRIGGER check_journal_balance_trigger
        AFTER INSERT OR UPDATE ON finance.journal_entries
        DEFERRABLE INITIALLY DEFERRED
        FOR EACH ROW
        EXECUTE FUNCTION finance.check_journal_balance();

      -- Audit Trigger
      CREATE OR REPLACE FUNCTION finance_audit.audit_trigger()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO finance_audit.audit_log (
          tenant_id, table_name, operation, record_id,
          old_data, new_data, changed_by
        )
        VALUES (
          COALESCE(NEW.tenant_id, OLD.tenant_id),
          TG_TABLE_NAME,
          TG_OP,
          COALESCE(NEW.invoice_id, NEW.payment_id, NEW.expense_id, OLD.invoice_id, OLD.payment_id, OLD.expense_id),
          to_jsonb(OLD),
          to_jsonb(NEW),
          COALESCE(NEW.created_by, NEW.updated_by, current_setting('app.current_user')::UUID)
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Apply audit triggers to critical tables
      CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE
        ON finance.invoices FOR EACH ROW
        EXECUTE FUNCTION finance_audit.audit_trigger();

      CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE
        ON finance.payments FOR EACH ROW
        EXECUTE FUNCTION finance_audit.audit_trigger();

      CREATE TRIGGER audit_expenses AFTER INSERT OR UPDATE OR DELETE
        ON finance.expenses FOR EACH ROW
        EXECUTE FUNCTION finance_audit.audit_trigger();

      -- ============================================
      -- ROW LEVEL SECURITY
      -- ============================================

      -- Enable RLS on all tables
      ALTER TABLE finance.chart_of_accounts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE finance.journal_entries ENABLE ROW LEVEL SECURITY;
      ALTER TABLE finance.invoices ENABLE ROW LEVEL SECURITY;
      ALTER TABLE finance.payments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE finance.expenses ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies
      CREATE POLICY tenant_isolation_coa ON finance.chart_of_accounts
        FOR ALL
        USING (tenant_id = current_setting('app.current_tenant')::UUID);

      CREATE POLICY tenant_isolation_journal ON finance.journal_entries
        FOR ALL
        USING (tenant_id = current_setting('app.current_tenant')::UUID);

      CREATE POLICY tenant_isolation_invoices ON finance.invoices
        FOR ALL
        USING (tenant_id = current_setting('app.current_tenant')::UUID);

      CREATE POLICY tenant_isolation_payments ON finance.payments
        FOR ALL
        USING (tenant_id = current_setting('app.current_tenant')::UUID);

      CREATE POLICY tenant_isolation_expenses ON finance.expenses
        FOR ALL
        USING (tenant_id = current_setting('app.current_tenant')::UUID);

      -- ============================================
      -- PERMISSIONS
      -- ============================================

      -- Create application role if not exists
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'finance_app') THEN
          CREATE ROLE finance_app WITH LOGIN PASSWORD 'secure_password_here';
        END IF;
      END $$;

      -- Grant permissions
      GRANT USAGE ON SCHEMA finance TO finance_app;
      GRANT USAGE ON SCHEMA finance_audit TO finance_app;
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA finance TO finance_app;
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA finance TO finance_app;
      GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA finance TO finance_app;

      -- Read-only role for reporting
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'finance_readonly') THEN
          CREATE ROLE finance_readonly;
        END IF;
      END $$;

      GRANT USAGE ON SCHEMA finance TO finance_readonly;
      GRANT SELECT ON ALL TABLES IN SCHEMA finance TO finance_readonly;

      COMMIT;
    `;

    return {
      name: 'migration',
      sql,
      description: 'Create all finance module database objects',
      estimatedTime: 180,
      requiresDowntime: true,
    };
  }

  private async generatePostMigrationScript(): Promise<MigrationScript> {
    const sql = `
      -- Finance Module Post-Migration Script
      -- Version: ${this.currentVersion}

      BEGIN;

      -- 1. Re-enable triggers and constraints
      SET session_replication_role = DEFAULT;

      -- 2. Update statistics
      ANALYZE finance.chart_of_accounts;
      ANALYZE finance.journal_entries;
      ANALYZE finance.invoices;
      ANALYZE finance.payments;
      ANALYZE finance.expenses;

      -- 3. Create materialized views for performance
      CREATE MATERIALIZED VIEW IF NOT EXISTS finance.account_balances_mv AS
      SELECT
        a.tenant_id,
        a.account_id,
        a.account_code,
        a.account_name,
        a.account_type,
        COALESCE(SUM(j.debit), 0) as total_debit,
        COALESCE(SUM(j.credit), 0) as total_credit,
        CASE
          WHEN a.account_type IN ('ASSET', 'EXPENSE')
          THEN COALESCE(SUM(j.debit - j.credit), 0)
          ELSE COALESCE(SUM(j.credit - j.debit), 0)
        END as balance,
        MAX(j.entry_date) as last_activity
      FROM finance.chart_of_accounts a
      LEFT JOIN finance.journal_entries j ON a.account_id = j.account_id AND j.is_posted = true
      GROUP BY a.tenant_id, a.account_id, a.account_code, a.account_name, a.account_type
      WITH DATA;

      CREATE UNIQUE INDEX ON finance.account_balances_mv (tenant_id, account_id);

      -- 4. Create monitoring views
      CREATE OR REPLACE VIEW finance.migration_status AS
      SELECT
        'Tables' as object_type,
        COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'finance'
      UNION ALL
      SELECT
        'Indexes' as object_type,
        COUNT(*) as count
      FROM pg_indexes
      WHERE schemaname = 'finance'
      UNION ALL
      SELECT
        'Constraints' as object_type,
        COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE constraint_schema = 'finance';

      -- 5. Restore original settings
      RESET work_mem;
      RESET maintenance_work_mem;
      RESET max_parallel_workers;

      -- 6. Record migration completion
      INSERT INTO finance_audit.audit_log (
        tenant_id,
        table_name,
        operation,
        record_id,
        new_data,
        changed_by,
        changed_at
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000'::UUID,
        'MIGRATION',
        'COMPLETE',
        gen_random_uuid(),
        jsonb_build_object(
          'version', '${this.currentVersion}',
          'completed_at', NOW(),
          'status', 'SUCCESS'
        ),
        '00000000-0000-0000-0000-000000000000'::UUID,
        NOW()
      );

      COMMIT;
    `;

    return {
      name: 'post-migration',
      sql,
      description: 'Finalize migration with optimizations and monitoring',
      estimatedTime: 60,
      requiresDowntime: false,
    };
  }

  private async generateRollbackScript(): Promise<MigrationScript> {
    const sql = `
      -- Finance Module Rollback Script
      -- Version: ${this.currentVersion}
      -- WARNING: This will remove all finance module objects!

      BEGIN;

      -- 1. Disable triggers temporarily
      SET session_replication_role = replica;

      -- 2. Drop materialized views
      DROP MATERIALIZED VIEW IF EXISTS finance.account_balances_mv CASCADE;

      -- 3. Drop triggers
      DROP TRIGGER IF EXISTS update_chart_of_accounts_updated_at ON finance.chart_of_accounts;
      DROP TRIGGER IF EXISTS update_invoices_updated_at ON finance.invoices;
      DROP TRIGGER IF EXISTS update_payments_updated_at ON finance.payments;
      DROP TRIGGER IF EXISTS check_journal_balance_trigger ON finance.journal_entries;
      DROP TRIGGER IF EXISTS audit_invoices ON finance.invoices;
      DROP TRIGGER IF EXISTS audit_payments ON finance.payments;
      DROP TRIGGER IF EXISTS audit_expenses ON finance.expenses;

      -- 4. Drop functions
      DROP FUNCTION IF EXISTS finance.update_updated_at_column();
      DROP FUNCTION IF EXISTS finance.check_journal_balance();
      DROP FUNCTION IF EXISTS finance_audit.audit_trigger();

      -- 5. Drop tables (in dependency order)
      DROP TABLE IF EXISTS finance.cash_transactions CASCADE;
      DROP TABLE IF EXISTS finance.payables CASCADE;
      DROP TABLE IF EXISTS finance.receivables CASCADE;
      DROP TABLE IF EXISTS finance.nbr_submissions CASCADE;
      DROP TABLE IF EXISTS finance.tax_calculations CASCADE;
      DROP TABLE IF EXISTS finance.expenses CASCADE;
      DROP TABLE IF EXISTS finance.payments CASCADE;
      DROP TABLE IF EXISTS finance.invoice_items CASCADE;
      DROP TABLE IF EXISTS finance.invoices CASCADE;
      DROP TABLE IF EXISTS finance.journal_entries CASCADE;
      DROP TABLE IF EXISTS finance.chart_of_accounts CASCADE;
      DROP TABLE IF EXISTS finance.bank_accounts CASCADE;
      DROP TABLE IF EXISTS finance.event_store CASCADE;
      DROP TABLE IF EXISTS finance.tenants CASCADE;
      DROP TABLE IF EXISTS finance_audit.audit_log CASCADE;

      -- 6. Drop types
      DROP TYPE IF EXISTS account_type CASCADE;
      DROP TYPE IF EXISTS transaction_type CASCADE;
      DROP TYPE IF EXISTS payment_status CASCADE;
      DROP TYPE IF EXISTS tax_type CASCADE;

      -- 7. Drop schemas (optional - commented out for safety)
      -- DROP SCHEMA IF EXISTS finance CASCADE;
      -- DROP SCHEMA IF EXISTS finance_audit CASCADE;
      -- DROP SCHEMA IF EXISTS finance_ml CASCADE;

      -- 8. Restore from backup if needed
      DO $$
      DECLARE
        backup_exists BOOLEAN;
      BEGIN
        -- Check if backup exists
        SELECT EXISTS (
          SELECT 1 FROM information_schema.schemata
          WHERE schema_name = 'finance_backup'
        ) INTO backup_exists;

        IF backup_exists THEN
          RAISE NOTICE 'Backup data available in finance_backup schema';
          -- Optionally restore data here
        END IF;
      END $$;

      -- 9. Re-enable triggers
      SET session_replication_role = DEFAULT;

      -- 10. Record rollback
      INSERT INTO finance_audit.audit_log (
        tenant_id,
        table_name,
        operation,
        record_id,
        new_data,
        changed_by,
        changed_at
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000'::UUID,
        'MIGRATION',
        'ROLLBACK',
        gen_random_uuid(),
        jsonb_build_object(
          'version', '${this.currentVersion}',
          'rolled_back_at', NOW(),
          'status', 'ROLLED_BACK'
        ),
        '00000000-0000-0000-0000-000000000000'::UUID,
        NOW()
      );

      COMMIT;
    `;

    return {
      name: 'rollback',
      sql,
      description: 'Rollback all finance module database changes',
      estimatedTime: 120,
      requiresDowntime: true,
    };
  }

  private async generateValidationScript(): Promise<MigrationScript> {
    const sql = `
      -- Finance Module Validation Script
      -- Version: ${this.currentVersion}

      DO $$
      DECLARE
        validation_errors TEXT[] := ARRAY[]::TEXT[];
        table_count INTEGER;
        index_count INTEGER;
        constraint_count INTEGER;
      BEGIN
        -- 1. Validate schemas exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'finance') THEN
          validation_errors := array_append(validation_errors, 'Schema finance does not exist');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'finance_audit') THEN
          validation_errors := array_append(validation_errors, 'Schema finance_audit does not exist');
        END IF;

        -- 2. Validate required tables
        SELECT COUNT(*) INTO table_count
        FROM information_schema.tables
        WHERE table_schema = 'finance';

        IF table_count < 15 THEN
          validation_errors := array_append(validation_errors,
            format('Expected at least 15 tables, found %s', table_count));
        END IF;

        -- 3. Validate indexes
        SELECT COUNT(*) INTO index_count
        FROM pg_indexes
        WHERE schemaname = 'finance';

        IF index_count < 30 THEN
          validation_errors := array_append(validation_errors,
            format('Expected at least 30 indexes, found %s', index_count));
        END IF;

        -- 4. Validate constraints
        SELECT COUNT(*) INTO constraint_count
        FROM information_schema.table_constraints
        WHERE constraint_schema = 'finance';

        IF constraint_count < 20 THEN
          validation_errors := array_append(validation_errors,
            format('Expected at least 20 constraints, found %s', constraint_count));
        END IF;

        -- 5. Validate critical tables have RLS enabled
        IF NOT EXISTS (
          SELECT 1 FROM pg_tables
          WHERE schemaname = 'finance'
            AND tablename = 'invoices'
            AND rowsecurity = true
        ) THEN
          validation_errors := array_append(validation_errors, 'RLS not enabled on invoices table');
        END IF;

        -- 6. Validate triggers exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.triggers
          WHERE trigger_schema = 'finance'
            AND trigger_name = 'audit_invoices'
        ) THEN
          validation_errors := array_append(validation_errors, 'Audit trigger missing on invoices');
        END IF;

        -- 7. Check for data integrity
        IF EXISTS (
          SELECT 1 FROM finance.journal_entries
          GROUP BY tenant_id, entry_number
          HAVING ABS(SUM(debit) - SUM(credit)) > 0.01
        ) THEN
          validation_errors := array_append(validation_errors, 'Unbalanced journal entries found');
        END IF;

        -- 8. Report results
        IF array_length(validation_errors, 1) > 0 THEN
          RAISE EXCEPTION 'Migration validation failed: %', array_to_string(validation_errors, '; ');
        ELSE
          RAISE NOTICE 'Migration validation successful';
          RAISE NOTICE 'Tables: %, Indexes: %, Constraints: %', table_count, index_count, constraint_count;
        END IF;
      END $$;
    `;

    return {
      name: 'validation',
      sql,
      description: 'Validate migration was successful',
      estimatedTime: 30,
      requiresDowntime: false,
    };
  }

  private async generateSeedDataScript(): Promise<MigrationScript> {
    const sql = `
      -- Finance Module Seed Data Script
      -- Version: ${this.currentVersion}

      BEGIN;

      -- 1. Insert default tenant for testing
      INSERT INTO finance.tenants (tenant_id, tenant_name, tenant_name_bn, bin, tin, email, is_active)
      VALUES (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID,
        'Demo Company Ltd',
        'ডেমো কোম্পানি লিমিটেড',
        '123456789',
        '123456789012',
        'demo@company.bd',
        true
      )
      ON CONFLICT DO NOTHING;

      -- 2. Insert default Chart of Accounts (Bangladesh standard)
      WITH tenant AS (
        SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID as tenant_id
      )
      INSERT INTO finance.chart_of_accounts (tenant_id, account_code, account_name, account_name_bn, account_type, is_system)
      SELECT
        tenant_id,
        account_code,
        account_name,
        account_name_bn,
        account_type::account_type,
        true
      FROM tenant, (VALUES
        -- Assets
        ('1000', 'Assets', 'সম্পদ', 'ASSET'),
        ('1100', 'Current Assets', 'চলতি সম্পদ', 'CURRENT_ASSET'),
        ('1110', 'Cash', 'নগদ', 'CURRENT_ASSET'),
        ('1120', 'Bank Accounts', 'ব্যাংক হিসাব', 'CURRENT_ASSET'),
        ('1130', 'Accounts Receivable', 'প্রাপ্য হিসাব', 'CURRENT_ASSET'),
        ('1140', 'Inventory', 'মজুদ', 'CURRENT_ASSET'),
        ('1200', 'Fixed Assets', 'স্থায়ী সম্পদ', 'FIXED_ASSET'),
        ('1210', 'Land & Building', 'জমি ও ভবন', 'FIXED_ASSET'),
        ('1220', 'Equipment', 'যন্ত্রপাতি', 'FIXED_ASSET'),

        -- Liabilities
        ('2000', 'Liabilities', 'দায়', 'LIABILITY'),
        ('2100', 'Current Liabilities', 'চলতি দায়', 'CURRENT_LIABILITY'),
        ('2110', 'Accounts Payable', 'প্রদেয় হিসাব', 'CURRENT_LIABILITY'),
        ('2120', 'VAT Payable', 'প্রদেয় ভ্যাট', 'CURRENT_LIABILITY'),
        ('2130', 'TDS Payable', 'প্রদেয় টিডিএস', 'CURRENT_LIABILITY'),
        ('2200', 'Long Term Liabilities', 'দীর্ঘমেয়াদী দায়', 'LONG_TERM_LIABILITY'),

        -- Equity
        ('3000', 'Equity', 'মূলধন', 'EQUITY'),
        ('3100', 'Share Capital', 'শেয়ার মূলধন', 'EQUITY'),
        ('3200', 'Retained Earnings', 'সংরক্ষিত আয়', 'EQUITY'),

        -- Revenue
        ('4000', 'Revenue', 'আয়', 'REVENUE'),
        ('4100', 'Sales Revenue', 'বিক্রয় আয়', 'REVENUE'),
        ('4200', 'Service Revenue', 'সেবা আয়', 'REVENUE'),

        -- Expenses
        ('5000', 'Expenses', 'ব্যয়', 'EXPENSE'),
        ('5100', 'Cost of Goods Sold', 'বিক্রীত পণ্যের মূল্য', 'EXPENSE'),
        ('5200', 'Operating Expenses', 'পরিচালনা ব্যয়', 'EXPENSE'),
        ('5210', 'Salaries', 'বেতন', 'EXPENSE'),
        ('5220', 'Rent', 'ভাড়া', 'EXPENSE'),
        ('5230', 'Utilities', 'উপযোগিতা', 'EXPENSE')
      ) AS v(account_code, account_name, account_name_bn, account_type)
      ON CONFLICT DO NOTHING;

      -- 3. Set up parent-child relationships
      UPDATE finance.chart_of_accounts c1
      SET parent_id = c2.account_id
      FROM finance.chart_of_accounts c2
      WHERE c1.tenant_id = c2.tenant_id
        AND c1.account_code LIKE c2.account_code || '__'
        AND LENGTH(c1.account_code) = LENGTH(c2.account_code) + 2;

      COMMIT;
    `;

    return {
      name: 'seed-data',
      sql,
      description: 'Insert initial seed data for testing',
      estimatedTime: 10,
      requiresDowntime: false,
    };
  }

  async validateMigration(): Promise<ValidationResult> {
    this.logger.log('Validating migration...');

    const issues: ValidationIssue[] = [];
    const warnings: string[] = [];

    try {
      // Check table structure
      const tableCheck = await this.checkTableStructure();
      issues.push(...tableCheck.issues);

      // Check indexes
      const indexCheck = await this.checkIndexes();
      issues.push(...indexCheck.issues);

      // Check constraints
      const constraintCheck = await this.checkConstraints();
      issues.push(...constraintCheck.issues);

      // Check RLS policies
      const rlsCheck = await this.checkRLSPolicies();
      issues.push(...rlsCheck.issues);

      // Check permissions
      const permissionCheck = await this.checkPermissions();
      issues.push(...permissionCheck.issues);

      // Get summary
      const summary = await this.getValidationSummary();

      // Check for warnings
      if (summary.performanceImpact === 'HIGH') {
        warnings.push('High performance impact expected - consider running during off-peak hours');
      }

      if (summary.tablesCreated > 50) {
        warnings.push('Large number of tables - ensure sufficient disk space');
      }

      return {
        valid: issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length === 0,
        issues,
        warnings,
        summary,
      };
    } catch (error) {
      this.logger.error('Validation failed', error);
      return {
        valid: false,
        issues: [{
          type: 'SCHEMA',
          severity: 'CRITICAL',
          description: `Validation error: ${(error as Error).message}`,
        }],
        warnings: [],
        summary: this.getEmptySummary(),
      };
    }
  }

  private async checkTableStructure(): Promise<{ issues: ValidationIssue[] }> {
    const issues: ValidationIssue[] = [];

    const query = `
      SELECT
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'finance'
      ORDER BY table_name, ordinal_position;
    `;

    const result = await this.connection.query(query);

    // Check for required columns
    const requiredColumns = {
      invoices: ['tenant_id', 'invoice_number', 'customer_id', 'total'],
      payments: ['tenant_id', 'payment_number', 'amount'],
      journal_entries: ['tenant_id', 'entry_number', 'debit', 'credit'],
    };

    for (const [table, columns] of Object.entries(requiredColumns)) {
      const tableColumns = result.filter((r: any) => r.table_name === table);
      for (const column of columns) {
        if (!tableColumns.find((tc: any) => tc.column_name === column)) {
          issues.push({
            type: 'SCHEMA',
            severity: 'HIGH',
            description: `Missing required column ${column} in table ${table}`,
            table,
            column,
          });
        }
      }
    }

    return { issues };
  }

  private async checkIndexes(): Promise<{ issues: ValidationIssue[] }> {
    const issues: ValidationIssue[] = [];

    const query = `
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'finance';
    `;

    const result = await this.connection.query(query);

    // Check for critical indexes
    const criticalIndexes = [
      'idx_invoice_tenant_date',
      'idx_payment_tenant_date',
      'idx_journal_tenant_date',
    ];

    for (const indexName of criticalIndexes) {
      if (!result.find((r: any) => r.indexname === indexName)) {
        issues.push({
          type: 'INDEX',
          severity: 'MEDIUM',
          description: `Missing critical index: ${indexName}`,
          recommendation: 'Create missing index for optimal performance',
        });
      }
    }

    return { issues };
  }

  private async checkConstraints(): Promise<{ issues: ValidationIssue[] }> {
    const issues: ValidationIssue[] = [];

    const query = `
      SELECT
        table_name,
        constraint_name,
        constraint_type
      FROM information_schema.table_constraints
      WHERE constraint_schema = 'finance';
    `;

    const result = await this.connection.query(query);

    // Check for primary keys
    const tablesNeedingPK = ['invoices', 'payments', 'journal_entries', 'chart_of_accounts'];

    for (const table of tablesNeedingPK) {
      const hasPK = result.find((r: any) =>
        r.table_name === table && r.constraint_type === 'PRIMARY KEY'
      );

      if (!hasPK) {
        issues.push({
          type: 'CONSTRAINT',
          severity: 'HIGH',
          description: `Table ${table} missing primary key`,
          table,
          recommendation: 'Add primary key constraint',
        });
      }
    }

    return { issues };
  }

  private async checkRLSPolicies(): Promise<{ issues: ValidationIssue[] }> {
    const issues: ValidationIssue[] = [];

    const query = `
      SELECT
        tablename,
        rowsecurity
      FROM pg_tables
      WHERE schemaname = 'finance';
    `;

    const result = await this.connection.query(query);

    // Check RLS on sensitive tables
    const sensitiveTables = ['invoices', 'payments', 'journal_entries', 'expenses'];

    for (const table of sensitiveTables) {
      const tableInfo = result.find((r: any) => r.tablename === table);
      if (tableInfo && !tableInfo.rowsecurity) {
        issues.push({
          type: 'PERMISSION',
          severity: 'HIGH',
          description: `Row Level Security not enabled on ${table}`,
          table,
          recommendation: 'Enable RLS for multi-tenant security',
        });
      }
    }

    return { issues };
  }

  private async checkPermissions(): Promise<{ issues: ValidationIssue[] }> {
    const issues: ValidationIssue[] = [];

    const query = `
      SELECT
        grantee,
        table_name,
        privilege_type
      FROM information_schema.table_privileges
      WHERE table_schema = 'finance'
        AND grantee = 'finance_app';
    `;

    const result = await this.connection.query(query);

    if (result.length === 0) {
      issues.push({
        type: 'PERMISSION',
        severity: 'HIGH',
        description: 'Application role finance_app has no permissions',
        recommendation: 'Grant necessary permissions to application role',
      });
    }

    return { issues };
  }

  private async getValidationSummary(): Promise<ValidationSummary> {
    const queries = {
      tables: `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'finance'`,
      indexes: `SELECT COUNT(*) as count FROM pg_indexes WHERE schemaname = 'finance'`,
      constraints: `SELECT COUNT(*) as count FROM information_schema.table_constraints WHERE constraint_schema = 'finance'`,
      views: `SELECT COUNT(*) as count FROM information_schema.views WHERE table_schema = 'finance'`,
      functions: `SELECT COUNT(*) as count FROM information_schema.routines WHERE routine_schema = 'finance'`,
      triggers: `SELECT COUNT(*) as count FROM information_schema.triggers WHERE trigger_schema = 'finance'`,
    };

    const results: any = {};
    for (const [key, query] of Object.entries(queries)) {
      const result = await this.connection.query(query);
      results[key] = parseInt(result[0]?.count || 0);
    }

    // Check data integrity
    const integrityCheck = await this.connection.query(`
      SELECT COUNT(*) as unbalanced
      FROM (
        SELECT tenant_id, entry_number
        FROM finance.journal_entries
        GROUP BY tenant_id, entry_number
        HAVING ABS(SUM(debit) - SUM(credit)) > 0.01
      ) t
    `);

    return {
      tablesCreated: results.tables,
      indexesCreated: results.indexes,
      constraintsCreated: results.constraints,
      viewsCreated: results.views,
      functionsCreated: results.functions,
      triggersCreated: results.triggers,
      dataIntegrity: parseInt(integrityCheck[0]?.unbalanced || 0) === 0,
      performanceImpact: results.tables > 20 ? 'HIGH' : results.tables > 10 ? 'MEDIUM' : 'LOW',
    };
  }

  private getEmptySummary(): ValidationSummary {
    return {
      tablesCreated: 0,
      indexesCreated: 0,
      constraintsCreated: 0,
      viewsCreated: 0,
      functionsCreated: 0,
      triggersCreated: 0,
      dataIntegrity: false,
      performanceImpact: 'LOW',
    };
  }

  async executeMigration(
    migrationPackage: MigrationPackage,
    options?: { dryRun?: boolean; skipValidation?: boolean },
  ): Promise<MigrationStatus> {
    const startTime = Date.now();
    const status: MigrationStatus = {
      version: migrationPackage.version,
      appliedAt: new Date(),
      executionTime: 0,
      checksum: migrationPackage.checksum,
      status: 'FAILED',
    };

    try {
      if (options?.dryRun) {
        this.logger.log('Dry run mode - no changes will be made');
        return { ...status, status: 'SUCCESS' };
      }

      // Execute pre-migration
      this.logger.log('Executing pre-migration script...');
      await this.connection.query(migrationPackage.preMigration.sql);

      // Execute main migration
      this.logger.log('Executing main migration script...');
      await this.connection.query(migrationPackage.migration.sql);

      // Execute post-migration
      this.logger.log('Executing post-migration script...');
      await this.connection.query(migrationPackage.postMigration.sql);

      // Execute seed data if provided
      if (migrationPackage.seedData) {
        this.logger.log('Executing seed data script...');
        await this.connection.query(migrationPackage.seedData.sql);
      }

      // Validate if not skipped
      if (!options?.skipValidation) {
        const validation = await this.validateMigration();
        if (!validation.valid) {
          throw new Error(`Migration validation failed: ${JSON.stringify(validation.issues)}`);
        }
      }

      status.status = 'SUCCESS';
      status.executionTime = Date.now() - startTime;

      this.logger.log(`Migration completed successfully in ${status.executionTime}ms`);

      return status;
    } catch (error) {
      this.logger.error('Migration failed', error);
      status.status = 'FAILED';
      status.error = (error as Error).message;
      status.executionTime = Date.now() - startTime;

      // Attempt rollback
      try {
        this.logger.log('Attempting rollback...');
        await this.connection.query(migrationPackage.rollback.sql);
        this.logger.log('Rollback completed');
      } catch (rollbackError) {
        this.logger.error('Rollback failed', rollbackError);
        status.error += ` | Rollback failed: ${(rollbackError as Error).message}`;
      }

      return status;
    }
  }

  async getMigrationHistory(): Promise<MigrationStatus[]> {
    const query = `
      SELECT
        new_data->>'version' as version,
        changed_at as applied_at,
        new_data->>'execution_time' as execution_time,
        new_data->>'checksum' as checksum,
        new_data->>'status' as status
      FROM finance_audit.audit_log
      WHERE table_name = 'MIGRATION'
        AND operation IN ('COMPLETE', 'FAILED')
      ORDER BY changed_at DESC;
    `;

    try {
      const result = await this.connection.query(query);
      return result.map((row: any) => ({
        version: row.version,
        appliedAt: row.applied_at,
        executionTime: parseInt(row.execution_time || 0),
        checksum: row.checksum,
        status: row.status,
      }));
    } catch (error) {
      this.logger.error('Failed to get migration history', error);
      return [];
    }
  }

  private calculateChecksum(migrationPackage: MigrationPackage): string {
    const content = JSON.stringify({
      pre: migrationPackage.preMigration.sql,
      main: migrationPackage.migration.sql,
      post: migrationPackage.postMigration.sql,
    });

    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async saveMigrationPackage(migrationPackage: MigrationPackage): Promise<void> {
    const filename = `migration-${migrationPackage.version}-${Date.now()}.json`;
    const filepath = path.join(this.migrationPath, filename);

    fs.writeFileSync(filepath, JSON.stringify(migrationPackage, null, 2));
    this.logger.log(`Migration package saved to ${filepath}`);
  }

  private ensureMigrationDirectory(): void {
    if (!fs.existsSync(this.migrationPath)) {
      fs.mkdirSync(this.migrationPath, { recursive: true });
    }
  }
}