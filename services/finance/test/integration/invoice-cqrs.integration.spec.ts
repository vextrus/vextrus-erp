import { Test, TestingModule } from '@nestjs/testing';
import { CqrsModule, CommandBus, QueryBus, EventBus } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection, Repository } from 'typeorm';
import { EventStoreDBClient, jsonEvent } from '@eventstore/db-client';

// Commands
import { CreateInvoiceCommand } from '../../src/application/commands/create-invoice.command';
import { ApproveInvoiceCommand } from '../../src/application/commands/approve-invoice.command';
import { CancelInvoiceCommand } from '../../src/application/commands/cancel-invoice.command';

// Command Handlers
import { CreateInvoiceHandler } from '../../src/application/commands/handlers/create-invoice.handler';
import { ApproveInvoiceHandler } from '../../src/application/commands/handlers/approve-invoice.handler';
import { CancelInvoiceHandler } from '../../src/application/commands/handlers/cancel-invoice.handler';

// Queries
import { GetInvoiceQuery } from '../../src/application/queries/get-invoice.query';
import { GetInvoicesQuery } from '../../src/application/queries/get-invoices.query';

// Query Handlers
import { GetInvoiceHandler } from '../../src/application/queries/handlers/get-invoice.handler';
import { GetInvoicesHandler } from '../../src/application/queries/handlers/get-invoices.handler';
import { InvoiceProjectionHandler } from '../../src/application/queries/handlers/invoice-projection.handler';

// Entities and Projections
import { InvoiceReadModel } from '../../src/infrastructure/persistence/typeorm/entities/invoice.entity';
import { InvoiceProjection, FinancialSummaryProjection, EntityTransactionProjection } from '../../src/application/queries/projections/invoice.projection';

// Domain
import { Money } from '../../src/domain/value-objects/money.value-object';
import { LineItemDto, VATCategory } from '../../src/domain/aggregates/invoice/invoice.aggregate';

// Infrastructure
import { InvoiceEventStoreRepository } from '../../src/infrastructure/persistence/event-store/invoice-event-store.repository';
import { MasterDataClient } from '../../src/infrastructure/integrations/master-data.client';

/**
 * Invoice CQRS Integration Tests
 *
 * Tests the complete CQRS flow:
 * 1. Command → Event → Projection → Query
 * 2. Multi-tenancy isolation
 * 3. Event replay consistency
 * 4. Read/Write model synchronization
 *
 * Architecture:
 * - Write Model: EventStore (event sourcing)
 * - Read Model: PostgreSQL (projections)
 * - Event Bus: Kafka (async event propagation)
 */
describe('Invoice CQRS Integration Tests', () => {
  let module: TestingModule;
  let commandBus: CommandBus;
  let queryBus: QueryBus;
  let eventBus: EventBus;
  let connection: Connection;
  let invoiceRepository: InvoiceEventStoreRepository;
  let projectionRepository: Repository<InvoiceProjection>;
  let summaryRepository: Repository<FinancialSummaryProjection>;
  let entityTransactionRepository: Repository<EntityTransactionProjection>;
  let masterDataClient: MasterDataClient;

  // Test data
  const TENANT_A_ID = 'tenant-a-test';
  const TENANT_B_ID = 'tenant-b-test';
  const USER_ID = 'user-test-001';
  const VENDOR_ID = 'vendor-001';
  const CUSTOMER_ID = 'customer-001';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        CqrsModule,
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.get('DB_PORT', 5432),
            username: configService.get('DB_USERNAME', 'postgres'),
            password: configService.get('DB_PASSWORD', 'postgres'),
            database: configService.get('DB_NAME', 'finance_test'),
            entities: [InvoiceProjection, FinancialSummaryProjection, EntityTransactionProjection],
            synchronize: true, // Only for testing
            dropSchema: true, // Clean slate for each test run
          }),
          inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([
          InvoiceProjection,
          FinancialSummaryProjection,
          EntityTransactionProjection,
        ]),
      ],
      providers: [
        // Command Handlers
        CreateInvoiceHandler,
        ApproveInvoiceHandler,
        CancelInvoiceHandler,
        // Query Handlers
        GetInvoiceHandler,
        GetInvoicesHandler,
        InvoiceProjectionHandler,
        // Repository
        {
          provide: 'IInvoiceRepository',
          useClass: InvoiceEventStoreRepository,
        },
        // Mock MasterDataClient
        {
          provide: MasterDataClient,
          useValue: {
            getVendor: jest.fn().mockResolvedValue({
              id: VENDOR_ID,
              name: 'Test Vendor Ltd.',
              tin: '123456789012',
              bin: '000123456789',
            }),
            getCustomer: jest.fn().mockResolvedValue({
              id: CUSTOMER_ID,
              name: 'Test Customer Corp.',
              tin: '987654321098',
              bin: '000987654321',
            }),
          },
        },
        // Mock EventStore Client
        {
          provide: EventStoreDBClient,
          useValue: {
            appendToStream: jest.fn(),
            readStream: jest.fn(),
          },
        },
      ],
    }).compile();

    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
    eventBus = module.get<EventBus>(EventBus);
    connection = module.get<Connection>(Connection);
    invoiceRepository = module.get('IInvoiceRepository');
    projectionRepository = module.get('InvoiceProjectionRepository');
    summaryRepository = module.get('FinancialSummaryProjectionRepository');
    entityTransactionRepository = module.get('EntityTransactionProjectionRepository');
    masterDataClient = module.get<MasterDataClient>(MasterDataClient);

    // Command handlers are auto-registered via @CommandHandler decorator
    // Query handlers are auto-registered via @QueryHandler decorator
    // No manual registration needed when using decorators

    // Subscribe to events
    eventBus.subscribe((event) => {
      const projectionHandler = module.get(InvoiceProjectionHandler);
      projectionHandler.handle(event);
    });
  });

  afterAll(async () => {
    await connection.close();
    await module.close();
  });

  beforeEach(async () => {
    // Clean up projections before each test
    await projectionRepository.clear();
    await summaryRepository.clear();
    await entityTransactionRepository.clear();
  });

  describe('Complete CQRS Flow: Command → Event → Projection → Query', () => {
    it('should create invoice via command, project to read model, and query successfully', async () => {
      // ARRANGE
      const lineItems: LineItemDto[] = [
        {
          description: 'Consulting Services',
          quantity: 10,
          unitPrice: Money.create(5000, 'BDT'),
          vatCategory: VATCategory.STANDARD,
          hsCode: '998311',
        },
        {
          description: 'Software License',
          quantity: 1,
          unitPrice: Money.create(50000, 'BDT'),
          vatCategory: VATCategory.STANDARD,
          hsCode: '998312',
        },
      ];

      const command = new CreateInvoiceCommand(
        CUSTOMER_ID,
        VENDOR_ID,
        new Date('2024-01-15'),
        new Date('2024-02-15'),
        lineItems,
        TENANT_A_ID,
        USER_ID,
        '123456789012', // vendorTIN
        '000123456789', // vendorBIN
        '987654321098', // customerTIN
        '000987654321', // customerBIN
      );

      // ACT - Execute command
      const invoiceId = await commandBus.execute<CreateInvoiceCommand, string>(command);

      // Wait for projection to complete (simulate async event processing)
      await new Promise(resolve => setTimeout(resolve, 100));

      // ASSERT - Query read model
      const invoiceDto = await queryBus.execute(new GetInvoiceQuery(invoiceId));

      expect(invoiceDto).toBeDefined();
      expect(invoiceDto?.id).toBe(invoiceId);
      expect(invoiceDto?.status).toBe('DRAFT');
      expect(invoiceDto?.vendorId).toBe(VENDOR_ID);
      expect(invoiceDto?.customerId).toBe(CUSTOMER_ID);
      expect(invoiceDto?.lineItems).toHaveLength(2);
      expect(invoiceDto?.subtotal.amount).toBe(100000); // (10 * 5000) + (1 * 50000)
      expect(invoiceDto?.vatAmount.amount).toBe(15000); // 15% of 100000
      expect(invoiceDto?.grandTotal.amount).toBe(115000);

      // Verify vendor/customer details were fetched
      expect(masterDataClient.getVendor).toHaveBeenCalledWith(VENDOR_ID);
      expect(masterDataClient.getCustomer).toHaveBeenCalledWith(CUSTOMER_ID);
    });

    it('should handle approve invoice workflow with status update', async () => {
      // ARRANGE - Create invoice first
      const lineItems: LineItemDto[] = [
        {
          description: 'Product A',
          quantity: 5,
          unitPrice: Money.create(1000, 'BDT'),
          vatCategory: VATCategory.STANDARD,
          hsCode: '998313',
        },
      ];

      const createCommand = new CreateInvoiceCommand(
        CUSTOMER_ID,
        VENDOR_ID,
        new Date('2024-01-20'),
        new Date('2024-02-20'),
        lineItems,
        TENANT_A_ID,
        USER_ID,
      );

      const invoiceId = await commandBus.execute<CreateInvoiceCommand, string>(createCommand);
      await new Promise(resolve => setTimeout(resolve, 100));

      // ACT - Approve invoice
      const approveCommand = new ApproveInvoiceCommand(
        invoiceId,
        USER_ID,
      );

      await commandBus.execute(approveCommand);
      await new Promise(resolve => setTimeout(resolve, 100));

      // ASSERT
      const approvedInvoice = await queryBus.execute(new GetInvoiceQuery(invoiceId));

      expect(approvedInvoice).toBeDefined();
      expect(approvedInvoice?.status).toBe('APPROVED');
      expect(approvedInvoice?.mushakNumber).toBeDefined();
      expect(approvedInvoice?.mushakNumber).toMatch(/^MUSHAK-6\.3-\d{4}-\d{2}-\d{2}-\d{6}$/);
    });

    it('should handle cancel invoice workflow with status update', async () => {
      // ARRANGE - Create invoice
      const lineItems: LineItemDto[] = [
        {
          description: 'Service Package',
          quantity: 1,
          unitPrice: Money.create(25000, 'BDT'),
          vatCategory: VATCategory.STANDARD,
          hsCode: '998314',
        },
      ];

      const createCommand = new CreateInvoiceCommand(
        CUSTOMER_ID,
        VENDOR_ID,
        new Date('2024-01-25'),
        new Date('2024-02-25'),
        lineItems,
        TENANT_A_ID,
        USER_ID,
      );

      const invoiceId = await commandBus.execute<CreateInvoiceCommand, string>(createCommand);
      await new Promise(resolve => setTimeout(resolve, 100));

      // ACT - Cancel invoice
      const cancelCommand = new CancelInvoiceCommand(
        invoiceId,
        'Customer requested cancellation',
        USER_ID,
      );

      await commandBus.execute(cancelCommand);
      await new Promise(resolve => setTimeout(resolve, 100));

      // ASSERT
      const cancelledInvoice = await queryBus.execute(new GetInvoiceQuery(invoiceId));

      expect(cancelledInvoice).toBeDefined();
      expect(cancelledInvoice?.status).toBe('CANCELLED');
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should isolate invoices between different tenants', async () => {
      // ARRANGE - Create invoice for Tenant A
      const lineItemsTenantA: LineItemDto[] = [
        {
          description: 'Tenant A Product',
          quantity: 2,
          unitPrice: Money.create(3000, 'BDT'),
          vatCategory: VATCategory.STANDARD,
          hsCode: '998315',
        },
      ];

      const commandTenantA = new CreateInvoiceCommand(
        CUSTOMER_ID,
        VENDOR_ID,
        new Date('2024-02-01'),
        new Date('2024-03-01'),
        lineItemsTenantA,
        TENANT_A_ID,
        USER_ID,
      );

      const invoiceIdA = await commandBus.execute<CreateInvoiceCommand, string>(commandTenantA);
      await new Promise(resolve => setTimeout(resolve, 100));

      // ARRANGE - Create invoice for Tenant B
      const lineItemsTenantB: LineItemDto[] = [
        {
          description: 'Tenant B Product',
          quantity: 3,
          unitPrice: Money.create(4000, 'BDT'),
          vatCategory: VATCategory.STANDARD,
          hsCode: '998316',
        },
      ];

      const commandTenantB = new CreateInvoiceCommand(
        CUSTOMER_ID,
        VENDOR_ID,
        new Date('2024-02-05'),
        new Date('2024-03-05'),
        lineItemsTenantB,
        TENANT_B_ID,
        USER_ID,
      );

      const invoiceIdB = await commandBus.execute<CreateInvoiceCommand, string>(commandTenantB);
      await new Promise(resolve => setTimeout(resolve, 100));

      // ACT - Query invoices for Tenant A
      const tenantAInvoices = await queryBus.execute(
        new GetInvoicesQuery(TENANT_A_ID, 10, 0)
      );

      // ACT - Query invoices for Tenant B
      const tenantBInvoices = await queryBus.execute(
        new GetInvoicesQuery(TENANT_B_ID, 10, 0)
      );

      // ASSERT - Tenant A should only see their invoice
      expect(tenantAInvoices.data).toHaveLength(1);
      expect(tenantAInvoices.data[0].id).toBe(invoiceIdA);
      expect(tenantAInvoices.data[0].lineItems[0].description).toBe('Tenant A Product');

      // ASSERT - Tenant B should only see their invoice
      expect(tenantBInvoices.data).toHaveLength(1);
      expect(tenantBInvoices.data[0].id).toBe(invoiceIdB);
      expect(tenantBInvoices.data[0].lineItems[0].description).toBe('Tenant B Product');
    });

    it('should prevent cross-tenant data access via query', async () => {
      // ARRANGE - Create invoice for Tenant A
      const lineItems: LineItemDto[] = [
        {
          description: 'Confidential Data',
          quantity: 1,
          unitPrice: Money.create(10000, 'BDT'),
          vatCategory: VATCategory.STANDARD,
          hsCode: '998317',
        },
      ];

      const command = new CreateInvoiceCommand(
        CUSTOMER_ID,
        VENDOR_ID,
        new Date('2024-02-10'),
        new Date('2024-03-10'),
        lineItems,
        TENANT_A_ID,
        USER_ID,
      );

      const invoiceId = await commandBus.execute<CreateInvoiceCommand, string>(command);
      await new Promise(resolve => setTimeout(resolve, 100));

      // ACT - Try to query Tenant A invoice from Tenant B context
      const projection = await projectionRepository.findOne({
        where: { id: invoiceId, tenantId: TENANT_B_ID },
      });

      // ASSERT - Should not find invoice (different tenant)
      expect(projection).toBeNull();

      // Verify invoice exists for correct tenant
      const correctProjection = await projectionRepository.findOne({
        where: { id: invoiceId, tenantId: TENANT_A_ID },
      });
      expect(correctProjection).toBeDefined();
      expect(correctProjection?.tenantId).toBe(TENANT_A_ID);
    });
  });

  describe('Event Replay and Consistency', () => {
    it('should rebuild projections from events after deletion', async () => {
      // ARRANGE - Create invoice
      const lineItems: LineItemDto[] = [
        {
          description: 'Event Replay Test Product',
          quantity: 4,
          unitPrice: Money.create(2500, 'BDT'),
          vatCategory: VATCategory.STANDARD,
          hsCode: '998318',
        },
      ];

      const command = new CreateInvoiceCommand(
        CUSTOMER_ID,
        VENDOR_ID,
        new Date('2024-02-15'),
        new Date('2024-03-15'),
        lineItems,
        TENANT_A_ID,
        USER_ID,
      );

      const invoiceId = await commandBus.execute<CreateInvoiceCommand, string>(command);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify projection exists
      const originalProjection = await projectionRepository.findOne({
        where: { id: invoiceId },
      });
      expect(originalProjection).toBeDefined();
      const originalData = { ...originalProjection };

      // ACT - Delete projection (simulate data loss)
      await projectionRepository.delete({ id: invoiceId });

      // Verify projection is deleted
      const deletedProjection = await projectionRepository.findOne({
        where: { id: invoiceId },
      });
      expect(deletedProjection).toBeNull();

      // Replay events from EventStore
      const invoice = await invoiceRepository.findById(invoiceId, TENANT_A_ID);
      expect(invoice).toBeDefined();

      const events = invoice!.getUncommittedEvents();
      const projectionHandler = module.get(InvoiceProjectionHandler);

      for (const event of events) {
        await projectionHandler.handle(event);
      }

      // ASSERT - Projection should be rebuilt with same data
      const rebuiltProjection = await projectionRepository.findOne({
        where: { id: invoiceId },
      });

      expect(rebuiltProjection).toBeDefined();
      expect(rebuiltProjection?.id).toBe(originalData.id);
      expect(rebuiltProjection?.invoiceNumber).toBe(originalData.invoiceNumber);
      expect(rebuiltProjection?.subtotal).toBe(originalData.subtotal);
      expect(rebuiltProjection?.grandTotal).toBe(originalData.grandTotal);
      expect(rebuiltProjection?.status).toBe(originalData.status);
    });
  });

  describe('Financial Summary Projection', () => {
    it('should update financial summary on invoice approval', async () => {
      // ARRANGE - Create and approve multiple invoices
      const invoiceCount = 3;
      const invoiceIds: string[] = [];

      for (let i = 0; i < invoiceCount; i++) {
        const lineItems: LineItemDto[] = [
          {
            description: `Product ${i + 1}`,
            quantity: 1,
            unitPrice: Money.create(10000, 'BDT'),
            vatCategory: VATCategory.STANDARD,
            hsCode: `99831${i}`,
          },
        ];

        const createCommand = new CreateInvoiceCommand(
          CUSTOMER_ID,
          VENDOR_ID,
          new Date('2024-03-01'),
          new Date('2024-04-01'),
          lineItems,
          TENANT_A_ID,
          USER_ID,
        );

        const invoiceId = await commandBus.execute<CreateInvoiceCommand, string>(createCommand);
        await new Promise(resolve => setTimeout(resolve, 100));

        const approveCommand = new ApproveInvoiceCommand(invoiceId, USER_ID);
        await commandBus.execute(approveCommand);
        await new Promise(resolve => setTimeout(resolve, 100));

        invoiceIds.push(invoiceId);
      }

      // ACT - Query financial summary
      const period = '2024-03';
      const summaryId = `${TENANT_A_ID}-${period}`;
      const summary = await summaryRepository.findOne({
        where: { id: summaryId },
      });

      // ASSERT
      expect(summary).toBeDefined();
      expect(summary?.invoiceCount).toBe(invoiceCount);
      expect(summary?.totalRevenue).toBe(30000); // 10000 * 3
      expect(summary?.totalVATCollected).toBe(4500); // 15% of 30000
      expect(summary?.accountsReceivable).toBe(34500); // Revenue + VAT
    });
  });
});
