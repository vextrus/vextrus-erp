import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, TenantContext, CurrentTenant } from '../auth';
import { WorkflowService } from '../services/workflow.service';
import { StartWorkflowDto } from '../dto/start-workflow.dto';
import { SignalWorkflowDto } from '../dto/signal-workflow.dto';
import { QueryWorkflowDto } from '../dto/query-workflow.dto';

@ApiTags('Workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a new workflow' })
  @ApiResponse({ status: 201, description: 'Workflow started successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async startWorkflow(
    @CurrentTenant() tenant: TenantContext,
    @Body() startWorkflowDto: StartWorkflowDto,
  ) {
    return this.workflowService.startWorkflow(tenant.id, startWorkflowDto);
  }

  @Get()
  @ApiOperation({ summary: 'List workflows' })
  @ApiResponse({ status: 200, description: 'List of workflows' })
  async listWorkflows(
    @CurrentTenant() tenant: TenantContext,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.workflowService.listWorkflows(tenant.id, { status, page, limit });
  }

  @Get(':workflowId')
  @ApiOperation({ summary: 'Get workflow details' })
  @ApiResponse({ status: 200, description: 'Workflow details' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async getWorkflow(
    @CurrentTenant() tenant: TenantContext,
    @Param('workflowId') workflowId: string,
  ) {
    return this.workflowService.getWorkflow(tenant.id, workflowId);
  }

  @Get(':workflowId/history')
  @ApiOperation({ summary: 'Get workflow execution history' })
  @ApiResponse({ status: 200, description: 'Workflow history' })
  async getWorkflowHistory(
    @CurrentTenant() tenant: TenantContext,
    @Param('workflowId') workflowId: string,
  ) {
    return this.workflowService.getWorkflowHistory(tenant.id, workflowId);
  }

  @Post(':workflowId/signal')
  @ApiOperation({ summary: 'Send signal to workflow' })
  @ApiResponse({ status: 200, description: 'Signal sent successfully' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async signalWorkflow(
    @CurrentTenant() tenant: TenantContext,
    @Param('workflowId') workflowId: string,
    @Body() signalDto: SignalWorkflowDto,
  ) {
    return this.workflowService.signalWorkflow(tenant.id, workflowId, signalDto);
  }

  @Post(':workflowId/query')
  @ApiOperation({ summary: 'Query workflow state' })
  @ApiResponse({ status: 200, description: 'Query result' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async queryWorkflow(
    @CurrentTenant() tenant: TenantContext,
    @Param('workflowId') workflowId: string,
    @Body() queryDto: QueryWorkflowDto,
  ) {
    return this.workflowService.queryWorkflow(tenant.id, workflowId, queryDto);
  }

  @Put(':workflowId/cancel')
  @ApiOperation({ summary: 'Cancel workflow' })
  @ApiResponse({ status: 200, description: 'Workflow cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async cancelWorkflow(
    @CurrentTenant() tenant: TenantContext,
    @Param('workflowId') workflowId: string,
  ) {
    return this.workflowService.cancelWorkflow(tenant.id, workflowId);
  }

  @Delete(':workflowId/terminate')
  @ApiOperation({ summary: 'Terminate workflow' })
  @ApiResponse({ status: 200, description: 'Workflow terminated successfully' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async terminateWorkflow(
    @CurrentTenant() tenant: TenantContext,
    @Param('workflowId') workflowId: string,
    @Body() data: { reason: string },
  ) {
    return this.workflowService.terminateWorkflow(tenant.id, workflowId, data.reason);
  }

  @Post('purchase-order')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start purchase order approval workflow' })
  @ApiResponse({ status: 201, description: 'Purchase order workflow started' })
  async startPurchaseOrderWorkflow(
    @CurrentTenant() tenant: TenantContext,
    @Body() data: {
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
    return this.workflowService.startPurchaseOrderWorkflow(tenant.id, data);
  }

  @Post('invoice-approval')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start invoice approval workflow' })
  @ApiResponse({ status: 201, description: 'Invoice approval workflow started' })
  async startInvoiceApprovalWorkflow(
    @CurrentTenant() tenant: TenantContext,
    @Body() data: {
      invoiceId: string;
      vendorId: string;
      amount: number;
      poNumber?: string;
      dueDate: Date;
    },
  ) {
    return this.workflowService.startInvoiceApprovalWorkflow(tenant.id, data);
  }

  @Post('leave-request')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start leave request workflow' })
  @ApiResponse({ status: 201, description: 'Leave request workflow started' })
  async startLeaveRequestWorkflow(
    @CurrentTenant() tenant: TenantContext,
    @Body() data: {
      employeeId: string;
      leaveType: string;
      startDate: Date;
      endDate: Date;
      reason: string;
    },
  ) {
    return this.workflowService.startLeaveRequestWorkflow(tenant.id, data);
  }

  @Post('expense-reimbursement')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start expense reimbursement workflow' })
  @ApiResponse({ status: 201, description: 'Expense reimbursement workflow started' })
  async startExpenseReimbursementWorkflow(
    @CurrentTenant() tenant: TenantContext,
    @Body() data: {
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
    return this.workflowService.startExpenseReimbursementWorkflow(tenant.id, data);
  }

  @Post(':workflowId/approve')
  @ApiOperation({ summary: 'Approve workflow task' })
  @ApiResponse({ status: 200, description: 'Approval sent successfully' })
  async approveWorkflow(
    @CurrentTenant() tenant: TenantContext,
    @Param('workflowId') workflowId: string,
    @Body() data: { approver: string; comments?: string },
  ) {
    return this.workflowService.approveWorkflow(tenant.id, workflowId, data);
  }

  @Post(':workflowId/reject')
  @ApiOperation({ summary: 'Reject workflow task' })
  @ApiResponse({ status: 200, description: 'Rejection sent successfully' })
  async rejectWorkflow(
    @CurrentTenant() tenant: TenantContext,
    @Param('workflowId') workflowId: string,
    @Body() data: { approver: string; reason: string },
  ) {
    return this.workflowService.rejectWorkflow(tenant.id, workflowId, data);
  }
}