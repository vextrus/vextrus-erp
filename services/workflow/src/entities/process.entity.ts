import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Index, JoinColumn } from 'typeorm';
import { Task } from './task.entity';
import { Transition } from './transition.entity';

@Entity('processes')
@Index('IDX_process_tenant_id', ['tenantId'])
@Index('IDX_process_status', ['status'])
@Index('IDX_process_workflow_type', ['workflowType'])
export class Process {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, name: 'workflow_type' })
  workflowType: string;

  @Column({ type: 'varchar', length: 50 })
  status: string; // draft, active, completed, cancelled, failed

  @Column({ type: 'jsonb', nullable: true })
  variables: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid', nullable: true, name: 'parent_process_id' })
  parentProcessId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'business_key' })
  businessKey: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'initiated_by' })
  initiatedBy: string;

  @Column({ type: 'timestamp', nullable: true, name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'due_date' })
  dueDate: Date;

  @Column({ type: 'int', default: 0, name: 'priority' })
  priority: number;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'approval_status' })
  approvalStatus: string; // For Bangladesh regulatory approvals

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'regulatory_type' })
  regulatoryType: string; // NBR, RAJUK, etc.

  @OneToMany(() => Task, task => task.process)
  tasks: Task[];

  @OneToMany(() => Transition, transition => transition.process)
  transitions: Transition[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'int', default: 1 })
  version: number;
}