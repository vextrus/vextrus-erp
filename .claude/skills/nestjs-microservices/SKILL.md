---
name: nestjs-microservices
description: NestJS microservices patterns with DDD layered architecture and multi-tenancy. Use when working with NestJS modules, dependency injection, CQRS implementations, multi-tenant applications, microservice architecture, @Module decorators, @Injectable services, guards, interceptors, or NestJS configuration.
---

# NestJS Microservices + DDD - Complete Reference

**Auto-loaded when**: NestJS, @Module, @Injectable, microservice, multi-tenant, dependency injection keywords detected

---

## 1. Module Organization (Feature-Based)

### Directory Structure (DDD Layered)
```
services/finance/src/
├── domain/                # Business logic (pure, no dependencies)
│   ├── aggregates/       # Domain aggregates (Invoice, Payment)
│   ├── value-objects/    # Immutable values (Money, TIN, BIN)
│   ├── events/           # Domain events
│   └── repositories/     # Repository interfaces
├── application/          # Use cases (application layer)
│   ├── commands/         # Write operations
│   ├── queries/          # Read operations
│   ├── handlers/         # Command/Query handlers
│   └── services/         # Application services
├── infrastructure/       # External concerns
│   ├── persistence/      # EventStore, PostgreSQL
│   ├── messaging/        # Kafka integration
│   ├── guards/           # Auth guards
│   └── middleware/       # Tenant middleware
└── presentation/         # API layer
    ├── graphql/         # GraphQL resolvers
    └── rest/            # REST controllers
```

### Layer Dependencies Rule
```
Presentation → Application → Domain
Infrastructure → Domain (implements interfaces)

✅ presentation can import application
✅ application can import domain
✅ infrastructure implements domain interfaces
❌ domain NEVER imports other layers
```

---

## 2. Module Definition (@Module Decorator)

### Feature Module Pattern
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([InvoiceProjection]),  // Database entities
    CqrsModule,                                     // Command/Query bus
    CacheModule                                     // Redis cache
  ],
  providers: [
    // Command handlers
    CreateInvoiceHandler,
    ApproveInvoiceHandler,

    // Query handlers
    GetInvoiceHandler,
    GetInvoicesHandler,

    // Repositories
    {
      provide: 'IInvoiceRepository',
      useClass: InvoiceEventSourcedRepository
    },

    // Services
    TaxCalculationService,
    NBRIntegrationService
  ],
  controllers: [InvoiceController],           // REST controllers
  exports: [TaxCalculationService]            // Export for use in other modules
})
export class InvoiceModule {}
```

---

## 3. Dependency Injection

### Injectable Service (Singleton Scope)
```typescript
@Injectable()
export class TaxCalculationService {
  private readonly VAT_RATE = 0.15;

  constructor(
    private readonly configService: ConfigService,  // Constructor injection
    private readonly httpService: HttpService
  ) {}

  async calculateVAT(amount: number): Promise<number> {
    return amount * this.VAT_RATE;
  }
}
```

### Request-Scoped Service (Multi-Tenancy)
```typescript
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  constructor(@Inject(REQUEST) private readonly request: any) {}

  getTenantId(): string {
    return this.request.headers['x-tenant-id'] || this.request.user?.tenantId;
  }

  getUserId(): string {
    return this.request.user?.id;
  }
}
```

---

## 4. CQRS Implementation

### Command Handler (Write Operations)
```typescript
@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler implements ICommandHandler<CreateInvoiceCommand> {
  constructor(
    @Inject('IInvoiceRepository')
    private readonly repository: IInvoiceRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: CreateInvoiceCommand): Promise<string> {
    // 1. Create aggregate (business rules enforced here)
    const invoice = Invoice.create({
      customerId: new CustomerId(command.customerId),
      lineItems: command.lineItems,
      tenantId: new TenantId(command.tenantId)
    });

    // 2. Persist to event store
    await this.repository.save(invoice);

    // 3. Publish domain events to Kafka
    const events = invoice.getUncommittedEvents();
    for (const event of events) {
      this.eventBus.publish(event);
    }

    return invoice.getId().value;
  }
}
```

### Query Handler (Read Operations)
```typescript
@QueryHandler(GetInvoiceQuery)
export class GetInvoiceHandler implements IQueryHandler<GetInvoiceQuery> {
  constructor(
    @InjectRepository(InvoiceReadModel)
    private readonly readRepository: Repository<InvoiceReadModel>,
    private readonly cacheService: FinanceCacheService,
    private readonly tenantContext: TenantContextService
  ) {}

  async execute(query: GetInvoiceQuery): Promise<InvoiceDto | null> {
    const tenantId = this.tenantContext.getTenantId();

    // 1. Try cache first (cache-aside pattern)
    const cached = await this.cacheService.getInvoice(tenantId, query.invoiceId);
    if (cached) return cached;

    // 2. Query read model
    const invoice = await this.readRepository.findOne({
      where: { id: query.invoiceId }
    });

    // 3. Cache result
    if (invoice) {
      await this.cacheService.setInvoice(tenantId, query.invoiceId, invoice);
    }

    return invoice;
  }
}
```

### Event Handler (Projection Updates)
```typescript
@EventsHandler(InvoiceCreatedEvent, InvoiceApprovedEvent)
export class InvoiceProjectionHandler implements IEventHandler<DomainEvent> {
  constructor(
    @InjectRepository(InvoiceReadModel)
    private readonly readRepository: Repository<InvoiceReadModel>,
    private readonly cacheService: FinanceCacheService
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    if (event instanceof InvoiceCreatedEvent) {
      await this.handleInvoiceCreated(event);
    } else if (event instanceof InvoiceApprovedEvent) {
      await this.handleInvoiceApproved(event);
    }

    // Invalidate cache on every event
    await this.cacheService.invalidatePattern(`invoice:${event.aggregateId}`);
  }

  private async handleInvoiceCreated(event: InvoiceCreatedEvent): Promise<void> {
    const invoice = new InvoiceReadModel();
    invoice.id = event.invoiceId.value;
    invoice.status = 'DRAFT';
    await this.readRepository.save(invoice);
  }
}
```

---

## 5. Multi-Tenancy (5-Layer Isolation)

### Tenant Context Middleware
```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly dataSource: DataSource) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      throw new UnauthorizedException('Missing X-Tenant-Id header');
    }

    // Set PostgreSQL search_path for schema-based isolation
    await this.dataSource.query(`SET search_path TO tenant_${tenantId}`);

    next();
  }
}
```

### Tenant-Aware Repository
```typescript
@Injectable()
export class InvoiceRepository {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly repository: Repository<InvoiceEntity>,
    private readonly tenantContext: TenantContextService
  ) {}

  async findById(id: string): Promise<Invoice | null> {
    const tenantId = this.tenantContext.getTenantId();

    // CRITICAL: Always filter by tenantId
    return this.repository.findOne({
      where: {
        id,
        tenantId  // Prevent cross-tenant data leakage
      }
    });
  }
}
```

---

## 6. Guards & Interceptors

### JWT Authentication Guard
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Extract JWT from GraphQL context or HTTP request
    return super.canActivate(context);
  }
}
```

### RBAC Guard (Role-Based Access Control)
```typescript
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler()
    );

    if (!requiredPermissions) return true;

    const user = context.switchToHttp().getRequest().user;
    const userPermissions = this.getUserPermissions(user.roles);

    return requiredPermissions.every(required =>
      this.hasPermission(userPermissions, required)
    );
  }

  private hasPermission(userPermissions: string[], required: string): boolean {
    return userPermissions.includes(required) ||
           userPermissions.includes(`${required.split(':')[0]}:*`);
  }
}
```

### Logging Interceptor
```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        console.log(`${method} ${url} - ${duration}ms`);
      })
    );
  }
}
```

---

## 7. Event Bus (CQRS)

### Publish Event
```typescript
@Injectable()
export class InvoiceService {
  constructor(private readonly eventBus: EventBus) {}

  async approveInvoice(invoiceId: string, userId: string): Promise<void> {
    // Business logic...

    // Publish domain event
    this.eventBus.publish(
      new InvoiceApprovedEvent(invoiceId, userId, new Date())
    );
  }
}
```

### Subscribe to Event
```typescript
@EventsHandler(InvoiceApprovedEvent)
export class InvoiceApprovedHandler implements IEventHandler<InvoiceApprovedEvent> {
  constructor(private readonly mushakService: Mushak63Service) {}

  async handle(event: InvoiceApprovedEvent): Promise<void> {
    // Generate Mushak 6.3 form when invoice is approved
    await this.mushakService.generateMushak63(event.invoiceId);
  }
}
```

---

## 8. Configuration Management

### Environment Configuration
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        DATABASE_HOST: Joi.string().required(),
        DATABASE_PORT: Joi.number().required(),
        JWT_SECRET: Joi.string().required()
      })
    })
  ]
})
export class AppModule {}
```

### Type-Safe Config Service
```typescript
@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get databaseHost(): string {
    return this.configService.get<string>('DATABASE_HOST');
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET');
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '24h');
  }
}
```

---

## 9. Best Practices

✅ **DO**:
- Organize code by features (not layers globally)
- Use dependency injection for all services
- Implement CQRS for complex workflows
- Enforce multi-tenancy isolation at repository level
- Use both JwtAuthGuard AND RbacGuard (MANDATORY)
- Publish domain events via EventBus
- Use REQUEST scope for tenant-specific services
- Separate read/write models (CQRS)
- Apply guards to ALL endpoints (no @Public())
- Use ConfigModule for environment variables

❌ **DON'T**:
- Create circular dependencies between modules
- Access database directly in resolvers/controllers
- Skip authentication/authorization guards
- Mix layer dependencies (domain importing presentation)
- Use global state for tenant context
- Query during command execution (CQRS violation)
- Skip input validation (use class-validator)
- Expose internal error details to clients
- Skip logging and monitoring

---

**Self-Contained**: All NestJS + DDD + CQRS + Multi-Tenancy patterns inline
**Production-Ready**: Extracted from live Vextrus ERP microservices
**DDD Layered**: Domain → Application → Infrastructure → Presentation
**CQRS**: Commands (write) separate from Queries (read)
