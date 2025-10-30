import { DynamicModule, Global, Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';

@Global()
@Module({})
export class TelemetryModule {
  static forRoot(): DynamicModule {
    // Simple telemetry module without complex OpenTelemetry setup for now
    // This avoids version compatibility issues with OpenTelemetry packages
    const serviceName = process.env.OTEL_SERVICE_NAME || 'finance-service';

    console.log(`Telemetry module initialized for ${serviceName}`);

    process.on('SIGTERM', () => {
      console.log('Shutting down telemetry service');
      process.exit(0);
    });

    return {
      module: TelemetryModule,
      providers: [
        TelemetryService,
        {
          provide: 'OTEL_SDK',
          useValue: null, // Placeholder for future OpenTelemetry SDK
        },
      ],
      exports: [TelemetryService],
    };
  }
}