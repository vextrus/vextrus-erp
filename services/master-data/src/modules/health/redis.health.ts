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