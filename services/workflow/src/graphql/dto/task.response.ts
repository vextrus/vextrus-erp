import { ObjectType, Field, ID, Int, Directive } from '@nestjs/graphql';

@ObjectType()
@Directive('@key(fields: "id")')
export class TaskResponse {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  type: string;

  @Field({ nullable: true })
  workflowId?: string;

  @Field({ nullable: true })
  assigneeId?: string;

  @Field({ nullable: true })
  assigneeRole?: string;

  @Field()
  status: string;

  @Field()
  priority: string;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field({ nullable: true })
  data?: string; // JSON string

  @Field({ nullable: true })
  metadata?: string; // JSON string

  @Field({ nullable: true })
  entityType?: string;

  @Field({ nullable: true })
  entityId?: string;

  @Field({ nullable: true })
  parentTaskId?: string;

  @Field()
  requiresApproval: boolean;

  @Field()
  allowDelegation: boolean;

  @Field()
  allowComments: boolean;

  @Field({ nullable: true })
  startedAt?: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field({ nullable: true })
  result?: string; // JSON string

  @Field({ nullable: true })
  comments?: string;

  @Field({ nullable: true })
  rejectionReason?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  createdBy?: string;

  @Field({ nullable: true })
  updatedBy?: string;

  @Field({ nullable: true })
  approvedBy?: string;

  @Field({ nullable: true })
  approvedAt?: Date;

  @Field({ nullable: true })
  rejectedBy?: string;

  @Field({ nullable: true })
  rejectedAt?: Date;

  @Field()
  isOverdue: boolean;

  @Field(() => Int)
  completionPercentage: number;
}

@ObjectType()
export class PaginatedTaskResponse {
  @Field(() => [TaskResponse])
  items: TaskResponse[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}