import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';

@Controller()
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Get('health')
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }

  @Get('ready')
  ready(): string {
    return 'OK';
  }

  @Get('live')
  live(): string {
    return 'OK';
  }
}