import { Injectable } from '@nestjs/common';
import { trace, context, SpanKind, Span, SpanOptions } from '@opentelemetry/api';

@Injectable()
export class TracingService {
  private readonly tracer = trace.getTracer('auth-service');

  /**
   * Create a new span
   */
  createSpan(name: string, options?: SpanOptions): Span {
    return this.tracer.startSpan(name, options);
  }

  /**
   * Get the current active span
   */
  getCurrentSpan(): Span | undefined {
    return trace.getSpan(context.active());
  }

  /**
   * Execute a function within a span context
   */
  withSpan<T>(span: Span, fn: () => T): T {
    const ctx = trace.setSpan(context.active(), span);
    return context.with(ctx, fn);
  }

  /**
   * Start a child span
   */
  startChildSpan(name: string, parentSpan?: Span, kind: SpanKind = SpanKind.INTERNAL): Span {
    const parent = parentSpan || this.getCurrentSpan();
    const ctx = parent ? trace.setSpan(context.active(), parent) : context.active();
    
    return this.tracer.startSpan(
      name,
      {
        kind,
        attributes: {
          'service.name': 'auth-service',
        },
      },
      ctx
    );
  }

  /**
   * Add attributes to current span
   */
  addAttributesToCurrentSpan(attributes: Record<string, any>): void {
    const span = this.getCurrentSpan();
    if (span) {
      span.setAttributes(attributes);
    }
  }

  /**
   * Record an event on the current span
   */
  recordEvent(name: string, attributes?: Record<string, any>): void {
    const span = this.getCurrentSpan();
    if (span) {
      span.addEvent(name, attributes);
    }
  }

  /**
   * Get trace and span IDs
   */
  getTraceInfo(): { traceId?: string; spanId?: string } {
    const span = this.getCurrentSpan();
    if (span) {
      const spanContext = span.spanContext();
      return {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
      };
    }
    return {};
  }
}