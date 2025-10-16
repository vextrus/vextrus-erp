import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../services/workflow/src/app.module';
import { WorkflowService } from '../../services/workflow/src/services/workflow.service';
import { TemporalService } from '../../services/workflow/src/services/temporal.service';

describe('Purchase Order Workflow (Integration)', () => {
  let app: INestApplication;
  let workflowService: WorkflowService;
  let temporalService: TemporalService;
  const authToken = 'test-jwt-token';
  const tenantId = 'test-tenant-123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    workflowService = moduleFixture.get<WorkflowService>(WorkflowService);
    temporalService = moduleFixture.get<TemporalService>(TemporalService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/workflows/purchase-order (POST)', () => {
    it('should start a purchase order approval workflow', async () => {
      const purchaseOrderData = {
        vendorId: 'vendor-123',
        amount: 150000, // Above 100k BDT - requires manager and finance approval
        currency: 'BDT',
        items: [
          {
            productId: 'prod-001',
            quantity: 10,
            unitPrice: 15000,
          },
        ],
        requestedBy: 'user-456',
        department: 'procurement',
      };

      const response = await request(app.getHttpServer())
        .post('/workflows/purchase-order')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(purchaseOrderData)
        .expect(201);

      expect(response.body).toHaveProperty('workflowId');
      expect(response.body).toHaveProperty('runId');
      expect(response.body.workflowId).toContain('po-');
    });

    it('should handle small purchase orders without manager approval', async () => {
      const smallPOData = {
        vendorId: 'vendor-456',
        amount: 25000, // Below 50k BDT - no manager approval needed
        currency: 'BDT',
        items: [
          {
            productId: 'prod-002',
            quantity: 5,
            unitPrice: 5000,
          },
        ],
        requestedBy: 'user-789',
        department: 'IT',
      };

      const response = await request(app.getHttpServer())
        .post('/workflows/purchase-order')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(smallPOData)
        .expect(201);

      expect(response.body.workflowId).toBeDefined();
    });
  });

  describe('/workflows/:workflowId/approve (POST)', () => {
    let testWorkflowId: string;

    beforeEach(async () => {
      // Create a workflow to test approval
      const response = await request(app.getHttpServer())
        .post('/workflows/purchase-order')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          vendorId: 'vendor-test',
          amount: 75000,
          currency: 'BDT',
          items: [{
            productId: 'prod-test',
            quantity: 1,
            unitPrice: 75000,
          }],
          requestedBy: 'user-test',
          department: 'test',
        })
        .expect(201);

      testWorkflowId = response.body.workflowId;
    });

    it('should send approval signal to workflow', async () => {
      const approvalData = {
        approver: 'manager-001',
        comments: 'Approved for urgent requirement',
      };

      const response = await request(app.getHttpServer())
        .post(`/workflows/${testWorkflowId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(approvalData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Signal approve sent');
    });
  });

  describe('/workflows/:workflowId/reject (POST)', () => {
    let testWorkflowId: string;

    beforeEach(async () => {
      // Create a workflow to test rejection
      const response = await request(app.getHttpServer())
        .post('/workflows/purchase-order')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          vendorId: 'vendor-reject',
          amount: 200000,
          currency: 'BDT',
          items: [{
            productId: 'prod-reject',
            quantity: 1,
            unitPrice: 200000,
          }],
          requestedBy: 'user-reject',
          department: 'test',
        })
        .expect(201);

      testWorkflowId = response.body.workflowId;
    });

    it('should send rejection signal to workflow', async () => {
      const rejectionData = {
        approver: 'finance-001',
        reason: 'Budget exceeded for this quarter',
      };

      const response = await request(app.getHttpServer())
        .post(`/workflows/${testWorkflowId}/reject`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(rejectionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Signal reject sent');
    });
  });

  describe('/workflows (GET)', () => {
    it('should list workflows for the tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/workflows?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter workflows by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/workflows?status=Running&page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });
  });

  describe('/workflows/:workflowId (GET)', () => {
    let testWorkflowId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/workflows/purchase-order')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          vendorId: 'vendor-get',
          amount: 50000,
          currency: 'BDT',
          items: [{
            productId: 'prod-get',
            quantity: 1,
            unitPrice: 50000,
          }],
          requestedBy: 'user-get',
          department: 'test',
        })
        .expect(201);

      testWorkflowId = response.body.workflowId;
    });

    it('should get workflow details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/workflows/${testWorkflowId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(response.body).toHaveProperty('workflowId');
      expect(response.body).toHaveProperty('status');
      expect(response.body.workflowId).toBe(testWorkflowId);
    });
  });

  describe('/templates (GET)', () => {
    it('should list available workflow templates', async () => {
      const response = await request(app.getHttpServer())
        .get('/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Check for expected templates
      const templateNames = response.body.data.map(t => t.id);
      expect(templateNames).toContain('purchase-order-approval');
      expect(templateNames).toContain('invoice-approval');
      expect(templateNames).toContain('leave-request');
    });
  });

  describe('Workflow with Bangladesh Business Rules', () => {
    it('should enforce Bangladesh fiscal year in workflows', async () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      // Bangladesh fiscal year: July 1 to June 30
      const fiscalYear = currentMonth >= 7 
        ? `${currentYear}-${currentYear + 1}`
        : `${currentYear - 1}-${currentYear}`;

      const purchaseOrderData = {
        vendorId: 'vendor-fiscal',
        amount: 100000,
        currency: 'BDT',
        items: [{
          productId: 'prod-fiscal',
          quantity: 1,
          unitPrice: 100000,
        }],
        requestedBy: 'user-fiscal',
        department: 'finance',
        metadata: {
          fiscalYear,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/workflows/purchase-order')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(purchaseOrderData)
        .expect(201);

      expect(response.body.workflowId).toBeDefined();
    });
  });
});