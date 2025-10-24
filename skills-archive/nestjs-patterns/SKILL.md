---
name: nestjs-patterns
version: 1.0.0
triggers:
  - "nestjs"
  - "nest module"
  - "dependency injection"
  - "nest guard"
  - "nest interceptor"
  - "nest decorator"
  - "nest testing"
auto_load_knowledge:
  - sessions/knowledge/vextrus-erp/patterns/nestjs-patterns.md
---

# NestJS Patterns Skill

**Auto-activates on**: "nestjs", "nest module", "dependency injection", "nest guard", "nest interceptor"

**Purpose**: Enforce NestJS best practices for module organization, dependency injection, guards, interceptors, and testing patterns.

---

## When This Skill Activates

Use when implementing or reviewing:
- NestJS module organization and structure
- Dependency injection patterns (providers, custom providers)
- Guards, interceptors, pipes, filters
- Custom decorators (parameter, method, class)
- NestJS testing module setup
- Request lifecycle management
- Multi-context (HTTP + GraphQL) patterns

---

## Core NestJS Principles

### 1. Modular Architecture

**3-Tier Module Structure:**
```
Root Module (AppModule)
├── Infrastructure Modules (@Global)
│   ├── EventStoreModule (@Global)
│   ├── KafkaModule (@Global)
│   └── TelemetryModule (@Global)
├── Feature Modules (Domain Logic)
│   ├── FinanceGraphQLModule
│   └── InvoiceModule
└── Configuration Modules
    ├── ConfigModule (isGlobal: true)
    └── DatabaseModule
```

**Decision Tree:**
- Cross-cutting infrastructure? → **@Global() module**
- Configuration needed everywhere? → **isGlobal: true**
- Domain/feature logic? → **Local module** (import where needed)
- Business logic? → **Feature module** with CQRS handlers

---

## Module Organization Patterns

### forRoot/forRootAsync Pattern

```typescript
// Static configuration (simple cases)
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
})
export class AppModule {}

// Async configuration (with dependency injection)
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // NEVER true in production
      }),
      inject: [ConfigService],
    }),

    GraphQLModule.forRootAsync({
      driver: ApolloFederationDriver,
      imports: [ConfigModule],
      useClass: GraphQLFederationConfig,
    }),
  ],
})
export class AppModule {}
```

**When to Use:**
- **forRoot (static)**: Configuration is hardcoded or environment-based
- **forRootAsync + useFactory**: Configuration needs dependency injection (ConfigService)
- **forRootAsync + useClass**: Complex configuration logic in dedicated provider

**Benefits:**
- Deferred initialization (async factory)
- Dependency injection into configuration
- Testability (override configuration in tests)

---

### Global Modules Pattern

```typescript
@Global()
@Module({
  imports: [ConfigModule],
  providers: [EventStoreService],
  exports: [EventStoreService],
})
export class EventStoreModule {}

@Global()
@Module({
  providers: [
    {
      provide: 'KAFKA_SERVICE',
      useFactory: async (configService: ConfigService) => ({
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: configService.get('KAFKA_BROKERS').split(','),
          },
        },
      }),
      inject: [ConfigService],
    },
  ],
  exports: ['KAFKA_SERVICE'],
})
export class KafkaModule {}
```

**Use Cases for @Global():**
- Infrastructure services (EventStore, Kafka, Redis)
- Cross-cutting concerns (RBAC, telemetry)
- Services needed by 80%+ of modules

**Anti-Pattern:**
❌ Don't make feature modules global
✅ Only infrastructure and cross-cutting modules

---

### Feature Module Pattern (CQRS)

```typescript
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([InvoiceProjection, PaymentProjection]),
    HttpModule.register({ timeout: 5000 }),
  ],
  providers: [
    // Resolvers/Controllers
    InvoiceResolver,

    // Command Handlers (auto-registered via @CommandHandler)
    CreateInvoiceHandler,
    ApproveInvoiceHandler,

    // Query Handlers (auto-registered via @QueryHandler)
    GetInvoiceHandler,
    GetInvoicesHandler,

    // Event Handlers (bulk registration)
    ...INVOICE_EVENT_HANDLERS,

    // Repositories (interface-based DI)
    {
      provide: 'IInvoiceRepository',
      useClass: InvoiceEventStoreRepository,
    },

    // Domain Services
    InvoiceCalculationService,
    VATCalculationService,

    // External Clients
    MasterDataClient,
  ],
  exports: [
    'IInvoiceRepository',
    InvoiceResolver,
  ],
})
export class FinanceGraphQLModule {}
```

**Key Patterns:**
- **CQRS Handlers**: Auto-register via decorators (no manual `CommandBus.register()`)
- **Spread Operator**: Bulk event handler registration (`...INVOICE_EVENT_HANDLERS`)
- **Interface-Based Repositories**: String tokens for easy mocking
- **Selective Exports**: Only export public API (repositories, resolvers)

---

## Dependency Injection Patterns

### Provider Strategies

#### 1. useClass (Interface Implementation)

```typescript
providers: [
  {
    provide: 'IInvoiceRepository',
    useClass: InvoiceEventStoreRepository,
  },
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
]

// Injection
constructor(
  @Inject('IInvoiceRepository')
  private readonly invoiceRepository: IInvoiceRepository,
) {}
```

**Use Cases:**
- Repository pattern (interface → implementation)
- Global guards/interceptors (`APP_GUARD`, `APP_INTERCEPTOR`)
- Swappable implementations (testing, feature flags)

#### 2. useFactory (Async Configuration)

```typescript
providers: [
  {
    provide: 'KAFKA_SERVICE',
    useFactory: async (configService: ConfigService) => {
      const brokers = configService.get('KAFKA_BROKERS').split(',');
      return new Kafka({ brokers });
    },
    inject: [ConfigService],
  },
  {
    provide: 'EVENTSTORE_CLIENT',
    useFactory: async (configService: ConfigService) => {
      const connectionString = configService.get('EVENTSTORE_CONNECTION_STRING');
      return EventStoreDBClient.connectionString(connectionString);
    },
    inject: [ConfigService],
  },
]
```

**Use Cases:**
- External service clients (Kafka, EventStore, Redis)
- Async initialization (database connections, API clients)
- Complex object construction with dependencies

#### 3. useValue (Static Values/Mocks)

```typescript
// Production: Feature flags
providers: [
  {
    provide: 'FEATURE_FLAGS',
    useValue: {
      newInvoiceFlow: true,
      legacyPayments: false,
    },
  },
]

// Testing: Mocks
providers: [
  {
    provide: MasterDataClient,
    useValue: {
      getVendor: jest.fn().mockResolvedValue({ id: 'vendor-1' }),
      getCustomer: jest.fn().mockResolvedValue({ id: 'customer-1' }),
    },
  },
]
```

**Use Cases:**
- Testing (mock services)
- Feature flags
- Static configuration objects

---

### Global Providers via APP_* Tokens

```typescript
@Module({
  providers: [
    // Global guard (all routes protected by default)
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
- No `@UseGuards()` boilerplate on every route
- Centralized request processing
- Opt-out via decorators (`@Public()` to skip auth)

---

## Custom Decorators

### Metadata Decorators (for Guards)

```typescript
// Definition
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Usage in resolver/controller
@Mutation(() => InvoiceDto)
@Permissions('invoice:create')
async createInvoice() { ... }

@Query(() => HealthDto)
@Public()
async healthCheck() { ... }

// Consumption in guard
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Deny-by-default if no permissions declared
    if (!requiredPermissions) {
      throw new ForbiddenException('Endpoint permissions not configured');
    }

    const user = this.getUser(context);
    return this.checkPermissions(user, requiredPermissions);
  }
}
```

**Key Patterns:**
- **SetMetadata**: Attach metadata to methods/classes
- **Reflector.getAllAndOverride**: Read metadata in guards/interceptors
- **Method + Class Merging**: Method-level metadata overrides class-level

---

### Parameter Decorators (Context Extraction)

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): CurrentUserContext => {
    const type = context.getType();

    if (type === 'http') {
      // REST API
      return context.switchToHttp().getRequest().user;
    } else {
      // GraphQL
      const ctx = GqlExecutionContext.create(context);
      return ctx.getContext().req.user;
    }
  },
);

// Usage
@Mutation(() => InvoiceDto)
async createInvoice(
  @Args('input') input: CreateInvoiceInput,
  @CurrentUser() user: CurrentUserContext,
) {
  return this.commandBus.execute(
    new CreateInvoiceCommand(input, user.tenantId, user.userId)
  );
}
```

**Multi-Context Pattern:**
- Handle both HTTP and GraphQL requests
- Type-safe user context interface
- Simplifies resolver/controller signatures

---

## Guards and Interceptors

### Multi-Context Authentication Guard

```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check @Public() metadata (opt-out)
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;

    // 2. Allow GraphQL introspection (Apollo Sandbox)
    if (this.isGraphQLIntrospection(context)) {
      return true;
    }

    // 3. Extract token from HTTP or GraphQL request
    const request = this.getRequest(context);
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    // 4. Validate token with auth service
    const user = await this.validateToken(token);

    // 5. Validate tenant isolation (CRITICAL for multi-tenancy)
    const headerTenantId = request.headers['x-tenant-id'];
    const jwtTenantId = user.tenantId;

    if (headerTenantId && headerTenantId !== jwtTenantId) {
      throw new UnauthorizedException('Tenant ID mismatch');
    }

    // 6. Attach user to request (for downstream decorators/guards)
    request.user = {
      ...user,
      userId: user.id,
      tenantId: jwtTenantId,
    };
    request.tenantId = jwtTenantId; // Override header with JWT (trusted)

    return true;
  }

  private getRequest(context: ExecutionContext) {
    return context.getType() === 'http'
      ? context.switchToHttp().getRequest()
      : GqlExecutionContext.create(context).getContext().req;
  }

  private isGraphQLIntrospection(context: ExecutionContext): boolean {
    if (context.getType() !== 'graphql') return false;

    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();
    return info?.fieldName === '__schema' || info?.fieldName === '__type';
  }

  private async validateToken(token: string): Promise<UserPayload> {
    // Call auth service via HTTP or local validation
    const response = await this.httpService
      .get(`${this.authServiceUrl}/auth/validate`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .toPromise();

    return response.data;
  }
}
```

**Key Patterns:**
- **Context Abstraction**: Single guard for HTTP + GraphQL
- **Metadata-Driven Bypass**: `@Public()` decorator
- **Introspection Allowance**: Schema queries bypass auth
- **Tenant Isolation Security**: Validate header matches JWT
- **Request Augmentation**: Attach user, tenantId for downstream use

---

### RBAC Permission Guard

```typescript
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Get required permissions from @Permissions metadata
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 2. Deny-by-default: Require explicit permissions
    if (!requiredPermissions || requiredPermissions.length === 0) {
      throw new ForbiddenException('Endpoint permissions not configured');
    }

    // 3. Extract user (set by JwtAuthGuard)
    const request = this.getRequest(context);
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // 4. Extract user permissions
    const userPermissions = this.getUserPermissions(user);

    // 5. Check all required permissions
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`
      );
    }

    return true;
  }

  private getUserPermissions(user: any): string[] {
    // 1. Direct permissions
    if (user.permissions?.length > 0) {
      return user.permissions;
    }

    // 2. Role-based permissions
    const rolePermissions = this.getRolePermissions(user.role || user.roles?.[0]);

    // 3. Wildcard expansion (invoice:* → invoice:create, invoice:read, etc.)
    return this.expandWildcards(rolePermissions);
  }

  private getRolePermissions(role: string): string[] {
    const roleMap: Record<string, string[]> = {
      finance_admin: ['invoice:*', 'payment:*', 'account:*'],
      finance_manager: ['invoice:create', 'invoice:read', 'invoice:update', 'payment:*'],
      finance_viewer: ['invoice:read', 'payment:read', 'account:read'],
    };

    return roleMap[role] || [];
  }
}
```

**Guard Chaining Pattern:**
```typescript
@Mutation(() => InvoiceDto)
@UseGuards(JwtAuthGuard, RbacGuard) // JwtAuthGuard runs first
@Permissions('invoice:create')
async createInvoice() { ... }
```

**Execution Order:**
1. `JwtAuthGuard` → Validates JWT, attaches `user`
2. `RbacGuard` → Reads `@Permissions`, checks `user.permissions`

---

### Context Propagation Interceptor

```typescript
import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';

@Injectable()
export class ContextPropagationInterceptor implements NestInterceptor {
  private readonly tracer = trace.getTracer('finance-service');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = this.getRequest(context);
    const response = this.getResponse(context);

    // 1. Extract trace context from incoming headers (W3C Trace Context)
    const extractedContext = propagation.extract(ROOT_CONTEXT, request.headers);

    // 2. Start span with extracted context as parent
    const span = this.tracer.startSpan(
      `${request.method} ${request.route?.path || 'GraphQL'}`,
      {
        kind: SpanKind.SERVER,
        attributes: {
          'http.method': request.method,
          'http.url': request.url,
          'tenant.id': request.tenantId,
          'user.id': request.userId,
        },
      },
      extractedContext,
    );

    // 3. Inject trace context into response headers
    const spanContext = span.spanContext();
    response.setHeader(
      'traceparent',
      `00-${spanContext.traceId}-${spanContext.spanId}-01`
    );

    // 4. Attach span to request for manual instrumentation
    request.span = span;

    // 5. Execute request with active context
    return trace.with(trace.setSpan(extractedContext, span), () => {
      return next.handle().pipe(
        tap({
          next: () => span.setStatus({ code: SpanStatusCode.OK }),
          error: (error) => {
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
          },
          complete: () => span.end(),
        }),
      );
    });
  }

  private getRequest(context: ExecutionContext) {
    return context.getType() === 'http'
      ? context.switchToHttp().getRequest()
      : GqlExecutionContext.create(context).getContext().req;
  }
}
```

**Key Patterns:**
- **W3C Trace Context**: Extract/inject `traceparent` header
- **OpenTelemetry Integration**: Distributed tracing spans
- **RxJS Tap Operator**: Handle success/error/complete lifecycle
- **Request Augmentation**: Attach `span` for manual instrumentation

---

## Request Lifecycle

**Complete Request Flow:**
```
1. Middleware (TenantMiddleware)
   └─ Extracts tenantId from headers

2. Global Interceptor (ContextPropagationInterceptor - before)
   └─ Extracts trace context, starts span

3. Global Guard (JwtAuthGuard via APP_GUARD)
   └─ Validates JWT, attaches user

4. Route Guard (RbacGuard via @UseGuards)
   └─ Checks permissions

5. Parameter Decorators (@CurrentUser, @Args)
   └─ Extract data from request

6. Handler Execution (Resolver/Controller method)
   └─ Business logic

7. Global Interceptor (ContextPropagationInterceptor - after)
   └─ Sets span status, ends span

8. Exception Filter (AllExceptionsFilter)
   └─ Catches unhandled exceptions
```

---

## NestJS Testing Patterns

### Integration Test Setup

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

describe('Invoice Integration Tests', () => {
  let app: INestApplication;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: '.env.test' }),
        CqrsModule,
        TypeOrmModule.forRootAsync({
          useFactory: () => ({
            type: 'postgres',
            database: 'finance_test',
            synchronize: true,  // Only for testing
            dropSchema: true,   // Clean slate each run
          }),
        }),
      ],
      providers: [
        CreateInvoiceHandler,
        GetInvoiceHandler,
        { provide: 'IInvoiceRepository', useClass: InvoiceEventStoreRepository },
      ],
    })
    .overrideProvider(MasterDataClient)
    .useValue({
      getVendor: jest.fn().mockResolvedValue({ id: 'vendor-1' }),
    })
    .overrideProvider(EventStoreDBClient)
    .useValue({
      appendToStream: jest.fn(),
      readStream: jest.fn(),
    })
    .compile();

    app = module.createNestApplication();

    // Apply global middleware/pipes
    app.useGlobalPipes(new ValidationPipe());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });
});
```

**Key Patterns:**
- **Test Database**: Separate config, `synchronize: true`, `dropSchema: true`
- **Mock External Services**: `overrideProvider().useValue()`
- **Real Internal Services**: Use actual CQRS handlers, repositories
- **Global Middleware**: Apply same pipes/filters as production

---

## Best Practices Checklist

**Module Organization:**
- [ ] Use `@Global()` only for infrastructure (EventStore, Kafka, RBAC)
- [ ] Use `forRootAsync` for dynamic configuration with DI
- [ ] Group CQRS handlers in feature modules
- [ ] Export only public API (repositories, resolvers)

**Dependency Injection:**
- [ ] Use string tokens for interface-based repositories
- [ ] Use `useFactory` for async initialization
- [ ] Use `useValue` for testing mocks
- [ ] Use `APP_GUARD` for global authentication

**Guards:**
- [ ] Chain guards: JwtAuthGuard → RbacGuard
- [ ] Use `@Public()` for opt-out authentication
- [ ] Validate tenant ID matches JWT (multi-tenancy security)
- [ ] Deny-by-default RBAC (require explicit `@Permissions()`)

**Custom Decorators:**
- [ ] Use `createParamDecorator` for context extraction
- [ ] Support both HTTP and GraphQL contexts
- [ ] Use `SetMetadata` for guard configuration
- [ ] Use `Reflector` to read metadata in guards

**Testing:**
- [ ] Use `Test.createTestingModule()` for DI
- [ ] Mock external services with `overrideProvider().useValue()`
- [ ] Use real database with testcontainers
- [ ] Apply global pipes/filters in tests

---

## Resources

- `dependency-injection.md` - Comprehensive DI patterns (useClass, useFactory, useValue)
- `module-patterns.md` - Module organization strategies (Global, forRoot, feature modules)
- `testing-nestjs.md` - Testing module setup, mocking, integration tests

---

**Version**: 1.0.0
**Status**: Production-Ready
**Evidence**: 25+ module files, guards, interceptors, decorators across finance/auth services
