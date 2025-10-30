import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface RedisCacheModuleOptions {
  isGlobal?: boolean;
  connectionName?: string;
}

export const REDIS_CACHE_CLIENT = 'REDIS_CACHE_CLIENT';

@Global()
@Module({})
export class RedisCacheModule {
  static forRootAsync(options: RedisCacheModuleOptions = {}): DynamicModule {
    const redisProvider = {
      provide: REDIS_CACHE_CLIENT,
      useFactory: async (configService: ConfigService) => {
        const redis = new Redis({
          host: configService.get('REDIS_HOST', 'redis'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 0),
          keyPrefix: configService.get('REDIS_KEY_PREFIX', 'vextrus:'),
          retryStrategy: (times: number) => {
            return Math.min(times * 50, 2000);
          },
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: false,
        });

        redis.on('error', (err) => {
          console.error('Redis Client Error:', err);
        });

        redis.on('connect', () => {
          console.log('Redis Client Connected');
        });

        return redis;
      },
      inject: [ConfigService],
    };

    return {
      module: RedisCacheModule,
      imports: [ConfigModule],
      providers: [redisProvider],
      exports: [REDIS_CACHE_CLIENT],
      global: options.isGlobal ?? true,
    };
  }
}