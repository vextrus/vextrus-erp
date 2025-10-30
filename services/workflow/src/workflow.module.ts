import { Module } from '@nestjs/common';
import { TemporalService } from './services/temporal.service';
import { WorkflowController } from './controllers/workflow.controller';
import { TaskController } from './controllers/task.controller';
import { TemplateController } from './controllers/template.controller';
import { WorkflowService } from './services/workflow.service';
import { TaskService } from './services/task.service';
import { TemplateService } from './services/template.service';
import { WorkerService } from './services/worker.service';
import { WorkflowResolver } from './graphql/workflow.resolver';
import { TaskResolver } from './graphql/task.resolver';

@Module({
  controllers: [WorkflowController, TaskController, TemplateController],
  providers: [
    TemporalService,
    WorkflowService,
    TaskService,
    TemplateService,
    WorkerService,
    // GraphQL Resolvers
    WorkflowResolver,
    TaskResolver,
  ],
  exports: [TemporalService, WorkflowService],
})
export class WorkflowModule {
  constructor(private readonly workerService: WorkerService) {}

  async onModuleInit() {
    // Start the Temporal worker when the module initializes
    // Don't await to avoid blocking the server startup
    // Use setImmediate to ensure HTTP server starts first
    setImmediate(() => {
      this.workerService.start().catch((error) => {
        console.error('Failed to start Temporal worker:', error);
        console.log('Workflow service will continue running without Temporal worker');
      });
    });
  }

  async onModuleDestroy() {
    // Gracefully shutdown the worker
    await this.workerService.stop();
  }
}