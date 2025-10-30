# Testing NestJS Applications

**Purpose**: Comprehensive guide for unit testing NestJS components (providers, guards, interceptors, pipes, resolvers) with mocking strategies.

---

## Overview

**Testing Levels in Vextrus ERP:**
- **Unit Tests**: Single class in isolation (this guide)
- **Integration Tests**: Module-level testing with TestingModule
- **E2E Tests**: Full application testing with supertest

**Focus**: This guide covers unit testing NestJS components with proper mocking.

---

## TestingModule Setup

### 1. Basic TestingModule

```typescript
import { Test, TestingModule } from '@nestjs/testing';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [InvoiceService],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

**Key Methods:**
- `Test.createTestingModule({ providers, imports, controllers })`: Create test module
- `module.compile()`: Compile module (async)
- `module.get<T>(token)`: Retrieve provider from DI container
- `module.close()`: Close module (cleanup)

---

### 2. Mocking Dependencies with useValue

```typescript
describe('CreateInvoiceHandler', () => {
  let handler: CreateInvoiceHandler;
  let repository: IInvoiceRepository;
  let masterDataClient: MasterDataClient;

  const mockRepository = {
    save: jest.fn(),
    findById: jest.fn(),
  };

  const mockMasterDataClient = {
    getVendor: jest.fn(),
    getCustomer: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreateInvoiceHandler,
        {
          provide: 'IInvoiceRepository',
          useValue: mockRepository,
        },
        {
          provide: MasterDataClient,
          useValue: mockMasterDataClient,
        },
      ],
    }).compile();

    handler = module.get<CreateInvoiceHandler>(CreateInvoiceHandler);
    repository = module.get('IInvoiceRepository');
    masterDataClient = module.get(MasterDataClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create invoice with valid vendor', async () => {
    const vendorId = 'vendor-123';
    const customerId = 'customer-456';

    mockMasterDataClient.getVendor.mockResolvedValue({
      id: vendorId,
      name: 'Acme Corp',
      tin: '123456789012',
    });

    mockMasterDataClient.getCustomer.mockResolvedValue({
      id: customerId,
      name: 'John Doe',
    });

    mockRepository.save.mockResolvedValue(undefined);

    const command = new CreateInvoiceCommand({
      vendorId,
      customerId,
      lineItems: [{ description: 'Item 1', quantity: 1, unitPrice: 100 }],
      tenantId: 'tenant-1',
    });

    await handler.execute(command);

    expect(mockMasterDataClient.getVendor).toHaveBeenCalledWith(vendorId, 'tenant-1');
    expect(mockMasterDataClient.getCustomer).toHaveBeenCalledWith(customerId, 'tenant-1');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should throw error if vendor not found', async () => {
    mockMasterDataClient.getVendor.mockResolvedValue(null);

    const command = new CreateInvoiceCommand({
      vendorId: 'invalid-vendor',
      customerId: 'customer-456',
      lineItems: [],
      tenantId: 'tenant-1',
    });

    await expect(handler.execute(command)).rejects.toThrow('Vendor not found');
  });
});
```

**Benefits:**
- **Full control**: Mock return values, errors, delays
- **Isolation**: Test handler without real database or external services
- **Fast**: No I/O operations
- **Deterministic**: Predictable test results

---

### 3. Mocking with useFactory

```typescript
// Complex mock setup
const module = await Test.createTestingModule({
  providers: [
    InvoiceService,
    {
      provide: 'IInvoiceRepository',
      useFactory: () => {
        const repository = {
          save: jest.fn(),
          findById: jest.fn(),
        };

        // Pre-configure mocks
        repository.findById.mockImplementation(async (id: string) => {
          if (id === 'invoice-1') {
            return createMockInvoice({ id: 'invoice-1', status: InvoiceStatus.DRAFT });
          }
          return null;
        });

        return repository;
      },
    },
  ],
}).compile();
```

**When to Use:**
- Complex mock initialization
- Shared mock configuration
- Conditional mock behavior

---

### 4. Mocking with useClass

```typescript
// Mock implementation class
class MockInvoiceRepository implements IInvoiceRepository {
  private invoices = new Map<string, Invoice>();

  async save(invoice: Invoice): Promise<void> {
    this.invoices.set(invoice.id, invoice);
  }

  async findById(id: string, tenantId: string): Promise<Invoice> {
    return this.invoices.get(id) || null;
  }

  // Test helper
  reset() {
    this.invoices.clear();
  }
}

const module = await Test.createTestingModule({
  providers: [
    InvoiceService,
    {
      provide: 'IInvoiceRepository',
      useClass: MockInvoiceRepository,
    },
  ],
}).compile();

// Access mock
const repository = module.get<MockInvoiceRepository>('IInvoiceRepository');
repository.reset(); // Clear state between tests
```

**When to Use:**
- Stateful mocks (in-memory repository)
- Shared mock behavior across tests
- More realistic mock implementations

---

## Testing CQRS Components

### 5. Testing Command Handlers

```typescript
import { CommandBus } from '@nestjs/cqrs';

describe('ApproveInvoiceHandler', () => {
  let handler: ApproveInvoiceHandler;
  let repository: jest.Mocked<IInvoiceRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ApproveInvoiceHandler,
        {
          provide: 'IInvoiceRepository',
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: EventBus,
          useValue: {
            publish: jest.fn(),
            publishAll: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get(ApproveInvoiceHandler);
    repository = module.get('IInvoiceRepository');
    eventBus = module.get(EventBus);
  });

  it('should approve invoice and publish event', async () => {
    const invoice = Invoice.create({
      invoiceId: new InvoiceId('invoice-1'),
      status: InvoiceStatus.DRAFT,
      // ...
    });

    repository.findById.mockResolvedValue(invoice);
    repository.save.mockResolvedValue(undefined);

    const command = new ApproveInvoiceCommand('invoice-1', 'tenant-1', 'user-1');

    await handler.execute(command);

    expect(repository.findById).toHaveBeenCalledWith('invoice-1', 'tenant-1');
    expect(repository.save).toHaveBeenCalled();
    expect(eventBus.publishAll).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: 'InvoiceApprovedEvent',
        }),
      ]),
    );
  });

  it('should throw error if invoice not found', async () => {
    repository.findById.mockResolvedValue(null);

    const command = new ApproveInvoiceCommand('invalid-id', 'tenant-1', 'user-1');

    await expect(handler.execute(command)).rejects.toThrow(InvoiceNotFoundException);
  });

  it('should throw error if invoice already approved', async () => {
    const invoice = Invoice.create({
      invoiceId: new InvoiceId('invoice-1'),
      status: InvoiceStatus.APPROVED, // Already approved
      // ...
    });

    repository.findById.mockResolvedValue(invoice);

    const command = new ApproveInvoiceCommand('invoice-1', 'tenant-1', 'user-1');

    await expect(handler.execute(command)).rejects.toThrow(InvalidInvoiceStateException);
  });
});
```

**Key Assertions:**
- Verify repository methods called with correct arguments
- Verify domain events published
- Test error cases (not found, invalid state)

---

### 6. Testing Query Handlers

```typescript
describe('GetInvoicesHandler', () => {
  let handler: GetInvoicesHandler;
  let repository: jest.Mocked<InvoiceProjectionRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetInvoicesHandler,
        {
          provide: InvoiceProjectionRepository,
          useValue: {
            find: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get(GetInvoicesHandler);
    repository = module.get(InvoiceProjectionRepository);
  });

  it('should return paginated invoices', async () => {
    const invoices = [
      { id: 'invoice-1', invoiceNumber: 'INV-001' },
      { id: 'invoice-2', invoiceNumber: 'INV-002' },
    ];

    repository.find.mockResolvedValue(invoices);
    repository.count.mockResolvedValue(2);

    const query = new GetInvoicesQuery({
      tenantId: 'tenant-1',
      page: 1,
      limit: 10,
    });

    const result = await handler.execute(query);

    expect(result.items).toEqual(invoices);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('should filter by status', async () => {
    repository.find.mockResolvedValue([]);
    repository.count.mockResolvedValue(0);

    const query = new GetInvoicesQuery({
      tenantId: 'tenant-1',
      status: InvoiceStatus.APPROVED,
      page: 1,
      limit: 10,
    });

    await handler.execute(query);

    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: InvoiceStatus.APPROVED,
        }),
      }),
    );
  });
});
```

---

### 7. Testing Event Handlers

```typescript
describe('InvoiceApprovedEventHandler', () => {
  let handler: InvoiceApprovedEventHandler;
  let projectionRepository: jest.Mocked<InvoiceProjectionRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        InvoiceApprovedEventHandler,
        {
          provide: InvoiceProjectionRepository,
          useValue: {
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get(InvoiceApprovedEventHandler);
    projectionRepository = module.get(InvoiceProjectionRepository);
  });

  it('should update projection when invoice approved', async () => {
    const event = new InvoiceApprovedEvent({
      invoiceId: 'invoice-1',
      approvedBy: 'user-1',
      approvedAt: new Date(),
      tenantId: 'tenant-1',
    });

    projectionRepository.update.mockResolvedValue(undefined);

    await handler.handle(event);

    expect(projectionRepository.update).toHaveBeenCalledWith(
      { id: 'invoice-1', tenantId: 'tenant-1' },
      expect.objectContaining({
        status: InvoiceStatus.APPROVED,
        approvedBy: 'user-1',
        approvedAt: expect.any(Date),
      }),
    );
  });
});
```

---

## Testing GraphQL Resolvers

### 8. Testing Resolvers with Command/Query Bus

```typescript
describe('InvoiceResolver', () => {
  let resolver: InvoiceResolver;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        InvoiceResolver,
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get(InvoiceResolver);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  describe('createInvoice', () => {
    it('should create invoice via command bus', async () => {
      const input = {
        vendorId: 'vendor-1',
        customerId: 'customer-1',
        lineItems: [{ description: 'Item 1', quantity: 1, unitPrice: 100 }],
      };

      const context = {
        tenantId: 'tenant-1',
        userId: 'user-1',
      };

      const createdInvoice = {
        id: 'invoice-1',
        invoiceNumber: 'INV-001',
      };

      commandBus.execute.mockResolvedValue(createdInvoice);

      const result = await resolver.createInvoice(input, context);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          vendorId: input.vendorId,
          customerId: input.customerId,
          tenantId: context.tenantId,
        }),
      );

      expect(result).toEqual(createdInvoice);
    });

    it('should throw error if vendor not found', async () => {
      commandBus.execute.mockRejectedValue(new VendorNotFoundException('vendor-1'));

      const input = {
        vendorId: 'invalid-vendor',
        customerId: 'customer-1',
        lineItems: [],
      };

      const context = { tenantId: 'tenant-1', userId: 'user-1' };

      await expect(resolver.createInvoice(input, context)).rejects.toThrow(
        VendorNotFoundException,
      );
    });
  });

  describe('invoice (query)', () => {
    it('should fetch invoice by ID', async () => {
      const invoice = {
        id: 'invoice-1',
        invoiceNumber: 'INV-001',
        status: InvoiceStatus.DRAFT,
      };

      queryBus.execute.mockResolvedValue(invoice);

      const context = { tenantId: 'tenant-1' };

      const result = await resolver.invoice('invoice-1', context);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceId: 'invoice-1',
          tenantId: 'tenant-1',
        }),
      );

      expect(result).toEqual(invoice);
    });

    it('should return null if invoice not found', async () => {
      queryBus.execute.mockResolvedValue(null);

      const context = { tenantId: 'tenant-1' };

      const result = await resolver.invoice('invalid-id', context);

      expect(result).toBeNull();
    });
  });

  describe('invoices (query with pagination)', () => {
    it('should fetch paginated invoices', async () => {
      const invoices = [
        { id: 'invoice-1', invoiceNumber: 'INV-001' },
        { id: 'invoice-2', invoiceNumber: 'INV-002' },
      ];

      queryBus.execute.mockResolvedValue({
        items: invoices,
        total: 2,
        page: 1,
        limit: 10,
      });

      const context = { tenantId: 'tenant-1' };

      const result = await resolver.invoices({ page: 1, limit: 10 }, context);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          page: 1,
          limit: 10,
        }),
      );

      expect(result.items).toEqual(invoices);
      expect(result.total).toBe(2);
    });
  });
});
```

---

## Testing Guards

### 9. Testing JwtAuthGuard

```typescript
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get(JwtAuthGuard);
    jwtService = module.get(JwtService);
    reflector = module.get(Reflector);
  });

  const createMockContext = (headers: Record<string, string> = {}): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  it('should allow request with valid JWT', async () => {
    const mockContext = createMockContext({
      authorization: 'Bearer valid-token',
    });

    jwtService.verify.mockReturnValue({
      sub: 'user-1',
      tenantId: 'tenant-1',
    });

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
  });

  it('should deny request without authorization header', async () => {
    const mockContext = createMockContext({});

    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });

  it('should deny request with invalid JWT', async () => {
    const mockContext = createMockContext({
      authorization: 'Bearer invalid-token',
    });

    jwtService.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });

  it('should skip authentication for public routes', async () => {
    const mockContext = createMockContext({});

    // Mock @Public() decorator
    reflector.get.mockReturnValue(true);

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(jwtService.verify).not.toHaveBeenCalled();
  });
});
```

---

### 10. Testing RBAC Guard

```typescript
describe('RBACGuard', () => {
  let guard: RBACGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RBACGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get(RBACGuard);
    reflector = module.get(Reflector);
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  it('should allow user with required permission', () => {
    const mockContext = createMockContext({
      sub: 'user-1',
      permissions: ['invoice:create', 'invoice:read'],
    });

    reflector.get.mockReturnValue(['invoice:create']);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should deny user without required permission', () => {
    const mockContext = createMockContext({
      sub: 'user-1',
      permissions: ['invoice:read'],
    });

    reflector.get.mockReturnValue(['invoice:create', 'invoice:delete']);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  it('should allow if no permissions required', () => {
    const mockContext = createMockContext({
      sub: 'user-1',
      permissions: [],
    });

    reflector.get.mockReturnValue(undefined);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });
});
```

---

## Testing Interceptors

### 11. Testing TenantContextInterceptor

```typescript
describe('TenantContextInterceptor', () => {
  let interceptor: TenantContextInterceptor;

  beforeEach(() => {
    interceptor = new TenantContextInterceptor();
  });

  const createMockContext = (headers: Record<string, string> = {}): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    } as any;
  };

  const createMockCallHandler = () => ({
    handle: jest.fn(() => of({ data: 'test' })),
  });

  it('should extract tenant ID from headers', async () => {
    const mockContext = createMockContext({ 'x-tenant-id': 'tenant-1' });
    const mockCallHandler = createMockCallHandler();

    await interceptor.intercept(mockContext, mockCallHandler).toPromise();

    const request = mockContext.switchToHttp().getRequest();
    expect(request['tenantId']).toBe('tenant-1');
  });

  it('should throw error if tenant ID missing', async () => {
    const mockContext = createMockContext({});
    const mockCallHandler = createMockCallHandler();

    await expect(
      interceptor.intercept(mockContext, mockCallHandler).toPromise(),
    ).rejects.toThrow('Tenant ID is required');
  });
});
```

---

## Testing Pipes

### 12. Testing ValidationPipe with DTOs

```typescript
import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { IsString, IsNumber, Min } from 'class-validator';

class CreateInvoiceDto {
  @IsString()
  vendorId: string;

  @IsString()
  customerId: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

describe('ValidationPipe', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
  });

  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: CreateInvoiceDto,
    data: '',
  };

  it('should pass validation for valid DTO', async () => {
    const dto = {
      vendorId: 'vendor-1',
      customerId: 'customer-1',
      amount: 100,
    };

    const result = await pipe.transform(dto, metadata);

    expect(result).toEqual(dto);
  });

  it('should throw error for invalid DTO', async () => {
    const dto = {
      vendorId: 'vendor-1',
      customerId: 'customer-1',
      amount: -100, // Invalid (negative)
    };

    await expect(pipe.transform(dto, metadata)).rejects.toThrow();
  });

  it('should strip non-whitelisted properties', async () => {
    const dto = {
      vendorId: 'vendor-1',
      customerId: 'customer-1',
      amount: 100,
      extraField: 'should be removed',
    };

    const result = await pipe.transform(dto, metadata);

    expect(result).not.toHaveProperty('extraField');
  });
});
```

---

## Best Practices

### 13. Testing Best Practices

**1. Arrange-Act-Assert (AAA) Pattern**

```typescript
it('should approve invoice', async () => {
  // Arrange
  const invoice = createMockInvoice({ status: InvoiceStatus.DRAFT });
  repository.findById.mockResolvedValue(invoice);

  // Act
  await handler.execute(new ApproveInvoiceCommand('invoice-1', 'tenant-1'));

  // Assert
  expect(repository.save).toHaveBeenCalled();
});
```

**2. One Assertion Per Test**

```typescript
// ❌ Bad: Multiple assertions
it('should create invoice', async () => {
  const result = await handler.execute(command);
  expect(result.id).toBeDefined();
  expect(result.status).toBe(InvoiceStatus.DRAFT);
  expect(result.grandTotal).toBe(100);
});

// ✅ Good: Separate tests
it('should create invoice with generated ID', async () => {
  const result = await handler.execute(command);
  expect(result.id).toBeDefined();
});

it('should create invoice in DRAFT status', async () => {
  const result = await handler.execute(command);
  expect(result.status).toBe(InvoiceStatus.DRAFT);
});
```

**3. Clear Test Names**

```typescript
// ❌ Bad
it('test1', () => {});

// ✅ Good
it('should throw InvoiceNotFoundException when invoice not found', () => {});
```

**4. Mock Reset Between Tests**

```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

**5. Test Both Success and Error Cases**

```typescript
describe('createInvoice', () => {
  it('should create invoice successfully', async () => {
    // Success case
  });

  it('should throw error if vendor not found', async () => {
    // Error case
  });

  it('should throw error if customer not found', async () => {
    // Error case
  });
});
```

---

## Evidence from Vextrus ERP Codebase

### Finance Service Tests

**File**: `services/finance/src/application/commands/handlers/create-invoice.handler.spec.ts`

```typescript
describe('CreateInvoiceHandler', () => {
  let handler: CreateInvoiceHandler;
  let repository: IInvoiceRepository;
  let eventBus: EventBus;

  const mockRepository = {
    save: jest.fn(),
    findById: jest.fn(),
  };

  const mockEventBus = {
    publish: jest.fn(),
    publishAll: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreateInvoiceHandler,
        {
          provide: 'IInvoiceRepository',
          useValue: mockRepository,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get(CreateInvoiceHandler);
    repository = module.get('IInvoiceRepository');
    eventBus = module.get(EventBus);
  });

  // Tests...
});
```

---

## Summary

**Key Takeaways:**
- Use `Test.createTestingModule()` for dependency injection
- Mock dependencies with `useValue`, `useFactory`, or `useClass`
- Test CQRS handlers by mocking repository and event bus
- Test GraphQL resolvers by mocking command/query bus
- Test guards with mock `ExecutionContext`
- Test interceptors with mock `CallHandler`
- Follow AAA pattern, one assertion per test, clear naming

**Tools:**
- Jest: Test framework
- `@nestjs/testing`: TestingModule
- `jest.fn()`: Mock functions
- `jest.clearAllMocks()`: Reset mocks

**Further Reading:**
- Integration Testing: .claude/skills/integration-testing/SKILL.md
- Mocking Strategies: .claude/skills/integration-testing/resources/mocking-strategies.md
- NestJS Testing Docs: https://docs.nestjs.com/fundamentals/testing
