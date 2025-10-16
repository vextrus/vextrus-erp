import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { AuditEventType, AuditSeverity } from './audit-log.entity';

export enum RuleAction {
  ALERT = 'alert',
  BLOCK = 'block',
  LOG = 'log',
  NOTIFY = 'notify',
  ESCALATE = 'escalate',
  QUARANTINE = 'quarantine',
}

export enum RuleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TESTING = 'testing',
  DISABLED = 'disabled',
}

@Entity('audit_rules')
@Index(['tenant_id', 'status'])
@Index(['rule_type', 'status'])
export class AuditRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  tenant_id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  rule_type: string;

  @Column({
    type: 'enum',
    enum: RuleStatus,
    default: RuleStatus.ACTIVE,
  })
  status: RuleStatus;

  @Column({ type: 'jsonb' })
  conditions: {
    event_types?: AuditEventType[];
    severity_levels?: AuditSeverity[];
    users?: string[];
    roles?: string[];
    resources?: string[];
    ip_ranges?: string[];
    time_windows?: {
      start: string;
      end: string;
      days?: string[];
    }[];
    threshold?: {
      count: number;
      duration_minutes: number;
    };
    patterns?: {
      field: string;
      operator: string;
      value: any;
    }[];
  };

  @Column({ type: 'jsonb' })
  actions: {
    type: RuleAction;
    config: {
      notification_channels?: string[];
      email_recipients?: string[];
      webhook_urls?: string[];
      block_duration_minutes?: number;
      escalation_level?: number;
      custom_message?: string;
    };
  }[];

  @Column({ type: 'integer', default: 0 })
  priority: number;

  @Column({ type: 'boolean', default: true })
  is_enabled: boolean;

  @Column({ type: 'boolean', default: false })
  is_system_rule: boolean;

  @Column({ type: 'jsonb', nullable: true })
  statistics: {
    total_matches?: number;
    last_match_at?: Date;
    false_positives?: number;
    true_positives?: number;
    last_reviewed_at?: Date;
  };

  @Column({ type: 'timestamp', nullable: true })
  last_triggered_at: Date;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @Column({ type: 'uuid', nullable: true })
  updated_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}