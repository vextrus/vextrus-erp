import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, Index, JoinColumn } from 'typeorm';
import { Rule } from './rule.entity';

@Entity('conditions')
@Index('IDX_condition_tenant_id', ['tenantId'])
@Index('IDX_condition_rule_id', ['ruleId'])
@Index('IDX_condition_field_name', ['fieldName'])
export class Condition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'uuid', name: 'rule_id' })
  ruleId: string;

  @Column({ type: 'varchar', length: 255, name: 'field_name' })
  fieldName: string;

  @Column({ type: 'varchar', length: 50 })
  operator: string; // eq, ne, gt, lt, gte, lte, in, not_in, contains, regex

  @Column({ type: 'jsonb' })
  value: any; // Value to compare against

  @Column({ type: 'varchar', length: 50, name: 'data_type' })
  dataType: string; // string, number, boolean, date, array, object

  @Column({ type: 'varchar', length: 20, name: 'logical_operator', nullable: true })
  logicalOperator: string; // AND, OR for combining with next condition

  @Column({ type: 'int', default: 0, name: 'group_number' })
  groupNumber: number; // For grouping conditions

  @Column({ type: 'int', default: 0 })
  sequence: number; // Order of evaluation

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'validation_type' })
  validationType: string; // tin_format, bin_format, nid_format, mobile_format

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'error_message' })
  errorMessage: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'error_message_bn' })
  errorMessageBn: string; // Bengali error message

  @ManyToOne(() => Rule, rule => rule.conditions)
  @JoinColumn({ name: 'rule_id' })
  rule: Rule;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}