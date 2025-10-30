import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMasterDataTables1736500000000 implements MigrationInterface {
  name = 'CreateMasterDataTables1736500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create schema if not exists
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS master_data`);
    
    // Create customers table
    await queryRunner.query(`
      CREATE TABLE "master_data"."customers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        "is_active" boolean NOT NULL DEFAULT true,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "code" character varying(50) NOT NULL,
        "name" character varying(255) NOT NULL,
        "name_bn" character varying(255),
        "customer_type" character varying NOT NULL DEFAULT 'individual',
        "tin" character varying(12),
        "bin" character varying(9),
        "nid" character varying(17),
        "phone" character varying(20) NOT NULL,
        "phone_secondary" character varying(20),
        "email" character varying(255),
        "address" jsonb NOT NULL,
        "billing_address" jsonb,
        "shipping_address" jsonb,
        "credit_limit" numeric(15,2) NOT NULL DEFAULT '0',
        "outstanding_balance" numeric(15,2) NOT NULL DEFAULT '0',
        "payment_terms" jsonb NOT NULL,
        "bank_details" jsonb,
        "status" character varying NOT NULL DEFAULT 'active',
        "contact_persons" jsonb,
        "tags" character varying array NOT NULL DEFAULT '{}',
        "preferences" jsonb,
        "first_transaction_date" date,
        "last_transaction_date" date,
        "total_transactions" integer NOT NULL DEFAULT '0',
        "total_revenue" numeric(15,2) NOT NULL DEFAULT '0',
        "customer_group" character varying(50),
        "loyalty_points" integer NOT NULL DEFAULT '0',
        "discount_group" character varying(20),
        "kyc_documents" jsonb,
        CONSTRAINT "PK_customers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_customers_code" UNIQUE ("code")
      )
    `);

    // Create indexes for customers
    await queryRunner.query(`CREATE INDEX "IDX_customers_tenant_id" ON "master_data"."customers" ("tenant_id")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_customers_tenant_code" ON "master_data"."customers" ("tenant_id", "code")`);
    await queryRunner.query(`CREATE INDEX "IDX_customers_tenant_tin" ON "master_data"."customers" ("tenant_id", "tin")`);
    await queryRunner.query(`CREATE INDEX "IDX_customers_tenant_nid" ON "master_data"."customers" ("tenant_id", "nid")`);
    await queryRunner.query(`CREATE INDEX "IDX_customers_tenant_phone" ON "master_data"."customers" ("tenant_id", "phone")`);
    await queryRunner.query(`CREATE INDEX "IDX_customers_tenant_email" ON "master_data"."customers" ("tenant_id", "email")`);

    // Create vendors table
    await queryRunner.query(`
      CREATE TABLE "master_data"."vendors" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        "is_active" boolean NOT NULL DEFAULT true,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "code" character varying(50) NOT NULL,
        "name" character varying(255) NOT NULL,
        "name_bn" character varying(255),
        "vendor_type" character varying NOT NULL,
        "tin" character varying(12) NOT NULL,
        "bin" character varying(9),
        "trade_license_no" character varying(50),
        "trade_license_expiry" date,
        "phone" character varying(20) NOT NULL,
        "phone_secondary" character varying(20),
        "email" character varying(255) NOT NULL,
        "website" character varying(255),
        "address" jsonb NOT NULL,
        "bank_account" jsonb NOT NULL,
        "categories" character varying array NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "is_verified" boolean NOT NULL DEFAULT false,
        "verified_at" date,
        "verified_by" uuid,
        "blacklisted" boolean NOT NULL DEFAULT false,
        "blacklisted_at" date,
        "blacklist_reason" text,
        "payment_terms" jsonb NOT NULL,
        "tax_info" jsonb,
        "compliance" jsonb,
        "contact_persons" jsonb,
        "rating" numeric(3,2) NOT NULL DEFAULT '0',
        "total_orders" integer NOT NULL DEFAULT '0',
        "completed_orders" integer NOT NULL DEFAULT '0',
        "total_business_amount" numeric(15,2) NOT NULL DEFAULT '0',
        "on_time_delivery_rate" numeric(5,2) NOT NULL DEFAULT '100',
        "quality_score" numeric(5,2) NOT NULL DEFAULT '100',
        "products_services" jsonb,
        "documents" jsonb,
        "tags" character varying array NOT NULL DEFAULT '{}',
        "evaluation_history" jsonb,
        "contract_start_date" date,
        "contract_end_date" date,
        "contract_value" numeric(15,2),
        "notes" text,
        CONSTRAINT "PK_vendors" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_vendors_code" UNIQUE ("code")
      )
    `);

    // Create indexes for vendors
    await queryRunner.query(`CREATE INDEX "IDX_vendors_tenant_id" ON "master_data"."vendors" ("tenant_id")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_vendors_tenant_code" ON "master_data"."vendors" ("tenant_id", "code")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_vendors_tenant_tin" ON "master_data"."vendors" ("tenant_id", "tin")`);
    await queryRunner.query(`CREATE INDEX "IDX_vendors_tenant_status" ON "master_data"."vendors" ("tenant_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_vendors_tenant_type" ON "master_data"."vendors" ("tenant_id", "vendor_type")`);

    // Create products table
    await queryRunner.query(`
      CREATE TABLE "master_data"."products" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        "is_active" boolean NOT NULL DEFAULT true,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "sku" character varying(100) NOT NULL,
        "name" character varying(255) NOT NULL,
        "name_bn" character varying(255),
        "description" text,
        "description_bn" text,
        "product_type" character varying NOT NULL DEFAULT 'goods',
        "category" character varying NOT NULL,
        "sub_category" character varying(100),
        "brand" character varying(100),
        "model" character varying(100),
        "unit" character varying NOT NULL,
        "secondary_unit" character varying,
        "unit_conversion_factor" numeric(10,4),
        "barcode" character varying(50),
        "hs_code" character varying(20),
        "vat_rate" numeric(5,2) NOT NULL DEFAULT '15',
        "vat_exempt" boolean NOT NULL DEFAULT false,
        "vat_exemption_reason" character varying(100),
        "ait_rate" numeric(5,2) NOT NULL DEFAULT '0',
        "customs_duty_rate" numeric(5,2) NOT NULL DEFAULT '0',
        "unit_cost" numeric(15,4) NOT NULL DEFAULT '0',
        "selling_price" numeric(15,4) NOT NULL DEFAULT '0',
        "mrp" numeric(15,4),
        "wholesale_price" numeric(15,4),
        "minimum_price" numeric(15,4),
        "pricing_tiers" jsonb,
        "current_stock" numeric(10,4) NOT NULL DEFAULT '0',
        "minimum_stock" numeric(10,4) NOT NULL DEFAULT '0',
        "maximum_stock" numeric(10,4),
        "reorder_level" numeric(10,4) NOT NULL DEFAULT '0',
        "reorder_quantity" numeric(10,4) NOT NULL DEFAULT '1',
        "lead_time_days" integer NOT NULL DEFAULT '0',
        "specifications" jsonb,
        "dimensions" jsonb,
        "preferred_vendors" character varying array NOT NULL DEFAULT '{}',
        "manufacturer" character varying(100),
        "country_of_origin" character varying(100),
        "is_purchasable" boolean NOT NULL DEFAULT true,
        "is_saleable" boolean NOT NULL DEFAULT true,
        "is_manufactured" boolean NOT NULL DEFAULT false,
        "track_inventory" boolean NOT NULL DEFAULT true,
        "is_perishable" boolean NOT NULL DEFAULT false,
        "shelf_life_days" integer,
        "batch_tracking" jsonb,
        "status" character varying NOT NULL DEFAULT 'active',
        "warehouse_locations" jsonb,
        "tags" character varying array NOT NULL DEFAULT '{}',
        "images" character varying array NOT NULL DEFAULT '{}',
        "certifications" jsonb,
        "accounting_code" character varying(100),
        "revenue_account" character varying(100),
        "expense_account" character varying(100),
        "notes" text,
        "custom_fields" jsonb,
        "total_sold" integer NOT NULL DEFAULT '0',
        "total_purchased" integer NOT NULL DEFAULT '0',
        "quality_rating" numeric(3,2) NOT NULL DEFAULT '0',
        "last_purchase_date" date,
        "last_sale_date" date,
        CONSTRAINT "PK_products" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_products_sku" UNIQUE ("sku")
      )
    `);

    // Create indexes for products
    await queryRunner.query(`CREATE INDEX "IDX_products_tenant_id" ON "master_data"."products" ("tenant_id")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_products_tenant_sku" ON "master_data"."products" ("tenant_id", "sku")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_tenant_barcode" ON "master_data"."products" ("tenant_id", "barcode")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_tenant_category" ON "master_data"."products" ("tenant_id", "category")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_tenant_status" ON "master_data"."products" ("tenant_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_tenant_hs_code" ON "master_data"."products" ("tenant_id", "hs_code")`);

    // Create chart_of_accounts table
    await queryRunner.query(`
      CREATE TABLE "master_data"."chart_of_accounts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        "is_active" boolean NOT NULL DEFAULT true,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "code" character varying(20) NOT NULL,
        "name" character varying(255) NOT NULL,
        "name_bn" character varying(255),
        "description" text,
        "account_type" character varying NOT NULL,
        "account_sub_type" character varying,
        "parent_id" uuid,
        "parent_code" character varying(20),
        "level" integer NOT NULL DEFAULT '1',
        "currency" character varying NOT NULL DEFAULT 'BDT',
        "opening_balance" numeric(15,2) NOT NULL DEFAULT '0',
        "opening_balance_type" character varying NOT NULL DEFAULT 'debit',
        "current_balance" numeric(15,2) NOT NULL DEFAULT '0',
        "current_balance_type" character varying NOT NULL DEFAULT 'debit',
        "ytd_debit" numeric(15,2) NOT NULL DEFAULT '0',
        "ytd_credit" numeric(15,2) NOT NULL DEFAULT '0',
        "is_header" boolean NOT NULL DEFAULT false,
        "is_postable" boolean NOT NULL DEFAULT true,
        "is_system_account" boolean NOT NULL DEFAULT false,
        "is_bank_account" boolean NOT NULL DEFAULT false,
        "bank_details" jsonb,
        "is_cash_account" boolean NOT NULL DEFAULT false,
        "is_reconcilable" boolean NOT NULL DEFAULT false,
        "last_reconciled_date" date,
        "last_reconciled_balance" numeric(15,2),
        "tax_related" boolean NOT NULL DEFAULT false,
        "tax_info" jsonb,
        "budget_info" jsonb,
        "analysis_codes" jsonb,
        "tags" character varying array NOT NULL DEFAULT '{}',
        "requires_dimensions" boolean NOT NULL DEFAULT false,
        "dimension_requirements" jsonb,
        "group_code" character varying(100),
        "sort_order" integer,
        "reporting_categories" jsonb,
        "is_control_account" boolean NOT NULL DEFAULT false,
        "control_account_type" character varying(50),
        "compliance_info" jsonb,
        "notes" text,
        "custom_fields" jsonb,
        "effective_from" date,
        "effective_to" date,
        "is_archived" boolean NOT NULL DEFAULT false,
        "archived_at" date,
        "archived_by" uuid,
        "mpath" character varying DEFAULT '',
        CONSTRAINT "PK_chart_of_accounts" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_chart_of_accounts_code" UNIQUE ("code"),
        CONSTRAINT "FK_chart_of_accounts_parent" FOREIGN KEY ("parent_id") REFERENCES "master_data"."chart_of_accounts"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for chart_of_accounts
    await queryRunner.query(`CREATE INDEX "IDX_chart_of_accounts_tenant_id" ON "master_data"."chart_of_accounts" ("tenant_id")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_chart_of_accounts_tenant_code" ON "master_data"."chart_of_accounts" ("tenant_id", "code")`);
    await queryRunner.query(`CREATE INDEX "IDX_chart_of_accounts_tenant_type" ON "master_data"."chart_of_accounts" ("tenant_id", "account_type")`);
    await queryRunner.query(`CREATE INDEX "IDX_chart_of_accounts_tenant_active" ON "master_data"."chart_of_accounts" ("tenant_id", "is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_chart_of_accounts_parent" ON "master_data"."chart_of_accounts" ("parent_id")`);

    // Create RLS policies
    await queryRunner.query(`ALTER TABLE "master_data"."customers" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "master_data"."vendors" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "master_data"."products" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "master_data"."chart_of_accounts" ENABLE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_chart_of_accounts_parent"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_chart_of_accounts_tenant_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_chart_of_accounts_tenant_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_chart_of_accounts_tenant_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_chart_of_accounts_tenant_id"`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_products_tenant_hs_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_products_tenant_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_products_tenant_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_products_tenant_barcode"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_products_tenant_sku"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_products_tenant_id"`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_vendors_tenant_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_vendors_tenant_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_vendors_tenant_tin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_vendors_tenant_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_vendors_tenant_id"`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_customers_tenant_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_customers_tenant_phone"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_customers_tenant_nid"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_customers_tenant_tin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_customers_tenant_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "master_data"."IDX_customers_tenant_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "master_data"."chart_of_accounts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "master_data"."products"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "master_data"."vendors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "master_data"."customers"`);
  }
}