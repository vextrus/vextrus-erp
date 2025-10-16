import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { AuditEventType, AuditSeverity } from './audit-log.entity';

export enum RetentionAction {
  DELETE = 'delete',
  ARCHIVE = 'archive',
  COMPRESS = 'compress',
  EXPORT = 'export',
}

export enum RetentionScope {
  GLOBAL = 'global',
  TENANT = 'tenant',
  EVENT_TYPE = 'event_type',
  COMPLIANCE = 'compliance',
}

@Entity('retention_policies')
@Index(['tenant_id', 'is_active'])
@Index(['scope', 'is_active'])
export class RetentionPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  tenant_id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: RetentionScope,
    default: RetentionScope.TENANT,
  })
  scope: RetentionScope;

  @Column({ type: 'jsonb' })
  criteria: {
    event_types?: AuditEventType[];
    severity_levels?: AuditSeverity[];
    compliance_types?: string[];
    data_classifications?: string[];
    services?: string[];
    custom_filters?: {
      field: string;
      operator: string;
      value: any;
    }[];
  };

  @Column({ type: 'jsonb' })
  retention_rules: {
    standard: {
      duration_days: number;
      action: RetentionAction;
    };
    compliance?: {
      regulation: string;
      duration_days: number;
      action: RetentionAction;
    }[];
    legal_hold?: {
      active: boolean;
      reason: string;
      until_date?: Date;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  archive_config: {
    destination?: string;
    compression?: boolean;
    encryption?: boolean;
    format?: string;
    schedule?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  export_config: {
    format?: string;
    destination?: string;
    include_metadata?: boolean;
    encrypt?: boolean;
    notification_emails?: string[];
  };

  @Column({ type: 'integer', default: 0 })
  priority: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_default: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_applied_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  execution_stats: {
    total_processed?: number;
    total_archived?: number;
    total_deleted?: number;
    last_run_duration_ms?: number;
    next_run_at?: Date;
  };

  @Column({ type: 'varchar', length: 50, nullable: true })
  schedule_cron: string;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @Column({ type: 'uuid', nullable: true })
  updated_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}