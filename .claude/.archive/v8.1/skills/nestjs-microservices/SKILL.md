---
name: nestjs-microservices
description: NestJS microservices patterns with DDD layered architecture and multi-tenancy. Use when working with NestJS modules, dependency injection, CQRS implementations, multi-tenant applications, microservice architecture, @Module decorators, @Injectable services, guards, interceptors, or NestJS configuration.
---

# NestJS Microservices (Quick Reference)

## Module Organization

**Feature-Based Structure**:
```
services/invoice-service/src/
├── domain/          # Business logic
├── application/     # Use cases (commands/queries)
├── presentation/    # GraphQL/REST/gRPC
├── infrastructure/  # Repositories, messaging
├── shared/          # Cross-cutting concerns
└── config/          # Configuration
```

**Layer Dependencies**: presentation → application → domain

---

## Dependency Injection

**Module Definition**:
```typescript
@Module({
  imports: [OtherModule],
  providers: [MyService],
  exports: [MyService]
})
export class MyModule {}
```

**Injectable Service**:
```typescript
@Injectable()
export class MyService {
  constructor(private readonly dependency: Dependency) {}
}
```

**Scope**: Default is SINGLETON, use REQUEST for multi-tenancy

---

## CQRS Implementation

**Command Handler**:
```typescript
@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler {
  async execute(command: CreateInvoiceCommand) {
    // Handle command
  }
}
```

**Query Handler**:
```typescript
@QueryHandler(GetInvoiceQuery)
export class GetInvoiceHandler {
  async execute(query: GetInvoiceQuery) {
    // Handle query
  }
}
```

**Event Handler**:
```typescript
@EventsHandler(InvoiceCreatedEvent)
export class InvoiceCreatedHandler {
  async handle(event: InvoiceCreatedEvent) {
    // Handle event
  }
}
```

---

## Multi-Tenancy (5 Layers)

**Layers**:
1. **Organization**: Top-level tenant
2. **Company**: Sub-organization
3. **Branch**: Physical location
4. **Department**: Functional unit
5. **User**: Individual access

**Implementation**:
```typescript
@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  constructor(@Inject(REQUEST) private request: any) {}

  getOrganizationId(): string {
    return this.request.user?.organizationId;
  }
}
```

**Repository Pattern**:
```typescript
async findAll(): Promise<Entity[]> {
  const orgId = this.tenantContext.getOrganizationId();
  return this.repository.find({ where: { organizationId: orgId } });
}
```

---

## GraphQL Integration

**Module Setup**:
```typescript
GraphQLModule.forRoot({
  driver: ApolloFederationDriver,
  autoSchemaFile: true
})
```

**Resolver with Guards**:
```typescript
@Resolver('Invoice')
@UseGuards(JwtAuthGuard, RbacGuard)
export class InvoiceResolver {
  @Query(() => Invoice)
  @RequirePermissions('invoice:read')
  async invoice(@Args('id') id: string) {
    return this.queryBus.execute(new GetInvoiceQuery(id));
  }
}
```

---

## Guards & Interceptors

**JWT Auth Guard**:
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**RBAC Guard**:
```typescript
@Injectable()
export class RbacGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Check permissions
  }
}
```

**Logging Interceptor**:
```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context, next) {
    return next.handle().pipe(tap(() => log()));
  }
}
```

---

## Event Bus

**Publish Event**:
```typescript
this.eventBus.publish(new InvoiceCreatedEvent(data));
```

**Subscribe to Event**:
```typescript
@EventsHandler(InvoiceCreatedEvent)
export class Handler implements IEventHandler<InvoiceCreatedEvent> {
  async handle(event: InvoiceCreatedEvent) {
    // Handle
  }
}
```

---

## Configuration

**Environment Config**:
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    })
  ]
})
```

**Type-Safe Config**:
```typescript
@Injectable()
export class AppConfig {
  @ConfigProperty()
  databaseUrl: string;
}
```

---

## Best Practices

**DO ✅**:
- Feature-based modules
- Dependency injection for all services
- CQRS for complex workflows
- Multi-tenancy isolation
- Guards for all endpoints
- Event-driven communication

**DON'T ❌**:
- Circular dependencies
- Direct database access in resolvers
- Skip authentication/authorization
- Mix layers (domain importing presentation)

---

## Quick Patterns

**Module**: @Module with imports/providers/exports
**Service**: @Injectable with constructor injection
**CQRS**: CommandHandler + QueryHandler + EventHandler
**Multi-Tenancy**: REQUEST scope + TenantContext
**Guards**: JwtAuthGuard + RbacGuard (MANDATORY)
**Events**: EventBus.publish + @EventsHandler

---

## Reference

- **Full Patterns**: `VEXTRUS-PATTERNS.md` sections 9-10
- **Examples**: See `services/*/src/` for implementations
- **Modules**: Feature-based organization

---

**Always follow NestJS + DDD + CQRS patterns for microservices.**
