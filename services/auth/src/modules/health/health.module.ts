import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis.health';
import { KafkaHealthIndicator } from './kafka.health';
import { SharedModule } from '@shared/shared.module';

@Module({
  imports: [TerminusModule, SharedModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, KafkaHealthIndicator],
})
export class HealthModule {}