# NestJS Microservices Skill

## Module Organization

### Core Principles
- **Feature-based modules**: Organize by business capability
- **Layered architecture**: Domain → Application → Presentation → Infrastructure
- **Dependency injection**: Use NestJS DI container
- **Bounded contexts**: Each service is a bounded context

### Module Structure
```
services/invoice-service/
├── src/
│   ├── domain/                    # Domain layer (business logic)
│   │   ├── aggregates/           # Aggregates
│   │   ├── entities/             # Entities
│   │   ├── value-objects/        # Value objects
│   │   ├── events/               # Domain events
│   │   └── exceptions/           # Domain exceptions
│   ├── application/               # Application layer (use cases)
│   │   ├── commands/             # Command handlers
│   │   ├── queries/              # Query handlers
│   │   ├── services/             # Application services
│   │   ├── dtos/                 # Data transfer objects
│   │   └── mappers/              # Domain ↔ DTO mappers
│   ├── presentation/              # Presentation layer (API)
│   │   ├── graphql/              # GraphQL resolvers
│   │   │   ├── schema.graphql
│   │   │   └── resolvers/
│   │   ├── rest/                 # REST controllers (if needed)
│   │   ├── grpc/                 # gRPC services (if needed)
│   │   └── guards/               # Auth guards
│   ├── infrastructure/            # Infrastructure layer
│   │   ├── repositories/         # Repository implementations
│   │   ├── messaging/            # Event bus, message queue
│   │   ├── persistence/          # Database connections
│   │   └── external/             # External service clients
│   ├── shared/                    # Shared code
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── utils/
│   ├── config/                    # Configuration
│   │   ├── database.config.ts
│   │   ├── graphql.config.ts
│   │   └── app.config.ts
│   ├── invoice.module.ts          # Root module
│   └── main.ts                    # Bootstrap
└── test/
    ├── unit/
    ├── integration/
    └── e2e/
```

### Implementation Pattern
```typescript
// Feature module
@Module({
  imports: [
    // Domain module
    InvoiceDomainModule,

    // Application module
    CqrsModule,

    // Infrastructure
    TypeOrmModule.forFeature([InvoiceEntity]),
    EventStoreModule,

    // External dependencies
    CustomerModule, // From customer-service
    PaymentModule,  // From payment-service
  ],
  providers: [
    // Application services
    InvoiceService,

    // Command handlers
    CreateInvoiceHandler,
    ApproveInvoiceHandler,

    // Query handlers
    GetInvoiceByIdHandler,
    GetInvoicesHandler,

    // Domain services
    InvoiceDomainService,

    // Repositories
    {
      provide: 'InvoiceRepository',
      useClass: EventSourcedInvoiceRepository
    },

    // Event handlers
    InvoiceApprovedHandler,

    // Resolvers
    InvoiceResolver,
    InvoiceQueryResolver,
    InvoiceMutationResolver,
  ],
  exports: [InvoiceService]
})
export class InvoiceModule {}
```

---

## Dependency Injection Patterns

### Core Principles
- **Constructor injection**: Inject dependencies via constructor
- **Interface-based**: Depend on abstractions, not concrete implementations
- **Provider tokens**: Use string tokens or symbols for interfaces
- **Scoped providers**: Request-scoped for user context

### Implementation Pattern
```typescript
// Domain service with interface
export interface IInvoiceRepository {
  save(invoice: InvoiceAggregate): Promise<void>;
  findById(id: string): Promise<InvoiceAggregate | null>;
  findByCustomerId(customerId: string): Promise<InvoiceAggregate[]>;
}

// Provider token
export const INVOICE_REPOSITORY = Symbol('INVOICE_REPOSITORY');

// Application service
@Injectable()
export class InvoiceService {
  constructor(
    // Inject by token
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepository: IInvoiceRepository,

    // Inject concrete class
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,

    // Inject configuration
    @Inject(INVOICE_CONFIG)
    private readonly config: InvoiceConfig,

    // Inject logger
    private readonly logger: Logger
  ) {
    this.logger.setContext(InvoiceService.name);
  }

  async createInvoice(data: CreateInvoiceDto): Promise<string> {
    this.logger.log('Creating invoice', { customerId: data.customerId });

    return this.commandBus.execute(
      new CreateInvoiceCommand(
        data.customerId,
        data.items,
        data.dueDate,
        generateIdempotencyKey()
      )
    );
  }
}

// Module configuration
@Module({
  providers: [
    InvoiceService,
    {
      provide: INVOICE_REPOSITORY,
      useClass: EventSourcedInvoiceRepository
    },
    {
      provide: INVOICE_CONFIG,
      useFactory: (configService: ConfigService) => ({
        defaultDueDays: configService.get('INVOICE_DUE_DAYS', 30),
        vatRate: configService.get('INVOICE_VAT_RATE', 0.15)
      }),
      inject: [ConfigService]
    }
  ]
})
export class InvoiceModule {}
```

### Request-Scoped Providers
```typescript
// User context provider
@Injectable({ scope: Scope.REQUEST })
export class UserContext {
  constructor(
    @Inject(REQUEST) private readonly request: Request
  ) {}

  get userId(): string {
    return this.request.user?.id;
  }

  get tenantId(): string {
    return this.request.user?.tenantId;
  }

  get permissions(): string[] {
    return this.request.user?.permissions || [];
  }
}

// Use in service
@Injectable()
export class InvoiceService {
  constructor(
    private readonly userContext: UserContext // Automatically request-scoped
  ) {}

  async createInvoice(data: CreateInvoiceDto): Promise<string> {
    // Access current user
    const userId = this.userContext.userId;
    const tenantId = this.userContext.tenantId;

    // Use in business logic...
  }
}
```

---

## CQRS Implementation

### Core Principles
- **Command Query Separation**: Commands modify state, queries read state
- **Command Bus**: Route commands to handlers
- **Query Bus**: Route queries to handlers
- **Event Bus**: Publish domain events

### Implementation Pattern
```typescript
// Command
export class CreateInvoiceCommand {
  constructor(
    public readonly customerId: string,
    public readonly items: CreateInvoiceItemDto[],
    public readonly dueDate: Date,
    public readonly idempotencyKey: string
  ) {}
}

// Command handler
@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler implements ICommandHandler<CreateInvoiceCommand> {
  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly repository: IInvoiceRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: CreateInvoiceCommand): Promise<string> {
    // Check idempotency
    const existing = await this.repository.findByIdempotencyKey(
      command.idempotencyKey
    );
    if (existing) {
      return existing.id;
    }

    // Create aggregate
    const invoice = InvoiceAggregate.create({
      customerId: command.customerId,
      items: command.items,
      dueDate: command.dueDate
    });

    // Persist
    await this.repository.save(invoice);

    // Publish events
    invoice.uncommittedEvents.forEach(event => {
      this.eventBus.publish(event);
    });

    return invoice.id;
  }
}

// Query
export class GetInvoiceByIdQuery {
  constructor(public readonly invoiceId: string) {}
}

// Query handler
@QueryHandler(GetInvoiceByIdQuery)
export class GetInvoiceByIdHandler implements IQueryHandler<GetInvoiceByIdQuery> {
  constructor(
    @InjectRepository(InvoiceReadModel)
    private readonly readModel: Repository<InvoiceReadModel>
  ) {}

  async execute(query: GetInvoiceByIdQuery): Promise<InvoiceDto> {
    const invoice = await this.readModel.findOne({
      where: { id: query.invoiceId }
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return InvoiceMapper.toDto(invoice);
  }
}

// Event handler
@EventsHandler(InvoiceCreatedEvent)
export class InvoiceCreatedHandler implements IEventHandler<InvoiceCreatedEvent> {
  constructor(
    @InjectRepository(InvoiceReadModel)
    private readonly readModel: Repository<InvoiceReadModel>,
    private readonly notificationService: NotificationService
  ) {}

  async handle(event: InvoiceCreatedEvent) {
    // Update read model
    await this.readModel.insert({
      id: event.data.invoiceId,
      customerId: event.data.customerId,
      totalAmount: event.data.totalAmount,
      status: 'DRAFT',
      createdAt: event.data.createdAt
    });

    // Send notification
    await this.notificationService.send({
      type: 'INVOICE_CREATED',
      recipientId: event.data.customerId,
      data: { invoiceId: event.data.invoiceId }
    });
  }
}

// Module setup
@Module({
  imports: [
    CqrsModule, // Provides CommandBus, QueryBus, EventBus
  ],
  providers: [
    // Command handlers
    CreateInvoiceHandler,
    ApproveInvoiceHandler,

    // Query handlers
    GetInvoiceByIdHandler,
    GetInvoicesHandler,

    // Event handlers
    InvoiceCreatedHandler,
    InvoiceApprovedHandler,
  ]
})
export class InvoiceModule {}
```

---

## Multi-Tenancy Patterns

### Core Principles
- **Tenant isolation**: Each tenant's data is isolated
- **Tenant context**: Track current tenant in request scope
- **Schema strategies**: Database-per-tenant, schema-per-tenant, or row-level
- **Tenant resolution**: Extract tenant from JWT, subdomain, or header

### Implementation Pattern

#### Tenant Context
```typescript
// Tenant context
@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  private tenantId: string;

  constructor(@Inject(REQUEST) private readonly request: Request) {
    // Extract tenant from JWT
    this.tenantId = request.user?.tenantId;
  }

  getTenantId(): string {
    if (!this.tenantId) {
      throw new UnauthorizedException('Tenant not found');
    }
    return this.tenantId;
  }
}
```

#### Tenant Interceptor
```typescript
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly tenantContext: TenantContext) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Validate tenant
    const tenantId = this.tenantContext.getTenantId();

    // Add tenant to request
    request.tenantId = tenantId;

    return next.handle();
  }
}
```

#### Schema-Per-Tenant Strategy
```typescript
// Dynamic database connection
@Injectable()
export class TenantDatabaseProvider {
  private connections = new Map<string, DataSource>();

  constructor(
    private readonly tenantContext: TenantContext,
    private readonly configService: ConfigService
  ) {}

  async getConnection(): Promise<DataSource> {
    const tenantId = this.tenantContext.getTenantId();

    // Check cache
    if (this.connections.has(tenantId)) {
      return this.connections.get(tenantId);
    }

    // Create new connection
    const dataSource = new DataSource({
      type: 'postgres',
      host: this.configService.get('DB_HOST'),
      port: this.configService.get('DB_PORT'),
      username: this.configService.get('DB_USERNAME'),
      password: this.configService.get('DB_PASSWORD'),
      database: this.configService.get('DB_NAME'),
      schema: `tenant_${tenantId}`, // Schema-per-tenant
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false
    });

    await dataSource.initialize();
    this.connections.set(tenantId, dataSource);

    return dataSource;
  }
}

// Use in repository
@Injectable()
export class InvoiceRepository {
  constructor(
    private readonly tenantDbProvider: TenantDatabaseProvider
  ) {}

  async save(invoice: InvoiceAggregate): Promise<void> {
    const connection = await this.tenantDbProvider.getConnection();
    const repository = connection.getRepository(InvoiceEntity);

    await repository.save(invoice);
  }
}
```

#### Row-Level Tenant Isolation
```typescript
// Entity with tenant
@Entity('invoices')
export class InvoiceEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string; // Tenant column

  @Column()
  invoiceNumber: string;

  // Other fields...

  @Index(['tenantId']) // Index for tenant queries
  @Column()
  status: string;
}

// Repository with tenant filter
@Injectable()
export class InvoiceRepository {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly repository: Repository<InvoiceEntity>,
    private readonly tenantContext: TenantContext
  ) {}

  async findById(id: string): Promise<InvoiceEntity> {
    const tenantId = this.tenantContext.getTenantId();

    // Always filter by tenant
    return this.repository.findOne({
      where: { id, tenantId }
    });
  }

  async findAll(): Promise<InvoiceEntity[]> {
    const tenantId = this.tenantContext.getTenantId();

    // Always filter by tenant
    return this.repository.find({
      where: { tenantId }
    });
  }
}
```

---

## Inter-Service Communication

### Synchronous Communication (GraphQL Federation)
```typescript
// Reference resolver for cross-service data
@Resolver('Customer')
export class CustomerInvoiceResolver {
  constructor(private readonly invoiceService: InvoiceService) {}

  @ResolveField('invoices')
  async invoices(
    @Parent() customer: { id: string },
    @Args('first') first?: number,
    @Args('after') after?: string
  ): Promise<InvoiceConnection> {
    return this.invoiceService.findByCustomerId(
      customer.id,
      { first, after }
    );
  }
}
```

### Asynchronous Communication (Event Bus)
```typescript
// Publish event to message queue
@EventsHandler(InvoiceApprovedEvent)
export class InvoiceApprovedHandler implements IEventHandler<InvoiceApprovedEvent> {
  constructor(
    @Inject('RABBITMQ_CLIENT')
    private readonly client: ClientProxy
  ) {}

  async handle(event: InvoiceApprovedEvent) {
    // Publish to message queue
    await this.client.emit('invoice.approved', {
      invoiceId: event.data.invoiceId,
      customerId: event.data.customerId,
      amount: event.data.totalAmount,
      timestamp: new Date()
    });
  }
}

// Subscribe in another service
@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @EventPattern('invoice.approved')
  async handleInvoiceApproved(data: InvoiceApprovedEventData) {
    await this.paymentService.createPaymentSchedule({
      invoiceId: data.invoiceId,
      amount: data.amount
    });
  }
}
```

---

## Configuration Management

### Environment-based Configuration
```typescript
// config/app.config.ts
export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  environment: process.env.NODE_ENV || 'development',
  serviceName: process.env.SERVICE_NAME || 'invoice-service',
  apiVersion: process.env.API_VERSION || 'v1'
}));

// config/database.config.ts
export default registerAs('database', () => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'vextrus_invoice',
  synchronize: process.env.DB_SYNC === 'true',
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
}));

// Module import
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, graphqlConfig],
      envFilePath: ['.env.local', '.env'],
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        // ... other validations
      })
    })
  ]
})
export class AppModule {}

// Use in service
@Injectable()
export class InvoiceService {
  constructor(
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>
  ) {
    console.log(`Service: ${this.config.serviceName}`);
  }
}
```

---

## Best Practices

### DO ✅
- Use feature-based module organization
- Follow layered architecture (Domain → Application → Presentation → Infrastructure)
- Inject dependencies via constructor
- Use dependency injection for testability
- Implement CQRS for command/query separation
- Use request-scoped providers for user/tenant context
- Isolate tenants properly (schema or row-level)
- Publish domain events asynchronously
- Validate configuration on startup
- Use global modules for shared services (Logger, Config)

### DON'T ❌
- Don't put business logic in controllers/resolvers
- Don't skip dependency injection (avoid `new` keyword)
- Don't mix commands and queries
- Don't forget tenant isolation
- Don't hardcode configuration
- Don't expose domain entities directly (use DTOs)
- Don't skip validation
- Don't forget to handle errors properly
- Don't create circular dependencies

---

## Testing Patterns

### Unit Testing
```typescript
describe('CreateInvoiceHandler', () => {
  let handler: CreateInvoiceHandler;
  let repository: jest.Mocked<IInvoiceRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreateInvoiceHandler,
        {
          provide: INVOICE_REPOSITORY,
          useValue: {
            save: jest.fn(),
            findByIdempotencyKey: jest.fn()
          }
        },
        {
          provide: EventBus,
          useValue: {
            publish: jest.fn()
          }
        }
      ]
    }).compile();

    handler = module.get(CreateInvoiceHandler);
    repository = module.get(INVOICE_REPOSITORY);
    eventBus = module.get(EventBus);
  });

  it('should create invoice', async () => {
    const command = new CreateInvoiceCommand(
      'customer-1',
      [{ description: 'Item 1', quantity: 1, unitPrice: 100 }],
      new Date(),
      'idempotency-key-1'
    );

    repository.findByIdempotencyKey.mockResolvedValue(null);

    const result = await handler.execute(command);

    expect(result).toBeDefined();
    expect(repository.save).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalled();
  });
});
```

---

## Reference

**Location Conventions**:
- Domain: `services/*/src/domain/`
- Application: `services/*/src/application/`
- Presentation: `services/*/src/presentation/`
- Infrastructure: `services/*/src/infrastructure/`
- Config: `services/*/src/config/`

**Further Reading**: `VEXTRUS-PATTERNS.md` for full NestJS microservices patterns

---

## Usage in Vextrus ERP

This skill is automatically activated when working on:
- Module organization
- Dependency injection
- CQRS implementation
- Multi-tenancy
- Inter-service communication
- Configuration management

**Always follow NestJS best practices for consistency across all microservices.**
