import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, Index, JoinColumn } from 'typeorm';
import { Process } from './process.entity';
import { Task } from './task.entity';

@Entity('transitions')
@Index('IDX_transition_tenant_id', ['tenantId'])
@Index('IDX_transition_process_id', ['processId'])
@Index('IDX_transition_from_task_id', ['fromTaskId'])
@Index('IDX_transition_to_task_id', ['toTaskId'])
export class Transition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'uuid', name: 'process_id' })
  processId: string;

  @Column({ type: 'uuid', nullable: true, name: 'from_task_id' })
  fromTaskId: string;

  @Column({ type: 'uuid', nullable: true, name: 'to_task_id' })
  toTaskId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, name: 'transition_type' })
  transitionType: string; // sequence, conditional, parallel, exclusive

  @Column({ type: 'jsonb', nullable: true })
  condition: Record<string, any>; // Condition for conditional transitions

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'triggered_by' })
  triggeredBy: string;

  @Column({ type: 'timestamp', nullable: true, name: 'triggered_at' })
  triggeredAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'trigger_event' })
  triggerEvent: string;

  @Column({ type: 'jsonb', nullable: true, name: 'trigger_data' })
  triggerData: Record<string, any>;

  @ManyToOne(() => Process, process => process.transitions)
  @JoinColumn({ name: 'process_id' })
  process: Process;

  @ManyToOne(() => Task, task => task.outgoingTransitions)
  @JoinColumn({ name: 'from_task_id' })
  fromTask: Task;

  @ManyToOne(() => Task, task => task.incomingTransitions)
  @JoinColumn({ name: 'to_task_id' })
  toTask: Task;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}