import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AuditServiceInitial1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create audit_logs table
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
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
            name: 'event_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'severity',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'outcome',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'actor_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'actor_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'actor_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'resource_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'resource_type',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'resource_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'action',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
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
            name: 'session_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'correlation_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'indexed_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_audit_logs_tenant_id',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_audit_logs_event_type',
      columnNames: ['event_type'],
    }));

    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_audit_logs_actor_id',
      columnNames: ['actor_id'],
    }));

    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_audit_logs_resource_id',
      columnNames: ['resource_id'],
    }));

    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_audit_logs_created_at',
      columnNames: ['created_at'],
    }));

    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_audit_logs_correlation_id',
      columnNames: ['correlation_id'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs');
  }
}
