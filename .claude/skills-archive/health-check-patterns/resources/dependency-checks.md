# Dependency Health Checks

**Purpose**: Implement health checks for all Vextrus ERP microservice dependencies.

---

## Core Dependencies

**Finance Service Dependencies**:
1. PostgreSQL (projections, read models)
2. EventStore (event sourcing, domain events)
3. Kafka (event publishing)
4. Redis (caching)
5. Master Data Service (vendor/customer lookups)

---

## PostgreSQL Health Check

```typescript
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PostgreSQLHealthIndicator extends HealthIndicator {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const startTime = Date.now();

    try {
      // Simple ping query
      await this.dataSource.query('SELECT 1');

      const responseTime = Date.now() - startTime;

      return this.getStatus(key, true, {
        status: 'up',
        responseTime: `${responseTime}ms`,
        database: this.dataSource.options.database,
      });
    } catch (error) {
      throw new HealthCheckError(
        'PostgreSQL check failed',
        this.getStatus(key, false, {
          status: 'down',
          error: error.message,
        }),
      );
    }
  }

  // Advanced: Check replication lag (if using read replicas)
  async checkReplicationLag(key: string): Promise<HealthIndicatorResult> {
    try {
      const result = await this.dataSource.query(`
        SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::int AS lag_seconds
      `);

      const lagSeconds = result[0]?.lag_seconds || 0;

      if (lagSeconds > 30) {
        throw new Error(`Replication lag too high: ${lagSeconds}s`);
      }

      return this.getStatus(key, true, {
        status: 'up',
        replicationLag: `${lagSeconds}s`,
      });
    } catch (error) {
      throw new HealthCheckError(
        'Replication lag check failed',
        this.getStatus(key, false, { error: error.message }),
      );
    }
  }
}
```

---

## EventStore Health Check

```typescript
@Injectable()
export class EventStoreHealthIndicator extends HealthIndicator {
  constructor(
    @Inject('EVENTSTORE_CLIENT')
    private eventStoreClient: EventStoreDBClient,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const startTime = Date.now();

    try {
      // Read from system stream (fast operation)
      const events = this.eventStoreClient.readStream(
        '$stats-0.0.0.0:2113',
        {
          direction: FORWARDS,
          fromRevision: START,
          maxCount: 1,
        },
      );

      // Verify we can iterate
      await events.next();

      const responseTime = Date.now() - startTime;

      return this.getStatus(key, true, {
        status: 'up',
        responseTime: `${responseTime}ms`,
      });
    } catch (error) {
      throw new HealthCheckError(
        'EventStore check failed',
        this.getStatus(key, false, {
          status: 'down',
          error: error.message,
        }),
      );
    }
  }

  // Advanced: Check connection pool
  async checkConnectionPool(key: string): Promise<HealthIndicatorResult> {
    try {
      // Verify subscription is active
      const subscription = this.eventStoreClient.subscribeToAll();
      await subscription.unsubscribe();

      return this.getStatus(key, true, {
        status: 'up',
        connection: 'active',
      });
    } catch (error) {
      throw new HealthCheckError(
        'EventStore connection pool check failed',
        this.getStatus(key, false, { error: error.message }),
      );
    }
  }
}
```

---

## Kafka Health Check

```typescript
@Injectable()
export class KafkaHealthIndicator extends HealthIndicator {
  constructor(
    @Inject('KAFKA_SERVICE')
    private kafkaClient: Kafka,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const startTime = Date.now();

    try {
      const admin = this.kafkaClient.admin();
      await admin.connect();

      // Check cluster health
      const cluster = await admin.describeCluster();

      await admin.disconnect();

      const responseTime = Date.now() - startTime;

      return this.getStatus(key, true, {
        status: 'up',
        brokers: cluster.brokers.length,
        controller: cluster.controller,
        responseTime: `${responseTime}ms`,
      });
    } catch (error) {
      throw new HealthCheckError(
        'Kafka check failed',
        this.getStatus(key, false, {
          status: 'down',
          error: error.message,
        }),
      );
    }
  }

  // Advanced: Check consumer lag
  async checkConsumerLag(key: string, groupId: string): Promise<HealthIndicatorResult> {
    try {
      const admin = this.kafkaClient.admin();
      await admin.connect();

      const offsets = await admin.fetchOffsets({ groupId });

      await admin.disconnect();

      const totalLag = offsets.reduce((sum, topic) => {
        return sum + topic.partitions.reduce((partSum, part) => {
          return partSum + (parseInt(part.offset) - parseInt(part.high));
        }, 0);
      }, 0);

      if (totalLag > 1000) {
        throw new Error(`Consumer lag too high: ${totalLag}`);
      }

      return this.getStatus(key, true, {
        status: 'up',
        consumerLag: totalLag,
      });
    } catch (error) {
      throw new HealthCheckError(
        'Kafka consumer lag check failed',
        this.getStatus(key, false, { error: error.message }),
      );
    }
  }
}
```

---

## Redis Health Check

```typescript
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(
    @Inject('REDIS_CLIENT')
    private redisClient: Redis,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const startTime = Date.now();

    try {
      const pong = await this.redisClient.ping();

      if (pong !== 'PONG') {
        throw new Error('Redis PING failed');
      }

      const info = await this.redisClient.info();
      const responseTime = Date.now() - startTime;

      return this.getStatus(key, true, {
        status: 'up',
        responseTime: `${responseTime}ms`,
      });
    } catch (error) {
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, {
          status: 'down',
          error: error.message,
        }),
      );
    }
  }

  // Advanced: Check memory usage
  async checkMemoryUsage(key: string): Promise<HealthIndicatorResult> {
    try {
      const info = await this.redisClient.info('memory');
      const memoryUsed = this.parseInfo(info, 'used_memory');
      const memoryMax = this.parseInfo(info, 'maxmemory');

      const usagePercent = (memoryUsed / memoryMax) * 100;

      if (usagePercent > 90) {
        throw new Error(`Redis memory usage too high: ${usagePercent}%`);
      }

      return this.getStatus(key, true, {
        status: 'up',
        memoryUsage: `${usagePercent.toFixed(2)}%`,
      });
    } catch (error) {
      throw new HealthCheckError(
        'Redis memory check failed',
        this.getStatus(key, false, { error: error.message }),
      );
    }
  }

  private parseInfo(info: string, key: string): number {
    const match = info.match(new RegExp(`${key}:(\\d+)`));
    return match ? parseInt(match[1]) : 0;
  }
}
```

---

## External Service Health Check (Master Data)

```typescript
@Injectable()
export class MasterDataHealthIndicator extends HealthIndicator {
  constructor(
    private readonly httpService: HttpService,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const startTime = Date.now();

    try {
      const response = await firstValueFrom(
        this.httpService.get('https://master-data-service/health/live', {
          timeout: 2000, // 2s timeout
        }),
      );

      const responseTime = Date.now() - startTime;

      if (response.status !== 200) {
        throw new Error(`Unexpected status: ${response.status}`);
      }

      return this.getStatus(key, true, {
        status: 'up',
        responseTime: `${responseTime}ms`,
      });
    } catch (error) {
      // Don't fail readiness for optional service
      // Log warning and mark as degraded
      this.logger.warn(`Master Data service health check failed: ${error.message}`);

      return this.getStatus(key, true, {
        status: 'degraded',
        error: error.message,
      });
    }
  }
}
```

---

## Graceful Degradation Pattern

```typescript
@Controller('health')
export class HealthController {
  @Get('ready')
  @HealthCheck()
  async checkReadiness() {
    return this.health.check([
      // Critical: Fail if down
      () => this.db.pingCheck('database'),
      () => this.eventStore.isHealthy('eventstore'),

      // Important: Degrade if down (buffer events)
      () => this.kafka.isHealthy('kafka').catch(() => ({
        kafka: { status: 'degraded', buffering: true },
      })),

      // Optional: Degrade if down (use cache)
      () => this.masterData.isHealthy('master_data').catch(() => ({
        master_data: { status: 'degraded', using_cache: true },
      })),
    ]);
  }
}
```

---

## Timeout Configuration

```typescript
// health.module.ts
@Module({
  imports: [
    TerminusModule.forRoot({
      // Global timeout for all health checks
      timeout: 5000, // 5 seconds

      // Error handlers
      errorLogStyle: 'pretty',

      // Graceful shutdown timeout
      gracefulShutdownTimeoutMillis: 1000,
    }),
  ],
})
export class HealthModule {}

// Per-check timeout
@Get('ready')
@HealthCheck()
checkReadiness() {
  return this.health.check([
    () => this.db.pingCheck('database', { timeout: 1000 }), // 1s
    () => this.eventStore.isHealthy('eventstore'), // Default 5s
  ]);
}
```

---

## Circuit Breaker Integration

```typescript
import { Injectable } from '@nestjs/common';
import { CircuitBreakerHealthIndicator } from './circuit-breaker.indicator';

@Injectable()
export class CircuitBreakerHealthIndicator extends HealthIndicator {
  constructor(
    private readonly circuitBreaker: CircuitBreakerService,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const state = this.circuitBreaker.getState('master-data-service');

    if (state === 'open') {
      throw new HealthCheckError(
        'Circuit breaker OPEN',
        this.getStatus(key, false, {
          status: 'circuit_open',
          service: 'master-data-service',
        }),
      );
    }

    return this.getStatus(key, true, {
      status: 'circuit_closed',
      service: 'master-data-service',
    });
  }
}
```

---

## Best Practices Summary

1. **Fast Checks**: Database ping (<1s), not complex queries
2. **Timeouts**: Critical (1s), Important (2s), Optional (3s)
3. **Graceful Degradation**: Optional services → "degraded" not "down"
4. **Circuit Breaker**: Integrate circuit breaker state
5. **Replication Lag**: Monitor if using read replicas
6. **Consumer Lag**: Alert if Kafka lag >1000 messages
7. **Memory Usage**: Alert if Redis >90% memory
8. **Connection Pools**: Verify EventStore subscription works
9. **Error Handling**: Don't throw for optional services
10. **Metrics**: Record dependency health for monitoring

---

## Further Reading

- **Kubernetes Health**: `.claude/skills/health-check-patterns/resources/kubernetes-health.md`
- **Monitoring Integration**: `.claude/skills/health-check-patterns/resources/monitoring-integration.md`
