import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class OrganizationServiceInitial20250925120000 implements MigrationInterface {
    name = 'OrganizationServiceInitial20250925120000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable UUID extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create organizations table
        await queryRunner.createTable(
            new Table({
                name: 'organizations',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'slug',
                        type: 'varchar',
                        length: '255',
                        isUnique: true,
                    },
                    {
                        name: 'type',
                        type: 'varchar',
                        length: '50',
                        default: "'construction'",
                    },
                    {
                        name: 'settings',
                        type: 'jsonb',
                        default: "'{}'",
                    },
                    {
                        name: 'subscription_plan',
                        type: 'varchar',
                        length: '50',
                        default: "'basic'",
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'logo_url',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'description',
                        type: 'varchar',
                        length: '500',
                        isNullable: true,
                    },
                    {
                        name: 'website',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'phone',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'address',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    // Bangladesh-specific fields
                    {
                        name: 'tin',
                        type: 'varchar',
                        length: '20',
                        isNullable: true,
                    },
                    {
                        name: 'bin',
                        type: 'varchar',
                        length: '20',
                        isNullable: true,
                    },
                    {
                        name: 'trade_license_number',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'trade_license_expiry',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'regulatory_body',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '50',
                        default: "'active'",
                    },
                    {
                        name: 'max_users',
                        type: 'int',
                        default: 5,
                    },
                    {
                        name: 'max_divisions',
                        type: 'int',
                        default: 1,
                    },
                    {
                        name: 'max_projects',
                        type: 'int',
                        default: 100,
                    },
                    {
                        name: 'subscription_expiry_date',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'billing_info',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'features',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'created_by',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'last_modified_by',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamptz',
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamptz',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        // Create tenants table
        await queryRunner.createTable(
            new Table({
                name: 'tenants',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'organization_id',
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
                        name: 'domain',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '50',
                        default: "'active'",
                    },
                    {
                        name: 'settings',
                        type: 'jsonb',
                        default: "'{}'",
                    },
                    {
                        name: 'limits',
                        type: 'jsonb',
                        default: "'{}'",
                    },
                    {
                        name: 'usage',
                        type: 'jsonb',
                        default: "'{}'",
                    },
                    {
                        name: 'company_info',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'contact_info',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'address',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'bank_info',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'trial_ends_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'subscription_started_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'subscription_ends_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'last_active_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'is_deleted',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'created_by',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'last_modified_by',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamptz',
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamptz',
                        default: 'now()',
                    },
                    {
                        name: 'version',
                        type: 'int',
                        default: 1,
                    },
                ],
            }),
            true,
        );

        // Create divisions table
        await queryRunner.createTable(
            new Table({
                name: 'divisions',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'organization_id',
                        type: 'uuid',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'code',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'type',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'settings',
                        type: 'jsonb',
                        default: "'{}'",
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'description',
                        type: 'varchar',
                        length: '500',
                        isNullable: true,
                    },
                    {
                        name: 'manager_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamptz',
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamptz',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        // Create indexes for organizations
        await queryRunner.createIndex('organizations', {
            name: 'idx_organization_slug',
            columnNames: ['slug'],
            isUnique: true,
        } as any);
        await queryRunner.createIndex('organizations', {
            name: 'idx_organization_tenant',
            columnNames: ['id', 'is_active'],
        } as any);
        await queryRunner.createIndex('organizations', {
            name: 'idx_organization_tin',
            columnNames: ['tin'],
        } as any);
        await queryRunner.createIndex('organizations', {
            name: 'idx_organization_bin',
            columnNames: ['bin'],
        } as any);
        await queryRunner.createIndex('organizations', {
            name: 'idx_organization_status',
            columnNames: ['status'],
        } as any);

        // Create indexes for tenants
        await queryRunner.createIndex('tenants', {
            name: 'idx_tenant_organization',
            columnNames: ['organization_id'],
        } as any);
        await queryRunner.createIndex('tenants', {
            name: 'idx_tenant_code',
            columnNames: ['code'],
            isUnique: true,
        } as any);
        await queryRunner.createIndex('tenants', {
            name: 'idx_tenant_status',
            columnNames: ['status'],
        } as any);

        // Create indexes for divisions
        await queryRunner.createIndex('divisions', {
            name: 'idx_division_org_code',
            columnNames: ['organization_id', 'code'],
            isUnique: true,
        } as any);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE tenants 
            ADD CONSTRAINT FK_tenant_organization 
            FOREIGN KEY (organization_id) 
            REFERENCES organizations(id) 
            ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE divisions 
            ADD CONSTRAINT FK_division_organization 
            FOREIGN KEY (organization_id) 
            REFERENCES organizations(id) 
            ON DELETE CASCADE;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE divisions DROP CONSTRAINT IF EXISTS FK_division_organization`);
        await queryRunner.query(`ALTER TABLE tenants DROP CONSTRAINT IF EXISTS FK_tenant_organization`);

        // Drop indexes
        await queryRunner.dropIndex('divisions', 'idx_division_org_code');
        await queryRunner.dropIndex('tenants', 'idx_tenant_status');
        await queryRunner.dropIndex('tenants', 'idx_tenant_code');
        await queryRunner.dropIndex('tenants', 'idx_tenant_organization');
        await queryRunner.dropIndex('organizations', 'idx_organization_status');
        await queryRunner.dropIndex('organizations', 'idx_organization_bin');
        await queryRunner.dropIndex('organizations', 'idx_organization_tin');
        await queryRunner.dropIndex('organizations', 'idx_organization_tenant');
        await queryRunner.dropIndex('organizations', 'idx_organization_slug');

        // Drop tables
        await queryRunner.dropTable('divisions');
        await queryRunner.dropTable('tenants');
        await queryRunner.dropTable('organizations');
    }
}