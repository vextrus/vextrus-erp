#!/bin/bash

# Script to generate database migrations for core services
# Usage: ./generate-core-migrations.sh

set -e

echo "=== Generating Database Migrations for Core Services ==="
echo "Date: $(date)"
echo ""

# Get current timestamp for migration naming
TIMESTAMP=$(date +"%Y%m%d%H%M%S")

# Function to create auth service migrations
create_auth_migrations() {
    echo "Creating migrations for Auth Service..."

    # Create migrations directory
    mkdir -p services/auth/src/migrations

    # Create initial migration for auth service
    cat > "services/auth/src/migrations/${TIMESTAMP}-AuthServiceInitial.ts" << 'EOF'
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class AuthServiceInitial1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
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
            name: 'username',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'first_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'last_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'mobile',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'nid',
            type: 'varchar',
            length: '17',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'is_verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'last_login',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'login_attempts',
            type: 'int',
            default: 0,
          },
          {
            name: 'locked_until',
            type: 'timestamp',
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

    // Create roles table
    await queryRunner.createTable(
      new Table({
        name: 'roles',
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
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_system',
            type: 'boolean',
            default: false,
          },
          {
            name: 'priority',
            type: 'int',
            default: 0,
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

    // Create permissions table
    await queryRunner.createTable(
      new Table({
        name: 'permissions',
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
            name: 'resource',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create user_roles junction table
    await queryRunner.createTable(
      new Table({
        name: 'user_roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'role_id',
            type: 'uuid',
          },
          {
            name: 'assigned_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'assigned_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create role_permissions junction table
    await queryRunner.createTable(
      new Table({
        name: 'role_permissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'role_id',
            type: 'uuid',
          },
          {
            name: 'permission_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create refresh_tokens table
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'token',
            type: 'varchar',
            length: '500',
            isUnique: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'revoked_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create sessions table
    await queryRunner.createTable(
      new Table({
        name: 'sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'session_token',
            type: 'varchar',
            length: '500',
            isUnique: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'last_activity',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create auth_event_store table for event sourcing
    await queryRunner.createTable(
      new Table({
        name: 'auth_event_store',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'aggregate_id',
            type: 'uuid',
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'event_data',
            type: 'jsonb',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex('users', new Index({
      name: 'IDX_users_tenant',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('users', new Index({
      name: 'IDX_users_email',
      columnNames: ['email'],
    }));

    await queryRunner.createIndex('roles', new Index({
      name: 'IDX_roles_tenant',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('roles', new Index({
      name: 'IDX_roles_name_tenant',
      columnNames: ['name', 'tenant_id'],
      isUnique: true,
    }));

    await queryRunner.createIndex('permissions', new Index({
      name: 'IDX_permissions_resource_action',
      columnNames: ['resource', 'action'],
    }));

    await queryRunner.createIndex('user_roles', new Index({
      name: 'IDX_user_roles_user',
      columnNames: ['user_id'],
    }));

    await queryRunner.createIndex('user_roles', new Index({
      name: 'IDX_user_roles_role',
      columnNames: ['role_id'],
    }));

    await queryRunner.createIndex('refresh_tokens', new Index({
      name: 'IDX_refresh_tokens_user',
      columnNames: ['user_id'],
    }));

    await queryRunner.createIndex('sessions', new Index({
      name: 'IDX_sessions_user',
      columnNames: ['user_id'],
    }));

    await queryRunner.createIndex('auth_event_store', new Index({
      name: 'IDX_event_store_aggregate',
      columnNames: ['aggregate_id'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('auth_event_store', 'IDX_event_store_aggregate');
    await queryRunner.dropIndex('sessions', 'IDX_sessions_user');
    await queryRunner.dropIndex('refresh_tokens', 'IDX_refresh_tokens_user');
    await queryRunner.dropIndex('user_roles', 'IDX_user_roles_role');
    await queryRunner.dropIndex('user_roles', 'IDX_user_roles_user');
    await queryRunner.dropIndex('permissions', 'IDX_permissions_resource_action');
    await queryRunner.dropIndex('roles', 'IDX_roles_name_tenant');
    await queryRunner.dropIndex('roles', 'IDX_roles_tenant');
    await queryRunner.dropIndex('users', 'IDX_users_email');
    await queryRunner.dropIndex('users', 'IDX_users_tenant');

    // Drop tables
    await queryRunner.dropTable('auth_event_store');
    await queryRunner.dropTable('sessions');
    await queryRunner.dropTable('refresh_tokens');
    await queryRunner.dropTable('role_permissions');
    await queryRunner.dropTable('user_roles');
    await queryRunner.dropTable('permissions');
    await queryRunner.dropTable('roles');
    await queryRunner.dropTable('users');
  }
}
EOF

    echo "✅ Created auth service migrations"
}

# Function to create master-data service migrations
create_master_data_migrations() {
    echo "Creating migrations for Master Data Service..."

    # Create migrations directory
    mkdir -p services/master-data/src/migrations

    # Create initial migration for master-data service
    cat > "services/master-data/src/migrations/${TIMESTAMP}-MasterDataServiceInitial.ts" << 'EOF'
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

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
    await queryRunner.createIndex('customers', new Index({
      name: 'IDX_customers_tenant',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('customers', new Index({
      name: 'IDX_customers_code',
      columnNames: ['code'],
    }));

    await queryRunner.createIndex('customers', new Index({
      name: 'IDX_customers_tin',
      columnNames: ['tin'],
    }));

    await queryRunner.createIndex('vendors', new Index({
      name: 'IDX_vendors_tenant',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('vendors', new Index({
      name: 'IDX_vendors_code',
      columnNames: ['code'],
    }));

    await queryRunner.createIndex('vendors', new Index({
      name: 'IDX_vendors_tin',
      columnNames: ['tin'],
    }));

    await queryRunner.createIndex('products', new Index({
      name: 'IDX_products_tenant',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('products', new Index({
      name: 'IDX_products_code',
      columnNames: ['code'],
    }));

    await queryRunner.createIndex('products', new Index({
      name: 'IDX_products_category',
      columnNames: ['category'],
    }));

    await queryRunner.createIndex('chart_of_accounts', new Index({
      name: 'IDX_accounts_tenant',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('chart_of_accounts', new Index({
      name: 'IDX_accounts_code',
      columnNames: ['code'],
    }));

    await queryRunner.createIndex('chart_of_accounts', new Index({
      name: 'IDX_accounts_parent',
      columnNames: ['parent_id'],
    }));

    await queryRunner.createIndex('categories', new Index({
      name: 'IDX_categories_tenant',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('categories', new Index({
      name: 'IDX_categories_parent',
      columnNames: ['parent_id'],
    }));

    await queryRunner.createIndex('units', new Index({
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
EOF

    echo "✅ Created master-data service migrations"
}

# Execute migration creation
create_auth_migrations
create_master_data_migrations

echo ""
echo "=== Migration Generation Complete ==="
echo ""
echo "Migrations created:"
echo "  - Auth Service: services/auth/src/migrations/${TIMESTAMP}-AuthServiceInitial.ts"
echo "  - Master Data Service: services/master-data/src/migrations/${TIMESTAMP}-MasterDataServiceInitial.ts"
echo ""
echo "Next steps:"
echo "1. Update TypeORM configuration to include migrations path"
echo "2. Run migrations: npm run migration:run"
echo "3. Verify database tables are created correctly"
echo ""