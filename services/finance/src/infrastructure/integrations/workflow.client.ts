import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, WorkflowClient, Connection } from '@temporalio/client';
import { WorkflowIdReusePolicy } from '@temporalio/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, map } from 'rxjs';

// Workflow Types
export enum WorkflowType {
  INVOICE_APPROVAL = 'invoice-approval-workflow',
  PAYMENT_APPROVAL = 'payment-approval-workflow',
  JOURNAL_APPROVAL = 'journal-approval-workflow',
  BUDGET_APPROVAL = 'budget-approval-workflow',
  EXPENSE_APPROVAL = 'expense-approval-workflow',
}

export enum ApprovalRole {
  SUPERVISOR = 'SUPERVISOR',
  MANAGER = 'MANAGER',
  DIRECTOR = 'DIRECTOR',
  CFO = 'CFO',
  CEO = 'CEO',
}

export interface ApprovalLevel {
  role: ApprovalRole;
  threshold: number;
  currency?: string;
  approvers?: string[];
  autoApprove?: boolean;
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ESCALATED = 'ESCALATED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface ApprovalRequest {
  requestId: string;
  entityType: string;
  entityId: string;
  amount: number;
  currency: string;
  requestedBy: string;
  requestedAt: Date;
  description: string;
  metadata?: Record<string, any>;
}

export interface ApprovalResponse {
  workflowId: string;
  status: ApprovalStatus;
  currentLevel?: ApprovalLevel;
  approvals: ApprovalRecord[];
  rejections: RejectionRecord[];
  nextApprover?: string;
  estimatedCompletionTime?: Date;
}

export interface ApprovalRecord {
  approverId: string;
  approverName: string;
  approverRole: ApprovalRole;
  approvedAt: Date;
  comments?: string;
  conditions?: string[];
}

export interface RejectionRecord {
  rejectedBy: string;
  rejectedAt: Date;
  reason: string;
  canResubmit: boolean;
}

export interface WorkflowStatus {
  workflowId: string;
  status: ApprovalStatus;
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  currentActivity?: string;
  pendingActivities: string[];
  history: WorkflowHistoryItem[];
}

export interface WorkflowHistoryItem {
  timestamp: Date;
  activity: string;
  actor?: string;
  details: string;
  metadata?: Record<string, any>;
}

// Approval Matrix Configuration
export interface ApprovalMatrix {
  entityType: string;
  rules: ApprovalRule[];
  escalationPolicy?: EscalationPolicy;
  delegationEnabled: boolean;
}

export interface ApprovalRule {
  minAmount: number;
  maxAmount: number;
  currency: string;
  levels: ApprovalLevel[];
  skipLevels?: boolean;
  parallelApproval?: boolean;
}

export interface EscalationPolicy {
  timeoutHours: number;
  escalateToRole: ApprovalRole;
  maxEscalations: number;
  notificationChannels: string[];
}

@Injectable()
export class WorkflowEngineClient {
  private readonly logger = new Logger(WorkflowEngineClient.name);
  private client!: WorkflowClient;
  private connection!: Connection;
  private readonly temporalAddress: string;
  private readonly namespace: string;
  private readonly taskQueue: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.temporalAddress = this.configService.get<string>('TEMPORAL_ADDRESS', 'localhost:7233');
    this.namespace = this.configService.get<string>('TEMPORAL_NAMESPACE', 'default');
    this.taskQueue = this.configService.get<string>('TEMPORAL_TASK_QUEUE', 'finance-approval');
  }

  async onModuleInit() {
    try {
      // Initialize Temporal connection
      this.connection = await Connection.connect({
        address: this.temporalAddress,
      });

      this.client = new WorkflowClient({
        connection: this.connection,
        namespace: this.namespace,
      });

      this.logger.log('Connected to Temporal workflow engine');
    } catch (error) {
      this.logger.error('Failed to connect to Temporal:', error);
      // Don't throw - allow service to run without workflows
    }
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.close();
    }
  }

  // Invoice Approval Workflow
  async startInvoiceApproval(
    invoiceId: string,
    amount: number,
    currency = 'BDT',
    metadata?: Record<string, any>,
  ): Promise<ApprovalResponse> {
    try {
      const approvalLevels = await this.getApprovalLevels('INVOICE', amount, currency);
      const workflowId = `invoice-approval-${invoiceId}-${Date.now()}`;

      const handle = await this.client.start(WorkflowType.INVOICE_APPROVAL, {
        taskQueue: this.taskQueue,
        args: [{
          invoiceId,
          amount,
          currency,
          approvalLevels,
          metadata,
          requestedAt: new Date(),
        }],
        workflowId,
        workflowIdReusePolicy: WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_REJECT_DUPLICATE,
      });

      this.logger.log(`Started invoice approval workflow: ${workflowId}`);

      return {
        workflowId: handle.workflowId,
        status: ApprovalStatus.IN_PROGRESS,
        currentLevel: approvalLevels[0],
        approvals: [],
        rejections: [],
        nextApprover: approvalLevels[0]?.approvers?.[0],
      };
    } catch (error) {
      this.logger.error(`Failed to start invoice approval workflow:`, error);
      throw error;
    }
  }

  // Payment Approval Workflow
  async startPaymentApproval(
    paymentId: string,
    amount: number,
    currency = 'BDT',
    paymentMethod: string,
    metadata?: Record<string, any>,
  ): Promise<ApprovalResponse> {
    try {
      const approvalLevels = await this.getApprovalLevels('PAYMENT', amount, currency);
      const workflowId = `payment-approval-${paymentId}-${Date.now()}`;

      // Add additional approval for high-risk payment methods
      if (this.isHighRiskPaymentMethod(paymentMethod)) {
        approvalLevels.push({
          role: ApprovalRole.CFO,
          threshold: amount,
          currency,
        });
      }

      const handle = await this.client.start(WorkflowType.PAYMENT_APPROVAL, {
        taskQueue: this.taskQueue,
        args: [{
          paymentId,
          amount,
          currency,
          paymentMethod,
          approvalLevels,
          metadata,
          requestedAt: new Date(),
        }],
        workflowId,
      });

      return {
        workflowId: handle.workflowId,
        status: ApprovalStatus.IN_PROGRESS,
        currentLevel: approvalLevels[0],
        approvals: [],
        rejections: [],
      };
    } catch (error) {
      this.logger.error(`Failed to start payment approval workflow:`, error);
      throw error;
    }
  }

  // Journal Entry Approval Workflow
  async startJournalApproval(
    journalId: string,
    totalAmount: number,
    currency = 'BDT',
    journalType: string,
    metadata?: Record<string, any>,
  ): Promise<ApprovalResponse> {
    try {
      // Manual journal entries always require approval
      const approvalLevels = await this.getApprovalLevels('JOURNAL', totalAmount, currency);
      const workflowId = `journal-approval-${journalId}-${Date.now()}`;

      const handle = await this.client.start(WorkflowType.JOURNAL_APPROVAL, {
        taskQueue: this.taskQueue,
        args: [{
          journalId,
          totalAmount,
          currency,
          journalType,
          approvalLevels,
          metadata,
          requestedAt: new Date(),
        }],
        workflowId,
      });

      return {
        workflowId: handle.workflowId,
        status: ApprovalStatus.IN_PROGRESS,
        currentLevel: approvalLevels[0],
        approvals: [],
        rejections: [],
      };
    } catch (error) {
      this.logger.error(`Failed to start journal approval workflow:`, error);
      throw error;
    }
  }

  // Get Workflow Status
  async getApprovalStatus(workflowId: string): Promise<WorkflowStatus> {
    try {
      const handle = this.client.getHandle(workflowId);

      // Query workflow for current status
      const status = await handle.query<ApprovalStatus>('getStatus');
      const history = await handle.query<WorkflowHistoryItem[]>('getHistory');
      const currentActivity = await handle.query<string>('getCurrentActivity');
      const pendingActivities = await handle.query<string[]>('getPendingActivities');

      const description = await handle.describe();

      return {
        workflowId,
        status,
        startedAt: description.startTime || new Date(),
        updatedAt: new Date(),
        completedAt: description.closeTime,
        currentActivity,
        pendingActivities,
        history,
      };
    } catch (error) {
      this.logger.error(`Failed to get workflow status for ${workflowId}:`, error);
      throw error;
    }
  }

  // Approve or Reject
  async submitApprovalDecision(
    workflowId: string,
    approverId: string,
    decision: 'APPROVE' | 'REJECT',
    comments?: string,
    conditions?: string[],
  ): Promise<void> {
    try {
      const handle = this.client.getHandle(workflowId);

      await handle.signal('approvalDecision', {
        approverId,
        decision,
        comments,
        conditions,
        timestamp: new Date(),
      });

      this.logger.log(`Approval decision submitted for workflow ${workflowId}: ${decision}`);
    } catch (error) {
      this.logger.error(`Failed to submit approval decision:`, error);
      throw error;
    }
  }

  // Cancel Workflow
  async cancelWorkflow(workflowId: string, reason: string): Promise<void> {
    try {
      const handle = this.client.getHandle(workflowId);
      await handle.cancel();

      this.logger.log(`Cancelled workflow ${workflowId}: ${reason}`);
    } catch (error) {
      this.logger.error(`Failed to cancel workflow ${workflowId}:`, error);
      throw error;
    }
  }

  // Get Approval Matrix
  private async getApprovalLevels(
    entityType: string,
    amount: number,
    currency: string,
  ): Promise<ApprovalLevel[]> {
    // Bangladesh-specific approval matrix
    const approvalMatrix: Record<string, ApprovalRule[]> = {
      INVOICE: [
        {
          minAmount: 0,
          maxAmount: 50000,
          currency: 'BDT',
          levels: [{ role: ApprovalRole.SUPERVISOR, threshold: 50000 }],
        },
        {
          minAmount: 50001,
          maxAmount: 200000,
          currency: 'BDT',
          levels: [
            { role: ApprovalRole.SUPERVISOR, threshold: 50000 },
            { role: ApprovalRole.MANAGER, threshold: 200000 },
          ],
        },
        {
          minAmount: 200001,
          maxAmount: 1000000,
          currency: 'BDT',
          levels: [
            { role: ApprovalRole.SUPERVISOR, threshold: 50000 },
            { role: ApprovalRole.MANAGER, threshold: 200000 },
            { role: ApprovalRole.DIRECTOR, threshold: 1000000 },
          ],
        },
        {
          minAmount: 1000001,
          maxAmount: Number.MAX_SAFE_INTEGER,
          currency: 'BDT',
          levels: [
            { role: ApprovalRole.MANAGER, threshold: 200000 },
            { role: ApprovalRole.DIRECTOR, threshold: 1000000 },
            { role: ApprovalRole.CFO, threshold: 5000000 },
            { role: ApprovalRole.CEO, threshold: Number.MAX_SAFE_INTEGER },
          ],
        },
      ],
      PAYMENT: [
        {
          minAmount: 0,
          maxAmount: 100000,
          currency: 'BDT',
          levels: [{ role: ApprovalRole.SUPERVISOR, threshold: 100000 }],
        },
        {
          minAmount: 100001,
          maxAmount: 500000,
          currency: 'BDT',
          levels: [
            { role: ApprovalRole.SUPERVISOR, threshold: 100000 },
            { role: ApprovalRole.MANAGER, threshold: 500000 },
          ],
        },
        {
          minAmount: 500001,
          maxAmount: Number.MAX_SAFE_INTEGER,
          currency: 'BDT',
          levels: [
            { role: ApprovalRole.MANAGER, threshold: 500000 },
            { role: ApprovalRole.DIRECTOR, threshold: 2000000 },
            { role: ApprovalRole.CFO, threshold: Number.MAX_SAFE_INTEGER },
          ],
        },
      ],
      JOURNAL: [
        {
          minAmount: 0,
          maxAmount: Number.MAX_SAFE_INTEGER,
          currency: 'BDT',
          levels: [
            { role: ApprovalRole.SUPERVISOR, threshold: 100000 },
            { role: ApprovalRole.MANAGER, threshold: Number.MAX_SAFE_INTEGER },
          ],
        },
      ],
    };

    const rules = approvalMatrix[entityType] || approvalMatrix.INVOICE;
    const applicableRule = rules.find(
      rule => amount >= rule.minAmount && amount <= rule.maxAmount && rule.currency === currency
    );

    return applicableRule?.levels || [{ role: ApprovalRole.MANAGER, threshold: amount }];
  }

  // Check if payment method is high risk
  private isHighRiskPaymentMethod(method: string): boolean {
    const highRiskMethods = ['CASH', 'MOBILE_WALLET', 'CRYPTO'];
    return highRiskMethods.includes(method.toUpperCase());
  }

  // Delegate Approval
  async delegateApproval(
    workflowId: string,
    fromUserId: string,
    toUserId: string,
    reason: string,
  ): Promise<void> {
    try {
      const handle = this.client.getHandle(workflowId);

      await handle.signal('delegateApproval', {
        fromUserId,
        toUserId,
        reason,
        timestamp: new Date(),
      });

      this.logger.log(`Delegated approval in workflow ${workflowId} from ${fromUserId} to ${toUserId}`);
    } catch (error) {
      this.logger.error(`Failed to delegate approval:`, error);
      throw error;
    }
  }

  // Escalate Approval
  async escalateApproval(workflowId: string, reason: string): Promise<void> {
    try {
      const handle = this.client.getHandle(workflowId);

      await handle.signal('escalateApproval', {
        reason,
        timestamp: new Date(),
      });

      this.logger.log(`Escalated approval in workflow ${workflowId}: ${reason}`);
    } catch (error) {
      this.logger.error(`Failed to escalate approval:`, error);
      throw error;
    }
  }

  // Get Pending Approvals for User
  async getPendingApprovals(userId: string): Promise<ApprovalRequest[]> {
    try {
      // This would query Temporal's visibility API
      // For now, return mock data
      const response = await firstValueFrom(
        this.httpService.get(`${this.temporalAddress}/api/v1/pending-approvals/${userId}`).pipe(
          map(response => response.data),
        ),
      );

      return response;
    } catch (error) {
      this.logger.error(`Failed to get pending approvals for ${userId}:`, error);
      return [];
    }
  }
}