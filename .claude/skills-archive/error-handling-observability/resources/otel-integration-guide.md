# OpenTelemetry Integration Guide

Complete guide for implementing distributed tracing with OpenTelemetry in Vextrus ERP microservices.

---

## Overview

OpenTelemetry provides:
- **Distributed tracing**: Track requests across services
- **Metrics collection**: Business and technical metrics
- **Context propagation**: W3C Trace Context standard
- **Auto-instrumentation**: HTTP, NestJS, PostgreSQL, Kafka

---

## Setup

### 1. Install Dependencies

```bash
pnpm add @opentelemetry/api \
  @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/resources \
  @opentelemetry/semantic-conventions
```

### 2. Create OpenTelemetry Module

```typescript
// src/telemetry/opentelemetry.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

@Module({})
export class OpenTelemetryModule {
  static forRoot() {
    return {
      module: OpenTelemetryModule,
      global: true,
      providers: [
        {
          provide: 'OTEL_SDK',
          useFactory: (configService: ConfigService) => {
            const sdk = new NodeSDK({
              resource: new Resource({
                [SemanticResourceAttributes.SERVICE_NAME]:
                  configService.get('OTEL_SERVICE_NAME'),
                [SemanticResourceAttributes.SERVICE_VERSION]:
                  configService.get('SERVICE_VERSION', '1.0.0'),
              }),
              traceExporter: new OTLPTraceExporter({
                url: configService.get('OTEL_EXPORTER_OTLP_ENDPOINT'),
              }),
              instrumentations: [
                getNodeAutoInstrumentations({
                  '@opentelemetry/instrumentation-http': {},
                  '@opentelemetry/instrumentation-nestjs-core': {},
                  '@opentelemetry/instrumentation-pg': {},
                }),
              ],
            })

            sdk.start()
            return sdk
          },
          inject: [ConfigService],
        },
      ],
      exports: ['OTEL_SDK'],
    }
  }
}
```

### 3. Import in AppModule

```typescript
@Module({
  imports: [
    ConfigModule.forRoot(),
    OpenTelemetryModule.forRoot(),
    // Other modules...
  ],
})
export class AppModule {}
```

---

## Manual Span Creation

### Basic Span Pattern

```typescript
import { trace, SpanStatusCode } from '@opentelemetry/api'

export class PaymentService {
  private readonly tracer = trace.getTracer('payment-service')

  async processPayment(invoice: Invoice): Promise<Payment> {
    const span = this.tracer.startSpan('processPayment', {
      attributes: {
        'invoice.id': invoice.id,
        'invoice.amount': invoice.totalAmount,
        'tenant.id': invoice.tenantId,
        'operation.type': 'payment',
      },
    })

    try {
      const payment = await this.paymentGateway.charge(invoice)

      span.addEvent('payment_charged', {
        'payment.id': payment.id,
        'payment.method': payment.method,
      })

      span.setStatus({ code: SpanStatusCode.OK })
      return payment
    } catch (error) {
      span.recordException(error)
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      })
      throw error
    } finally {
      span.end()
    }
  }
}
```

### Nested Spans

```typescript
async createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const parentSpan = this.tracer.startSpan('createInvoice')

  try {
    // Child span 1: Validation
    const validationSpan = this.tracer.startSpan(
      'validateInvoice',
      {},
      trace.setSpan(context.active(), parentSpan)
    )
    await this.validate(input)
    validationSpan.end()

    // Child span 2: Persistence
    const persistSpan = this.tracer.startSpan(
      'persistInvoice',
      {},
      trace.setSpan(context.active(), parentSpan)
    )
    const invoice = await this.repository.save(input)
    persistSpan.end()

    // Child span 3: Event publishing
    const eventSpan = this.tracer.startSpan(
      'publishEvent',
      {},
      trace.setSpan(context.active(), parentSpan)
    )
    await this.eventBus.publish(new InvoiceCreatedEvent(invoice))
    eventSpan.end()

    parentSpan.setStatus({ code: SpanStatusCode.OK })
    return invoice
  } catch (error) {
    parentSpan.recordException(error)
    parentSpan.setStatus({ code: SpanStatusCode.ERROR })
    throw error
  } finally {
    parentSpan.end()
  }
}
```

---

## Context Propagation

### Interceptor Pattern (NestJS)

```typescript
// src/telemetry/context-propagation.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { context, trace, propagation } from '@opentelemetry/api'

@Injectable()
export class ContextPropagationInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const request = ctx.switchToHttp().getRequest()

    // Extract trace context from incoming headers
    const extractedContext = propagation.extract(
      context.active(),
      request.headers
    )

    // Run handler in extracted context
    return context.with(extractedContext, () => next.handle())
  }
}
```

### Service-to-Service Calls

```typescript
// Inject trace context into outgoing HTTP calls
async callMasterDataService(customerId: string): Promise<Customer> {
  const headers = {}

  // Inject current context into headers
  propagation.inject(context.active(), headers)

  const response = await axios.get(
    `${this.masterDataUrl}/customers/${customerId}`,
    { headers }
  )

  return response.data
}
```

---

## Business Metrics

### Custom Metrics Collection

```typescript
import { metrics } from '@opentelemetry/api'

export class InvoiceService {
  private readonly meter = metrics.getMeter('invoice-service')
  private readonly invoiceCounter = this.meter.createCounter(
    'invoices.created',
    {
      description: 'Number of invoices created',
    }
  )
  private readonly amountHistogram = this.meter.createHistogram(
    'invoices.amount',
    {
      description: 'Distribution of invoice amounts',
      unit: 'BDT',
    }
  )

  async createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
    const invoice = await this.repository.save(input)

    // Record metrics
    this.invoiceCounter.add(1, {
      tenantId: invoice.tenantId,
      status: invoice.status,
    })

    this.amountHistogram.record(invoice.totalAmount, {
      currency: invoice.currency,
      tenantId: invoice.tenantId,
    })

    return invoice
  }
}
```

---

## Testing

### In-Memory Span Exporter for Tests

```typescript
// test/helpers/telemetry-test-helper.ts
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

export function setupTestTelemetry() {
  const spanExporter = new InMemorySpanExporter()
  const tracerProvider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'test-service',
    }),
    spanProcessors: [new SimpleSpanProcessor(spanExporter)],
  })

  tracerProvider.register()

  return {
    spanExporter,
    getSpans: () => spanExporter.getFinishedSpans(),
    clearSpans: () => spanExporter.reset(),
  }
}
```

### Integration Test Example

```typescript
describe('Invoice Service with Telemetry', () => {
  let telemetry: ReturnType<typeof setupTestTelemetry>

  beforeEach(() => {
    telemetry = setupTestTelemetry()
  })

  afterEach(() => {
    telemetry.clearSpans()
  })

  it('should create spans for invoice creation', async () => {
    await invoiceService.createInvoice(testInput)

    const spans = telemetry.getSpans()

    expect(spans).toHaveLength(1)
    expect(spans[0].name).toBe('createInvoice')
    expect(spans[0].attributes['invoice.tenantId']).toBe('tenant-1')
    expect(spans[0].status.code).toBe(SpanStatusCode.OK)
  })

  it('should record exceptions in spans', async () => {
    // Mock repository to throw error
    jest.spyOn(repository, 'save').mockRejectedValue(new Error('DB error'))

    await expect(
      invoiceService.createInvoice(testInput)
    ).rejects.toThrow()

    const spans = telemetry.getSpans()

    expect(spans[0].status.code).toBe(SpanStatusCode.ERROR)
    expect(spans[0].events).toContainEqual(
      expect.objectContaining({
        name: 'exception',
        attributes: expect.objectContaining({
          'exception.message': 'DB error',
        }),
      })
    )
  })
})
```

---

## Configuration

### Environment Variables

```env
# OpenTelemetry
OTEL_SERVICE_NAME=finance-service
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318/v1/traces
SERVICE_VERSION=1.0.0

# Sampling (production)
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1  # Sample 10% of traces
```

### Conditional Instrumentation

```typescript
// Disable instrumentation in test environment
if (process.env.NODE_ENV !== 'test') {
  const sdk = new NodeSDK({
    // ... configuration
  })
  sdk.start()
}
```

---

## Best Practices

1. **Span Naming**: Use descriptive names (`createInvoice` not `invoke`)
2. **Attributes**: Add business context (tenant, user, entity IDs)
3. **Events**: Record important milestones within spans
4. **Status**: Always set span status (OK or ERROR)
5. **Exception Recording**: Use `span.recordException(error)` not manual attributes
6. **Context Propagation**: Always inject/extract context for cross-service calls
7. **Sampling**: Use sampling in production to reduce overhead (10-20%)
8. **Security**: Don't include sensitive data in span attributes

---

## Observability Platforms

Compatible with:
- **Jaeger** (open-source, self-hosted)
- **Zipkin** (open-source, lightweight)
- **Grafana Tempo** (open-source, integrated with Grafana)
- **Datadog** (commercial, full-featured)
- **New Relic** (commercial, APM)
- **Honeycomb** (commercial, query-first)

---

## Example: Complete Service with OTEL

See **Auth Service** implementation:
- `services/auth/src/telemetry/context-propagation.interceptor.ts`
- `services/auth/test/telemetry.integration.spec.ts`

---

## Troubleshooting

**Spans not appearing?**
- Check OTEL_EXPORTER_OTLP_ENDPOINT is correct
- Verify OTEL collector is running
- Check service logs for SDK errors

**Context not propagating?**
- Ensure propagation.inject/extract in service calls
- Verify W3C Trace Context headers (`traceparent`, `tracestate`)
- Check interceptor is registered globally

**High overhead?**
- Reduce sampling rate (OTEL_TRACES_SAMPLER_ARG)
- Disable verbose instrumentations
- Use batch span processor (not simple)

---

## References

- OpenTelemetry JS Docs: https://opentelemetry.io/docs/instrumentation/js/
- W3C Trace Context: https://www.w3.org/TR/trace-context/
- Semantic Conventions: https://opentelemetry.io/docs/reference/specification/trace/semantic_conventions/
- NestJS + OTEL: https://github.com/pragmaticivan/nestjs-otel
