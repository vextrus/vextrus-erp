import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { JobSchedule, JobStatus, JobType } from '../entities/job-schedule.entity';
import { CreateJobInput, UpdateJobInput, SearchJobInput, JobScheduleConnection } from '../dto/job-schedule.dto';
import { parseExpression } from 'cron-parser';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(JobSchedule)
    private readonly jobScheduleRepository: Repository<JobSchedule>,
    @InjectQueue('scheduled-jobs')
    private readonly jobQueue: Queue,
    @Inject('KAFKA_CLIENT') private kafkaClient: ClientProxy,
  ) {}

  async findById(id: string): Promise<JobSchedule> {
    const job = await this.jobScheduleRepository.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return job;
  }

  async findByTenant(tenantId: string): Promise<JobSchedule[]> {
    return this.jobScheduleRepository.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' }
    });
  }

  async findActiveJobs(tenantId: string): Promise<JobSchedule[]> {
    return this.jobScheduleRepository.find({
      where: {
        tenant_id: tenantId,
        status: JobStatus.ACTIVE
      },
      order: { next_run_at: 'ASC' }
    });
  }

  async searchJobs(input: SearchJobInput): Promise<JobScheduleConnection> {
    const query = this.jobScheduleRepository.createQueryBuilder('job');

    query.where('job.tenant_id = :tenantId', { tenantId: input.tenantId });

    if (input.query) {
      query.andWhere('(job.name ILIKE :query OR job.description ILIKE :query)',
        { query: `%${input.query}%` });
    }

    if (input.status) {
      query.andWhere('job.status = :status', { status: input.status });
    }

    if (input.jobType) {
      query.andWhere('job.job_type = :jobType', { jobType: input.jobType });
    }

    if (input.handlerName) {
      query.andWhere('job.handler_name = :handlerName', { handlerName: input.handlerName });
    }

    const totalCount = await query.getCount();

    query.skip(input.offset || 0).take(input.limit || 10);
    query.orderBy('job.created_at', 'DESC');

    const jobs = await query.getMany();

    return {
      nodes: jobs,
      totalCount,
      hasNextPage: (input.offset || 0) + (input.limit || 10) < totalCount,
      hasPreviousPage: (input.offset || 0) > 0
    };
  }

  async findPaginated(
    tenantId: string,
    limit: number,
    offset: number
  ): Promise<JobScheduleConnection> {
    const [jobs, totalCount] = await this.jobScheduleRepository.findAndCount({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit
    });

    return {
      nodes: jobs,
      totalCount,
      hasNextPage: offset + limit < totalCount,
      hasPreviousPage: offset > 0
    };
  }

  async getUpcomingJobs(tenantId: string, hours: number): Promise<JobSchedule[]> {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + hours);

    return this.jobScheduleRepository.find({
      where: {
        tenant_id: tenantId,
        status: JobStatus.ACTIVE,
        next_run_at: LessThan(futureDate)
      },
      order: { next_run_at: 'ASC' }
    });
  }

  async createJob(input: CreateJobInput): Promise<JobSchedule> {
    // Validate cron expression if provided
    if (input.jobType === JobType.CRON && input.cronExpression) {
      try {
        parseExpression(input.cronExpression);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new BadRequestException(`Invalid cron expression: ${message}`);
      }
    }

    const job = this.jobScheduleRepository.create({
      tenant_id: input.tenantId,
      name: input.name,
      description: input.description,
      job_type: input.jobType,
      cron_expression: input.cronExpression,
      start_date: input.startDate,
      end_date: input.endDate,
      handler_name: input.handlerName,
      job_data: input.jobData ? JSON.parse(input.jobData) : null,
      timezone: input.timezone,
      status: JobStatus.ACTIVE,
      execution_count: 0,
      failure_count: 0,
      next_run_at: this.calculateNextRunTime(input),
      created_by: input.createdBy,
    });

    const savedJob = await this.jobScheduleRepository.save(job);

    // Queue the job if active
    if (savedJob.status === JobStatus.ACTIVE) {
      await this.scheduleJob(savedJob);
    }

    // Emit event
    this.kafkaClient.emit('job.created', {
      jobId: savedJob.id,
      tenantId: input.tenantId,
      name: input.name,
      type: input.jobType
    });

    return savedJob;
  }

  async updateJob(id: string, input: UpdateJobInput): Promise<JobSchedule> {
    const job = await this.findById(id);

    if (input.name) job.name = input.name;
    if (input.description !== undefined) job.description = input.description;
    if (input.cronExpression) {
      try {
        parseExpression(input.cronExpression);
        job.cron_expression = input.cronExpression;
        job.next_run_at = this.calculateNextRunFromCron(input.cronExpression);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new BadRequestException(`Invalid cron expression: ${message}`);
      }
    }
    if (input.startDate) job.start_date = input.startDate;
    if (input.endDate) job.end_date = input.endDate;
    if (input.jobData) job.job_data = JSON.parse(input.jobData);
    if (input.timezone) job.timezone = input.timezone;
    if (input.updatedBy) job.updated_by = input.updatedBy;

    const updatedJob = await this.jobScheduleRepository.save(job);

    // Reschedule if needed
    await this.rescheduleJob(updatedJob);

    // Emit event
    this.kafkaClient.emit('job.updated', {
      jobId: id,
      changes: input
    });

    return updatedJob;
  }

  async pauseJob(id: string): Promise<JobSchedule> {
    const job = await this.findById(id);
    job.status = JobStatus.PAUSED;

    const pausedJob = await this.jobScheduleRepository.save(job);

    // Remove from queue
    await this.unscheduleJob(id);

    this.kafkaClient.emit('job.paused', { jobId: id });

    return pausedJob;
  }

  async resumeJob(id: string): Promise<JobSchedule> {
    const job = await this.findById(id);

    if (job.status !== JobStatus.PAUSED) {
      throw new BadRequestException('Job is not paused');
    }

    job.status = JobStatus.ACTIVE;
    job.next_run_at = this.calculateNextRunTime({
      jobType: job.job_type,
      cronExpression: job.cron_expression,
      startDate: job.start_date,
    });

    const resumedJob = await this.jobScheduleRepository.save(job);

    // Reschedule
    await this.scheduleJob(resumedJob);

    this.kafkaClient.emit('job.resumed', { jobId: id });

    return resumedJob;
  }

  async disableJob(id: string): Promise<JobSchedule> {
    const job = await this.findById(id);
    job.status = JobStatus.DISABLED;

    const disabledJob = await this.jobScheduleRepository.save(job);

    // Remove from queue
    await this.unscheduleJob(id);

    this.kafkaClient.emit('job.disabled', { jobId: id });

    return disabledJob;
  }

  async deleteJob(id: string): Promise<boolean> {
    const job = await this.findById(id);

    // Remove from queue
    await this.unscheduleJob(id);

    await this.jobScheduleRepository.remove(job);

    this.kafkaClient.emit('job.deleted', { jobId: id });

    return true;
  }

  async executeJobNow(id: string): Promise<JobSchedule> {
    const job = await this.findById(id);

    // Queue for immediate execution
    await this.jobQueue.add('execute-now', {
      jobId: job.id,
      tenantId: job.tenant_id,
      handlerName: job.handler_name,
      data: job.job_data,
    }, {
      delay: 0,
      attempts: 1,
    });

    job.last_run_at = new Date();
    job.execution_count++;

    const updatedJob = await this.jobScheduleRepository.save(job);

    this.kafkaClient.emit('job.executed.manually', {
      jobId: id,
      executedAt: new Date()
    });

    return updatedJob;
  }

  async cleanupOldExecutions(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.jobScheduleRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate })
      .andWhere('status = :status', { status: JobStatus.COMPLETED })
      .execute();

    this.logger.log(`Cleaned up ${result.affected} old job schedules`);

    return result.affected || 0;
  }

  private calculateNextRunTime(input: any): Date | null {
    if (input.jobType === JobType.ONE_TIME) {
      return input.startDate || new Date();
    }

    if (input.jobType === JobType.CRON && input.cronExpression) {
      return this.calculateNextRunFromCron(input.cronExpression);
    }

    return null;
  }

  private calculateNextRunFromCron(cronExpression: string): Date | null {
    try {
      const interval = parseExpression(cronExpression);
      return interval.next().toDate();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to calculate next run time: ${message}`);
      return null;
    }
  }

  private async scheduleJob(job: JobSchedule): Promise<void> {
    if (!job.next_run_at) return;

    const delay = job.next_run_at.getTime() - Date.now();
    if (delay <= 0) return;

    await this.jobQueue.add('scheduled-job', {
      jobId: job.id,
      tenantId: job.tenant_id,
      handlerName: job.handler_name,
      data: job.job_data,
    }, {
      delay,
      jobId: job.id,
      attempts: job.retry_config?.max_attempts || 3,
      backoff: {
        type: job.retry_config?.backoff_type || 'exponential',
        delay: job.retry_config?.backoff_delay || 5000,
      },
    });
  }

  private async rescheduleJob(job: JobSchedule): Promise<void> {
    await this.unscheduleJob(job.id);
    if (job.status === JobStatus.ACTIVE) {
      await this.scheduleJob(job);
    }
  }

  private async unscheduleJob(jobId: string): Promise<void> {
    const jobs = await this.jobQueue.getJobs(['delayed', 'waiting']);
    for (const job of jobs) {
      if (job.opts.jobId === jobId) {
        await job.remove();
      }
    }
  }
}