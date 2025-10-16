import { Injectable } from '@nestjs/common';
import { trace, context, propagation, SpanKind } from '@opentelemetry/api';
import axios, { AxiosRequestConfig } from 'axios';

@Injectable()
export class PropagationService {
  private readonly tracer = trace.getTracer('auth-service');

  /**
   * Make an HTTP request with trace context propagation
   */
  async makeTracedRequest<T = any>(
    url: string,
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    // Start a new span for the outbound request
    const span = this.tracer.startSpan(`HTTP ${config.method || 'GET'} ${url}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'http.method': config.method || 'GET',
        'http.url': url,
        'http.target': new URL(url).pathname,
        'net.peer.name': new URL(url).hostname,
        'net.peer.port': new URL(url).port || (new URL(url).protocol === 'https:' ? 443 : 80),
      },
    });

    // Inject trace context into headers
    const headers = config.headers || {};
    propagation.inject(context.active(), headers);

    try {
      const response = await axios({
        ...config,
        url,
        headers,
      });

      // Add response attributes
      span.setAttributes({
        'http.status_code': response.status,
        'http.response_content_length': response.headers['content-length'] || 0,
      });

      span.end();
      return response.data;
    } catch (error: any) {
      // Record error
      span.recordException(error);
      span.setAttributes({
        'http.status_code': error.response?.status || 0,
        'error.type': error.name,
        'error.message': error.message,
      });
      span.end();
      throw error;
    }
  }

  /**
   * Extract trace context from incoming headers
   */
  extractContext(headers: Record<string, any>) {
    return propagation.extract(context.active(), headers);
  }

  /**
   * Inject trace context into outgoing headers
   */
  injectContext(headers: Record<string, any>) {
    propagation.inject(context.active(), headers);
    return headers;
  }

  /**
   * Get current trace ID
   */
  getCurrentTraceId(): string | undefined {
    const span = trace.getSpan(context.active());
    return span?.spanContext().traceId;
  }

  /**
   * Get current span ID
   */
  getCurrentSpanId(): string | undefined {
    const span = trace.getSpan(context.active());
    return span?.spanContext().spanId;
  }

  /**
   * Create headers with trace context for microservice communication
   */
  createTracedHeaders(additionalHeaders: Record<string, any> = {}): Record<string, any> {
    const headers = { ...additionalHeaders };
    
    // Inject W3C Trace Context
    this.injectContext(headers);
    
    // Add custom trace headers for internal services
    const traceId = this.getCurrentTraceId();
    const spanId = this.getCurrentSpanId();
    
    if (traceId) {
      headers['x-trace-id'] = traceId;
    }
    if (spanId) {
      headers['x-parent-span-id'] = spanId;
    }
    
    // Add service identification
    headers['x-service-name'] = 'auth-service';
    headers['x-service-version'] = process.env.SERVICE_VERSION || '1.0.0';
    
    return headers;
  }
}