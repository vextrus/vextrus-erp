# Service Integration Patterns

**Purpose**: Quick reference for cross-service communication and external API integration in Vextrus ERP
**Last Updated**: 2025-10-20
**Source**: Master Data Client, Workflow Client, Banking/NBR integrations
**Auto-Loaded By**: `service-integration` skill

---

## Quick Reference

| Pattern | When to Use | Key Benefit | Status |
|---------|-------------|-------------|--------|
| **Circuit Breaker** | All external calls | Prevent cascading failures | ❌ Not implemented |
| **Retry + Backoff** | Transient failures | Automatic recovery | ⚠️ Ad-hoc only |
| **Timeout Strategy** | All HTTP requests | Prevent hanging | ✅ 5s default |
| **Graceful Degradation** | Non-critical dependencies | Maintain core functionality | ✅ Partial |
| **Health Checks** | Service dependencies | Early detection | ✅ Implemented |
| **Correlation IDs** | Distributed tracing | Track across services | ✅ Via OTEL |

---

## Pattern 1: Circuit Breaker (CRITICAL - Add This)

**Problem**: Continuous retry to failing service causes cascading failures.

**Solution**:
```typescript
import { ConsecutiveBreaker, retry, ExponentialBackoff } from 'cockatiel'

const breaker = new ConsecutiveBreaker({
  threshold: 5,           // Open after 5 consecutive failures
  halfOpenAfter: 30000,   // Try recovery after 30s
})

const retryPolicy = retry(handleAll, {
  maxAttempts: 3,
  backoff: new ExponentialBackoff({ initialDelay: 1000, maxDelay: 10000 }),
})

// Circuit breaker wraps retry
return breaker.execute(() =>
  retryPolicy.execute(() => this.httpService.get(url))
)
```

**States**: Closed (normal) → Open (failing) → Half-Open (testing) → Closed

**Evidence**: NOT yet implemented (critical gap)

---

## Pattern 2: Retry Only Transient Failures

**Rule**: Only retry errors that might succeed on retry.

**Solution**:
```typescript
const retryPolicy = retry(
  handleType(AxiosError, (err) => {
    // Retry: network errors, 5xx, 429
    return !err.response || err.response.status >= 500 || err.response.status === 429
  }),
  { maxAttempts: 3, backoff: new ExponentialBackoff({ initialDelay: 1000 }) }
)
```

**Do Retry**: Network errors, 5xx, 429 (rate limit)
**Don't Retry**: 4xx client errors (permanent failures)

---

## Pattern 3: Timeout Tiers

**Problem**: 5s timeout doesn't fit all service types.

**Solution**:
```typescript
const TimeoutConfig = {
  INTERNAL_FAST: 2000,        // Auth, lookups
  INTERNAL_STANDARD: 5000,    // Most microservices
  INTERNAL_HEAVY: 15000,      // Reports, aggregations
  EXTERNAL_STANDARD: 10000,   // Banking, NBR
  EXTERNAL_ASYNC: 30000,      // Payment gateways
}
```

**Evidence**: Currently 5s for all requests (needs tiering)

---

## Pattern 4: Graceful Degradation

**Problem**: Critical service fails → entire feature unusable.

**Solution**:
```typescript
try {
  return await this.externalService.call()
} catch (error) {
  // Fallback 1: Stale cache
  const cached = await this.cache.get(key)
  if (cached) return cached

  // Fallback 2: Format validation only
  return { isValid: this.validateFormat(input), source: 'format_only' }

  // Fallback 3: Return null (caller handles)
  return null
}
```

**Evidence**: Master Data Client has fallback patterns (GraphQL → REST → cache)

---

## Pattern 5: Health Checks with Dependencies

**Pattern**: Include dependency status in health checks.

**Solution**:
```typescript
@Get('health/ready')
checkReadiness() {
  return this.health.check([
    () => this.db.pingCheck('database'),
    () => this.http.pingCheck('master-data', `${url}/health`),
    () => this.checkCircuitBreakerState(),  // Include circuit breaker
  ])
}
```

**Evidence**: Health checks implemented, need circuit breaker state

---

## Pattern 6: Correlation ID Propagation

**Pattern**: Track requests across 19 microservices.

**Solution**:
```typescript
const headers = {
  'x-correlation-id': context.correlationId,
  'x-tenant-id': context.tenantId,
  'authorization': `Bearer ${context.accessToken}`,
}

await this.httpService.get(url, { headers })
```

**Evidence**: Implemented via OpenTelemetry context propagation

---

## Integration Points

### With Error Handling & Observability Skill
- Circuit breaker failures → ServiceUnavailableException
- Correlation IDs for distributed tracing
- OpenTelemetry spans for external calls
- Structured logging with retry attempts

### With Performance & Caching Skill
- Cache external API responses (fallback strategy)
- DataLoader for N+1 prevention (100x reduction in Finance)
- Connection pooling for HTTP clients

### With Security-First Skill
- JWT token propagation in headers
- Tenant ID validation before external calls
- API key management for external services
- TLS/SSL for all external communication

### With Multi-Tenancy Skill
- Tenant context in x-tenant-id header
- Per-tenant circuit breakers (isolate failures)
- Tenant-scoped rate limiting

---

## Configuration Examples

### Internal Fast Services (auth, lookups)
```typescript
{
  timeout: 2000,
  retry: { maxAttempts: 3, initialDelay: 500 },
  circuitBreaker: { threshold: 3, halfOpenAfter: 10000 },
}
```

### External APIs (banking, NBR)
```typescript
{
  timeout: 10000,
  retry: { maxAttempts: 5, initialDelay: 2000, jitter: 'full' },
  circuitBreaker: { threshold: 10, halfOpenAfter: 60000 },
}
```

---

## Quality Checklist

- [ ] Circuit breaker configured for external service calls
- [ ] Retry policy defined (max attempts, backoff strategy)
- [ ] Timeout appropriate for service type (2s/5s/10s/30s)
- [ ] Graceful degradation strategy defined
- [ ] Health check includes dependency status
- [ ] Correlation ID propagated in headers
- [ ] Only transient failures retried (not 4xx errors)
- [ ] Circuit breaker state exposed for monitoring
- [ ] Stale cache used as fallback
- [ ] Error scenarios tested (network failure, timeout, 5xx)

---

## Service Examples

**Reference Implementations**:
- Master Data Client: `services/finance/src/infrastructure/integrations/master-data.client.ts` (GraphQL + REST)
- Workflow Client: `services/finance/src/infrastructure/integrations/workflow.client.ts` (Temporal SDK)
- Banking Integration: `services/finance/src/application/services/banking-integration.service.ts`
- Health Controller: `services/finance/src/presentation/health/health.controller.ts`

**Evidence**:
- Dual protocol support (GraphQL + REST)
- DataLoader for N+1 prevention (100x reduction)
- **Gap**: Circuit breaker not implemented (critical)
- **Gap**: Ad-hoc retry logic needs centralization
- **Gap**: Single 5s timeout for all services (needs tiering)

---

## Common Pitfalls

❌ **No circuit breaker**: Services hammer failing dependencies
❌ **Retry 4xx errors**: Permanent failures shouldn't be retried
❌ **No jitter**: Thundering herd on retry
❌ **One timeout for all**: Fast services wait 5s, slow services timeout too soon
❌ **No fallback**: Circuit open = total failure
❌ **Retry non-idempotent**: Could create duplicates (use idempotency keys)

---

**Compounding Effect**: Service integration patterns prevent cascading failures and enable 19 microservices to operate reliably in production.
