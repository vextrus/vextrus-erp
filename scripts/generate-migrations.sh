#!/bin/bash

# Script to generate TypeORM migrations for all infrastructure services

services=(
  "audit:AuditServiceInitial"
  "notification:NotificationServiceInitial"
  "file-storage:FileStorageServiceInitial"
  "document-generator:DocumentGeneratorServiceInitial"
  "scheduler:SchedulerServiceInitial"
  "configuration:ConfigurationServiceInitial"
  "import-export:ImportExportServiceInitial"
)

echo "Generating TypeORM migrations for infrastructure services..."
echo ""

for service_info in "${services[@]}"; do
  IFS=':' read -r service migration_name <<< "$service_info"

  echo "Processing $service..."

  # Create migrations directory if it doesn't exist
  mkdir -p "services/$service/src/migrations"

  # Generate migration file with timestamp
  timestamp=$(date +%Y%m%d%H%M%S)
  migration_file="services/$service/src/migrations/${timestamp}-${migration_name}.ts"

  # Create migration based on service type
  case $service in
    "audit")
      cat > "$migration_file" << 'EOF'
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

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
    await queryRunner.createIndex('audit_logs', new Index({
      name: 'IDX_audit_logs_tenant_id',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('audit_logs', new Index({
      name: 'IDX_audit_logs_event_type',
      columnNames: ['event_type'],
    }));

    await queryRunner.createIndex('audit_logs', new Index({
      name: 'IDX_audit_logs_actor_id',
      columnNames: ['actor_id'],
    }));

    await queryRunner.createIndex('audit_logs', new Index({
      name: 'IDX_audit_logs_resource_id',
      columnNames: ['resource_id'],
    }));

    await queryRunner.createIndex('audit_logs', new Index({
      name: 'IDX_audit_logs_created_at',
      columnNames: ['created_at'],
    }));

    await queryRunner.createIndex('audit_logs', new Index({
      name: 'IDX_audit_logs_correlation_id',
      columnNames: ['correlation_id'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs');
  }
}
EOF
      ;;

    "notification")
      cat > "$migration_file" << 'EOF'
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

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
    await queryRunner.createIndex('notifications', new Index({
      name: 'IDX_notifications_tenant_id',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('notifications', new Index({
      name: 'IDX_notifications_status',
      columnNames: ['status'],
    }));

    await queryRunner.createIndex('notifications', new Index({
      name: 'IDX_notifications_recipient_id',
      columnNames: ['recipient_id'],
    }));

    await queryRunner.createIndex('notifications', new Index({
      name: 'IDX_notifications_created_at',
      columnNames: ['created_at'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('notifications');
  }
}
EOF
      ;;

    "file-storage")
      cat > "$migration_file" << 'EOF'
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
EOF
      ;;

    "document-generator")
      cat > "$migration_file" << 'EOF'
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

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
    await queryRunner.createIndex('documents', new Index({
      name: 'IDX_documents_tenant_id',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('documents', new Index({
      name: 'IDX_documents_status',
      columnNames: ['status'],
    }));

    await queryRunner.createIndex('documents', new Index({
      name: 'IDX_documents_generated_by',
      columnNames: ['generated_by'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('documents');
  }
}
EOF
      ;;

    "scheduler")
      cat > "$migration_file" << 'EOF'
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

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
    await queryRunner.createIndex('job_schedules', new Index({
      name: 'IDX_job_schedules_tenant_id',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('job_schedules', new Index({
      name: 'IDX_job_schedules_status',
      columnNames: ['status'],
    }));

    await queryRunner.createIndex('job_schedules', new Index({
      name: 'IDX_job_schedules_next_run_at',
      columnNames: ['next_run_at'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('job_schedules');
  }
}
EOF
      ;;

    "configuration")
      cat > "$migration_file" << 'EOF'
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

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
    await queryRunner.createIndex('configurations', new Index({
      name: 'IDX_configurations_tenant_id',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('configurations', new Index({
      name: 'IDX_configurations_key',
      columnNames: ['key'],
    }));

    await queryRunner.createIndex('configurations', new Index({
      name: 'IDX_configurations_category',
      columnNames: ['category'],
    }));

    await queryRunner.createIndex('feature_flags', new Index({
      name: 'IDX_feature_flags_tenant_id',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('feature_flags', new Index({
      name: 'IDX_feature_flags_name',
      columnNames: ['name'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('configurations');
    await queryRunner.dropTable('feature_flags');
  }
}
EOF
      ;;

    "import-export")
      cat > "$migration_file" << 'EOF'
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class ImportExportServiceInitial1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create import_jobs table
    await queryRunner.createTable(
      new Table({
        name: 'import_jobs',
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
            name: 'status',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'file_path',
            type: 'text',
          },
          {
            name: 'file_size',
            type: 'bigint',
          },
          {
            name: 'total_records',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'processed_records',
            type: 'int',
            default: 0,
          },
          {
            name: 'successful_records',
            type: 'int',
            default: 0,
          },
          {
            name: 'failed_records',
            type: 'int',
            default: 0,
          },
          {
            name: 'mapping_config',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'validation_rules',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'errors',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'started_by',
            type: 'uuid',
          },
          {
            name: 'started_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create export_jobs table
    await queryRunner.createTable(
      new Table({
        name: 'export_jobs',
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
            name: 'status',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'query_config',
            type: 'jsonb',
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
            name: 'record_count',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'requested_by',
            type: 'uuid',
          },
          {
            name: 'started_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'download_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex('import_jobs', new Index({
      name: 'IDX_import_jobs_tenant_id',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('import_jobs', new Index({
      name: 'IDX_import_jobs_status',
      columnNames: ['status'],
    }));

    await queryRunner.createIndex('export_jobs', new Index({
      name: 'IDX_export_jobs_tenant_id',
      columnNames: ['tenant_id'],
    }));

    await queryRunner.createIndex('export_jobs', new Index({
      name: 'IDX_export_jobs_status',
      columnNames: ['status'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('import_jobs');
    await queryRunner.dropTable('export_jobs');
  }
}
EOF
      ;;
  esac

  echo "  ✓ Created migration for $service: $migration_file"
done

echo ""
echo "Done! TypeORM migrations created for all infrastructure services."
echo ""
echo "To run migrations, use:"
echo "  npm run migration:run   # In each service directory"
echo ""
echo "Or run all at once with Docker Compose:"
echo "  docker-compose up -d postgres"
echo "  docker-compose run --rm <service> npm run migration:run"