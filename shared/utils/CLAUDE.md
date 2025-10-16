# @vextrus/utils CLAUDE.md

## Purpose
Shared utility package providing OpenTelemetry observability, tracing decorators, context propagation utilities, and standardized telemetry initialization for Vextrus ERP services.

## Narrative Summary
The @vextrus/utils package serves as the centralized observability foundation for all Vextrus ERP services. It provides comprehensive OpenTelemetry integration with standardized tracing, metrics collection, and context propagation utilities. The package includes TypeScript decorators for automatic instrumentation, context utilities for distributed tracing, and a unified telemetry initializer that configures OTLP exporters with auto-instrumentation. Services can easily integrate full observability by importing the pre-configured modules and decorators, ensuring consistent telemetry data across the entire system.

## Module Structure
- `src/observability/` - OpenTelemetry observability utilities
  - `telemetry.initializer.ts:25-122` - NodeSDK initialization with OTLP exporters
  - `observability.module.ts:10-33` - NestJS module for observability integration
  - `tracing.decorator.ts:6-197` - @Trace and @Span method decorators
  - `context-propagation.utils.ts:8-197` - W3C trace context utilities
  - `observability.constants.ts:5-112` - Semantic conventions and constants
  - `observability.types.ts:3-100` - TypeScript interfaces for telemetry

## Key Components
### Telemetry Initialization (telemetry.initializer.ts)
- `initializeTelemetry:25-100` - Configure NodeSDK with OTLP exporters
- `setupServiceTelemetry:105-122` - Standard service telemetry setup
- Auto-instrumentation for HTTP, database, and messaging systems
- Resource attributes with service metadata and semantic conventions

### Tracing Decorators (tracing.decorator.ts)
- `@Trace:6-65` - Automatic span creation for method execution
- `@Span:70-115` - Child span creation within existing traces
- Method argument and result recording options
- Automatic error handling and span status management

### Context Propagation (context-propagation.utils.ts)
- `extractTraceContext:8-27` - Extract W3C trace context from headers
- `injectTraceContext:32-52` - Inject trace context into outgoing requests
- `createPropagationHeaders:57-75` - Generate W3C traceparent headers
- `addUserContext:155-166` - Enrich spans with user information
- `addErrorContext:171-182` - Record exceptions in current span

### NestJS Integration (observability.module.ts)
- `ObservabilityModule.forRoot:11-32` - Dynamic module configuration
- `TracingInterceptor:42-129` - HTTP request tracing interceptor
- Automatic W3C Trace Context propagation in HTTP responses
- Configurable tracing enablement per service

## Dependencies
- External: @opentelemetry/sdk-node, @opentelemetry/auto-instrumentations-node
- External: @opentelemetry/exporter-trace-otlp-grpc, @opentelemetry/exporter-metrics-otlp-grpc
- External: @opentelemetry/api, @opentelemetry/core
- External: @nestjs/common, @nestjs/core (for NestJS integration)
- External: rxjs (for interceptor implementation)

## Configuration
Telemetry configuration interface (`TelemetryConfig`):
- `serviceName` - Service identifier for telemetry
- `serviceVersion` - Service version for resource attributes
- `environment` - Deployment environment (dev/staging/prod)
- `otlpEndpoint` - OTLP collector endpoint URL
- `otlpHeaders` - Additional headers for OTLP export
- `metricsInterval` - Metrics export interval in milliseconds
- `enableConsoleExporter` - Debug console output enablement

## Usage Patterns
### Service Integration
```typescript
// In main.ts - Initialize telemetry before app bootstrap
import { setupServiceTelemetry } from '@vextrus/utils';
setupServiceTelemetry('my-service');

// In app.module.ts - Add observability module
import { ObservabilityModule } from '@vextrus/utils';
@Module({
  imports: [
    ObservabilityModule.forRoot({
      serviceName: 'my-service',
      enableTracing: true
    })
  ]
})
```

### Method Tracing
```typescript
import { Trace, Span } from '@vextrus/utils';

@Trace('UserService.createUser', { recordArgs: true })
async createUser(userData: CreateUserDto) {
  return await this.userRepository.save(userData);
}

@Span('validation')
private validateUser(user: User) {
  // Validation logic - automatically traced as child span
}
```

### Context Propagation
```typescript
import { injectTraceContext, addUserContext } from '@vextrus/utils';

// In HTTP client
const headers = injectTraceContext({ 'content-type': 'application/json' });

// In request handler
addUserContext(user.id, user.email, user.tenantId);
```

## Constants and Standards
- W3C Trace Context propagation format support
- OpenTelemetry semantic conventions for HTTP, database, messaging
- Custom Vextrus-specific attributes (user.id, tenant.id, correlation.id)
- Standardized metric names for business events
- OTLP as default export format with gRPC transport

## Testing
- Test directory: `src/observability/__tests__/`
- Decorator unit tests: `tracing.decorator.spec.ts`
- Mocked OpenTelemetry API for isolated testing

## Related Documentation
- ../../services/auth/CLAUDE.md - Auth service telemetry implementation
- ../../docs/adr/ - Architecture decisions for observability patterns
- OpenTelemetry documentation for semantic conventions