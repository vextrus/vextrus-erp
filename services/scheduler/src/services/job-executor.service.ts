import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobSchedule } from '../entities/job-schedule.entity';
import { JobExecution, ExecutionStatus } from '../entities/job-execution.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientKafka } from '@nestjs/microservices';
import { parseExpression } from 'cron-parser';
import * as os from 'os';

interface JobHandler {
  execute(data: any): Promise<any>;
}

@Injectable()
export class JobExecutorService {
  private readonly logger = new Logger(JobExecutorService.name);
  private readonly handlers: Map<string, JobHandler> = new Map();
  private readonly workerId = `${os.hostname()}-${process.pid}`;

  constructor(
    @InjectRepository(JobSchedule)
    private readonly jobScheduleRepository: Repository<JobSchedule>,
    @InjectRepository(JobExecution)
    private readonly jobExecutionRepository: Repository<JobExecution>,
    @Inject('KAFKA_CLIENT')
    private readonly kafkaClient: ClientKafka,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.registerDefaultHandlers();
  }

  async executeJob(jobId: string, executionId?: string): Promise<JobExecution> {
    const job = await this.jobScheduleRepository.findOne({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    let execution: JobExecution | null;
    
    if (executionId) {
      execution = await this.jobExecutionRepository.findOne({
        where: { id: executionId },
      });
      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }
    } else {
      execution = this.jobExecutionRepository.create({
        tenant_id: job.tenant_id,
        job_schedule_id: job.id,
        status: ExecutionStatus.PENDING,
        input_data: job.job_data,
        retry_count: 0,
        max_retries: job.retry_config?.max_attempts || 3,
      });
      execution = await this.jobExecutionRepository.save(execution);
    }

    const startTime = Date.now();

    try {
      // Update execution status to running
      execution.status = ExecutionStatus.RUNNING;
      execution.started_at = new Date();
      execution.worker_id = this.workerId;
      await this.jobExecutionRepository.save(execution);

      this.logger.log(`Executing job ${job.name} (${job.id})`);

      // Execute the job handler
      const handler = this.handlers.get(job.handler_name);
      if (!handler) {
        throw new Error(`Handler ${job.handler_name} not found`);
      }

      const result = await handler.execute(job.job_data);

      // Update execution as successful
      execution.status = ExecutionStatus.SUCCESS;
      execution.completed_at = new Date();
      execution.duration_ms = Date.now() - startTime;
      execution.output_data = result;
      execution.performance_metrics = {
        cpu_usage: process.cpuUsage().user / 1000,
        memory_usage: process.memoryUsage().heapUsed / 1024 / 1024,
        execution_time: execution.duration_ms,
      };

      await this.jobExecutionRepository.save(execution);

      // Update job statistics
      job.last_run_at = new Date();
      job.execution_count++;
      
      // Calculate next run time for recurring jobs
      if (job.job_type === 'cron' && job.cron_expression) {
        const interval = parseExpression(job.cron_expression);
        job.next_run_at = interval.next().toDate();
      }

      await this.jobScheduleRepository.save(job);

      // Send success notification if configured
      if (job.notification_config?.on_success && job.notification_config.on_success.length > 0) {
        await this.sendNotification(job, execution, 'success');
      }

      this.eventEmitter.emit('job.execution.success', {
        job,
        execution,
      });

      this.logger.log(`Job ${job.name} completed successfully in ${execution.duration_ms}ms`);

      return execution;
    } catch (error: any) {
      this.logger.error(`Job ${job.name} failed: ${error.message}`, error.stack);

      // Update execution as failed
      execution.status = ExecutionStatus.FAILED;
      execution.completed_at = new Date();
      execution.duration_ms = Date.now() - startTime;
      execution.error_message = error.message;
      execution.error_stack = error.stack;

      await this.jobExecutionRepository.save(execution);

      // Update job failure count
      job.failure_count++;
      job.last_run_at = new Date();
      await this.jobScheduleRepository.save(job);

      // Send failure notification if configured
      if (job.notification_config?.on_failure && job.notification_config.on_failure.length > 0) {
        await this.sendNotification(job, execution, 'failure');
      }

      this.eventEmitter.emit('job.execution.failed', {
        job,
        execution,
        error,
      });

      throw error;
    }
  }

  registerHandler(name: string, handler: JobHandler): void {
    this.handlers.set(name, handler);
    this.logger.log(`Registered job handler: ${name}`);
  }

  private registerDefaultHandlers(): void {
    // Data sync handler
    this.registerHandler('data_sync', {
      execute: async (data: any) => {
        this.logger.log('Executing data sync job', data);
        // Emit Kafka event for data sync
        this.kafkaClient.emit('data.sync.requested', data);
        return { status: 'sync_initiated', data };
      },
    });

    // Report generation handler
    this.registerHandler('generate_report', {
      execute: async (data: any) => {
        this.logger.log('Executing report generation job', data);
        // Emit Kafka event for report generation
        this.kafkaClient.emit('report.generation.requested', data);
        return { status: 'report_generation_initiated', data };
      },
    });

    // Cleanup handler
    this.registerHandler('cleanup', {
      execute: async (data: any) => {
        this.logger.log('Executing cleanup job', data);
        const daysToKeep = data.days_to_keep || 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        // Delete old executions
        const result = await this.jobExecutionRepository
          .createQueryBuilder()
          .delete()
          .where('created_at < :cutoffDate', { cutoffDate })
          .andWhere('status IN (:...statuses)', {
            statuses: [ExecutionStatus.SUCCESS, ExecutionStatus.FAILED],
          })
          .execute();

        return {
          deleted_records: result.affected,
          cutoff_date: cutoffDate,
        };
      },
    });

    // Email digest handler
    this.registerHandler('email_digest', {
      execute: async (data: any) => {
        this.logger.log('Executing email digest job', data);
        // Emit Kafka event for email digest
        this.kafkaClient.emit('email.digest.requested', data);
        return { status: 'digest_initiated', data };
      },
    });

    // Health check handler
    this.registerHandler('health_check', {
      execute: async (data: any) => {
        this.logger.log('Executing health check job', data);
        const checks: Array<{ service: string; status: string; error?: string }> = [];

        // Check database connection
        try {
          await this.jobScheduleRepository.count();
          checks.push({ service: 'database', status: 'healthy' });
        } catch (error: any) {
          checks.push({ service: 'database', status: 'unhealthy', error: error.message });
        }

        // Check Kafka connection
        try {
          await this.kafkaClient.emit('health.check', {}).toPromise();
          checks.push({ service: 'kafka', status: 'healthy' });
        } catch (error: any) {
          checks.push({ service: 'kafka', status: 'unhealthy', error: error.message });
        }

        return {
          timestamp: new Date(),
          checks,
          overall_status: checks.every(c => c.status === 'healthy') ? 'healthy' : 'unhealthy',
        };
      },
    });

    // Data export handler
    this.registerHandler('data_export', {
      execute: async (data: any) => {
        this.logger.log('Executing data export job', data);
        // Emit Kafka event for data export
        this.kafkaClient.emit('data.export.requested', data);
        return { status: 'export_initiated', data };
      },
    });

    // Backup handler
    this.registerHandler('backup', {
      execute: async (data: any) => {
        this.logger.log('Executing backup job', data);
        // Emit Kafka event for backup
        this.kafkaClient.emit('backup.requested', data);
        return { status: 'backup_initiated', data };
      },
    });
  }

  private async sendNotification(
    job: JobSchedule,
    execution: JobExecution,
    type: 'success' | 'failure',
  ): Promise<void> {
    const recipients = type === 'success'
      ? job.notification_config.on_success
      : job.notification_config.on_failure;

    const channels = job.notification_config.channels || ['email'];

    for (const channel of channels) {
      this.kafkaClient.emit('notification.send', {
        tenant_id: job.tenant_id,
        channel,
        recipients,
        template: `job_${type}`,
        data: {
          job_name: job.name,
          job_id: job.id,
          execution_id: execution.id,
          status: execution.status,
          duration: execution.duration_ms,
          error: execution.error_message,
          timestamp: execution.completed_at,
        },
      });
    }
  }
}