import { InputType, Field, PartialType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsJSON, IsBoolean, IsDate } from 'class-validator';

@InputType()
export class CreateWorkflowInput {
  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field()
  @IsString()
  type: string; // approval, purchase_order, payment, etc.

  @Field()
  @IsString()
  templateId: string;

  @Field({ nullable: true })
  @IsJSON()
  @IsOptional()
  variables?: string; // JSON string of workflow variables

  @Field({ nullable: true })
  @IsJSON()
  @IsOptional()
  metadata?: string; // JSON string of metadata

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  entityType?: string; // Type of entity this workflow is for

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  entityId?: string; // ID of entity this workflow is for

  @Field({ defaultValue: 'medium' })
  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority?: string;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @Field({ defaultValue: true })
  @IsBoolean()
  autoStart?: boolean;
}

@InputType()
export class UpdateWorkflowInput extends PartialType(CreateWorkflowInput) {
  @Field({ nullable: true })
  @IsEnum(['draft', 'active', 'paused', 'completed', 'cancelled', 'failed'])
  @IsOptional()
  status?: string;
}

@InputType()
export class WorkflowFilterInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  search?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  type?: string;

  @Field({ nullable: true })
  @IsEnum(['draft', 'active', 'paused', 'completed', 'cancelled', 'failed'])
  @IsOptional()
  status?: string;

  @Field({ nullable: true })
  @IsEnum(['low', 'medium', 'high', 'critical'])
  @IsOptional()
  priority?: string;

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
  startDateFrom?: Date;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  startDateTo?: Date;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  dueDateFrom?: Date;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  dueDateTo?: Date;
}