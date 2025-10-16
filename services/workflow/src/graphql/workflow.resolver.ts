import { Resolver, Query, Mutation, Args, ID, ResolveReference } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { WorkflowService } from '../services/workflow.service';
import { JwtAuthGuard, TenantContext, CurrentTenant } from '../auth';
import { CreateWorkflowInput, UpdateWorkflowInput, WorkflowFilterInput } from './dto/workflow.input';
import { WorkflowResponse, PaginatedWorkflowResponse } from './dto/workflow.response';

@Resolver(() => WorkflowResponse)
@UseGuards(JwtAuthGuard)
export class WorkflowResolver {
  constructor(private readonly workflowService: WorkflowService) {}

  @ResolveReference()
  async resolveReference(reference: { __typename: string; id: string }): Promise<WorkflowResponse> {
    // For federation, we need to bypass tenant context
    // The reference.id should be sufficient to identify the entity uniquely
    return this.workflowService.findOne(null, reference.id);
  }

  @Query(() => PaginatedWorkflowResponse, { name: 'workflows' })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Args('filter', { nullable: true }) filter?: WorkflowFilterInput,
    @Args('page', { type: () => Number, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Number, defaultValue: 20 }) limit?: number,
  ): Promise<PaginatedWorkflowResponse> {
    return this.workflowService.findAll(tenant.id, {
      ...filter,
      page,
      limit,
    });
  }

  @Query(() => WorkflowResponse, { name: 'workflow' })
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<WorkflowResponse> {
    return this.workflowService.findOne(tenant.id, id);
  }

  @Query(() => [WorkflowResponse], { name: 'workflowsByStatus' })
  async findByStatus(
    @CurrentTenant() tenant: TenantContext,
    @Args('status') status: string,
  ): Promise<WorkflowResponse[]> {
    return this.workflowService.findByStatus(tenant.id, status);
  }

  @Mutation(() => WorkflowResponse, { name: 'createWorkflow' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Args('input') input: CreateWorkflowInput,
  ): Promise<WorkflowResponse> {
    return this.workflowService.create(tenant.id, input);
  }

  @Mutation(() => WorkflowResponse, { name: 'updateWorkflow' })
  async update(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateWorkflowInput,
  ): Promise<WorkflowResponse> {
    return this.workflowService.update(tenant.id, id, input);
  }

  @Mutation(() => WorkflowResponse, { name: 'startWorkflow' })
  async start(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
    @Args('variables', { type: () => String, nullable: true }) variables?: string,
  ): Promise<WorkflowResponse> {
    const parsedVariables = variables ? JSON.parse(variables) : {};
    return this.workflowService.start(tenant.id, id, parsedVariables);
  }

  @Mutation(() => WorkflowResponse, { name: 'cancelWorkflow' })
  async cancel(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
    @Args('reason', { nullable: true }) reason?: string,
  ): Promise<WorkflowResponse> {
    return this.workflowService.cancel(tenant.id, id, reason);
  }

  @Mutation(() => WorkflowResponse, { name: 'retryWorkflow' })
  async retry(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<WorkflowResponse> {
    return this.workflowService.retry(tenant.id, id);
  }

  @Query(() => [WorkflowResponse], { name: 'workflowHistory' })
  async getHistory(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<WorkflowResponse[]> {
    return this.workflowService.getHistory(tenant.id, id);
  }

  @Mutation(() => Boolean, { name: 'deleteWorkflow' })
  async remove(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.workflowService.remove(tenant.id, id);
    return true;
  }
}