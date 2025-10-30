import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../services/rules-engine/src/app.module';
import { TaxRulesService } from '../../services/rules-engine/src/services/tax-rules.service';

describe('Bangladesh Tax Rules (Integration)', () => {
  let app: INestApplication;
  let taxRulesService: TaxRulesService;
  const authToken = 'test-jwt-token';
  const tenantId = 'test-tenant-123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    taxRulesService = moduleFixture.get<TaxRulesService>(TaxRulesService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/tax-rules/vat/calculate (POST)', () => {
    it('should apply standard 15% VAT for general goods', async () => {
      const vatCalculation = {
        productCategory: 'general-goods',
        customerType: 'business',
        amount: 100000,
        isExport: false,
        hasExemptionCertificate: false,
      };

      const response = await request(app.getHttpServer())
        .post('/tax-rules/vat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(vatCalculation)
        .expect(200);

      expect(response.body.vatRate).toBe(0.15);
      expect(response.body.vatAmount).toBe(15000);
      expect(response.body.totalAmount).toBe(115000);
      expect(response.body.exemptionApplied).toBe(false);
    });

    it('should apply zero VAT for medicine', async () => {
      const vatCalculation = {
        productCategory: 'medicine',
        customerType: 'individual',
        amount: 50000,
        isExport: false,
        hasExemptionCertificate: false,
      };

      const response = await request(app.getHttpServer())
        .post('/tax-rules/vat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(vatCalculation)
        .expect(200);

      expect(response.body.vatRate).toBe(0);
      expect(response.body.vatAmount).toBe(0);
      expect(response.body.totalAmount).toBe(50000);
      expect(response.body.exemptionApplied).toBe(true);
      expect(response.body.exemptionReason).toContain('Essential items');
    });

    it('should apply zero VAT for exports', async () => {
      const vatCalculation = {
        productCategory: 'general-goods',
        customerType: 'export',
        amount: 200000,
        isExport: true,
        hasExemptionCertificate: false,
      };

      const response = await request(app.getHttpServer())
        .post('/tax-rules/vat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(vatCalculation)
        .expect(200);

      expect(response.body.vatRate).toBe(0);
      expect(response.body.vatAmount).toBe(0);
      expect(response.body.exemptionApplied).toBe(true);
      expect(response.body.exemptionReason).toContain('Export');
    });

    it('should apply reduced 5% VAT for education services', async () => {
      const vatCalculation = {
        productCategory: 'education',
        customerType: 'individual',
        amount: 100000,
        isExport: false,
        hasExemptionCertificate: false,
      };

      const response = await request(app.getHttpServer())
        .post('/tax-rules/vat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(vatCalculation)
        .expect(200);

      expect(response.body.vatRate).toBe(0.05);
      expect(response.body.vatAmount).toBe(5000);
      expect(response.body.totalAmount).toBe(105000);
    });

    it('should apply reduced 7.5% VAT for bulk construction materials', async () => {
      const vatCalculation = {
        productCategory: 'construction-materials',
        customerType: 'business',
        amount: 2000000, // Above 10 lakh BDT
        isExport: false,
        hasExemptionCertificate: false,
      };

      const response = await request(app.getHttpServer())
        .post('/tax-rules/vat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(vatCalculation)
        .expect(200);

      expect(response.body.vatRate).toBe(0.075);
      expect(response.body.vatAmount).toBe(150000);
      expect(response.body.totalAmount).toBe(2150000);
    });

    it('should apply VAT exemption for government entities', async () => {
      const vatCalculation = {
        productCategory: 'general-goods',
        customerType: 'government',
        amount: 500000,
        isExport: false,
        hasExemptionCertificate: false,
      };

      const response = await request(app.getHttpServer())
        .post('/tax-rules/vat/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(vatCalculation)
        .expect(200);

      expect(response.body.vatRate).toBe(0);
      expect(response.body.exemptionApplied).toBe(true);
      expect(response.body.exemptionReason).toContain('Government');
    });
  });

  describe('/tax-rules/ait/calculate (POST)', () => {
    it('should apply 7% AIT for construction contractors', async () => {
      const aitCalculation = {
        serviceType: 'construction',
        vendorType: 'contractor',
        amount: 1000000,
        hasTaxCertificate: false,
      };

      const response = await request(app.getHttpServer())
        .post('/tax-rules/ait/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(aitCalculation)
        .expect(200);

      expect(response.body.aitRate).toBe(0.07);
      expect(response.body.aitAmount).toBe(70000);
      expect(response.body.netAmount).toBe(930000);
      expect(response.body.description).toContain('Construction contractor');
    });

    it('should apply 3% AIT for supply of goods', async () => {
      const aitCalculation = {
        serviceType: 'supply',
        vendorType: 'supplier',
        amount: 500000,
        hasTaxCertificate: false,
      };

      const response = await request(app.getHttpServer())
        .post('/tax-rules/ait/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(aitCalculation)
        .expect(200);

      expect(response.body.aitRate).toBe(0.03);
      expect(response.body.aitAmount).toBe(15000);
      expect(response.body.netAmount).toBe(485000);
    });

    it('should apply 10% AIT for professional services', async () => {
      const aitCalculation = {
        serviceType: 'consulting',
        vendorType: 'consultant',
        amount: 300000,
        hasTaxCertificate: false,
      };

      const response = await request(app.getHttpServer())
        .post('/tax-rules/ait/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(aitCalculation)
        .expect(200);

      expect(response.body.aitRate).toBe(0.10);
      expect(response.body.aitAmount).toBe(30000);
      expect(response.body.netAmount).toBe(270000);
    });

    it('should apply reduced 2% AIT with tax certificate', async () => {
      const aitCalculation = {
        serviceType: 'construction',
        vendorType: 'contractor',
        amount: 1000000,
        hasTaxCertificate: true,
      };

      const response = await request(app.getHttpServer())
        .post('/tax-rules/ait/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(aitCalculation)
        .expect(200);

      expect(response.body.aitRate).toBe(0.02);
      expect(response.body.aitAmount).toBe(20000);
      expect(response.body.netAmount).toBe(980000);
      expect(response.body.description).toContain('tax certificate');
    });
  });

  describe('/tax-rules/withholding-tax/calculate (POST)', () => {
    it('should calculate progressive tax for salary', async () => {
      const withholdingTaxData = {
        type: 'salary',
        amount: 800000, // 8 lakh BDT annually
        isResident: true,
      };

      const response = await request(app.getHttpServer())
        .post('/tax-rules/withholding-tax/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(withholdingTaxData)
        .expect(200);

      expect(response.body.rate).toBe(0.15); // 15% for 7-11 lakh range
      expect(response.body.amount).toBe(120000);
      expect(response.body.netAmount).toBe(680000);
    });

    it('should apply zero tax for salary below exemption limit', async () => {
      const withholdingTaxData = {
        type: 'salary',
        amount: 250000, // Below 3 lakh exemption
        isResident: true,
      };

      const response = await request(app.getHttpServer())
        .post('/tax-rules/withholding-tax/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(withholdingTaxData)
        .expect(200);

      expect(response.body.rate).toBe(0);
      expect(response.body.amount).toBe(0);
      expect(response.body.netAmount).toBe(250000);
    });

    it('should apply 10% withholding tax on dividends for residents', async () => {
      const withholdingTaxData = {
        type: 'dividend',
        amount: 100000,
        isResident: true,
      };

      const response = await request(app.getHttpServer())
        .post('/tax-rules/withholding-tax/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(withholdingTaxData)
        .expect(200);

      expect(response.body.rate).toBe(0.10);
      expect(response.body.amount).toBe(10000);
      expect(response.body.netAmount).toBe(90000);
    });

    it('should apply 20% withholding tax on dividends for non-residents', async () => {
      const withholdingTaxData = {
        type: 'dividend',
        amount: 100000,
        isResident: false,
      };

      const response = await request(app.getHttpServer())
        .post('/tax-rules/withholding-tax/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(withholdingTaxData)
        .expect(200);

      expect(response.body.rate).toBe(0.20);
      expect(response.body.amount).toBe(20000);
      expect(response.body.netAmount).toBe(80000);
    });
  });

  describe('/tax-rules/validate-tin/:tin (GET)', () => {
    it('should validate correct Bangladesh TIN format', async () => {
      const response = await request(app.getHttpServer())
        .get('/tax-rules/validate-tin/123456789012')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.valid).toBe(true);
    });

    it('should reject invalid TIN format', async () => {
      const response = await request(app.getHttpServer())
        .get('/tax-rules/validate-tin/12345')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.message).toContain('12 digits');
    });
  });

  describe('/tax-rules/validate-bin/:bin (GET)', () => {
    it('should validate correct Bangladesh BIN format', async () => {
      const response = await request(app.getHttpServer())
        .get('/tax-rules/validate-bin/123456789')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.valid).toBe(true);
    });

    it('should reject invalid BIN format', async () => {
      const response = await request(app.getHttpServer())
        .get('/tax-rules/validate-bin/12345')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.message).toContain('9 digits');
    });
  });

  describe('/tax-rules/fiscal-year (GET)', () => {
    it('should return current Bangladesh fiscal year', async () => {
      const response = await request(app.getHttpServer())
        .get('/tax-rules/fiscal-year')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('current');
      expect(response.body).toHaveProperty('startDate');
      expect(response.body).toHaveProperty('endDate');
      expect(response.body).toHaveProperty('quarter');

      // Verify fiscal year format
      const fiscalYearPattern = /^\d{4}-\d{4}$/;
      expect(response.body.current).toMatch(fiscalYearPattern);

      // Verify dates are July 1 to June 30
      expect(response.body.startDate).toContain('-07-01');
      expect(response.body.endDate).toContain('-06-30');
    });
  });

  describe('/tax-rules/bulk-vat-calculate (POST)', () => {
    it('should calculate VAT for multiple items', async () => {
      const bulkVatData = {
        items: [
          {
            productCategory: 'general-goods',
            customerType: 'business',
            amount: 100000,
            isExport: false,
          },
          {
            productCategory: 'medicine',
            customerType: 'individual',
            amount: 50000,
            isExport: false,
          },
          {
            productCategory: 'education',
            customerType: 'individual',
            amount: 75000,
            isExport: false,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/tax-rules/bulk-vat-calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-tenant-id', tenantId)
        .send(bulkVatData)
        .expect(200);

      expect(response.body.items).toHaveLength(3);
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.totalOriginalAmount).toBe(225000);
      
      // First item: 15% VAT on 100000 = 15000
      // Second item: 0% VAT on 50000 = 0
      // Third item: 5% VAT on 75000 = 3750
      expect(response.body.summary.totalVATAmount).toBe(18750);
      expect(response.body.summary.totalAmountWithVAT).toBe(243750);
    });
  });
});