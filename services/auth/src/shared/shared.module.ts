import { Module } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [RedisModule, KafkaModule],
  exports: [RedisModule, KafkaModule],
})
export class SharedModule {}