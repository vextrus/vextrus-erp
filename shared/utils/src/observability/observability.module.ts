import { Module, Global, DynamicModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ObservabilityConfig } from './observability.types';

/**
 * Shared observability module for NestJS applications
 */
@Global()
@Module({})
export class ObservabilityModule {
  static forRoot(config: ObservabilityConfig): DynamicModule {
    const providers = [
      {
        provide: 'OBSERVABILITY_CONFIG',
        useValue: config,
      },
    ];

    // Add interceptor if tracing is enabled
    if (config.enableTracing !== false) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: TracingInterceptor,
      } as any);
    }

    return {
      module: ObservabilityModule,
      providers,
      exports: ['OBSERVABILITY_CONFIG'],
    };
  }
}

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { trace, context, SpanKind, SpanStatusCode, propagation, ROOT_CONTEXT } from '@opentelemetry/api';
import { SPAN_ATTRIBUTES } from './observability.constants';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<any> {
    const request = executionContext.switchToHttp().getRequest();
    const response = executionContext.switchToHttp().getResponse();
    
    // Extract trace context from incoming headers
    const extractedContext = propagation.extract(
      ROOT_CONTEXT,
      request.headers,
      {
        get: (carrier, key) => carrier[key.toLowerCase()],
        keys: (carrier) => Object.keys(carrier)
      }
    );
    
    // Get tracer
    const tracer = trace.getTracer('http-interceptor');
    
    // Start span with extracted context
    const span = tracer.startSpan(
      `${request.method} ${request.route?.path || request.url}`,
      {
        kind: SpanKind.SERVER,
        attributes: {
          [SPAN_ATTRIBUTES.HTTP_METHOD]: request.method,
          [SPAN_ATTRIBUTES.HTTP_URL]: request.url,
          [SPAN_ATTRIBUTES.HTTP_TARGET]: request.route?.path,
          [SPAN_ATTRIBUTES.HTTP_HOST]: request.headers.host,
          [SPAN_ATTRIBUTES.HTTP_SCHEME]: request.protocol,
          [SPAN_ATTRIBUTES.HTTP_USER_AGENT]: request.headers['user-agent'],
        },
      },
      extractedContext
    );

    // Inject trace context into response headers
    const spanContext = span.spanContext();
    if (spanContext) {
      const traceFlags = spanContext.traceFlags?.toString(16).padStart(2, '0') || '00';
      response.setHeader('traceparent', `00-${spanContext.traceId}-${spanContext.spanId}-${traceFlags}`);
      if (spanContext.traceState) {
        response.setHeader('tracestate', spanContext.traceState.serialize());
      }
    }

    // Store span in request for access in controllers
    request.span = span;
    request.traceContext = extractedContext;

    const ctx = trace.setSpan(extractedContext, span);

    return context.with(ctx, () => {
      return next.handle().pipe(
        tap({
          next: () => {
            span.setAttributes({
              [SPAN_ATTRIBUTES.HTTP_STATUS_CODE]: response.statusCode,
            });
            
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
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
            span.setAttributes({
              [SPAN_ATTRIBUTES.HTTP_STATUS_CODE]: error.status || 500,
              [SPAN_ATTRIBUTES.ERROR_TYPE]: error.name,
              [SPAN_ATTRIBUTES.ERROR_MESSAGE]: error.message,
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