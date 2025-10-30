import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsJSON, IsBoolean, IsNumber, Min, Max } from 'class-validator';

@InputType()
export class CreateRuleInput {
  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field()
  @IsString()
  category: string; // finance, hr, inventory, compliance, etc.

  @Field()
  @IsString()
  entityType: string; // invoice, purchase_order, employee, product, etc.

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  action?: string; // create, update, delete, approve, etc.

  @Field()
  @IsString()
  expression: string; // Rule expression (e.g., "amount > 100000")

  @Field({ nullable: true })
  @IsJSON()
  @IsOptional()
  conditions?: string; // JSON string of complex conditions

  @Field({ nullable: true })
  @IsJSON()
  @IsOptional()
  actions?: string; // JSON string of actions to take when rule matches

  @Field(() => Int, { defaultValue: 100 })
  @IsNumber()
  @Min(1)
  @Max(1000)
  priority?: number; // Lower number = higher priority

  @Field({ defaultValue: 'active' })
  @IsEnum(['draft', 'active', 'inactive', 'archived'])
  status?: string;

  @Field({ defaultValue: 'all' })
  @IsEnum(['all', 'any', 'none'])
  operator?: string; // How to combine multiple conditions

  @Field({ defaultValue: 'blocking' })
  @IsEnum(['blocking', 'warning', 'info'])
  severity?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  errorMessage?: string; // Custom error message when rule fails

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  successMessage?: string; // Custom success message when rule passes

  @Field({ defaultValue: false })
  @IsBoolean()
  isSystemRule?: boolean; // System rules cannot be deleted

  @Field({ defaultValue: true })
  @IsBoolean()
  isActive?: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  requiresApproval?: boolean; // If true, requires approval when triggered

  @Field({ nullable: true })
  @IsJSON()
  @IsOptional()
  metadata?: string; // JSON string of additional metadata

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  tags?: string; // Comma-separated tags for categorization
}

@InputType()
export class UpdateRuleInput extends PartialType(CreateRuleInput) {}

@InputType()
export class RuleFilterInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  search?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  category?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  entityType?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  action?: string;

  @Field({ nullable: true })
  @IsEnum(['draft', 'active', 'inactive', 'archived'])
  @IsOptional()
  status?: string;

  @Field({ nullable: true })
  @IsEnum(['blocking', 'warning', 'info'])
  @IsOptional()
  severity?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isSystemRule?: boolean;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  tags?: string;
}

@InputType()
export class EvaluateRuleInput {
  @Field()
  @IsString()
  ruleId: string;

  @Field()
  @IsJSON()
  context: string; // JSON string of evaluation context
}