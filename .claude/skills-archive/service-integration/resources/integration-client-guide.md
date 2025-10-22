# Integration Client Guide

Complete guide for building production-ready service clients with circuit breakers, retries, timeouts, and graceful degradation.

---

## Overview

**Purpose**: Standardized approach for all external service integrations in Vextrus ERP.

**Key Patterns**:
1. Circuit Breaker (prevent cascading failures)
2. Retry with Exponential Backoff (handle transient failures)
3. Timeout Configuration (prevent hanging requests)
4. Graceful Degradation (fallback strategies)
5. Health Checks (dependency monitoring)
6. Correlation ID Propagation (distributed tracing)

---

## Pattern 1: Complete Service Client Template

### Production-Ready Client

```typescript
import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConsecutiveBreaker, ExponentialBackoff, retry, timeout, handleType } from 'cockatiel'
import { AxiosError } from 'axios'
import { CacheService } from '@vextrus/shared/cache'

@Injectable()
export class MasterDataClient {
  private readonly logger = new Logger(MasterDataClient.name)
  private readonly serviceUrl = process.env.MASTER_DATA_SERVICE_URL

  // Circuit breaker
  private readonly breaker = new ConsecutiveBreaker({
    threshold: 5,
    halfOpenAfter: 30000,
  })

  // Retry policy (only transient failures)
  private readonly retryPolicy = retry(
    handleType(AxiosError, (err) => {
      // Retry network errors and 5xx
      return !err.response || err.response.status >= 500 || err.response.status === 429
    }),
    {
      maxAttempts: 3,
      backoff: new ExponentialBackoff({
        initialDelay: 1000,
        maxDelay: 10000,
        factor: 2,
        jitter: 'full',
      }),
    }
  )

  // Timeout policy
  private readonly timeoutPolicy = timeout(5000) // 5s

  constructor(
    private readonly httpService: HttpService,
    private readonly cacheService: CacheService
  ) {}

  async getCustomer(
    customerId: string,
    context: RequestContext
  ): Promise<Customer | null> {
    const cacheKey = `customer:${context.tenantId}:${customerId}`

    try {
      // Execute with circuit breaker → retry → timeout
      return await this.breaker.execute(() =>
        this.retryPolicy.execute(() =>
          this.timeoutPolicy.execute(async () => {
            this.logger.debug('Fetching customer', {
              correlationId: context.correlationId,
              customerId,
            })

            const response = await this.httpService.axiosRef.get(
              `${this.serviceUrl}/customers/${customerId}`,
              {
                headers: {
                  'x-correlation-id': context.correlationId,
                  'x-tenant-id': context.tenantId,
                  'authorization': `Bearer ${context.accessToken}`,
                },
              }
            )

            // Cache successful response
            await this.cacheService.set(cacheKey, response.data, 300)

            return response.data
          })
        )
      )
    } catch (error) {
      this.logger.error('Failed to fetch customer', {
        correlationId: context.correlationId,
        customerId,
        error: error.message,
        circuitState: this.breaker.state,
      })

      // Fallback: Return stale cache
      const cached = await this.cacheService.get<Customer>(cacheKey)
      if (cached) {
        this.logger.warn('Returning stale cached customer', { customerId })
        return cached
      }

      // No fallback available
      if (error.response?.status === 404) {
        return null // Not found is OK
      }

      throw new ServiceUnavailableException('master-data', error)
    }
  }

  // Health check
  getHealthStatus() {
    return {
      circuitBreakerState: this.breaker.state,
      isHealthy: this.breaker.state !== 'open',
    }
  }
}
```

---

## Pattern 2: Dual Protocol Client (GraphQL + REST)

**Use Case**: Master Data service supports both GraphQL (preferred) and REST (fallback).

```typescript
import { Injectable } from '@nestjs/common'
import { ApolloClient, gql } from '@apollo/client/core'

@Injectable()
export class MasterDataClient {
  constructor(
    private readonly apolloClient: ApolloClient<any>,
    private readonly httpService: HttpService
  ) {}

  async getCustomer(customerId: string): Promise<Customer> {
    try {
      // Try GraphQL first (preferred)
      return await this.getCustomerViaGraphQL(customerId)
    } catch (graphqlError) {
      this.logger.warn('GraphQL failed, falling back to REST', {
        customerId,
        error: graphqlError.message,
      })

      try {
        // Fallback to REST
        return await this.getCustomerViaREST(customerId)
      } catch (restError) {
        this.logger.error('Both GraphQL and REST failed', {
          customerId,
          errors: [graphqlError.message, restError.message],
        })

        throw new ServiceUnavailableException('master-data')
      }
    }
  }

  private async getCustomerViaGraphQL(customerId: string): Promise<Customer> {
    const result = await this.apolloClient.query({
      query: gql`
        query GetCustomer($id: ID!) {
          customer(id: $id) {
            id
            name
            email
            phone
          }
        }
      `,
      variables: { id: customerId },
    })

    return result.data.customer
  }

  private async getCustomerViaREST(customerId: string): Promise<Customer> {
    const response = await this.httpService.axiosRef.get(
      `${this.serviceUrl}/customers/${customerId}`
    )

    return response.data
  }
}
```

---

## Pattern 3: Batch Operations with DataLoader

**Prevent N+1 queries** when fetching related entities.

```typescript
import DataLoader from 'dataloader'
import { Injectable, Scope } from '@nestjs/common'

@Injectable({ scope: Scope.REQUEST }) // CRITICAL
export class MasterDataDataLoader {
  private readonly customerLoader: DataLoader<string, Customer>

  constructor(private readonly client: MasterDataClient) {
    this.customerLoader = new DataLoader(
      async (customerIds: readonly string[]) => {
        this.logger.debug(`Batching ${customerIds.length} customer requests`)

        // Single HTTP request for all customers
        const customers = await this.client.getCustomersByIds(
          Array.from(customerIds)
        )

        // Map and order results
        const customerMap = new Map(customers.map(c => [c.id, c]))
        return customerIds.map(id => customerMap.get(id) || null)
      },
      {
        batchScheduleFn: (callback) => setTimeout(callback, 10), // 10ms window
        maxBatchSize: 100,
      }
    )
  }

  async loadCustomer(customerId: string): Promise<Customer | null> {
    return this.customerLoader.load(customerId)
  }
}
```

**Usage in GraphQL Resolver**:
```typescript
@ResolveField(() => CustomerDto)
async customer(@Parent() invoice: InvoiceDto): Promise<CustomerDto | null> {
  return this.dataLoader.loadCustomer(invoice.customerId)
}
```

**Performance**: 100 invoices → 1 batched request (100x reduction)

---

## Pattern 4: External API Integration (Banking)

**Challenge**: External APIs are slow, unreliable, and have rate limits.

```typescript
@Injectable()
export class BankingIntegrationService {
  // More lenient circuit breaker for external APIs
  private readonly breaker = new ConsecutiveBreaker({
    threshold: 10,  // Higher threshold (external issues common)
    halfOpenAfter: 60000,  // Longer recovery (60s)
  })

  // More aggressive retry for banking APIs
  private readonly retryPolicy = retry(
    handleType(AxiosError, (err) => {
      // Retry 5xx and 429 only
      return !err.response || err.response.status >= 500 || err.response.status === 429
    }),
    {
      maxAttempts: 5,  // More attempts
      backoff: new ExponentialBackoff({
        initialDelay: 2000,  // Start slower
        maxDelay: 30000,     // Up to 30s
        factor: 2,
        jitter: 'full',
      }),
    }
  )

  // Longer timeout for banking APIs
  private readonly timeoutPolicy = timeout(15000) // 15s

  async fetchBankStatement(
    accountNumber: string,
    dateRange: DateRange
  ): Promise<BankStatement> {
    return this.breaker.execute(() =>
      this.retryPolicy.execute(() =>
        this.timeoutPolicy.execute(async () => {
          this.logger.log('Fetching bank statement', {
            accountNumber: maskAccountNumber(accountNumber),
            dateRange,
          })

          const response = await this.httpService.axiosRef.post(
            `${this.bankApiUrl}/statements`,
            {
              accountNumber,
              startDate: dateRange.start,
              endDate: dateRange.end,
            },
            {
              headers: {
                'Authorization': `Bearer ${this.bankApiKey}`,
                'X-Bank-Client-ID': this.bankClientId,
              },
            }
          )

          return this.transformBankStatement(response.data)
        })
      )
    )
  }

  // Graceful degradation for non-critical features
  async getAccountBalance(accountNumber: string): Promise<number | null> {
    try {
      const response = await this.breaker.execute(() =>
        this.httpService.axiosRef.get(
          `${this.bankApiUrl}/accounts/${accountNumber}/balance`
        )
      )

      return response.data.balance
    } catch (error) {
      this.logger.warn('Failed to fetch account balance, continuing without it', {
        accountNumber: maskAccountNumber(accountNumber),
        error: error.message,
      })

      // Non-critical: Return null instead of failing
      return null
    }
  }
}
```

---

## Pattern 5: Workflow Orchestration (Temporal)

**Temporal workflows** for long-running operations.

```typescript
import { Injectable } from '@nestjs/common'
import { Client, WorkflowClient } from '@temporalio/client'

@Injectable()
export class WorkflowClient {
  private readonly client: WorkflowClient

  constructor() {
    this.client = new Client({
      namespace: 'vextrus-erp',
      connection: {
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
      },
    })
  }

  async startInvoiceApprovalWorkflow(
    invoiceId: string,
    tenantId: string
  ): Promise<string> {
    const workflowId = `invoice-approval-${invoiceId}`

    try {
      const handle = await this.client.workflow.start('invoiceApproval', {
        taskQueue: 'finance-workflows',
        workflowId,
        args: [{ invoiceId, tenantId }],
        workflowIdReusePolicy: 'REJECT_DUPLICATE',
      })

      this.logger.log('Invoice approval workflow started', {
        invoiceId,
        workflowId: handle.workflowId,
        runId: handle.firstExecutionRunId,
      })

      return handle.workflowId
    } catch (error) {
      this.logger.error('Failed to start workflow', {
        invoiceId,
        error: error.message,
      })

      throw new WorkflowStartException('invoice-approval', error)
    }
  }

  async getWorkflowStatus(workflowId: string): Promise<WorkflowStatus> {
    try {
      const handle = this.client.workflow.getHandle(workflowId)
      const execution = await handle.describe()

      return {
        workflowId,
        status: execution.status.name,
        startTime: execution.startTime,
      }
    } catch (error) {
      if (error.message.includes('not found')) {
        return { workflowId, status: 'NOT_FOUND' }
      }

      throw error
    }
  }
}
```

---

## Pattern 6: Health Check with Dependency Validation

**Comprehensive health checks** for all service dependencies.

```typescript
import { Injectable } from '@nestjs/common'
import { HealthCheckService, HttpHealthIndicator, TypeOrmHealthIndicator } from '@nestjs/terminus'

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly db: TypeOrmHealthIndicator,
    private readonly masterDataClient: MasterDataClient,
    private readonly workflowClient: WorkflowClient,
    private readonly bankingClient: BankingIntegrationService
  ) {}

  @Get('health/live')
  checkLiveness() {
    // Simple liveness check (is service running?)
    return { status: 'ok' }
  }

  @Get('health/ready')
  checkReadiness() {
    // Readiness check (can handle requests?)
    return this.health.check([
      // Database
      () => this.db.pingCheck('database'),

      // Master data service
      () => this.http.pingCheck(
        'master-data',
        `${process.env.MASTER_DATA_SERVICE_URL}/health`
      ),

      // Circuit breakers
      () => this.checkCircuitBreakers(),
    ])
  }

  @Get('health')
  checkHealth() {
    // Comprehensive health check
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.http.pingCheck('master-data', `${this.masterDataUrl}/health`),
      () => this.http.pingCheck('temporal', `${this.temporalUrl}/health`),
      () => this.checkCircuitBreakers(),
      () => this.checkCacheConnection(),
      () => this.checkEventStoreConnection(),
    ])
  }

  private async checkCircuitBreakers(): Promise<HealthIndicatorResult> {
    const states = {
      masterData: this.masterDataClient.getHealthStatus(),
      banking: this.bankingClient.getHealthStatus(),
    }

    const allHealthy = Object.values(states).every(s => s.isHealthy)

    return {
      circuitBreakers: {
        status: allHealthy ? 'up' : 'down',
        details: states,
      },
    }
  }
}
```

---

## Pattern 7: Request Context Propagation

**Propagate tenant, user, and correlation context** across services.

```typescript
export class RequestContext {
  constructor(
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly correlationId: string,
    public readonly accessToken: string
  ) {}

  static fromRequest(req: Request): RequestContext {
    return new RequestContext(
      req['tenantId'],
      req['user']?.id,
      req['correlationId'] || uuidv4(),
      req.headers.authorization?.replace('Bearer ', '')
    )
  }

  toHeaders(): Record<string, string> {
    return {
      'x-correlation-id': this.correlationId,
      'x-tenant-id': this.tenantId,
      'x-user-id': this.userId,
      'authorization': `Bearer ${this.accessToken}`,
    }
  }
}

// Usage in client
async getCustomer(customerId: string, context: RequestContext): Promise<Customer> {
  const response = await this.httpService.axiosRef.get(
    `${this.serviceUrl}/customers/${customerId}`,
    { headers: context.toHeaders() }
  )

  return response.data
}
```

---

## Configuration Strategy

### Service Type Configurations

```typescript
// config/integration.config.ts
export const IntegrationConfig = {
  INTERNAL_FAST: {
    timeout: 2000,
    retry: { maxAttempts: 3, initialDelay: 500, maxDelay: 2000 },
    circuitBreaker: { threshold: 3, halfOpenAfter: 10000 },
  },

  INTERNAL_STANDARD: {
    timeout: 5000,
    retry: { maxAttempts: 3, initialDelay: 1000, maxDelay: 10000 },
    circuitBreaker: { threshold: 5, halfOpenAfter: 30000 },
  },

  EXTERNAL_STANDARD: {
    timeout: 10000,
    retry: { maxAttempts: 5, initialDelay: 2000, maxDelay: 30000 },
    circuitBreaker: { threshold: 10, halfOpenAfter: 60000 },
  },

  EXTERNAL_CRITICAL: {
    timeout: 15000,
    retry: { maxAttempts: 7, initialDelay: 3000, maxDelay: 60000 },
    circuitBreaker: { threshold: 10, halfOpenAfter: 120000 },
  },
}
```

---

## Testing

### Integration Test with Mock Service

```typescript
describe('MasterDataClient Integration', () => {
  let client: MasterDataClient
  let mockServer: MockAdapter

  beforeEach(() => {
    mockServer = new MockAdapter(axios)
    client = new MasterDataClient(httpService, cacheService)
  })

  afterEach(() => {
    mockServer.restore()
  })

  it('should fetch customer successfully', async () => {
    mockServer.onGet('/customers/customer-1').reply(200, {
      id: 'customer-1',
      name: 'Test Customer',
    })

    const result = await client.getCustomer('customer-1', testContext)

    expect(result).toEqual({ id: 'customer-1', name: 'Test Customer' })
  })

  it('should retry on 500 error and succeed', async () => {
    mockServer
      .onGet('/customers/customer-1')
      .replyOnce(500)
      .onGet('/customers/customer-1')
      .replyOnce(500)
      .onGet('/customers/customer-1')
      .reply(200, { id: 'customer-1' })

    const result = await client.getCustomer('customer-1', testContext)

    expect(result).toEqual({ id: 'customer-1' })
    expect(mockServer.history.get.length).toBe(3)
  })

  it('should return cached data when service is down', async () => {
    // Prime cache
    await cacheService.set('customer:tenant-1:customer-1', { id: 'customer-1', cached: true })

    // Service fails
    mockServer.onGet('/customers/customer-1').networkError()

    const result = await client.getCustomer('customer-1', testContext)

    expect(result).toEqual({ id: 'customer-1', cached: true })
  })

  it('should open circuit breaker after threshold failures', async () => {
    mockServer.onGet(/\/customers\/.*/).networkError()

    // Trigger 5 failures
    for (let i = 0; i < 5; i++) {
      await expect(client.getCustomer(`customer-${i}`, testContext)).rejects.toThrow()
    }

    // Circuit should be open
    expect(client.getHealthStatus().circuitBreakerState).toBe('open')

    // Next call fails immediately
    await expect(client.getCustomer('customer-6', testContext)).rejects.toThrow(BrokenCircuitError)
  })
})
```

---

## Best Practices Checklist

Before deploying service client:

- [ ] Circuit breaker configured
- [ ] Retry policy defined (only transient failures)
- [ ] Timeout appropriate for service type
- [ ] Graceful degradation strategy (cache fallback, null return, default value)
- [ ] Correlation ID propagated in headers
- [ ] Health check exposes circuit breaker state
- [ ] Error logging includes correlation ID and context
- [ ] Metrics tracked (retry count, circuit breaker state, latency)
- [ ] Integration tests cover retry, circuit breaker, fallback
- [ ] Idempotency keys used for non-idempotent operations
- [ ] Sensitive data masked in logs (account numbers, tokens)
- [ ] DataLoader used for N+1 prevention (if GraphQL)

---

## References

- Cockatiel: https://github.com/connor4312/cockatiel
- DataLoader: https://github.com/graphql/dataloader
- NestJS Terminus: https://docs.nestjs.com/recipes/terminus
- Temporal: https://docs.temporal.io/
- Production Implementations:
  - `services/finance/src/infrastructure/integrations/master-data.client.ts`
  - `services/finance/src/infrastructure/integrations/workflow.client.ts`

---

**Compounding Effect**: Standardized service clients enable reliable communication across 19 microservices with automatic failure recovery.
