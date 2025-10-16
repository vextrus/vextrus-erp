import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, Client, WorkflowClient } from '@temporalio/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TemporalService implements OnModuleInit {
  private readonly logger = new Logger(TemporalService.name);
  private connection: Connection;
  private client: WorkflowClient;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  private async connect() {
    try {
      const address = this.configService.get<string>('temporal.address');
      const namespace = this.configService.get<string>('temporal.namespace');

      this.logger.log(`Connecting to Temporal at ${address}`);
      
      this.connection = await Connection.connect({
        address,
      });

      this.client = new WorkflowClient({
        connection: this.connection,
        namespace,
      });

      this.logger.log(`Connected to Temporal namespace: ${namespace}`);
    } catch (error) {
      this.logger.error('Failed to connect to Temporal', error);
      throw error;
    }
  }

  getClient(): WorkflowClient {
    return this.client;
  }

  async startWorkflow(
    workflowType: string,
    args: any[],
    options?: {
      workflowId?: string;
      taskQueue?: string;
      memo?: Record<string, any>;
      searchAttributes?: Record<string, any>;
    },
  ) {
    const taskQueue = options?.taskQueue || this.configService.get<string>('temporal.taskQueue');
    const workflowId = options?.workflowId || `${workflowType}-${uuidv4()}`;

    try {
      const handle = await this.client.start(workflowType, {
        args,
        taskQueue,
        workflowId,
        memo: options?.memo,
        searchAttributes: options?.searchAttributes,
      });

      return {
        workflowId: handle.workflowId,
        runId: handle.firstExecutionRunId,
      };
    } catch (error) {
      this.logger.error(`Failed to start workflow ${workflowType}`, error);
      throw error;
    }
  }

  async getWorkflowHandle(workflowId: string) {
    return this.client.getHandle(workflowId);
  }

  async cancelWorkflow(workflowId: string) {
    try {
      const handle = await this.getWorkflowHandle(workflowId);
      await handle.cancel();
      return { success: true, message: `Workflow ${workflowId} cancelled` };
    } catch (error) {
      this.logger.error(`Failed to cancel workflow ${workflowId}`, error);
      throw error;
    }
  }

  async terminateWorkflow(workflowId: string, reason?: string) {
    try {
      const handle = await this.getWorkflowHandle(workflowId);
      await handle.terminate(reason);
      return { success: true, message: `Workflow ${workflowId} terminated` };
    } catch (error) {
      this.logger.error(`Failed to terminate workflow ${workflowId}`, error);
      throw error;
    }
  }

  async signalWorkflow(workflowId: string, signalName: string, args?: any[]) {
    try {
      const handle = await this.getWorkflowHandle(workflowId);
      await handle.signal(signalName, ...(args || []));
      return { success: true, message: `Signal ${signalName} sent to workflow ${workflowId}` };
    } catch (error) {
      this.logger.error(`Failed to signal workflow ${workflowId}`, error);
      throw error;
    }
  }

  async queryWorkflow(workflowId: string, queryType: string, args?: any[]) {
    try {
      const handle = await this.getWorkflowHandle(workflowId);
      return await handle.query(queryType, ...(args || []));
    } catch (error) {
      this.logger.error(`Failed to query workflow ${workflowId}`, error);
      throw error;
    }
  }

  async getWorkflowResult(workflowId: string) {
    try {
      const handle = await this.getWorkflowHandle(workflowId);
      return await handle.result();
    } catch (error) {
      this.logger.error(`Failed to get workflow result for ${workflowId}`, error);
      throw error;
    }
  }

  async describeWorkflow(workflowId: string) {
    try {
      const handle = await this.getWorkflowHandle(workflowId);
      return await handle.describe();
    } catch (error) {
      this.logger.error(`Failed to describe workflow ${workflowId}`, error);
      throw error;
    }
  }

  async listWorkflows(query?: string, pageSize = 10) {
    try {
      const workflows = [];
      const iterator = this.client.list({
        query,
        pageSize,
      });

      for await (const workflow of iterator) {
        workflows.push(workflow);
      }

      return workflows;
    } catch (error) {
      this.logger.error('Failed to list workflows', error);
      throw error;
    }
  }
}