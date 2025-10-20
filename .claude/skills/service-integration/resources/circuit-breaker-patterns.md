# Circuit Breaker Patterns

Complete guide for implementing circuit breaker pattern to prevent cascading failures in Vextrus ERP microservices.

---

## Overview

**Problem**: When external service fails, continuous retry attempts:
- Exhaust connection pools
- Block threads/event loop
- Cause cascading failures across 19 microservices
- Waste resources on guaranteed failures

**Solution**: Circuit breaker acts as electrical circuit breaker - "trips" when failures exceed threshold, preventing further calls.

**Library**: **Cockatiel** (recommended for TypeScript/NestJS)

---

## Pattern 1: Basic Circuit Breaker

### Installation

```bash
pnpm add cockatiel
```

### Implementation

```typescript
import { ConsecutiveBreaker } from 'cockatiel'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class MasterDataClient {
  private readonly logger = new Logger(MasterDataClient.name)

  // Circuit breaker with default settings
  private readonly breaker = new ConsecutiveBreaker({
    threshold: 5,           // Open after 5 consecutive failures
    halfOpenAfter: 30000,   // Try again after 30s
  })

  async getCustomer(customerId: string): Promise<Customer> {
    // Wrap HTTP call with circuit breaker
    return this.breaker.execute(async () => {
      const response = await this.httpService.axiosRef.get(
        `${this.masterDataUrl}/customers/${customerId}`
      )
      return response.data
    })
  }
}
```

**Circuit States**:
1. **Closed** (normal): Requests flow through, failures counted
2. **Open** (tripped): All requests fail immediately (fail fast)
3. **Half-Open** (testing): Allow 1 request to test recovery

**State Transitions**:
- Closed → Open: After threshold (5) consecutive failures
- Open → Half-Open: After halfOpenAfter timeout (30s)
- Half-Open → Closed: If test request succeeds
- Half-Open → Open: If test request fails

---

## Pattern 2: Sampling Circuit Breaker

**Use when**: Success rate more important than consecutive failures.

```typescript
import { SamplingBreaker } from 'cockatiel'

const breaker = new SamplingBreaker({
  threshold: 0.2,          // Open if 20% of requests fail
  duration: 10000,         // Sample window: 10s
  minimumRps: 5,           // Need 5 requests before evaluating
  halfOpenAfter: 30000,    // Try recovery after 30s
})

// Example: 10 requests in 10s window
// 2 failures = 20% failure rate → Circuit opens
```

**When to Use**:
- High-traffic services (>10 RPS)
- Variable failure patterns
- More sophisticated failure detection

**When NOT to Use**:
- Low-traffic services (<5 RPS) - use ConsecutiveBreaker

---

## Pattern 3: Circuit Breaker + Retry

**Combine circuit breaker with retry** for transient failures.

```typescript
import { ConsecutiveBreaker, retry, ExponentialBackoff, handleAll } from 'cockatiel'

@Injectable()
export class BankingIntegrationService {
  // Circuit breaker (outer layer)
  private readonly breaker = new ConsecutiveBreaker({
    threshold: 5,
    halfOpenAfter: 60000,  // Banks: longer recovery time
  })

  // Retry policy (inner layer)
  private readonly retryPolicy = retry(handleAll, {
    maxAttempts: 3,
    backoff: new ExponentialBackoff({
      initialDelay: 1000,
      maxDelay: 10000,
    }),
  })

  async fetchBankStatement(accountNumber: string): Promise<Statement> {
    // Circuit breaker wraps retry policy
    return this.breaker.execute(() =>
      this.retryPolicy.execute(async () => {
        const response = await this.httpService.axiosRef.post(
          `${this.bankApiUrl}/statements`,
          { accountNumber }
        )
        return response.data
      })
    )
  }
}
```

**Layering Strategy**:
1. **Inner**: Retry (handles transient failures)
2. **Outer**: Circuit breaker (prevents retry storms)

**Benefits**:
- Retry handles temporary issues (network blip)
- Circuit breaker prevents hammering dead service
- Best of both patterns

---

## Pattern 4: Per-Tenant Circuit Breakers

**Problem**: One tenant's failures shouldn't block all tenants.

**Solution**: Separate circuit breaker per tenant.

```typescript
@Injectable()
export class ExternalServiceClient {
  private readonly breakers = new Map<string, ConsecutiveBreaker>()

  private getBreakerForTenant(tenantId: string): ConsecutiveBreaker {
    if (!this.breakers.has(tenantId)) {
      this.breakers.set(
        tenantId,
        new ConsecutiveBreaker({
          threshold: 5,
          halfOpenAfter: 30000,
        })
      )
    }
    return this.breakers.get(tenantId)!
  }

  async callExternalService(tenantId: string, data: any): Promise<Response> {
    const breaker = this.getBreakerForTenant(tenantId)

    return breaker.execute(async () => {
      return this.httpService.axiosRef.post(
        `${this.externalUrl}/${tenantId}/data`,
        data
      )
    })
  }

  // Monitoring: Get state for all tenants
  getTenantCircuitStates(): Record<string, string> {
    const states: Record<string, string> = {}
    this.breakers.forEach((breaker, tenantId) => {
      states[tenantId] = breaker.state
    })
    return states
  }
}
```

**Use Cases**:
- Multi-tenant SaaS
- Per-customer API quotas
- Isolate tenant failures

---

## Pattern 5: Fallback on Circuit Open

**Pattern**: Provide fallback behavior when circuit is open.

```typescript
import { BrokenCircuitError } from 'cockatiel'

async getCustomerWithFallback(customerId: string): Promise<Customer | null> {
  try {
    return await this.breaker.execute(() =>
      this.httpService.axiosRef.get(`${this.masterDataUrl}/customers/${customerId}`)
    )
  } catch (error) {
    if (error instanceof BrokenCircuitError) {
      this.logger.warn('Circuit breaker open, returning cached customer', {
        customerId,
      })

      // Fallback: Return stale cache
      const cached = await this.cacheService.get(`customer:${customerId}`)
      if (cached) return cached

      // Fallback: Return null (caller handles)
      return null
    }

    // Other errors: re-throw
    throw error
  }
}
```

**Fallback Strategies**:
1. **Stale cache**: Return cached data (better than nothing)
2. **Default values**: Return safe defaults
3. **Degraded mode**: Disable non-critical features
4. **Alternative service**: Try backup endpoint
5. **Null/error**: Let caller decide

---

## Pattern 6: Circuit Breaker Monitoring

**Expose circuit breaker state** for monitoring and alerts.

### Health Check Integration

```typescript
import { Injectable } from '@nestjs/common'
import { HealthIndicatorResult } from '@nestjs/terminus'

@Injectable()
export class HealthService {
  constructor(
    private readonly masterDataClient: MasterDataClient,
    private readonly bankingClient: BankingIntegrationService
  ) {}

  async checkCircuitBreakers(): Promise<HealthIndicatorResult> {
    const states = {
      masterData: this.masterDataClient.getCircuitBreakerState(),
      banking: this.bankingClient.getCircuitBreakerState(),
    }

    const allClosed = Object.values(states).every(state => state === 'closed')

    return {
      circuitBreakers: {
        status: allClosed ? 'up' : 'down',
        states,
      },
    }
  }
}
```

### Prometheus Metrics

```typescript
import { Injectable } from '@nestjs/common'
import { Counter, Gauge } from 'prom-client'

@Injectable()
export class CircuitBreakerMetrics {
  private readonly stateGauge = new Gauge({
    name: 'circuit_breaker_state',
    help: 'Circuit breaker state (0=closed, 1=half-open, 2=open)',
    labelNames: ['service'],
  })

  private readonly openCounter = new Counter({
    name: 'circuit_breaker_opened_total',
    help: 'Total times circuit breaker opened',
    labelNames: ['service'],
  })

  updateState(service: string, state: string): void {
    const stateValue = { closed: 0, 'half-open': 1, open: 2 }[state] || 0
    this.stateGauge.set({ service }, stateValue)

    if (state === 'open') {
      this.openCounter.inc({ service })
    }
  }
}
```

---

## Pattern 7: Event-Driven Circuit Breaker

**Trigger circuit manually** based on external events.

```typescript
@Injectable()
export class ExternalServiceClient {
  private readonly breaker = new ConsecutiveBreaker({
    threshold: 5,
    halfOpenAfter: 30000,
  })

  constructor(private readonly eventBus: EventBus) {
    // Listen for service health events
    this.eventBus.on('external-service-down', () => {
      this.logger.warn('Manually opening circuit due to external event')
      this.breaker.isolate()  // Force circuit open
    })

    this.eventBus.on('external-service-recovered', () => {
      this.logger.log('Closing circuit due to recovery event')
      this.breaker.shutdown()  // Reset circuit
    })
  }
}
```

**Use Cases**:
- Manual intervention during incidents
- Scheduled maintenance windows
- External monitoring triggers

---

## Configuration Best Practices

### Timeout Selection

```typescript
// Fast internal services (auth, lookups)
const fastBreaker = new ConsecutiveBreaker({
  threshold: 3,          // Fail faster
  halfOpenAfter: 10000,  // Recover faster (10s)
})

// Standard internal services
const standardBreaker = new ConsecutiveBreaker({
  threshold: 5,
  halfOpenAfter: 30000,  // 30s
})

// External services (banks, government APIs)
const externalBreaker = new ConsecutiveBreaker({
  threshold: 10,         // More lenient (external issues common)
  halfOpenAfter: 60000,  // Longer recovery (60s)
})

// Critical dependencies
const criticalBreaker = new ConsecutiveBreaker({
  threshold: 2,          // Extremely sensitive
  halfOpenAfter: 5000,   // Fast recovery attempt (5s)
})
```

### Threshold Guidelines

| Service Type | Threshold | Half-Open After | Rationale |
|--------------|-----------|-----------------|-----------|
| Internal Fast | 3-5 | 10-30s | Should never fail |
| Internal Standard | 5-10 | 30s | Occasional failures OK |
| External APIs | 10-20 | 60-120s | Variable reliability |
| Critical Dependencies | 2-3 | 5-10s | Zero tolerance |

---

## Testing

### Unit Test Circuit Breaker

```typescript
describe('MasterDataClient Circuit Breaker', () => {
  let client: MasterDataClient
  let httpService: jest.Mocked<HttpService>

  beforeEach(() => {
    httpService = {
      axiosRef: {
        get: jest.fn(),
      },
    } as any

    client = new MasterDataClient(httpService)
  })

  it('should open circuit after threshold failures', async () => {
    // Mock 5 consecutive failures
    httpService.axiosRef.get.mockRejectedValue(new Error('Service down'))

    // Trigger 5 failures
    for (let i = 0; i < 5; i++) {
      await expect(client.getCustomer('customer-1')).rejects.toThrow()
    }

    // Circuit should be open
    expect(client.getCircuitBreakerState()).toBe('open')

    // Next call should fail immediately (BrokenCircuitError)
    await expect(client.getCustomer('customer-2')).rejects.toThrow(BrokenCircuitError)

    // HTTP not called (circuit open)
    expect(httpService.axiosRef.get).toHaveBeenCalledTimes(5) // Not 6
  })

  it('should transition to half-open after timeout', async () => {
    jest.useFakeTimers()

    // Open circuit
    httpService.axiosRef.get.mockRejectedValue(new Error('Service down'))
    for (let i = 0; i < 5; i++) {
      await expect(client.getCustomer('customer-1')).rejects.toThrow()
    }

    expect(client.getCircuitBreakerState()).toBe('open')

    // Advance time by 30s
    jest.advanceTimersByTime(30000)

    // Circuit should transition to half-open
    expect(client.getCircuitBreakerState()).toBe('half-open')

    jest.useRealTimers()
  })

  it('should close circuit after successful half-open request', async () => {
    // Open circuit
    httpService.axiosRef.get.mockRejectedValue(new Error('Service down'))
    for (let i = 0; i < 5; i++) {
      await expect(client.getCustomer('customer-1')).rejects.toThrow()
    }

    // Wait for half-open
    jest.useFakeTimers()
    jest.advanceTimersByTime(30000)

    // Successful request in half-open state
    httpService.axiosRef.get.mockResolvedValue({ data: { id: 'customer-1' } })
    const result = await client.getCustomer('customer-1')

    expect(result).toEqual({ id: 'customer-1' })
    expect(client.getCircuitBreakerState()).toBe('closed')

    jest.useRealTimers()
  })
})
```

---

## Common Pitfalls

### 1. Threshold Too Low

```typescript
// ❌ BAD: Opens on first failure
const breaker = new ConsecutiveBreaker({ threshold: 1 })

// ✅ GOOD: Allow for transient issues
const breaker = new ConsecutiveBreaker({ threshold: 5 })
```

### 2. No Fallback Strategy

```typescript
// ❌ BAD: Circuit open = total failure
async getData(id: string): Promise<Data> {
  return this.breaker.execute(() => this.httpService.get(url))
}

// ✅ GOOD: Graceful degradation
async getData(id: string): Promise<Data | null> {
  try {
    return await this.breaker.execute(() => this.httpService.get(url))
  } catch (error) {
    if (error instanceof BrokenCircuitError) {
      return this.cacheService.get(id) // Fallback
    }
    throw error
  }
}
```

### 3. Circuit Breaker on Non-Idempotent Operations

```typescript
// ❌ BAD: Payment might be double-charged
async processPayment(amount: number): Promise<Payment> {
  return this.breaker.execute(() =>
    this.retryPolicy.execute(() => this.paymentGateway.charge(amount))
  )
}

// ✅ GOOD: Use idempotency key
async processPayment(amount: number, idempotencyKey: string): Promise<Payment> {
  return this.breaker.execute(() =>
    this.paymentGateway.charge(amount, { idempotencyKey })
  )
}
```

---

## Best Practices

✅ **Do**:
- Use circuit breaker for ALL external service calls
- Combine with retry for transient failures
- Provide fallback strategy (cache, defaults, null)
- Monitor circuit breaker state (health checks, metrics)
- Configure per service type (internal vs external)
- Test circuit breaker behavior (unit + integration tests)
- Use per-tenant circuit breakers for isolation

❌ **Don't**:
- Set threshold too low (opens on first failure)
- Use circuit breaker for database queries (use connection pooling)
- Retry inside circuit breaker (layer correctly: retry inside, circuit outside)
- Ignore BrokenCircuitError (provide fallback)
- Use same settings for all services
- Open circuit for 4xx client errors (permanent failures)

---

## References

- Cockatiel Documentation: https://github.com/connor4312/cockatiel
- Circuit Breaker Pattern: https://martinfowler.com/bliki/CircuitBreaker.html
- Release It! (Michael Nygard): Circuit Breaker Pattern
- Netflix Hystrix (inspiration): https://github.com/Netflix/Hystrix/wiki

---

**Compounding Effect**: Circuit breakers prevent cascading failures across 19 microservices, enabling resilient production systems.
