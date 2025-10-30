---
name: Service Integration
description: When implementing cross-service communication, external API calls, or integrating microservices, activate this skill to enforce circuit breaker patterns, retry strategies, timeout configurations, and graceful degradation. Use when user says "integration", "external service", "HTTP client", "circuit breaker", "retry", "timeout", or when working with service clients and API integrations.
knowledge_base:
  - sessions/knowledge/vextrus-erp/patterns/service-integration-patterns.md
  - sessions/knowledge/vextrus-erp/checklists/quality-gates.md
---

# Service Integration Skill

**Purpose**: Reliable cross-service communication with circuit breakers, retries, and graceful degradation.

**Addresses**: External service failures, network timeouts, cascading failures, retry storms, N+1 HTTP requests.

**Evidence**:
- Master Data Client (GraphQL + REST dual protocol)
- Workflow Client (Temporal SDK)
- Banking/NBR integration services
- **Gap**: No circuit breaker implementation (critical need)
- **Gap**: Ad-hoc retry logic (needs centralization)
- DataLoader for N+1 prevention (production-ready)

---

## Quick Reference

| Pattern | When to Use | Key Benefit |
|---------|-------------|-------------|
| **Circuit Breaker** | External service calls | Prevent cascading failures |
| **Retry with Backoff** | Transient failures | Automatic recovery |
| **Timeout Configuration** | All HTTP requests | Prevent hanging requests |
| **Graceful Degradation** | Non-critical dependencies | Maintain core functionality |
| **Health Checks** | Service dependencies | Early failure detection |
| **Correlation IDs** | Distributed tracing | Track requests across services |

---

## Pattern 1: Circuit Breaker (Critical - Not Yet Implemented)

**Problem**: When external service fails, continuous retry attempts cause cascading failures and resource exhaustion.

**Solution**: Implement circuit breaker pattern with Cockatiel library.

### Installation

```bash
pnpm add cockatiel
```

### Implementation

```typescript
import { ConsecutiveBreaker, ExponentialBackoff, handleAll, retry, circuitBreaker } from 'cockatiel'
import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'

@Injectable()
export class MasterDataClient {
  private readonly logger = new Logger(MasterDataClient.name)

  // Circuit breaker configuration
  private readonly breaker = new ConsecutiveBreaker({
    threshold: 5,           // Open after 5 consecutive failures
    halfOpenAfter: 30000,   // Try again after 30s
  })

  // Retry policy with exponential backoff
  private readonly retryPolicy = retry(
    handleAll,
    {
      maxAttempts: 3,
      backoff: new ExponentialBackoff({
        initialDelay: 1000,  // 1s
        maxDelay: 10000,     // 10s
        factor: 2,
      }),
    }
  )

  constructor(private readonly httpService: HttpService) {}

  async getCustomer(customerId: string): Promise<Customer> {
    // Wrap with circuit breaker + retry
    return this.breaker.execute(async () => {
      return this.retryPolicy.execute(async () => {
        const response = await this.httpService.axiosRef.get(
          `${this.masterDataUrl}/customers/${customerId}`,
          { timeout: 5000 }
        )
        return response.data
      })
    })
  }

  // Circuit breaker state monitoring
  getCircuitBreakerState(): string {
    return this.breaker.state // 'closed' | 'open' | 'half-open'
  }
}
```

**Circuit States**:
- **Closed**: Normal operation, requests flow through
- **Open**: Threshold reached, reject requests immediately (fail fast)
- **Half-Open**: Test if service recovered, allow 1 request

**Benefits**:
- Prevent cascading failures across 19 microservices
- Fail fast when service is down (no resource waste)
- Automatic recovery detection
- Metrics for monitoring

**See**: resources/circuit-breaker-patterns.md for complete implementation.

---

## Pattern 2: Retry Strategies with Exponential Backoff

**Problem**: Transient network failures need automatic retry, but constant retries cause retry storms.

**Solution**: Exponential backoff with jitter.

### Basic Retry Pattern

```typescript
import { retry, ExponentialBackoff, handleType } from 'cockatiel'

@Injectable()
export class BankingIntegrationService {
  // Retry configuration for transient failures only
  private readonly retryPolicy = retry(
    handleType(AxiosError, (err) => {
      // Retry only on network errors and 5xx server errors
      return !err.response || err.response.status >= 500
    }),
    {
      maxAttempts: 3,
      backoff: new ExponentialBackoff({
        initialDelay: 1000,  // 1s
        maxDelay: 30000,     // 30s
        factor: 2,
        jitter: 'full',      // Add randomness to prevent thundering herd
      }),
    }
  )

  async fetchBankStatement(accountNumber: string): Promise<Statement> {
    return this.retryPolicy.execute(async () => {
      this.logger.debug(`Fetching bank statement for ${accountNumber}`)

      const response = await this.httpService.axiosRef.post(
        `${this.bankApiUrl}/statements`,
        { accountNumber },
        { timeout: 10000 }  // Banks can be slow
      )

      return response.data
    })
  }
}
```

### When NOT to Retry

**Don't retry**:
- 4xx client errors (400, 401, 403, 404) → Permanent failures
- Business validation errors
- Idempotency key conflicts
- Authentication failures

**Only retry**:
- Network errors (ECONNRESET, ETIMEDOUT)
- 5xx server errors (500, 502, 503, 504)
- Rate limit errors (429) with backoff

**See**: resources/retry-strategies.md for complete patterns.

---

## Pattern 3: Timeout Configuration Strategy

**Problem**: One-size-fits-all 5s timeout doesn't fit all service types.

**Solution**: Per-service timeout configuration based on SLA.

### Timeout Tiers

```typescript
// config/timeout.config.ts
export const TimeoutConfig = {
  // Fast internal services (<100ms expected)
  INTERNAL_FAST: 2000,        // 2s (auth, master-data lookups)

  // Standard internal services (100-500ms expected)
  INTERNAL_STANDARD: 5000,    // 5s (most microservices)

  // Heavy internal operations (reports, aggregations)
  INTERNAL_HEAVY: 15000,      // 15s (reporting service)

  // External APIs (variable latency)
  EXTERNAL_STANDARD: 10000,   // 10s (banking, NBR)

  // Async operations (webhook responses)
  EXTERNAL_ASYNC: 30000,      // 30s (payment gateways)
}

@Injectable()
export class MasterDataClient {
  async getCustomer(customerId: string): Promise<Customer> {
    // Fast lookup - 2s timeout
    return this.httpService.axiosRef.get(
      `${this.masterDataUrl}/customers/${customerId}`,
      { timeout: TimeoutConfig.INTERNAL_FAST }
    )
  }
}

@Injectable()
export class NBRIntegrationService {
  async submitVATReturn(data: VATReturn): Promise<Submission> {
    // External government API - 10s timeout
    return this.httpService.axiosRef.post(
      `${this.nbrApiUrl}/vat-return`,
      data,
      { timeout: TimeoutConfig.EXTERNAL_STANDARD }
    )
  }
}
```

**Timeout Guidelines**:
- **<2s**: Internal fast services (auth, lookups)
- **2-5s**: Standard internal services
- **5-15s**: Heavy operations, external APIs
- **15-30s**: Async webhooks, payment gateways
- **>30s**: Use async patterns (Temporal workflows)

---

## Pattern 4: Graceful Degradation

**Problem**: Critical service fails → entire feature unusable.

**Solution**: Degrade gracefully, maintain core functionality.

### Master Data Client Example

```typescript
@Injectable()
export class MasterDataClient {
  async getCustomerWithFallback(customerId: string): Promise<Customer | null> {
    try {
      // Try primary GraphQL endpoint
      return await this.getCustomerViaGraphQL(customerId)
    } catch (error) {
      this.logger.warn('GraphQL fetch failed, trying REST fallback', {
        customerId,
        error: error.message,
      })

      try {
        // Fallback to REST endpoint
        return await this.getCustomerViaREST(customerId)
      } catch (restError) {
        this.logger.error('Both GraphQL and REST failed', {
          customerId,
          errors: [error.message, restError.message],
        })

        // Return cached version if available
        const cached = await this.cacheService.get(`customer:${customerId}`)
        if (cached) {
          this.logger.warn('Returning stale cached customer', { customerId })
          return cached
        }

        // Ultimate fallback: return null (caller handles)
        return null
      }
    }
  }

  async validateTIN(tin: string): Promise<ValidationResult> {
    try {
      // Try external NBR validation
      return await this.nbrClient.validateTIN(tin)
    } catch (error) {
      this.logger.warn('NBR validation unavailable, using format validation', {
        tin,
        error: error.message,
      })

      // Fallback: Format-only validation
      return {
        isValid: this.validateTINFormat(tin),
        source: 'format_validation',
        errors: ['External validation service unavailable'],
      }
    }
  }
}
```

**Fallback Strategies**:
1. **Alternative endpoint**: GraphQL → REST fallback
2. **Stale cache**: Return cached data with warning
3. **Format validation**: Validate structure without external call
4. **Default values**: Return safe defaults
5. **Null/empty**: Return null, let caller decide

---

## Pattern 5: Health Checks for Dependencies

**Problem**: Service appears healthy but dependencies are failing.

**Solution**: Comprehensive health checks including dependencies.

### Implementation

```typescript
import { Injectable } from '@nestjs/common'
import { HealthCheckService, HttpHealthIndicator, TypeOrmHealthIndicator } from '@nestjs/terminus'

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly db: TypeOrmHealthIndicator,
    private readonly masterDataClient: MasterDataClient
  ) {}

  // Kubernetes liveness probe (service itself)
  @Get('health/live')
  checkLiveness() {
    return this.health.check([
      // Just check if app is running
      () => ({ status: 'up' }),
    ])
  }

  // Kubernetes readiness probe (dependencies)
  @Get('health/ready')
  checkReadiness() {
    return this.health.check([
      // Database connectivity
      () => this.db.pingCheck('database'),

      // Master data service
      () => this.http.pingCheck(
        'master-data',
        `${process.env.MASTER_DATA_SERVICE_URL}/health`
      ),

      // EventStore connection
      () => this.checkEventStoreConnection(),

      // Circuit breaker state
      () => this.checkCircuitBreakerState(),
    ])
  }

  // Comprehensive health check
  @Get('health')
  checkHealth() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.http.pingCheck('master-data', `${this.masterDataUrl}/health`),
      () => this.checkEventStoreConnection(),
      () => this.checkCircuitBreakerState(),
      () => this.checkCacheConnection(),
    ])
  }

  private async checkCircuitBreakerState(): Promise<HealthIndicatorResult> {
    const state = this.masterDataClient.getCircuitBreakerState()

    return {
      circuitBreaker: {
        status: state === 'open' ? 'down' : 'up',
        state,
      },
    }
  }
}
```

**Health Check Levels**:
- **Liveness**: Is the service running? (restart if fails)
- **Readiness**: Can service handle requests? (remove from load balancer if fails)
- **Comprehensive**: Full dependency check (monitoring/alerts)

---

## Pattern 6: Correlation ID Propagation

**Problem**: Can't trace requests across 19 microservices.

**Solution**: Propagate correlation ID in all outgoing requests.

### Implementation

```typescript
@Injectable()
export class MasterDataClient {
  constructor(
    private readonly httpService: HttpService,
    @Inject('CORRELATION_ID') private readonly correlationId: string
  ) {}

  async getCustomer(customerId: string, context: RequestContext): Promise<Customer> {
    const headers = {
      'x-correlation-id': context.correlationId,
      'x-tenant-id': context.tenantId,
      'authorization': `Bearer ${context.accessToken}`,
    }

    const response = await this.httpService.axiosRef.get(
      `${this.masterDataUrl}/customers/${customerId}`,
      { headers }
    )

    this.logger.log('Customer fetched', {
      correlationId: context.correlationId,
      customerId,
      duration: response.headers['x-response-time'],
    })

    return response.data
  }
}
```

**Headers to Propagate**:
- `x-correlation-id`: Unique request ID
- `x-tenant-id`: Multi-tenant context
- `authorization`: JWT token
- `x-request-id`: Alternative to correlation-id
- `traceparent`: W3C Trace Context (OpenTelemetry)

---

## Integration Points

### With Error Handling & Observability Skill
- Circuit breaker failures → Custom exceptions (ServiceUnavailableException)
- Correlation ID propagation for distributed tracing
- OpenTelemetry spans for external calls
- Structured logging with retry attempts

### With Performance & Caching Skill
- Cache external API responses (stale-while-revalidate)
- DataLoader for N+1 prevention in service calls
- Connection pooling for HTTP clients
- Response compression

### With Security-First Skill
- JWT token propagation in headers
- Tenant ID validation before external calls
- API key management for external services
- TLS/SSL for all external communication

### With Multi-Tenancy Skill
- Tenant context propagation in x-tenant-id header
- Per-tenant circuit breakers (isolated failures)
- Tenant-scoped rate limiting

---

## Quality Checklist

Before completing task:
- [ ] Circuit breaker configured for external service calls
- [ ] Retry policy defined (max attempts, backoff strategy)
- [ ] Timeout appropriate for service type (2s/5s/10s/30s)
- [ ] Graceful degradation strategy defined
- [ ] Health check includes dependency checks
- [ ] Correlation ID propagated in headers
- [ ] Only transient failures retried (not 4xx errors)
- [ ] Circuit breaker state exposed for monitoring
- [ ] Stale cache used as fallback
- [ ] Error scenarios tested (network failure, timeout, 5xx errors)

---

## Service Client Template

```typescript
import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConsecutiveBreaker, ExponentialBackoff, retry, handleAll } from 'cockatiel'
import { CacheService } from '@vextrus/shared/cache'

@Injectable()
export class ExternalServiceClient {
  private readonly logger = new Logger(ExternalServiceClient.name)

  private readonly breaker = new ConsecutiveBreaker({
    threshold: 5,
    halfOpenAfter: 30000,
  })

  private readonly retryPolicy = retry(handleAll, {
    maxAttempts: 3,
    backoff: new ExponentialBackoff({ initialDelay: 1000, maxDelay: 10000 }),
  })

  constructor(
    private readonly httpService: HttpService,
    private readonly cacheService: CacheService
  ) {}

  async fetchData(id: string, context: RequestContext): Promise<Data> {
    const cacheKey = `external-service:${id}`

    // Try circuit breaker + retry
    try {
      return await this.breaker.execute(() =>
        this.retryPolicy.execute(async () => {
          this.logger.debug('Fetching from external service', {
            correlationId: context.correlationId,
            id,
          })

          const response = await this.httpService.axiosRef.get(
            `${this.serviceUrl}/data/${id}`,
            {
              headers: {
                'x-correlation-id': context.correlationId,
                'x-tenant-id': context.tenantId,
              },
              timeout: 5000,
            }
          )

          // Cache successful response
          await this.cacheService.set(cacheKey, response.data, 300)

          return response.data
        })
      )
    } catch (error) {
      this.logger.error('External service call failed', {
        correlationId: context.correlationId,
        id,
        error: error.message,
        circuitBreakerState: this.breaker.state,
      })

      // Fallback to cache
      const cached = await this.cacheService.get(cacheKey)
      if (cached) {
        this.logger.warn('Returning stale cached data', { id })
        return cached
      }

      throw new ServiceUnavailableException('external-service', error)
    }
  }

  getHealthStatus() {
    return {
      circuitBreakerState: this.breaker.state,
      isHealthy: this.breaker.state !== 'open',
    }
  }
}
```

---

## Service Examples

**Reference Implementations**:
- **Master Data Client**: `services/finance/src/infrastructure/integrations/master-data.client.ts` (GraphQL + REST dual protocol)
- **Workflow Client**: `services/finance/src/infrastructure/integrations/workflow.client.ts` (Temporal SDK)
- **Banking Integration**: `services/finance/src/application/services/banking-integration.service.ts`
- **Health Controller**: `services/finance/src/presentation/health/health.controller.ts`

**Evidence**:
- Dual protocol support (GraphQL + REST)
- DataLoader for N+1 prevention (100x reduction)
- **Gap**: Circuit breaker not implemented (critical)
- **Gap**: Ad-hoc retry logic needs centralization

---

## External Resources

- Cockatiel (Circuit Breaker): https://github.com/connor4312/cockatiel
- NestJS Terminus (Health Checks): https://docs.nestjs.com/recipes/terminus
- Axios HTTP Client: https://axios-http.com/docs/req_config
- Circuit Breaker Pattern: https://martinfowler.com/bliki/CircuitBreaker.html
- Retry Patterns: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/

---

**Compounding Effect**: Service integration patterns prevent cascading failures and enable 19 microservices to operate reliably in production.
