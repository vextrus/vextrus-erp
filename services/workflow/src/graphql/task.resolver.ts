import { Resolver, Query, Mutation, Args, ID, ResolveReference } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TaskService } from '../services/task.service';
import { JwtAuthGuard, TenantContext, CurrentTenant, CurrentUser } from '../auth';
import { CreateTaskInput, UpdateTaskInput, TaskFilterInput } from './dto/task.input';
import { TaskResponse, PaginatedTaskResponse } from './dto/task.response';

@Resolver(() => TaskResponse)
@UseGuards(JwtAuthGuard)
export class TaskResolver {
  constructor(private readonly taskService: TaskService) {}

  @ResolveReference()
  async resolveReference(reference: { __typename: string; id: string }): Promise<TaskResponse> {
    // For federation, we need to bypass tenant context
    // The reference.id should be sufficient to identify the entity uniquely
    return this.taskService.findOne(null, reference.id);
  }

  @Query(() => PaginatedTaskResponse, { name: 'tasks' })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Args('filter', { nullable: true }) filter?: TaskFilterInput,
    @Args('page', { type: () => Number, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Number, defaultValue: 20 }) limit?: number,
  ): Promise<PaginatedTaskResponse> {
    return this.taskService.findAll(tenant.id, {
      ...filter,
      page,
      limit,
    });
  }

  @Query(() => TaskResponse, { name: 'task' })
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<TaskResponse> {
    return this.taskService.findOne(tenant.id, id);
  }

  @Query(() => [TaskResponse], { name: 'myTasks' })
  async getMyTasks(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Args('status', { nullable: true }) status?: string,
  ): Promise<TaskResponse[]> {
    return this.taskService.getTasksByAssignee(tenant.id, user.id, status);
  }

  @Query(() => [TaskResponse], { name: 'tasksByWorkflow' })
  async getByWorkflow(
    @CurrentTenant() tenant: TenantContext,
    @Args('workflowId') workflowId: string,
  ): Promise<TaskResponse[]> {
    return this.taskService.getTasksByWorkflow(tenant.id, workflowId);
  }

  @Mutation(() => TaskResponse, { name: 'createTask' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Args('input') input: CreateTaskInput,
  ): Promise<TaskResponse> {
    return this.taskService.create(tenant.id, { ...input, createdBy: user.id });
  }

  @Mutation(() => TaskResponse, { name: 'updateTask' })
  async update(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateTaskInput,
  ): Promise<TaskResponse> {
    return this.taskService.update(tenant.id, id, { ...input, updatedBy: user.id });
  }

  @Mutation(() => TaskResponse, { name: 'assignTask' })
  async assign(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Args('id', { type: () => ID }) id: string,
    @Args('assigneeId') assigneeId: string,
  ): Promise<TaskResponse> {
    return this.taskService.assign(tenant.id, id, assigneeId);
  }

  @Mutation(() => TaskResponse, { name: 'completeTask' })
  async complete(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Args('id', { type: () => ID }) id: string,
    @Args('result', { nullable: true }) result?: string,
  ): Promise<TaskResponse> {
    return this.taskService.complete(tenant.id, id, result);
  }

  @Mutation(() => TaskResponse, { name: 'approveTask' })
  async approve(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Args('id', { type: () => ID }) id: string,
    @Args('comments', { nullable: true }) comments?: string,
  ): Promise<TaskResponse> {
    return this.taskService.approve(tenant.id, id);
  }

  @Mutation(() => TaskResponse, { name: 'rejectTask' })
  async reject(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Args('id', { type: () => ID }) id: string,
    @Args('reason') reason: string,
  ): Promise<TaskResponse> {
    return this.taskService.reject(tenant.id, id, reason);
  }

  @Mutation(() => TaskResponse, { name: 'cancelTask' })
  async cancel(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Args('id', { type: () => ID }) id: string,
    @Args('reason', { nullable: true }) reason?: string,
  ): Promise<TaskResponse> {
    return this.taskService.cancel(tenant.id, id);
  }

  @Mutation(() => Boolean, { name: 'deleteTask' })
  async remove(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.taskService.remove(tenant.id, id);
    return true;
  }
}