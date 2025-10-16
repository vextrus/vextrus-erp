import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { PrometheusService } from './prometheus.service';

@Global()
@Module({
  providers: [RedisService, PrometheusService],
  exports: [RedisService, PrometheusService],
})
export class InfrastructureModule {}