import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class NotificationServiceInitial1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
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
            name: 'channel',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'recipient_id',
            type: 'uuid',
          },
          {
            name: 'recipient_email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'recipient_phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'template_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'template_data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'priority',
            type: 'varchar',
            length: '10',
            default: "'normal'",
          },
          {
            name: 'scheduled_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'sent_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'delivered_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'failed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'retry_count',
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
    await queryRunner.createIndex('notifications', new TableIndex({
      name: 'IDX_notifications_tenant_id',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('notifications', new TableIndex({
      name: 'IDX_notifications_status',
      columnNames: ['status'],
    }));

    await queryRunner.createIndex('notifications', new TableIndex({
      name: 'IDX_notifications_recipient_id',
      columnNames: ['recipient_id'],
    }));

    await queryRunner.createIndex('notifications', new TableIndex({
      name: 'IDX_notifications_created_at',
      columnNames: ['created_at'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('notifications');
  }
}
