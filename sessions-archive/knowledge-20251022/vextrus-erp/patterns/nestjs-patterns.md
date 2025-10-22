# NestJS Patterns - Quick Reference

**Auto-loaded by**: `nestjs-patterns` skill

---

## Module Organization Decision Tree

```
Need everywhere (80%+)? → @Global() module
Configuration needed? → forRootAsync
Domain logic? → Feature module (CQRS)
Shared services? → Shared module
Circular dependency? → Event-based decoupling
```

---

## Module Types

### Feature Module (CQRS)

```typescript
@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([InvoiceProjection])],
  providers: [
    InvoiceResolver,
    CreateInvoiceHandler,
    GetInvoiceHandler,
    ...INVOICE_EVENT_HANDLERS,
    {
      provide: 'IInvoiceRepository',
      useClass: InvoiceEventStoreRepository,
    },
  ],
  exports: ['IInvoiceRepository', InvoiceResolver],
})
export class InvoiceModule {}
```

### Global Infrastructure Module

```typescript
@Global()
@Module({
  imports: [ConfigModule],
  providers: [EventStoreService],
  exports: [EventStoreService],
})
export class EventStoreModule {}
```

### Dynamic Module (forRootAsync)

```typescript
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        synchronize: false, // NEVER true in production
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

---

## Dependency Injection Patterns

### useClass (Interface Implementation)

```typescript
providers: [
  {
    provide: 'IInvoiceRepository',
    useClass: InvoiceEventStoreRepository,
  },
]

constructor(
  @Inject('IInvoiceRepository')
  private readonly repository: IInvoiceRepository,
) {}
```

### useFactory (Async Configuration)

```typescript
providers: [
  {
    provide: 'EVENTSTORE_CLIENT',
    useFactory: async (config: ConfigService) => {
      const connectionString = config.get('EVENTSTORE_CONNECTION_STRING');
      return EventStoreDBClient.connectionString(connectionString);
    },
    inject: [ConfigService],
  },
]
```

### useValue (Mocks/Static Values)

```typescript
// Testing: Mock services
providers: [
  {
    provide: MasterDataClient,
    useValue: {
      getVendor: jest.fn().mockResolvedValue({ id: 'vendor-1' }),
    },
  },
]

// Production: Feature flags
providers: [
  {
    provide: 'FEATURE_FLAGS',
    useValue: { newInvoiceFlow: true },
  },
]
```

---

## Testing Patterns

### Testing Module Setup

```typescript
const module = await Test.createTestingModule({
  providers: [
    InvoiceService,
    {
      provide: 'IInvoiceRepository',
      useValue: {
        save: jest.fn(),
        findById: jest.fn(),
      },
    },
  ],
}).compile();

const service = module.get<InvoiceService>(InvoiceService);
```

### Testing Command Handlers

```typescript
it('should create invoice', async () => {
  repository.save.mockResolvedValue(undefined);
  masterDataClient.getVendor.mockResolvedValue({ id: 'vendor-1' });

  await handler.execute(new CreateInvoiceCommand({...}));

  expect(repository.save).toHaveBeenCalled();
  expect(eventBus.publishAll).toHaveBeenCalledWith(
    expect.arrayContaining([
      expect.objectContaining({ eventType: 'InvoiceCreatedEvent' }),
    ]),
  );
});
```

### Testing GraphQL Resolvers

```typescript
it('should fetch invoice', async () => {
  queryBus.execute.mockResolvedValue({
    id: 'invoice-1',
    status: InvoiceStatus.DRAFT,
  });

  const result = await resolver.invoice('invoice-1', { tenantId: 'tenant-1' });

  expect(queryBus.execute).toHaveBeenCalledWith(
    expect.objectContaining({
      invoiceId: 'invoice-1',
      tenantId: 'tenant-1',
    }),
  );
});
```

### Testing Guards

```typescript
const mockContext: ExecutionContext = {
  switchToHttp: () => ({
    getRequest: () => ({
      headers: { authorization: 'Bearer valid-token' },
      user: { sub: 'user-1', permissions: ['invoice:create'] },
    }),
  }),
  getHandler: jest.fn(),
  getClass: jest.fn(),
} as any;

const result = await guard.canActivate(mockContext);
expect(result).toBe(true);
```

---

## Circular Dependency Resolution

### Problem

```typescript
// invoice.module.ts
@Module({
  imports: [PaymentModule], // Circular!
})
export class InvoiceModule {}

// payment.module.ts
@Module({
  imports: [InvoiceModule], // Circular!
})
export class PaymentModule {}
```

### Solution 1: forwardRef

```typescript
@Module({
  imports: [forwardRef(() => PaymentModule)],
})
export class InvoiceModule {}
```

### Solution 2: Event-Based (Best Practice)

```typescript
// invoice.service.ts
async approveInvoice(invoiceId: string) {
  this.eventBus.publish(new InvoiceApprovedEvent(invoiceId));
}

// payment.service.ts
@EventsHandler(InvoiceApprovedEvent)
async handleInvoiceApproved(event: InvoiceApprovedEvent) {
  // Create payment when invoice approved
}
```

---

## Guard Patterns

### JWT Authentication Guard

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Skip auth for @Public() routes
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );
    if (isPublic) return true;

    return super.canActivate(context);
  }
}
```

### RBAC Guard

```typescript
@Injectable()
export class RBACGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredPermissions.every((permission) =>
      user.permissions.includes(permission),
    );
  }
}
```

---

## Interceptor Patterns

### Tenant Context Interceptor

```typescript
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];

    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    request['tenantId'] = tenantId;
    return next.handle();
  }
}
```

### Logging Interceptor

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.log(`${request.method} ${request.url} - ${duration}ms`);
      }),
    );
  }
}
```

---

## NestJS Module Checklist

**Feature Module:**
- [ ] Single responsibility (one bounded context)
- [ ] CQRS handlers with auto-registration
- [ ] Interface-based repositories (`'IRepository'`)
- [ ] Selective exports (only public API)
- [ ] No circular dependencies

**Infrastructure Module:**
- [ ] @Global() only if used by 80%+ modules
- [ ] Async initialization with forRootAsync
- [ ] Export only necessary services
- [ ] Configuration via ConfigService
- [ ] Production-safe settings (synchronize: false)

**Testing:**
- [ ] Use `Test.createTestingModule()`
- [ ] Mock dependencies with `useValue`
- [ ] Test both success and error cases
- [ ] Clear mocks between tests (`jest.clearAllMocks()`)
- [ ] Follow AAA pattern (Arrange-Act-Assert)

---

## Common Anti-Patterns

- ❌ **Making feature modules global** (tight coupling)
- ❌ **Exporting all providers** (breaks encapsulation)
- ❌ **synchronize: true in production** (data loss risk)
- ❌ **Circular dependencies without forwardRef** (runtime errors)
- ❌ **Hardcoded configuration** (use ConfigService)
- ❌ **No mocking in tests** (slow, brittle tests)
- ❌ **Testing implementation details** (test behavior, not internals)

---

## Best Practices

1. **One Module Per Bounded Context**: InvoiceModule, PaymentModule (not FinanceModule)
2. **Interface-Based DI**: String tokens for repositories (`'IInvoiceRepository'`)
3. **CQRS Auto-Registration**: Use `@CommandHandler`, `@QueryHandler` decorators
4. **Selective Exports**: Only export public API (repositories, resolvers)
5. **Event-Based Decoupling**: Use EventBus instead of circular dependencies
6. **Configuration via DI**: Use ConfigService with forRootAsync
7. **Production Safety**: synchronize: false, sanitize errors, SSL
8. **Testing**: Mock external services, test isolation, clear naming

---

## Evidence from Vextrus ERP

**Finance Service** (`services/finance/src/app.module.ts`):
- ✅ ConfigModule.forRoot with `isGlobal: true`
- ✅ TypeOrmModule.forRootAsync with `synchronize: false`
- ✅ GraphQLModule with custom configuration class
- ✅ Global infrastructure modules (EventStore, Telemetry)
- ✅ Single feature module (FinanceGraphQLModule)

**Auth Service** (`services/auth/src/auth.module.ts`):
- ✅ JwtModule.registerAsync with ConfigService
- ✅ Both AuthController (HTTP) and AuthResolver (GraphQL)
- ✅ Interface-based repository (`'IUserRepository'`)
- ✅ Passport strategies as providers
- ✅ Selective exports (AuthService, JwtStrategy)

---

**See Also**:
- `.claude/skills/nestjs-patterns/SKILL.md` - Complete NestJS patterns guide
- `.claude/skills/nestjs-patterns/resources/dependency-injection.md` - DI patterns in depth
- `.claude/skills/nestjs-patterns/resources/module-patterns.md` - Module organization guide
- `.claude/skills/nestjs-patterns/resources/testing-nestjs.md` - Testing best practices
- `.claude/skills/integration-testing/SKILL.md` - Integration testing patterns
