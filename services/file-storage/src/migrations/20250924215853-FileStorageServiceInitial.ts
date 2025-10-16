import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class FileStorageServiceInitial1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'files',
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
            name: 'filename',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'original_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'size',
            type: 'bigint',
          },
          {
            name: 'storage_path',
            type: 'text',
          },
          {
            name: 'storage_provider',
            type: 'varchar',
            length: '50',
            default: "'minio'",
          },
          {
            name: 'bucket',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'checksum',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'uploaded_by',
            type: 'uuid',
          },
          {
            name: 'access_level',
            type: 'varchar',
            length: '20',
            default: "'private'",
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'virus_scanned',
            type: 'boolean',
            default: false,
          },
          {
            name: 'virus_scan_result',
            type: 'varchar',
            length: '20',
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
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex('files', new Index({
      name: 'IDX_files_tenant_id',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('files', new Index({
      name: 'IDX_files_uploaded_by',
      columnNames: ['uploaded_by'],
    }));

    await queryRunner.createIndex('files', new Index({
      name: 'IDX_files_checksum',
      columnNames: ['checksum'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('files');
  }
}
