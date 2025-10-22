# Monitoring & Observability Patterns

**Purpose**: Complete OpenTelemetry, Prometheus, and distributed tracing setup for Vextrus ERP services.

---

## OpenTelemetry Configuration

### Full Module Setup

```typescript
// Location: services/*/src/telemetry/telemetry.module.ts

import { Module, Global } from '@nestjs/common';
import { OpenTelemetryModule } from '@opentelemetry/nestjs';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';

@Global()
@Module({
  imports: [
    OpenTelemetryModule.forRoot({
      serviceName: process.env.OTEL_SERVICE_NAME || 'vextrus-service',
      serviceVersion: process.env.SERVICE_VERSION || '1.0.0',

      // Trace Exporter (OTLP)
      traceExporter: {
        otlp: {
          url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
          headers: JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS || '{}'),
        },
      },

      // Metric Exporter (OTLP)
      metricExporter: {
        otlp: {
          url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
          exportIntervalMillis: parseInt(process.env.OTEL_METRIC_EXPORT_INTERVAL || '10000'),
        },
      },

      // Auto-instrumentation
      instrumentations: [
        new HttpInstrumentation(),
        new NestInstrumentation(),
        new PgInstrumentation(),
      ],
    }),
  ],
})
export class TelemetryModule {}
```

### Environment Configuration

```env
# Observability (Production)
OTEL_SERVICE_NAME=finance-service
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.monitoring.svc.cluster.local:4317
OTEL_EXPORTER_OTLP_HEADERS={"x-api-key":"production-key-from-vault"}
SERVICE_VERSION=1.2.3
OTEL_METRIC_EXPORT_INTERVAL=10000

# Console exporter (disable in production)
OTEL_CONSOLE_EXPORTER=false

# Sampling (production: always sample critical paths)
OTEL_TRACES_SAMPLER=parentbased_always_on

# Resource attributes
OTEL_RESOURCE_ATTRIBUTES=environment=production,team=platform,cost-center=engineering
```

---

## Distributed Tracing Patterns

### Context Propagation Interceptor

```typescript
// Location: services/*/src/telemetry/trace-propagation.interceptor.ts

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { trace } from '@opentelemetry/api';

@Injectable()
export class TracePropagationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const span = trace.getActiveSpan();

    if (span) {
      // Enrich span with business context
      span.setAttributes({
        'user.id': request.user?.id || 'anonymous',
        'tenant.id': request.headers['x-tenant-id'] || 'unknown',
        'request.method': request.method,
        'request.url': request.url,
        'request.user_agent': request.headers['user-agent'],
      });

      // Add custom events
      span.addEvent('request.processing.start', {
        'request.id': request.headers['x-request-id'],
      });
    }

    return next.handle().pipe(
      tap(() => {
        if (span) {
          span.addEvent('request.processing.complete');
        }
      }),
      catchError((error) => {
        if (span) {
          span.recordException(error);
          span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        }
        throw error;
      })
    );
  }
}
```

### Apply Globally

```typescript
// Location: services/*/src/app.module.ts

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TracePropagationInterceptor,
    },
  ],
})
export class AppModule {}
```

### Custom Spans for Business Operations

```typescript
// Location: services/*/src/application/commands/handlers/create-invoice.handler.ts

import { trace } from '@opentelemetry/api';

@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler {
  async execute(command: CreateInvoiceCommand): Promise<Invoice> {
    const tracer = trace.getTracer('invoice-service');

    return tracer.startActiveSpan('invoice.create', async (span) => {
      try {
        span.setAttributes({
          'invoice.customer_id': command.customerId,
          'invoice.amount': command.totalAmount,
          'invoice.currency': command.currency,
        });

        // Business logic
        const invoice = await this.invoiceService.create(command);

        span.addEvent('invoice.created', {
          'invoice.id': invoice.id,
          'invoice.number': invoice.invoiceNumber,
        });

        return invoice;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
```

---

## Prometheus Metrics Patterns

### Metrics Controller

```typescript
// Location: services/*/src/metrics/metrics.controller.ts

import { Controller, Get } from '@nestjs/common';
import { Public } from '../infrastructure/decorators/public.decorator';
import { register } from 'prom-client';

@Controller('metrics')
export class MetricsController {
  @Get()
  @Public() // No authentication for metrics endpoint
  async getMetrics(): Promise<string> {
    return register.metrics(); // Prometheus text format
  }
}
```

### Custom Business Metrics

```typescript
// Location: services/*/src/metrics/business-metrics.ts

import { Counter, Histogram, Gauge } from 'prom-client';

// Counter: Monotonically increasing
export const invoiceCreationCounter = new Counter({
  name: 'vextrus_invoices_created_total',
  help: 'Total number of invoices created',
  labelNames: ['tenant_id', 'status', 'currency'],
});

// Histogram: Distribution of values
export const invoiceProcessingDuration = new Histogram({
  name: 'vextrus_invoice_processing_duration_seconds',
  help: 'Duration of invoice processing in seconds',
  labelNames: ['tenant_id', 'operation'],
  buckets: [0.1, 0.5, 1, 2, 5, 10], // seconds
});

// Gauge: Value that can go up or down
export const activeInvoicesGauge = new Gauge({
  name: 'vextrus_active_invoices',
  help: 'Number of active (unpaid) invoices',
  labelNames: ['tenant_id'],
});

// Usage in service
export class InvoiceService {
  async create(data: CreateInvoiceDto): Promise<Invoice> {
    const start = Date.now();

    try {
      const invoice = await this.repo.save(data);

      // Increment counter
      invoiceCreationCounter.inc({
        tenant_id: data.tenantId,
        status: invoice.status,
        currency: invoice.currency,
      });

      // Record duration
      const duration = (Date.now() - start) / 1000;
      invoiceProcessingDuration.observe(
        { tenant_id: data.tenantId, operation: 'create' },
        duration
      );

      // Update gauge
      const activeCount = await this.repo.count({
        where: { status: 'unpaid', tenantId: data.tenantId },
      });
      activeInvoicesGauge.set({ tenant_id: data.tenantId }, activeCount);

      return invoice;
    } catch (error) {
      // Track errors
      invoiceCreationCounter.inc({
        tenant_id: data.tenantId,
        status: 'error',
        currency: data.currency || 'unknown',
      });
      throw error;
    }
  }
}
```

### Standard Metrics (Auto-collected)

These are automatically collected by OpenTelemetry and Prometheus client:

**System Metrics**:
- `process_cpu_user_seconds_total`
- `process_resident_memory_bytes`
- `process_heap_bytes`
- `nodejs_eventloop_lag_seconds`

**HTTP Metrics**:
- `http_request_duration_seconds`
- `http_requests_total`
- `http_request_size_bytes`
- `http_response_size_bytes`

**Database Metrics** (via PgInstrumentation):
- `pg_query_duration_seconds`
- `pg_connections_active`
- `pg_connections_idle`

---

## Grafana Dashboard Configuration

### Dashboard JSON Template

```json
{
  "dashboard": {
    "title": "Finance Service - Production",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{service=\"finance-service\"}[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{service=\"finance-service\",status=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{service=\"finance-service\"}[5m]))"
          }
        ]
      },
      {
        "title": "Active Invoices by Tenant",
        "targets": [
          {
            "expr": "vextrus_active_invoices"
          }
        ]
      }
    ]
  }
}
```

---

## Alerting Rules

### Prometheus Alert Configuration

```yaml
# Location: k8s/monitoring/alerts/finance-service-alerts.yaml

groups:
  - name: finance-service
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          rate(http_requests_total{service="finance-service",status=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
          service: finance-service
        annotations:
          summary: "High error rate in Finance Service"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 5%)"

      # Slow response time
      - alert: SlowResponseTime
        expr: |
          histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{service="finance-service"}[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
          service: finance-service
        annotations:
          summary: "Slow response times in Finance Service"
          description: "P95 latency is {{ $value }}s (threshold: 500ms)"

      # Database connection pool exhaustion
      - alert: DatabasePoolExhausted
        expr: |
          pg_connections_active{service="finance-service"} / pg_connections_max{service="finance-service"} > 0.9
        for: 2m
        labels:
          severity: critical
          service: finance-service
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "{{ $value | humanizePercentage }} of connections in use"

      # Memory usage high
      - alert: HighMemoryUsage
        expr: |
          process_resident_memory_bytes{service="finance-service"} > 900000000
        for: 5m
        labels:
          severity: warning
          service: finance-service
        annotations:
          summary: "High memory usage in Finance Service"
          description: "Memory usage is {{ $value | humanize1024 }} (threshold: 900MB)"
```

---

## Log Aggregation

### Structured Logging with Winston

```typescript
// Location: services/*/src/infrastructure/logging/logger.service.ts

import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json() // Structured JSON for aggregation
  ),
  defaultMeta: {
    service: process.env.OTEL_SERVICE_NAME,
    version: process.env.SERVICE_VERSION,
    environment: process.env.NODE_ENV,
  },
  transports: [
    // Console (captured by k8s)
    new transports.Console(),

    // File (if needed)
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add trace context to logs
export class LoggerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const span = trace.getActiveSpan();
    const spanContext = span?.spanContext();

    if (spanContext) {
      logger.defaultMeta = {
        ...logger.defaultMeta,
        trace_id: spanContext.traceId,
        span_id: spanContext.spanId,
      };
    }

    return next.handle();
  }
}
```

### FluentBit Configuration (Kubernetes)

```yaml
# Location: k8s/monitoring/fluentbit-config.yaml

apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush        5
        Daemon       Off
        Log_Level    info

    [INPUT]
        Name              tail
        Path              /var/log/containers/finance-service*.log
        Parser            docker
        Tag               kube.*
        Refresh_Interval  5

    [FILTER]
        Name                kubernetes
        Match               kube.*
        Kube_URL            https://kubernetes.default.svc:443
        Merge_Log           On

    [OUTPUT]
        Name  es
        Match kube.*
        Host  elasticsearch.monitoring.svc.cluster.local
        Port  9200
        Index finance-logs
        Type  _doc
```

---

## SLI/SLO Definitions

### Service Level Indicators (SLIs)

```typescript
// Finance Service SLIs

export const SLIs = {
  // Availability: % of successful requests
  availability: {
    target: 99.9, // 99.9% uptime
    measurement: 'http_requests_total{status!~"5.."} / http_requests_total',
  },

  // Latency: % of requests under threshold
  latency: {
    target: 95, // 95% of requests under 300ms
    threshold: 0.3, // seconds
    measurement: 'histogram_quantile(0.95, http_request_duration_seconds_bucket)',
  },

  // Error Rate: % of requests without errors
  errorRate: {
    target: 99, // 99% success rate
    measurement: 'http_requests_total{status!~"5.."} / http_requests_total',
  },

  // Throughput: requests per second
  throughput: {
    baseline: 100, // 100 RPS expected
    measurement: 'rate(http_requests_total[5m])',
  },
};
```

### Service Level Objectives (SLOs)

```yaml
# Finance Service SLOs
slos:
  - name: availability
    objective: 99.9%
    window: 30d

  - name: latency-p95
    objective: <300ms
    percentile: 95
    window: 7d

  - name: error-rate
    objective: <1%
    window: 24h
```

---

## Resources

- **OpenTelemetry**: https://opentelemetry.io/docs/
- **Prometheus**: https://prometheus.io/docs/
- **Grafana**: https://grafana.com/docs/
- **FluentBit**: https://docs.fluentbit.io/
- **SLO/SLI Guide**: https://sre.google/workbook/implementing-slos/
