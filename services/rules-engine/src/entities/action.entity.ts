import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, Index, JoinColumn } from 'typeorm';
import { Rule } from './rule.entity';

@Entity('actions')
@Index('IDX_action_tenant_id', ['tenantId'])
@Index('IDX_action_rule_id', ['ruleId'])
@Index('IDX_action_action_type', ['actionType'])
export class Action {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'uuid', name: 'rule_id' })
  ruleId: string;

  @Column({ type: 'varchar', length: 100, name: 'action_type' })
  actionType: string; // calculate, validate, notify, trigger_workflow, update_field, api_call

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  parameters: Record<string, any>; // Action-specific parameters

  @Column({ type: 'int', default: 0 })
  sequence: number; // Order of execution

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'boolean', default: false, name: 'stop_on_failure' })
  stopOnFailure: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'target_field' })
  targetField: string; // Field to update for update_field actions

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'target_service' })
  targetService: string; // Service to call for api_call actions

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'target_endpoint' })
  targetEndpoint: string; // Endpoint for api_call actions

  @Column({ type: 'jsonb', nullable: true, name: 'calculation_formula' })
  calculationFormula: Record<string, any>; // For calculate actions

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'notification_channel' })
  notificationChannel: string; // email, sms, push for Bangladesh context

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'sms_gateway' })
  smsGateway: string; // Banglalink, Grameenphone, Robi

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'vat_percentage' })
  vatPercentage: number; // For VAT calculation actions

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'currency' })
  currency: string; // BDT for Bangladesh Taka

  @ManyToOne(() => Rule, rule => rule.actions)
  @JoinColumn({ name: 'rule_id' })
  rule: Rule;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}