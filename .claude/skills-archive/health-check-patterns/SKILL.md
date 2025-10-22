---
name: health-check-patterns
version: 1.0.0
triggers:
  - "health check"
  - "liveness"
  - "readiness"
  - "startup probe"
  - "kubernetes health"
  - "dependency check"
  - "graceful shutdown"
auto_load_knowledge:
  - sessions/knowledge/vextrus-erp/patterns/health-check-patterns.md
---

# Health Check Patterns Skill

**Auto-activates on**: "health check", "liveness", "readiness", "kubernetes health", "graceful shutdown"

**Purpose**: Enforce Kubernetes health check patterns, dependency validation, and graceful shutdown strategies for Vextrus ERP microservices.

---

## When This Skill Activates

Use when implementing or reviewing:
- Kubernetes liveness/readiness/startup probes
- Dependency health checks (PostgreSQL, EventStore, Kafka, Redis)
- External service health validation (Master Data, Auth)
- Graceful shutdown patterns
- Health check endpoints (`/health`, `/ready`, `/live`)
- Circuit breaker health integration
- Prometheus metrics for health monitoring

---

## Core Principles

### 1. Three Types of Kubernetes Probes

**Decision Tree**:
```
Process running? → Liveness Probe
Ready for traffic? → Readiness Probe
Slow initialization? → Startup Probe
```

**Liveness Probe**: "Is my process healthy?"
- **Purpose**: Detect deadlocks, infinite loops, unrecoverable errors
- **Action**: Restart container if fails
- **Frequency**: Every 10-30 seconds
- **Timeout**: 1-5 seconds
- **Example**: HTTP GET `/health/live` returns 200

**Readiness Probe**: "Can I handle requests?"
- **Purpose**: Detect temporary unavailability (DB down, dependencies unhealthy)
- **Action**: Remove from load balancer if fails
- **Frequency**: Every 5-15 seconds
- **Timeout**: 1-3 seconds
- **Example**: HTTP GET `/health/ready` returns 200 (after DB check)

**Startup Probe**: "Have I finished initializing?"
- **Purpose**: Allow slow startup (migrations, cache warming)
- **Action**: Delay liveness/readiness checks until startup succeeds
- **Frequency**: Every 5 seconds
- **Failure Threshold**: 30 attempts (150s total)
- **Example**: HTTP GET `/health/startup` returns 200 (after EventStore connection)

---

## NestJS Implementation Patterns

### 2. TerminusModule (NestJS Health Checks)

**Installation**:
```bash
npm install --save @nestjs/terminus
```

**Basic Health Check Module**:

```typescript
// health/health.module.ts
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';

@Module({
  imports: [
    TerminusModule,
    HttpModule, // For external service checks
  ],
  controllers: [HealthController],
})
export class HealthModule {}
```

---

### 3. Liveness Probe (Minimal Checks)

**Pattern**: Fast, lightweight checks only

```typescript
// health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, MemoryHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get('live')
  @HealthCheck()
  checkLiveness() {
    return this.health.check([
      // ✅ Only check process health (not dependencies)
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),   // 500MB
    ]);
  }
}
```

**Kubernetes Configuration**:

```yaml
# finance-service deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finance-service
spec:
  template:
    spec:
      containers:
      - name: finance
        image: finance-service:v1.0.0
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3014
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 3
```

**Why Minimal?**
- Fast response (<100ms)
- No dependency checks (DB down shouldn't restart container)
- Only detects process-level issues

---

### 4. Readiness Probe (Dependency Checks)

**Pattern**: Check all critical dependencies

```typescript
// health/health.controller.ts
import {
  TypeOrmHealthIndicator,
  MicroserviceHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get('ready')
  @HealthCheck()
  checkReadiness() {
    return this.health.check([
      // ✅ Database connection
      () => this.db.pingCheck('database', { timeout: 1000 }),

      // ✅ Disk space
      () => this.disk.checkStorage('disk', {
        path: '/',
        thresholdPercent: 0.9, // 90% usage is unhealthy
      }),

      // ✅ Custom: EventStore connection
      () => this.checkEventStore(),

      // ✅ Custom: Kafka connection
      () => this.checkKafka(),

      // ✅ Custom: External service (Master Data)
      () => this.checkMasterDataService(),
    ]);
  }

  private async checkEventStore(): Promise<HealthIndicatorResult> {
    try {
      // Ping EventStore (fast operation)
      await this.eventStoreClient.readStream('$stats-0.0.0.0:2113', { maxCount: 1 });
      return { eventstore: { status: 'up' } };
    } catch (error) {
      throw new HealthCheckError(
        'EventStore check failed',
        { eventstore: { status: 'down', error: error.message } },
      );
    }
  }

  private async checkKafka(): Promise<HealthIndicatorResult> {
    try {
      const admin = this.kafkaClient.admin();
      await admin.connect();
      const cluster = await admin.describeCluster();
      await admin.disconnect();

      return { kafka: { status: 'up', brokers: cluster.brokers.length } };
    } catch (error) {
      throw new HealthCheckError(
        'Kafka check failed',
        { kafka: { status: 'down', error: error.message } },
      );
    }
  }

  private async checkMasterDataService(): Promise<HealthIndicatorResult> {
    try {
      // Quick health check query
      const response = await firstValueFrom(
        this.httpService.get('https://master-data-service/health/live', {
          timeout: 2000,
        }),
      );

      return { master_data: { status: 'up' } };
    } catch (error) {
      // Don't fail readiness if master-data is temporarily down
      // Log warning instead
      this.logger.warn('Master Data service health check failed', error);
      return { master_data: { status: 'degraded', error: error.message } };
    }
  }
}
```

**Kubernetes Configuration**:

```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3014
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

---

### 5. Startup Probe (Slow Initialization)

**Pattern**: Allow time for migrations, cache warming, EventStore connection

```typescript
@Controller('health')
export class HealthController {
  private isStartupComplete = false;

  constructor(
    private health: HealthCheckService,
    private migrationService: MigrationService,
    private cacheService: CacheService,
  ) {}

  async onModuleInit() {
    // Run startup tasks
    await this.runStartupTasks();
    this.isStartupComplete = true;
  }

  @Get('startup')
  @HealthCheck()
  checkStartup() {
    if (!this.isStartupComplete) {
      throw new ServiceUnavailableException('Startup tasks not complete');
    }

    return this.health.check([
      () => ({ startup: { status: 'complete' } }),
    ]);
  }

  private async runStartupTasks() {
    this.logger.log('Running startup tasks...');

    // 1. Run database migrations (if enabled)
    if (process.env.RUN_MIGRATIONS === 'true') {
      await this.migrationService.run();
    }

    // 2. Warm up cache
    await this.cacheService.warmUp();

    // 3. Connect to EventStore
    await this.eventStoreClient.connect();

    // 4. Validate external service connectivity
    await this.validateExternalServices();

    this.logger.log('Startup tasks complete');
  }

  private async validateExternalServices() {
    // Test Master Data service
    try {
      await this.masterDataClient.healthCheck();
    } catch (error) {
      this.logger.warn('Master Data service unavailable during startup', error);
      // Non-critical, continue startup
    }
  }
}
```

**Kubernetes Configuration**:

```yaml
startupProbe:
  httpGet:
    path: /health/startup
    port: 3014
  initialDelaySeconds: 0
  periodSeconds: 5
  failureThreshold: 30  # 30 * 5s = 150s max startup time
  timeoutSeconds: 3
```

**Evidence from Vextrus ERP**:
- Finance service: TypeORM migrations, EventStore connection
- Opportunity: Add startup probe for migration safety

---

## Dependency-Specific Health Checks

### 6. PostgreSQL Health Check

```typescript
// Built-in TypeORM indicator
@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.dataSource.query('SELECT 1');
      return this.getStatus(key, true, { status: 'up' });
    } catch (error) {
      throw new HealthCheckError(
        'Database check failed',
        this.getStatus(key, false, { status: 'down', error: error.message }),
      );
    }
  }
}
```

---

### 7. EventStore Health Check

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
    try {
      // Read system stream (fast operation)
      const events = this.eventStoreClient.readStream('$stats-0.0.0.0:2113', {
        direction: FORWARDS,
        fromRevision: START,
        maxCount: 1,
      });

      // Check if we can iterate (connection works)
      await events.next();

      return this.getStatus(key, true, { status: 'up' });
    } catch (error) {
      throw new HealthCheckError(
        'EventStore check failed',
        this.getStatus(key, false, { status: 'down', error: error.message }),
      );
    }
  }
}
```

---

### 8. Redis Health Check

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
    try {
      const pong = await this.redisClient.ping();

      if (pong !== 'PONG') {
        throw new Error('Redis PING failed');
      }

      return this.getStatus(key, true, { status: 'up' });
    } catch (error) {
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, { status: 'down', error: error.message }),
      );
    }
  }
}
```

---

## Graceful Shutdown Patterns

### 9. Graceful Shutdown Hook

**Pattern**: Finish in-flight requests, close connections cleanly

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable graceful shutdown
  app.enableShutdownHooks();

  await app.listen(3014);

  // Handle shutdown signals
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await app.close();
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await app.close();
  });
}

// Module-level cleanup
@Injectable()
export class EventStoreService implements OnModuleDestroy {
  async onModuleDestroy() {
    this.logger.log('Closing EventStore connection');
    await this.eventStoreClient.dispose();
  }
}

@Injectable()
export class KafkaService implements OnModuleDestroy {
  async onModuleDestroy() {
    this.logger.log('Disconnecting Kafka producer');
    await this.producer.disconnect();
    await this.consumer.disconnect();
  }
}
```

**Kubernetes Configuration**:

```yaml
# Give app 30 seconds to shut down gracefully
terminationGracePeriodSeconds: 30

lifecycle:
  preStop:
    exec:
      command: ["/bin/sh", "-c", "sleep 5"] # Allow time for load balancer to update
```

---

### 10. In-Flight Request Tracking

```typescript
// graceful-shutdown.interceptor.ts
@Injectable()
export class GracefulShutdownInterceptor implements NestInterceptor, OnModuleDestroy {
  private isShuttingDown = false;
  private activeRequests = 0;

  async onModuleDestroy() {
    this.isShuttingDown = true;

    // Wait for in-flight requests to complete
    while (this.activeRequests > 0) {
      this.logger.log(`Waiting for ${this.activeRequests} requests to complete`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.logger.log('All requests completed, shutting down');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (this.isShuttingDown) {
      throw new ServiceUnavailableException('Server is shutting down');
    }

    this.activeRequests++;

    return next.handle().pipe(
      finalize(() => {
        this.activeRequests--;
      }),
    );
  }
}

// app.module.ts
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: GracefulShutdownInterceptor,
    },
  ],
})
export class AppModule {}
```

---

## Monitoring Integration

### 11. Prometheus Metrics for Health

```typescript
// health-metrics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Gauge } from 'prom-client';

@Injectable()
export class HealthMetricsService {
  constructor(
    @InjectMetric('health_check_status')
    private healthCheckGauge: Gauge<string>,
  ) {}

  recordHealthCheck(name: string, isHealthy: boolean) {
    this.healthCheckGauge.set(
      { check_name: name },
      isHealthy ? 1 : 0,
    );
  }
}

// health.controller.ts
@Get('ready')
@HealthCheck()
async checkReadiness() {
  const result = await this.health.check([...checks]);

  // Record metrics
  Object.entries(result.details).forEach(([name, detail]) => {
    this.healthMetrics.recordHealthCheck(name, detail.status === 'up');
  });

  return result;
}
```

**Prometheus Query**:
```promql
# Alert if health check fails
health_check_status{check_name="database"} == 0
```

---

## Best Practices Summary

1. **Liveness = Process Health**: No dependency checks (fast, <100ms)
2. **Readiness = Dependency Health**: Check DB, EventStore, Kafka
3. **Startup = Initialization**: Migrations, cache warming, connections
4. **Graceful Shutdown**: Finish in-flight requests, close connections
5. **Timeout Hierarchy**: Liveness (3s) > Readiness (3s) > Startup (150s)
6. **Fail Fast**: Don't retry slow dependencies in health checks
7. **Degrade Gracefully**: Non-critical services can be "degraded" (not fail)
8. **Monitor**: Prometheus metrics for health check status
9. **Test**: Simulate failures (kill DB, EventStore down)
10. **Document**: Which dependencies are critical vs optional

---

## Anti-Patterns to Avoid

- ❌ **Liveness checks dependencies** (DB down = container restart loop)
- ❌ **Slow health checks** (>1s response time)
- ❌ **No graceful shutdown** (in-flight requests fail)
- ❌ **Missing startup probe** (slow init = restart loop)
- ❌ **All-or-nothing readiness** (one dependency down = all traffic removed)
- ❌ **No metrics** (can't detect intermittent failures)
- ❌ **Hardcoded timeouts** (use environment variables)

---

## Vextrus ERP-Specific Patterns

**Finance Service Dependencies**:
- Critical: PostgreSQL (projections), EventStore (event sourcing)
- Important: Kafka (event publishing)
- Optional: Master Data service (vendor/customer lookups)
- Optional: Redis (caching)

**Readiness Strategy**:
- ✅ Fail if PostgreSQL down (can't serve queries)
- ✅ Fail if EventStore down (can't process commands)
- ⚠ Degrade if Kafka down (events buffered, retry later)
- ⚠ Degrade if Master Data down (use cache, return partial data)

---

## Further Reading

- **Kubernetes Health**: `.claude/skills/health-check-patterns/resources/kubernetes-health.md`
- **Dependency Checks**: `.claude/skills/health-check-patterns/resources/dependency-checks.md`
- **Monitoring Integration**: `.claude/skills/health-check-patterns/resources/monitoring-integration.md`
- **NestJS Terminus**: https://docs.nestjs.com/recipes/terminus
