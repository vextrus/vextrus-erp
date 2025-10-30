import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator, HealthCheckResult } from '@nestjs/terminus';
import { EventStoreService } from '@infrastructure/persistence/event-store/event-store.service';
import { Public } from '@infrastructure/decorators/public.decorator';

@Controller('health')
@Public()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private eventStore: EventStoreService,
  ) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      async () => {
        const isConnected = await this.eventStore.checkConnection();
        return {
          eventstore: {
            status: isConnected ? 'up' : 'down',
            message: isConnected ? 'EventStore is connected' : 'EventStore connection failed',
          },
        };
      },
    ]);
  }

  @Get('ready')
  async readiness(): Promise<any> {
    return {
      status: 'ready',
      service: 'finance-service',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('live')
  async liveness(): Promise<any> {
    return {
      status: 'alive',
      service: 'finance-service',
      timestamp: new Date().toISOString(),
    };
  }
}