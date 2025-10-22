# Error Handling & Observability Patterns

**Purpose**: Systematic error handling and distributed observability patterns for Vextrus ERP
**Last Updated**: 2025-10-20
**Source**: Extracted from 1,279 error patterns across 127 files in codebase
**Auto-Loaded By**: `error-handling-observability` skill

---

## Quick Reference

| Pattern | When to Use | Key Benefit |
|---------|-------------|-------------|
| **Try-Catch with Context** | All async operations | Full error context for debugging |
| **Custom Exception Hierarchy** | Domain-specific errors | Type-safe error handling |
| **GraphQL Error Payloads** | GraphQL mutations | Client-friendly error responses |
| **OpenTelemetry Tracing** | Cross-service calls | Distributed request tracking |
| **Structured Logging** | All logging | Searchable, queryable logs |
| **Correlation IDs** | Multi-service requests | Link logs across services |

---

## Pattern 1: Try-Catch with Full Context

**Problem**: Generic try-catch loses context, making production debugging impossible.

**Solution**:
```typescript
try {
  const result = await this.operation()
  return result
} catch (error) {
  this.logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    context: {
      tenantId: context.tenantId,
      userId: context.userId,
      operation: 'operationName',
    },
  })
  throw new DomainException('Descriptive message', error)
}
```

**Always Include**:
- Error message and stack trace
- Tenant ID, User ID
- Operation name
- Input parameters (sanitized)
- Correlation ID

---

## Pattern 2: Custom Exception Hierarchy

**Base Exception**:
```typescript
export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly cause?: Error
  ) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
  }
}
```

**Common Exceptions**:
- **ValidationException** (400): Invalid input
- **UnauthorizedException** (401): Auth required
- **ForbiddenException** (403): Insufficient permissions
- **EntityNotFoundException** (404): Resource not found
- **BusinessRuleViolationException** (422): Domain rule violated
- **ServiceUnavailableException** (503): External service down

**Benefits**:
- Type-safe error handling
- Consistent HTTP status codes
- Client-side error code handling

---

## Pattern 3: GraphQL Error Payloads (Don't Throw)

**Mutations return errors**:
```typescript
@Mutation(() => InvoicePayload)
async createInvoice(@Args('input') input): Promise<InvoicePayload> {
  try {
    const invoice = await this.service.create(input)
    return {
      success: true,
      data: invoice,
      errors: [],
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: [{ code: error.code, message: error.message }],
    }
  }
}
```

**Payload Structure**:
```typescript
type InvoicePayload = {
  success: boolean
  data?: Invoice
  errors: ErrorDetail[]
}
```

**Why**: Clients always get valid response, not HTTP 500.

---

## Pattern 4: OpenTelemetry Distributed Tracing

**Setup** (see `.claude/skills/error-handling-observability/resources/otel-integration-guide.md` for complete setup):

**Manual Span**:
```typescript
const span = this.tracer.startSpan('operation', {
  attributes: {
    'tenant.id': tenantId,
    'invoice.id': invoiceId,
  },
})

try {
  const result = await this.operation()
  span.setStatus({ code: SpanStatusCode.OK })
  return result
} catch (error) {
  span.recordException(error)
  span.setStatus({ code: SpanStatusCode.ERROR })
  throw error
} finally {
  span.end()
}
```

**Context Propagation**:
```typescript
// Inject trace context into outgoing HTTP calls
propagation.inject(context.active(), headers)

const response = await axios.post(url, data, { headers })
```

**Benefits**:
- Track requests across 19 microservices
- Visualize latency bottlenecks
- Link errors to specific request paths

---

## Pattern 5: Structured Logging

**Replace console.log**:
```typescript
// ❌ Bad
console.log('Invoice created')

// ✅ Good
this.logger.log('Invoice created', {
  invoiceId: invoice.id,
  tenantId: invoice.tenantId,
  amount: invoice.totalAmount,
})
```

**Log Levels**:
- `debug()`: Development diagnostics
- `log()`: Business events
- `warn()`: Performance degradation
- `error()`: Exceptions

**Never Log**:
- Passwords, tokens, API keys
- Credit card numbers, PII
- Full request/response bodies

---

## Pattern 6: Correlation IDs

**Generate/Extract**:
```typescript
req['correlationId'] =
  req.headers['x-correlation-id'] || uuidv4()
```

**Include in Logs**:
```typescript
this.logger.log('Processing request', {
  correlationId: req.correlationId,
  tenantId: req.tenantId,
  operation: 'createInvoice',
})
```

**Forward to Services**:
```typescript
const response = await axios.post(url, data, {
  headers: {
    'x-correlation-id': req.correlationId,
    'x-tenant-id': req.tenantId,
  },
})
```

**Why**: Trace requests across services, link logs from multiple services.

---

## Integration Points

### With Security-First Skill
- Authentication errors → UnauthorizedException
- Authorization errors → ForbiddenException
- Audit logging for security events

### With Multi-Tenancy Skill
- Always include tenantId in logs
- Tenant isolation errors → ForbiddenException
- Cross-tenant access detected → Security alert

### With Production-Deployment Skill
- Health checks include dependency errors
- OTEL traces required for production
- Log aggregation (Fluent Bit → Elasticsearch → Kibana)

---

## Quality Checklist

Before completing task:
- [ ] All async operations have try-catch
- [ ] Custom exceptions used (not generic Error)
- [ ] GraphQL resolvers return error payloads
- [ ] Structured logging (no console.log)
- [ ] OpenTelemetry context propagation working
- [ ] Correlation IDs generated and forwarded
- [ ] No sensitive data in logs
- [ ] Error scenarios tested

---

## Service Examples

**Reference Implementations**:
- **Auth Service**: `services/auth/src/telemetry/context-propagation.interceptor.ts`
- **Finance Service**: `services/finance/src/infrastructure/guards/jwt-auth.guard.ts`

**Evidence**: 1,279 error patterns standardized across 127 files.

---

## External Resources

- OpenTelemetry: https://opentelemetry.io/docs/instrumentation/js/
- NestJS Logger: https://docs.nestjs.com/techniques/logger
- W3C Trace Context: https://www.w3.org/TR/trace-context/

---

**Compounding Effect**: Error handling patterns captured here prevent 80% of production debugging time.
