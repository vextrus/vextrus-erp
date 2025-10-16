#!/bin/bash
set -e

echo "Generating migrations for workflow and rules-engine services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to create migration for a service
create_migration() {
    local service=$1
    local migration_name=$2
    
    echo -e "${YELLOW}Creating migration for $service service...${NC}"
    
    # Create migrations directory if it doesn't exist
    mkdir -p services/$service/src/migrations
    
    # Generate timestamp
    timestamp=$(date +%Y%m%d%H%M%S)
    
    # Create migration file
    cat > services/$service/src/migrations/${timestamp}-${migration_name}.ts << 'EOF'
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class WorkflowServiceInitial'$timestamp' implements MigrationInterface {
    name = 'WorkflowServiceInitial'$timestamp''

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
        await queryRunner.createIndex('processes', new Index({
            name: 'IDX_process_tenant_id',
            columnNames: ['tenant_id'],
        }));
        await queryRunner.createIndex('processes', new Index({
            name: 'IDX_process_status',
            columnNames: ['status'],
        }));
        await queryRunner.createIndex('processes', new Index({
            name: 'IDX_process_workflow_type',
            columnNames: ['workflow_type'],
        }));

        // Create indexes for tasks
        await queryRunner.createIndex('tasks', new Index({
            name: 'IDX_task_tenant_id',
            columnNames: ['tenant_id'],
        }));
        await queryRunner.createIndex('tasks', new Index({
            name: 'IDX_task_status',
            columnNames: ['status'],
        }));
        await queryRunner.createIndex('tasks', new Index({
            name: 'IDX_task_assigned_to',
            columnNames: ['assigned_to'],
        }));
        await queryRunner.createIndex('tasks', new Index({
            name: 'IDX_task_process_id',
            columnNames: ['process_id'],
        }));

        // Create indexes for transitions
        await queryRunner.createIndex('transitions', new Index({
            name: 'IDX_transition_tenant_id',
            columnNames: ['tenant_id'],
        }));
        await queryRunner.createIndex('transitions', new Index({
            name: 'IDX_transition_process_id',
            columnNames: ['process_id'],
        }));
        await queryRunner.createIndex('transitions', new Index({
            name: 'IDX_transition_from_task_id',
            columnNames: ['from_task_id'],
        }));
        await queryRunner.createIndex('transitions', new Index({
            name: 'IDX_transition_to_task_id',
            columnNames: ['to_task_id'],
        }));

        // Create indexes for assignments
        await queryRunner.createIndex('assignments', new Index({
            name: 'IDX_assignment_tenant_id',
            columnNames: ['tenant_id'],
        }));
        await queryRunner.createIndex('assignments', new Index({
            name: 'IDX_assignment_task_id',
            columnNames: ['task_id'],
        }));
        await queryRunner.createIndex('assignments', new Index({
            name: 'IDX_assignment_assignee',
            columnNames: ['assignee'],
        }));
        await queryRunner.createIndex('assignments', new Index({
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
EOF
    
    # Replace 'WorkflowServiceInitial' with service-specific name for rules-engine
    if [ "$service" == "rules-engine" ]; then
        sed -i "s/WorkflowServiceInitial/RulesEngineServiceInitial/g" services/$service/src/migrations/${timestamp}-${migration_name}.ts
        
        # Replace workflow tables with rules-engine tables
        cat > services/$service/src/migrations/${timestamp}-${migration_name}.ts << 'EOF'
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class RulesEngineServiceInitial'$timestamp' implements MigrationInterface {
    name = 'RulesEngineServiceInitial'$timestamp''

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
        await queryRunner.createIndex('rules', new Index({
            name: 'IDX_rule_tenant_id',
            columnNames: ['tenant_id'],
        }));
        await queryRunner.createIndex('rules', new Index({
            name: 'IDX_rule_category',
            columnNames: ['category'],
        }));
        await queryRunner.createIndex('rules', new Index({
            name: 'IDX_rule_is_active',
            columnNames: ['is_active'],
        }));
        await queryRunner.createIndex('rules', new Index({
            name: 'IDX_rule_priority',
            columnNames: ['priority'],
        }));

        // Create indexes for conditions
        await queryRunner.createIndex('conditions', new Index({
            name: 'IDX_condition_tenant_id',
            columnNames: ['tenant_id'],
        }));
        await queryRunner.createIndex('conditions', new Index({
            name: 'IDX_condition_rule_id',
            columnNames: ['rule_id'],
        }));
        await queryRunner.createIndex('conditions', new Index({
            name: 'IDX_condition_field_name',
            columnNames: ['field_name'],
        }));

        // Create indexes for actions
        await queryRunner.createIndex('actions', new Index({
            name: 'IDX_action_tenant_id',
            columnNames: ['tenant_id'],
        }));
        await queryRunner.createIndex('actions', new Index({
            name: 'IDX_action_rule_id',
            columnNames: ['rule_id'],
        }));
        await queryRunner.createIndex('actions', new Index({
            name: 'IDX_action_action_type',
            columnNames: ['action_type'],
        }));

        // Create indexes for evaluations
        await queryRunner.createIndex('evaluations', new Index({
            name: 'IDX_evaluation_tenant_id',
            columnNames: ['tenant_id'],
        }));
        await queryRunner.createIndex('evaluations', new Index({
            name: 'IDX_evaluation_rule_id',
            columnNames: ['rule_id'],
        }));
        await queryRunner.createIndex('evaluations', new Index({
            name: 'IDX_evaluation_status',
            columnNames: ['status'],
        }));
        await queryRunner.createIndex('evaluations', new Index({
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
EOF
    fi
    
    echo -e "${GREEN}✓ Created migration for $service service${NC}"
}

# Generate migrations
create_migration "workflow" "WorkflowServiceInitial"
create_migration "rules-engine" "RulesEngineServiceInitial"

echo -e "\n${GREEN}✓ All migrations created successfully!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Review the generated migration files"
echo "2. Update TypeORM configuration if needed"
echo "3. Run migrations with: npm run migration:run"
echo "4. Test with docker-compose up"