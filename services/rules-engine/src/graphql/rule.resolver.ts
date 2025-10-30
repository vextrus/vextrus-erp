import { Resolver, Query, Mutation, Args, ID, ResolveReference } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RulesService } from '../services/rules.service';
import { EngineService } from '../services/engine.service';
import { JwtAuthGuard, TenantContext, CurrentTenant } from '../auth';
import { CreateRuleInput, UpdateRuleInput, RuleFilterInput, EvaluateRuleInput } from './dto/rule.input';
import { RuleResponse, PaginatedRuleResponse, RuleEvaluationResponse } from './dto/rule.response';

@Resolver(() => RuleResponse)
export class RuleResolver {
  constructor(
    private readonly rulesService: RulesService,
    private readonly engineService: EngineService,
  ) {}

  @ResolveReference()
  async resolveReference(reference: { __typename: string; id: string }): Promise<RuleResponse> {
    // For federation, we need to bypass tenant context
    // The reference.id should be sufficient to identify the entity uniquely
    return this.rulesService.findOne(null, reference.id);
  }

  @Query(() => PaginatedRuleResponse, { name: 'rules' })
  @UseGuards(JwtAuthGuard)
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Args('filter', { nullable: true }) filter?: RuleFilterInput,
    @Args('page', { type: () => Number, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Number, defaultValue: 20 }) limit?: number,
  ): Promise<PaginatedRuleResponse> {
    return this.rulesService.findAll(tenant.id, {
      ...filter,
      page,
      limit,
    });
  }

  @Query(() => RuleResponse, { name: 'rule' })
  @UseGuards(JwtAuthGuard)
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<RuleResponse> {
    return this.rulesService.findOne(tenant.id, id);
  }

  @Query(() => [RuleResponse], { name: 'rulesByCategory' })
  @UseGuards(JwtAuthGuard)
  async findByCategory(
    @CurrentTenant() tenant: TenantContext,
    @Args('category') category: string,
  ): Promise<RuleResponse[]> {
    return this.rulesService.findByCategory(tenant.id, category);
  }

  @Query(() => [RuleResponse], { name: 'rulesByEntity' })
  @UseGuards(JwtAuthGuard)
  async findByEntity(
    @CurrentTenant() tenant: TenantContext,
    @Args('entityType') entityType: string,
  ): Promise<RuleResponse[]> {
    return this.rulesService.findByEntity(tenant.id, entityType);
  }

  @Mutation(() => RuleResponse, { name: 'createRule' })
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Args('input') input: CreateRuleInput,
  ): Promise<RuleResponse> {
    return this.rulesService.create(tenant.id, input);
  }

  @Mutation(() => RuleResponse, { name: 'updateRule' })
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateRuleInput,
  ): Promise<RuleResponse> {
    return this.rulesService.update(tenant.id, id, input);
  }

  @Mutation(() => RuleResponse, { name: 'activateRule' })
  @UseGuards(JwtAuthGuard)
  async activate(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<RuleResponse> {
    return this.rulesService.activate(tenant.id, id);
  }

  @Mutation(() => RuleResponse, { name: 'deactivateRule' })
  @UseGuards(JwtAuthGuard)
  async deactivate(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<RuleResponse> {
    return this.rulesService.deactivate(tenant.id, id);
  }

  @Mutation(() => RuleEvaluationResponse, { name: 'evaluateRule' })
  @UseGuards(JwtAuthGuard)
  async evaluate(
    @CurrentTenant() tenant: TenantContext,
    @Args('input') input: EvaluateRuleInput,
  ): Promise<RuleEvaluationResponse> {
    const context = input.context ? JSON.parse(input.context) : {};
    return this.rulesService.evaluate(tenant.id, input.ruleId, context);
  }

  @Mutation(() => RuleEvaluationResponse, { name: 'evaluateRuleSet' })
  @UseGuards(JwtAuthGuard)
  async evaluateRuleSet(
    @CurrentTenant() tenant: TenantContext,
    @Args('category') category: string,
    @Args('context') context: string, // JSON string
  ): Promise<RuleEvaluationResponse> {
    const parsedContext = JSON.parse(context);
    const rules = await this.rulesService.findByCategory(tenant.id, category);
    const now = new Date();

    // Evaluate all rules in the category
    const results = await Promise.all(
      rules.map(rule => this.rulesService.evaluate(tenant.id, rule.id, parsedContext))
    );

    const passed = results.every(r => r.passed);
    const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0);

    return {
      success: true,
      passed,
      message: passed ? 'All rules passed' : 'Some rules failed',
      errors: null,
      warnings: null,
      result: JSON.stringify(results),
      appliedRules: JSON.stringify(rules.map(r => r.id)),
      failedRules: JSON.stringify(rules.filter((r, i) => !results[i].passed).map(r => r.id)),
      actions: null,
      executionTime: totalTime,
      timestamp: now,
      context: context,
      metadata: JSON.stringify({ category }),
    };
  }

  @Query(() => Boolean, { name: 'validateRuleExpression' })
  @UseGuards(JwtAuthGuard)
  async validateExpression(
    @Args('expression') expression: string,
  ): Promise<boolean> {
    // Basic validation - check for dangerous patterns
    const dangerousPatterns = [/eval\s*\(/, /Function\s*\(/, /require\s*\(/, /import\s*\(/];
    const isValid = !dangerousPatterns.some(pattern => pattern.test(expression));
    return isValid && expression.length > 0 && expression.length < 1000;
  }

  @Mutation(() => Boolean, { name: 'deleteRule' })
  @UseGuards(JwtAuthGuard)
  async remove(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.rulesService.remove(tenant.id, id);
    return true;
  }

  @Query(() => [RuleResponse], { name: 'applicableRules' })
  @UseGuards(JwtAuthGuard)
  async getApplicableRules(
    @CurrentTenant() tenant: TenantContext,
    @Args('entityType') entityType: string,
    @Args('action') action: string,
  ): Promise<RuleResponse[]> {
    return this.rulesService.getApplicableRules(tenant.id, entityType, action);
  }
}