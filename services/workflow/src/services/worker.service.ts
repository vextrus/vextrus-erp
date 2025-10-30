import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from '../activities';
import { getWorkflowsPath } from '../workflows';

@Injectable()
export class WorkerService implements OnModuleDestroy {
  private readonly logger = new Logger(WorkerService.name);
  private worker: Worker;

  constructor(private readonly configService: ConfigService) {}

  async start() {
    try {
      const address = this.configService.get<string>('temporal.address');
      const namespace = this.configService.get<string>('temporal.namespace');
      const taskQueue = this.configService.get<string>('temporal.taskQueue');
      const workerId = this.configService.get<string>('temporal.workerId');
      const maxConcurrentActivityExecutions = this.configService.get<number>('temporal.maxConcurrentActivityExecutions');
      const maxConcurrentWorkflowTaskExecutions = this.configService.get<number>('temporal.maxConcurrentWorkflowTaskExecutions');

      this.logger.log(`Starting Temporal worker ${workerId}`);

      const connection = await NativeConnection.connect({
        address,
      });

      this.worker = await Worker.create({
        connection,
        namespace,
        taskQueue,
        workflowsPath: getWorkflowsPath(),
        activities,
        identity: workerId,
        maxConcurrentActivityTaskExecutions: maxConcurrentActivityExecutions,
        maxConcurrentWorkflowTaskExecutions: maxConcurrentWorkflowTaskExecutions,
      });

      // Don't await this - let it run in the background
      this.worker.run();
      this.logger.log(`Temporal worker ${workerId} started successfully`);
    } catch (error) {
      this.logger.error('Failed to start Temporal worker', error);
      throw error;
    }
  }

  async stop() {
    if (this.worker) {
      this.logger.log('Stopping Temporal worker...');
      await this.worker.shutdown();
      this.logger.log('Temporal worker stopped');
    }
  }

  async onModuleDestroy() {
    await this.stop();
  }
}