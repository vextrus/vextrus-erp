import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class RulesEngineServiceInitial20250925034424 implements MigrationInterface {
    name = 'RulesEngineServiceInitial20250925034424'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable UUID extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create rules table
        await queryRunner.createTable(
            new Table({
                name: 'rules',
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
                        length: '255',
                        isUnique: true,
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
                        name: 'category',
                        type: 'varchar',
                        length: '100',
                    },
                    {
                        name: 'rule_type',
                        type: 'varchar',
                        length: '100',
                    },
                    {
                        name: 'priority',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'context',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'metadata',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'effective_from',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'effective_to',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'regulatory_reference',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'vat_rate',
                        type: 'decimal',
                        precision: 5,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'fiscal_year_type',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'threshold_values',
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
                        name: 'updated_by',
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
                        name: 'updated_at',
                        type: 'timestamp',
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

        // Create conditions table
        await queryRunner.createTable(
            new Table({
                name: 'conditions',
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
                        name: 'rule_id',
                        type: 'uuid',
                    },
                    {
                        name: 'field_name',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'operator',
                        type: 'varchar',
                        length: '50',
                    },
                    {
                        name: 'value',
                        type: 'jsonb',
                    },
                    {
                        name: 'data_type',
                        type: 'varchar',
                        length: '50',
                    },
                    {
                        name: 'logical_operator',
                        type: 'varchar',
                        length: '20',
                        isNullable: true,
                    },
                    {
                        name: 'group_number',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'sequence',
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
                        name: 'validation_type',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'error_message',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'error_message_bn',
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
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        // Create actions table
        await queryRunner.createTable(
            new Table({
                name: 'actions',
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
                        name: 'rule_id',
                        type: 'uuid',
                    },
                    {
                        name: 'action_type',
                        type: 'varchar',
                        length: '100',
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
                        name: 'parameters',
                        type: 'jsonb',
                    },
                    {
                        name: 'sequence',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'stop_on_failure',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'target_field',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'target_service',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'target_endpoint',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'calculation_formula',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'metadata',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'notification_channel',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'sms_gateway',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'vat_percentage',
                        type: 'decimal',
                        precision: 5,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'currency',
                        type: 'varchar',
                        length: '100',
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

        // Create evaluations table
        await queryRunner.createTable(
            new Table({
                name: 'evaluations',
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
                        name: 'rule_id',
                        type: 'uuid',
                    },
                    {
                        name: 'entity_type',
                        type: 'varchar',
                        length: '100',
                    },
                    {
                        name: 'entity_id',
                        type: 'uuid',
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '50',
                    },
                    {
                        name: 'result',
                        type: 'boolean',
                        isNullable: true,
                    },
                    {
                        name: 'input_data',
                        type: 'jsonb',
                    },
                    {
                        name: 'output_data',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'condition_results',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'action_results',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'error_details',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'triggered_by',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'evaluated_at',
                        type: 'timestamp',
                    },
                    {
                        name: 'execution_time_ms',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'business_context',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'amount_bdt',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'tin_number',
                        type: 'varchar',
                        length: '20',
                        isNullable: true,
                    },
                    {
                        name: 'bin_number',
                        type: 'varchar',
                        length: '20',
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
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        // Create indexes for rules
        await queryRunner.createIndex('rules', new TableIndex({
            name: 'IDX_rule_tenant_id',
            columnNames: ['tenant_id'],
        }));
        await queryRunner.createIndex('rules', new TableIndex({
            name: 'IDX_rule_category',
            columnNames: ['category'],
        }));
        await queryRunner.createIndex('rules', new TableIndex({
            name: 'IDX_rule_is_active',
            columnNames: ['is_active'],
        }));
        await queryRunner.createIndex('rules', new TableIndex({
            name: 'IDX_rule_priority',
            columnNames: ['priority'],
        }));

        // Create indexes for conditions
        await queryRunner.createIndex('conditions', new TableIndex({
            name: 'IDX_condition_tenant_id',
            columnNames: ['tenant_id'],
        }));
        await queryRunner.createIndex('conditions', new TableIndex({
            name: 'IDX_condition_rule_id',
            columnNames: ['rule_id'],
        }));
        await queryRunner.createIndex('conditions', new TableIndex({
            name: 'IDX_condition_field_name',
            columnNames: ['field_name'],
        }));

        // Create indexes for actions
        await queryRunner.createIndex('actions', new TableIndex({
            name: 'IDX_action_tenant_id',
            columnNames: ['tenant_id'],
        }));
        await queryRunner.createIndex('actions', new TableIndex({
            name: 'IDX_action_rule_id',
            columnNames: ['rule_id'],
        }));
        await queryRunner.createIndex('actions', new TableIndex({
            name: 'IDX_action_action_type',
            columnNames: ['action_type'],
        }));

        // Create indexes for evaluations
        await queryRunner.createIndex('evaluations', new TableIndex({
            name: 'IDX_evaluation_tenant_id',
            columnNames: ['tenant_id'],
        }));
        await queryRunner.createIndex('evaluations', new TableIndex({
            name: 'IDX_evaluation_rule_id',
            columnNames: ['rule_id'],
        }));
        await queryRunner.createIndex('evaluations', new TableIndex({
            name: 'IDX_evaluation_status',
            columnNames: ['status'],
        }));
        await queryRunner.createIndex('evaluations', new TableIndex({
            name: 'IDX_evaluation_entity_type_entity_id',
            columnNames: ['entity_type', 'entity_id'],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.dropIndex('evaluations', 'IDX_evaluation_entity_type_entity_id');
        await queryRunner.dropIndex('evaluations', 'IDX_evaluation_status');
        await queryRunner.dropIndex('evaluations', 'IDX_evaluation_rule_id');
        await queryRunner.dropIndex('evaluations', 'IDX_evaluation_tenant_id');

        await queryRunner.dropIndex('actions', 'IDX_action_action_type');
        await queryRunner.dropIndex('actions', 'IDX_action_rule_id');
        await queryRunner.dropIndex('actions', 'IDX_action_tenant_id');

        await queryRunner.dropIndex('conditions', 'IDX_condition_field_name');
        await queryRunner.dropIndex('conditions', 'IDX_condition_rule_id');
        await queryRunner.dropIndex('conditions', 'IDX_condition_tenant_id');

        await queryRunner.dropIndex('rules', 'IDX_rule_priority');
        await queryRunner.dropIndex('rules', 'IDX_rule_is_active');
        await queryRunner.dropIndex('rules', 'IDX_rule_category');
        await queryRunner.dropIndex('rules', 'IDX_rule_tenant_id');

        // Drop tables
        await queryRunner.dropTable('evaluations');
        await queryRunner.dropTable('actions');
        await queryRunner.dropTable('conditions');
        await queryRunner.dropTable('rules');
    }
}
