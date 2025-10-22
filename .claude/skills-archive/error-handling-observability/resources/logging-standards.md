# Logging Standards

Structured logging patterns and correlation ID strategies for Vextrus ERP microservices.

---

## Overview

**Logging Principles**:
1. **Structured Logging**: Use JSON format with consistent fields
2. **Context Enrichment**: Include tenant, user, correlation IDs
3. **Correlation IDs**: Track requests across services
4. **Security**: Never log sensitive data
5. **Performance**: Use appropriate log levels

---

## Structured Logging with NestJS Logger

### Setup

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

    // Business logic...
  }
}
```

### Log Levels

```typescript
// DEBUG: Detailed diagnostic information (development only)
this.logger.debug('Validating invoice data', { input })

// LOG: General information about application flow
this.logger.log('Invoice created successfully', {
  invoiceId: invoice.id,
  tenantId: invoice.tenantId,
})

// WARN: Warning conditions (deprecated usage, performance degradation)
this.logger.warn('Invoice total exceeds threshold', {
  invoiceId: invoice.id,
  total: invoice.totalAmount,
  threshold: 1000000,
})

// ERROR: Error conditions (exceptions, failures)
this.logger.error('Failed to create invoice', {
  error: error.message,
  stack: error.stack,
  input,
})
```

---

## Correlation ID Pattern

### Middleware Implementation

```typescript
// src/middleware/correlation-id.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract or generate correlation ID
    const correlationId =
      req.headers['x-correlation-id'] as string ||
      uuidv4()

    // Attach to request
    req['correlationId'] = correlationId

    // Return in response headers
    res.setHeader('x-correlation-id', correlationId)

    next()
  }
}
```

### Register Middleware

```typescript
// app.module.ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes('*')
  }
}
```

### Use in Logging

```typescript
this.logger.log('Processing request', {
  correlationId: request.correlationId,
  tenantId: request.tenantId,
  operation: 'createInvoice',
})
```

### Forward in Service-to-Service Calls

```typescript
async callMasterDataService(customerId: string, request: Request): Promise<Customer> {
  const response = await axios.get(
    `${this.masterDataUrl}/customers/${customerId}`,
    {
      headers: {
        'x-correlation-id': request.correlationId,
        'x-tenant-id': request.tenantId,
        'authorization': request.headers.authorization,
      },
    }
  )

  return response.data
}
```

---

## Context Enrichment

### Request Context Pattern

```typescript
// src/context/request-context.ts
export class RequestContext {
  constructor(
    public readonly correlationId: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly ipAddress: string
  ) {}

  static fromRequest(req: Request): RequestContext {
    return new RequestContext(
      req['correlationId'],
      req['tenantId'],
      req['user']?.id,
      req.ip
    )
  }
}
```

### Logging with Context

```typescript
async createInvoice(input: CreateInvoiceInput, context: RequestContext): Promise<Invoice> {
  this.logger.log('Creating invoice', {
    correlationId: context.correlationId,
    tenantId: context.tenantId,
    userId: context.userId,
    customerId: input.customerId,
    amount: input.totalAmount,
  })

  try {
    const invoice = await this.repository.save(input)

    this.logger.log('Invoice created successfully', {
      correlationId: context.correlationId,
      tenantId: context.tenantId,
      invoiceId: invoice.id,
    })

    return invoice
  } catch (error) {
    this.logger.error('Failed to create invoice', {
      correlationId: context.correlationId,
      tenantId: context.tenantId,
      userId: context.userId,
      error: error.message,
      stack: error.stack,
    })

    throw error
  }
}
```

---

## Security: What NOT to Log

❌ **Never log**:
- Passwords (plain or hashed)
- API keys, tokens, secrets
- Credit card numbers, CVV
- Social Security Numbers, National IDs
- Full request/response bodies (may contain secrets)
- Personal Identifiable Information (PII) in plain text

✅ **Safe to log**:
- User IDs (not names/emails)
- Tenant IDs
- Entity IDs (invoice, customer, product)
- Operation names
- Status codes
- Timestamps
- Non-sensitive request parameters

### Example: Safe Logging

```typescript
// ❌ BAD
this.logger.log('User login', {
  email: user.email,
  password: input.password,
  token: generatedToken,
})

// ✅ GOOD
this.logger.log('User login successful', {
  userId: user.id,
  tenantId: user.tenantId,
  correlationId: context.correlationId,
  loginMethod: 'password',
})
```

---

## Log Formatting

### JSON Format (Production)

```json
{
  "level": "info",
  "timestamp": "2025-10-20T10:30:45.123Z",
  "service": "finance-service",
  "message": "Invoice created successfully",
  "context": {
    "correlationId": "550e8400-e29b-41d4-a716-446655440000",
    "tenantId": "tenant-123",
    "userId": "user-456",
    "invoiceId": "inv-789"
  }
}
```

### Human-Readable Format (Development)

```
[2025-10-20 10:30:45] INFO [InvoiceService] Invoice created successfully
  correlationId: 550e8400-e29b-41d4-a716-446655440000
  tenantId: tenant-123
  invoiceId: inv-789
```

---

## Performance Considerations

### Conditional Logging

```typescript
// Avoid expensive operations in debug logs that won't be shown
if (this.logger.isDebugEnabled()) {
  this.logger.debug('Detailed invoice data', {
    invoice: JSON.stringify(invoice), // Expensive serialization
  })
}
```

### Sampling for High-Volume Operations

```typescript
// Log only 10% of successful operations
if (Math.random() < 0.1) {
  this.logger.log('Invoice fetched', {
    invoiceId: invoice.id,
    tenantId: invoice.tenantId,
  })
}

// Always log errors
if (error) {
  this.logger.error('Failed to fetch invoice', {
    error: error.message,
    invoiceId: id,
  })
}
```

---

## Integration with OpenTelemetry

### Trace ID in Logs

```typescript
import { trace } from '@opentelemetry/api'

this.logger.log('Processing payment', {
  traceId: trace.getActiveSpan()?.spanContext().traceId,
  spanId: trace.getActiveSpan()?.spanContext().spanId,
  correlationId: context.correlationId,
  invoiceId: invoice.id,
})
```

**Benefit**: Link logs to distributed traces in observability platforms.

---

## Centralized Log Aggregation

### Recommended Stack

1. **Fluent Bit** (log collection, lightweight)
2. **Elasticsearch** (storage, search)
3. **Kibana** (visualization, dashboards)

### Alternative: Grafana Loki

- Lightweight (doesn't index log content)
- Integrates with Grafana
- Cost-effective for high log volumes

---

## Log Retention

### Recommended Retention Policies

| Log Type | Retention | Reason |
|----------|-----------|--------|
| **Error logs** | 90 days | Compliance, debugging |
| **Audit logs** | 1 year | Regulatory requirements |
| **Debug logs** | 7 days | Development only |
| **Info logs** | 30 days | General troubleshooting |

---

## Testing

### Test Log Output

```typescript
describe('Invoice Service Logging', () => {
  let loggerSpy: jest.SpyInstance

  beforeEach(() => {
    loggerSpy = jest.spyOn(service['logger'], 'log')
  })

  it('should log invoice creation with context', async () => {
    await service.createInvoice(testInput, testContext)

    expect(loggerSpy).toHaveBeenCalledWith(
      'Creating invoice',
      expect.objectContaining({
        tenantId: testContext.tenantId,
        userId: testContext.userId,
        customerId: testInput.customerId,
      })
    )
  })

  it('should not log sensitive data', async () => {
    await service.login(email, password)

    expect(loggerSpy).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        password: expect.anything(),
      })
    )
  })
})
```

---

## Best Practices

✅ **Do**:
- Use structured logging (JSON) in production
- Include correlation IDs in all logs
- Log with context (tenant, user, operation)
- Use appropriate log levels
- Forward correlation IDs in service-to-service calls
- Test that sensitive data is not logged
- Implement log sampling for high-volume operations

❌ **Don't**:
- Use `console.log` (use NestJS Logger)
- Log sensitive data (passwords, tokens, PII)
- Log full request/response bodies
- Log at DEBUG level in production
- Skip correlation IDs
- Create expensive log payloads without conditional checks

---

## References

- NestJS Logger: https://docs.nestjs.com/techniques/logger
- Correlation IDs: https://hilton.org.uk/blog/microservices-correlation-id
- Structured Logging: https://www.structlog.org/en/stable/why.html
- Log Security: https://owasp.org/www-community/Logging_Cheat_Sheet
