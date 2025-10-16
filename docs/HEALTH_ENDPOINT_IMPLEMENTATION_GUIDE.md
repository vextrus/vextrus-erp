# Health Endpoint Implementation Guide

## Overview

This guide provides standardized patterns for implementing health check endpoints across all Vextrus ERP microservices. Health endpoints enable Kubernetes orchestration, monitoring, and graceful degradation.

## Reference Implementations

- **Master-Data Service**: Comprehensive health checks with HealthCheckService (@nestjs/terminus)
- **Organization Service**: Manual health service with detailed statistics
- **Workflow Service**: Kafka health indicator pattern

## Standard Health Endpoints

All services MUST implement these three endpoints:

### 1. `/health` - Comprehensive Health Check
- **Purpose**: Overall service health including all dependencies
- **Use**: Monitoring dashboards, alerting systems
- **Returns**: HTTP 200 (healthy) or 503 (unhealthy)
- **Checks**: Memory, Database, Redis (if used), Kafka (if used)

### 2. `/health/ready` - Readiness Probe
- **Purpose**: Determines if service can accept traffic
- **Use**: Kubernetes readiness probe, load balancer configuration
- **Returns**: HTTP 200 (ready) or 503 (not ready)
- **Checks**: Critical dependencies only (Database, Redis, Kafka)

### 3. `/health/live` - Liveness Probe
- **Purpose**: Determines if service is alive (not deadlocked)
- **Use**: Kubernetes liveness probe (restart if failing)
- **Returns**: HTTP 200 (alive) or 503 (dead)
- **Checks**: Minimal - just memory or simple ping

## Implementation Patterns

### Pattern 1: HealthCheckService (Recommended)

**Best for**: Services with standard dependencies (DB, Redis, Kafka)

**Dependencies**:
```json
{
  "@nestjs/terminus": "^11.0.0"
}
```

**File Structure**:
```
src/modules/health/
├── health.module.ts
├── health.controller.ts
├── redis.health.ts (if using Redis)
└── kafka.health.ts (if using Kafka)
```

#### health.module.ts
```typescript
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
// Import custom indicators as needed
import { RedisHealthIndicator } from './redis.health';
import { KafkaHealthIndicator } from './kafka.health';
// Import dependency modules
import { RedisModule } from '../redis/redis.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    TerminusModule,
    RedisModule,  // If service uses Redis
    KafkaModule,  // If service uses Kafka
  ],
  controllers: [HealthController],
  providers: [
    RedisHealthIndicator,  // If service uses Redis
    KafkaHealthIndicator,  // If service uses Kafka
  ],
})
export class HealthModule {}
```

#### health.controller.ts
```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';
import { KafkaHealthIndicator } from './kafka.health';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,  // Optional
    private kafka: KafkaHealthIndicator,  // Optional
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Get comprehensive health status' })
  @ApiResponse({ status: 200, description: 'Health check passed' })
  @ApiResponse({ status: 503, description: 'Health check failed' })
  check() {
    return this.health.check([
      // Memory checks (150MB thresholds)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      // Database check
      () => this.db.pingCheck('database'),
      // Optional: Redis check
      () => this.redis.isHealthy('redis'),
      // Optional: Kafka check
      () => this.kafka.isHealthy('kafka'),
    ]);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready() {
    return this.health.check([
      // Critical dependencies only
      () => this.db.pingCheck('database'),
      () => this.redis.isHealthy('redis'),     // If critical
      () => this.kafka.isHealthy('kafka'),     // If critical
    ]);
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  live() {
    // Simple liveness check - just return OK
    return {
      status: 'alive',
      service: 'service-name',  // Replace with actual service name
      timestamp: new Date().toISOString(),
    };
  }
}
```

#### redis.health.ts (if service uses Redis)
```typescript
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@InjectRedis() private readonly redis: Redis) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const pingResult = await this.redis.ping();
      const isHealthy = pingResult === 'PONG';

      const result = this.getStatus(key, isHealthy, {
        message: isHealthy ? 'Redis is connected' : 'Redis ping failed',
        host: this.redis.options.host,
        port: this.redis.options.port,
      });

      if (isHealthy) {
        return result;
      }
      throw new HealthCheckError('Redis check failed', result);
    } catch (error) {
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, {
          message: error.message,
          host: this.redis.options.host,
          port: this.redis.options.port,
        }),
      );
    }
  }
}
```

#### kafka.health.ts (if service uses Kafka)
```typescript
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { KafkaService } from '../kafka/kafka.service';

@Injectable()
export class KafkaHealthIndicator extends HealthIndicator {
  constructor(private readonly kafkaService: KafkaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Access the admin client from KafkaService
      const admin = this.kafkaService['admin'];

      if (!admin) {
        throw new Error('Kafka admin client not initialized');
      }

      // Verify connection by listing topics
      const topics = await admin.listTopics();
      const cluster = await admin.describeCluster();

      const isHealthy = cluster.brokers && cluster.brokers.length > 0;

      const result = this.getStatus(key, isHealthy, {
        message: isHealthy ? 'Kafka is connected' : 'No Kafka brokers available',
        brokers: cluster.brokers?.length || 0,
        topics: topics?.length || 0,
      });

      if (isHealthy) {
        return result;
      }
      throw new HealthCheckError('Kafka check failed', result);
    } catch (error) {
      throw new HealthCheckError(
        'Kafka check failed',
        this.getStatus(key, false, {
          message: error.message || 'Unable to connect to Kafka',
        }),
      );
    }
  }
}
```

### Pattern 2: Manual Health Service

**Best for**: Services with custom health logic or business metrics

See `services/organization/src/modules/health/` for reference implementation.

## Service-Specific Implementation Matrix

| Service | Database | Redis | Kafka | Notes |
|---------|----------|-------|-------|-------|
| auth | ✅ PostgreSQL | ✅ Sessions | ❌ | JWT validation check |
| api-gateway | ❌ | ❌ | ❌ | Subgraph health federation |
| master-data | ✅ PostgreSQL | ✅ Cache | ✅ Events | **Already implemented** |
| scheduler | ✅ PostgreSQL | ❌ | ✅ Jobs | Bull queue health |
| notification | ✅ PostgreSQL | ❌ | ✅ Consume | Email/SMS provider check |
| file-storage | ✅ PostgreSQL | ❌ | ❌ | MinIO/S3 connection check |
| audit | ✅ PostgreSQL | ❌ | ✅ Consume | Event log integrity |
| import-export | ✅ PostgreSQL | ❌ | ✅ Jobs | File processing status |
| document-generator | ✅ PostgreSQL | ❌ | ✅ Jobs | Puppeteer check |

## Integration with App Module

Add HealthModule to app.module.ts imports:

```typescript
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ /* ... */ }),
    TypeOrmModule.forRoot({ /* ... */ }),
    // ... other modules
    HealthModule,  // Add health module
  ],
  // ...
})
export class AppModule {}
```

## Docker Health Check Configuration

Add to service Dockerfile:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health/live || exit 1
```

Add to docker-compose.yml:

```yaml
services:
  service-name:
    # ... other config
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health/live"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 40s
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
```

## Testing Health Endpoints

```bash
# Comprehensive health check
curl http://localhost:3000/health

# Readiness check
curl http://localhost:3000/health/ready

# Liveness check
curl http://localhost:3000/health/live

# Expected response (healthy)
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "kafka": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" }
  },
  "error": {},
  "details": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "kafka": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" }
  }
}

# Expected response (unhealthy)
HTTP/1.1 503 Service Unavailable
{
  "status": "error",
  "info": { ... },
  "error": {
    "database": {
      "status": "down",
      "message": "Connection timeout"
    }
  },
  "details": { ... }
}
```

## Implementation Checklist

For each service:

- [ ] Install @nestjs/terminus dependency
- [ ] Create src/modules/health/ directory
- [ ] Create health.module.ts with TerminusModule import
- [ ] Create health.controller.ts with 3 endpoints
- [ ] Create custom health indicators (redis.health.ts, kafka.health.ts) if needed
- [ ] Import HealthModule in app.module.ts
- [ ] Add HEALTHCHECK to Dockerfile
- [ ] Update docker-compose.yml healthcheck configuration
- [ ] Test all 3 endpoints locally
- [ ] Verify docker health status shows "healthy"

## Troubleshooting

### Health check returns 503
- Check database connection (verify DATABASE_* env vars)
- Check Redis connection (verify REDIS_HOST/PORT)
- Check Kafka connection (verify KAFKA_BROKERS)
- Review logs for connection errors

### Docker shows "unhealthy"
- Verify HEALTHCHECK CMD uses correct port
- Check start_period allows enough time for startup
- Verify service is actually listening on specified port
- Test health endpoint manually: `docker exec <container> curl -f http://localhost:3000/health/live`

### Memory health check fails
- Increase memory thresholds in health.controller.ts
- Check for memory leaks (review heap usage trends)
- Adjust Docker memory limits if needed

## Best Practices

1. **Keep liveness simple**: Don't check dependencies in /health/live
2. **Make readiness strict**: Check all critical dependencies in /health/ready
3. **Use appropriate timeouts**: Health checks should respond < 3 seconds
4. **Log health failures**: Use Logger to track health check failures
5. **Test during development**: Verify health checks work before deployment
6. **Monitor in production**: Set up alerts on health check failures
7. **Document dependencies**: Update this matrix when adding new dependencies

## Related Documentation

- NestJS Terminus: https://docs.nestjs.com/recipes/terminus
- Kubernetes Probes: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
- Docker HEALTHCHECK: https://docs.docker.com/engine/reference/builder/#healthcheck
