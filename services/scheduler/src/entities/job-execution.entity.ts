import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { JobSchedule } from './job-schedule.entity';

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
  RETRYING = 'retrying',
}

@Entity('job_executions')
@Index(['job_schedule_id', 'status'])
@Index(['tenant_id', 'created_at'])
@Index(['status', 'created_at'])
export class JobExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenant_id: string;

  @Column()
  job_schedule_id: string;

  @ManyToOne(() => JobSchedule, (schedule) => schedule.executions)
  @JoinColumn({ name: 'job_schedule_id' })
  job_schedule: JobSchedule;

  @Column({
    type: 'enum',
    enum: ExecutionStatus,
    default: ExecutionStatus.PENDING,
  })
  status: ExecutionStatus;

  @Column({ type: 'timestamptz', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date;

  @Column({ nullable: true })
  duration_ms: number;

  @Column({ type: 'jsonb', nullable: true })
  input_data: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  output_data: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ type: 'text', nullable: true })
  error_stack: string;

  @Column({ default: 0 })
  retry_count: number;

  @Column({ default: 0 })
  max_retries: number;

  @Column({ nullable: true })
  worker_id: string;

  @Column({ type: 'jsonb', nullable: true })
  performance_metrics: {
    cpu_usage?: number;
    memory_usage?: number;
    execution_time?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}