import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
  MicroserviceHealthIndicator
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
    private redis: RedisHealthIndicator,
    private kafka: KafkaHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Get health status' })
  @ApiResponse({ status: 200, description: 'Health check passed' })
  @ApiResponse({ status: 503, description: 'Health check failed' })
  check() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      () => this.db.pingCheck('database'),
      () => this.redis.isHealthy('redis'),
      () => this.kafka.isHealthy('kafka'),
    ]);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready() {
    try {
      await this.health.check([
        () => this.db.pingCheck('database'),
        () => this.redis.isHealthy('redis'),
        () => this.kafka.isHealthy('kafka'),
      ]);
      return { status: 'ready', service: 'master-data' };
    } catch (error) {
      throw error;
    }
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  live() {
    return {
      status: 'alive',
      service: 'master-data',
      timestamp: new Date().toISOString()
    };
  }
}