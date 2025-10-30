import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class DocumentGeneratorServiceInitial1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'documents',
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
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'format',
            type: 'varchar',
            length: '20',
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
            name: 'status',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'file_path',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'file_size',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'generated_by',
            type: 'uuid',
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
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
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex('documents', new TableIndex({
      name: 'IDX_documents_tenant_id',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('documents', new TableIndex({
      name: 'IDX_documents_status',
      columnNames: ['status'],
    }));

    await queryRunner.createIndex('documents', new TableIndex({
      name: 'IDX_documents_generated_by',
      columnNames: ['generated_by'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('documents');
  }
}
