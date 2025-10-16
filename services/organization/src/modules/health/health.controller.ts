import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async health() {
    return {
      status: 'ok',
      service: 'organization-service',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  async liveness() {
    // Liveness probe should be simple - just verify the process is alive
    // Memory checks belong in /health, not /health/live
    return {
      status: 'ok',
      service: 'organization-service',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async readiness() {
    const checks = await this.healthService.checkDependencies();
    const allHealthy = Object.values(checks).every(check => check.status === 'ok');
    
    if (!allHealthy) {
      throw new Error('Service not ready');
    }
    
    return {
      status: 'ok',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('stats')
  async stats() {
    const stats = await this.healthService.getStatistics();
    return {
      service: 'organization-service',
      statistics: stats,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('dependencies')
  async dependencies() {
    const deps = await this.healthService.getDependencies();
    return {
      service: 'organization-service',
      dependencies: deps,
      timestamp: new Date().toISOString(),
    };
  }
}