import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ObjectType, Field, ID, Int, registerEnumType, Directive } from '@nestjs/graphql';
import { JobExecution } from './job-execution.entity';

export enum JobType {
  CRON = 'cron',
  ONE_TIME = 'one_time',
  INTERVAL = 'interval',
}

export enum JobStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  DISABLED = 'disabled',
  COMPLETED = 'completed',
}

// Register enums for GraphQL
registerEnumType(JobType, {
  name: 'JobType',
  description: 'The type of scheduled job',
});

registerEnumType(JobStatus, {
  name: 'JobStatus',
  description: 'The status of a scheduled job',
});

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('job_schedules')
@Index(['tenant_id', 'status'])
@Index(['next_run_at'])
@Index(['job_type', 'status'])
export class JobSchedule {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  @Index()
  tenant_id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field(() => JobType)
  @Column({
    type: 'enum',
    enum: JobType,
    default: JobType.CRON,
  })
  job_type: JobType;

  @Field({ nullable: true })
  @Column({ nullable: true })
  cron_expression: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  start_date: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  end_date: Date;

  @Column({ type: 'jsonb', nullable: true })
  job_data: Record<string, any>;

  @Field()
  @Column()
  handler_name: string;

  @Column({ type: 'jsonb', nullable: true })
  retry_config: {
    max_attempts?: number;
    backoff_delay?: number;
    backoff_type?: 'fixed' | 'exponential';
  };

  @Field(() => JobStatus)
  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.ACTIVE,
  })
  status: JobStatus;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  next_run_at: Date | null;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  last_run_at: Date | null;

  @Field(() => Int)
  @Column({ default: 0 })
  execution_count: number;

  @Field(() => Int)
  @Column({ default: 0 })
  failure_count: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  timezone: string;

  @Column({ type: 'jsonb', nullable: true })
  notification_config: {
    on_success?: string[];
    on_failure?: string[];
    channels?: ('email' | 'sms' | 'push')[];
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  created_by: string;

  @Column({ nullable: true })
  updated_by: string;

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => JobExecution, (execution) => execution.job_schedule)
  executions: JobExecution[];
}