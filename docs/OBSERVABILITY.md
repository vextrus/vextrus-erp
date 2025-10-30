# OpenTelemetry Observability Guide

## Overview

The Vextrus ERP platform implements comprehensive observability using OpenTelemetry standards, providing distributed tracing, metrics collection, and context propagation across all microservices.

## Architecture

### Components

1. **OpenTelemetry SDK** - Core instrumentation library
2. **W3C Trace Context** - Standard for distributed tracing context propagation
3. **OTLP Exporters** - Send telemetry data to observability backends
4. **Custom Decorators** - Simplified instrumentation for methods and classes
5. **NestJS Interceptors** - Automatic HTTP request/response instrumentation

### Data Flow

```
Service → SDK → Exporters → Collector → Backend (SigNoz/Jaeger)
```

## Quick Start

### 1. Environment Setup

Configure OpenTelemetry environment variables:

```bash
# Required
export OTEL_SERVICE_NAME=your-service-name
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# Optional
export OTEL_ENVIRONMENT=development
export OTEL_SAMPLING_RATE=1.0
export OTEL_METRICS_INTERVAL=10000
```

### 2. Service Integration

#### For New Services

```typescript
// main.ts
import { setupServiceTelemetry } from '@vextrus/utils/observability';

async function bootstrap() {
  // Initialize telemetry before anything else
  setupServiceTelemetry('your-service-name');
  
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
```

#### For Existing Services

```typescript
// app.module.ts
import { ContextPropagationInterceptor } from './telemetry/context-propagation.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ContextPropagationInterceptor,
    },
  ],
})
export class AppModule {}
```

## Features

### 1. Distributed Tracing

Automatic trace context propagation using W3C Trace Context headers:

```typescript
// Automatically propagates trace context
@Controller('api')
export class ApiController {
  @Get('users')
  @Trace() // Creates span for this method
  async getUsers() {
    // Trace context automatically propagated to downstream services
    return this.userService.findAll();
  }
}
```

### 2. Metrics Collection

Built-in and custom metrics:

```typescript
@Injectable()
export class UserService {
  @Metric() // Tracks calls, errors, and duration
  async createUser(data: CreateUserDto) {
    // Method automatically instrumented
    return this.userRepository.save(data);
  }
  
  @Count('user.registrations') // Custom counter
  async registerUser(data: RegisterDto) {
    // Counts registrations
  }
  
  @Timed('db.query.duration') // Custom histogram
  async complexQuery() {
    // Measures execution time
  }
}
```

### 3. Context Propagation

Trace context automatically propagated across service boundaries:

```typescript
// Service A
const response = await axios.get('http://service-b/api/data', {
  headers: injectTraceContext() // Adds trace headers
});

// Service B automatically receives and continues the trace
```

### 4. Custom Instrumentation

#### Using Decorators

```typescript
// Trace decorator with options
@Trace('custom-span-name', {
  kind: SpanKind.CLIENT,
  attributes: { 'custom.attr': 'value' },
  skipArgs: ['password'] // Don't record sensitive data
})
async sensitiveOperation(username: string, password: string) {
  // Implementation
}

// Span decorator for simple tracing
@Span('database-query')
async queryDatabase() {
  // Implementation
}

// WithSpan decorator injects span as parameter
@WithSpan()
async processWithSpan(span: Span, data: any) {
  span.addEvent('processing-started');
  // Use span directly
  span.setAttributes({ 'data.size': data.length });
}
```

#### Manual Instrumentation

```typescript
import { trace, context } from '@opentelemetry/api';

const tracer = trace.getTracer('manual-instrumentation');

// Create span manually
const span = tracer.startSpan('manual-operation');
try {
  // Your code here
  span.setAttributes({ 'custom.attribute': 'value' });
} catch (error) {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR });
  throw error;
} finally {
  span.end();
}
```

## Shared Utilities

The `@vextrus/utils` package provides reusable observability components:

### Context Propagation Utilities

```typescript
import {
  extractTraceContext,
  injectTraceContext,
  createPropagationHeaders,
  getCorrelationId,
  addUserContext,
  addErrorContext
} from '@vextrus/utils/observability';

// Extract trace from incoming request
const traceContext = extractTraceContext(request.headers);

// Inject trace into outgoing request
const headers = injectTraceContext();

// Add user context to current span
addUserContext('user-123', 'user@example.com', 'tenant-456');

// Record error with context
try {
  // operation
} catch (error) {
  addErrorContext(error);
  throw error;
}
```

### Telemetry Initializer

```typescript
import { initializeTelemetry } from '@vextrus/utils/observability';

// Initialize with custom configuration
const sdk = initializeTelemetry({
  serviceName: 'my-service',
  serviceVersion: '1.0.0',
  environment: 'production',
  otlpEndpoint: 'http://collector:4317',
  enableTracing: true,
  enableMetrics: true,
  samplingRate: 0.1 // Sample 10% of traces
});
```

## Testing

### Unit Tests

```typescript
// Mock OpenTelemetry APIs for unit tests
jest.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: jest.fn().mockReturnValue({
      startSpan: jest.fn().mockReturnValue({
        end: jest.fn(),
        setAttributes: jest.fn(),
        recordException: jest.fn()
      })
    })
  }
}));
```

### Integration Tests

```typescript
// Test trace propagation
it('should propagate trace context', async () => {
  const response = await request(app.getHttpServer())
    .get('/api/test')
    .set('traceparent', '00-traceId-spanId-01')
    .expect(200);
    
  expect(response.headers).toHaveProperty('traceparent');
});
```

## Monitoring & Dashboards

### SigNoz Setup

1. Start SigNoz using Docker Compose:
```bash
cd infrastructure/monitoring
docker-compose up -d
```

2. Access SigNoz UI: http://localhost:3301

3. View traces, metrics, and logs in unified interface

### Key Metrics to Monitor

- **Request Rate** - Requests per second by endpoint
- **Error Rate** - 4xx and 5xx responses
- **Latency** - P50, P95, P99 response times
- **Saturation** - CPU, memory, database connections

### Alerting Rules

Configure alerts for:
- Error rate > 1%
- P99 latency > 2 seconds
- Failed authentication attempts > 10/minute
- Service unavailable

## Best Practices

### 1. Sampling Strategy

Production environments should use sampling to reduce overhead:

```typescript
// Adaptive sampling based on traffic
const samplingRate = process.env.NODE_ENV === 'production' ? 0.01 : 1.0;
```

### 2. Attribute Naming

Follow OpenTelemetry semantic conventions:
- `http.method`, `http.status_code`, `http.url`
- `db.system`, `db.name`, `db.statement`
- `user.id`, `user.email`, `tenant.id`

### 3. Sensitive Data

Never record sensitive information:
```typescript
@Trace(undefined, {
  skipArgs: ['password', 'token', 'apiKey', 'secret']
})
```

### 4. Error Handling

Always record exceptions with context:
```typescript
try {
  // operation
} catch (error) {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR });
  // Add additional context
  span.setAttributes({
    'error.type': error.constructor.name,
    'error.handled': false
  });
  throw error;
}
```

### 5. Performance Considerations

- Use sampling in production (0.1-1% typically)
- Batch exports to reduce network overhead
- Set appropriate export timeouts
- Monitor telemetry pipeline health

## Troubleshooting

### Common Issues

1. **No traces appearing**
   - Check OTEL_EXPORTER_OTLP_ENDPOINT is correct
   - Verify collector is running
   - Check network connectivity
   - Review sampling configuration

2. **Missing trace context**
   - Ensure ContextPropagationInterceptor is registered
   - Verify headers are being forwarded
   - Check for middleware that strips headers

3. **High memory usage**
   - Reduce sampling rate
   - Decrease batch size
   - Increase export frequency

4. **Incomplete traces**
   - Ensure all services are instrumented
   - Check trace context propagation
   - Verify time synchronization between services

### Debug Mode

Enable debug logging for OpenTelemetry:

```bash
export OTEL_LOG_LEVEL=debug
```

### Health Checks

Monitor telemetry pipeline health:

```typescript
// Add telemetry health indicator
@Injectable()
export class TelemetryHealthIndicator extends HealthIndicator {
  async isHealthy(): Promise<HealthIndicatorResult> {
    // Check exporter status
    // Verify span creation
    // Monitor export success rate
  }
}
```

## Migration Guide

### From Custom Tracing to OpenTelemetry

1. Replace custom trace IDs with W3C trace context
2. Update HTTP clients to use context propagation
3. Migrate custom metrics to OpenTelemetry metrics
4. Update dashboards to use new data format

### Version Compatibility

- OpenTelemetry JS: v1.18+
- NestJS: v10.0+
- Node.js: v18+

## References

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [SigNoz Documentation](https://signoz.io/docs/)
- [OpenTelemetry Semantic Conventions](https://opentelemetry.io/docs/reference/specification/trace/semantic_conventions/)