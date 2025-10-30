import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class WorkflowServiceInitial1695682464 implements MigrationInterface {
    name = 'WorkflowServiceInitial1695682464'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable UUID extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create processes table
        await queryRunner.createTable(
            new Table({
                name: 'processes',
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
                        name: 'workflow_type',
                        type: 'varchar',
                        length: '100',
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '50',
                    },
                    {
                        name: 'variables',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'metadata',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'parent_process_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'business_key',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'initiated_by',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
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
                        name: 'due_date',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'priority',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'approval_status',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'regulatory_type',
                        type: 'varchar',
                        length: '50',
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

        // Create tasks table
        await queryRunner.createTable(
            new Table({
                name: 'tasks',
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
                        name: 'process_id',
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
                        name: 'task_type',
                        type: 'varchar',
                        length: '100',
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '50',
                    },
                    {
                        name: 'assigned_to',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'assigned_group',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'form_data',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'variables',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'metadata',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'due_date',
                        type: 'timestamp',
                        isNullable: true,
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
                        name: 'priority',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'completed_by',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'completion_reason',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'is_sequential',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'requires_approval',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'approval_level',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'amount_limit',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
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

        // Create transitions table
        await queryRunner.createTable(
            new Table({
                name: 'transitions',
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
                        name: 'process_id',
                        type: 'uuid',
                    },
                    {
                        name: 'from_task_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'to_task_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'transition_type',
                        type: 'varchar',
                        length: '100',
                    },
                    {
                        name: 'condition',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'priority',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'metadata',
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
                        name: 'triggered_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'trigger_event',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'trigger_data',
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

        // Create assignments table
        await queryRunner.createTable(
            new Table({
                name: 'assignments',
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
                        name: 'task_id',
                        type: 'uuid',
                    },
                    {
                        name: 'assignee',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'assignment_type',
                        type: 'varchar',
                        length: '50',
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '50',
                    },
                    {
                        name: 'assigned_by',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'delegated_to',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'delegated_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'comments',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'metadata',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'accepted_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'completed_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'priority',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'is_escalated',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'escalation_date',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'department',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'designation',
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

        // Create indexes for processes
        await queryRunner.createIndex('processes', new TableIndex({
            name: 'IDX_process_tenant_id',
            columnNames: ['tenant_id'],
        }));
        await queryRunner.createIndex('processes', new TableIndex({
            name: 'IDX_process_status',
            columnNames: ['status'],
        }));
        await queryRunner.createIndex('processes', new TableIndex({
            name: 'IDX_process_workflow_type',
            columnNames: ['workflow_type'],
        }));

        // Create indexes for tasks
        await queryRunner.createIndex('tasks', new TableIndex({
            name: 'IDX_task_tenant_id',
            columnNames: ['tenant_id'],
        }));
        await queryRunner.createIndex('tasks', new TableIndex({
            name: 'IDX_task_status',
            columnNames: ['status'],
        }));
        await queryRunner.createIndex('tasks', new TableIndex({
            name: 'IDX_task_assigned_to',
            columnNames: ['assigned_to'],
        }));
        await queryRunner.createIndex('tasks', new TableIndex({
            name: 'IDX_task_process_id',
            columnNames: ['process_id'],
        }));

        // Create indexes for transitions
        await queryRunner.createIndex('transitions', new TableIndex({
            name: 'IDX_transition_tenant_id',
            columnNames: ['tenant_id'],
        }));
        await queryRunner.createIndex('transitions', new TableIndex({
            name: 'IDX_transition_process_id',
            columnNames: ['process_id'],
        }));
        await queryRunner.createIndex('transitions', new TableIndex({
            name: 'IDX_transition_from_task_id',
            columnNames: ['from_task_id'],
        }));
        await queryRunner.createIndex('transitions', new TableIndex({
            name: 'IDX_transition_to_task_id',
            columnNames: ['to_task_id'],
        }));

        // Create indexes for assignments
        await queryRunner.createIndex('assignments', new TableIndex({
            name: 'IDX_assignment_tenant_id',
            columnNames: ['tenant_id'],
        }));
        await queryRunner.createIndex('assignments', new TableIndex({
            name: 'IDX_assignment_task_id',
            columnNames: ['task_id'],
        }));
        await queryRunner.createIndex('assignments', new TableIndex({
            name: 'IDX_assignment_assignee',
            columnNames: ['assignee'],
        }));
        await queryRunner.createIndex('assignments', new TableIndex({
            name: 'IDX_assignment_status',
            columnNames: ['status'],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.dropIndex('assignments', 'IDX_assignment_status');
        await queryRunner.dropIndex('assignments', 'IDX_assignment_assignee');
        await queryRunner.dropIndex('assignments', 'IDX_assignment_task_id');
        await queryRunner.dropIndex('assignments', 'IDX_assignment_tenant_id');

        await queryRunner.dropIndex('transitions', 'IDX_transition_to_task_id');
        await queryRunner.dropIndex('transitions', 'IDX_transition_from_task_id');
        await queryRunner.dropIndex('transitions', 'IDX_transition_process_id');
        await queryRunner.dropIndex('transitions', 'IDX_transition_tenant_id');

        await queryRunner.dropIndex('tasks', 'IDX_task_process_id');
        await queryRunner.dropIndex('tasks', 'IDX_task_assigned_to');
        await queryRunner.dropIndex('tasks', 'IDX_task_status');
        await queryRunner.dropIndex('tasks', 'IDX_task_tenant_id');

        await queryRunner.dropIndex('processes', 'IDX_process_workflow_type');
        await queryRunner.dropIndex('processes', 'IDX_process_status');
        await queryRunner.dropIndex('processes', 'IDX_process_tenant_id');

        // Drop tables
        await queryRunner.dropTable('assignments');
        await queryRunner.dropTable('transitions');
        await queryRunner.dropTable('tasks');
        await queryRunner.dropTable('processes');
    }
}
