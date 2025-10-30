import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule, CommandBus, QueryBus, EventBus } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Commands
import { CreateInvoiceCommand } from '../../src/application/commands/create-invoice.command';
import { ApproveInvoiceCommand } from '../../src/application/commands/approve-invoice.command';
import { CreatePaymentCommand } from '../../src/application/commands/create-payment.command';
import { CompletePaymentCommand } from '../../src/application/commands/complete-payment.command';

// Command Handlers
import { CreateInvoiceHandler } from '../../src/application/commands/handlers/create-invoice.handler';
import { ApproveInvoiceHandler } from '../../src/application/commands/handlers/approve-invoice.handler';
import { CreatePaymentHandler } from '../../src/application/commands/handlers/create-payment.handler';
import { CompletePaymentHandler } from '../../src/application/commands/handlers/complete-payment.handler';

// Queries
import { GetInvoiceQuery } from '../../src/application/queries/get-invoice.query';
import { GetPaymentQuery } from '../../src/application/queries/get-payment.query';

// Query Handlers
import { GetInvoiceHandler } from '../../src/application/queries/handlers/get-invoice.handler';
import { GetPaymentHandler } from '../../src/application/queries/handlers/get-payment.handler';

// Projection Handlers
import { InvoiceProjectionHandler } from '../../src/application/queries/handlers/invoice-projection.handler';
import { PaymentProjectionHandler } from '../../src/application/queries/handlers/payment-projection.handler';

// Projections
import { InvoiceProjection, PaymentProjection } from '../../src/application/queries/projections/invoice.projection';

// Value Objects
import { Money } from '../../src/domain/value-objects/money.value-object';
import { TenantId } from '../../src/domain/aggregates/chart-of-account/chart-of-account.aggregate';
import { PaymentMethod } from '../../src/domain/aggregates/payment/payment.aggregate';

/**
 * Payment-Invoice Linking Integration Tests
 *
 * Tests the complete workflow from invoice creation to payment completion
 * and verification that the invoice status updates correctly.
 *
 * Critical Flow:
 * 1. Create invoice in DRAFT status
 * 2. Approve invoice → status APPROVED
 * 3. Create payment linked to invoice
 * 4. Complete payment → invoice status PAID, paidAmount updated
 *
 * This integration test verifies:
 * - Cross-aggregate coordination (Payment → Invoice)
 * - Event-driven status transitions
 * - Projection updates from domain events
 * - Graceful degradation pattern
 */
describe('Payment-Invoice Linking Integration Tests', () => {
  let module: TestingModule;
  let commandBus: CommandBus;
  let queryBus: QueryBus;
  let eventBus: EventBus;

  const tenantId = 'tenant-integration-test';
  const vendorId = 'vendor-test-001';
  const customerId = 'customer-test-001';
  const userId = 'user-test-001';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.test',
          isGlobal: true,
        }),
        CqrsModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.DATABASE_PORT || '5432'),
          username: process.env.DATABASE_USERNAME || 'vextrus',
          password: process.env.DATABASE_PASSWORD || 'vextrus_dev_2024',
          database: process.env.DATABASE_NAME || 'vextrus_finance_test',
          entities: [InvoiceProjection, PaymentProjection],
          synchronize: true, // OK for test environment
        }),
        TypeOrmModule.forFeature([InvoiceProjection, PaymentProjection]),
      ],
      providers: [
        // Command Handlers
        CreateInvoiceHandler,
        ApproveInvoiceHandler,
        CreatePaymentHandler,
        CompletePaymentHandler,

        // Query Handlers
        GetInvoiceHandler,
        GetPaymentHandler,

        // Projection Handlers
        InvoiceProjectionHandler,
        PaymentProjectionHandler,

        // Mock repositories (simplified for integration test)
        {
          provide: 'IInvoiceRepository',
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: 'IPaymentRepository',
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
          },
        },

        // Mock cache service
        {
          provide: 'FinanceCacheService',
          useValue: {
            invalidateInvoice: jest.fn(),
            invalidatePayment: jest.fn(),
          },
        },

        // Mock master data client
        {
          provide: 'MasterDataClient',
          useValue: {
            getVendor: jest.fn().mockResolvedValue({
              id: vendorId,
              name: 'Test Vendor',
              tin: '1234567890',
              bin: '123456789',
            }),
            getCustomer: jest.fn().mockResolvedValue({
              id: customerId,
              name: 'Test Customer',
              tin: '9876543210',
              bin: '987654321',
            }),
          },
        },
      ],
    }).compile();

    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
    eventBus = module.get<EventBus>(EventBus);

    // Register command handlers
    commandBus.register([
      CreateInvoiceHandler,
      ApproveInvoiceHandler,
      CreatePaymentHandler,
      CompletePaymentHandler,
    ]);

    // Register query handlers (type assertion needed due to nullable return types)
    queryBus.register([GetInvoiceHandler, GetPaymentHandler] as any);

    // Subscribe projection handlers to events
    const invoiceProjectionHandler = module.get(InvoiceProjectionHandler);
    const paymentProjectionHandler = module.get(PaymentProjectionHandler);

    eventBus.subscribe((event: any) => {
      const eventName = event.constructor?.name || '';
      if (eventName.includes('Invoice')) {
        invoiceProjectionHandler.handle(event);
      }
      if (eventName.includes('Payment')) {
        paymentProjectionHandler.handle(event);
      }
    });
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Complete Payment-Invoice Workflow', () => {
    it('should create invoice, approve it, create payment, complete payment, and update invoice status to PAID', async () => {
      // Step 1: Create Invoice
      const createInvoiceCommand = new CreateInvoiceCommand(
        customerId,
        vendorId,
        new Date('2024-10-20'),
        new Date('2024-11-20'),
        [
          {
            description: 'Construction Materials',
            quantity: 10,
            unitPrice: Money.create(1000, 'BDT'),
          },
        ],
        tenantId,
        userId,
      );

      const invoiceId = await commandBus.execute(createInvoiceCommand);
      expect(invoiceId).toBeDefined();

      // Wait for projection (async event processing)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify invoice created in DRAFT status
      let invoice = await queryBus.execute(
        new GetInvoiceQuery(invoiceId),
      );
      expect(invoice).toBeDefined();
      expect(invoice.status).toBe('DRAFT');
      expect(invoice.grandTotal).toBe(11500); // 10,000 + 15% VAT

      // Step 2: Approve Invoice
      const approveCommand = new ApproveInvoiceCommand(invoiceId, userId);
      await commandBus.execute(approveCommand);

      // Wait for projection
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify invoice approved
      invoice = await queryBus.execute(
        new GetInvoiceQuery(invoiceId),
      );
      expect(invoice.status).toBe('APPROVED');
      expect(invoice.mushakNumber).toBeDefined();

      // Step 3: Create Payment linked to invoice
      const createPaymentCommand = new CreatePaymentCommand(
        invoiceId, // Link to invoice
        11500, // Full payment amount
        'BDT',
        PaymentMethod.BANK_TRANSFER,
        new Date('2024-10-21'),
        tenantId,
        userId,
        'ref-12345',
      );

      const paymentId = await commandBus.execute(createPaymentCommand);
      expect(paymentId).toBeDefined();

      // Wait for projection
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify payment created
      let payment = await queryBus.execute(
        new GetPaymentQuery(paymentId),
      );
      expect(payment).toBeDefined();
      expect(payment.status).toBe('PENDING');
      expect(payment.amount).toBe(11500);
      expect(payment.invoiceId).toBe(invoiceId);

      // Step 4: Complete Payment (should auto-update invoice)
      const completePaymentCommand = new CompletePaymentCommand(
        paymentId,
        'txn-67890',
        userId,
      );

      await commandBus.execute(completePaymentCommand);

      // Wait for both payment and invoice projections to update
      await new Promise(resolve => setTimeout(resolve, 200));

      // Step 5: Verify payment completed
      payment = await queryBus.execute(
        new GetPaymentQuery(paymentId),
      );
      expect(payment.status).toBe('COMPLETED');
      expect(payment.transactionReference).toBe('txn-67890');

      // Step 6: Verify invoice status updated to PAID
      invoice = await queryBus.execute(
        new GetInvoiceQuery(invoiceId),
      );
      expect(invoice.status).toBe('PAID');
      expect(invoice.paidAmount).toBe(11500);
      expect(invoice.balanceAmount).toBe(0);
      expect(invoice.paidAt).toBeDefined();
    }, 30000); // 30 second timeout for this integration test

    it('should handle partial payment correctly (invoice remains APPROVED)', async () => {
      // Step 1: Create and Approve Invoice
      const createInvoiceCommand = new CreateInvoiceCommand(
        customerId,
        vendorId,
        new Date('2024-10-20'),
        new Date('2024-11-20'),
        [
          {
            description: 'Construction Services',
            quantity: 5,
            unitPrice: Money.create(2000, 'BDT'),
          },
        ],
        tenantId,
        userId,
      );

      const invoiceId = await commandBus.execute(createInvoiceCommand);
      await new Promise(resolve => setTimeout(resolve, 100));

      const approveCommand = new ApproveInvoiceCommand(invoiceId, userId);
      await commandBus.execute(approveCommand);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 2: Create Partial Payment (only 50% of grand total)
      const createPaymentCommand = new CreatePaymentCommand(
        invoiceId,
        5750, // 50% of 11,500 BDT
        'BDT',
        PaymentMethod.BANK_TRANSFER,
        new Date('2024-10-21'),
        tenantId,
        userId,
        'ref-partial-001',
      );

      const paymentId = await commandBus.execute(createPaymentCommand);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 3: Complete Partial Payment
      const completePaymentCommand = new CompletePaymentCommand(
        paymentId,
        'txn-partial-001',
        userId,
      );

      await commandBus.execute(completePaymentCommand);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Step 4: Verify invoice still APPROVED (not PAID)
      const invoice = await queryBus.execute(
        new GetInvoiceQuery(invoiceId),
      );
      expect(invoice.status).toBe('APPROVED'); // Still APPROVED, not PAID
      expect(invoice.paidAmount).toBe(5750);
      expect(invoice.balanceAmount).toBe(5750); // 11,500 - 5,750
      expect(invoice.paidAt).toBeUndefined(); // Not fully paid yet
    }, 30000);
  });
});
