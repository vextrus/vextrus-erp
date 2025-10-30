import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

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
    await queryRunner.createIndex('users', new TableIndex({
      name: 'IDX_users_tenant',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('users', new TableIndex({
      name: 'IDX_users_email',
      columnNames: ['email'],
    }));

    await queryRunner.createIndex('roles', new TableIndex({
      name: 'IDX_roles_tenant',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('roles', new TableIndex({
      name: 'IDX_roles_name_tenant',
      columnNames: ['name', 'tenant_id'],
      isUnique: true,
    }));

    await queryRunner.createIndex('permissions', new TableIndex({
      name: 'IDX_permissions_resource_action',
      columnNames: ['resource', 'action'],
    }));

    await queryRunner.createIndex('user_roles', new TableIndex({
      name: 'IDX_user_roles_user',
      columnNames: ['user_id'],
    }));

    await queryRunner.createIndex('user_roles', new TableIndex({
      name: 'IDX_user_roles_role',
      columnNames: ['role_id'],
    }));

    await queryRunner.createIndex('refresh_tokens', new TableIndex({
      name: 'IDX_refresh_tokens_user',
      columnNames: ['user_id'],
    }));

    await queryRunner.createIndex('sessions', new TableIndex({
      name: 'IDX_sessions_user',
      columnNames: ['user_id'],
    }));

    await queryRunner.createIndex('auth_event_store', new TableIndex({
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
