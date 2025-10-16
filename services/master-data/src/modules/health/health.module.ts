import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis.health';
import { KafkaHealthIndicator } from './kafka.health';
import { RedisModule } from '../redis/redis.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    TerminusModule,
    RedisModule,
    KafkaModule,
  ],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, KafkaHealthIndicator],
})
export class HealthModule {}