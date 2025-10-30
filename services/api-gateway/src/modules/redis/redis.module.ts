import { Module } from '@nestjs/common';
import { RedisModule as NestRedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    NestRedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        options: {
          host: configService.get<string>('redis.host') || 'redis',
          port: configService.get<number>('redis.port') || 6379,
          password: configService.get<string>('redis.password'),
          db: configService.get<number>('redis.db') || 3,
          retryStrategy: (times: number) => {
            if (times > 3) {
              return null; // Stop retrying
            }
            return Math.min(times * 200, 2000);
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [NestRedisModule],
})
export class RedisModule {}
