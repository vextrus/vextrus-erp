import { context, propagation, trace, SpanContext } from '@opentelemetry/api';
import { TRACE_HEADERS, CUSTOM_HEADERS } from './observability.constants';
import { TraceContext, PropagationHeaders } from './observability.types';

/**
 * Extract trace context from incoming headers
 */
export function extractTraceContext(headers: Record<string, any>): TraceContext | null {
  const traceparent = headers[TRACE_HEADERS.TRACEPARENT] || headers[TRACE_HEADERS.TRACEPARENT.toLowerCase()];
  
  if (!traceparent) {
    return null;
  }

  // Parse W3C traceparent header: version-traceid-spanid-traceflags
  const parts = traceparent.split('-');
  if (parts.length !== 4) {
    return null;
  }

  return {
    traceId: parts[1],
    spanId: parts[2],
    traceFlags: parseInt(parts[3], 16),
    traceState: headers[TRACE_HEADERS.TRACESTATE] || headers[TRACE_HEADERS.TRACESTATE.toLowerCase()],
  };
}

/**
 * Inject trace context into outgoing headers
 */
export function injectTraceContext(headers: Record<string, any> = {}): Record<string, any> {
  const span = trace.getSpan(context.active());
  
  if (!span) {
    return headers;
  }

  const spanContext = span.spanContext();
  if (!spanContext) {
    return headers;
  }

  // Inject W3C Trace Context
  propagation.inject(context.active(), headers);
  
  // Add custom headers for internal services
  headers[CUSTOM_HEADERS.TRACE_ID] = spanContext.traceId;
  headers[CUSTOM_HEADERS.SPAN_ID] = spanContext.spanId;
  
  return headers;
}

/**
 * Create propagation headers from current context
 */
export function createPropagationHeaders(): PropagationHeaders | null {
  const span = trace.getSpan(context.active());
  
  if (!span) {
    return null;
  }

  const spanContext = span.spanContext();
  if (!spanContext) {
    return null;
  }

  const traceFlags = spanContext.traceFlags?.toString(16).padStart(2, '0') || '00';
  
  return {
    traceparent: `00-${spanContext.traceId}-${spanContext.spanId}-${traceFlags}`,
    tracestate: spanContext.traceState?.serialize(),
  };
}

/**
 * Parse W3C traceparent header
 */
export function parseTraceparent(traceparent: string): TraceContext | null {
  const parts = traceparent.split('-');
  
  if (parts.length !== 4) {
    return null;
  }

  const [version, traceId, spanId, traceFlags] = parts;
  
  if (version !== '00') {
    return null; // Only support version 00
  }

  return {
    traceId: traceId || '',
    spanId: spanId || '',
    traceFlags: parseInt(traceFlags || '0', 16),
  };
}

/**
 * Format trace context as W3C traceparent header
 */
export function formatTraceparent(context: TraceContext): string {
  const traceFlags = (context.traceFlags || 0).toString(16).padStart(2, '0');
  return `00-${context.traceId}-${context.spanId}-${traceFlags}`;
}

/**
 * Get correlation ID from context or generate new one
 */
export function getCorrelationId(headers?: Record<string, any>): string {
  if (headers?.[CUSTOM_HEADERS.CORRELATION_ID]) {
    return headers[CUSTOM_HEADERS.CORRELATION_ID];
  }
  
  const span = trace.getSpan(context.active());
  if (span) {
    return span.spanContext().traceId;
  }
  
  // Generate new correlation ID
  return generateId();
}

/**
 * Get request ID from context or generate new one
 */
export function getRequestId(headers?: Record<string, any>): string {
  if (headers?.[CUSTOM_HEADERS.REQUEST_ID]) {
    return headers[CUSTOM_HEADERS.REQUEST_ID];
  }
  
  const span = trace.getSpan(context.active());
  if (span) {
    return span.spanContext().spanId;
  }
  
  // Generate new request ID
  return generateId();
}

/**
 * Generate a random 16-byte hex ID
 */
export function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Add user context to current span
 */
export function addUserContext(userId: string, userEmail?: string, tenantId?: string): void {
  const span = trace.getSpan(context.active());
  
  if (span) {
    span.setAttributes({
      'user.id': userId,
      ...(userEmail && { 'user.email': userEmail }),
      ...(tenantId && { 'tenant.id': tenantId }),
    });
  }
}

/**
 * Add error context to current span
 */
export function addErrorContext(error: Error): void {
  const span = trace.getSpan(context.active());
  
  if (span) {
    span.recordException(error);
    span.setAttributes({
      'error.type': error.name,
      'error.message': error.message,
      'error.stack': error.stack,
    });
  }
}

/**
 * Create child span with propagated context
 */
export function createChildSpan(name: string, parentContext?: SpanContext): any {
  const tracer = trace.getTracer('utils');
  const parentSpan = parentContext ? trace.getSpan(context.active()) : undefined;
  
  if (parentSpan) {
    const ctx = trace.setSpan(context.active(), parentSpan);
    return tracer.startSpan(name, undefined, ctx);
  }
  
  return tracer.startSpan(name);
}