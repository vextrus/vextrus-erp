# Dependency Injection Patterns

**Purpose**: Comprehensive guide to NestJS dependency injection patterns (useClass, useFactory, useValue, custom providers).

---

## Provider Strategies

### 1. useClass (Implementation Injection)

**Pattern: Interface-Based Repository**

```typescript
// Domain layer (interface)
export interface IInvoiceRepository {
  save(invoice: Invoice): Promise<void>;
  findById(id: string, tenantId: string): Promise<Invoice>;
}

// Infrastructure layer (implementation)
@Injectable()
export class InvoiceEventStoreRepository implements IInvoiceRepository {
  async save(invoice: Invoice): Promise<void> { ... }
  async findById(id: string, tenantId: string): Promise<Invoice> { ... }
}

// Module configuration
@Module({
  providers: [
    {
      provide: 'IInvoiceRepository',
      useClass: InvoiceEventStoreRepository,
    },
  ],
  exports: ['IInvoiceRepository'],
})
export class FinanceModule {}

// Consumer (injection)
@Injectable()
export class CreateInvoiceHandler {
  constructor(
    @Inject('IInvoiceRepository')
    private readonly repository: IInvoiceRepository,
  ) {}
}
```

**Benefits:**
- Interface-based design (testable)
- Easy mocking (swap implementation)
- Dependency inversion principle

**Use Cases:**
- Repository pattern
- Strategy pattern
- Adapter pattern

---

### 2. useFactory (Dynamic Configuration)

**Pattern: Async Service Initialization**

```typescript
@Module({
  providers: [
    {
      provide: 'KAFKA_SERVICE',
      useFactory: async (configService: ConfigService) => {
        const brokers = configService.get('KAFKA_BROKERS').split(',');
        const clientId = configService.get('KAFKA_CLIENT_ID');

        return new Kafka({
          clientId,
          brokers,
          retry: {
            retries: 5,
            initialRetryTime: 100,
          },
        });
      },
      inject: [ConfigService],
    },
    {
      provide: 'EVENTSTORE_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const connectionString = configService.get('EVENTSTORE_CONNECTION_STRING');
        const client = EventStoreDBClient.connectionString(connectionString);

        // Verify connection
        await client.readAll({ direction: FORWARDS, maxCount: 1 });

        return client;
      },
      inject: [ConfigService],
    },
  ],
})
export class InfrastructureModule {}
```

**Multi-Dependency Factory:**

```typescript
{
  provide: 'MASTER_DATA_CLIENT',
  useFactory: async (
    configService: ConfigService,
    httpService: HttpService,
    logger: Logger,
  ) => {
    const baseUrl = configService.get('MASTER_DATA_URL');
    const timeout = configService.get('MASTER_DATA_TIMEOUT', 5000);

    return new MasterDataClient(baseUrl, httpService, logger, timeout);
  },
  inject: [ConfigService, HttpService, Logger],
}
```

**Use Cases:**
- External service clients (Kafka, EventStore, Redis)
- Database connections
- Complex object construction
- Async initialization (fetch secrets, verify connection)

---

### 3. useValue (Static Values/Mocks)

**Pattern: Feature Flags**

```typescript
@Module({
  providers: [
    {
      provide: 'FEATURE_FLAGS',
      useValue: {
        newInvoiceFlow: true,
        legacyPayments: false,
        dataLoaderEnabled: true,
      },
    },
  ],
})
export class AppModule {}

// Usage
@Injectable()
export class InvoiceService {
  constructor(@Inject('FEATURE_FLAGS') private flags: any) {}

  async createInvoice() {
    if (this.flags.newInvoiceFlow) {
      // New implementation
    } else {
      // Legacy implementation
    }
  }
}
```

**Pattern: Test Mocking**

```typescript
const module = await Test.createTestingModule({
  providers: [InvoiceService],
})
.overrideProvider(MasterDataClient)
.useValue({
  getVendor: jest.fn().mockResolvedValue({ id: 'vendor-1', name: 'Test Vendor' }),
  getCustomer: jest.fn().mockResolvedValue({ id: 'customer-1', name: 'Test Customer' }),
})
.compile();
```

**Use Cases:**
- Feature flags
- Testing mocks
- Static configuration objects
- Constants

---

## Global Providers

### APP_* Tokens (Global Guards, Interceptors, Pipes, Filters)

```typescript
@Module({
  providers: [
    // Global guard (all routes protected)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global interceptor (all requests traced)
    {
      provide: APP_INTERCEPTOR,
      useClass: ContextPropagationInterceptor,
    },
    // Global pipe (all inputs validated)
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    // Global filter (all exceptions handled)
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
```

**Benefits:**
- No boilerplate (`@UseGuards()` on every route)
- Centralized request processing
- Opt-out via decorators (`@Public()`)

---

### @Global() Modules

```typescript
@Global()
@Module({
  imports: [ConfigModule],
  providers: [EventStoreService],
  exports: [EventStoreService],
})
export class EventStoreModule {}

// Now available everywhere without re-importing
@Module({
  // NO imports: [EventStoreModule] needed
  providers: [InvoiceRepository], // Can inject EventStoreService
})
export class FinanceModule {}
```

**Use Cases:**
- Infrastructure services (EventStore, Kafka, Redis)
- Cross-cutting concerns (RBAC, telemetry)
- Services needed by 80%+ of modules

**Anti-Pattern:**
❌ Don't make feature modules global
```typescript
@Global() // ❌ NO! Feature modules should be local
@Module({
  providers: [InvoiceService],
})
export class InvoiceModule {}
```

---

## Injection Scopes

### DEFAULT (Singleton) - 99% of Cases

```typescript
@Injectable()
export class InvoiceService {
  // Singleton - one instance per application
}
```

### REQUEST Scope (Per-Request Instance)

```typescript
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private tenantId: string;

  setTenantId(tenantId: string) {
    this.tenantId = tenantId;
  }

  getTenantId(): string {
    return this.tenantId;
  }
}
```

**Use Cases:**
- Per-request state (tenant context, user session)
- Request-scoped caching

**Warning:** Performance overhead (new instance per request)

### TRANSIENT Scope (New Instance Per Injection)

```typescript
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  // New instance each time injected
}
```

**Use Cases:**
- Truly stateful services (rare)
- Testing isolation

**Warning:** High memory overhead

---

## Circular Dependencies

### Problem

```typescript
// invoice.service.ts
@Injectable()
export class InvoiceService {
  constructor(private paymentService: PaymentService) {}
}

// payment.service.ts
@Injectable()
export class PaymentService {
  constructor(private invoiceService: InvoiceService) {} // ❌ Circular!
}
```

**Error:** `Nest can't resolve dependencies of the PaymentService (?). Please make sure that the argument InvoiceService at index [0] is available in the PaymentService context.`

### Solution 1: Forward Reference

```typescript
// invoice.service.ts
@Injectable()
export class InvoiceService {
  constructor(
    @Inject(forwardRef(() => PaymentService))
    private paymentService: PaymentService,
  ) {}
}

// payment.service.ts
@Injectable()
export class PaymentService {
  constructor(
    @Inject(forwardRef(() => InvoiceService))
    private invoiceService: InvoiceService,
  ) {}
}
```

### Solution 2: Shared Service (Better)

```typescript
// shared.service.ts
@Injectable()
export class SharedFinanceService {
  calculateTotal() { ... }
}

// invoice.service.ts
@Injectable()
export class InvoiceService {
  constructor(private sharedService: SharedFinanceService) {}
}

// payment.service.ts
@Injectable()
export class PaymentService {
  constructor(private sharedService: SharedFinanceService) {}
}
```

### Solution 3: Event-Driven (Best)

```typescript
// invoice.service.ts
@Injectable()
export class InvoiceService {
  constructor(private eventBus: EventBus) {}

  async approveInvoice(id: string) {
    // ... approve logic
    await this.eventBus.publish(new InvoiceApprovedEvent(id));
  }
}

// payment.handler.ts
@EventsHandler(InvoiceApprovedEvent)
export class CreatePaymentHandler {
  constructor(private commandBus: CommandBus) {}

  async handle(event: InvoiceApprovedEvent) {
    await this.commandBus.execute(new CreatePaymentCommand(event.invoiceId));
  }
}
```

---

## Custom Providers

### Class-based Provider

```typescript
// Long form
{
  provide: InvoiceService,
  useClass: InvoiceService,
}

// Short form (equivalent)
InvoiceService
```

### Aliased Provider

```typescript
// Multiple tokens for same provider
{
  provide: 'LOGGER',
  useExisting: Logger,
}

// Usage
constructor(
  @Inject('LOGGER') private logger: Logger,
) {}
```

### Multi-Provider (Array Aggregation)

```typescript
@Module({
  providers: [
    { provide: 'EVENT_HANDLERS', useClass: InvoiceCreatedHandler, multi: true },
    { provide: 'EVENT_HANDLERS', useClass: InvoiceApprovedHandler, multi: true },
    { provide: 'EVENT_HANDLERS', useClass: PaymentProcessedHandler, multi: true },
  ],
})

// Injection (gets array of all handlers)
constructor(
  @Inject('EVENT_HANDLERS') private handlers: EventHandler[],
) {}
```

---

## Injection Best Practices

### ✅ DO: Constructor Injection

```typescript
@Injectable()
export class InvoiceService {
  constructor(
    private readonly repository: IInvoiceRepository,
    private readonly commandBus: CommandBus,
  ) {}
}
```

### ❌ DON'T: Property Injection

```typescript
@Injectable()
export class InvoiceService {
  @Inject('IInvoiceRepository')
  private repository: IInvoiceRepository; // ❌ Harder to test
}
```

### ✅ DO: Interface Tokens

```typescript
{
  provide: 'IInvoiceRepository',
  useClass: InvoiceEventStoreRepository,
}
```

### ❌ DON'T: Concrete Class Tokens for Abstractions

```typescript
{
  provide: InvoiceEventStoreRepository, // ❌ Couples to implementation
  useClass: InvoiceEventStoreRepository,
}
```

### ✅ DO: Optional Dependencies

```typescript
constructor(
  @Optional() @Inject('FEATURE_FLAGS') private flags?: any,
) {
  this.flags = this.flags || { newInvoiceFlow: false };
}
```

---

## Vextrus ERP Examples

**Global EventStore Module:**
```typescript
@Global()
@Module({
  imports: [ConfigModule],
  providers: [EventStoreService],
  exports: [EventStoreService],
})
export class EventStoreModule {}
```

**Kafka Factory Provider:**
```typescript
{
  provide: 'KAFKA_SERVICE',
  useFactory: async (configService: ConfigService) => ({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: configService.get('KAFKA_BROKERS', 'localhost:9092').split(','),
      },
    },
  }),
  inject: [ConfigService],
}
```

**Repository Interface Injection:**
```typescript
{
  provide: 'IInvoiceRepository',
  useClass: InvoiceEventStoreRepository,
}
```

**Test Mocking:**
```typescript
.overrideProvider(MasterDataClient)
.useValue({
  getVendor: jest.fn().mockResolvedValue({ id: 'vendor-1' }),
})
```

---

## Summary

| Pattern | Use Case | Example |
|---------|----------|---------|
| **useClass** | Interface implementation | Repository pattern |
| **useFactory** | Async initialization | Kafka client, EventStore |
| **useValue** | Static config, mocks | Feature flags, testing |
| **@Global()** | Cross-cutting services | EventStore, RBAC |
| **APP_GUARD** | Global guards | JwtAuthGuard |
| **forwardRef** | Circular deps | Service A ↔ Service B |
| **Scope.REQUEST** | Per-request state | Tenant context |

**Best Practices:**
1. Use string tokens for interface-based injection
2. Use `useFactory` for async initialization
3. Use `@Global()` sparingly (infrastructure only)
4. Prefer event-driven over circular deps
5. Constructor injection over property injection
6. Mock external services with `useValue`
