import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { JobExecutorService } from '../services/job-executor.service';

@Processor('scheduled-jobs')
export class JobProcessor {
  private readonly logger = new Logger(JobProcessor.name);

  constructor(private readonly jobExecutorService: JobExecutorService) {}

  @Process('execute')
  async handleJobExecution(job: Job<any>) {
    const { jobId, executionId, tenantId } = job.data;

    this.logger.log(`Processing job ${jobId} for tenant ${tenantId}`);

    try {
      const result = await this.jobExecutorService.executeJob(jobId, executionId);
      
      this.logger.log(`Job ${jobId} completed successfully`);
      return result;
    } catch (error: any) {
      this.logger.error(`Job ${jobId} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('batch')
  async handleBatchJob(job: Job<any>) {
    const { jobs, tenantId } = job.data;

    this.logger.log(`Processing batch of ${jobs.length} jobs for tenant ${tenantId}`);

    const results: Array<{ jobId: string; status: string; result: any }> = [];
    const errors: Array<{ jobId: string; status: string; error: string }> = [];

    for (const jobData of jobs) {
      try {
        const result = await this.jobExecutorService.executeJob(jobData.jobId);
        results.push({ jobId: jobData.jobId, status: 'success', result });
      } catch (error: any) {
        errors.push({ jobId: jobData.jobId, status: 'failed', error: error.message });
        this.logger.error(`Batch job ${jobData.jobId} failed: ${error.message}`);
      }
    }

    return {
      total: jobs.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }
}