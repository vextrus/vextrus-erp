# Retry Strategies

Comprehensive guide for implementing retry patterns with exponential backoff to handle transient failures in Vextrus ERP microservices.

---

## Overview

**Problem**: Network requests fail due to:
- Temporary network issues
- Service temporarily overloaded
- Database connection pool exhausted
- Rate limiting

**Solution**: Automatic retry with exponential backoff and jitter.

**Library**: **Cockatiel** (for TypeScript/NestJS)

---

## Pattern 1: Basic Retry with Exponential Backoff

### Implementation

```typescript
import { retry, ExponentialBackoff, handleAll } from 'cockatiel'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class MasterDataClient {
  private readonly logger = new Logger(MasterDataClient.name)

  //
 Retry policy: 3 attempts with exponential backoff
  private readonly retryPolicy = retry(handleAll, {
    maxAttempts: 3,
    backoff: new ExponentialBackoff({
      initialDelay: 1000,  // 1s
      maxDelay: 10000,     // 10s
      factor: 2,           // Double each time
    }),
  })

  async getCustomer(customerId: string): Promise<Customer> {
    return this.retryPolicy.execute(async () => {
      this.logger.debug(`Fetching customer ${customerId}`)

      const response = await this.httpService.axiosRef.get(
        `${this.masterDataUrl}/customers/${customerId}`
      )

      return response.data
    })
  }
}
```

**Backoff Progression**:
- Attempt 1: Immediate
- Attempt 2: After 1s
- Attempt 3: After 2s (1s × 2)

**Total time**: ~3s for 3 attempts

---

## Pattern 2: Retry with Jitter

**Problem**: All failed requests retry at same time → "thundering herd".

**Solution**: Add randomness (jitter) to backoff delays.

```typescript
const retryPolicy = retry(handleAll, {
  maxAttempts: 3,
  backoff: new ExponentialBackoff({
    initialDelay: 1000,
    maxDelay: 10000,
    factor: 2,
    jitter: 'full',  // Full jitter (0-100% randomness)
  }),
})
```

**Jitter Modes**:
- `'none'`: No jitter (predictable delays)
- `'full'`: Random delay between 0 and calculated delay
- `'half'`: Random delay between 50% and 100% of calculated delay
- `'decorrelated'`: AWS-style decorrelated jitter

**Example with Full Jitter**:
- Attempt 2: Random between 0-1000ms (instead of exactly 1000ms)
- Attempt 3: Random between 0-2000ms (instead of exactly 2000ms)

**Benefits**: Prevents all clients retrying simultaneously.

---

## Pattern 3: Selective Retry (Only Transient Failures)

**Rule**: Only retry errors that might succeed on retry.

### Retry Transient Errors Only

```typescript
import { retry, ExponentialBackoff, handleType } from 'cockatiel'
import { AxiosError } from 'axios'

const retryPolicy = retry(
  handleType(AxiosError, (err) => {
    // Retry decision logic
    if (!err.response) {
      // Network error (ECONNRESET, ETIMEDOUT) → Retry
      return true
    }

    const status = err.response.status

    // 5xx server errors → Retry (server might recover)
    if (status >= 500 && status < 600) {
      return true
    }

    // 429 Rate Limit → Retry (after backoff)
    if (status === 429) {
      return true
    }

    // 408 Request Timeout → Retry
    if (status === 408) {
      return true
    }

    // 4xx client errors → Don't retry (permanent)
    return false
  }),
  {
    maxAttempts: 3,
    backoff: new ExponentialBackoff({ initialDelay: 1000, maxDelay: 10000 }),
  }
)
```

**Retry Decision Table**:

| Error Type | Retry? | Reason |
|------------|--------|--------|
| Network error (ECONNRESET) | ✅ Yes | Transient network issue |
| Timeout (ETIMEDOUT) | ✅ Yes | Service might be slow |
| 500 Internal Server Error | ✅ Yes | Server might recover |
| 502 Bad Gateway | ✅ Yes | Upstream might recover |
| 503 Service Unavailable | ✅ Yes | Service might come back |
| 504 Gateway Timeout | ✅ Yes | Upstream might respond |
| 429 Too Many Requests | ✅ Yes | Rate limit will reset |
| 408 Request Timeout | ✅ Yes | Retry might succeed |
| 400 Bad Request | ❌ No | Request is malformed |
| 401 Unauthorized | ❌ No | Need new credentials |
| 403 Forbidden | ❌ No | Insufficient permissions |
| 404 Not Found | ❌ No | Resource doesn't exist |
| 422 Unprocessable Entity | ❌ No | Validation error |

---

## Pattern 4: Context-Aware Retry

**Different retry strategies** for different service types.

```typescript
@Injectable()
export class IntegrationClientFactory {
  // Fast internal services - retry quickly
  createInternalClient() {
    return retry(handleAll, {
      maxAttempts: 3,
      backoff: new ExponentialBackoff({
        initialDelay: 500,   // 500ms
        maxDelay: 2000,      // 2s
        factor: 2,
      }),
    })
  }

  // External APIs - retry slowly
  createExternalClient() {
    return retry(handleAll, {
      maxAttempts: 5,
      backoff: new ExponentialBackoff({
        initialDelay: 2000,   // 2s
        maxDelay: 30000,      // 30s
        factor: 2,
      }),
    })
  }

  // Critical operations - single retry
  createCriticalClient() {
    return retry(handleAll, {
      maxAttempts: 2,
      backoff: new ExponentialBackoff({
        initialDelay: 1000,
        maxDelay: 1000,  // No exponential growth
      }),
    })
  }

  // Non-critical - aggressive retry
  createNonCriticalClient() {
    return retry(handleAll, {
      maxAttempts: 10,
      backoff: new ExponentialBackoff({
        initialDelay: 1000,
        maxDelay: 60000,  // Up to 1 minute
        factor: 2,
      }),
    })
  }
}
```

---

## Pattern 5: Retry with Rate Limit Handling

**Problem**: 429 errors need special handling (respect Retry-After header).

```typescript
import { retry, ExponentialBackoff, handleType } from 'cockatiel'

const retryPolicy = retry(
  handleType(AxiosError, (err) => {
    // Only retry 429 and 5xx errors
    return !err.response || err.response.status === 429 || err.response.status >= 500
  }),
  {
    maxAttempts: 5,
    backoff: new ExponentialBackoff({
      initialDelay: 1000,
      maxDelay: 60000,
      factor: 2,
    }),
  }
)

async function callRateLimitedAPI(endpoint: string): Promise<Response> {
  return retryPolicy.execute(async (context) => {
    try {
      return await axios.get(endpoint)
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after']

        if (retryAfter) {
          // Respect Retry-After header
          const delayMs = parseInt(retryAfter) * 1000
          logger.warn(`Rate limited, waiting ${delayMs}ms`, { endpoint })

          await new Promise(resolve => setTimeout(resolve, delayMs))

          // Retry immediately after waiting
          return axios.get(endpoint)
        }
      }

      throw error
    }
  })
}
```

---

## Pattern 6: Idempotent Retry

**Critical**: Only retry idempotent operations safely.

### Idempotent Operations (Safe to Retry)

```typescript
// ✅ Safe: GET requests (read-only)
const customer = await retryPolicy.execute(() =>
  this.httpService.get(`/customers/${id}`)
)

// ✅ Safe: POST with idempotency key
const payment = await retryPolicy.execute(() =>
  this.httpService.post('/payments', data, {
    headers: { 'Idempotency-Key': uuidv4() },
  })
)

// ✅ Safe: PUT (updates are idempotent)
const updated = await retryPolicy.execute(() =>
  this.httpService.put(`/customers/${id}`, data)
)

// ✅ Safe: DELETE (idempotent by nature)
await retryPolicy.execute(() =>
  this.httpService.delete(`/customers/${id}`)
)
```

### Non-Idempotent Operations (Dangerous to Retry)

```typescript
// ❌ DANGEROUS: POST without idempotency key
// Could create duplicate payments!
const payment = await retryPolicy.execute(() =>
  this.httpService.post('/payments', { amount: 1000 })
)

// ✅ SAFE: Add idempotency key
const payment = await retryPolicy.execute(() =>
  this.httpService.post('/payments', { amount: 1000 }, {
    headers: { 'Idempotency-Key': generateIdempotencyKey(customerId, invoiceId) },
  })
)
```

**Idempotency Key Generation**:
```typescript
function generateIdempotencyKey(...parts: string[]): string {
  // Deterministic key from request parameters
  return crypto
    .createHash('sha256')
    .update(parts.join(':'))
    .digest('hex')
}

// Example
const key = generateIdempotencyKey(customerId, invoiceId, 'payment')
// Same inputs always produce same key → Safe to retry
```

---

## Pattern 7: Retry with Timeout

**Combine retry with timeout** to prevent hanging.

```typescript
import { retry, ExponentialBackoff, timeout } from 'cockatiel'

const retryPolicy = retry(handleAll, {
  maxAttempts: 3,
  backoff: new ExponentialBackoff({ initialDelay: 1000, maxDelay: 10000 }),
})

const timeoutPolicy = timeout(5000) // 5s per attempt

// Compose policies: timeout each attempt, retry up to 3 times
const composedPolicy = Policy.wrap(retryPolicy, timeoutPolicy)

async function callExternalService(data: any): Promise<Response> {
  return composedPolicy.execute(async () => {
    // Each attempt times out after 5s
    // Up to 3 attempts with exponential backoff
    return this.httpService.post(url, data)
  })
}
```

**Total timeout**: 5s × 3 attempts + backoff delays = ~18s maximum

---

## Pattern 8: Retry Metrics and Logging

**Track retry behavior** for monitoring and debugging.

```typescript
import { Counter, Histogram } from 'prom-client'

@Injectable()
export class RetryMetrics {
  private readonly retryCounter = new Counter({
    name: 'http_request_retries_total',
    help: 'Total number of HTTP request retries',
    labelNames: ['service', 'attempt'],
  })

  private readonly retryDuration = new Histogram({
    name: 'http_request_retry_duration_seconds',
    help: 'Retry operation duration',
    labelNames: ['service'],
  })

  async executeWithMetrics<T>(
    service: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    let attempt = 0

    const retryPolicy = retry(handleAll, {
      maxAttempts: 3,
      backoff: new ExponentialBackoff({ initialDelay: 1000, maxDelay: 10000 }),
    })

    try {
      return await retryPolicy.execute(async (context) => {
        attempt = context.attempt
        this.retryCounter.inc({ service, attempt: attempt.toString() })

        return operation()
      })
    } finally {
      const duration = (Date.now() - startTime) / 1000
      this.retryDuration.observe({ service }, duration)
    }
  }
}
```

**Logging Best Practices**:
```typescript
this.logger.warn('Retrying failed request', {
  attempt: context.attempt,
  maxAttempts: 3,
  nextDelay: context.delay,
  error: error.message,
  correlationId: context.correlationId,
})
```

---

## Configuration Recommendations

### By Service Type

```typescript
const RetryConfigs = {
  // Internal fast services (auth, lookups)
  INTERNAL_FAST: {
    maxAttempts: 3,
    initialDelay: 500,
    maxDelay: 2000,
  },

  // Standard internal services
  INTERNAL_STANDARD: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
  },

  // External APIs
  EXTERNAL_STANDARD: {
    maxAttempts: 5,
    initialDelay: 2000,
    maxDelay: 30000,
  },

  // Banking/Government APIs (slow, unreliable)
  EXTERNAL_CRITICAL: {
    maxAttempts: 7,
    initialDelay: 3000,
    maxDelay: 60000,
  },

  // Non-critical background jobs
  BACKGROUND_JOB: {
    maxAttempts: 10,
    initialDelay: 5000,
    maxDelay: 300000,  // 5 minutes
  },
}
```

---

## Testing

### Unit Test Retry Logic

```typescript
describe('MasterDataClient Retry', () => {
  let client: MasterDataClient
  let httpService: jest.Mocked<HttpService>

  beforeEach(() => {
    httpService = {
      axiosRef: { get: jest.fn() },
    } as any

    client = new MasterDataClient(httpService)
  })

  it('should retry on network error', async () => {
    // Fail twice, succeed on third attempt
    httpService.axiosRef.get
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockRejectedValueOnce(new Error('ETIMEDOUT'))
      .mockResolvedValueOnce({ data: { id: 'customer-1' } })

    const result = await client.getCustomer('customer-1')

    expect(result).toEqual({ id: 'customer-1' })
    expect(httpService.axiosRef.get).toHaveBeenCalledTimes(3)
  })

  it('should not retry on 4xx errors', async () => {
    const error = new AxiosError('Not Found')
    error.response = { status: 404 } as any

    httpService.axiosRef.get.mockRejectedValue(error)

    await expect(client.getCustomer('customer-1')).rejects.toThrow()

    // Only 1 attempt (no retry)
    expect(httpService.axiosRef.get).toHaveBeenCalledTimes(1)
  })

  it('should retry on 5xx errors', async () => {
    const error = new AxiosError('Internal Server Error')
    error.response = { status: 500 } as any

    httpService.axiosRef.get
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ data: { id: 'customer-1' } })

    const result = await client.getCustomer('customer-1')

    expect(result).toEqual({ id: 'customer-1' })
    expect(httpService.axiosRef.get).toHaveBeenCalledTimes(3)
  })

  it('should respect max attempts', async () => {
    httpService.axiosRef.get.mockRejectedValue(new Error('Always fails'))

    await expect(client.getCustomer('customer-1')).rejects.toThrow()

    // 3 attempts (initial + 2 retries)
    expect(httpService.axiosRef.get).toHaveBeenCalledTimes(3)
  })
})
```

---

## Common Pitfalls

### 1. Retrying Non-Idempotent Operations

```typescript
// ❌ BAD: Could create duplicate invoices
async createInvoice(data: InvoiceData): Promise<Invoice> {
  return this.retryPolicy.execute(() =>
    this.httpService.post('/invoices', data)
  )
}

// ✅ GOOD: Use idempotency key
async createInvoice(data: InvoiceData): Promise<Invoice> {
  const idempotencyKey = generateIdempotencyKey(data.tenantId, data.customerId, Date.now())

  return this.retryPolicy.execute(() =>
    this.httpService.post('/invoices', data, {
      headers: { 'Idempotency-Key': idempotencyKey },
    })
  )
}
```

### 2. No Jitter (Thundering Herd)

```typescript
// ❌ BAD: All clients retry at exact same time
const retry = new ExponentialBackoff({
  initialDelay: 1000,
  maxDelay: 10000,
  jitter: 'none',  // No randomness
})

// ✅ GOOD: Add jitter to spread retries
const retry = new ExponentialBackoff({
  initialDelay: 1000,
  maxDelay: 10000,
  jitter: 'full',  // Random delay
})
```

### 3. Retrying Too Many Times

```typescript
// ❌ BAD: 20 attempts × 60s backoff = 20 minutes!
const retryPolicy = retry(handleAll, {
  maxAttempts: 20,
  backoff: new ExponentialBackoff({
    initialDelay: 1000,
    maxDelay: 60000,
  }),
})

// ✅ GOOD: Reasonable limits
const retryPolicy = retry(handleAll, {
  maxAttempts: 5,  // 3-5 is typical
  backoff: new ExponentialBackoff({
    initialDelay: 1000,
    maxDelay: 10000,
  }),
})
```

---

## Best Practices

✅ **Do**:
- Only retry transient failures (5xx, network errors, 429)
- Add jitter to prevent thundering herd
- Use idempotency keys for non-idempotent operations
- Set reasonable max attempts (3-5 typical)
- Log retry attempts with context
- Respect Retry-After headers (429 errors)
- Test retry behavior (unit + integration)

❌ **Don't**:
- Retry 4xx client errors (permanent failures)
- Retry non-idempotent operations without idempotency key
- Use too many attempts (>10 is excessive)
- Ignore maxDelay (prevent minutes-long retries)
- Retry inside database transactions (causes locks)
- Retry authentication failures automatically

---

## References

- Cockatiel Documentation: https://github.com/connor4312/cockatiel
- Exponential Backoff and Jitter: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
- Idempotency in APIs: https://stripe.com/docs/api/idempotent_requests
- Retry Pattern: https://learn.microsoft.com/en-us/azure/architecture/patterns/retry

---

**Compounding Effect**: Retry strategies enable automatic recovery from transient failures, reducing manual intervention and improving system reliability.
