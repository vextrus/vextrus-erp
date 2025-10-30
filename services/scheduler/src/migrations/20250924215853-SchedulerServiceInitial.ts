import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class SchedulerServiceInitial1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'job_schedules',
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
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'job_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'cron_expression',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'timezone',
            type: 'varchar',
            length: '50',
            default: "'Asia/Dhaka'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'payload',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'last_run_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_run_status',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'last_run_error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'next_run_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'execution_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'success_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'failure_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'metadata',
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
    await queryRunner.createIndex('job_schedules', new TableIndex({
      name: 'IDX_job_schedules_tenant_id',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('job_schedules', new TableIndex({
      name: 'IDX_job_schedules_status',
      columnNames: ['status'],
    }));

    await queryRunner.createIndex('job_schedules', new TableIndex({
      name: 'IDX_job_schedules_next_run_at',
      columnNames: ['next_run_at'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('job_schedules');
  }
}
