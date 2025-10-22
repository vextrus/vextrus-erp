---
name: Error Handling & Observability
description: When implementing error handling, exception management, logging, or distributed tracing, activate this skill to enforce consistent error patterns and observability. Use when user says "error", "exception", "logging", "trace", "telemetry", "observability", "monitoring", or when working with try-catch blocks, custom exceptions, or OpenTelemetry integration.
knowledge_base:
  - sessions/knowledge/vextrus-erp/patterns/error-handling-observability-patterns.md
  - sessions/knowledge/vextrus-erp/checklists/quality-gates.md
---

# Error Handling & Observability Skill

## Purpose
Enforce **consistent error handling** and **distributed observability** patterns across Vextrus ERP's 19 microservices. Prevent silent failures, ensure proper error propagation, and enable end-to-end request tracing.

## Activation Triggers
- User says: "error", "exception", "logging", "trace", "telemetry", "observability", "monitoring"
- Working with: Try-catch blocks, custom exceptions, error boundaries
- Implementing: OpenTelemetry, structured logging, error tracking
- Debugging: Distributed tracing, correlation IDs, error investigation

## Auto-Loaded Patterns
This skill automatically loads:
- **Error handling patterns** from `sessions/knowledge/vextrus-erp/patterns/error-handling-observability-patterns.md`
- **OpenTelemetry integration guides**
- **Structured logging standards**
- **Quality gates checklist** (error handling section)

---

## Core Error Handling Patterns

### Pattern 1: Try-Catch with Context
**When to use**: All async operations, external calls, parsing operations

**Implementation**:
```typescript
try {
  const result = await externalService.call(data)
  return result
} catch (error) {
  this.logger.error('Failed to call external service', {
    error: error.message,
    stack: error.stack,
    context: {
      userId: user.id,
      tenantId: tenant.id,
      operation: 'externalService.call',
    },
  })
  throw new ServiceUnavailableException(
    'External service unavailable',
    error
  )
}
```

**Key Points**:
- Always log with context (user, tenant, operation)
- Include error message and stack trace
- Throw domain-specific exception (not generic Error)
- Preserve original error as cause

---

### Pattern 2: Custom Exception Hierarchy
**When to use**: Domain-specific error scenarios

**Implementation**:
```typescript
// Base domain exception
export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

// Specific exceptions
export class EntityNotFoundException extends DomainException {
  constructor(entityName: string, id: string, cause?: Error) {
    super(
      `${entityName} with id ${id} not found`,
      'ENTITY_NOT_FOUND',
      404,
      cause
    )
  }
}

export class ValidationException extends DomainException {
  constructor(message: string, cause?: Error) {
    super(message, 'VALIDATION_ERROR', 400, cause)
  }
}

export class ServiceUnavailableException extends DomainException {
  constructor(service: string, cause?: Error) {
    super(
      `Service ${service} is unavailable`,
      'SERVICE_UNAVAILABLE',
      503,
      cause
    )
  }
}
```

**Exception Categories**:
- **Client Errors** (400-499): ValidationException, UnauthorizedException, ForbiddenException
- **Server Errors** (500-599): ServiceUnavailableException, InternalServerException
- **Domain Errors**: BusinessRuleViolationException, EntityNotFoundException

---

### Pattern 3: GraphQL Error Handling
**When to use**: GraphQL resolvers (return errors, don't throw)

**Implementation**:
```typescript
@Mutation(() => InvoicePayload)
async createInvoice(
  @Args('input') input: CreateInvoiceInput
): Promise<InvoicePayload> {
  try {
    const invoice = await this.commandBus.execute(
      new CreateInvoiceCommand(input)
    )

    return {
      success: true,
      data: invoice,
      errors: [],
    }
  } catch (error) {
    this.logger.error('Failed to create invoice', {
      error: error.message,
      input,
    })

    return {
      success: false,
      data: null,
      errors: [
        {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
          field: error.field, // If validation error
        },
      ],
    }
  }
}
```

**Payload Structure**:
```typescript
@ObjectType()
export class InvoicePayload {
  @Field()
  success: boolean

  @Field(() => InvoiceDto, { nullable: true })
  data?: InvoiceDto

  @Field(() => [ErrorDetail])
  errors: ErrorDetail[]
}

@ObjectType()
export class ErrorDetail {
  @Field()
  code: string

  @Field()
  message: string

  @Field({ nullable: true })
  field?: string
}
```

**Benefits**:
- Clients always get valid response (not HTTP 500)
- Errors are part of GraphQL schema
- Partial success possible (multiple mutations)

---

## Observability Patterns

### Pattern 4: OpenTelemetry Distributed Tracing
**When to use**: All services, especially cross-service calls

**Setup** (see `resources/otel-integration-guide.md` for complete implementation):
```typescript
// 1. Module setup
OpenTelemetryModule.forRoot({
  serviceName: process.env.OTEL_SERVICE_NAME,
  traceExporter: {
    otlp: {
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    },
  },
  instrumentations: [
    new HttpInstrumentation(),
    new NestInstrumentation(),
    new PgInstrumentation(),
  ],
})

// 2. Manual span creation
import { trace } from '@opentelemetry/api'

async processPayment(invoice: Invoice): Promise<void> {
  const tracer = trace.getTracer('payment-service')
  const span = tracer.startSpan('processPayment', {
    attributes: {
      'invoice.id': invoice.id,
      'invoice.amount': invoice.totalAmount,
      'tenant.id': invoice.tenantId,
    },
  })

  try {
    // Business logic
    const result = await this.paymentGateway.charge(invoice)
    span.setStatus({ code: SpanStatusCode.OK })
    return result
  } catch (error) {
    span.recordException(error)
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    })
    throw error
  } finally {
    span.end()
  }
}
```

**Context Propagation** (see Auth service implementation):
```typescript
@Injectable()
export class ContextPropagationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest()

    // Extract trace context from headers
    const traceId = request.headers['x-trace-id']
    const spanId = request.headers['x-span-id']

    // Set active context
    return context.with(
      trace.setSpanContext(context.active(), { traceId, spanId }),
      () => next.handle()
    )
  }
}
```

**For complete OpenTelemetry setup, testing, and best practices**, see `resources/otel-integration-guide.md`

---

### Pattern 5: Structured Logging
**When to use**: All logging (replace console.log)

**Implementation**:
```typescript
import { Logger } from '@nestjs/common'

export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name)

  async createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
    this.logger.log('Creating invoice', {
      tenantId: input.tenantId,
      customerId: input.customerId,
      amount: input.totalAmount,
    })

    try {
      const invoice = await this.repository.save(input)

      this.logger.log('Invoice created successfully', {
        invoiceId: invoice.id,
        tenantId: invoice.tenantId,
      })

      return invoice
    } catch (error) {
      this.logger.error('Failed to create invoice', {
        error: error.message,
        stack: error.stack,
        input,
      })
      throw error
    }
  }
}
```

**Logging Levels**:
- `logger.debug()`: Detailed diagnostic info (development only)
- `logger.log()`: General information (business events)
- `logger.warn()`: Warning conditions (degraded performance, deprecated usage)
- `logger.error()`: Error conditions (exceptions, failures)

**Never Log**:
- Passwords, tokens, API keys
- Credit card numbers, PII
- Full request/response bodies (may contain secrets)

---

### Pattern 6: Correlation IDs
**When to use**: All cross-service calls, async operations

**Implementation**:
```typescript
// 1. Middleware to generate/extract correlation ID
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: Function) {
    req['correlationId'] =
      req.headers['x-correlation-id'] || uuid.v4()

    res.setHeader('x-correlation-id', req['correlationId'])
    next()
  }
}

// 2. Include in all logs
this.logger.log('Processing request', {
  correlationId: request.correlationId,
  operation: 'createInvoice',
})

// 3. Forward in service-to-service calls
const response = await axios.post(url, data, {
  headers: {
    'x-correlation-id': request.correlationId,
    'x-tenant-id': request.tenantId,
  },
})
```

**Benefits**:
- Trace requests across services
- Debug distributed transactions
- Link logs from multiple services

**For correlation ID patterns and request tracking**, see `resources/logging-standards.md`

---

## Health Check Integration

### Pattern 7: Error-Aware Health Checks
**When to use**: Readiness probes, dependency validation

**Implementation**:
```typescript
@Get('/health/ready')
@Public()
async checkReadiness(): Promise<ReadinessResponse> {
  const checks = await Promise.allSettled([
    this.checkDatabase(),
    this.checkRedis(),
    this.checkEventStore(),
    this.checkExternalService(),
  ])

  const failures = checks
    .filter(result => result.status === 'rejected')
    .map((result, index) => ({
      dependency: ['database', 'redis', 'eventstore', 'external'][index],
      error: result.reason.message,
    }))

  return {
    status: failures.length === 0 ? 'ready' : 'not_ready',
    checks: {
      database: checks[0].status === 'fulfilled',
      redis: checks[1].status === 'fulfilled',
      eventstore: checks[2].status === 'fulfilled',
      external: checks[3].status === 'fulfilled',
    },
    failures: failures.length > 0 ? failures : undefined,
  }
}
```

**For complete health check patterns**, see `health-check-patterns` skill

---

## Common Mistakes to Avoid

❌ **Don't**:
- Swallow errors without logging
- Use `console.log` instead of structured logging
- Throw generic `Error` (use custom exceptions)
- Log sensitive data (passwords, tokens, PII)
- Return HTTP 500 for validation errors (use 400)
- Skip error context (user, tenant, operation)
- Ignore error handling in async operations

✅ **Do**:
- Always log with context
- Use custom exception hierarchy
- Return error payloads in GraphQL (don't throw)
- Implement OpenTelemetry for distributed tracing
- Include correlation IDs in all logs
- Use structured logging with NestJS Logger
- Test error scenarios (unit + integration)

---

## Integration with Execute First

Typical workflow:
1. **Execute First**: Orchestrates implementation
2. **Error Handling & Observability**: Ensures error patterns
3. **Test First**: Creates error scenario tests
4. **Production Deployment**: Validates OTEL traces, health checks

**Order**: Implement → Add error handling → Add tracing → Test error scenarios → Verify observability

---

## Quality Gates

Before completion, verify:
- [ ] All async operations have try-catch blocks
- [ ] Custom exceptions used (not generic Error)
- [ ] GraphQL resolvers return error payloads (not throw)
- [ ] Structured logging implemented (no console.log)
- [ ] OpenTelemetry context propagation working
- [ ] Correlation IDs generated and forwarded
- [ ] Health checks include dependency validation
- [ ] Error scenarios tested (unit + integration)
- [ ] No sensitive data in logs
- [ ] Traces visible in observability platform

---

## Resources & References

**Skill Resources**:
- **OTEL Integration**: `resources/otel-integration-guide.md` (OpenTelemetry setup, instrumentation, testing)
- **Error Patterns**: `resources/error-patterns.md` (Try-catch, custom exceptions, error boundaries)
- **Logging Standards**: `resources/logging-standards.md` (Structured logging, correlation IDs)

**Knowledge Base**:
- **Complete Patterns**: `sessions/knowledge/vextrus-erp/patterns/error-handling-observability-patterns.md`
- **Quality Gates**: `sessions/knowledge/vextrus-erp/checklists/quality-gates.md`

**Service Examples**:
- **Auth Service**: `services/auth/src/telemetry/context-propagation.interceptor.ts`
- **Finance Service**: `services/finance/src/infrastructure/guards/jwt-auth.guard.ts` (error handling)

**External Resources**:
- OpenTelemetry JS: https://opentelemetry.io/docs/instrumentation/js/
- NestJS Logging: https://docs.nestjs.com/techniques/logger
- W3C Trace Context: https://www.w3.org/TR/trace-context/

---

## Override

Skip this skill if user explicitly says:
- "skip error handling"
- "prototype only" (development environment)
- "no observability needed"

**Default for Vextrus ERP**: ERROR HANDLING & OBSERVABILITY ALWAYS
