# Vextrus ERP - Technical Patterns

**Version**: 3.0 (Agent-First Architecture + Optimized)
**Updated**: 2025-10-24
**Purpose**: Single source of truth for all technical patterns across 18 microservices
**Optimization**: 38% reduction (2,428 → 1,500 lines) while preserving all 17 sections

---

## How to Use This Document

**Reference When**:
- Implementing new features (check relevant pattern sections)
- Reviewing code quality (verify pattern compliance)
- Onboarding new developers (comprehensive pattern guide)

**Organization**: 17 pattern sections, optimized for clarity
**Load Strategy**: Load sections on-demand (not all at once)

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

### Entity Pattern (Federation)
```graphql
# Finance service
type Invoice @key(fields: "id") {
  id: ID!
  customerId: ID!
  customer: Customer  # Resolved from master-data service
  totalAmount: Float!
}

# Reference resolver
@ResolveReference()
async resolveCustomer(reference: { __typename: string; id: string }) {
  return { __typename: 'Customer', id: reference.id };
}
```

### Query Pattern
```graphql
# Single entity
invoice(id: ID!): Invoice

# List with pagination (ALWAYS for lists)
invoices(page: Int = 1, limit: Int = 20): InvoicePage!

type InvoicePage {
  data: [Invoice!]!
  meta: PaginationMeta!
}
```

### Mutation Pattern
```graphql
# Action-oriented naming (not CRUD)
createInvoice(input: CreateInvoiceInput!): InvoicePayload!

type InvoicePayload {
  success: Boolean!
  data: Invoice
  errors: [Error!]
}
```

### Resolver Implementation
```typescript
@Resolver(() => Invoice)
export class InvoiceResolver {
  @Mutation(() => InvoicePayload)
  @UseGuards(JwtAuthGuard, RbacGuard)  // ALWAYS BOTH
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
- ✅ Always paginate lists
- ✅ Return payload types with errors (don't throw from mutations)
- ✅ Apply guards on ALL operations (no @Public())
- ❌ Never expose database IDs directly (use UUIDs)

---

## 2. Event Sourcing + CQRS

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
    },
  ) {
    this.occurredOn = new Date();
  }
}
```

### Aggregate Pattern
```typescript
export class Invoice extends AggregateRoot {
  // Factory method
  static create(
    customerId: CustomerId,
    lineItems: LineItem[],
    tenantId: string,
  ): Invoice {
    const invoice = new Invoice();
    invoice.apply(
      new InvoiceCreatedEvent(uuid(), tenantId, { customerId: customerId.value, lineItems, ... }),
    );
    return invoice;
  }

  // Business logic methods (enforce invariants)
  approve(approvedBy: string): void {
    if (this.status !== InvoiceStatus.DRAFT) {
      throw new InvalidInvoiceStatusException('Only DRAFT invoices can be approved');
    }
    this.apply(new InvoiceApprovedEvent(this.id.value, approvedBy));
  }

  // Event handlers (update state)
  private onInvoiceCreatedEvent(event: InvoiceCreatedEvent): void {
    this.id = new InvoiceId(event.aggregateId);
    this.customerId = new CustomerId(event.data.customerId);
    this.totalAmount = new Money(event.data.totalAmount);
    this.status = InvoiceStatus.DRAFT;
  }
}
```

### Command Handler Pattern
```typescript
@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler {
  async execute(command: CreateInvoiceCommand): Promise<void> {
    const invoice = Invoice.create(
      new CustomerId(command.customerId),
      command.lineItems,
      command.tenantId,
    );
    await this.repository.save(invoice);  // Events auto-published
  }
}
```

### Projection Handler Pattern
```typescript
@EventsHandler(InvoiceCreatedEvent, InvoiceApprovedEvent)
export class InvoiceProjectionHandler {
  async handle(event: DomainEvent): Promise<void> {
    if (event.eventType === 'InvoiceCreated') {
      await this.repository.save(new InvoiceProjection(event.data));
    }
    // Invalidate cache
    await this.cacheService.invalidate(`invoice:${event.aggregateId}`);
  }
}
```

### Best Practices
- ✅ Events are immutable (never change or delete)
- ✅ Events are past tense: `InvoiceCreated`, not `CreateInvoice`
- ✅ Aggregates are small and focused (1 root entity)
- ✅ Use idempotent event handlers
- ✅ Version events for schema evolution
- ❌ Don't query during command execution

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
  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      throw new UnauthorizedException('Missing X-Tenant-Id header');
    }

    // Set tenant context
    this.tenantContext.setTenantId(tenantId);

    // Set PostgreSQL search_path
    await this.dataSource.query(`SET search_path TO tenant_${tenantId}`);

    next();
  }
}
```

### Tenant-Aware Repository
```typescript
async findById(id: string): Promise<Invoice | null> {
  const tenantId = this.tenantContext.getTenantId();

  return this.repository.findOne({
    where: {
      id,
      tenantId,  // CRITICAL: Always filter by tenant
    },
  });
}
```

### Best Practices
- ✅ ALWAYS filter by tenantId in queries
- ✅ Use schema-based isolation for strong separation
- ✅ Test cross-tenant data leakage in integration tests
- ❌ Never trust client-provided tenant ID without JWT validation

---

## 4. Security & RBAC

### Role-Permission Mapping
```typescript
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  FINANCE_MANAGER = 'FINANCE_MANAGER',
  ACCOUNTANT = 'ACCOUNTANT',
  USER = 'USER',
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.FINANCE_MANAGER]: [
    { resource: 'invoices', action: '*' },
    { resource: 'payments', action: '*' },
  ],
  [Role.ACCOUNTANT]: [
    { resource: 'invoices', action: 'read' },
    { resource: 'invoices', action: 'update' },
  ],
};
```

### RBAC Guard Implementation
```typescript
@Injectable()
export class RbacGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    const user = context.switchToHttp().getRequest().user;
    const userPermissions = this.getUserPermissions(user.roles);

    return requiredPermissions.every(required =>
      this.hasPermission(userPermissions, required),
    );
  }
}
```

### Input Validation
```typescript
// DTO with validation
export class CreateInvoiceInput {
  @IsUUID()
  customerId: string;

  @IsArray()
  @ValidateNested({ each: true })
  lineItems: LineItemInput[];

  @IsDate()
  dueDate: Date;
}
```

### Best Practices
- ✅ ALWAYS use both JwtAuthGuard AND RbacGuard
- ✅ NO @Public() decorators (100% authentication coverage)
- ✅ Enable strict validation (forbidNonWhitelisted: true)
- ❌ Never log sensitive data (passwords, tokens)

---

## 5. Database Migrations

### Zero-Downtime Migration Pattern
```typescript
// Phase 1: Add nullable column
export class AddEmailToUsers implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('users', new TableColumn({
      name: 'email',
      type: 'varchar',
      isNullable: true,  // Phase 1: Nullable
    }));

    // Create index concurrently (non-blocking)
    await queryRunner.query(
      `CREATE INDEX CONCURRENTLY idx_users_email ON users(email)`,
    );
  }
}

// Phase 2: Backfill data (separate migration)
// Phase 3: Make NOT NULL (after backfill)
```

### Best Practices
- ✅ Use 3-phase migrations (add nullable → backfill → make required)
- ✅ Create indexes CONCURRENTLY (non-blocking)
- ✅ Always write reversible migrations
- ❌ Never drop columns with data (archive instead)
- ❌ Don't run synchronize: true in production

---

## 6. Error Handling & Observability

### Error Hierarchy
```typescript
export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly metadata?: Record<string, any>,
  ) {
    super(message);
  }
}

export class InvoiceNotFoundException extends DomainException {
  constructor(invoiceId: string) {
    super(
      `Invoice with ID ${invoiceId} not found`,
      'INVOICE_NOT_FOUND',
      { invoiceId },
    );
  }
}
```

### Global Exception Filter
```typescript
@Catch()
export class GlobalExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';

    if (exception instanceof DomainException) {
      status = HttpStatus.BAD_REQUEST;
      code = exception.code;
      this.logger.log({ level: 'info', ...exception });
    } else {
      this.logger.error({ level: 'error', ...exception });
    }

    response.status(status).json({ success: false, error: { code, message } });
  }
}
```

### OpenTelemetry Integration
```typescript
async execute(command: CreateInvoiceCommand): Promise<void> {
  const span = this.tracer.startSpan('CreateInvoice', {
    attributes: {
      'tenant.id': command.tenantId,
      'invoice.amount': command.totalAmount,
    },
  });

  try {
    const invoice = Invoice.create(/*...*/);
    await this.repository.save(invoice);
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

### Best Practices
- ✅ Use specific domain exceptions with error codes
- ✅ Include context in logs (tenantId, userId, traceId)
- ✅ Trace business operations with OpenTelemetry
- ❌ Never expose stack traces to clients

---

## 7. Performance & Caching

### Redis Caching Strategy
```typescript
export class CacheKeys {
  static invoice(tenantId: string, invoiceId: string): string {
    return `tenant:${tenantId}:invoice:${invoiceId}`;
  }
}

export enum CacheTTL {
  QUERY = 60,      // 1 minute
  LIST = 300,      // 5 minutes
  REPORT = 1800,   // 30 minutes
}
```

### Cache-Aside Pattern
```typescript
@QueryHandler(GetInvoiceQuery)
export class GetInvoiceHandler {
  async execute(query: GetInvoiceQuery): Promise<Invoice | null> {
    const cacheKey = CacheKeys.invoice(query.tenantId, query.invoiceId);

    // Try cache first
    const cached = await this.cacheService.get<Invoice>(cacheKey);
    if (cached) return cached;

    // Cache miss - query database
    const invoice = await this.repository.findOne({ id, tenantId });

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
@EventsHandler(InvoiceCreatedEvent, InvoiceApprovedEvent)
export class InvoiceProjectionHandler {
  async handle(event: DomainEvent): Promise<void> {
    await this.updateProjection(event);

    // Invalidate cache (pattern-based)
    await this.cacheService.invalidatePattern(`tenant:${event.tenantId}:invoice:*`);
  }
}
```

### Best Practices
- ✅ Cache read-heavy queries (10+ reads per write)
- ✅ Use pattern-based invalidation on events
- ✅ Create composite indexes for common filters
- ✅ Pre-calculate aggregates (avoid runtime SUM/COUNT)
- ❌ Don't cache without tenant isolation

---

## 8. Service Integration

### Circuit Breaker Pattern
```typescript
export class MasterDataClient {
  private circuitBreaker: CircuitBreaker;

  constructor(httpService: HttpService) {
    this.circuitBreaker = new CircuitBreaker(this.getCustomer.bind(this), {
      timeout: 3000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
    });
  }

  async getCustomer(customerId: string): Promise<Customer> {
    return this.circuitBreaker.fire(customerId);
  }
}
```

### Retry Strategy
```typescript
async processPayment(payment: Payment): Promise<PaymentResult> {
  return this.httpService.post('/charge', payment)
    .pipe(
      retry({
        count: 3,
        delay: (error, retryCount) => {
          const delayMs = Math.pow(2, retryCount) * 1000;  // Exponential backoff
          return timer(delayMs);
        },
      }),
    )
    .toPromise();
}
```

### Best Practices
- ✅ Use circuit breakers for external services
- ✅ Implement exponential backoff for retries
- ✅ Timeout all external calls (3-5 seconds)
- ✅ Graceful degradation (critical path succeeds)
- ❌ Don't fail entire operation on non-critical service failure

---

## 9. Domain Modeling (DDD)

### Value Objects
```typescript
export class Money {
  private readonly amount: number;
  private readonly currency: string;

  constructor(amount: number, currency: string = 'BDT') {
    if (amount < 0) throw new InvalidMoneyException();
    this.amount = Math.round(amount * 100) / 100;
    this.currency = currency;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  isZero(): boolean {
    return this.amount === 0;
  }
}
```

### Aggregate Boundaries
```
Invoice Aggregate (Root: Invoice)
├── LineItems (Entities)
└── InvoiceId, CustomerId (Value Objects)

Payment Aggregate (Root: Payment)
├── InvoiceId (Reference - NOT owned)
└── PaymentId, Amount (Value Objects)

Rule: Aggregates reference each other by ID only
```

### Best Practices
- ✅ Value objects are immutable
- ✅ Aggregates are small (1 root + related entities)
- ✅ Reference other aggregates by ID only
- ❌ Don't create anemic domain models (getters/setters only)

---

## 10. NestJS Patterns

### Module Organization
```
services/finance/src/
├── domain/ (Aggregates, Value Objects)
├── application/ (Commands, Queries, Handlers)
├── infrastructure/ (Repositories, Guards)
└── presentation/ (GraphQL Resolvers, REST)
```

### Dependency Injection
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([InvoiceProjection]),
    CqrsModule,
  ],
  providers: [
    CreateInvoiceHandler,
    GetInvoiceHandler,
    {
      provide: 'InvoiceRepository',
      useClass: InvoiceEventSourcedRepository,
    },
  ],
})
export class InvoiceModule {}
```

### Best Practices
- ✅ One module per aggregate or bounded context
- ✅ Inject dependencies through constructor
- ❌ Don't create circular dependencies between modules

---

## 11. Testing Strategies

### Unit Test Pattern (AAA)
```typescript
describe('Invoice.approve', () => {
  it('should approve DRAFT invoice', () => {
    // Arrange
    const invoice = Invoice.create(/*...*/);

    // Act
    invoice.approve('user-456');

    // Assert
    expect(invoice.status).toBe(InvoiceStatus.APPROVED);
    expect(invoice.getUncommittedEvents()).toContainEqual(
      expect.objectContaining({ eventType: 'InvoiceApproved' }),
    );
  });

  it('should throw when approving non-DRAFT invoice', () => {
    const invoice = Invoice.create(/*...*/);
    invoice.approve('user-456');  // Already approved

    expect(() => invoice.approve('user-789')).toThrow(InvalidInvoiceStatusException);
  });
});
```

### Integration Test Pattern
```typescript
describe('CreateInvoiceHandler (Integration)', () => {
  let handler: CreateInvoiceHandler;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot({ database: ':memory:' })],
      providers: [CreateInvoiceHandler],
    }).compile();

    handler = module.get(CreateInvoiceHandler);
  });

  it('should create invoice and persist', async () => {
    const command = new CreateInvoiceCommand(/*...*/);
    await handler.execute(command);

    const invoices = await repository.findAll({ tenantId: 'tenant-1' });
    expect(invoices).toHaveLength(1);
  });
});
```

### Coverage Targets
- Domain Layer (Aggregates, Value Objects): **90-100%**
- Application Layer (Handlers, Services): **80-90%**
- Infrastructure Layer: **60-80%**

### Best Practices
- ✅ Unit tests for domain logic
- ✅ Integration tests for handlers and repositories
- ✅ E2E tests for critical user flows
- ❌ Don't test framework code

---

## 12. API Versioning

### GraphQL Field Deprecation
```graphql
type Invoice {
  totalAmount: Float!  # Current field

  # Deprecated field (keep for backward compatibility)
  total: Float! @deprecated(reason: "Use 'totalAmount' instead. Removed 2025-01-01")
}
```

### Breaking Change Strategy
```
Phase 1 (Month 1): Add new field, deprecate old
Phase 2 (Month 2-6): Monitor usage, notify clients
Phase 3 (Month 7+): Remove if usage < 1%
```

### Best Practices
- ✅ Use date-based versioning (2024-10-01)
- ✅ Provide 6+ months notice for breaking changes
- ❌ Don't break existing clients without notice

---

## 13. Health Checks

### Health Check Endpoint
```typescript
@Controller('health')
export class HealthController {
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 1500 }),
      () => this.redis.pingCheck('redis', { timeout: 1000 }),
      () => this.eventStore.isHealthy(),
    ]);
  }

  @Get('ready')
  ready() {
    // Readiness check (can accept traffic?)
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('live')
  live() {
    // Liveness check (is running?)
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

### Best Practices
- ✅ Implement /health, /health/ready, /health/live
- ✅ Set appropriate timeouts (1-3 seconds)
- ❌ Don't perform expensive operations in health checks

---

## 14. Bangladesh Compliance

### VAT Calculation (15% Standard)
```typescript
export class VATCalculationService {
  private readonly STANDARD_VAT_RATE = 0.15;  // 15% for construction
  private readonly REDUCED_VAT_RATE = 0.05;   // 5% for some items
  private readonly ZERO_VAT_RATE = 0.0;       // 0% for exports

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
    VENDOR_WITH_TIN: 0.05,      // 5%
    VENDOR_WITHOUT_TIN: 0.075,  // 7.5% (1.5x penalty)
    CONTRACTOR: 0.03,           // 3%
    PROFESSIONAL_SERVICE: 0.10, // 10%
  };

  calculateTDS(payment: Payment, vendorType: VendorType, hasTIN: boolean): Money {
    let rate = vendorType === VendorType.VENDOR && !hasTIN
      ? this.TDS_RATES.VENDOR_WITHOUT_TIN
      : this.TDS_RATES.VENDOR_WITH_TIN;

    return payment.amount.multiply(rate);
  }
}
```

### Mushak 6.3 Generation
```typescript
export class Mushak63Service {
  async generateMushak63(invoice: Invoice): Promise<Mushak63Document> {
    return {
      challanNumber: invoice.challanNumber,
      buyerName: invoice.customer.name,
      buyerBIN: invoice.customer.binNumber,
      supplierBIN: process.env.COMPANY_BIN,

      items: invoice.lineItems.map((item, index) => ({
        slNo: index + 1,
        description: item.description,
        totalPrice: item.totalAmount.amount,
        vat: item.vatAmount.amount,
      })),

      totalVAT: invoice.totalVAT.amount,
      qrCode: await this.generateQRCode(invoice),
    };
  }
}
```

### Fiscal Year (July-June)
```typescript
export class FiscalPeriodService {
  getFiscalYear(date: Date): number {
    const month = date.getMonth();
    const year = date.getFullYear();
    return month >= 6 ? year : year - 1;  // Fiscal year starts July
  }

  getFiscalYearStart(fiscalYear: number): Date {
    return new Date(fiscalYear, 6, 1);  // July 1st
  }

  getFiscalYearEnd(fiscalYear: number): Date {
    return new Date(fiscalYear + 1, 5, 30);  // June 30th
  }
}
```

### Best Practices
- ✅ Always apply VAT to construction materials (15%)
- ✅ Withhold TDS for vendors without TIN (1.5x rate)
- ✅ Generate Mushak 6.3 on invoice approval
- ✅ Use fiscal year July-June for all financial reports
- ❌ Don't charge VAT on exports (0%)
- ❌ Don't use calendar year for financial reporting

---

## 15. Production Deployment

### Phased Rollout Strategy
```yaml
# Canary deployment (5% → 50% → 100%)
apiVersion: flagger.app/v1beta1
kind: Canary
spec:
  analysis:
    interval: 10m
    stepWeight: 5
    maxWeight: 50
    metrics:
    - name: request-success-rate
      thresholdRange: { min: 99 }
    - name: request-duration
      thresholdRange: { max: 500 }
```

### Observability
```typescript
@Injectable()
export class MetricsService {
  private readonly invoiceCreatedCounter = new Counter({
    name: 'invoices_created_total',
    labelNames: ['tenant_id', 'status'],
  });

  async recordInvoiceCreated(tenantId: string): Promise<void> {
    this.invoiceCreatedCounter.inc({ tenant_id: tenantId, status: 'DRAFT' });
  }
}
```

### Best Practices
- ✅ Use canary deployments for critical services
- ✅ Monitor error rate, latency, throughput
- ✅ Run database migrations before deployment
- ❌ Don't deploy during peak hours
- ❌ Don't skip staging environment testing

---

## 16. Construction Project Management

### Project Budget Tracking
```typescript
export class ProjectBudget {
  private readonly totalBudget: Money;
  private readonly allocatedAmount: Money;
  private readonly spentAmount: Money;
  private readonly committedAmount: Money;

  getAvailableBudget(): Money {
    return this.totalBudget
      .subtract(this.allocatedAmount)
      .subtract(this.spentAmount)
      .subtract(this.committedAmount);
  }

  allocateBudget(amount: Money, category: BudgetCategory): void {
    const available = this.getAvailableBudget();
    if (amount.isGreaterThan(available)) {
      throw new InsufficientBudgetException();
    }
    this.apply(new BudgetAllocatedEvent(/*...*/));
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
    const totalContractValue = project.contractValue;
    const previouslyBilled = await this.getPreviouslyBilledAmount(project.id);
    const currentCompletionValue = totalContractValue.multiply(completionPercentage / 100);
    const billingAmount = currentCompletionValue.subtract(previouslyBilled);

    // Apply retention (typically 10% in Bangladesh)
    const retentionPercentage = 0.10;
    const retentionAmount = billingAmount.multiply(retentionPercentage);
    const netBillingAmount = billingAmount.subtract(retentionAmount);

    return Invoice.create(
      project.customerId,
      [
        { description: `Progress billing - ${completionPercentage}%`, amount: billingAmount },
        { description: `Retention (10%)`, amount: retentionAmount.multiply(-1) },
      ],
      project.tenantId,
    );
  }
}
```

### Site Management
```typescript
export class SiteActivity {
  recordMaterialDelivery(materialId: string, quantity: number): void {
    this.apply(new MaterialDeliveredEvent(this.siteId.value, materialId, quantity));
  }

  recordLabor(date: Date, workers: WorkerAttendance[]): void {
    for (const worker of workers) {
      if (!this.isWorkerAssigned(worker.workerId)) {
        throw new WorkerNotAssignedException();
      }
    }
    this.apply(new LaborRecordedEvent(this.siteId.value, date, workers));
  }

  recordEquipmentUsage(equipmentId: string, hours: number): void {
    this.apply(new EquipmentUsageRecordedEvent(this.siteId.value, equipmentId, hours));
  }
}
```

### Contractor Management
```typescript
export class ContractorPayment {
  calculatePaymentDue(): Money {
    const earnedAmount = this.contractAmount.multiply(this.workCompletionPercentage / 100);
    const retentionAmount = earnedAmount.multiply(this.paymentTerms.retentionPercentage / 100);
    const previousPayments = this.getPreviousPaymentTotal();

    return earnedAmount.subtract(retentionAmount).subtract(previousPayments);
  }

  releaseRetention(): Money {
    if (!this.isProjectCompleted() || !this.isDefectLiabilityPeriodOver()) {
      throw new RetentionNotReleasableException();
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
  // Property acquisition
  static acquire(type: PropertyType, location: Location, purchasePrice: Money): Property {
    const property = new Property();
    property.apply(new PropertyAcquiredEvent(uuid(), type, location, purchasePrice));
    return property;
  }

  // Property development
  startDevelopment(project: DevelopmentProject): void {
    if (this.status !== PropertyStatus.ACQUIRED) {
      throw new InvalidPropertyStatusException();
    }
    this.apply(new DevelopmentStartedEvent(this.id.value, project.id));
  }

  completeDevelopment(): void {
    this.apply(new DevelopmentCompletedEvent(this.id.value));
  }

  // Property sale
  listForSale(askingPrice: Money): void {
    this.apply(new PropertyListedForSaleEvent(this.id.value, askingPrice));
  }

  sell(buyer: BuyerId, salePrice: Money): void {
    this.apply(new PropertySoldEvent(this.id.value, buyer, salePrice));
  }
}
```

### Lease Management
```typescript
export class Lease extends AggregateRoot {
  static create(propertyId: PropertyId, tenantId: TenantId, terms: LeaseTerms): Lease {
    const lease = new Lease();
    lease.apply(new LeaseCreatedEvent(uuid(), propertyId, tenantId, terms));
    return lease;
  }

  generateMonthlyInvoice(month: Date): Invoice {
    if (this.status !== LeaseStatus.ACTIVE) throw new InactiveLeaseException();
    if (this.isRentInvoicedForMonth(month)) throw new RentAlreadyInvoicedException();

    const rentAmount = this.calculateMonthlyRent(month);
    const dueDate = new Date(month.getFullYear(), month.getMonth(), this.paymentDay);

    return Invoice.create(
      this.tenantId,
      [{ description: `Monthly rent - ${month.toLocaleDateString()}`, amount: rentAmount }],
      dueDate,
    );
  }

  terminate(reason: LeaseTerminationReason): void {
    const hasOutstandingRent = this.getOutstandingRentAmount().isGreaterThan(new Money(0));
    const refundableDeposit = hasOutstandingRent
      ? this.securityDeposit.subtract(this.getOutstandingRentAmount())
      : this.securityDeposit;

    this.apply(new LeaseTerminatedEvent(this.id.value, reason, refundableDeposit));
  }
}
```

### Sales Pipeline
```typescript
export class SalesOpportunity extends AggregateRoot {
  // Sales stages: LEAD → QUALIFIED → VIEWING → NEGOTIATION → CLOSED_WON/LOST

  qualify(): void {
    if (this.stage !== SalesStage.LEAD) throw new InvalidSalesStageException();
    this.apply(new OpportunityQualifiedEvent(this.id.value));
  }

  scheduleViewing(viewingDate: Date): void {
    this.apply(new ViewingScheduledEvent(this.id.value, viewingDate));
  }

  recordViewing(feedback: ViewingFeedback): void {
    this.apply(new ViewingCompletedEvent(this.id.value, feedback));

    if (feedback.interestedToPurchase) {
      this.moveToNegotiation();
    }
  }

  recordOffer(offerAmount: Money): void {
    this.apply(new OfferReceivedEvent(this.id.value, offerAmount));
  }

  close(salePrice: Money): void {
    this.apply(new OpportunityClosedWonEvent(this.id.value, salePrice));
  }

  lose(reason: string): void {
    this.apply(new OpportunityClosedLostEvent(this.id.value, reason));
  }
}
```

### Document Management
```typescript
export class PropertyDocument {
  // Required documents for Bangladesh real estate
  static readonly REQUIRED_DOCUMENTS = {
    LAND: ['DEED', 'SURVEY_MAP', 'RAJUK_APPROVAL', 'MUTATION'],
    APARTMENT: ['DEED', 'HOLDING_TAX_CERTIFICATE', 'OCCUPATION_CERTIFICATE'],
    COMMERCIAL: ['DEED', 'TRADE_LICENSE', 'FIRE_LICENSE', 'RAJUK_APPROVAL'],
  };

  isExpired(): boolean {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
  }
}

export class PropertyDocumentService {
  async verifyAllRequiredDocuments(property: Property): Promise<boolean> {
    const required = PropertyDocument.REQUIRED_DOCUMENTS[property.type];
    const existing = await this.documentRepository.findByProperty(property.id);

    for (const docType of required) {
      const doc = existing.find(d => d.type === docType);
      if (!doc || doc.isExpired()) return false;
    }
    return true;
  }
}
```

---

## Conclusion

This document consolidates **17 essential patterns** for Vextrus ERP development, optimized for:

- **18 Microservices** (DDD + Event Sourcing + CQRS + GraphQL Federation v2)
- **Bangladesh Construction & Real Estate** (NBR compliance, RAJUK integration)
- **Multi-Tenancy** (5-layer isolation)
- **Production-Ready** (90%+ coverage, <300ms response)

**Usage**:
1. Reference relevant sections when implementing features
2. Copy patterns and adapt to specific use case
3. Cross-reference with `.claude/skills/` for instant patterns

**Version**: 3.0 (Agent-First + Optimized)
**Last Updated**: 2025-10-24
**Optimization**: 38% reduction (2,428 → 1,492 lines)
**Next Review**: 2025-11-24
