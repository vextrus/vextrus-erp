import { Resolver, Query, Mutation, Args, ResolveReference, ID, Int } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { JobSchedule } from '../entities/job-schedule.entity';
import { SchedulerService } from '../services/scheduler.service';
import { CreateJobInput, UpdateJobInput, JobScheduleConnection, SearchJobInput, ExecuteJobInput } from '../dto/job-schedule.dto';

@Injectable()
@Resolver(() => JobSchedule)
export class JobScheduleResolver {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Query(() => JobSchedule, { nullable: true })
  async jobSchedule(@Args('id', { type: () => ID }) id: string): Promise<JobSchedule> {
    return this.schedulerService.findById(id);
  }

  @Query(() => [JobSchedule])
  async jobSchedulesByTenant(@Args('tenantId', { type: () => ID }) tenantId: string): Promise<JobSchedule[]> {
    return this.schedulerService.findByTenant(tenantId);
  }

  @Query(() => [JobSchedule])
  async activeJobs(@Args('tenantId', { type: () => ID }) tenantId: string): Promise<JobSchedule[]> {
    return this.schedulerService.findActiveJobs(tenantId);
  }

  @Query(() => JobScheduleConnection)
  async searchJobs(
    @Args('input') input: SearchJobInput
  ): Promise<JobScheduleConnection> {
    return this.schedulerService.searchJobs(input);
  }

  @Query(() => JobScheduleConnection)
  async jobsPaginated(
    @Args('tenantId', { type: () => ID }) tenantId: string,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number
  ): Promise<JobScheduleConnection> {
    return this.schedulerService.findPaginated(tenantId, limit, offset);
  }

  @Query(() => [JobSchedule])
  async upcomingJobs(
    @Args('tenantId', { type: () => ID }) tenantId: string,
    @Args('hours', { type: () => Int, defaultValue: 24 }) hours: number
  ): Promise<JobSchedule[]> {
    return this.schedulerService.getUpcomingJobs(tenantId, hours);
  }

  @Mutation(() => JobSchedule)
  async createJob(
    @Args('input') input: CreateJobInput
  ): Promise<JobSchedule> {
    return this.schedulerService.createJob(input);
  }

  @Mutation(() => JobSchedule)
  async updateJob(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateJobInput
  ): Promise<JobSchedule> {
    return this.schedulerService.updateJob(id, input);
  }

  @Mutation(() => JobSchedule)
  async pauseJob(
    @Args('id', { type: () => ID }) id: string
  ): Promise<JobSchedule> {
    return this.schedulerService.pauseJob(id);
  }

  @Mutation(() => JobSchedule)
  async resumeJob(
    @Args('id', { type: () => ID }) id: string
  ): Promise<JobSchedule> {
    return this.schedulerService.resumeJob(id);
  }

  @Mutation(() => JobSchedule)
  async disableJob(
    @Args('id', { type: () => ID }) id: string
  ): Promise<JobSchedule> {
    return this.schedulerService.disableJob(id);
  }

  @Mutation(() => Boolean)
  async deleteJob(
    @Args('id', { type: () => ID }) id: string
  ): Promise<boolean> {
    return this.schedulerService.deleteJob(id);
  }

  @Mutation(() => JobSchedule)
  async executeJobNow(
    @Args('id', { type: () => ID }) id: string
  ): Promise<JobSchedule> {
    return this.schedulerService.executeJobNow(id);
  }

  @Mutation(() => Int)
  async cleanupOldExecutions(
    @Args('daysOld', { type: () => Int, defaultValue: 30 }) daysOld: number
  ): Promise<number> {
    return this.schedulerService.cleanupOldExecutions(daysOld);
  }

  @ResolveReference()
  async resolveReference(reference: { __typename: string; id: string }): Promise<JobSchedule> {
    return this.schedulerService.findById(reference.id);
  }
}