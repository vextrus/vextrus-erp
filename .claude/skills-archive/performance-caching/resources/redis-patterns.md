# Redis Caching Patterns

Comprehensive Redis caching strategies for Vextrus ERP microservices.

---

## Overview

**Redis Use Cases in Vextrus**:
1. **Session Storage**: User sessions, JWT token blacklist
2. **Query Result Caching**: Frequently accessed data
3. **Rate Limiting**: API throttling per user/tenant
4. **Distributed Locks**: Prevent concurrent operations
5. **Pub/Sub**: Real-time notifications, cache invalidation

**Infrastructure**:
- Shared Redis module: `shared/cache/src/redis-cache.module.ts`
- Cache decorators: `shared/utils/src/cache/cache.decorators.ts`
- Implemented in: auth, master-data, api-gateway, rules-engine, workflow services

---

## Pattern 1: Cache-Aside (Lazy Loading)

**Most common pattern**: Check cache first, load from DB on miss, populate cache.

### Basic Implementation

```typescript
import { Injectable } from '@nestjs/common'
import { RedisCacheService } from '@vextrus/shared/utils'

@Injectable()
export class ProductService {
  constructor(
    private readonly cacheService: RedisCacheService,
    private readonly repository: ProductRepository
  ) {}

  async getProduct(tenantId: string, productId: string): Promise<Product> {
    const cacheKey = `product:${tenantId}:${productId}`

    // 1. Try cache first
    const cached = await this.cacheService.get<Product>(cacheKey)
    if (cached) {
      return cached
    }

    // 2. Cache miss: load from database
    const product = await this.repository.findOne({
      where: { tenantId, id: productId },
    })

    if (!product) {
      throw new EntityNotFoundException('Product', productId)
    }

    // 3. Populate cache (TTL: 5 minutes)
    await this.cacheService.set(cacheKey, product, 300)

    return product
  }
}
```

### With getOrSet Helper

```typescript
async getProduct(tenantId: string, productId: string): Promise<Product> {
  const cacheKey = `product:${tenantId}:${productId}`

  // Simplified: handles cache check, miss, and set
  return this.cacheService.getOrSet(
    cacheKey,
    async () => {
      const product = await this.repository.findOne({
        where: { tenantId, id: productId },
      })
      if (!product) throw new EntityNotFoundException('Product', productId)
      return product
    },
    300 // TTL: 5 minutes
  )
}
```

---

## Pattern 2: Write-Through Cache

**Pattern**: Update cache immediately when data changes.

```typescript
@Injectable()
export class ProductService {
  async updateProduct(product: Product): Promise<Product> {
    // 1. Update database
    const updated = await this.repository.save(product)

    // 2. Update cache immediately
    const cacheKey = `product:${product.tenantId}:${product.id}`
    await this.cacheService.set(cacheKey, updated, 300)

    return updated
  }

  async deleteProduct(tenantId: string, productId: string): Promise<void> {
    // 1. Delete from database
    await this.repository.delete({ tenantId, id: productId })

    // 2. Invalidate cache
    const cacheKey = `product:${tenantId}:${productId}`
    await this.cacheService.delete(cacheKey)
  }
}
```

---

## Pattern 3: Declarative Caching with Decorators

**Best for**: Query handlers, computed data, lookup tables.

### @Cacheable Decorator

```typescript
import { Cacheable } from '@vextrus/shared/utils'

@Injectable()
export class CustomerQueryHandler {
  @Cacheable({
    ttl: 300, // 5 minutes
    keyGenerator: (tenantId: string, customerId: string) =>
      `customer:${tenantId}:${customerId}`,
  })
  async getCustomer(tenantId: string, customerId: string): Promise<Customer> {
    // First call: executes and caches
    // Subsequent calls: returns from cache
    return this.repository.findOne({ where: { tenantId, id: customerId } })
  }

  // Dynamic TTL based on data type
  @Cacheable({
    ttl: (country: Country) => (country.isActive ? 86400 : 300), // 24h or 5m
    keyGenerator: (code: string) => `country:${code}`,
  })
  async getCountryByCode(code: string): Promise<Country> {
    return this.countryRepository.findOne({ where: { code } })
  }
}
```

### @CachePut Decorator

```typescript
@Injectable()
export class CustomerCommandHandler {
  @CachePut({
    keyGenerator: (customer: Customer) => `customer:${customer.tenantId}:${customer.id}`,
  })
  async updateCustomer(customer: Customer): Promise<Customer> {
    const updated = await this.repository.save(customer)
    // Return value automatically cached
    return updated
  }
}
```

### @CacheEvict Decorator

```typescript
@Injectable()
export class CustomerCommandHandler {
  @CacheEvict({
    keyGenerator: (tenantId: string, customerId: string) =>
      `customer:${tenantId}:${customerId}`,
  })
  async deleteCustomer(tenantId: string, customerId: string): Promise<void> {
    await this.repository.delete({ tenantId, id: customerId })
    // Cache automatically evicted after method executes
  }

  // Evict multiple keys (pattern-based)
  @CacheEvict({
    pattern: (tenantId: string) => `customer:${tenantId}:*`,
  })
  async deleteAllTenantCustomers(tenantId: string): Promise<void> {
    await this.repository.delete({ tenantId })
    // All customer:tenant-123:* keys evicted
  }
}
```

---

## Pattern 4: Multi-Level Caching

**Pattern**: L1 (in-memory) + L2 (Redis) for ultra-fast reads.

```typescript
@Injectable()
export class ConfigService {
  private readonly l1Cache = new Map<string, { value: any; expires: number }>()

  async getConfig(key: string): Promise<any> {
    // L1: In-memory cache (fastest)
    const l1Entry = this.l1Cache.get(key)
    if (l1Entry && l1Entry.expires > Date.now()) {
      return l1Entry.value
    }

    // L2: Redis cache
    const cacheKey = `config:${key}`
    const cached = await this.cacheService.get(cacheKey)
    if (cached) {
      // Populate L1 cache (TTL: 60s)
      this.l1Cache.set(key, {
        value: cached,
        expires: Date.now() + 60000,
      })
      return cached
    }

    // Cache miss: load from database
    const value = await this.configRepository.findOne({ where: { key } })

    // Populate L2 cache (TTL: 24h)
    await this.cacheService.set(cacheKey, value, 86400)

    // Populate L1 cache
    this.l1Cache.set(key, {
      value,
      expires: Date.now() + 60000,
    })

    return value
  }
}
```

**Performance**: L1 hit: <1ms, L2 hit: 5-10ms, DB query: 50-100ms

---

## Pattern 5: Tag-Based Cache Invalidation

**Problem**: Invalidate related cache entries when one entity changes.

**Solution**: Use cache tags (from `shared/utils/src/cache/redis-cache.service.ts`).

```typescript
@Injectable()
export class InvoiceService {
  // Set cache with tags
  async cacheInvoice(invoice: Invoice): Promise<void> {
    const cacheKey = `invoice:${invoice.tenantId}:${invoice.id}`

    await this.cacheService.setWithTags(
      cacheKey,
      invoice,
      300, // TTL: 5 minutes
      [
        `tenant:${invoice.tenantId}`,
        `customer:${invoice.customerId}`,
        `status:${invoice.status}`,
      ]
    )
  }

  // Invalidate all invoices for a customer
  async invalidateCustomerInvoices(customerId: string): Promise<void> {
    await this.cacheService.invalidateByTag(`customer:${customerId}`)
    // All invoices tagged with customer:123 are evicted
  }

  // Invalidate all pending invoices
  async invalidatePendingInvoices(): Promise<void> {
    await this.cacheService.invalidateByTag('status:PENDING')
  }
}
```

**Use Cases**:
- Customer deleted → Invalidate all customer invoices
- Bulk status update → Invalidate all invoices with that status
- Tenant data export → Invalidate all tenant data

---

## Pattern 6: Pre-defined Cache Patterns

**From**: `shared/cache/src/cache.service.ts`

```typescript
export enum CachePattern {
  SESSION = 'session',     // TTL: 1 hour
  AUTH = 'auth',           // TTL: 15 minutes
  USER = 'user',           // TTL: 5 minutes
  CONFIG = 'config',       // TTL: 24 hours
  FEATURE_FLAG = 'feature', // TTL: 10 minutes
  LOOKUP = 'lookup',       // TTL: 2 hours (countries, currencies, tax codes)
  QUERY = 'query',         // TTL: 1 minute
  REPORT = 'report',       // TTL: 30 minutes
}

@Injectable()
export class CacheService {
  async set(key: string, value: any, pattern: CachePattern): Promise<void> {
    const ttl = this.getTTL(pattern)
    await this.redisService.set(key, value, ttl)
  }

  private getTTL(pattern: CachePattern): number {
    const ttls = {
      [CachePattern.SESSION]: 3600,
      [CachePattern.AUTH]: 900,
      [CachePattern.USER]: 300,
      [CachePattern.CONFIG]: 86400,
      [CachePattern.FEATURE_FLAG]: 600,
      [CachePattern.LOOKUP]: 7200,
      [CachePattern.QUERY]: 60,
      [CachePattern.REPORT]: 1800,
    }
    return ttls[pattern]
  }
}
```

**Usage**:
```typescript
// Lookup data (countries, currencies) - cache for 2 hours
await this.cacheService.set(`country:${code}`, country, CachePattern.LOOKUP)

// Query results - cache for 1 minute
await this.cacheService.set(`invoices:${tenantId}:pending`, invoices, CachePattern.QUERY)

// Report data - cache for 30 minutes
await this.cacheService.set(`report:revenue:${tenantId}`, report, CachePattern.REPORT)
```

---

## Pattern 7: Distributed Locking

**Problem**: Prevent concurrent modifications (e.g., invoice numbering, inventory deduction).

```typescript
import { RedisLockService } from '@vextrus/shared/utils'

@Injectable()
export class InvoiceService {
  constructor(private readonly lockService: RedisLockService) {}

  async generateInvoiceNumber(tenantId: string): Promise<string> {
    const lockKey = `lock:invoice-number:${tenantId}`

    // Acquire lock (max wait: 5s, lock TTL: 10s)
    const lock = await this.lockService.acquire(lockKey, 10000, 5000)

    try {
      // Critical section: only one process can execute this
      const lastNumber = await this.getLastInvoiceNumber(tenantId)
      const newNumber = this.incrementInvoiceNumber(lastNumber)

      await this.repository.save({ tenantId, invoiceNumber: newNumber })

      return newNumber
    } finally {
      // Always release lock
      await this.lockService.release(lock)
    }
  }
}
```

**Use Cases**:
- Sequential numbering (invoices, receipts)
- Inventory deduction (prevent overselling)
- Balance updates (prevent race conditions)

---

## Pattern 8: Cache Statistics and Monitoring

**Track cache effectiveness** (from `shared/utils/src/cache/redis-cache.service.ts`).

```typescript
@Injectable()
export class RedisCacheService {
  private stats = {
    hits: 0,
    misses: 0,
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key)

    if (value) {
      this.stats.hits++
      return JSON.parse(value) as T
    }

    this.stats.misses++
    return null
  }

  getStatistics() {
    const total = this.stats.hits + this.stats.misses
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
    }
  }
}
```

**Expose via Health Check**:
```typescript
@Controller('health')
export class HealthController {
  @Get('cache')
  getCacheStats() {
    return this.cacheService.getStatistics()
    // { hits: 1250, misses: 50, hitRate: 96.15 }
  }
}
```

**Target Hit Rate**: >80% (indicates effective caching strategy)

---

## Cache Invalidation Strategies

### Event-Driven Invalidation

```typescript
@EventsHandler(InvoiceCreatedEvent)
export class InvalidateInvoiceListHandler {
  async handle(event: InvoiceCreatedEvent): Promise<void> {
    // Invalidate list queries
    await this.cacheService.delete(`invoices:${event.tenantId}:status:DRAFT`)
    await this.cacheService.delete(`invoices:${event.tenantId}:customer:${event.customerId}`)
  }
}

@EventsHandler(InvoiceStatusChangedEvent)
export class InvalidateInvoiceStatusHandler {
  async handle(event: InvoiceStatusChangedEvent): Promise<void> {
    // Invalidate single invoice
    await this.cacheService.delete(`invoice:${event.tenantId}:${event.invoiceId}`)

    // Invalidate status lists
    await this.cacheService.delete(`invoices:${event.tenantId}:status:${event.oldStatus}`)
    await this.cacheService.delete(`invoices:${event.tenantId}:status:${event.newStatus}`)
  }
}
```

### Time-Based Invalidation

```typescript
// Schedule cache refresh every 5 minutes
@Cron('*/5 * * * *')
async refreshLookupCache(): Promise<void> {
  const countries = await this.countryRepository.find()
  await this.cacheService.set('countries:all', countries, CachePattern.LOOKUP)
}
```

---

## Best Practices

✅ **Do**:
- Always include tenantId in cache keys for multi-tenancy
- Use appropriate TTLs (don't cache indefinitely)
- Monitor cache hit rates (target: >80%)
- Use tag-based invalidation for related entities
- Implement distributed locks for critical sections
- Log cache misses for tuning
- Use in-memory cache (L1) for hot data

❌ **Don't**:
- Cache sensitive data (passwords, tokens, credit cards)
- Use cache as primary data store
- Cache user-specific data globally (use session scope)
- Ignore cache invalidation (stale data issues)
- Cache large objects (>1MB) without compression
- Use Redis for complex queries (use database)

---

## Redis Configuration

### Production Settings

```yaml
# docker-compose.yml
redis:
  image: redis:7-alpine
  command: redis-server --appendonly yes --maxmemory 2gb --maxmemory-policy allkeys-lru
  ports:
    - "6379:6379"
  volumes:
    - redis-data:/data
  environment:
    - REDIS_PASSWORD=${REDIS_PASSWORD}
```

### NestJS Module Configuration

```typescript
// app.module.ts
import { RedisCacheModule } from '@vextrus/shared/cache'

@Module({
  imports: [
    RedisCacheModule.forRoot({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: 0,
      keyPrefix: 'vextrus:', // Namespace all keys
    }),
  ],
})
export class AppModule {}
```

---

## Testing

### Mock Redis in Tests

```typescript
describe('ProductService', () => {
  let cacheService: jest.Mocked<RedisCacheService>

  beforeEach(() => {
    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    } as any
  })

  it('should return cached product on cache hit', async () => {
    const cachedProduct = { id: '1', name: 'Product 1' }
    cacheService.get.mockResolvedValue(cachedProduct)

    const result = await service.getProduct('tenant-1', '1')

    expect(result).toEqual(cachedProduct)
    expect(cacheService.get).toHaveBeenCalledWith('product:tenant-1:1')
    expect(repository.findOne).not.toHaveBeenCalled()
  })

  it('should load from DB and cache on cache miss', async () => {
    cacheService.get.mockResolvedValue(null) // Cache miss
    const product = { id: '1', name: 'Product 1' }
    jest.spyOn(repository, 'findOne').mockResolvedValue(product)

    const result = await service.getProduct('tenant-1', '1')

    expect(result).toEqual(product)
    expect(cacheService.set).toHaveBeenCalledWith('product:tenant-1:1', product, 300)
  })
})
```

---

## References

- Redis Patterns: https://redis.io/docs/manual/patterns/
- Cache-Aside Pattern: https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside
- Distributed Locking: https://redis.io/docs/manual/patterns/distributed-locks/
- NestJS Caching: https://docs.nestjs.com/techniques/caching
