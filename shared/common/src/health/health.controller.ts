import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { HealthIndicators } from './health.indicators';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private indicators: HealthIndicators,
  ) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.indicators.checkDatabase(),
      () => this.indicators.checkRedis(),
      () => this.indicators.checkKafka(),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  async readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.indicators.checkDatabase(),
      () => this.indicators.checkRedis(),
      () => this.indicators.checkKafka(),
      () => this.indicators.checkServiceDependencies(),
    ]);
  }

  @Get('live')
  liveness(): { status: string; timestamp: string; uptime: number } {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('startup')
  @HealthCheck()
  async startup(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.indicators.checkDatabase(),
      () => this.indicators.checkRedis(),
      () => this.indicators.checkMigrations(),
    ]);
  }
}