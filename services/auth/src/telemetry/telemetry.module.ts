import { Module, Global } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { PropagationService } from './propagation.service';
import { ContextPropagationInterceptor } from './context-propagation.interceptor';
import { TracingService } from './tracing.service';

@Global()
@Module({
  providers: [
    TracingService,
    MetricsService,
    PropagationService,
    ContextPropagationInterceptor,
  ],
  exports: [
    TracingService,
    MetricsService,
    PropagationService,
    ContextPropagationInterceptor,
  ],
})
export class TelemetryModule {}