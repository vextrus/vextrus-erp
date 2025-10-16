import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { JobSchedule, JobStatus, JobType } from '../entities/job-schedule.entity';
import { JobExecutorService } from './job-executor.service';
import { parseExpression } from 'cron-parser';

@Injectable()
export class CronJobService implements OnModuleInit {
  private readonly logger = new Logger(CronJobService.name);

  constructor(
    @InjectRepository(JobSchedule)
    private readonly jobScheduleRepository: Repository<JobSchedule>,
    private readonly jobExecutorService: JobExecutorService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    await this.loadActiveJobs();
    this.logger.log('Cron job service initialized');
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkScheduledJobs() {
    const now = new Date();
    
    // Find all jobs that should run now
    const jobsToRun = await this.jobScheduleRepository.find({
      where: {
        status: JobStatus.ACTIVE,
        next_run_at: LessThanOrEqual(now),
      },
    });

    for (const job of jobsToRun) {
      try {
        // Execute the job
        await this.jobExecutorService.executeJob(job.id);

        // Calculate next run time
        if (job.job_type === JobType.CRON && job.cron_expression) {
          const interval = parseExpression(job.cron_expression, {
            currentDate: new Date(),
            endDate: job.end_date,
            tz: job.timezone,
          });
          
          job.next_run_at = interval.next().toDate();
        } else if (job.job_type === JobType.ONE_TIME) {
          // Mark one-time jobs as completed
          job.status = JobStatus.COMPLETED;
          job.next_run_at = null;
        }

        await this.jobScheduleRepository.save(job);
      } catch (error: any) {
        this.logger.error(`Failed to execute job ${job.id}: ${error.message}`, error.stack);
      }
    }
  }

  async loadActiveJobs() {
    const activeJobs = await this.jobScheduleRepository.find({
      where: {
        status: JobStatus.ACTIVE,
        job_type: JobType.CRON,
      },
    });

    for (const job of activeJobs) {
      if (job.cron_expression) {
        try {
          this.addCronJob(job);
        } catch (error: any) {
          this.logger.error(`Failed to load job ${job.id}: ${error.message}`);
        }
      }
    }

    this.logger.log(`Loaded ${activeJobs.length} active cron jobs`);
  }

  addCronJob(job: JobSchedule) {
    const cronJob = new CronJob(
      job.cron_expression,
      async () => {
        try {
          await this.jobExecutorService.executeJob(job.id);
        } catch (error: any) {
          this.logger.error(`Cron job ${job.id} execution failed: ${error.message}`);
        }
      },
      null,
      true,
      job.timezone || 'Asia/Dhaka',
    );

    this.schedulerRegistry.addCronJob(`job-${job.id}`, cronJob);
    this.logger.log(`Added cron job: ${job.name} (${job.id})`);
  }

  removeCronJob(jobId: string) {
    const jobName = `job-${jobId}`;
    
    if (this.schedulerRegistry.doesExist('cron', jobName)) {
      this.schedulerRegistry.deleteCronJob(jobName);
      this.logger.log(`Removed cron job: ${jobName}`);
    }
  }

  updateCronJob(job: JobSchedule) {
    this.removeCronJob(job.id);
    
    if (job.status === JobStatus.ACTIVE && job.cron_expression) {
      this.addCronJob(job);
    }
  }
}