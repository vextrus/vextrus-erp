import { proxyActivities, defineSignal, defineQuery, setHandler, condition, sleep } from '@temporalio/workflow';
import type * as activities from '../activities';

// Define workflow signals
export const approveSignal = defineSignal<[{ approver: string; comments?: string }]>('approve');
export const rejectSignal = defineSignal<[{ approver: string; reason: string }]>('reject');

// Define workflow queries
export const statusQuery = defineQuery<string>('status');
export const approvalHistoryQuery = defineQuery<any[]>('approvalHistory');

export interface PurchaseOrderInput {
  id: string;
  tenantId: string;
  vendorId: string;
  amount: number;
  currency: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  requestedBy: string;
  department: string;
}

export interface ApprovalStep {
  role: string;
  approver?: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  timestamp?: Date;
}

const { 
  validateBudget,
  notifyApprover,
  createPurchaseOrder,
  notifyVendor,
  notifyRequester,
  recordAudit,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
});

export async function purchaseOrderApprovalWorkflow(input: PurchaseOrderInput): Promise<{
  status: 'approved' | 'rejected';
  poNumber?: string;
  reason?: string;
  approvalHistory: ApprovalStep[];
}> {
  let workflowStatus = 'pending';
  const approvalHistory: ApprovalStep[] = [];

  // Set up query handlers
  setHandler(statusQuery, () => workflowStatus);
  setHandler(approvalHistoryQuery, () => approvalHistory);

  try {
    // Step 1: Validate budget
    workflowStatus = 'validating_budget';
    const budgetValidation = await validateBudget({
      tenantId: input.tenantId,
      department: input.department,
      amount: input.amount,
    });

    if (!budgetValidation.approved) {
      workflowStatus = 'rejected';
      await notifyRequester({
        userId: input.requestedBy,
        message: `Purchase order rejected: ${budgetValidation.reason}`,
      });
      return {
        status: 'rejected',
        reason: budgetValidation.reason,
        approvalHistory,
      };
    }

    // Step 2: Department Head approval (if amount > 50,000 BDT)
    if (input.amount > 50000) {
      workflowStatus = 'awaiting_department_approval';
      const deptApproval: ApprovalStep = {
        role: 'department_head',
        status: 'pending',
      };
      approvalHistory.push(deptApproval);

      await notifyApprover({
        role: 'department_head',
        department: input.department,
        workflowId: input.id,
        amount: input.amount,
      });

      // Wait for approval signal with timeout
      const deptApproved = await Promise.race([
        waitForApproval('department_head'),
        sleep('7 days').then(() => ({ approved: false, reason: 'Timeout - no response from department head' })),
      ]);

      if (!deptApproved.approved) {
        deptApproval.status = 'rejected';
        deptApproval.comments = deptApproved.reason;
        deptApproval.timestamp = new Date();
        workflowStatus = 'rejected';
        
        await notifyRequester({
          userId: input.requestedBy,
          message: `Purchase order rejected by department head: ${deptApproved.reason}`,
        });
        
        return {
          status: 'rejected',
          reason: deptApproved.reason,
          approvalHistory,
        };
      }

      deptApproval.status = 'approved';
      deptApproval.approver = 'approver' in deptApproved ? deptApproved.approver : undefined;
      deptApproval.comments = 'comments' in deptApproved ? deptApproved.comments : undefined;
      deptApproval.timestamp = new Date();
    }

    // Step 3: Finance approval (if amount > 100,000 BDT)
    if (input.amount > 100000) {
      workflowStatus = 'awaiting_finance_approval';
      const financeApproval: ApprovalStep = {
        role: 'finance',
        status: 'pending',
      };
      approvalHistory.push(financeApproval);

      await notifyApprover({
        role: 'finance',
        department: 'finance',
        workflowId: input.id,
        amount: input.amount,
      });

      // Wait for approval signal with timeout
      const financeApproved = await Promise.race([
        waitForApproval('finance'),
        sleep('7 days').then(() => ({ approved: false, reason: 'Timeout - no response from finance' })),
      ]);

      if (!financeApproved.approved) {
        financeApproval.status = 'rejected';
        financeApproval.comments = financeApproved.reason;
        financeApproval.timestamp = new Date();
        workflowStatus = 'rejected';
        
        await notifyRequester({
          userId: input.requestedBy,
          message: `Purchase order rejected by finance: ${financeApproved.reason}`,
        });
        
        return {
          status: 'rejected',
          reason: financeApproved.reason,
          approvalHistory,
        };
      }

      financeApproval.status = 'approved';
      financeApproval.approver = 'approver' in financeApproved ? financeApproved.approver : undefined;
      financeApproval.comments = 'comments' in financeApproved ? financeApproved.comments : undefined;
      financeApproval.timestamp = new Date();
    }

    // Step 4: Create purchase order
    workflowStatus = 'creating_po';
    const poResult = await createPurchaseOrder(input);

    // Step 5: Notify vendor
    workflowStatus = 'notifying_vendor';
    await notifyVendor({
      vendorId: input.vendorId,
      poNumber: poResult.poNumber,
      amount: input.amount,
    });

    // Step 6: Notify requester
    await notifyRequester({
      userId: input.requestedBy,
      message: `Purchase order approved. PO Number: ${poResult.poNumber}`,
    });

    // Step 7: Record audit trail
    await recordAudit({
      entityType: 'purchase_order',
      entityId: poResult.poNumber,
      action: 'approved',
      userId: input.requestedBy,
      metadata: { approvalHistory },
    });

    workflowStatus = 'completed';
    return {
      status: 'approved',
      poNumber: poResult.poNumber,
      approvalHistory,
    };
  } catch (error) {
    workflowStatus = 'error';
    throw error;
  }
}

// Helper function to wait for approval signal
async function waitForApproval(role: string): Promise<{
  approved: boolean;
  approver?: string;
  reason?: string;
  comments?: string;
}> {
  return new Promise((resolve) => {
    let approved = false;
    let rejected = false;
    let result: any = {};

    setHandler(approveSignal, (data) => {
      if (!approved && !rejected) {
        approved = true;
        result = {
          approved: true,
          approver: data.approver,
          comments: data.comments,
        };
        resolve(result);
      }
    });

    setHandler(rejectSignal, (data) => {
      if (!approved && !rejected) {
        rejected = true;
        result = {
          approved: false,
          approver: data.approver,
          reason: data.reason,
        };
        resolve(result);
      }
    });
  });
}