import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, Index, JoinColumn } from 'typeorm';
import { Rule } from './rule.entity';

@Entity('evaluations')
@Index('IDX_evaluation_tenant_id', ['tenantId'])
@Index('IDX_evaluation_rule_id', ['ruleId'])
@Index('IDX_evaluation_status', ['status'])
@Index('IDX_evaluation_entity_type_entity_id', ['entityType', 'entityId'])
export class Evaluation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'uuid', name: 'rule_id' })
  ruleId: string;

  @Column({ type: 'varchar', length: 100, name: 'entity_type' })
  entityType: string; // invoice, purchase_order, payment, customer, vendor

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId: string;

  @Column({ type: 'varchar', length: 50 })
  status: string; // pending, in_progress, passed, failed, error

  @Column({ type: 'boolean', nullable: true })
  result: boolean; // True if all conditions passed

  @Column({ type: 'jsonb', name: 'input_data' })
  inputData: Record<string, any>; // Data evaluated against

  @Column({ type: 'jsonb', nullable: true, name: 'output_data' })
  outputData: Record<string, any>; // Results of actions

  @Column({ type: 'jsonb', nullable: true, name: 'condition_results' })
  conditionResults: Array<{
    conditionId: string;
    passed: boolean;
    actualValue: any;
    expectedValue: any;
  }>;

  @Column({ type: 'jsonb', nullable: true, name: 'action_results' })
  actionResults: Array<{
    actionId: string;
    success: boolean;
    result: any;
    error?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true, name: 'error_details' })
  errorDetails: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'triggered_by' })
  triggeredBy: string; // User or system that triggered evaluation

  @Column({ type: 'timestamp', name: 'evaluated_at' })
  evaluatedAt: Date;

  @Column({ type: 'int', nullable: true, name: 'execution_time_ms' })
  executionTimeMs: number; // Performance tracking

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'business_context' })
  businessContext: string; // sales, purchase, finance, inventory

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'amount_bdt' })
  amountBdt: number; // Transaction amount in Bangladesh Taka

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'tin_number' })
  tinNumber: string; // Tax Identification Number if relevant

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'bin_number' })
  binNumber: string; // Business Identification Number if relevant

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Rule, rule => rule.evaluations)
  @JoinColumn({ name: 'rule_id' })
  rule: Rule;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}