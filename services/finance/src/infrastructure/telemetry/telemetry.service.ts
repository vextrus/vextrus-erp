import { Injectable } from '@nestjs/common';
import { trace, Span, SpanStatusCode, context, SpanKind, metrics, Meter } from '@opentelemetry/api';

@Injectable()
export class TelemetryService {
  private tracer = trace.getTracer('finance-service');
  private meter: Meter = metrics.getMeter('finance-service');

  // Metrics
  private requestCounter = this.meter.createCounter('finance_requests_total', {
    description: 'Total number of requests',
  });

  private requestDuration = this.meter.createHistogram('finance_request_duration_seconds', {
    description: 'Request duration in seconds',
  });

  private domainEventCounter = this.meter.createCounter('finance_domain_events_total', {
    description: 'Total number of domain events',
  });

  private errorCounter = this.meter.createCounter('finance_errors_total', {
    description: 'Total number of errors',
  });

  startSpan(
    name: string,
    attributes?: Record<string, any>,
    kind: SpanKind = SpanKind.INTERNAL,
  ): Span {
    return this.tracer.startSpan(name, {
      kind,
      attributes,
    });
  }

  startActiveSpan<T>(
    name: string,
    fn: (span: Span) => T,
    attributes?: Record<string, any>,
  ): T {
    return this.tracer.startActiveSpan(name, { attributes }, (span) => {
      try {
        const result = fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  async traceAsyncOperation<T>(
    name: string,
    operation: () => Promise<T>,
    attributes?: Record<string, any>,
  ): Promise<T> {
    const span = this.startSpan(name, attributes);
    const ctx = trace.setSpan(context.active(), span);

    try {
      const result = await context.with(ctx, operation);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  addSpanAttribute(key: string, value: any): void {
    const span = trace.getActiveSpan();
    if (span) {
      span.setAttribute(key, value);
    }
  }

  addSpanEvent(name: string, attributes?: Record<string, any>): void {
    const span = trace.getActiveSpan();
    if (span) {
      span.addEvent(name, attributes);
    }
  }

  recordRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    tenantId?: string,
  ): void {
    const labels = {
      method,
      path,
      status: statusCode.toString(),
      tenant_id: tenantId || 'unknown',
    };

    this.requestCounter.add(1, labels);
    this.requestDuration.record(duration / 1000, labels); // Convert to seconds
  }

  recordDomainEvent(
    eventType: string,
    aggregateName: string,
    tenantId?: string,
  ): void {
    this.domainEventCounter.add(1, {
      event_type: eventType,
      aggregate: aggregateName,
      tenant_id: tenantId || 'unknown',
    });
  }

  recordError(
    errorType: string,
    operation: string,
    tenantId?: string,
  ): void {
    this.errorCounter.add(1, {
      error_type: errorType,
      operation,
      tenant_id: tenantId || 'unknown',
    });
  }

  createGauge(name: string, description: string) {
    return this.meter.createObservableGauge(name, {
      description,
    });
  }

  createUpDownCounter(name: string, description: string) {
    return this.meter.createUpDownCounter(name, {
      description,
    });
  }
}