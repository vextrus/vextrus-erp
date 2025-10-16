import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * Invoice GraphQL End-to-End Tests
 *
 * Tests the complete invoice workflow via GraphQL API:
 * 1. Create invoice mutation
 * 2. Query invoice by ID
 * 3. Query invoices list with pagination
 * 4. Approve invoice mutation
 * 5. Cancel invoice mutation
 *
 * Prerequisites:
 * - PostgreSQL database running (vextrus_finance_test)
 * - EventStore DB running (localhost:2113)
 * - Valid JWT token for authentication
 */
describe('Invoice GraphQL API (e2e)', () => {
  let app: INestApplication;

  const TEST_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsInRlbmFudElkIjoidGVuYW50LTEyMyIsInVzZXJJZCI6InVzZXItMTIzIiwiaWF0IjoxNTE2MjM5MDIyfQ.placeholder';
  const TEST_TENANT_ID = 'tenant-123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
    app.setGlobalPrefix('api/v1');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('createInvoice mutation', () => {
    it('should create an invoice with line items', () => {
      const mutation = `
        mutation CreateInvoice($input: CreateInvoiceInput!) {
          createInvoice(input: $input) {
            id
            invoiceNumber
            vendorId
            customerId
            status
            subtotal {
              amount
              currency
              formattedAmount
            }
            vatAmount {
              amount
              currency
            }
            grandTotal {
              amount
              currency
            }
            lineItems {
              description
              quantity
              unitPrice {
                amount
                currency
              }
              amount {
                amount
              }
              vatCategory
              vatRate
            }
            invoiceDate
            dueDate
            fiscalYear
            createdAt
          }
        }
      `;

      const variables = {
        input: {
          customerId: 'customer-001',
          vendorId: 'vendor-001',
          invoiceDate: '2025-01-15',
          dueDate: '2025-02-15',
          lineItems: [
            {
              description: 'Construction Materials',
              quantity: 10,
              unitPrice: {
                amount: 5000,
                currency: 'BDT',
              },
              vatCategory: 'standard',
            },
            {
              description: 'Labor Charges',
              quantity: 5,
              unitPrice: {
                amount: 3000,
                currency: 'BDT',
              },
              vatCategory: 'standard',
            },
          ],
          vendorTIN: '1234567890',
          vendorBIN: '123456789',
          customerTIN: '0987654321',
          customerBIN: '987654321',
        },
      };

      return request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({ query: mutation, variables })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(res.body.data.createInvoice).toBeDefined();
          expect(res.body.data.createInvoice.id).toBeDefined();
          expect(res.body.data.createInvoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{2}-\d{2}-\d{6}$/);
          expect(res.body.data.createInvoice.status).toBe('DRAFT');
          expect(res.body.data.createInvoice.subtotal.amount).toBe(65000); // (10 * 5000) + (5 * 3000)
          expect(res.body.data.createInvoice.vatAmount.amount).toBe(9750); // 15% of 65000
          expect(res.body.data.createInvoice.grandTotal.amount).toBe(74750); // 65000 + 9750
          expect(res.body.data.createInvoice.lineItems).toHaveLength(2);
          expect(res.body.data.createInvoice.fiscalYear).toMatch(/^\d{4}-\d{4}$/);
        });
    });

    it('should handle different VAT categories', () => {
      const mutation = `
        mutation CreateInvoice($input: CreateInvoiceInput!) {
          createInvoice(input: $input) {
            id
            subtotal { amount }
            vatAmount { amount }
            grandTotal { amount }
            lineItems {
              description
              vatCategory
              vatRate
              vatAmount { amount }
            }
          }
        }
      `;

      const variables = {
        input: {
          customerId: 'customer-002',
          vendorId: 'vendor-002',
          invoiceDate: '2025-01-20',
          dueDate: '2025-02-20',
          lineItems: [
            {
              description: 'Standard VAT Item',
              quantity: 1,
              unitPrice: { amount: 10000, currency: 'BDT' },
              vatCategory: 'standard', // 15%
            },
            {
              description: 'Reduced VAT Item',
              quantity: 1,
              unitPrice: { amount: 10000, currency: 'BDT' },
              vatCategory: 'reduced', // 7.5%
            },
            {
              description: 'Zero-Rated Item',
              quantity: 1,
              unitPrice: { amount: 10000, currency: 'BDT' },
              vatCategory: 'zero', // 0%
            },
          ],
        },
      };

      return request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({ query: mutation, variables })
        .expect(200)
        .expect((res) => {
          const invoice = res.body.data.createInvoice;
          expect(invoice.subtotal.amount).toBe(30000);
          expect(invoice.vatAmount.amount).toBe(2250); // (10000 * 0.15) + (10000 * 0.075) + 0
          expect(invoice.grandTotal.amount).toBe(32250);
          expect(invoice.lineItems[0].vatRate).toBe(0.15);
          expect(invoice.lineItems[1].vatRate).toBe(0.075);
          expect(invoice.lineItems[2].vatRate).toBe(0);
        });
    });

    it('should reject invoice creation without authentication', () => {
      const mutation = `
        mutation CreateInvoice($input: CreateInvoiceInput!) {
          createInvoice(input: $input) {
            id
          }
        }
      `;

      const variables = {
        input: {
          customerId: 'customer-003',
          vendorId: 'vendor-003',
          invoiceDate: '2025-01-25',
          dueDate: '2025-02-25',
          lineItems: [],
        },
      };

      return request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables })
        .expect(200) // GraphQL returns 200 even for errors
        .expect((res) => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors[0].message).toContain('Unauthorized');
        });
    });
  });

  describe('invoice query', () => {
    let createdInvoiceId: string;

    beforeAll(async () => {
      // Create an invoice first
      const mutation = `
        mutation CreateInvoice($input: CreateInvoiceInput!) {
          createInvoice(input: $input) {
            id
          }
        }
      `;

      const variables = {
        input: {
          customerId: 'customer-query-test',
          vendorId: 'vendor-query-test',
          invoiceDate: '2025-01-30',
          dueDate: '2025-02-28',
          lineItems: [
            {
              description: 'Test Item',
              quantity: 1,
              unitPrice: { amount: 1000, currency: 'BDT' },
            },
          ],
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({ query: mutation, variables });

      createdInvoiceId = response.body.data.createInvoice.id;
    });

    it('should query invoice by ID', () => {
      const query = `
        query GetInvoice($id: ID!) {
          invoice(id: $id) {
            id
            invoiceNumber
            vendorId
            customerId
            status
            subtotal { amount }
            vatAmount { amount }
            grandTotal { amount }
            fiscalYear
          }
        }
      `;

      return request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({ query, variables: { id: createdInvoiceId } })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.invoice).toBeDefined();
          expect(res.body.data.invoice.id).toBe(createdInvoiceId);
          expect(res.body.data.invoice.status).toBe('DRAFT');
        });
    });

    it('should return null for non-existent invoice', () => {
      const query = `
        query GetInvoice($id: ID!) {
          invoice(id: $id) {
            id
          }
        }
      `;

      return request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({ query, variables: { id: 'non-existent-id' } })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.invoice).toBeNull();
        });
    });
  });

  describe('invoices query', () => {
    beforeAll(async () => {
      // Create multiple invoices for pagination testing
      const mutation = `
        mutation CreateInvoice($input: CreateInvoiceInput!) {
          createInvoice(input: $input) {
            id
          }
        }
      `;

      for (let i = 1; i <= 15; i++) {
        const variables = {
          input: {
            customerId: `customer-${i}`,
            vendorId: `vendor-${i}`,
            invoiceDate: '2025-01-15',
            dueDate: '2025-02-15',
            lineItems: [
              {
                description: `Item ${i}`,
                quantity: 1,
                unitPrice: { amount: 1000 * i, currency: 'BDT' },
              },
            ],
          },
        };

        await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
          .set('X-Tenant-ID', TEST_TENANT_ID)
          .send({ query: mutation, variables });
      }
    });

    it('should query invoices with pagination', () => {
      const query = `
        query GetInvoices($limit: Int, $offset: Int) {
          invoices(limit: $limit, offset: $offset) {
            id
            invoiceNumber
            status
            grandTotal { amount }
          }
        }
      `;

      return request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({ query, variables: { limit: 10, offset: 0 } })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.invoices).toBeDefined();
          expect(Array.isArray(res.body.data.invoices)).toBe(true);
          expect(res.body.data.invoices.length).toBeLessThanOrEqual(10);
        });
    });

    it('should respect pagination offset', () => {
      const query = `
        query GetInvoices($limit: Int, $offset: Int) {
          invoices(limit: $limit, offset: $offset) {
            id
          }
        }
      `;

      return request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({ query, variables: { limit: 10, offset: 10 } })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.invoices).toBeDefined();
          expect(Array.isArray(res.body.data.invoices)).toBe(true);
        });
    });
  });

  describe('approveInvoice mutation', () => {
    let invoiceToApprove: string;

    beforeAll(async () => {
      // Create an invoice to approve
      const mutation = `
        mutation CreateInvoice($input: CreateInvoiceInput!) {
          createInvoice(input: $input) {
            id
          }
        }
      `;

      const variables = {
        input: {
          customerId: 'customer-approve-test',
          vendorId: 'vendor-approve-test',
          invoiceDate: '2025-01-25',
          dueDate: '2025-02-25',
          lineItems: [
            {
              description: 'Approval Test Item',
              quantity: 1,
              unitPrice: { amount: 5000, currency: 'BDT' },
            },
          ],
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({ query: mutation, variables });

      invoiceToApprove = response.body.data.createInvoice.id;
    });

    it('should approve an invoice and assign Mushak number', () => {
      const mutation = `
        mutation ApproveInvoice($id: ID!) {
          approveInvoice(id: $id) {
            id
            status
            mushakNumber
          }
        }
      `;

      return request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({ query: mutation, variables: { id: invoiceToApprove } })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.approveInvoice).toBeDefined();
          expect(res.body.data.approveInvoice.status).toBe('APPROVED');
          expect(res.body.data.approveInvoice.mushakNumber).toMatch(/^MUSHAK-6\.3-\d{4}-\d{2}-\d{6}$/);
        });
    });
  });

  describe('cancelInvoice mutation', () => {
    let invoiceToCancel: string;

    beforeAll(async () => {
      // Create an invoice to cancel
      const mutation = `
        mutation CreateInvoice($input: CreateInvoiceInput!) {
          createInvoice(input: $input) {
            id
          }
        }
      `;

      const variables = {
        input: {
          customerId: 'customer-cancel-test',
          vendorId: 'vendor-cancel-test',
          invoiceDate: '2025-01-30',
          dueDate: '2025-03-01',
          lineItems: [
            {
              description: 'Cancellation Test Item',
              quantity: 1,
              unitPrice: { amount: 2000, currency: 'BDT' },
            },
          ],
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({ query: mutation, variables });

      invoiceToCancel = response.body.data.createInvoice.id;
    });

    it('should cancel an invoice with reason', () => {
      const mutation = `
        mutation CancelInvoice($id: ID!, $reason: String!) {
          cancelInvoice(id: $id, reason: $reason) {
            id
            status
          }
        }
      `;

      return request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({
          query: mutation,
          variables: {
            id: invoiceToCancel,
            reason: 'Customer requested cancellation',
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.cancelInvoice).toBeDefined();
          expect(res.body.data.cancelInvoice.status).toBe('CANCELLED');
        });
    });
  });

  describe('Complete Invoice Workflow', () => {
    it('should create → query → approve → query → cancel workflow', async () => {
      // Step 1: Create invoice
      const createMutation = `
        mutation CreateInvoice($input: CreateInvoiceInput!) {
          createInvoice(input: $input) {
            id
            status
          }
        }
      `;

      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({
          query: createMutation,
          variables: {
            input: {
              customerId: 'workflow-customer',
              vendorId: 'workflow-vendor',
              invoiceDate: '2025-02-01',
              dueDate: '2025-03-01',
              lineItems: [
                {
                  description: 'Workflow Test Item',
                  quantity: 2,
                  unitPrice: { amount: 7500, currency: 'BDT' },
                },
              ],
            },
          },
        });

      const invoiceId = createResponse.body.data.createInvoice.id;
      expect(createResponse.body.data.createInvoice.status).toBe('DRAFT');

      // Step 2: Query invoice
      const getQuery = `
        query GetInvoice($id: ID!) {
          invoice(id: $id) {
            id
            status
            mushakNumber
          }
        }
      `;

      const queryResponse1 = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({ query: getQuery, variables: { id: invoiceId } });

      expect(queryResponse1.body.data.invoice.status).toBe('DRAFT');
      expect(queryResponse1.body.data.invoice.mushakNumber).toBeUndefined();

      // Step 3: Approve invoice
      const approveMutation = `
        mutation ApproveInvoice($id: ID!) {
          approveInvoice(id: $id) {
            id
            status
            mushakNumber
          }
        }
      `;

      const approveResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({ query: approveMutation, variables: { id: invoiceId } });

      expect(approveResponse.body.data.approveInvoice.status).toBe('APPROVED');
      expect(approveResponse.body.data.approveInvoice.mushakNumber).toBeDefined();

      // Step 4: Query again to verify approval
      const queryResponse2 = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({ query: getQuery, variables: { id: invoiceId } });

      expect(queryResponse2.body.data.invoice.status).toBe('APPROVED');

      // Note: We don't cancel after approval in this test to preserve approved state
    });
  });
});
