import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'master-data',
      version: '1.0.0',
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  async getReadiness() {
    // TODO: Add checks for database connectivity, dependencies, etc.
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      service: 'master-data',
      checks: {
        database: 'ok',
        cache: 'ok',
      },
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async getLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      service: 'master-data',
    };
  }
}