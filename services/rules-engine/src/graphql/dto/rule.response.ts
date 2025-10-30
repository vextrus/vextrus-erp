import { ObjectType, Field, ID, Int, Float, Directive } from '@nestjs/graphql';

@ObjectType()
@Directive('@key(fields: "id")')
export class RuleResponse {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  category: string;

  @Field()
  entityType: string;

  @Field({ nullable: true })
  action?: string;

  @Field()
  expression: string;

  @Field({ nullable: true })
  conditions?: string; // JSON string

  @Field({ nullable: true })
  actions?: string; // JSON string

  @Field(() => Int)
  priority: number;

  @Field()
  status: string;

  @Field()
  operator: string;

  @Field()
  severity: string;

  @Field({ nullable: true })
  errorMessage?: string;

  @Field({ nullable: true })
  successMessage?: string;

  @Field()
  isSystemRule: boolean;

  @Field()
  isActive: boolean;

  @Field()
  requiresApproval: boolean;

  @Field({ nullable: true })
  metadata?: string; // JSON string

  @Field({ nullable: true })
  tags?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  createdBy?: string;

  @Field({ nullable: true })
  updatedBy?: string;

  @Field(() => Int)
  executionCount: number;

  @Field(() => Int)
  successCount: number;

  @Field(() => Int)
  failureCount: number;

  @Field({ nullable: true })
  lastExecutedAt?: Date;

  @Field(() => Float)
  averageExecutionTime: number; // in milliseconds
}

@ObjectType()
export class PaginatedRuleResponse {
  @Field(() => [RuleResponse])
  items: RuleResponse[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}

@ObjectType()
export class RuleEvaluationResponse {
  @Field()
  success: boolean;

  @Field()
  passed: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field({ nullable: true })
  errors?: string; // JSON array string

  @Field({ nullable: true })
  warnings?: string; // JSON array string

  @Field({ nullable: true })
  result?: string; // JSON string of evaluation result

  @Field({ nullable: true })
  appliedRules?: string; // JSON array of applied rule IDs

  @Field({ nullable: true })
  failedRules?: string; // JSON array of failed rule IDs

  @Field({ nullable: true })
  actions?: string; // JSON array of actions to execute

  @Field(() => Float)
  executionTime: number; // in milliseconds

  @Field()
  timestamp: Date;

  @Field({ nullable: true })
  context?: string; // JSON string of evaluation context

  @Field({ nullable: true })
  metadata?: string; // JSON string of additional metadata
}