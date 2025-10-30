import { InputType, Field, PartialType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsJSON, IsBoolean, IsDate, IsUUID } from 'class-validator';

@InputType()
export class CreateTaskInput {
  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field()
  @IsString()
  type: string; // approval, review, data_entry, verification, etc.

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  workflowId?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  assigneeRole?: string; // Role that can handle this task

  @Field({ defaultValue: 'pending' })
  @IsEnum(['pending', 'assigned', 'in_progress', 'completed', 'approved', 'rejected', 'cancelled'])
  status?: string;

  @Field({ defaultValue: 'medium' })
  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority?: string;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @Field({ nullable: true })
  @IsJSON()
  @IsOptional()
  data?: string; // JSON string of task data

  @Field({ nullable: true })
  @IsJSON()
  @IsOptional()
  metadata?: string; // JSON string of metadata

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  entityType?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  entityId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  parentTaskId?: string;

  @Field({ defaultValue: false })
  @IsBoolean()
  requiresApproval?: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  allowDelegation?: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  allowComments?: boolean;
}

@InputType()
export class UpdateTaskInput extends PartialType(CreateTaskInput) {
  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  startedAt?: Date;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  completedAt?: Date;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  result?: string; // JSON string of task result

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  comments?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

@InputType()
export class TaskFilterInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  search?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  type?: string;

  @Field({ nullable: true })
  @IsEnum(['pending', 'assigned', 'in_progress', 'completed', 'approved', 'rejected', 'cancelled'])
  @IsOptional()
  status?: string;

  @Field({ nullable: true })
  @IsEnum(['low', 'medium', 'high', 'critical'])
  @IsOptional()
  priority?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  assigneeRole?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  workflowId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  entityType?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  entityId?: string;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  dueDateFrom?: Date;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  dueDateTo?: Date;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  overdue?: boolean;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean;
}