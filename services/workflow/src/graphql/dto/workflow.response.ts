import { ObjectType, Field, ID, Int, Directive } from '@nestjs/graphql';

@ObjectType()
@Directive('@key(fields: "id")')
export class WorkflowResponse {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  type: string;

  @Field()
  templateId: string;

  @Field()
  status: string;

  @Field()
  priority: string;

  @Field({ nullable: true })
  entityType?: string;

  @Field({ nullable: true })
  entityId?: string;

  @Field({ nullable: true })
  variables?: string; // JSON string

  @Field({ nullable: true })
  metadata?: string; // JSON string

  @Field({ nullable: true })
  startedAt?: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  createdBy?: string;

  @Field({ nullable: true })
  updatedBy?: string;

  @Field(() => Int)
  currentStep: number;

  @Field(() => Int)
  totalSteps: number;

  @Field({ nullable: true })
  error?: string;

  @Field({ nullable: true })
  temporalWorkflowId?: string;

  @Field({ nullable: true })
  temporalRunId?: string;
}

@ObjectType()
export class PaginatedWorkflowResponse {
  @Field(() => [WorkflowResponse])
  items: WorkflowResponse[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}