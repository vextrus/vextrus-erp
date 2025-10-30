import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Index, JoinColumn } from 'typeorm';
import { Process } from './process.entity';
import { Assignment } from './assignment.entity';
import { Transition } from './transition.entity';

@Entity('tasks')
@Index('IDX_task_tenant_id', ['tenantId'])
@Index('IDX_task_status', ['status'])
@Index('IDX_task_assigned_to', ['assignedTo'])
@Index('IDX_task_process_id', ['processId'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'uuid', name: 'process_id' })
  processId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, name: 'task_type' })
  taskType: string; // user_task, service_task, script_task, manual_task

  @Column({ type: 'varchar', length: 50 })
  status: string; // created, ready, reserved, in_progress, completed, failed, skipped

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'assigned_to' })
  assignedTo: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'assigned_group' })
  assignedGroup: string;

  @Column({ type: 'jsonb', nullable: true, name: 'form_data' })
  formData: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  variables: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true, name: 'due_date' })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'completed_by' })
  completedBy: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'completion_reason' })
  completionReason: string;

  @Column({ type: 'boolean', default: false, name: 'is_sequential' })
  isSequential: boolean;

  @Column({ type: 'boolean', default: false, name: 'requires_approval' })
  requiresApproval: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'approval_level' })
  approvalLevel: string; // For hierarchical approvals in Bangladesh business context

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'amount_limit' })
  amountLimit: number; // BDT amount limits for approval tasks

  @ManyToOne(() => Process, process => process.tasks)
  @JoinColumn({ name: 'process_id' })
  process: Process;

  @OneToMany(() => Assignment, assignment => assignment.task)
  assignments: Assignment[];

  @OneToMany(() => Transition, transition => transition.fromTask)
  outgoingTransitions: Transition[];

  @OneToMany(() => Transition, transition => transition.toTask)
  incomingTransitions: Transition[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'int', default: 1 })
  version: number;
}