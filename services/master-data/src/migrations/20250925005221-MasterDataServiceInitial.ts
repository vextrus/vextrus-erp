import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class MasterDataServiceInitial1234567890124 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Create customers table
    await queryRunner.createTable(
      new Table({
        name: 'customers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'name_bn',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'tin',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'bin',
            type: 'varchar',
            length: '9',
            isNullable: true,
          },
          {
            name: 'nid',
            type: 'varchar',
            length: '17',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'mobile',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'address',
            type: 'text',
          },
          {
            name: 'address_bn',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'district',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'upazila',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'credit_limit',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'credit_days',
            type: 'int',
            default: 0,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create vendors table
    await queryRunner.createTable(
      new Table({
        name: 'vendors',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'name_bn',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'tin',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'bin',
            type: 'varchar',
            length: '9',
            isNullable: true,
          },
          {
            name: 'trade_license',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'mobile',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'address',
            type: 'text',
          },
          {
            name: 'address_bn',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'district',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'bank_account',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'bank_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'payment_terms',
            type: 'int',
            default: 0,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create products table
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'name_bn',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'unit',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'unit_bn',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'hs_code',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'barcode',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'cost_price',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'sale_price',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'vat_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 15,
          },
          {
            name: 'reorder_level',
            type: 'int',
            default: 0,
          },
          {
            name: 'reorder_quantity',
            type: 'int',
            default: 0,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create chart_of_accounts table
    await queryRunner.createTable(
      new Table({
        name: 'chart_of_accounts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'name_bn',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'parent_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'level',
            type: 'int',
            default: 0,
          },
          {
            name: 'is_detail',
            type: 'boolean',
            default: false,
          },
          {
            name: 'opening_balance',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'current_balance',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create categories table
    await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'name_bn',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'parent_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'level',
            type: 'int',
            default: 0,
          },
          {
            name: 'sort_order',
            type: 'int',
            default: 0,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create units table
    await queryRunner.createTable(
      new Table({
        name: 'units',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '20',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'name_bn',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'symbol',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'base_unit_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'conversion_factor',
            type: 'decimal',
            precision: 10,
            scale: 4,
            default: 1,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex('customers', new TableIndex({
      name: 'IDX_customers_tenant',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('customers', new TableIndex({
      name: 'IDX_customers_code',
      columnNames: ['code'],
    }));

    await queryRunner.createIndex('customers', new TableIndex({
      name: 'IDX_customers_tin',
      columnNames: ['tin'],
    }));

    await queryRunner.createIndex('vendors', new TableIndex({
      name: 'IDX_vendors_tenant',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('vendors', new TableIndex({
      name: 'IDX_vendors_code',
      columnNames: ['code'],
    }));

    await queryRunner.createIndex('vendors', new TableIndex({
      name: 'IDX_vendors_tin',
      columnNames: ['tin'],
    }));

    await queryRunner.createIndex('products', new TableIndex({
      name: 'IDX_products_tenant',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('products', new TableIndex({
      name: 'IDX_products_code',
      columnNames: ['code'],
    }));

    await queryRunner.createIndex('products', new TableIndex({
      name: 'IDX_products_category',
      columnNames: ['category'],
    }));

    await queryRunner.createIndex('chart_of_accounts', new TableIndex({
      name: 'IDX_accounts_tenant',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('chart_of_accounts', new TableIndex({
      name: 'IDX_accounts_code',
      columnNames: ['code'],
    }));

    await queryRunner.createIndex('chart_of_accounts', new TableIndex({
      name: 'IDX_accounts_parent',
      columnNames: ['parent_id'],
    }));

    await queryRunner.createIndex('categories', new TableIndex({
      name: 'IDX_categories_tenant',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('categories', new TableIndex({
      name: 'IDX_categories_parent',
      columnNames: ['parent_id'],
    }));

    await queryRunner.createIndex('units', new TableIndex({
      name: 'IDX_units_tenant',
      columnNames: ['tenant_id'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('units', 'IDX_units_tenant');
    await queryRunner.dropIndex('categories', 'IDX_categories_parent');
    await queryRunner.dropIndex('categories', 'IDX_categories_tenant');
    await queryRunner.dropIndex('chart_of_accounts', 'IDX_accounts_parent');
    await queryRunner.dropIndex('chart_of_accounts', 'IDX_accounts_code');
    await queryRunner.dropIndex('chart_of_accounts', 'IDX_accounts_tenant');
    await queryRunner.dropIndex('products', 'IDX_products_category');
    await queryRunner.dropIndex('products', 'IDX_products_code');
    await queryRunner.dropIndex('products', 'IDX_products_tenant');
    await queryRunner.dropIndex('vendors', 'IDX_vendors_tin');
    await queryRunner.dropIndex('vendors', 'IDX_vendors_code');
    await queryRunner.dropIndex('vendors', 'IDX_vendors_tenant');
    await queryRunner.dropIndex('customers', 'IDX_customers_tin');
    await queryRunner.dropIndex('customers', 'IDX_customers_code');
    await queryRunner.dropIndex('customers', 'IDX_customers_tenant');

    // Drop tables
    await queryRunner.dropTable('units');
    await queryRunner.dropTable('categories');
    await queryRunner.dropTable('chart_of_accounts');
    await queryRunner.dropTable('products');
    await queryRunner.dropTable('vendors');
    await queryRunner.dropTable('customers');
  }
}
