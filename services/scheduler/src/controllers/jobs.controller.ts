import {
  Controller,
  Get,
  Query,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { SchedulerService } from '../services/scheduler.service';
import { ExecutionStatus } from '../entities/job-execution.entity';

@ApiTags('jobs')
@Controller('scheduler/executions')
export class JobsController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Get()
  @ApiOperation({ summary: 'Get all job executions' })
  @ApiQuery({ name: 'status', required: false, enum: ExecutionStatus })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllExecutions(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: ExecutionStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    // Method not implemented in service - return basic data
    const jobs = await this.schedulerService.findByTenant(tenantId);
    return {
      data: jobs,
      total: jobs.length,
      page,
      limit,
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get job execution statistics' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  async getStatistics(
    @Headers('x-tenant-id') tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    // Method not implemented in service - return basic statistics
    const jobs = await this.schedulerService.findByTenant(tenantId);
    const { JobStatus } = await import('../entities/job-schedule.entity');
    return {
      total: jobs.length,
      active: jobs.filter(j => j.status === JobStatus.ACTIVE).length,
      paused: jobs.filter(j => j.status === JobStatus.PAUSED).length,
      disabled: jobs.filter(j => j.status === JobStatus.DISABLED).length,
    };
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming scheduled jobs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUpcomingJobs(
    @Headers('x-tenant-id') tenantId: string,
    @Query('limit') limit: number = 10,
  ) {
    // Convert limit (number of hours) to hours parameter
    return this.schedulerService.getUpcomingJobs(tenantId, limit);
  }
}