import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { trace, context, SpanKind, SpanStatusCode, propagation, ROOT_CONTEXT } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';

@Injectable()
export class ContextPropagationInterceptor implements NestInterceptor {
  private readonly tracer = trace.getTracer('auth-service');
  private readonly propagator = new W3CTraceContextPropagator();

  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<any> {
    const request = executionContext.switchToHttp().getRequest();
    const response = executionContext.switchToHttp().getResponse();
    
    // Extract trace context from incoming headers
    const extractedContext = propagation.extract(
      ROOT_CONTEXT,
      request.headers,
      {
        get: (carrier, key) => {
          return carrier[key.toLowerCase()];
        },
        keys: (carrier) => Object.keys(carrier)
      }
    );
    
    // Start a new span with the extracted context as parent
    const span = this.tracer.startSpan(
      `${request.method} ${request.route?.path || request.url}`,
      {
        kind: SpanKind.SERVER,
        attributes: {
          'http.method': request.method,
          'http.url': request.url,
          'http.target': request.route?.path,
          'http.host': request.headers.host,
          'http.scheme': request.protocol,
          'http.user_agent': request.headers['user-agent'],
          'http.request_content_length': request.headers['content-length'],
          'net.host.name': request.hostname,
          'net.transport': 'ip_tcp',
        },
      },
      extractedContext
    );

    // Inject trace context into response headers for downstream propagation
    const spanContext = span.spanContext();
    if (spanContext) {
      response.setHeader('traceparent', `00-${spanContext.traceId}-${spanContext.spanId}-${spanContext.traceFlags.toString(16).padStart(2, '0')}`);
      if (spanContext.traceState) {
        response.setHeader('tracestate', spanContext.traceState.serialize());
      }
    }

    // Store span in request for access in controllers/services
    request.span = span;
    request.traceContext = extractedContext;

    // Create context with span and execute request
    const ctx = trace.setSpan(extractedContext, span);

    return context.with(ctx, () => {
      return next.handle().pipe(
        tap({
          next: (data) => {
            // Add response attributes
            span.setAttributes({
              'http.status_code': response.statusCode,
              'http.response_content_length': response.get('content-length') || 0,
            });
            
            // Set span status based on HTTP status code
            if (response.statusCode >= 400) {
              span.setStatus({ 
                code: SpanStatusCode.ERROR,
                message: `HTTP ${response.statusCode}`
              });
            } else {
              span.setStatus({ code: SpanStatusCode.OK });
            }
          },
          error: (error) => {
            // Record exception and set error status
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
            span.setAttributes({
              'http.status_code': error.status || 500,
              'error.type': error.name,
              'error.message': error.message,
            });
          },
          complete: () => {
            span.end();
          },
        }),
      );
    });
  }
}