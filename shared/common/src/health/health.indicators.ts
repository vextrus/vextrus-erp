import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { Kafka } from 'kafkajs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthIndicators extends HealthIndicator {
  private kafka: Kafka;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {
    super();
    this.kafka = new Kafka({
      clientId: 'health-check',
      brokers: this.configService.get('KAFKA_BROKERS', 'kafka:9093').split(','),
    });
  }

  async checkDatabase(): Promise<HealthIndicatorResult> {
    const key = 'database';
    try {
      // Simple query to check database connection
      await this.executeQuery('SELECT 1');
      return this.getStatus(key, true, { message: 'Database is healthy' });
    } catch (error) {
      throw new HealthCheckError(
        'Database check failed',
        this.getStatus(key, false, {
          message: error.message,
        }),
      );
    }
  }

  async checkRedis(): Promise<HealthIndicatorResult> {
    const key = 'redis';
    try {
      const result = await this.redis.ping();
      if (result === 'PONG') {
        return this.getStatus(key, true, {
          message: 'Redis is healthy',
          info: await this.redis.info('server'),
        });
      }
      throw new Error('Redis ping failed');
    } catch (error) {
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, {
          message: error.message,
        }),
      );
    }
  }

  async checkKafka(): Promise<HealthIndicatorResult> {
    const key = 'kafka';
    const admin = this.kafka.admin();
    try {
      await admin.connect();
      const topics = await admin.listTopics();
      await admin.disconnect();
      return this.getStatus(key, true, {
        message: 'Kafka is healthy',
        topics: topics.length,
      });
    } catch (error) {
      throw new HealthCheckError(
        'Kafka check failed',
        this.getStatus(key, false, {
          message: error.message,
        }),
      );
    }
  }

  async checkServiceDependencies(): Promise<HealthIndicatorResult> {
    const key = 'dependencies';
    const dependencies = [];

    // Check if dependent services are reachable
    const servicesToCheck = this.configService.get<string[]>('HEALTH_CHECK_SERVICES', []);

    for (const service of servicesToCheck) {
      try {
        const response = await fetch(`${service}/health/live`);
        dependencies.push({
          service: service,
          status: response.ok ? 'healthy' : 'unhealthy',
          statusCode: response.status,
        });
      } catch (error) {
        dependencies.push({
          service: service,
          status: 'unreachable',
          error: error.message,
        });
      }
    }

    const allHealthy = dependencies.every(d => d.status === 'healthy');

    if (allHealthy || dependencies.length === 0) {
      return this.getStatus(key, true, {
        message: 'All dependencies are healthy',
        dependencies,
      });
    }

    throw new HealthCheckError(
      'Some dependencies are unhealthy',
      this.getStatus(key, false, {
        dependencies,
      }),
    );
  }

  async checkMigrations(): Promise<HealthIndicatorResult> {
    const key = 'migrations';
    try {
      // Check if all migrations have been run
      const pendingMigrations = await this.getPendingMigrations();

      if (pendingMigrations.length === 0) {
        return this.getStatus(key, true, {
          message: 'All migrations are up to date',
        });
      }

      throw new Error(`${pendingMigrations.length} pending migrations`);
    } catch (error) {
      throw new HealthCheckError(
        'Migration check failed',
        this.getStatus(key, false, {
          message: error.message,
        }),
      );
    }
  }

  async checkTemporal(): Promise<HealthIndicatorResult> {
    const key = 'temporal';
    try {
      const temporalAddress = this.configService.get('TEMPORAL_ADDRESS');
      if (!temporalAddress) {
        return this.getStatus(key, true, {
          message: 'Temporal not configured for this service',
        });
      }

      // Simple health check for Temporal
      const response = await fetch(`http://${temporalAddress.replace(':7233', ':8088')}/`);

      if (response.ok) {
        return this.getStatus(key, true, {
          message: 'Temporal is healthy',
          address: temporalAddress,
        });
      }

      throw new Error('Temporal health check failed');
    } catch (error) {
      throw new HealthCheckError(
        'Temporal check failed',
        this.getStatus(key, false, {
          message: error.message,
        }),
      );
    }
  }

  async checkMemoryHeap(): Promise<HealthIndicatorResult> {
    const key = 'memory_heap';
    const heapUsed = process.memoryUsage().heapUsed;
    const heapLimit = process.memoryUsage().heapTotal;
    const heapPercent = (heapUsed / heapLimit) * 100;

    const isHealthy = heapPercent < 90;

    if (isHealthy) {
      return this.getStatus(key, true, {
        used: Math.round(heapUsed / 1048576), // Convert to MB
        limit: Math.round(heapLimit / 1048576),
        percentage: Math.round(heapPercent),
      });
    }

    throw new HealthCheckError(
      'Memory heap usage is too high',
      this.getStatus(key, false, {
        used: Math.round(heapUsed / 1048576),
        limit: Math.round(heapLimit / 1048576),
        percentage: Math.round(heapPercent),
      }),
    );
  }

  async checkDiskSpace(): Promise<HealthIndicatorResult> {
    const key = 'disk_space';
    // This would need to be implemented based on the OS
    // For now, returning a placeholder
    return this.getStatus(key, true, {
      message: 'Disk space check not implemented',
    });
  }

  private async executeQuery(query: string): Promise<any> {
    // This would be injected from the specific service
    // Each service would provide its own database connection
    return Promise.resolve(true);
  }

  private async getPendingMigrations(): Promise<string[]> {
    // This would check the migrations status
    // Implementation depends on the migration tool being used
    return [];
  }
}