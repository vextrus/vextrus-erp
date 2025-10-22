# Health Check Patterns - Quick Reference

**Auto-loaded by**: `health-check-patterns` skill

---

## Three Types of Kubernetes Probes

```
Liveness Probe → "Is my process healthy?"
  - Detects: Deadlocks, crashes, memory leaks
  - Action: Restart container if fails
  - Checks: Process health ONLY (no dependencies)

Readiness Probe → "Can I handle requests?"
  - Detects: Dependency failures (DB, EventStore, Kafka)
  - Action: Remove from load balancer if fails
  - Checks: ALL critical dependencies

Startup Probe → "Have I finished initializing?"
  - Detects: Slow startup (migrations, cache warming)
  - Action: Delay liveness/readiness until startup succeeds
  - Checks: Initialization tasks complete
```

---

## Kubernetes Configuration (Finance Service)

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: finance
        # Startup: 150s max for migrations + EventStore connection
        startupProbe:
          httpGet:
            path: /health/startup
            port: 3014
          periodSeconds: 5
          failureThreshold: 30  # 30 * 5s = 150s

        # Liveness: Process health only
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3014
          periodSeconds: 10
          failureThreshold: 3   # Restart after 30s

        # Readiness: Dependency checks
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3014
          periodSeconds: 5
          failureThreshold: 2   # Remove from LB after 10s

      # Graceful shutdown
      terminationGracePeriodSeconds: 30
```

---

## NestJS Implementation

### Liveness Probe (Fast, Minimal)

```typescript
@Controller('health')
export class HealthController {
  @Get('live')
  @HealthCheck()
  checkLiveness() {
    return this.health.check([
      // ✅ Only process health (no dependencies)
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
    ]);
  }
}
```

### Readiness Probe (Comprehensive)

```typescript
@Get('ready')
@HealthCheck()
checkReadiness() {
  return this.health.check([
    // ✅ Check all critical dependencies
    () => this.db.pingCheck('database', { timeout: 1000 }),
    () => this.eventStore.isHealthy('eventstore'),
    () => this.kafka.isHealthy('kafka'),
    () => this.redis.isHealthy('redis'),
  ]);
}
```

---

## Dependency Health Indicators

### PostgreSQL

```typescript
@Injectable()
export class PostgreSQLHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.dataSource.query('SELECT 1');
      return this.getStatus(key, true, { status: 'up' });
    } catch (error) {
      throw new HealthCheckError('DB check failed', ...);
    }
  }
}
```

### EventStore

```typescript
async isHealthy(key: string): Promise<HealthIndicatorResult> {
  try {
    const events = this.eventStoreClient.readStream('$stats-0.0.0.0:2113', { maxCount: 1 });
    await events.next();
    return this.getStatus(key, true, { status: 'up' });
  } catch (error) {
    throw new HealthCheckError('EventStore check failed', ...);
  }
}
```

### Kafka

```typescript
async isHealthy(key: string): Promise<HealthIndicatorResult> {
  try {
    const admin = this.kafkaClient.admin();
    await admin.connect();
    const cluster = await admin.describeCluster();
    await admin.disconnect();
    return this.getStatus(key, true, { status: 'up', brokers: cluster.brokers.length });
  } catch (error) {
    throw new HealthCheckError('Kafka check failed', ...);
  }
}
```

---

## Graceful Degradation

```typescript
@Get('ready')
@HealthCheck()
async checkReadiness() {
  return this.health.check([
    // Critical: Fail if down
    () => this.db.pingCheck('database'),
    () => this.eventStore.isHealthy('eventstore'),

    // Optional: Degrade if down (use cache)
    () => this.masterData.isHealthy('master_data').catch(() => ({
      master_data: { status: 'degraded', using_cache: true },
    })),
  ]);
}
```

---

## Graceful Shutdown

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable graceful shutdown
  app.enableShutdownHooks();

  // Handle signals
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await app.close();
  });

  await app.listen(3014);
}

// Service cleanup
@Injectable()
export class EventStoreService implements OnModuleDestroy {
  async onModuleDestroy() {
    await this.eventStoreClient.dispose();
  }
}
```

---

## Prometheus Metrics

```typescript
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Gauge } from 'prom-client';

@Controller('health')
export class HealthController {
  constructor(
    @InjectMetric('health_check_status')
    private healthCheckGauge: Gauge<string>,
  ) {}

  @Get('ready')
  @HealthCheck()
  async checkReadiness() {
    const result = await this.health.check([...checks]);

    // Record metrics
    Object.entries(result.details).forEach(([name, detail]) => {
      this.healthCheckGauge.set(
        { check_name: name, service: 'finance' },
        detail.status === 'up' ? 1 : 0,
      );
    });

    return result;
  }
}
```

**Prometheus Query**:
```promql
# Alert if database unhealthy
health_check_status{check_name="database",service="finance"} == 0
```

---

## Alert Rules (Prometheus)

```yaml
groups:
- name: health_checks
  rules:
  - alert: DatabaseHealthCheckFailed
    expr: health_check_status{check_name="database"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Database health check failed"

  - alert: HealthCheckResponseSlow
    expr: health_check_response_time_ms > 3000
    for: 5m
    labels:
      severity: warning
```

---

## Recommended Timeouts

```
Liveness Probe:
- periodSeconds: 10
- timeoutSeconds: 3
- failureThreshold: 3  (30s until restart)

Readiness Probe:
- periodSeconds: 5
- timeoutSeconds: 3
- failureThreshold: 2  (10s until traffic removal)

Startup Probe:
- periodSeconds: 5
- failureThreshold: 30  (150s max startup time)

Health Check Methods:
- Database ping: <1s timeout
- EventStore ping: <2s timeout
- Kafka check: <2s timeout
- External service: <3s timeout
```

---

## Checklist

**Liveness Probe**:
- [ ] Path: `/health/live`
- [ ] Fast (<100ms response)
- [ ] No dependency checks
- [ ] Only process health (memory, CPU)

**Readiness Probe**:
- [ ] Path: `/health/ready`
- [ ] Check all critical dependencies
- [ ] Graceful degradation for optional services
- [ ] <3s total response time

**Startup Probe**:
- [ ] Path: `/health/startup`
- [ ] Allow time for migrations
- [ ] Allow time for cache warming
- [ ] Allow time for EventStore connection

**Graceful Shutdown**:
- [ ] `app.enableShutdownHooks()`
- [ ] `terminationGracePeriodSeconds: 30`
- [ ] `OnModuleDestroy` cleanup hooks
- [ ] In-flight request tracking

**Monitoring**:
- [ ] Prometheus metrics for health status
- [ ] Alert rules for critical failures
- [ ] Grafana dashboard
- [ ] PagerDuty/Slack integration

---

## Common Patterns from Vextrus ERP

**Finance Service Dependencies**:
- Critical: PostgreSQL (projections), EventStore (events)
- Important: Kafka (event publishing)
- Optional: Master Data (vendor/customer), Redis (cache)

**Readiness Strategy**:
- ✅ Fail if PostgreSQL down (can't serve queries)
- ✅ Fail if EventStore down (can't process commands)
- ⚠ Degrade if Kafka down (buffer events, retry later)
- ⚠ Degrade if Master Data down (use cache)

---

## Further Reading

- `.claude/skills/health-check-patterns/SKILL.md` - Complete guide
- `.claude/skills/health-check-patterns/resources/kubernetes-health.md` - K8s probe configs
- `.claude/skills/health-check-patterns/resources/dependency-checks.md` - Dependency indicators
- `.claude/skills/health-check-patterns/resources/monitoring-integration.md` - Prometheus/alerts
