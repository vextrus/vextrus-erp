import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class ConfigurationServiceInitial1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create configurations table
    await queryRunner.createTable(
      new Table({
        name: 'configurations',
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
            name: 'key',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'value',
            type: 'jsonb',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_sensitive',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_public',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create feature_flags table
    await queryRunner.createTable(
      new Table({
        name: 'feature_flags',
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
            length: '255',
          },
          {
            name: 'enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'rollout_percentage',
            type: 'int',
            default: 0,
          },
          {
            name: 'targeting_rules',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex('configurations', new TableIndex({
      name: 'IDX_configurations_tenant_id',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('configurations', new TableIndex({
      name: 'IDX_configurations_key',
      columnNames: ['key'],
    }));

    await queryRunner.createIndex('configurations', new TableIndex({
      name: 'IDX_configurations_category',
      columnNames: ['category'],
    }));

    await queryRunner.createIndex('feature_flags', new TableIndex({
      name: 'IDX_feature_flags_tenant_id',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('feature_flags', new TableIndex({
      name: 'IDX_feature_flags_name',
      columnNames: ['name'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('configurations');
    await queryRunner.dropTable('feature_flags');
  }
}
