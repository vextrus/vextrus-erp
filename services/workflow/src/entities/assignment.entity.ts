import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, Index, JoinColumn } from 'typeorm';
import { Task } from './task.entity';

@Entity('assignments')
@Index('IDX_assignment_tenant_id', ['tenantId'])
@Index('IDX_assignment_task_id', ['taskId'])
@Index('IDX_assignment_assignee', ['assignee'])
@Index('IDX_assignment_status', ['status'])
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'uuid', name: 'task_id' })
  taskId: string;

  @Column({ type: 'varchar', length: 255 })
  assignee: string; // User ID or group name

  @Column({ type: 'varchar', length: 50, name: 'assignment_type' })
  assignmentType: string; // user, group, role

  @Column({ type: 'varchar', length: 50 })
  status: string; // pending, accepted, rejected, delegated, completed

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'assigned_by' })
  assignedBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'delegated_to' })
  delegatedTo: string;

  @Column({ type: 'timestamp', nullable: true, name: 'delegated_at' })
  delegatedAt: Date;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true, name: 'accepted_at' })
  acceptedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'boolean', default: false, name: 'is_escalated' })
  isEscalated: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'escalation_date' })
  escalationDate: Date;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'department' })
  department: string; // For Bangladesh organizational structure

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'designation' })
  designation: string; // Job title in Bangladesh context

  @ManyToOne(() => Task, task => task.assignments)
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}