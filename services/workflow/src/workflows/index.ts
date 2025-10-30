import { dirname } from 'path';

// Export workflows with specific names to avoid conflicts
export {
  purchaseOrderApprovalWorkflow,
  ApprovalStep as PurchaseOrderApprovalStep,
  approveSignal as purchaseOrderApproveSignal,
  rejectSignal as purchaseOrderRejectSignal,
  statusQuery as purchaseOrderStatusQuery,
  approvalHistoryQuery as purchaseOrderApprovalHistoryQuery
} from './purchase-order-approval.workflow';

export {
  invoiceApprovalWorkflow,
  ApprovalStep as InvoiceApprovalStep,
  approveSignal as invoiceApproveSignal,
  rejectSignal as invoiceRejectSignal,
  statusQuery as invoiceStatusQuery,
  approvalHistoryQuery as invoiceApprovalHistoryQuery
} from './invoice-approval.workflow';

export {
  employeeOnboardingWorkflow,
  completeTaskSignal,
  skipTaskSignal,
  statusQuery as onboardingStatusQuery,
  tasksQuery as onboardingTasksQuery
} from './employee-onboarding.workflow';

// Helper function to get workflows path for Temporal worker
export function getWorkflowsPath(): string {
  // For CommonJS modules
  return __dirname;
}