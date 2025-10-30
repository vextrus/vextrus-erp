import { trace, context, SpanKind, SpanStatusCode, Span as OtelSpan } from '@opentelemetry/api';

export interface TraceOptions {
  tracerName?: string;
  kind?: SpanKind;
  attributes?: Record<string, any>;
  recordArgs?: boolean;
  recordResult?: boolean;
  skipArgs?: string[];
}

export interface SpanOptions {
  attributes?: Record<string, any>;
  tracerName?: string;
  kind?: SpanKind;
}

/**
 * Method decorator that creates a new trace span for the decorated method
 */
export function Trace(spanName?: string, options?: TraceOptions) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = propertyName;
    const name = spanName || `${className}.${methodName}`;

    descriptor.value = function (...args: any[]) {
      const tracer = trace.getTracer(options?.tracerName || className);
      
      // Build attributes
      const attributes: Record<string, any> = {
        'code.function': methodName,
        'code.namespace': className,
        ...(options?.attributes || {}),
      };
      
      // Add method arguments as attributes if enabled (default to true for backward compatibility)
      const shouldRecordArgs = options?.recordArgs !== false;
      if (shouldRecordArgs) {
        // Get parameter names from function signature
        const funcStr = originalMethod.toString();
        const paramMatch = funcStr.match(/\(([^)]*)\)/);
        let paramNames: string[] = [];
        
        if (paramMatch && paramMatch[1]) {
          paramNames = paramMatch[1].split(',').map((p, index) => {
            const trimmed = p.trim();
            // Handle destructuring, default values, etc.
            const match = trimmed.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)/);
            return match ? match[1] : `param${index}`;
          });
        }
        
        args.forEach((arg, index) => {
          const paramName = paramNames[index] || `param${index}`;
          
          // Skip sensitive parameters
          if (options?.skipArgs?.includes(paramName)) {
            return;
          }

          const attrKey = `args.${paramName}`;
          if (arg && typeof arg === 'object') {
            try {
              attributes[attrKey] = JSON.stringify(arg);
            } catch {
              attributes[attrKey] = '[object]';
            }
          } else if (typeof arg === 'string') {
            attributes[attrKey] = arg;
          } else if (typeof arg === 'number' || typeof arg === 'boolean') {
            attributes[attrKey] = arg;
          } else if (arg === null) {
            attributes[attrKey] = null;
          } else if (arg === undefined) {
            attributes[attrKey] = undefined;
          } else {
            attributes[attrKey] = String(arg);
          }
        });
      }
      
      const span = tracer.startSpan(name, {
        kind: options?.kind || SpanKind.INTERNAL,
        attributes,
      });

      const ctx = trace.setSpan(context.active(), span);

      // Check if the method is async
      const result = context.with(ctx, () => {
        try {
          return originalMethod.apply(this, args);
        } catch (error: any) {
          span.recordException(error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
          });
          span.end();
          throw error;
        }
      });

      // Handle both sync and async results
      if (result && typeof result.then === 'function') {
        return result
          .then((res: any) => {
            // Record result if enabled
            if (options?.recordResult && res !== undefined) {
              if (typeof res === 'object') {
                try {
                  span.setAttribute('result', JSON.stringify(res));
                } catch {
                  span.setAttribute('result', '[object]');
                }
              } else {
                span.setAttribute('result', String(res));
              }
            }
            span.setStatus({ code: SpanStatusCode.OK });
            span.end();
            return res;
          })
          .catch((error: any) => {
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
            span.end();
            throw error;
          });
      } else {
        // Synchronous result
        if (options?.recordResult && result !== undefined) {
          if (typeof result === 'object') {
            try {
              span.setAttribute('result', JSON.stringify(result));
            } catch {
              span.setAttribute('result', '[object]');
            }
          } else {
            span.setAttribute('result', String(result));
          }
        }
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        return result;
      }
    };

    return descriptor;
  };
}

/**
 * Method decorator that creates a child span within an existing trace
 */
export function Span(spanName?: string, options?: SpanOptions) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const methodName = propertyName;
    const name = spanName || methodName;

    descriptor.value = function (...args: any[]) {
      const tracer = trace.getTracer(target.constructor.name);
      
      // Only pass options if they have attributes
      const span = options?.attributes && Object.keys(options.attributes).length > 0
        ? tracer.startSpan(name, { attributes: options.attributes })
        : tracer.startSpan(name);

      const ctx = trace.setSpan(context.active(), span);

      // Check if the method is async
      const result = context.with(ctx, () => {
        try {
          return originalMethod.apply(this, args);
        } catch (error: any) {
          span.recordException(error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
          });
          span.end();
          throw error;
        }
      });

      // Handle both sync and async results
      if (result && typeof result.then === 'function') {
        return result
          .then((res: any) => {
            span.setStatus({ code: SpanStatusCode.OK });
            span.end();
            return res;
          })
          .catch((error: any) => {
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
            span.end();
            throw error;
          });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        return result;
      }
    };

    return descriptor;
  };
}

/**
 * Method decorator that creates a span and injects it as the first parameter
 */
export function WithSpan(spanName?: string, options?: SpanOptions) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const methodName = propertyName;
    const name = spanName || methodName;

    descriptor.value = function (...args: any[]) {
      const tracer = trace.getTracer(target.constructor.name);
      
      // Only pass options if they have attributes
      const span = options?.attributes && Object.keys(options.attributes).length > 0
        ? tracer.startSpan(name, { attributes: options.attributes })
        : tracer.startSpan(name);

      const ctx = trace.setSpan(context.active(), span);

      // Inject span as first parameter
      const modifiedArgs = [span, ...args];

      // Check if the method is async
      const result = context.with(ctx, () => {
        try {
          return originalMethod.apply(this, modifiedArgs);
        } catch (error: any) {
          span.recordException(error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
          });
          span.end();
          throw error;
        }
      });

      // Handle both sync and async results
      if (result && typeof result.then === 'function') {
        return result
          .then((res: any) => {
            span.setStatus({ code: SpanStatusCode.OK });
            span.end();
            return res;
          })
          .catch((error: any) => {
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
            span.end();
            throw error;
          });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        return result;
      }
    };

    return descriptor;
  };
}