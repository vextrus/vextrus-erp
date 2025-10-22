# Error Handling Patterns

Comprehensive error handling patterns for Vextrus ERP microservices, covering try-catch strategies, custom exceptions, and error boundaries.

---

## Pattern 1: Try-Catch with Detailed Context

**Problem**: Generic try-catch blocks lose context, making debugging difficult.

**Solution**: Always include operation context, user/tenant info, and structured error data.

### Basic Pattern

```typescript
async createInvoice(input: CreateInvoiceInput, context: RequestContext): Promise<Invoice> {
  try {
    this.logger.log('Creating invoice', {
      tenantId: context.tenantId,
      userId: context.userId,
      customerId: input.customerId,
    })

    const invoice = await this.repository.save(input)

    return invoice
  } catch (error) {
    this.logger.error('Failed to create invoice', {
      error: error.message,
      stack: error.stack,
      context: {
        tenantId: context.tenantId,
        userId: context.userId,
        operation: 'createInvoice',
        input,
      },
    })

    // Re-throw with domain exception
    throw new InvoiceCreationException(
      'Failed to create invoice',
      error
    )
  }
}
```

### External Service Calls

```typescript
async fetchCustomerFromMasterData(customerId: string): Promise<Customer> {
  try {
    const response = await axios.get(
      `${this.masterDataUrl}/customers/${customerId}`,
      {
        headers: {
          'x-tenant-id': this.tenantContext.tenantId,
          'x-correlation-id': this.tenantContext.correlationId,
        },
        timeout: 5000, // 5s timeout
      }
    )

    return response.data
  } catch (error) {
    if (error.response) {
      // HTTP error response (4xx, 5xx)
      this.logger.error('Master data service returned error', {
        status: error.response.status,
        data: error.response.data,
        customerId,
      })

      if (error.response.status === 404) {
        throw new EntityNotFoundException('Customer', customerId)
      }

      throw new ServiceUnavailableException('master-data', error)
    } else if (error.request) {
      // Request made but no response (timeout, network error)
      this.logger.error('Master data service unavailable', {
        error: error.message,
        customerId,
      })

      throw new ServiceUnavailableException('master-data', error)
    } else {
      // Request setup error
      this.logger.error('Failed to create request', {
        error: error.message,
        customerId,
      })

      throw new InternalServerException(
        'Failed to fetch customer',
        error
      )
    }
  }
}
```

### Database Operations

```typescript
async findInvoice(id: string, tenantId: string): Promise<Invoice> {
  try {
    const invoice = await this.invoiceRepository.findOne({
      where: { id, tenantId },
    })

    if (!invoice) {
      throw new EntityNotFoundException('Invoice', id)
    }

    return invoice
  } catch (error) {
    if (error instanceof EntityNotFoundException) {
      // Re-throw domain exceptions
      throw error
    }

    // Log and wrap database errors
    this.logger.error('Database query failed', {
      error: error.message,
      query: 'findInvoice',
      params: { id, tenantId },
    })

    throw new InternalServerException('Failed to fetch invoice', error)
  }
}
```

---

## Pattern 2: Custom Exception Hierarchy

**Problem**: Generic `Error` or `throw new Error()` doesn't provide enough context.

**Solution**: Create domain-specific exception hierarchy with error codes and HTTP status codes.

### Base Exception

```typescript
export abstract class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly cause?: Error,
    public readonly metadata?: Record<string, any>
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      metadata: this.metadata,
      cause: this.cause?.message,
    }
  }
}
```

### Client Error Exceptions (4xx)

```typescript
// 400 Bad Request
export class ValidationException extends DomainException {
  constructor(message: string, field?: string, cause?: Error) {
    super(
      message,
      'VALIDATION_ERROR',
      400,
      cause,
      field ? { field } : undefined
    )
  }
}

// 401 Unauthorized
export class UnauthorizedException extends DomainException {
  constructor(message: string = 'Unauthorized', cause?: Error) {
    super(message, 'UNAUTHORIZED', 401, cause)
  }
}

// 403 Forbidden
export class ForbiddenException extends DomainException {
  constructor(
    message: string = 'Forbidden',
    requiredPermission?: string,
    cause?: Error
  ) {
    super(
      message,
      'FORBIDDEN',
      403,
      cause,
      requiredPermission ? { requiredPermission } : undefined
    )
  }
}

// 404 Not Found
export class EntityNotFoundException extends DomainException {
  constructor(entityName: string, id: string, cause?: Error) {
    super(
      `${entityName} with id ${id} not found`,
      'ENTITY_NOT_FOUND',
      404,
      cause,
      { entityName, id }
    )
  }
}

// 409 Conflict
export class ConflictException extends DomainException {
  constructor(message: string, cause?: Error) {
    super(message, 'CONFLICT', 409, cause)
  }
}
```

### Server Error Exceptions (5xx)

```typescript
// 500 Internal Server Error
export class InternalServerException extends DomainException {
  constructor(message: string, cause?: Error) {
    super(message, 'INTERNAL_ERROR', 500, cause)
  }
}

// 503 Service Unavailable
export class ServiceUnavailableException extends DomainException {
  constructor(serviceName: string, cause?: Error) {
    super(
      `Service ${serviceName} is unavailable`,
      'SERVICE_UNAVAILABLE',
      503,
      cause,
      { serviceName }
    )
  }
}
```

### Domain-Specific Exceptions

```typescript
// Business rule violation
export class BusinessRuleViolationException extends DomainException {
  constructor(rule: string, message: string, cause?: Error) {
    super(message, 'BUSINESS_RULE_VIOLATION', 422, cause, { rule })
  }
}

// Example: Invoice must be in DRAFT status to edit
export class InvalidInvoiceStatusException extends BusinessRuleViolationException {
  constructor(currentStatus: string, requiredStatus: string) {
    super(
      'INVOICE_STATUS_VALIDATION',
      `Invoice must be in ${requiredStatus} status to perform this operation (current: ${currentStatus})`,
    )
  }
}

// Example: Payment amount exceeds invoice total
export class PaymentAmountExceededException extends BusinessRuleViolationException {
  constructor(paymentAmount: number, invoiceTotal: number) {
    super(
      'PAYMENT_AMOUNT_VALIDATION',
      `Payment amount (${paymentAmount}) exceeds invoice total (${invoiceTotal})`
    )
  }
}
```

---

## Pattern 3: Exception Filter (NestJS)

**Purpose**: Centralized exception handling, convert exceptions to HTTP responses.

### Global Exception Filter

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { Response } from 'express'
import { DomainException } from '../exceptions/domain.exception'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status: number
    let code: string
    let message: string
    let metadata: any

    if (exception instanceof DomainException) {
      // Domain exceptions
      status = exception.statusCode
      code = exception.code
      message = exception.message
      metadata = exception.metadata

      this.logger.warn('Domain exception occurred', {
        code,
        message,
        path: request.url,
        metadata,
      })
    } else if (exception instanceof HttpException) {
      // NestJS HTTP exceptions
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      code = 'HTTP_EXCEPTION'
      message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message

      this.logger.warn('HTTP exception occurred', {
        status,
        message,
        path: request.url,
      })
    } else {
      // Unexpected errors
      status = HttpStatus.INTERNAL_SERVER_ERROR
      code = 'INTERNAL_ERROR'
      message = 'An unexpected error occurred'

      this.logger.error('Unexpected exception occurred', {
        error: exception.message,
        stack: exception.stack,
        path: request.url,
      })
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        ...(metadata && { metadata }),
      },
      path: request.url,
      timestamp: new Date().toISOString(),
    })
  }
}
```

### Register Globally

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalFilters(new GlobalExceptionFilter(new Logger()))

  await app.listen(3000)
}
```

---

## Pattern 4: GraphQL Error Handling

**Important**: GraphQL resolvers should **return errors**, not throw (unless critical).

### Mutation with Error Payload

```typescript
@Mutation(() => InvoicePayload)
async createInvoice(
  @Args('input') input: CreateInvoiceInput,
  @CurrentUser() user: CurrentUserContext
): Promise<InvoicePayload> {
  try {
    const invoice = await this.commandBus.execute(
      new CreateInvoiceCommand(input, user)
    )

    return {
      success: true,
      data: invoice,
      errors: [],
    }
  } catch (error) {
    this.logger.error('Failed to create invoice', {
      error: error.message,
      userId: user.id,
      tenantId: user.tenantId,
    })

    // Return error in payload (don't throw)
    return {
      success: false,
      data: null,
      errors: [
        {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
          field: error instanceof ValidationException
            ? error.metadata?.field
            : undefined,
        },
      ],
    }
  }
}
```

### Query with Nullable Result

```typescript
@Query(() => InvoiceDto, { nullable: true })
async getInvoice(
  @Args('id', { type: () => ID }) id: string,
  @CurrentUser() user: CurrentUserContext
): Promise<InvoiceDto | null> {
  try {
    return await this.queryBus.execute(
      new GetInvoiceQuery(id, user.tenantId)
    )
  } catch (error) {
    if (error instanceof EntityNotFoundException) {
      // Return null for not found (valid GraphQL pattern)
      return null
    }

    // Log and re-throw for unexpected errors
    this.logger.error('Failed to fetch invoice', {
      error: error.message,
      invoiceId: id,
      tenantId: user.tenantId,
    })

    throw error // GraphQL will convert to error response
  }
}
```

---

## Pattern 5: Retry with Exponential Backoff

**When to use**: Transient failures (network issues, temporary service unavailability).

### Implementation

```typescript
async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    factor?: number
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
  } = options

  let delay = initialDelay

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }

      await new Promise(resolve => setTimeout(resolve, delay))
      delay = Math.min(delay * factor, maxDelay)
    }
  }

  throw new Error('Max retries exceeded')
}

// Usage
const customer = await retryWithExponentialBackoff(
  () => this.masterDataClient.fetchCustomer(customerId),
  { maxRetries: 3, initialDelay: 1000 }
)
```

---

## Pattern 6: Circuit Breaker

**When to use**: Prevent cascading failures when external service is down.

### Simple Circuit Breaker

```typescript
enum CircuitState {
  CLOSED, // Normal operation
  OPEN, // Reject requests
  HALF_OPEN, // Test if service recovered
}

class CircuitBreaker {
  private state = CircuitState.CLOSED
  private failureCount = 0
  private lastFailureTime: Date | null = null

  constructor(
    private readonly failureThreshold = 5,
    private readonly timeout = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime!.getTime() > this.timeout) {
        this.state = CircuitState.HALF_OPEN
      } else {
        throw new ServiceUnavailableException(
          'Circuit breaker is OPEN'
        )
      }
    }

    try {
      const result = await operation()

      if (this.state === CircuitState.HALF_OPEN) {
        this.reset()
      }

      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }

  private recordFailure() {
    this.failureCount++
    this.lastFailureTime = new Date()

    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN
    }
  }

  private reset() {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.lastFailureTime = null
  }
}
```

---

## Testing Error Scenarios

### Unit Test Example

```typescript
describe('InvoiceService Error Handling', () => {
  it('should throw EntityNotFoundException when invoice not found', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(null)

    await expect(
      service.findInvoice('invalid-id', 'tenant-1')
    ).rejects.toThrow(EntityNotFoundException)

    await expect(
      service.findInvoice('invalid-id', 'tenant-1')
    ).rejects.toThrow('Invoice with id invalid-id not found')
  })

  it('should wrap database errors in InternalServerException', async () => {
    jest.spyOn(repository, 'findOne').mockRejectedValue(
      new Error('Connection lost')
    )

    await expect(
      service.findInvoice('id-1', 'tenant-1')
    ).rejects.toThrow(InternalServerException)
  })

  it('should log errors with context', async () => {
    const loggerSpy = jest.spyOn(service['logger'], 'error')

    jest.spyOn(repository, 'save').mockRejectedValue(
      new Error('DB error')
    )

    await expect(
      service.createInvoice(testInput, testContext)
    ).rejects.toThrow()

    expect(loggerSpy).toHaveBeenCalledWith(
      'Failed to create invoice',
      expect.objectContaining({
        error: 'DB error',
        context: expect.objectContaining({
          tenantId: testContext.tenantId,
          operation: 'createInvoice',
        }),
      })
    )
  })
})
```

---

## Best Practices

✅ **Do**:
- Use custom exceptions (not generic `Error`)
- Include error codes for client-side handling
- Log with full context (user, tenant, operation)
- Preserve original error as `cause`
- Return error payloads in GraphQL (don't throw)
- Test error scenarios
- Use circuit breakers for external services
- Implement retry with exponential backoff for transient failures

❌ **Don't**:
- Swallow errors without logging
- Throw generic `Error` or `throw new Error()`
- Log sensitive data (passwords, tokens, PII)
- Return HTTP 500 for validation errors (use 400)
- Skip error context
- Ignore error handling in async operations
- Use `console.log` for errors

---

## References

- NestJS Exception Filters: https://docs.nestjs.com/exception-filters
- Domain Exceptions Pattern: https://enterprisecraftsmanship.com/posts/exceptions-for-flow-control/
- Circuit Breaker Pattern: https://martinfowler.com/bliki/CircuitBreaker.html
