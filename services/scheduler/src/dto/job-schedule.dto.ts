import { InputType, Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { JobType, JobStatus } from '../entities/job-schedule.entity';

@InputType()
export class CreateJobInput {
  @Field()
  tenantId: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => JobType)
  jobType: JobType;

  @Field({ nullable: true })
  cronExpression?: string;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  endDate?: Date;

  @Field()
  handlerName: string;

  @Field(() => String, { nullable: true })
  jobData?: string; // JSON stringified data

  @Field({ nullable: true })
  timezone?: string;

  @Field()
  createdBy: string;
}

@InputType()
export class UpdateJobInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  cronExpression?: string;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  endDate?: Date;

  @Field(() => String, { nullable: true })
  jobData?: string; // JSON stringified data

  @Field({ nullable: true })
  timezone?: string;

  @Field({ nullable: true })
  updatedBy?: string;
}

@InputType()
export class SearchJobInput {
  @Field()
  tenantId: string;

  @Field({ nullable: true })
  query?: string;

  @Field(() => JobStatus, { nullable: true })
  status?: JobStatus;

  @Field(() => JobType, { nullable: true })
  jobType?: JobType;

  @Field({ nullable: true })
  handlerName?: string;

  @Field(() => Int, { defaultValue: 10 })
  limit?: number;

  @Field(() => Int, { defaultValue: 0 })
  offset?: number;
}

@InputType()
export class ExecuteJobInput {
  @Field()
  jobId: string;

  @Field(() => String, { nullable: true })
  overrideData?: string; // JSON stringified override data
}

@ObjectType()
export class JobScheduleConnection {
  @Field(() => [JobSchedule])
  nodes: JobSchedule[];

  @Field(() => Int)
  totalCount: number;

  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;
}

@ObjectType()
export class JobExecutionResult {
  @Field(() => ID)
  executionId: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  result?: string;

  @Field({ nullable: true })
  error?: string;

  @Field()
  startedAt: Date;

  @Field({ nullable: true })
  completedAt?: Date;
}

// Import JobSchedule type for connection
import { JobSchedule } from '../entities/job-schedule.entity';