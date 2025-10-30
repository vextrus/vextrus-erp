import { proxyActivities, defineSignal, defineQuery, setHandler, sleep } from '@temporalio/workflow';
import type * as activities from '../activities';

// Define workflow signals
export const approveSignal = defineSignal<[{ approver: string; comments?: string }]>('approve');
export const rejectSignal = defineSignal<[{ approver: string; reason: string }]>('reject');
export const requestInfoSignal = defineSignal<[{ requestedBy: string; question: string }]>('requestInfo');

// Define workflow queries
export const statusQuery = defineQuery<string>('status');
export const approvalHistoryQuery = defineQuery<any[]>('approvalHistory');
export const invoiceDetailsQuery = defineQuery<any>('invoiceDetails');

export interface InvoiceApprovalInput {
  invoiceId: string;
  tenantId: string;
  vendorId: string;
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  poNumber?: string;
  department: string;
  projectId?: string;
  submittedBy: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}

export interface ApprovalStep {
  level: number;
  role: string;
  approver?: string;
  status: 'pending' | 'approved' | 'rejected' | 'info_requested';
  comments?: string;
  timestamp?: Date;
  amount?: number;
}

const {
  validateInvoiceData,
  matchPurchaseOrder,
  checkDuplicateInvoice,
  validateVendorStatus,
  checkBudgetAvailability,
  notifyApprover,
  createPaymentRecord,
  updateGeneralLedger,
  notifyAccountsPayable,
  notifySubmitter,
  recordAudit,
  calculateTaxWithholding,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
});

export async function invoiceApprovalWorkflow(input: InvoiceApprovalInput): Promise<{
  status: 'approved' | 'rejected' | 'on_hold';
  paymentId?: string;
  reason?: string;
  approvalHistory: ApprovalStep[];
  taxWithholding?: number;
  netPayableAmount?: number;
}> {
  let workflowStatus = 'initializing';
  const approvalHistory: ApprovalStep[] = [];
  let invoiceDetails = { ...input };

  // Set up query handlers
  setHandler(statusQuery, () => workflowStatus);
  setHandler(approvalHistoryQuery, () => approvalHistory);
  setHandler(invoiceDetailsQuery, () => invoiceDetails);

  try {
    // Step 1: Validate invoice data (Bangladesh specific)
    workflowStatus = 'validating_invoice';
    const validation = await validateInvoiceData({
      tenantId: input.tenantId,
      invoiceNumber: input.invoiceNumber,
      vendorId: input.vendorId,
      amount: input.amount,
      vatAmount: input.vatAmount,
      totalAmount: input.totalAmount,
    });

    if (!validation.valid) {
      workflowStatus = 'rejected';
      await notifySubmitter({
        userId: input.submittedBy,
        invoiceId: input.invoiceId,
        status: 'rejected' as const,
        reason: validation.errors.join(', '),
      });
      return {
        status: 'rejected',
        reason: validation.errors.join(', '),
        approvalHistory,
      };
    }

    // Step 2: Check for duplicate invoice
    workflowStatus = 'checking_duplicate';
    const duplicateCheck = await checkDuplicateInvoice({
      vendorId: input.vendorId,
      invoiceNumber: input.invoiceNumber,
      amount: input.totalAmount,
    });

    if (duplicateCheck.isDuplicate) {
      workflowStatus = 'rejected';
      await notifySubmitter({
        userId: input.submittedBy,
        invoiceId: input.invoiceId,
        status: 'rejected' as const,
        reason: `Duplicate invoice detected: ${duplicateCheck.existingInvoiceId}`,
      });
      return {
        status: 'rejected',
        reason: `Duplicate invoice: ${duplicateCheck.existingInvoiceId}`,
        approvalHistory,
      };
    }

    // Step 3: Validate vendor status
    workflowStatus = 'validating_vendor';
    const vendorStatus = await validateVendorStatus({
      vendorId: input.vendorId,
    });

    if (!vendorStatus.active) {
      workflowStatus = 'on_hold';
      const vendorApproval: ApprovalStep = {
        level: 0,
        role: 'vendor_management',
        status: 'info_requested',
        comments: `Vendor ${input.vendorName} is inactive: ${vendorStatus.reason || 'Status verification required'}`,
        timestamp: new Date(),
      };
      approvalHistory.push(vendorApproval);

      await notifySubmitter({
        userId: input.submittedBy,
        invoiceId: input.invoiceId,
        status: 'rejected' as const,
        reason: `Invoice on hold: Vendor is inactive - ${vendorStatus.reason || 'Status verification required'}`,
      });

      return {
        status: 'on_hold',
        reason: vendorStatus.reason || 'Vendor status verification required',
        approvalHistory,
      };
    }

    // Step 4: Match with Purchase Order (if provided)
    if (input.poNumber) {
      workflowStatus = 'matching_po';
      const poMatch = await matchPurchaseOrder({
        invoiceId: input.invoiceId,
        poNumber: input.poNumber,
        amount: input.totalAmount,
      });

      if (!poMatch.matches) {
        const poApproval: ApprovalStep = {
          level: 0,
          role: 'po_verification',
          status: 'rejected',
          comments: poMatch.variance ? `Amount variance: ${poMatch.variance}` : 'PO mismatch',
          timestamp: new Date(),
        };
        approvalHistory.push(poApproval);

        if (poMatch.variance && poMatch.variance > 1000) {
          // Amount mismatch requires manual approval
          workflowStatus = 'awaiting_po_approval';
          await notifyApprover({
            role: 'accounts_payable',
            department: 'finance',
            workflowId: input.invoiceId,
            amount: input.totalAmount,
          });

          // Wait for approval with timeout
          const poApprovalResult = await Promise.race([
            waitForApproval('po_verification'),
            sleep('3 days' as any).then(() => ({
              approved: false,
              reason: 'Timeout - PO verification not completed'
            })),
          ]);

          if (!poApprovalResult.approved) {
            workflowStatus = 'rejected';
            return {
              status: 'rejected',
              reason: poApprovalResult.reason,
              approvalHistory,
            };
          }
        }
      }
    }

    // Step 5: Calculate tax withholding (Bangladesh specific)
    workflowStatus = 'calculating_tax';
    const taxWithholding = await calculateTaxWithholding({
      vendorId: input.vendorId,
      vendorType: 'local', // Default to local vendor type, can be enhanced later
      amount: input.totalAmount,
    });

    const netPayableAmount = input.totalAmount - taxWithholding.taxAmount;

    // Step 6: Check budget availability
    workflowStatus = 'checking_budget';
    const budgetCheck = await checkBudgetAvailability({
      department: input.department,
      amount: netPayableAmount,
      budgetCategory: input.projectId || 'GENERAL',
    });

    if (!budgetCheck.available) {
      workflowStatus = 'rejected';
      await notifySubmitter({
        userId: input.submittedBy,
        invoiceId: input.invoiceId,
        status: 'rejected' as const,
        reason: `Insufficient budget. Available: ${budgetCheck.remaining || 0} ${input.currency}`,
      });
      return {
        status: 'rejected',
        reason: `Insufficient budget. Available: ${budgetCheck.remaining || 0} ${input.currency}`,
        approvalHistory,
      };
    }

    // Step 7: Approval hierarchy based on amount (Bangladesh Taka thresholds)
    const approvalLevels = getApprovalLevels(input.totalAmount);

    for (const level of approvalLevels) {
      workflowStatus = `awaiting_${level.role}_approval`;
      const approval: ApprovalStep = {
        level: level.level,
        role: level.role,
        status: 'pending',
        amount: input.totalAmount,
      };
      approvalHistory.push(approval);

      await notifyApprover({
        role: level.role,
        department: input.department,
        workflowId: input.invoiceId,
        amount: input.totalAmount,
      });

      // Wait for approval signal with timeout
      const approvalResult = await Promise.race([
        waitForApproval(level.role),
        sleep(level.timeout as any).then(() => ({
          approved: false,
          reason: `Timeout - no response from ${level.role}`
        })),
      ]);

      if (!approvalResult.approved) {
        approval.status = 'rejected';
        approval.comments = approvalResult.reason;
        approval.timestamp = new Date();
        workflowStatus = 'rejected';

        await notifySubmitter({
          userId: input.submittedBy,
          invoiceId: input.invoiceId,
          status: 'rejected' as const,
          reason: `${level.role}: ${approvalResult.reason}`,
        });

        return {
          status: 'rejected',
          reason: approvalResult.reason,
          approvalHistory,
        };
      }

      approval.status = 'approved';
      approval.approver = (approvalResult as any).approver;
      approval.comments = (approvalResult as any).comments;
      approval.timestamp = new Date();
    }

    // Step 8: Create payment record
    workflowStatus = 'creating_payment';
    const paymentRecord = await createPaymentRecord({
      invoiceId: input.invoiceId,
      vendorId: input.vendorId,
      amount: input.totalAmount,
      paymentMethod: 'ELECTRONIC',
    });

    // Step 9: Update general ledger
    workflowStatus = 'updating_ledger';
    await updateGeneralLedger({
      transactionType: 'INVOICE',
      amount: input.totalAmount,
      accountCode: 'AP-001',
      description: `Invoice ${input.invoiceNumber} from ${input.vendorName}`,
    });

    // Step 10: Notify accounts payable
    await notifyAccountsPayable({
      invoiceId: input.invoiceId,
      vendorId: input.vendorId,
      amount: netPayableAmount,
      dueDate: new Date(input.dueDate),
    });

    // Step 11: Notify submitter
    await notifySubmitter({
      userId: input.submittedBy,
      invoiceId: input.invoiceId,
      status: 'approved' as const,
    });

    // Step 12: Record audit trail
    await recordAudit({
      entityType: 'invoice',
      entityId: input.invoiceId,
      action: 'approved',
      userId: input.submittedBy,
      metadata: {
        approvalHistory,
        taxWithholding: taxWithholding.taxAmount,
        netPayableAmount,
        paymentId: paymentRecord.paymentId,
      },
    });

    workflowStatus = 'completed';
    return {
      status: 'approved',
      paymentId: paymentRecord.paymentId,
      approvalHistory,
      taxWithholding: taxWithholding.taxAmount,
      netPayableAmount,
    };
  } catch (error) {
    workflowStatus = 'error';
    throw error;
  }
}

// Helper function to determine approval levels based on amount (BDT)
function getApprovalLevels(amount: number): Array<{
  level: number;
  role: string;
  timeout: string;
}> {
  const levels = [];

  // Always require accounts payable approval
  levels.push({
    level: 1,
    role: 'accounts_payable',
    timeout: '2 days',
  });

  // Department head for amounts > 100,000 BDT
  if (amount > 100000) {
    levels.push({
      level: 2,
      role: 'department_head',
      timeout: '3 days',
    });
  }

  // Finance manager for amounts > 500,000 BDT
  if (amount > 500000) {
    levels.push({
      level: 3,
      role: 'finance_manager',
      timeout: '3 days',
    });
  }

  // CFO for amounts > 1,000,000 BDT
  if (amount > 1000000) {
    levels.push({
      level: 4,
      role: 'cfo',
      timeout: '5 days',
    });
  }

  // CEO for amounts > 5,000,000 BDT
  if (amount > 5000000) {
    levels.push({
      level: 5,
      role: 'ceo',
      timeout: '7 days',
    });
  }

  return levels;
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