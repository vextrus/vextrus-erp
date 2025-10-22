# Vextrus ERP - Technical Patterns

**Version**: 2.0 (Agent-First Architecture)
**Updated**: 2025-10-22
**Purpose**: Single source of truth for all technical patterns across 18 microservices

---

## How to Use This Document

**Reference When**:
- Implementing new features (check relevant pattern sections)
- Reviewing code quality (verify pattern compliance)
- Onboarding new developers (comprehensive pattern guide)
- Troubleshooting issues (understand established patterns)

**Organization**: 17 pattern sections, each ~60-100 lines
**Total**: ~1,200 lines (load on-demand, not all at once)

**Quick Navigation**:
1. [GraphQL Federation v2](#1-graphql-federation-v2)
2. [Event Sourcing + CQRS](#2-event-sourcing--cqrs)
3. [Multi-Tenancy](#3-multi-tenancy)
4. [Security & RBAC](#4-security--rbac)
5. [Database Migrations](#5-database-migrations)
6. [Error Handling & Observability](#6-error-handling--observability)
7. [Performance & Caching](#7-performance--caching)
8. [Service Integration](#8-service-integration)
9. [Domain Modeling (DDD)](#9-domain-modeling-ddd)
10. [NestJS Patterns](#10-nestjs-patterns)
11. [Testing Strategies](#11-testing-strategies)
12. [API Versioning](#12-api-versioning)
13. [Health Checks](#13-health-checks)
14. [Bangladesh Compliance](#14-bangladesh-compliance)
15. [Production Deployment](#15-production-deployment)
16. [Construction Project Management](#16-construction-project-management)
17. [Real Estate Management](#17-real-estate-management)

---

## 1. GraphQL Federation v2

### Architecture
```
API Gateway (Port 4000)
├── Federation v2 Supergraph
├── Composes schemas from 18 services:
│   ├── auth (Port 4001)
│   ├── finance (Port 4002)
│   ├── master-data (Port 4003)
│   └── [15 more services]
```

### Entity Pattern (Federation)
```graphql
# In finance service
type Invoice @key(fields: "id") {
  id: ID!
  customerId: ID!
  customer: Customer  # Resolved from master-data service
  totalAmount: Float!
  status: InvoiceStatus!
}

# In master-data service
type Customer @key(fields: "id") {
  id: ID!
  name: String!
  email: String!
}

# Reference resolver in finance service
@ResolveReference()
async resolveCustomer(reference: { __typename: string; id: string }) {
  return { __typename: 'Customer', id: reference.id };
}
```

### Query Pattern
```graphql
# Single entity
invoice(id: ID!): Invoice

# List with pagination
invoices(
  page: Int = 1
  limit: Int = 20
  filter: InvoiceFilterInput
  sort: InvoiceSortInput
): InvoicePage!

type InvoicePage {
  data: [Invoice!]!
  meta: PaginationMeta!
}

type PaginationMeta {
  totalItems: Int!
  totalPages: Int!
  currentPage: Int!
  itemsPerPage: Int!
}
```

### Mutation Pattern
```graphql
# Action-oriented naming (not CRUD)
createInvoice(input: CreateInvoiceInput!): InvoicePayload!
approveInvoice(id: ID!): InvoicePayload!
cancelInvoice(id: ID!, reason: String!): InvoicePayload!

type InvoicePayload {
  success: Boolean!
  data: Invoice
  errors: [Error!]
}

type Error {
  field: String
  message: String!
  code: String!
}
```

### Resolver Implementation
```typescript
@Resolver(() => Invoice)
export class InvoiceResolver {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Query(() => Invoice, { nullable: true })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermissions('invoices.read')
  async invoice(
    @Args('id') id: string,
    @Context() context: GraphQLContext,
  ): Promise<Invoice | null> {
    return this.queryBus.execute(
      new GetInvoiceQuery(id, context.tenantId),
    );
  }

  @Mutation(() => InvoicePayload)
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermissions('invoices.create')
  async createInvoice(
    @Args('input') input: CreateInvoiceInput,
    @Context() context: GraphQLContext,
  ): Promise<InvoicePayload> {
    try {
      const invoice = await this.commandBus.execute(
        new CreateInvoiceCommand(input, context.tenantId, context.userId),
      );
      return { success: true, data: invoice, errors: [] };
    } catch (error) {
      return {
        success: false,
        data: null,
        errors: [{ message: error.message, code: 'CREATE_FAILED' }],
      };
    }
  }
}
```

### Best Practices
- ✅ Use `@key` directive on all federated entities
- ✅ Always use pagination for lists
- ✅ Return payload types with errors (don't throw from mutations)
- ✅ Apply guards on ALL operations (no @Public())
- ✅ Use business-meaningful names (not technical CRUD)
- ❌ Never expose database IDs directly (use UUIDs)
- ❌ Don't return sensitive data in error messages

---

## 2. Event Sourcing + CQRS

### Architecture
```
Command Side (Write)         Event Store         Query Side (Read)
────────────────────         ───────────         ─────────────────
GraphQL Mutation                                 GraphQL Query
      ↓                                                ↑
Command Handler              Append Events       Query Handler
      ↓                           ↓                    ↑
Domain Aggregate          ┌─────────────┐       Read Model
   (apply events)         │ Event Store │    (projections)
      ↓                   │  PostgreSQL │           ↑
Domain Events     ───────→└─────────────┘───────────┘
                            (Stream)
```

### Domain Event Pattern
```typescript
// Events are immutable facts (past tense)
export class InvoiceCreatedEvent implements DomainEvent {
  readonly eventType = 'InvoiceCreated';
  readonly version = 1;
  readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string,
    public readonly data: {
      customerId: string;
      lineItems: LineItem[];
      totalAmount: number;
      dueDate: Date;
    },
  ) {
    this.occurredOn = new Date();
  }
}

// Version events for schema evolution
export class InvoiceCreatedEvent_v2 implements DomainEvent {
  readonly eventType = 'InvoiceCreated';
  readonly version = 2;  // Schema changed
  // ... new fields
}
```

### Aggregate Pattern
```typescript
export class Invoice extends AggregateRoot {
  private id: InvoiceId;
  private customerId: CustomerId;
  private lineItems: LineItem[] = [];
  private totalAmount: Money;
  private status: InvoiceStatus;

  // Factory method
  static create(
    customerId: CustomerId,
    lineItems: LineItem[],
    tenantId: string,
  ): Invoice {
    const invoice = new Invoice();
    invoice.apply(
      new InvoiceCreatedEvent(
        uuid(),
        tenantId,
        { customerId: customerId.value, lineItems, ... },
      ),
    );
    return invoice;
  }

  // Business logic methods (enforce invariants)
  approve(approvedBy: string): void {
    if (this.status !== InvoiceStatus.DRAFT) {
      throw new InvalidInvoiceStatusException(
        'Only DRAFT invoices can be approved',
      );
    }

    if (this.totalAmount.isZero()) {
      throw new InvoiceValidationException(
        'Cannot approve invoice with zero amount',
      );
    }

    this.apply(new InvoiceApprovedEvent(this.id.value, approvedBy));
  }

  // Event handlers (update state)
  private onInvoiceCreatedEvent(event: InvoiceCreatedEvent): void {
    this.id = new InvoiceId(event.aggregateId);
    this.customerId = new CustomerId(event.data.customerId);
    this.lineItems = event.data.lineItems;
    this.totalAmount = new Money(event.data.totalAmount);
    this.status = InvoiceStatus.DRAFT;
  }

  private onInvoiceApprovedEvent(event: InvoiceApprovedEvent): void {
    this.status = InvoiceStatus.APPROVED;
  }
}
```

### Command Handler Pattern
```typescript
@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler implements ICommandHandler {
  constructor(
    private readonly repository: InvoiceRepository,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: CreateInvoiceCommand): Promise<void> {
    // Create aggregate
    const invoice = Invoice.create(
      new CustomerId(command.customerId),
      command.lineItems,
      command.tenantId,
    );

    // Save to event store
    await this.repository.save(invoice);

    // Events are automatically published
  }
}
```

### Projection Handler Pattern
```typescript
@EventsHandler(InvoiceCreatedEvent, InvoiceApprovedEvent)
export class InvoiceProjectionHandler implements IEventHandler {
  constructor(
    @InjectRepository(InvoiceProjection)
    private readonly repository: Repository<InvoiceProjection>,
    private readonly cacheService: CacheService,
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    if (event.eventType === 'InvoiceCreated') {
      await this.handleInvoiceCreated(event as InvoiceCreatedEvent);
    } else if (event.eventType === 'InvoiceApproved') {
      await this.handleInvoiceApproved(event as InvoiceApprovedEvent);
    }

    // Invalidate cache
    await this.cacheService.invalidate(`invoice:${event.aggregateId}`);
  }

  private async handleInvoiceCreated(event: InvoiceCreatedEvent): Promise<void> {
    const projection = new InvoiceProjection();
    projection.id = event.aggregateId;
    projection.tenantId = event.tenantId;
    projection.customerId = event.data.customerId;
    projection.totalAmount = event.data.totalAmount;
    projection.status = 'DRAFT';
    projection.createdAt = event.occurredOn;

    await this.repository.save(projection);
  }
}
```

### Best Practices
- ✅ Events are immutable (never change or delete)
- ✅ Events are past tense: `InvoiceCreated`, not `CreateInvoice`
- ✅ Aggregates are small and focused (1 root entity)
- ✅ Use idempotent event handlers
- ✅ Version events for schema evolution
- ✅ Include all data needed for projections in events
- ❌ Don't make aggregates reference other aggregates (use IDs)
- ❌ Don't query during command execution (use projections)
- ❌ Don't delete events (append-only)

---

## 3. Multi-Tenancy

### 5-Layer Isolation Strategy
```
Layer 1: JWT (X-Tenant-Id in token)
Layer 2: Middleware (Extract and validate tenant context)
Layer 3: PostgreSQL Schema (tenant_org1, tenant_org2)
Layer 4: Application (WHERE tenant_id = $1 in all queries)
Layer 5: Row-Level Security (PostgreSQL RLS as backup)
```

### Tenant Context Middleware
```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly dataSource: DataSource,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      throw new UnauthorizedException('Missing X-Tenant-Id header');
    }

    // Validate tenant exists
    const tenantExists = await this.validateTenant(tenantId);
    if (!tenantExists) {
      throw new ForbiddenException('Invalid tenant');
    }

    // Set tenant context for this request
    this.tenantContext.setTenantId(tenantId);

    // Set PostgreSQL search_path to tenant schema
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
    @InjectRepository(Invoice)
    private readonly repository: Repository<Invoice>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async findById(id: string): Promise<Invoice | null> {
    const tenantId = this.tenantContext.getTenantId();

    return this.repository.findOne({
      where: {
        id,
        tenantId,  // CRITICAL: Always filter by tenant
      },
    });
  }

  async findAll(filter: InvoiceFilter): Promise<Invoice[]> {
    const tenantId = this.tenantContext.getTenantId();

    return this.repository.find({
      where: {
        ...filter,
        tenantId,  // CRITICAL: Always filter by tenant
      },
    });
  }

  async save(invoice: Invoice): Promise<Invoice> {
    const tenantId = this.tenantContext.getTenantId();

    // Set tenant ID before saving
    invoice.tenantId = tenantId;

    return this.repository.save(invoice);
  }
}
```

### Row-Level Security (Backup Layer)
```sql
-- Enable RLS on all tenant tables
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation
CREATE POLICY tenant_isolation_policy ON invoices
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Set tenant context in connection
SET app.current_tenant = 'tenant-uuid-here';
```

### Best Practices
- ✅ ALWAYS filter by tenantId in queries
- ✅ Set tenantId in middleware (not in business logic)
- ✅ Use schema-based isolation for strong separation
- ✅ Validate tenant exists before processing request
- ✅ Test cross-tenant data leakage in integration tests
- ❌ Never trust client-provided tenant ID without JWT validation
- ❌ Don't share database connections between tenant contexts
- ❌ Don't skip tenant validation for "internal" endpoints

---

## 4. Security & RBAC

### Role-Based Access Control
```typescript
// 7 predefined roles
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',      // Full system access
  TENANT_ADMIN = 'TENANT_ADMIN',    // Tenant-level admin
  FINANCE_MANAGER = 'FINANCE_MANAGER',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  ACCOUNTANT = 'ACCOUNTANT',
  USER = 'USER',                     // Basic access
  GUEST = 'GUEST',                   // Read-only
}

// Permission structure
export interface Permission {
  resource: string;  // e.g., 'invoices', 'payments'
  action: string;    // e.g., 'create', 'read', 'update', 'delete'
}

// Role-Permission mapping
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.FINANCE_MANAGER]: [
    { resource: 'invoices', action: '*' },
    { resource: 'payments', action: '*' },
    { resource: 'reports', action: 'read' },
  ],
  [Role.ACCOUNTANT]: [
    { resource: 'invoices', action: 'read' },
    { resource: 'invoices', action: 'update' },
    { resource: 'payments', action: 'create' },
    { resource: 'reports', action: 'read' },
  ],
  // ...
};
```

### RBAC Guard Implementation
```typescript
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true;  // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roles) {
      return false;
    }

    // Check if user has required permissions
    const userPermissions = this.getUserPermissions(user.roles);
    return requiredPermissions.every(required =>
      this.hasPermission(userPermissions, required),
    );
  }

  private getUserPermissions(roles: Role[]): Permission[] {
    return roles.flatMap(role => ROLE_PERMISSIONS[role] || []);
  }

  private hasPermission(permissions: Permission[], required: string): boolean {
    const [resource, action] = required.split('.');
    return permissions.some(
      p => (p.resource === resource || p.resource === '*') &&
           (p.action === action || p.action === '*'),
    );
  }
}
```

### Applying Guards to Resolvers
```typescript
@Mutation(() => InvoicePayload)
@UseGuards(JwtAuthGuard, RbacGuard)  // ALWAYS BOTH
@RequirePermissions('invoices.create')
async createInvoice(
  @Args('input') input: CreateInvoiceInput,
  @Context() context: GraphQLContext,
): Promise<InvoicePayload> {
  // Implementation
}
```

### Input Validation
```typescript
// main.ts configuration
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,               // Strip unknown properties
    forbidNonWhitelisted: true,    // Throw on unknown properties
    transform: true,               // Auto-transform types
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);

// DTO with validation
export class CreateInvoiceInput {
  @IsUUID()
  customerId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemInput)
  lineItems: LineItemInput[];

  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
```

### Best Practices
- ✅ ALWAYS use both JwtAuthGuard AND RbacGuard
- ✅ NO @Public() decorators (100% authentication coverage)
- ✅ Enable strict validation (forbidNonWhitelisted: true)
- ✅ Use deny-by-default (explicit permissions required)
- ✅ Validate input at GraphQL layer (class-validator)
- ✅ Hash passwords with bcrypt (min 10 rounds)
- ✅ Use HttpOnly cookies for refresh tokens
- ❌ Never log sensitive data (passwords, tokens)
- ❌ Don't expose internal error details to clients
- ❌ Never trust client-provided user ID (use JWT)

---

## 5. Database Migrations

### Zero-Downtime Migration Pattern
```typescript
// Phase 1: Add new column (nullable)
export class AddEmailToUsers1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'email',
        type: 'varchar',
        length: '255',
        isNullable: true,  // Phase 1: Nullable
      }),
    );

    // Create index concurrently (non-blocking)
    await queryRunner.query(
      `CREATE INDEX CONCURRENTLY idx_users_email ON users(email)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'email');
  }
}

// Phase 2: Backfill data (separate migration)
export class BackfillUserEmails1234567890124 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Batch updates to avoid locking
    await queryRunner.query(`
      UPDATE users
      SET email = CONCAT(username, '@example.com')
      WHERE email IS NULL
      LIMIT 1000;
    `);
    // Repeat in batches
  }
}

// Phase 3: Make NOT NULL (after backfill complete)
export class MakeEmailRequired1234567890125 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN email SET NOT NULL;
    `);
  }
}
```

### Migration Best Practices
- ✅ Use 3-phase migrations for schema changes (add nullable → backfill → make required)
- ✅ Create indexes CONCURRENTLY (non-blocking)
- ✅ Use batch updates for large data migrations
- ✅ Test migrations on copy of production data
- ✅ Always write reversible migrations (down method)
- ✅ Keep migrations idempotent
- ❌ Never drop columns with data (archive instead)
- ❌ Don't create indexes without CONCURRENTLY in production
- ❌ Don't run synchronize: true in production (migration-only)

### Migration Commands
```bash
# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

---

## 6. Error Handling & Observability

### Error Hierarchy
```typescript
// Base domain exception
export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly metadata?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Specific domain exceptions
export class InvoiceNotFoundException extends DomainException {
  constructor(invoiceId: string) {
    super(
      `Invoice with ID ${invoiceId} not found`,
      'INVOICE_NOT_FOUND',
      { invoiceId },
    );
  }
}

export class InvalidInvoiceStatusException extends DomainException {
  constructor(message: string, currentStatus: string) {
    super(
      message,
      'INVALID_INVOICE_STATUS',
      { currentStatus },
    );
  }
}
```

### Global Exception Filter
```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof DomainException) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
      code = exception.code;

      // Log business errors at info level
      this.logger.log({
        level: 'info',
        message: exception.message,
        code: exception.code,
        metadata: exception.metadata,
        url: request.url,
        method: request.method,
        tenantId: request.headers['x-tenant-id'],
      });
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;

      // Log HTTP errors at warn level
      this.logger.warn({
        level: 'warn',
        message: exception.message,
        status,
        url: request.url,
      });
    } else {
      // Log unknown errors at error level
      this.logger.error({
        level: 'error',
        message: exception instanceof Error ? exception.message : 'Unknown error',
        stack: exception instanceof Error ? exception.stack : undefined,
        url: request.url,
        method: request.method,
      });
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
```

### OpenTelemetry Integration
```typescript
// Trace business operations
@Injectable()
export class CreateInvoiceHandler {
  constructor(
    private readonly repository: InvoiceRepository,
    @Inject('TRACER') private readonly tracer: Tracer,
  ) {}

  async execute(command: CreateInvoiceCommand): Promise<void> {
    const span = this.tracer.startSpan('CreateInvoice', {
      attributes: {
        'invoice.customerId': command.customerId,
        'invoice.amount': command.totalAmount,
        'tenant.id': command.tenantId,
      },
    });

    try {
      const invoice = Invoice.create(/*...*/);
      await this.repository.save(invoice);

      span.setStatus({ code: SpanStatusCode.OK });
      span.setAttribute('invoice.id', invoice.id);
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  }
}
```

### Best Practices
- ✅ Use specific domain exceptions with error codes
- ✅ Log at appropriate levels (info, warn, error)
- ✅ Include context in logs (tenantId, userId, traceId)
- ✅ Trace business operations with OpenTelemetry
- ✅ Return user-friendly error messages
- ❌ Never expose stack traces to clients
- ❌ Don't log sensitive data (passwords, tokens)
- ❌ Don't swallow exceptions silently

---

## 7. Performance & Caching

### Redis Caching Strategy
```typescript
// Cache key generator
export class CacheKeys {
  static invoice(tenantId: string, invoiceId: string): string {
    return `tenant:${tenantId}:invoice:${invoiceId}`;
  }

  static invoicesList(tenantId: string, page: number, filter: string): string {
    return `tenant:${tenantId}:invoices:page:${page}:filter:${filter}`;
  }

  static trialBalance(tenantId: string, fiscalPeriod: string): string {
    return `tenant:${tenantId}:trial-balance:${fiscalPeriod}`;
  }
}

// TTL strategy
export enum CacheTTL {
  QUERY = 60,          // 1 minute for simple queries
  LIST = 300,          // 5 minutes for lists
  REPORT = 1800,       // 30 minutes for reports
  LOOKUP = 7200,       // 2 hours for lookups (rarely change)
}
```

### Cache-Aside Pattern
```typescript
@QueryHandler(GetInvoiceQuery)
export class GetInvoiceHandler implements IQueryHandler {
  constructor(
    @InjectRepository(InvoiceProjection)
    private readonly repository: Repository<InvoiceProjection>,
    private readonly cacheService: CacheService,
  ) {}

  async execute(query: GetInvoiceQuery): Promise<Invoice | null> {
    const cacheKey = CacheKeys.invoice(query.tenantId, query.invoiceId);

    // Try cache first
    const cached = await this.cacheService.get<Invoice>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - query database
    const invoice = await this.repository.findOne({
      where: { id: query.invoiceId, tenantId: query.tenantId },
    });

    // Store in cache
    if (invoice) {
      await this.cacheService.set(cacheKey, invoice, CacheTTL.QUERY);
    }

    return invoice;
  }
}
```

### Cache Invalidation
```typescript
@EventsHandler(InvoiceCreatedEvent, InvoiceApprovedEvent, InvoiceUpdatedEvent)
export class InvoiceProjectionHandler implements IEventHandler {
  constructor(
    @InjectRepository(InvoiceProjection)
    private readonly repository: Repository<InvoiceProjection>,
    private readonly cacheService: CacheService,
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    // Update projection
    await this.updateProjection(event);

    // Invalidate cache (pattern-based)
    await this.cacheService.invalidatePattern(
      `tenant:${event.tenantId}:invoice:*`,
    );
    await this.cacheService.invalidatePattern(
      `tenant:${event.tenantId}:invoices:*`,
    );
  }
}
```

### Database Performance
```typescript
// Composite indexes for common queries
@Entity()
@Index(['tenantId', 'status', 'dueDate'])
@Index(['tenantId', 'customerId', 'createdAt'])
@Index(['tenantId', 'status', 'totalAmount'])
export class Invoice {
  // ...
}

// Pre-calculated aggregates (avoid runtime SUM)
@Injectable()
export class AccountBalanceService {
  async getBalance(accountId: string, tenantId: string): Promise<Money> {
    // Query pre-calculated balance (O(1))
    const balance = await this.repository.findOne({
      where: { accountId, tenantId },
      select: ['balance'],  // Use pre-calculated field
    });

    return new Money(balance.balance);
  }
}
```

### Best Practices
- ✅ Cache read-heavy queries (10+ reads per write)
- ✅ Use pattern-based invalidation on events
- ✅ Create composite indexes for common filters
- ✅ Pre-calculate aggregates (avoid runtime SUM/COUNT)
- ✅ Set appropriate TTLs (query < list < report < lookup)
- ✅ Monitor cache hit rate (target >80%)
- ❌ Don't cache user-specific data globally
- ❌ Don't cache without tenant isolation
- ❌ Don't create indexes on low-cardinality fields

---

## 8. Service Integration

### Circuit Breaker Pattern
```typescript
@Injectable()
export class MasterDataClient {
  private circuitBreaker: CircuitBreaker;

  constructor(private readonly httpService: HttpService) {
    this.circuitBreaker = new CircuitBreaker(
      this.getCustomer.bind(this),
      {
        timeout: 3000,          // 3 second timeout
        errorThresholdPercentage: 50,
        resetTimeout: 30000,    // 30 seconds
      },
    );

    this.circuitBreaker.on('open', () => {
      this.logger.warn('Circuit breaker opened for MasterDataClient');
    });
  }

  async getCustomer(customerId: string): Promise<Customer> {
    return this.circuitBreaker.fire(customerId);
  }

  private async getCustomer(customerId: string): Promise<Customer> {
    const response = await this.httpService.axiosRef.get(
      `http://master-data:4003/customers/${customerId}`,
    );
    return response.data;
  }

  // Fallback when circuit is open
  async getCustomerWithFallback(customerId: string): Promise<Customer | null> {
    try {
      return await this.getCustomer(customerId);
    } catch (error) {
      this.logger.warn(`Failed to get customer ${customerId}, using fallback`);
      return this.getCustomerFromCache(customerId);
    }
  }
}
```

### Retry Strategy
```typescript
import { retry } from 'rxjs/operators';

@Injectable()
export class PaymentGatewayClient {
  async processPayment(payment: Payment): Promise<PaymentResult> {
    return this.httpService
      .post('https://payment-gateway.com/charge', payment)
      .pipe(
        retry({
          count: 3,
          delay: (error, retryCount) => {
            // Exponential backoff: 1s, 2s, 4s
            const delayMs = Math.pow(2, retryCount) * 1000;
            this.logger.log(`Retrying payment (attempt ${retryCount}), waiting ${delayMs}ms`);
            return timer(delayMs);
          },
        }),
      )
      .toPromise();
  }
}
```

### Graceful Degradation
```typescript
async completePayment(command: CompletePaymentCommand): Promise<void> {
  // 1. Complete payment (critical path)
  const payment = await this.paymentRepository.findById(command.paymentId);
  payment.markAsCompleted();
  await this.paymentRepository.save(payment);

  // 2. Update invoice (important but not critical)
  try {
    if (payment.invoiceId) {
      const invoice = await this.invoiceRepository.findById(payment.invoiceId.value);
      if (invoice) {
        invoice.recordPayment(payment.id, payment.amount);
        await this.invoiceRepository.save(invoice);
      }
    }
  } catch (error) {
    // Log error but don't fail payment
    this.logger.error('Failed to update invoice, payment completed', {
      paymentId: payment.id,
      invoiceId: payment.invoiceId?.value,
      error: error.message,
    });
    // Invoice will be updated via eventual consistency (event handlers)
  }

  // 3. Send notification (nice-to-have)
  this.eventBus.publish(new PaymentCompletedEvent(payment));
}
```

### Best Practices
- ✅ Use circuit breakers for external services
- ✅ Implement exponential backoff for retries
- ✅ Timeout all external calls (3-5 seconds)
- ✅ Graceful degradation (critical path succeeds)
- ✅ Log integration failures with context
- ✅ Cache external service responses
- ❌ Don't fail entire operation on non-critical service failure
- ❌ Don't retry idempotent operations without limits
- ❌ Don't expose internal service errors to clients

---

## 9. Domain Modeling (DDD)

### Value Objects
```typescript
// Money value object (immutability + business logic)
export class Money {
  private readonly amount: number;
  private readonly currency: string;

  constructor(amount: number, currency: string = 'BDT') {
    if (amount < 0) {
      throw new InvalidMoneyException('Amount cannot be negative');
    }
    this.amount = Math.round(amount * 100) / 100;  // 2 decimal precision
    this.currency = currency;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchException(
        `Cannot operate on different currencies: ${this.currency} and ${other.currency}`,
      );
    }
  }
}
```

### Aggregate Boundaries
```
Invoice Aggregate (Root: Invoice)
├── LineItems (Entities)
└── InvoiceId, CustomerId (Value Objects)

Payment Aggregate (Root: Payment)
├── InvoiceId (Reference to Invoice - NOT owned)
└── PaymentId, Amount (Value Objects)

Rule: Aggregates reference each other by ID only
```

### Domain Services
```typescript
// Domain service for complex business logic spanning aggregates
@Injectable()
export class PaymentAllocationService {
  allocatePaymentToInvoices(
    payment: Payment,
    invoices: Invoice[],
  ): AllocationResult {
    // Business rule: Allocate payment to oldest invoices first
    const sortedInvoices = invoices.sort((a, b) =>
      a.dueDate.getTime() - b.dueDate.getTime(),
    );

    let remainingAmount = payment.amount;
    const allocations: Allocation[] = [];

    for (const invoice of sortedInvoices) {
      if (remainingAmount.isZero()) break;

      const invoiceBalance = invoice.getOutstandingAmount();
      const allocationAmount = remainingAmount.isGreaterThan(invoiceBalance)
        ? invoiceBalance
        : remainingAmount;

      allocations.push({
        invoiceId: invoice.id,
        amount: allocationAmount,
      });

      remainingAmount = remainingAmount.subtract(allocationAmount);
    }

    return { allocations, remainingAmount };
  }
}
```

### Best Practices
- ✅ Value objects are immutable
- ✅ Aggregates are small (1 root + related entities)
- ✅ Aggregates enforce invariants
- ✅ Reference other aggregates by ID only
- ✅ Use domain services for cross-aggregate logic
- ✅ Name entities/value objects in business terms
- ❌ Don't make aggregates reference other aggregates directly
- ❌ Don't put business logic in DTOs or entities
- ❌ Don't create anemic domain models (getters/setters only)

---

## 10. NestJS Patterns

### Module Organization
```
services/finance/src/
├── app.module.ts (Root module)
├── domain/
│   ├── aggregates/
│   │   ├── invoice/
│   │   │   ├── invoice.aggregate.ts
│   │   │   └── events/
│   │   ├── payment/
│   │   └── journal/
│   └── value-objects/
├── application/
│   ├── commands/
│   │   ├── create-invoice.command.ts
│   │   └── handlers/
│   ├── queries/
│   │   ├── get-invoice.query.ts
│   │   └── handlers/
│   └── services/
├── infrastructure/
│   ├── persistence/
│   │   ├── typeorm/
│   │   └── repositories/
│   ├── guards/
│   └── middleware/
└── presentation/
    ├── graphql/
    │   ├── resolvers/
    │   ├── inputs/
    │   └── types/
    └── rest/ (if needed)
```

### Dependency Injection
```typescript
// Module definition
@Module({
  imports: [
    TypeOrmModule.forFeature([InvoiceProjection]),
    CqrsModule,
  ],
  providers: [
    // Command handlers
    CreateInvoiceHandler,
    ApproveInvoiceHandler,

    // Query handlers
    GetInvoiceHandler,
    GetInvoicesHandler,

    // Domain services
    InvoiceValidationService,

    // Infrastructure
    {
      provide: 'InvoiceRepository',
      useClass: InvoiceEventSourcedRepository,
    },
  ],
  exports: ['InvoiceRepository'],
})
export class InvoiceModule {}
```

### Provider Patterns
```typescript
// Factory provider
{
  provide: 'EventStore',
  useFactory: (dataSource: DataSource) => {
    return new EventStore(dataSource, {
      streamPrefix: 'invoice',
      snapshotFrequency: 50,
    });
  },
  inject: [DataSource],
}

// Class provider
{
  provide: CacheService,
  useClass: RedisCacheService,
}

// Value provider
{
  provide: 'CONFIG',
  useValue: {
    apiUrl: process.env.API_URL,
    timeout: 5000,
  },
}
```

### Best Practices
- ✅ One module per aggregate or bounded context
- ✅ Keep modules cohesive (related functionality together)
- ✅ Use barrel exports (index.ts) for clean imports
- ✅ Inject dependencies through constructor
- ✅ Use factory providers for complex initialization
- ❌ Don't create circular dependencies between modules
- ❌ Don't inject repositories directly (use interfaces)
- ❌ Don't put business logic in modules (use services)

---

## 11. Testing Strategies

### Test Pyramid
```
         /\
        /E2\      E2E (5%)
       /────\     Integration (15%)
      /──────\    Unit (80%)
     /────────\
```

### Unit Test Pattern (AAA)
```typescript
describe('Invoice.approve', () => {
  it('should approve DRAFT invoice', () => {
    // Arrange
    const invoice = Invoice.create(
      new CustomerId('customer-123'),
      [{ description: 'Item', amount: 100 }],
      'tenant-1',
    );

    // Act
    invoice.approve('user-456');

    // Assert
    expect(invoice.status).toBe(InvoiceStatus.APPROVED);
    expect(invoice.getUncommittedEvents()).toContainEqual(
      expect.objectContaining({
        eventType: 'InvoiceApproved',
        data: expect.objectContaining({ approvedBy: 'user-456' }),
      }),
    );
  });

  it('should throw when approving non-DRAFT invoice', () => {
    // Arrange
    const invoice = Invoice.create(/*...*/);
    invoice.approve('user-456');  // Already approved

    // Act & Assert
    expect(() => invoice.approve('user-789')).toThrow(
      InvalidInvoiceStatusException,
    );
  });
});
```

### Integration Test Pattern
```typescript
describe('CreateInvoiceHandler (Integration)', () => {
  let module: TestingModule;
  let handler: CreateInvoiceHandler;
  let repository: InvoiceRepository;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          database: ':memory:',  // In-memory for tests
        }),
        TypeOrmModule.forFeature([InvoiceProjection]),
        CqrsModule,
      ],
      providers: [CreateInvoiceHandler, InvoiceRepository],
    }).compile();

    handler = module.get(CreateInvoiceHandler);
    repository = module.get(InvoiceRepository);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should create invoice and persist to repository', async () => {
    // Arrange
    const command = new CreateInvoiceCommand({
      customerId: 'customer-123',
      lineItems: [{ description: 'Item', amount: 100 }],
      tenantId: 'tenant-1',
    });

    // Act
    await handler.execute(command);

    // Assert
    const invoices = await repository.findAll({ tenantId: 'tenant-1' });
    expect(invoices).toHaveLength(1);
    expect(invoices[0].customerId).toBe('customer-123');
  });
});
```

### E2E Test Pattern
```typescript
describe('Invoice GraphQL API (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create invoice via GraphQL mutation', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            createInvoice(input: {
              customerId: "customer-123"
              lineItems: [{ description: "Item", amount: 100 }]
            }) {
              success
              data {
                id
                status
              }
            }
          }
        `,
      })
      .set('X-Tenant-Id', 'tenant-1')
      .set('Authorization', 'Bearer valid-jwt-token')
      .expect(200)
      .expect(res => {
        expect(res.body.data.createInvoice.success).toBe(true);
        expect(res.body.data.createInvoice.data.status).toBe('DRAFT');
      });
  });
});
```

### Coverage Targets
- Domain Layer (Aggregates, Value Objects): **90-100%**
- Application Layer (Handlers, Services): **80-90%**
- Infrastructure Layer (Repositories, Guards): **60-80%**
- Presentation Layer (Resolvers, Controllers): **50-70%**

### Best Practices
- ✅ Unit tests for domain logic (aggregates, value objects)
- ✅ Integration tests for handlers and repositories
- ✅ E2E tests for critical user flows
- ✅ Test edge cases and error paths
- ✅ Use descriptive test names (should/when pattern)
- ✅ Keep tests fast (<1s for unit, <5s for integration)
- ❌ Don't test framework code (NestJS, TypeORM)
- ❌ Don't mock everything (integration tests need real dependencies)
- ❌ Don't commit tests that depend on external services

---

## 12. API Versioning

### URL Versioning (Deprecated)
```
/api/v1/invoices  → Legacy, avoid for new APIs
```

### Header Versioning (Recommended)
```http
GET /graphql
Accept-Version: 2024-10-01

Content-Type: application/json
X-API-Version: 2024-10-01
```

### GraphQL Field Deprecation
```graphql
type Invoice {
  id: ID!
  totalAmount: Float!  # Current field

  # Deprecated field (keep for backward compatibility)
  total: Float! @deprecated(reason: "Use 'totalAmount' instead. Will be removed on 2025-01-01")

  # New field (added in version 2)
  lineItems: [LineItem!]! @since(version: "2024-10-01")
}
```

### Breaking Change Strategy
```
Phase 1 (Month 1):
- Add new field/endpoint alongside old one
- Deprecate old field with @deprecated directive
- Notify clients in release notes

Phase 2 (Month 2-6):
- Monitor usage of deprecated field
- Reach out to active users
- Provide migration guide

Phase 3 (Month 7+):
- Remove deprecated field if usage < 1%
- Bump major version if breaking change
```

### Best Practices
- ✅ Use date-based versioning (2024-10-01)
- ✅ Deprecate fields before removing
- ✅ Provide 6+ months notice for breaking changes
- ✅ Monitor deprecated field usage
- ✅ Document migration path in release notes
- ❌ Don't break existing clients without notice
- ❌ Don't version every field (only breaking changes)
- ❌ Don't remove deprecated fields prematurely

---

## 13. Health Checks

### Health Check Endpoint
```typescript
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Database
      () => this.db.pingCheck('database', { timeout: 1500 }),

      // Redis cache
      () => this.redis.pingCheck('redis', { timeout: 1000 }),

      // Disk space
      () => this.disk.checkStorage('disk', {
        path: '/',
        thresholdPercent: 0.9,  // Alert at 90% full
      }),

      // Event Store
      () => this.eventStore.isHealthy(),

      // External services (optional)
      () => this.masterDataService.ping(),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    // Readiness check (can service accept traffic?)
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.pingCheck('redis'),
    ]);
  }

  @Get('live')
  @HealthCheck()
  live() {
    // Liveness check (is service running?)
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

### Kubernetes Probes
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: finance-service
        livenessProbe:
          httpGet:
            path: /health/live
            port: 4002
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3

        readinessProbe:
          httpGet:
            path: /health/ready
            port: 4002
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2

        startupProbe:
          httpGet:
            path: /health/live
            port: 4002
          initialDelaySeconds: 0
          periodSeconds: 10
          failureThreshold: 30  # 5 minutes max startup time
```

### Best Practices
- ✅ Implement /health (general), /health/ready (readiness), /health/live (liveness)
- ✅ Check critical dependencies (database, cache)
- ✅ Set appropriate timeouts (1-3 seconds)
- ✅ Return 200 OK when healthy, 503 when unhealthy
- ✅ Include version and uptime in response
- ❌ Don't check non-critical dependencies in readiness
- ❌ Don't perform expensive operations in health checks
- ❌ Don't fail liveness probe on temporary issues

---

## 14. Bangladesh Compliance

### VAT Calculation (15% Standard)
```typescript
export class VATCalculationService {
  private readonly STANDARD_VAT_RATE = 0.15;
  private readonly REDUCED_VAT_RATE = 0.05;   // Some items
  private readonly ZERO_VAT_RATE = 0.0;       // Exports, essential goods

  calculateVAT(lineItem: LineItem, category: ProductCategory): Money {
    const rate = this.getVATRate(category);
    return lineItem.amount.multiply(rate);
  }

  private getVATRate(category: ProductCategory): number {
    switch (category) {
      case ProductCategory.CONSTRUCTION_MATERIALS:
        return this.STANDARD_VAT_RATE;  // 15%
      case ProductCategory.ESSENTIAL_GOODS:
        return this.ZERO_VAT_RATE;      // 0%
      case ProductCategory.FOOD:
        return this.REDUCED_VAT_RATE;   // 5%
      default:
        return this.STANDARD_VAT_RATE;
    }
  }
}
```

### TDS/AIT Withholding
```typescript
export class TDSCalculationService {
  private readonly TDS_RATES = {
    VENDOR_WITH_TIN: 0.05,      // 5% for vendors with TIN
    VENDOR_WITHOUT_TIN: 0.075,  // 7.5% for vendors without TIN (1.5x)
    CONTRACTOR: 0.03,           // 3% for contractors
    PROFESSIONAL_SERVICE: 0.10, // 10% for professional services
    IMPORT: 0.05,               // 5% AIT on imports
  };

  calculateTDS(payment: Payment, vendorType: VendorType, hasTIN: boolean): Money {
    let rate: number;

    if (vendorType === VendorType.VENDOR && !hasTIN) {
      rate = this.TDS_RATES.VENDOR_WITHOUT_TIN;
    } else if (vendorType === VendorType.VENDOR && hasTIN) {
      rate = this.TDS_RATES.VENDOR_WITH_TIN;
    } else if (vendorType === VendorType.CONTRACTOR) {
      rate = this.TDS_RATES.CONTRACTOR;
    } else if (vendorType === VendorType.PROFESSIONAL) {
      rate = this.TDS_RATES.PROFESSIONAL_SERVICE;
    } else {
      rate = 0;
    }

    return payment.amount.multiply(rate);
  }
}
```

### Mushak 6.3 Generation
```typescript
export class Mushak63Service {
  async generateMushak63(invoice: Invoice): Promise<Mushak63Document> {
    return {
      // Header
      challanNumber: invoice.challanNumber,
      challanDate: invoice.issuedDate,
      buyerName: invoice.customer.name,
      buyerBIN: invoice.customer.binNumber,
      buyerAddress: invoice.customer.address,
      supplierName: 'Vextrus Construction Ltd',
      supplierBIN: process.env.COMPANY_BIN,
      supplierAddress: process.env.COMPANY_ADDRESS,

      // Line items
      items: invoice.lineItems.map((item, index) => ({
        slNo: index + 1,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice.amount,
        totalPrice: item.totalAmount.amount,
        supplementaryDuty: item.supplementaryDuty?.amount || 0,
        vat: item.vatAmount.amount,
      })),

      // Totals
      totalValueExcludingVAT: invoice.subtotal.amount,
      totalVAT: invoice.totalVAT.amount,
      totalValue: invoice.totalAmount.amount,

      // Signature
      issuedBy: invoice.approvedBy,
      issuedDate: invoice.approvedDate,
      qrCode: await this.generateQRCode(invoice),
    };
  }

  private async generateQRCode(invoice: Invoice): Promise<string> {
    const data = {
      challanNumber: invoice.challanNumber,
      totalVAT: invoice.totalVAT.amount,
      buyerBIN: invoice.customer.binNumber,
      supplierBIN: process.env.COMPANY_BIN,
    };

    return QRCode.toDataURL(JSON.stringify(data));
  }
}
```

### Fiscal Year (July-June)
```typescript
export class FiscalPeriodService {
  getFiscalYear(date: Date): number {
    const month = date.getMonth();  // 0-11
    const year = date.getFullYear();

    // Fiscal year starts July (month 6)
    return month >= 6 ? year : year - 1;
  }

  getFiscalYearStart(fiscalYear: number): Date {
    return new Date(fiscalYear, 6, 1);  // July 1st
  }

  getFiscalYearEnd(fiscalYear: number): Date {
    return new Date(fiscalYear + 1, 5, 30);  // June 30th
  }

  getFiscalQuarter(date: Date): number {
    const fiscalYearStart = this.getFiscalYearStart(this.getFiscalYear(date));
    const monthsSinceStart = (date.getMonth() - fiscalYearStart.getMonth() + 12) % 12;

    return Math.floor(monthsSinceStart / 3) + 1;  // Q1, Q2, Q3, Q4
  }
}
```

### Best Practices
- ✅ Always apply VAT to construction materials (15%)
- ✅ Withhold TDS for vendors without TIN (1.5x rate)
- ✅ Generate Mushak 6.3 on invoice approval
- ✅ Use fiscal year July-June for all financial reports
- ✅ Validate TIN/BIN format (13 digits)
- ✅ Store NBR submission logs for audit
- ❌ Don't charge VAT on exports (0%)
- ❌ Don't forget to include supplementary duty where applicable
- ❌ Don't use calendar year for financial reporting

---

## 15. Production Deployment

### Phased Rollout Strategy
```yaml
# Phase 1: Canary (5% traffic, 1 hour)
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: finance-service
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: finance-service
  service:
    port: 4002
  analysis:
    interval: 10m
    threshold: 5
    maxWeight: 50
    stepWeight: 5
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
    - name: request-duration
      thresholdRange:
        max: 500

# Phase 2: 50% traffic (4 hours)
# Phase 3: 100% traffic (full rollout)
```

### Blue-Green Deployment
```bash
# 1. Deploy new version (green) alongside old (blue)
kubectl apply -f deployment-green.yaml

# 2. Verify green is healthy
kubectl rollout status deployment/finance-service-green

# 3. Switch traffic from blue to green
kubectl patch service finance-service -p '{"spec":{"selector":{"version":"green"}}}'

# 4. Monitor for 1 hour
# If issues: switch back to blue
# If stable: delete blue deployment
```

### Observability
```typescript
// Prometheus metrics
@Injectable()
export class MetricsService {
  private readonly invoiceCreatedCounter = new Counter({
    name: 'invoices_created_total',
    help: 'Total number of invoices created',
    labelNames: ['tenant_id', 'status'],
  });

  private readonly invoiceCreationDuration = new Histogram({
    name: 'invoice_creation_duration_seconds',
    help: 'Duration of invoice creation',
    buckets: [0.1, 0.5, 1, 2, 5],
  });

  async recordInvoiceCreated(tenantId: string): Promise<void> {
    this.invoiceCreatedCounter.inc({ tenant_id: tenantId, status: 'DRAFT' });
  }

  async recordInvoiceCreationDuration(duration: number): Promise<void> {
    this.invoiceCreationDuration.observe(duration);
  }
}
```

### Best Practices
- ✅ Use canary deployments for critical services
- ✅ Monitor error rate, latency, and throughput
- ✅ Set up automated rollback on failure
- ✅ Run database migrations before deployment
- ✅ Implement graceful shutdown (30-60 seconds)
- ✅ Use readiness probes to control traffic
- ❌ Don't deploy during peak hours
- ❌ Don't skip staging environment testing
- ❌ Don't deploy without rollback plan

---

## 16. Construction Project Management

### Project Budget Tracking
```typescript
export class ProjectBudget {
  private readonly projectId: ProjectId;
  private readonly totalBudget: Money;
  private readonly allocatedAmount: Money;
  private readonly spentAmount: Money;
  private readonly committedAmount: Money;  // Purchase orders not yet invoiced

  getAvailableBudget(): Money {
    return this.totalBudget
      .subtract(this.allocatedAmount)
      .subtract(this.spentAmount)
      .subtract(this.committedAmount);
  }

  allocateBudget(amount: Money, category: BudgetCategory): void {
    const available = this.getAvailableBudget();

    if (amount.isGreaterThan(available)) {
      throw new InsufficientBudgetException(
        `Cannot allocate ${amount}, only ${available} available`,
      );
    }

    this.apply(new BudgetAllocatedEvent(
      this.projectId.value,
      category,
      amount.amount,
    ));
  }

  recordExpense(expense: Expense): void {
    // Verify expense is within allocated budget
    const categoryBudget = this.getBudgetByCategory(expense.category);
    const categorySpent = this.getSpentByCategory(expense.category);
    const available = categoryBudget.subtract(categorySpent);

    if (expense.amount.isGreaterThan(available)) {
      throw new BudgetExceededException(
        `Expense ${expense.amount} exceeds available budget ${available} for ${expense.category}`,
      );
    }

    this.apply(new ExpenseRecordedEvent(/*...*/));
  }
}
```

### Progress Billing
```typescript
export class ProgressBillingService {
  async generateProgressInvoice(
    project: Project,
    completionPercentage: number,
  ): Promise<Invoice> {
    // Verify completion milestone
    if (completionPercentage < 0 || completionPercentage > 100) {
      throw new InvalidCompletionPercentageException();
    }

    // Calculate billing amount based on contract
    const totalContractValue = project.contractValue;
    const previouslyBilled = await this.getPreviouslyBilledAmount(project.id);
    const currentCompletionValue = totalContractValue.multiply(completionPercentage / 100);
    const billingAmount = currentCompletionValue.subtract(previouslyBilled);

    // Apply retention (typically 10% in Bangladesh)
    const retentionPercentage = 0.10;
    const retentionAmount = billingAmount.multiply(retentionPercentage);
    const netBillingAmount = billingAmount.subtract(retentionAmount);

    // Create invoice
    const invoice = Invoice.create(
      project.customerId,
      [
        {
          description: `Progress billing - ${completionPercentage}% completion`,
          quantity: 1,
          unitPrice: billingAmount,
          totalAmount: billingAmount,
        },
        {
          description: `Retention (${retentionPercentage * 100}%)`,
          quantity: 1,
          unitPrice: retentionAmount.multiply(-1),  // Deduction
          totalAmount: retentionAmount.multiply(-1),
        },
      ],
      project.tenantId,
    );

    return invoice;
  }

  private async getPreviouslyBilledAmount(projectId: string): Promise<Money> {
    const invoices = await this.invoiceRepository.findByProject(projectId);
    return invoices.reduce(
      (sum, inv) => sum.add(inv.totalAmount),
      new Money(0),
    );
  }
}
```

### Site Management
```typescript
export class SiteActivity {
  recordMaterialDelivery(
    materialId: string,
    quantity: number,
    deliveryNote: string,
  ): void {
    this.apply(new MaterialDeliveredEvent(
      this.siteId.value,
      materialId,
      quantity,
      deliveryNote,
      new Date(),
    ));
  }

  recordLabor(
    date: Date,
    workers: WorkerAttendance[],
  ): void {
    // Validate workers are assigned to this site
    for (const worker of workers) {
      if (!this.isWorkerAssigned(worker.workerId)) {
        throw new WorkerNotAssignedException(
          `Worker ${worker.workerId} not assigned to site ${this.siteId.value}`,
        );
      }
    }

    this.apply(new LaborRecordedEvent(
      this.siteId.value,
      date,
      workers,
    ));
  }

  recordEquipmentUsage(
    equipmentId: string,
    hours: number,
    operator: string,
  ): void {
    this.apply(new EquipmentUsageRecordedEvent(
      this.siteId.value,
      equipmentId,
      hours,
      operator,
      new Date(),
    ));
  }
}
```

### Contractor Management
```typescript
export class ContractorPayment {
  private readonly contractorId: ContractorId;
  private readonly contractAmount: Money;
  private readonly paymentTerms: PaymentTerms;
  private readonly workCompletionPercentage: number;

  calculatePaymentDue(): Money {
    // Calculate based on completion percentage
    const earnedAmount = this.contractAmount.multiply(
      this.workCompletionPercentage / 100,
    );

    // Apply retention
    const retentionAmount = earnedAmount.multiply(
      this.paymentTerms.retentionPercentage / 100,
    );

    // Subtract previous payments
    const previousPayments = this.getPreviousPaymentTotal();
    const paymentDue = earnedAmount
      .subtract(retentionAmount)
      .subtract(previousPayments);

    return paymentDue;
  }

  releaseRetention(): Money {
    // Release retention after project completion and defect liability period
    if (!this.isProjectCompleted()) {
      throw new ProjectNotCompletedException();
    }

    if (!this.isDefectLiabilityPeriodOver()) {
      throw new DefectLiabilityPeriodNotOverException();
    }

    return this.getTotalRetentionHeld();
  }
}
```

---

## 17. Real Estate Management

### Property Lifecycle
```typescript
export class Property extends AggregateRoot {
  private id: PropertyId;
  private type: PropertyType;  // APARTMENT, COMMERCIAL, LAND
  private status: PropertyStatus;
  private area: Area;
  private location: Location;
  private purchasePrice: Money;
  private currentValue: Money;
  private owner: OwnerId;

  // Property acquisition
  static acquire(
    type: PropertyType,
    location: Location,
    area: Area,
    purchasePrice: Money,
    owner: OwnerId,
  ): Property {
    const property = new Property();
    property.apply(new PropertyAcquiredEvent(
      uuid(),
      type,
      location,
      area,
      purchasePrice,
      owner,
    ));
    return property;
  }

  // Property development
  startDevelopment(project: DevelopmentProject): void {
    if (this.status !== PropertyStatus.ACQUIRED) {
      throw new InvalidPropertyStatusException(
        'Only acquired properties can start development',
      );
    }

    this.apply(new DevelopmentStartedEvent(
      this.id.value,
      project.id,
      project.estimatedCompletion,
    ));
  }

  completeDevelopment(): void {
    if (this.status !== PropertyStatus.UNDER_DEVELOPMENT) {
      throw new InvalidPropertyStatusException();
    }

    this.apply(new DevelopmentCompletedEvent(this.id.value));
  }

  // Property sale
  listForSale(askingPrice: Money): void {
    if (this.status !== PropertyStatus.AVAILABLE) {
      throw new PropertyNotAvailableException();
    }

    this.apply(new PropertyListedForSaleEvent(
      this.id.value,
      askingPrice,
    ));
  }

  sell(buyer: BuyerId, salePrice: Money): void {
    if (this.status !== PropertyStatus.LISTED) {
      throw new PropertyNotListedException();
    }

    this.apply(new PropertySoldEvent(
      this.id.value,
      buyer,
      salePrice,
      new Date(),
    ));
  }
}
```

### Lease Management
```typescript
export class Lease extends AggregateRoot {
  private id: LeaseId;
  private propertyId: PropertyId;
  private tenantId: TenantId;
  private startDate: Date;
  private endDate: Date;
  private monthlyRent: Money;
  private securityDeposit: Money;
  private paymentDay: number;  // Day of month (1-31)
  private status: LeaseStatus;

  static create(
    propertyId: PropertyId,
    tenantId: TenantId,
    terms: LeaseTerms,
  ): Lease {
    const lease = new Lease();
    lease.apply(new LeaseCreatedEvent(
      uuid(),
      propertyId,
      tenantId,
      terms,
    ));
    return lease;
  }

  generateMonthlyInvoice(month: Date): Invoice {
    if (this.status !== LeaseStatus.ACTIVE) {
      throw new InactiveLeaseException();
    }

    // Check if rent already invoiced for this month
    if (this.isRentInvoicedForMonth(month)) {
      throw new RentAlreadyInvoicedException();
    }

    // Calculate rent amount (may include utilities, maintenance, etc.)
    const rentAmount = this.calculateMonthlyRent(month);
    const dueDate = new Date(
      month.getFullYear(),
      month.getMonth(),
      this.paymentDay,
    );

    return Invoice.create(
      this.tenantId,
      [
        {
          description: `Monthly rent - ${month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`,
          quantity: 1,
          unitPrice: rentAmount,
          totalAmount: rentAmount,
        },
      ],
      dueDate,
    );
  }

  recordPayment(payment: Payment): void {
    if (payment.amount.isLessThan(this.monthlyRent)) {
      // Partial payment
      this.apply(new PartialRentPaymentRecordedEvent(
        this.id.value,
        payment.id,
        payment.amount,
      ));
    } else {
      // Full payment
      this.apply(new RentPaymentRecordedEvent(
        this.id.value,
        payment.id,
        payment.amount,
      ));
    }
  }

  terminate(reason: LeaseTerminationReason): void {
    if (this.status === LeaseStatus.TERMINATED) {
      throw new LeaseAlreadyTerminatedException();
    }

    // Check if security deposit should be refunded
    const hasOutstandingRent = this.getOutstandingRentAmount().isGreaterThan(new Money(0));
    const refundableDeposit = hasOutstandingRent
      ? this.securityDeposit.subtract(this.getOutstandingRentAmount())
      : this.securityDeposit;

    this.apply(new LeaseTerminatedEvent(
      this.id.value,
      reason,
      refundableDeposit,
      new Date(),
    ));
  }
}
```

### Sales Pipeline
```typescript
export class SalesOpportunity extends AggregateRoot {
  private id: OpportunityId;
  private propertyId: PropertyId;
  private prospectId: ProspectId;
  private stage: SalesStage;
  private expectedValue: Money;
  private probability: number;  // 0-100
  private expectedCloseDate: Date;

  // Sales stages: LEAD → QUALIFIED → VIEWING → NEGOTIATION → CLOSED_WON/CLOSED_LOST

  qualify(): void {
    if (this.stage !== SalesStage.LEAD) {
      throw new InvalidSalesStageException();
    }

    this.apply(new OpportunityQualifiedEvent(this.id.value));
  }

  scheduleViewing(viewingDate: Date): void {
    if (this.stage !== SalesStage.QUALIFIED) {
      throw new InvalidSalesStageException();
    }

    this.apply(new ViewingScheduledEvent(
      this.id.value,
      viewingDate,
    ));
  }

  recordViewing(feedback: ViewingFeedback): void {
    this.apply(new ViewingCompletedEvent(
      this.id.value,
      feedback,
      new Date(),
    ));

    // Auto-advance to negotiation if positive feedback
    if (feedback.interestedToPurchase) {
      this.moveToNegotiation();
    }
  }

  private moveToNegotiation(): void {
    this.apply(new OpportunityMovedToNegotiationEvent(this.id.value));
  }

  recordOffer(offerAmount: Money): void {
    if (this.stage !== SalesStage.NEGOTIATION) {
      throw new InvalidSalesStageException();
    }

    this.apply(new OfferReceivedEvent(
      this.id.value,
      offerAmount,
      new Date(),
    ));
  }

  close(salePrice: Money): void {
    if (this.stage !== SalesStage.NEGOTIATION) {
      throw new InvalidSalesStageException();
    }

    this.apply(new OpportunityClosedWonEvent(
      this.id.value,
      salePrice,
      new Date(),
    ));
  }

  lose(reason: string): void {
    this.apply(new OpportunityClosedLostEvent(
      this.id.value,
      reason,
      new Date(),
    ));
  }
}
```

### Document Management
```typescript
export class PropertyDocument {
  private readonly documentId: string;
  private readonly propertyId: string;
  private readonly type: DocumentType;  // DEED, AGREEMENT, PERMIT, INSPECTION_REPORT
  private readonly fileUrl: string;
  private readonly uploadedBy: string;
  private readonly uploadedAt: Date;
  private readonly expiryDate?: Date;

  // Document types for Bangladesh real estate
  static readonly REQUIRED_DOCUMENTS = {
    LAND: ['DEED', 'SURVEY_MAP', 'RAJUK_APPROVAL', 'MUTATION'],
    APARTMENT: ['DEED', 'HOLDING_TAX_CERTIFICATE', 'OCCUPATION_CERTIFICATE'],
    COMMERCIAL: ['DEED', 'TRADE_LICENSE', 'FIRE_LICENSE', 'RAJUK_APPROVAL'],
  };

  isExpired(): boolean {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
  }

  isValidForType(propertyType: PropertyType): boolean {
    const required = PropertyDocument.REQUIRED_DOCUMENTS[propertyType];
    return required.includes(this.type);
  }
}

export class PropertyDocumentService {
  async verifyAllRequiredDocuments(property: Property): Promise<boolean> {
    const required = PropertyDocument.REQUIRED_DOCUMENTS[property.type];
    const existing = await this.documentRepository.findByProperty(property.id);

    // Check all required documents exist and are not expired
    for (const docType of required) {
      const doc = existing.find(d => d.type === docType);
      if (!doc || doc.isExpired()) {
        return false;
      }
    }

    return true;
  }
}
```

---

## Conclusion

This document consolidates **17 essential patterns** for Vextrus ERP development. Each pattern is battle-tested and optimized for:

- **18 Microservices** (DDD + Event Sourcing + CQRS + GraphQL Federation v2)
- **Bangladesh Construction & Real Estate** (NBR compliance, fiscal year, RAJUK integration)
- **Multi-Tenancy** (5-layer isolation)
- **Production-Ready** (90%+ coverage, <300ms response, phased deployment)

**Usage**:
1. Reference relevant sections when implementing features
2. Copy patterns and adapt to specific use case
3. Update patterns as new learnings emerge
4. Link to this document from service CLAUDE.md files

**Maintenance**:
- Update patterns based on production learnings
- Add new sections as domain expands (Inventory, SCM, etc.)
- Keep examples current with latest NestJS/TypeORM versions
- Document pattern changes in git commits

**Version**: 2.0 (Agent-First Architecture)
**Last Updated**: 2025-10-22
**Next Review**: 2025-11-22 (monthly)
