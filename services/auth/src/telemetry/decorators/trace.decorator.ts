import { trace, context, SpanKind, SpanStatusCode } from '@opentelemetry/api';

export function Trace(spanName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const tracer = trace.getTracer(target.constructor.name);
      const span = tracer.startSpan(spanName || `${target.constructor.name}.${propertyName}`, {
        kind: SpanKind.INTERNAL,
      });

      const ctx = trace.setSpan(context.active(), span);
      
      try {
        const result = await context.with(ctx, () => originalMethod.apply(this, args));
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error: any) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message,
        });
        throw error;
      } finally {
        span.end();
      }
    };
    
    return descriptor;
  };
}