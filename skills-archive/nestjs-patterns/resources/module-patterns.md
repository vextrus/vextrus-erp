# Module Organization Patterns

**Purpose**: Comprehensive guide to NestJS module organization, dynamic modules, and architectural patterns for Vextrus ERP microservices.

---

## Overview

**Module**: A class annotated with `@Module()` decorator that organizes related components (controllers, providers, imports, exports).

**Module Types**:
- **Feature Modules**: Domain-specific logic (InvoiceModule, PaymentModule)
- **Infrastructure Modules**: Cross-cutting services (EventStoreModule, KafkaModule)
- **Dynamic Modules**: Configurable modules (ConfigModule, TypeOrmModule)
- **Global Modules**: Available everywhere without import (@Global decorator)

---

## Module Organization Strategy

### 1. Feature Modules (Domain Logic)

**Pattern: CQRS Feature Module**

```typescript
// services/finance/src/presentation/graphql/finance-graphql.module.ts
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([InvoiceProjection, PaymentProjection]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 3,
    }),
  ],
  providers: [
    // GraphQL Resolvers
    InvoiceResolver,
    PaymentResolver,
    ChartOfAccountResolver,
    JournalEntryResolver,

    // Command Handlers (auto-registered via @CommandHandler)
    CreateInvoiceHandler,
    ApproveInvoiceHandler,
    VoidInvoiceHandler,
    ProcessPaymentHandler,

    // Query Handlers (auto-registered via @QueryHandler)
    GetInvoiceHandler,
    GetInvoicesHandler,
    GetInvoiceByNumberHandler,
    GetPaymentHandler,

    // Event Handlers (bulk registration)
    ...INVOICE_EVENT_HANDLERS,
    ...PAYMENT_EVENT_HANDLERS,

    // Repositories (interface-based DI)
    {
      provide: 'IInvoiceRepository',
      useClass: InvoiceEventStoreRepository,
    },
    {
      provide: 'IPaymentRepository',
      useClass: PaymentEventStoreRepository,
    },
    {
      provide: 'IJournalRepository',
      useClass: JournalEventStoreRepository,
    },
    {
      provide: 'IChartOfAccountRepository',
      useClass: ChartOfAccountEventStoreRepository,
    },

    // Domain Services
    InvoiceCalculationService,
    VATCalculationService,
    PaymentReconciliationService,

    // External Clients
    MasterDataClient,
  ],
  exports: [
    // Repositories (for other modules)
    'IInvoiceRepository',
    'IPaymentRepository',

    // Resolvers (for testing)
    InvoiceResolver,
    PaymentResolver,
  ],
})
export class FinanceGraphQLModule {}
```

**Key Principles**:
- **Single Responsibility**: One module per bounded context (Invoice, Payment, Journal)
- **CQRS**: Separate command/query handlers with auto-registration
- **Interface-Based Repositories**: String tokens (`'IInvoiceRepository'`) for easy testing
- **Bulk Registration**: Spread operator for event handlers (`...INVOICE_EVENT_HANDLERS`)
- **Selective Exports**: Only export public API (repositories, resolvers)

**Benefits**:
- Clear domain boundaries
- Easy to test (mock repositories via DI)
- Auto-registration of CQRS handlers (no manual `CommandBus.register()`)
- Scalable (add handlers without modifying module)

---

### 2. Infrastructure Modules (Cross-Cutting)

**Pattern: Global Infrastructure Module**

```typescript
// services/finance/src/infrastructure/event-store/event-store.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventStoreService } from './event-store.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'EVENTSTORE_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const { EventStoreDBClient } = await import('@eventstore/db-client');
        const connectionString = configService.get<string>(
          'EVENTSTORE_CONNECTION_STRING',
          'esdb://localhost:2113?tls=false',
        );
        return EventStoreDBClient.connectionString(connectionString);
      },
      inject: [ConfigService],
    },
    EventStoreService,
  ],
  exports: [EventStoreService, 'EVENTSTORE_CLIENT'],
})
export class EventStoreModule {}
```

**When to Use @Global():**
- Infrastructure services needed by 80%+ of modules (EventStore, Kafka, Redis)
- Cross-cutting concerns (Telemetry, RBAC, Logging)
- Services with NO domain logic (pure infrastructure)

**Anti-Patterns:**
- ❌ Making feature modules global (tight coupling)
- ❌ Using @Global for services only used by 1-2 modules
- ❌ Exporting everything (expose only necessary services)

**Benefits:**
- No need to import in every module
- Single initialization point
- Reduced boilerplate
- Clear separation of infrastructure vs domain

---

### 3. Dynamic Modules (Configurable)

**Pattern: forRoot/forRootAsync**

Dynamic modules allow runtime configuration and deferred initialization.

#### Static Configuration (forRoot)

```typescript
// Simple configuration (no dependency injection needed)
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3014),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
      }),
    }),
  ],
})
export class AppModule {}
```

**When to Use forRoot:**
- Configuration is hardcoded or environment-based
- No dependency injection needed
- Simple, static setup

---

#### Async Configuration (forRootAsync + useFactory)

```typescript
// services/finance/src/app.module.ts
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // NEVER true in production
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),

    GraphQLModule.forRootAsync({
      driver: ApolloFederationDriver,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        typePaths: ['./**/*.graphql'],
        context: ({ req }) => ({ req }),
        playground: configService.get('NODE_ENV') === 'development',
        introspection: configService.get('NODE_ENV') !== 'production',
        formatError: (error) => {
          // Sanitize errors in production
          if (configService.get('NODE_ENV') === 'production') {
            return {
              message: error.message,
              code: error.extensions?.code,
            };
          }
          return error;
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

**When to Use forRootAsync + useFactory:**
- Configuration needs dependency injection (ConfigService, other services)
- Async initialization (database connections, API clients)
- Environment-specific configuration
- Complex object construction

**Benefits:**
- Deferred initialization (wait for ConfigService)
- Dependency injection into configuration
- Testable (override factory in tests)
- Type-safe configuration

---

#### Async Configuration (forRootAsync + useClass)

```typescript
// Custom configuration provider
@Injectable()
export class GraphQLFederationConfig implements GqlOptionsFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  createGqlOptions(): GqlModuleOptions {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    this.logger.log(
      `Initializing GraphQL Federation (production: ${isProduction})`,
    );

    return {
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
        path: './schema.graphql',
      },
      context: ({ req }) => {
        // Extract tenant ID from headers
        const tenantId = req.headers['x-tenant-id'];
        const userId = req.headers['x-user-id'];
        return { tenantId, userId, req };
      },
      playground: !isProduction,
      introspection: !isProduction,
      formatError: (error) => {
        if (isProduction) {
          // Don't expose internal errors in production
          this.logger.error(`GraphQL Error: ${error.message}`, error.stack);
          return {
            message: error.message,
            code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
          };
        }
        return error;
      },
      plugins: [
        ApolloServerPluginLandingPageLocalDefault({ embed: true }),
      ],
    };
  }
}

// Module
@Module({
  imports: [
    GraphQLModule.forRootAsync({
      driver: ApolloFederationDriver,
      imports: [ConfigModule],
      useClass: GraphQLFederationConfig,
    }),
  ],
})
export class AppModule {}
```

**When to Use forRootAsync + useClass:**
- Complex configuration logic (>20 lines)
- Reusable configuration across environments
- Configuration needs logging, validation, or error handling
- Better testability (mock configuration provider)

**Benefits:**
- Encapsulates complex logic in dedicated class
- Easy to unit test (test configuration provider separately)
- Reusable across modules
- Clear separation of concerns

---

### 4. Module Exports Pattern

**Selective Exports (Best Practice)**

```typescript
@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([InvoiceProjection])],
  providers: [
    InvoiceResolver,
    CreateInvoiceHandler,
    GetInvoiceHandler,
    {
      provide: 'IInvoiceRepository',
      useClass: InvoiceEventStoreRepository,
    },
    InvoiceCalculationService, // Internal service
    VATCalculationService,     // Internal service
  ],
  exports: [
    // Export only public API
    'IInvoiceRepository',
    InvoiceResolver,
    // DO NOT export internal services (InvoiceCalculationService)
  ],
})
export class InvoiceModule {}
```

**Principles:**
- **Export Only Public API**: Repositories, resolvers, public services
- **Hide Internal Services**: Calculation services, validators, helpers
- **Interface-Based**: Export string tokens, not concrete classes
- **Minimize Surface Area**: Fewer exports = better encapsulation

**Anti-Patterns:**
- ❌ Exporting all providers (exposes internal details)
- ❌ Exporting concrete classes instead of interfaces
- ❌ Circular exports (Module A exports B, B exports A)

---

## Advanced Patterns

### 5. Circular Dependency Resolution

**Problem: Circular Dependency**

```typescript
// invoice.module.ts
@Module({
  imports: [PaymentModule], // PaymentModule imports InvoiceModule
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}

// payment.module.ts
@Module({
  imports: [InvoiceModule], // Circular dependency!
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
```

**Solution 1: forwardRef (Module-Level)**

```typescript
// invoice.module.ts
@Module({
  imports: [forwardRef(() => PaymentModule)],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}

// payment.module.ts
@Module({
  imports: [forwardRef(() => InvoiceModule)],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
```

**Solution 2: forwardRef (Injection-Level)**

```typescript
// invoice.service.ts
@Injectable()
export class InvoiceService {
  constructor(
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
  ) {}
}

// payment.service.ts
@Injectable()
export class PaymentService {
  constructor(
    @Inject(forwardRef(() => InvoiceService))
    private readonly invoiceService: InvoiceService,
  ) {}
}
```

**Solution 3: Event-Based Decoupling (Best Practice)**

```typescript
// invoice.service.ts
@Injectable()
export class InvoiceService {
  constructor(private readonly eventBus: EventBus) {}

  async approveInvoice(invoiceId: string) {
    // Approve invoice
    this.eventBus.publish(new InvoiceApprovedEvent(invoiceId));
  }
}

// payment.service.ts
@Injectable()
export class PaymentService {
  @EventsHandler(InvoiceApprovedEvent)
  async handleInvoiceApproved(event: InvoiceApprovedEvent) {
    // Create payment when invoice approved
  }
}
```

**Recommendation:**
1. **Prefer Event-Based**: Eliminates circular dependencies entirely
2. **Use forwardRef Sparingly**: Only when event-based isn't feasible
3. **Refactor**: Consider creating a shared module for common dependencies

---

### 6. Shared Module Pattern

**Problem: Multiple Modules Need Same Service**

```typescript
// ❌ Anti-Pattern: Duplicate providers
@Module({
  providers: [MasterDataClient, VATCalculationService],
})
export class InvoiceModule {}

@Module({
  providers: [MasterDataClient, VATCalculationService],
})
export class PaymentModule {}
```

**Solution: Shared Module**

```typescript
// shared.module.ts
@Module({
  imports: [HttpModule],
  providers: [
    MasterDataClient,
    VATCalculationService,
  ],
  exports: [
    MasterDataClient,
    VATCalculationService,
  ],
})
export class SharedModule {}

// Feature modules
@Module({
  imports: [SharedModule],
  providers: [InvoiceService],
})
export class InvoiceModule {}

@Module({
  imports: [SharedModule],
  providers: [PaymentService],
})
export class PaymentModule {}
```

**Benefits:**
- Single source of truth (service created once)
- Easier to test (mock SharedModule)
- Reduced boilerplate
- Clear dependencies

---

### 7. Multi-Context Module (HTTP + GraphQL)

**Pattern: Support Both HTTP and GraphQL**

```typescript
// invoice.module.ts
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([InvoiceProjection]),
  ],
  controllers: [InvoiceController], // HTTP API
  providers: [
    InvoiceResolver, // GraphQL API
    CreateInvoiceHandler,
    GetInvoiceHandler,
    {
      provide: 'IInvoiceRepository',
      useClass: InvoiceEventStoreRepository,
    },
  ],
  exports: ['IInvoiceRepository'],
})
export class InvoiceModule {}
```

**Evidence from Codebase:**
- `services/auth/src/auth.module.ts`: Both AuthController (HTTP) and AuthResolver (GraphQL)
- `services/master-data/src/vendor/vendor.module.ts`: VendorController + VendorResolver

**Benefits:**
- Unified module for both contexts
- Shared CQRS handlers
- Single repository instance
- DRY (Don't Repeat Yourself)

---

## Testing Patterns

### 8. Testing Feature Modules

```typescript
// invoice.module.spec.ts
describe('InvoiceModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        CqrsModule,
        TypeOrmModule.forRoot({ ... }), // Test database
      ],
      providers: [
        CreateInvoiceHandler,
        GetInvoiceHandler,
        {
          provide: 'IInvoiceRepository',
          useValue: {
            save: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();
  });

  it('should create invoice handler', () => {
    const handler = module.get<CreateInvoiceHandler>(CreateInvoiceHandler);
    expect(handler).toBeDefined();
  });

  it('should inject mocked repository', () => {
    const repository = module.get('IInvoiceRepository');
    expect(repository.save).toBeDefined();
  });
});
```

---

### 9. Testing Dynamic Modules

```typescript
// app.module.spec.ts (forRootAsync testing)
describe('AppModule (TypeORM)', () => {
  it('should configure TypeORM with test database', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              DB_HOST: 'localhost',
              DB_PORT: 5433, // Test database
              DB_NAME: 'test_db',
            }),
          ],
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST'),
            port: configService.get('DB_PORT'),
            database: configService.get('DB_NAME'),
            synchronize: true, // OK in tests
          }),
          inject: [ConfigService],
        }),
      ],
    }).compile();

    const connection = module.get(Connection);
    expect(connection.isConnected).toBe(true);
  });
});
```

---

## Evidence from Vextrus ERP Codebase

### Finance Service Modules

**File**: `services/finance/src/app.module.ts`

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Critical: NEVER true in production
        migrations: ['dist/infrastructure/persistence/typeorm/migrations/*.js'],
      }),
      inject: [ConfigService],
    }),
    GraphQLModule.forRootAsync({
      driver: ApolloFederationDriver,
      imports: [ConfigModule],
      useClass: GraphQLFederationConfig,
    }),
    EventStoreModule, // @Global module
    TelemetryModule,  // @Global module
    FinanceGraphQLModule,
  ],
})
export class AppModule {}
```

**Key Observations:**
- ✅ ConfigModule.forRoot with `isGlobal: true`
- ✅ TypeOrmModule.forRootAsync with `synchronize: false` (production-safe)
- ✅ GraphQLModule with custom configuration class
- ✅ Global infrastructure modules (EventStore, Telemetry)
- ✅ Single feature module (FinanceGraphQLModule)

---

### Auth Service Modules

**File**: `services/auth/src/auth.module.ts`

```typescript
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '1h'),
          issuer: 'vextrus-auth-service',
        },
      }),
      inject: [ConfigService],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([User, RefreshToken]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthResolver,
    JwtStrategy,
    LocalStrategy,
    {
      provide: 'IUserRepository',
      useClass: UserTypeOrmRepository,
    },
  ],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
```

**Key Observations:**
- ✅ JwtModule.registerAsync with ConfigService
- ✅ Both controller (HTTP) and resolver (GraphQL)
- ✅ Interface-based repository (`'IUserRepository'`)
- ✅ Passport strategies as providers
- ✅ Selective exports (AuthService, JwtStrategy)

---

## Best Practices Summary

1. **Feature Modules**: One module per bounded context, CQRS handlers, selective exports
2. **Infrastructure Modules**: @Global for cross-cutting services (80%+ usage)
3. **Dynamic Modules**: Use forRootAsync for dependency injection
4. **Avoid Circular Dependencies**: Prefer event-based decoupling
5. **Shared Modules**: Extract common providers to shared module
6. **Testing**: Mock providers with `useValue`, override configuration in tests
7. **Production Safety**: `synchronize: false`, sanitize errors, SSL in production

---

## Anti-Patterns to Avoid

- ❌ **Making feature modules global** (tight coupling)
- ❌ **Exporting all providers** (breaks encapsulation)
- ❌ **Circular dependencies without forwardRef** (runtime errors)
- ❌ **synchronize: true in production** (data loss risk)
- ❌ **Hardcoded configuration** (use ConfigService)
- ❌ **No selective exports** (exposes internal details)
- ❌ **Importing concrete classes** (hard to test)

---

## Further Reading

- **NestJS Docs**: https://docs.nestjs.com/modules
- **CQRS Pattern**: sessions/knowledge/vextrus-erp/patterns/event-sourcing-patterns.md
- **Dependency Injection**: .claude/skills/nestjs-patterns/resources/dependency-injection.md
- **Testing NestJS**: .claude/skills/nestjs-patterns/resources/testing-nestjs.md
