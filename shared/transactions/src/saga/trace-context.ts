import { trace, context, SpanStatusCode, SpanKind, propagation } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';

export interface SagaTraceContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
  traceState?: string;
  baggage?: Record<string, string>;
}

export class SagaTraceManager {
  private tracer = trace.getTracer('saga-orchestrator', '1.0.0');

  /**
   * Inject trace context into saga state for distributed transaction tracking
   */
  injectTraceContext(sagaState: any): any {
    const currentSpan = trace.getActiveSpan();
    if (!currentSpan) {
      return sagaState;
    }

    const spanContext = currentSpan.spanContext();
    const baggage = propagation.getBaggage(context.active());
    
    const traceContext: SagaTraceContext = {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
      traceFlags: spanContext.traceFlags,
      traceState: spanContext.traceState?.serialize(),
      baggage: baggage ? Object.fromEntries(baggage.getAllEntries()) : undefined,
    };

    return {
      ...sagaState,
      traceContext,
    };
  }

  /**
   * Extract trace context from saga state and set as active
   */
  extractTraceContext(sagaState: any): void {
    const traceContext = sagaState.traceContext as SagaTraceContext;
    if (!traceContext) {
      return;
    }

    // Create a new context with the trace information
    const spanContext = {
      traceId: traceContext.traceId,
      spanId: traceContext.spanId,
      traceFlags: traceContext.traceFlags,
      isRemote: true,
    };

    // Set the context as active for the current operation
    const ctx = trace.setSpanContext(context.active(), spanContext);
    context.setGlobalContextManager({ active: () => ctx } as any);
  }

  /**
   * Create a span for a saga step with proper linking
   */
  createSagaStepSpan(
    stepName: string,
    sagaType: string,
    sagaId: string,
    parentTraceContext?: SagaTraceContext,
  ) {
    const spanOptions = {
      kind: SpanKind.INTERNAL,
      attributes: {
        'saga.type': sagaType,
        'saga.id': sagaId,
        'saga.step': stepName,
        [SemanticAttributes.MESSAGING_SYSTEM]: 'saga',
        [SemanticAttributes.MESSAGING_OPERATION]: 'process',
      },
    };

    if (parentTraceContext) {
      // Link to parent transaction
      spanOptions['links'] = [{
        context: {
          traceId: parentTraceContext.traceId,
          spanId: parentTraceContext.spanId,
          traceFlags: parentTraceContext.traceFlags,
          isRemote: true,
        },
      }];
    }

    return this.tracer.startSpan(`saga.${sagaType}.${stepName}`, spanOptions);
  }

  /**
   * Create a span for compensation handlers with linking to original transaction
   */
  createCompensationSpan(
    stepName: string,
    sagaType: string,
    sagaId: string,
    originalSpanContext: SagaTraceContext,
    error?: Error,
  ) {
    const span = this.tracer.startSpan(`saga.${sagaType}.compensate.${stepName}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'saga.type': sagaType,
        'saga.id': sagaId,
        'saga.step': stepName,
        'saga.compensation': true,
        [SemanticAttributes.MESSAGING_SYSTEM]: 'saga',
        [SemanticAttributes.MESSAGING_OPERATION]: 'compensate',
      },
      links: [{
        context: {
          traceId: originalSpanContext.traceId,
          spanId: originalSpanContext.spanId,
          traceFlags: originalSpanContext.traceFlags,
          isRemote: true,
        },
        attributes: {
          'link.type': 'compensation',
        },
      }],
    });

    if (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    }

    return span;
  }

  /**
   * Add event sourcing correlation attributes to span
   */
  addEventSourcingContext(span: any, correlationId: string, causationId: string): void {
    span.setAttributes({
      'event.correlation_id': correlationId,
      'event.causation_id': causationId,
      'event.source': 'saga',
    });
  }

  /**
   * Record saga completion metrics
   */
  recordSagaMetrics(
    sagaType: string,
    success: boolean,
    duration: number,
    compensated: boolean = false,
  ): void {
    const span = trace.getActiveSpan();
    if (span) {
      span.setAttributes({
        'saga.completed': true,
        'saga.success': success,
        'saga.duration_ms': duration,
        'saga.compensated': compensated,
      });

      span.setStatus({
        code: success ? SpanStatusCode.OK : SpanStatusCode.ERROR,
      });
    }
  }
}