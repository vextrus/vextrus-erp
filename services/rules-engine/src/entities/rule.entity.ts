import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Condition } from './condition.entity';
import { Action } from './action.entity';
import { Evaluation } from './evaluation.entity';

@Entity('rules')
@Index('IDX_rule_tenant_id', ['tenantId'])
@Index('IDX_rule_category', ['category'])
@Index('IDX_rule_is_active', ['isActive'])
@Index('IDX_rule_priority', ['priority'])
export class Rule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  category: string; // financial, inventory, compliance, approval, validation

  @Column({ type: 'varchar', length: 100, name: 'rule_type' })
  ruleType: string; // validation, calculation, workflow, notification

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  context: Record<string, any>; // Context variables for rule execution

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true, name: 'effective_from' })
  effectiveFrom: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'effective_to' })
  effectiveTo: Date;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'regulatory_reference' })
  regulatoryReference: string; // NBR, RAJUK, BIDA reference

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'vat_rate' })
  vatRate: number; // For VAT calculation rules (15% standard in Bangladesh)

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'fiscal_year_type' })
  fiscalYearType: string; // July-June for Bangladesh

  @Column({ type: 'jsonb', nullable: true, name: 'threshold_values' })
  thresholdValues: Record<string, any>; // Amount limits in BDT

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'created_by' })
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'updated_by' })
  updatedBy: string;

  @OneToMany(() => Condition, condition => condition.rule)
  conditions: Condition[];

  @OneToMany(() => Action, action => action.rule)
  actions: Action[];

  @OneToMany(() => Evaluation, evaluation => evaluation.rule)
  evaluations: Evaluation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'int', default: 1 })
  version: number;
}