import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TemporalService } from './temporal.service';
import { StartWorkflowDto } from '../dto/start-workflow.dto';
import { SignalWorkflowDto } from '../dto/signal-workflow.dto';
import { QueryWorkflowDto } from '../dto/query-workflow.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(private readonly temporalService: TemporalService) {}

  async startWorkflow(tenantId: string, dto: StartWorkflowDto) {
    const workflowId = dto.workflowId || `${dto.workflowType}-${tenantId}-${uuidv4()}`;
    
    const searchAttributes = {
      ...dto.searchAttributes,
      TenantId: tenantId,
      WorkflowType: dto.workflowType,
    };

    const result = await this.temporalService.startWorkflow(
      dto.workflowType,
      dto.args,
      {
        workflowId,
        taskQueue: dto.taskQueue,
        memo: dto.memo,
        searchAttributes,
      },
    );

    this.logger.log(`Started workflow ${workflowId} for tenant ${tenantId}`);
    return result;
  }

  async listWorkflows(
    tenantId: string,
    options: { status?: string; page: number; limit: number },
  ) {
    let query = `TenantId = "${tenantId}"`;
    if (options.status) {
      query += ` AND WorkflowStatus = "${options.status}"`;
    }

    const workflows = await this.temporalService.listWorkflows(query, options.limit);
    
    return {
      data: workflows,
      total: workflows.length,
      page: options.page,
      limit: options.limit,
    };
  }

  async getWorkflow(tenantId: string, workflowId: string) {
    try {
      const handle = await this.temporalService.getWorkflowHandle(workflowId);
      const description = await handle.describe();
      
      // Verify tenant access
      const searchAttributes = description.searchAttributes?.TenantId;
      const tenantAttribute = Array.isArray(searchAttributes) 
        ? searchAttributes[0] 
        : searchAttributes;
      if (tenantAttribute && String(tenantAttribute) !== tenantId) {
        throw new NotFoundException(`Workflow ${workflowId} not found`);
      }

      return description;
    } catch (error) {
      this.logger.error(`Failed to get workflow ${workflowId}`, error);
      throw new NotFoundException(`Workflow ${workflowId} not found`);
    }
  }

  async getWorkflowHistory(tenantId: string, workflowId: string) {
    // First verify tenant access
    await this.getWorkflow(tenantId, workflowId);
    
    // Query workflow for history
    return this.temporalService.queryWorkflow(workflowId, 'approvalHistory');
  }

  async signalWorkflow(tenantId: string, workflowId: string, dto: SignalWorkflowDto) {
    // First verify tenant access
    await this.getWorkflow(tenantId, workflowId);
    
    return this.temporalService.signalWorkflow(workflowId, dto.signalName, dto.args);
  }

  async queryWorkflow(tenantId: string, workflowId: string, dto: QueryWorkflowDto) {
    // First verify tenant access
    await this.getWorkflow(tenantId, workflowId);
    
    return this.temporalService.queryWorkflow(workflowId, dto.queryType, dto.args);
  }

  async cancelWorkflow(tenantId: string, workflowId: string) {
    // First verify tenant access
    await this.getWorkflow(tenantId, workflowId);
    
    return this.temporalService.cancelWorkflow(workflowId);
  }

  async terminateWorkflow(tenantId: string, workflowId: string, reason: string) {
    // First verify tenant access
    await this.getWorkflow(tenantId, workflowId);

    return this.temporalService.terminateWorkflow(workflowId, reason);
  }

  // GraphQL resolver compatibility methods
  async findAll(tenantId: string, filters?: any) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const result = await this.listWorkflows(tenantId, {
      status: filters?.status,
      page,
      limit,
    });
    return {
      items: result.data,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  async findOne(tenantId: string, workflowId: string): Promise<any> {
    const workflow = await this.getWorkflow(tenantId, workflowId);
    return {
      id: workflowId,
      name: (workflow as any).workflowType || 'Workflow',
      description: '',
      type: 'standard',
      templateId: 'default-template',
      status: workflow.status,
      priority: 'medium',
      entityType: null,
      entityId: null,
      variables: JSON.stringify({}),
      metadata: JSON.stringify({}),
      startedAt: workflow.startTime,
      completedAt: null,
      dueDate: null,
      createdAt: workflow.startTime || new Date(),
      updatedAt: workflow.startTime || new Date(),
      createdBy: null,
      updatedBy: null,
      currentStep: 0,
      totalSteps: 1,
      error: null,
      temporalWorkflowId: workflowId,
      temporalRunId: (workflow as any).runId || null,
    };
  }

  async create(tenantId: string, data: any) {
    const workflowId = `workflow-${Date.now()}`;
    const now = new Date();
    // Store workflow definition (TODO: implement database storage)
    return {
      id: workflowId,
      name: data.name,
      description: data.description || null,
      type: data.type || 'standard',
      templateId: data.templateId || 'default-template',
      status: 'DRAFT',
      priority: data.priority || 'medium',
      entityType: data.entityType || null,
      entityId: data.entityId || null,
      variables: JSON.stringify(data.variables || {}),
      metadata: JSON.stringify(data.metadata || {}),
      startedAt: null,
      completedAt: null,
      dueDate: data.dueDate || null,
      createdAt: now,
      updatedAt: now,
      createdBy: data.createdBy || null,
      updatedBy: null,
      currentStep: 0,
      totalSteps: 1,
      error: null,
      temporalWorkflowId: null,
      temporalRunId: null,
    };
  }

  async update(tenantId: string, workflowId: string, data: any) {
    const now = new Date();
    // Update workflow definition (TODO: implement database storage)
    return {
      id: workflowId,
      name: data.name || 'Updated Workflow',
      description: data.description || null,
      type: data.type || 'standard',
      templateId: data.templateId || 'default-template',
      status: data.status || 'DRAFT',
      priority: data.priority || 'medium',
      entityType: data.entityType || null,
      entityId: data.entityId || null,
      variables: JSON.stringify(data.variables || {}),
      metadata: JSON.stringify(data.metadata || {}),
      startedAt: data.startedAt || null,
      completedAt: data.completedAt || null,
      dueDate: data.dueDate || null,
      createdAt: data.createdAt || now,
      updatedAt: now,
      createdBy: data.createdBy || null,
      updatedBy: data.updatedBy || null,
      currentStep: data.currentStep || 0,
      totalSteps: data.totalSteps || 1,
      error: data.error || null,
      temporalWorkflowId: data.temporalWorkflowId || null,
      temporalRunId: data.temporalRunId || null,
    };
  }

  async start(tenantId: string, workflowId: string, variables?: any) {
    const parsedVars = typeof variables === 'string' ? JSON.parse(variables) : variables;
    const result = await this.startWorkflow(tenantId, {
      workflowType: 'genericWorkflow',
      workflowId,
      args: [parsedVars],
      taskQueue: 'default',
    });
    const now = new Date();
    return {
      id: result.workflowId,
      name: 'Started Workflow',
      description: null,
      type: 'standard',
      templateId: 'default-template',
      status: 'RUNNING',
      priority: 'medium',
      entityType: null,
      entityId: null,
      variables: JSON.stringify(parsedVars || {}),
      metadata: JSON.stringify({}),
      startedAt: now,
      completedAt: null,
      dueDate: null,
      createdAt: now,
      updatedAt: now,
      createdBy: null,
      updatedBy: null,
      currentStep: 1,
      totalSteps: 1,
      error: null,
      temporalWorkflowId: result.workflowId,
      temporalRunId: (result as any).runId || null,
    };
  }

  async cancel(tenantId: string, workflowId: string, reason?: string) {
    await this.cancelWorkflow(tenantId, workflowId);
    const now = new Date();
    return {
      id: workflowId,
      name: 'Cancelled Workflow',
      description: reason || null,
      type: 'standard',
      templateId: 'default-template',
      status: 'CANCELLED',
      priority: 'medium',
      entityType: null,
      entityId: null,
      variables: JSON.stringify({}),
      metadata: JSON.stringify({}),
      startedAt: null,
      completedAt: now,
      dueDate: null,
      createdAt: now,
      updatedAt: now,
      createdBy: null,
      updatedBy: null,
      currentStep: 0,
      totalSteps: 1,
      error: reason || null,
      temporalWorkflowId: workflowId,
      temporalRunId: null,
    };
  }

  async retry(tenantId: string, workflowId: string) {
    // TODO: Implement retry logic
    const now = new Date();
    return {
      id: workflowId,
      name: 'Retried Workflow',
      description: null,
      type: 'standard',
      templateId: 'default-template',
      status: 'RUNNING',
      priority: 'medium',
      entityType: null,
      entityId: null,
      variables: JSON.stringify({}),
      metadata: JSON.stringify({}),
      startedAt: now,
      completedAt: null,
      dueDate: null,
      createdAt: now,
      updatedAt: now,
      createdBy: null,
      updatedBy: null,
      currentStep: 1,
      totalSteps: 1,
      error: null,
      temporalWorkflowId: workflowId,
      temporalRunId: null,
    };
  }

  async getHistory(tenantId: string, workflowId: string) {
    const history = await this.getWorkflowHistory(tenantId, workflowId);
    return Array.isArray(history) ? history : [];
  }

  async remove(tenantId: string, workflowId: string) {
    // TODO: Implement soft delete
    this.logger.log(`Deleting workflow ${workflowId} for tenant ${tenantId}`);
    return true;
  }

  async findByStatus(tenantId: string, status: string) {
    const result = await this.listWorkflows(tenantId, {
      status,
      page: 1,
      limit: 100,
    });
    return result.data.map((wf: any) => ({
      id: wf.workflowId || wf.id,
      name: wf.workflowType || 'Workflow',
      description: null,
      type: 'standard',
      templateId: 'default-template',
      status: wf.status,
      priority: 'medium',
      entityType: null,
      entityId: null,
      variables: JSON.stringify({}),
      metadata: JSON.stringify({}),
      startedAt: wf.startTime || null,
      completedAt: null,
      dueDate: null,
      createdAt: wf.startTime || new Date(),
      updatedAt: wf.startTime || new Date(),
      createdBy: null,
      updatedBy: null,
      currentStep: 0,
      totalSteps: 1,
      error: null,
      temporalWorkflowId: wf.workflowId || wf.id,
      temporalRunId: wf.runId || null,
    }));
  }

  // Specific workflow starters
  async startPurchaseOrderWorkflow(
    tenantId: string,
    data: {
      vendorId: string;
      amount: number;
      currency?: string;
      items: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
      }>;
      requestedBy: string;
      department: string;
    },
  ) {
    const workflowId = `po-${tenantId}-${uuidv4()}`;
    
    return this.temporalService.startWorkflow(
      'purchaseOrderApprovalWorkflow',
      [{
        id: workflowId,
        tenantId,
        ...data,
        currency: data.currency || 'BDT',
      }],
      {
        workflowId,
        searchAttributes: {
          TenantId: tenantId,
          WorkflowType: 'PurchaseOrderApproval',
          Department: data.department,
          Amount: data.amount,
          VendorId: data.vendorId,
        },
      },
    );
  }

  async startInvoiceApprovalWorkflow(
    tenantId: string,
    data: {
      invoiceId: string;
      vendorId: string;
      amount: number;
      poNumber?: string;
      dueDate: Date;
    },
  ) {
    const workflowId = `invoice-${tenantId}-${data.invoiceId}`;
    
    return this.temporalService.startWorkflow(
      'invoiceApprovalWorkflow',
      [{
        ...data,
        tenantId,
      }],
      {
        workflowId,
        searchAttributes: {
          TenantId: tenantId,
          WorkflowType: 'InvoiceApproval',
          InvoiceId: data.invoiceId,
          VendorId: data.vendorId,
          Amount: data.amount,
        },
      },
    );
  }

  async startLeaveRequestWorkflow(
    tenantId: string,
    data: {
      employeeId: string;
      leaveType: string;
      startDate: Date;
      endDate: Date;
      reason: string;
    },
  ) {
    const workflowId = `leave-${tenantId}-${data.employeeId}-${uuidv4()}`;
    
    return this.temporalService.startWorkflow(
      'leaveRequestWorkflow',
      [{
        ...data,
        tenantId,
      }],
      {
        workflowId,
        searchAttributes: {
          TenantId: tenantId,
          WorkflowType: 'LeaveRequest',
          EmployeeId: data.employeeId,
          LeaveType: data.leaveType,
        },
      },
    );
  }

  async startExpenseReimbursementWorkflow(
    tenantId: string,
    data: {
      employeeId: string;
      totalAmount: number;
      expenses: Array<{
        category: string;
        amount: number;
        description: string;
        receiptUrl?: string;
      }>;
    },
  ) {
    const workflowId = `expense-${tenantId}-${data.employeeId}-${uuidv4()}`;
    
    return this.temporalService.startWorkflow(
      'expenseReimbursementWorkflow',
      [{
        ...data,
        tenantId,
      }],
      {
        workflowId,
        searchAttributes: {
          TenantId: tenantId,
          WorkflowType: 'ExpenseReimbursement',
          EmployeeId: data.employeeId,
          TotalAmount: data.totalAmount,
        },
      },
    );
  }

  async approveWorkflow(
    tenantId: string,
    workflowId: string,
    data: { approver: string; comments?: string },
  ) {
    // First verify tenant access
    await this.getWorkflow(tenantId, workflowId);
    
    return this.temporalService.signalWorkflow(workflowId, 'approve', [data]);
  }

  async rejectWorkflow(
    tenantId: string,
    workflowId: string,
    data: { approver: string; reason: string },
  ) {
    // First verify tenant access
    await this.getWorkflow(tenantId, workflowId);
    
    return this.temporalService.signalWorkflow(workflowId, 'reject', [data]);
  }
}