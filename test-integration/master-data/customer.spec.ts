import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../services/master-data/src/app.module';
import { CustomerService } from '../../services/master-data/src/services/customer.service';

describe('Customer Controller (Integration)', () => {
  let app: INestApplication;
  let customerService: CustomerService;
  const authToken = 'test-jwt-token';
  const tenantId = 'test-tenant-123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    customerService = moduleFixture.get<CustomerService>(CustomerService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/customers (POST)', () => {
    it('should create a new customer with Bangladesh-specific validations', async () => {
      const createCustomerDto = {
        code: 'CUST-001',
        name: 'Test Customer Ltd',
        nameInBengali: 'টেস্ট কাস্টমার লিমিটেড',
        tin: '123456789012',
        nid: '1234567890',
        phone: '+8801712345678',
        email: 'test@customer.com',
        address: {
          street1: '123 Test Road',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'Dhaka',
          postalCode: '1212',
          country: 'Bangladesh',
        },
        creditLimit: 1000000,
        paymentTerms: {
          days: 30,
          description: 'Net 30',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(createCustomerDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.code).toBe('CUST-001');
      expect(response.body.tin).toBe('123456789012');
    });

    it('should reject invalid Bangladesh TIN format', async () => {
      const invalidCustomer = {
        code: 'CUST-002',
        name: 'Invalid TIN Customer',
        tin: '12345', // Invalid - should be 12 digits
        phone: '+8801712345678',
        email: 'invalid@customer.com',
        address: {
          street1: '456 Test Road',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'Dhaka',
          postalCode: '1212',
        },
        creditLimit: 500000,
        paymentTerms: {
          days: 30,
        },
      };

      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(invalidCustomer)
        .expect(400);
    });

    it('should reject invalid Bangladesh phone format', async () => {
      const invalidPhoneCustomer = {
        code: 'CUST-003',
        name: 'Invalid Phone Customer',
        phone: '1234567890', // Invalid - should be +880 format
        email: 'phone@customer.com',
        address: {
          street1: '789 Test Road',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'Dhaka',
          postalCode: '1212',
        },
        creditLimit: 750000,
        paymentTerms: {
          days: 30,
        },
      };

      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(invalidPhoneCustomer)
        .expect(400);
    });
  });

  describe('/customers (GET)', () => {
    it('should return paginated list of customers', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter customers by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers?name=Test')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(response.body.data).toBeDefined();
      if (response.body.data.length > 0) {
        expect(response.body.data[0].name).toContain('Test');
      }
    });
  });

  describe('/customers/:id (GET)', () => {
    it('should return a specific customer by ID', async () => {
      // First create a customer
      const createResponse = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          code: 'CUST-004',
          name: 'Get Test Customer',
          phone: '+8801812345678',
          email: 'get@customer.com',
          address: {
            street1: '999 Test Road',
            city: 'Dhaka',
            district: 'Dhaka',
            division: 'Dhaka',
            postalCode: '1212',
          },
          creditLimit: 250000,
          paymentTerms: {
            days: 15,
          },
        })
        .expect(201);

      const customerId = createResponse.body.id;

      // Then get it by ID
      const getResponse = await request(app.getHttpServer())
        .get(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(getResponse.body.id).toBe(customerId);
      expect(getResponse.body.code).toBe('CUST-004');
    });
  });

  describe('/customers/validate-tin/:tin (GET)', () => {
    it('should validate correct Bangladesh TIN format', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/validate-tin/123456789012')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.valid).toBe(true);
    });

    it('should reject invalid Bangladesh TIN format', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/validate-tin/12345')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('/customers/validate-nid/:nid (GET)', () => {
    it('should validate correct Bangladesh NID format', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/validate-nid/1234567890')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.valid).toBe(true);
    });

    it('should reject invalid Bangladesh NID format', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/validate-nid/123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.message).toBeDefined();
    });
  });
});