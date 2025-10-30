import { WorkflowClient, WorkflowHandle } from '@temporalio/client';
import { Worker } from '@temporalio/worker';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { v4 as uuidv4 } from 'uuid';
import * as activities from '../src/activities';
import * as workflows from '../src/workflows';

describe('Workflow Integration Tests', () => {
  let testEnv: TestWorkflowEnvironment;
  let client: WorkflowClient;
  let worker: Worker;

  beforeAll(async () => {
    // Start test environment
    testEnv = await TestWorkflowEnvironment.createLocal();

    // Create client
    client = testEnv.workflowClient;

    // Create worker
    worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue: 'test-queue',
      workflowsPath: require.resolve('../src/workflows'),
      activities,
    });

    // Start worker
    await worker.run();
  }, 30000);

  afterAll(async () => {
    await testEnv?.teardown();
  });

  describe('Purchase Order Approval Workflow', () => {
    it('should approve PO below auto-approval threshold', async () => {
      const workflowId = `po-test-${uuidv4()}`;

      const handle = await client.start(workflows.purchaseOrderApproval, {
        taskQueue: 'test-queue',
        workflowId,
        args: [{
          orderId: 'PO-001',
          vendorId: 'V-001',
          amount: 50000, // Below 100,000 BDT threshold
          currency: 'BDT',
          items: [
            { itemId: 'ITEM-001', quantity: 10, unitPrice: 5000 }
          ],
          requestedBy: 'user@vextrus.com',
          department: 'Engineering',
        }],
      });

      const result = await handle.result();

      expect(result.status).toBe('approved');
      expect(result.approvedBy).toBe('auto-approved');
      expect(result.approvalLevel).toBe(0);
    });

    it('should require manager approval for PO above threshold', async () => {
      const workflowId = `po-test-${uuidv4()}`;

      const handle = await client.start(workflows.purchaseOrderApproval, {
        taskQueue: 'test-queue',
        workflowId,
        args: [{
          orderId: 'PO-002',
          vendorId: 'V-002',
          amount: 500000, // Above 100,000 BDT, requires manager
          currency: 'BDT',
          items: [
            { itemId: 'ITEM-002', quantity: 100, unitPrice: 5000 }
          ],
          requestedBy: 'user@vextrus.com',
          department: 'Engineering',
        }],
      });

      // Simulate manager approval
      await handle.signal(workflows.approvalSignal, {
        approved: true,
        approvedBy: 'manager@vextrus.com',
        comments: 'Approved for Q1 budget',
      });

      const result = await handle.result();

      expect(result.status).toBe('approved');
      expect(result.approvedBy).toBe('manager@vextrus.com');
      expect(result.approvalLevel).toBe(1);
    });

    it('should handle rejection correctly', async () => {
      const workflowId = `po-test-${uuidv4()}`;

      const handle = await client.start(workflows.purchaseOrderApproval, {
        taskQueue: 'test-queue',
        workflowId,
        args: [{
          orderId: 'PO-003',
          vendorId: 'V-003',
          amount: 2000000, // Requires director approval
          currency: 'BDT',
          items: [
            { itemId: 'ITEM-003', quantity: 200, unitPrice: 10000 }
          ],
          requestedBy: 'user@vextrus.com',
          department: 'Engineering',
        }],
      });

      // Simulate rejection
      await handle.signal(workflows.approvalSignal, {
        approved: false,
        approvedBy: 'director@vextrus.com',
        comments: 'Budget exceeded for this quarter',
      });

      const result = await handle.result();

      expect(result.status).toBe('rejected');
      expect(result.approvedBy).toBe('director@vextrus.com');
      expect(result.rejectionReason).toBe('Budget exceeded for this quarter');
    });

    it('should handle timeout appropriately', async () => {
      const workflowId = `po-test-${uuidv4()}`;

      // Use shorter timeout for testing
      const handle = await client.start(workflows.purchaseOrderApproval, {
        taskQueue: 'test-queue',
        workflowId,
        workflowExecutionTimeout: '5s',
        args: [{
          orderId: 'PO-004',
          vendorId: 'V-004',
          amount: 500000,
          currency: 'BDT',
          items: [
            { itemId: 'ITEM-004', quantity: 50, unitPrice: 10000 }
          ],
          requestedBy: 'user@vextrus.com',
          department: 'Engineering',
        }],
      });

      // Don't send approval signal, let it timeout
      await expect(handle.result()).rejects.toThrow();
    });
  });

  describe('Invoice Approval Workflow', () => {
    it('should calculate VAT and withholding correctly', async () => {
      const workflowId = `invoice-test-${uuidv4()}`;

      const handle = await client.start(workflows.invoiceApproval, {
        taskQueue: 'test-queue',
        workflowId,
        args: [{
          invoiceId: 'INV-001',
          vendorId: 'V-001',
          vendorType: 'contractor', // 7.5% withholding
          poNumber: 'PO-001',
          subtotal: 100000,
          currency: 'BDT',
          lineItems: [
            { description: 'Construction Services', amount: 100000 }
          ],
          submittedBy: 'vendor@example.com',
        }],
      });

      // Auto-approve small invoice
      const result = await handle.result();

      expect(result.status).toBe('approved');
      expect(result.vatAmount).toBe(15000); // 15% VAT
      expect(result.withholdingAmount).toBe(7500); // 7.5% for contractors
      expect(result.totalAmount).toBe(107500); // 100000 + 15000 - 7500
    });

    it('should validate Bangladesh tax compliance', async () => {
      const workflowId = `invoice-test-${uuidv4()}`;

      const handle = await client.start(workflows.invoiceApproval, {
        taskQueue: 'test-queue',
        workflowId,
        args: [{
          invoiceId: 'INV-002',
          vendorId: 'V-002',
          vendorType: 'supplier', // 5% withholding
          poNumber: 'PO-002',
          subtotal: 200000,
          currency: 'BDT',
          lineItems: [
            { description: 'Materials Supply', amount: 200000 }
          ],
          submittedBy: 'supplier@example.com',
          taxId: '1234567890', // Valid TIN format
        }],
      });

      // Approve invoice
      await handle.signal(workflows.approvalSignal, {
        approved: true,
        approvedBy: 'accounts@vextrus.com',
        comments: 'NBR compliance verified',
      });

      const result = await handle.result();

      expect(result.status).toBe('approved');
      expect(result.vatAmount).toBe(30000); // 15% VAT
      expect(result.withholdingAmount).toBe(10000); // 5% for suppliers
      expect(result.nbrCompliant).toBe(true);
    });
  });

  describe('Employee Onboarding Workflow', () => {
    it('should complete full onboarding process', async () => {
      const workflowId = `onboarding-test-${uuidv4()}`;

      const handle = await client.start(workflows.employeeOnboarding, {
        taskQueue: 'test-queue',
        workflowId,
        args: [{
          employeeId: 'EMP-001',
          name: 'John Doe',
          email: 'john.doe@vextrus.com',
          department: 'Engineering',
          position: 'Senior Developer',
          startDate: new Date('2025-02-01'),
          managerId: 'MGR-001',
          location: 'Dhaka',
          nidNumber: '12345678901234567', // Valid NID
        }],
      });

      // Simulate IT provisioning completion
      await handle.signal(workflows.taskCompletedSignal, {
        taskType: 'it_provisioning',
        completedBy: 'it@vextrus.com',
        details: {
          email: 'john.doe@vextrus.com',
          laptop: 'MacBook Pro M3',
          accessories: ['Monitor', 'Keyboard', 'Mouse'],
        },
      });

      // Simulate documentation completion
      await handle.signal(workflows.taskCompletedSignal, {
        taskType: 'documentation',
        completedBy: 'hr@vextrus.com',
        details: {
          contractSigned: true,
          nidVerified: true,
          bankAccountSetup: true,
        },
      });

      // Simulate training scheduled
      await handle.signal(workflows.taskCompletedSignal, {
        taskType: 'training',
        completedBy: 'training@vextrus.com',
        details: {
          orientation: '2025-02-01',
          technical: '2025-02-03',
          compliance: '2025-02-05',
        },
      });

      const result = await handle.result();

      expect(result.status).toBe('completed');
      expect(result.completedTasks).toContain('it_provisioning');
      expect(result.completedTasks).toContain('documentation');
      expect(result.completedTasks).toContain('training');
      expect(result.accountCreated).toBe(true);
    });

    it('should handle incomplete onboarding', async () => {
      const workflowId = `onboarding-test-${uuidv4()}`;

      const handle = await client.start(workflows.employeeOnboarding, {
        taskQueue: 'test-queue',
        workflowId,
        workflowExecutionTimeout: '10s',
        args: [{
          employeeId: 'EMP-002',
          name: 'Jane Smith',
          email: 'jane.smith@vextrus.com',
          department: 'Finance',
          position: 'Accountant',
          startDate: new Date('2025-02-01'),
          managerId: 'MGR-002',
          location: 'Chittagong',
          nidNumber: '98765432109876543',
        }],
      });

      // Only complete IT provisioning
      await handle.signal(workflows.taskCompletedSignal, {
        taskType: 'it_provisioning',
        completedBy: 'it@vextrus.com',
        details: {
          email: 'jane.smith@vextrus.com',
          laptop: 'Dell Latitude',
        },
      });

      // Query status
      const status = await handle.query(workflows.getOnboardingStatus);

      expect(status.completedTasks).toContain('it_provisioning');
      expect(status.pendingTasks).toContain('documentation');
      expect(status.pendingTasks).toContain('training');
    });
  });

  describe('Workflow Recovery and Compensation', () => {
    it('should recover from activity failure', async () => {
      const workflowId = `recovery-test-${uuidv4()}`;

      // Mock activity to fail first time
      let attemptCount = 0;
      const originalActivity = activities.validateBudget;
      activities.validateBudget = jest.fn(async (amount: number) => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('Database connection failed');
        }
        return originalActivity(amount);
      });

      const handle = await client.start(workflows.purchaseOrderApproval, {
        taskQueue: 'test-queue',
        workflowId,
        args: [{
          orderId: 'PO-005',
          vendorId: 'V-005',
          amount: 75000,
          currency: 'BDT',
          items: [
            { itemId: 'ITEM-005', quantity: 15, unitPrice: 5000 }
          ],
          requestedBy: 'user@vextrus.com',
          department: 'Engineering',
        }],
      });

      const result = await handle.result();

      expect(result.status).toBe('approved');
      expect(attemptCount).toBeGreaterThan(1); // Activity was retried

      // Restore original activity
      activities.validateBudget = originalActivity;
    });

    it('should handle compensation for failed workflow', async () => {
      const workflowId = `compensation-test-${uuidv4()}`;

      const handle = await client.start(workflows.purchaseOrderApproval, {
        taskQueue: 'test-queue',
        workflowId,
        args: [{
          orderId: 'PO-006',
          vendorId: 'V-006',
          amount: 5000000, // Very high amount
          currency: 'BDT',
          items: [
            { itemId: 'ITEM-006', quantity: 500, unitPrice: 10000 }
          ],
          requestedBy: 'user@vextrus.com',
          department: 'Engineering',
        }],
      });

      // Cancel the workflow
      await handle.cancel();

      // Verify compensation activities ran
      const history = await handle.fetchHistory();
      const compensationEvents = history.events.filter(
        e => e.activityTaskScheduledEventAttributes?.activityType?.name === 'compensatePurchaseOrder'
      );

      expect(compensationEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Query Handlers', () => {
    it('should query workflow status', async () => {
      const workflowId = `query-test-${uuidv4()}`;

      const handle = await client.start(workflows.purchaseOrderApproval, {
        taskQueue: 'test-queue',
        workflowId,
        args: [{
          orderId: 'PO-007',
          vendorId: 'V-007',
          amount: 150000,
          currency: 'BDT',
          items: [
            { itemId: 'ITEM-007', quantity: 30, unitPrice: 5000 }
          ],
          requestedBy: 'user@vextrus.com',
          department: 'Engineering',
        }],
      });

      // Query status before approval
      const statusBefore = await handle.query(workflows.getApprovalStatus);
      expect(statusBefore.status).toBe('pending_approval');
      expect(statusBefore.currentLevel).toBe(1);

      // Approve
      await handle.signal(workflows.approvalSignal, {
        approved: true,
        approvedBy: 'manager@vextrus.com',
        comments: 'Approved',
      });

      // Query status after approval
      const statusAfter = await handle.query(workflows.getApprovalStatus);
      expect(statusAfter.status).toBe('approved');
      expect(statusAfter.approvedBy).toBe('manager@vextrus.com');
    });
  });
});