import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trace, context, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { Trace, Span, WithSpan } from '../tracing.decorator';

// Mock OpenTelemetry APIs
vi.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: vi.fn(),
    getSpan: vi.fn(),
    setSpan: vi.fn(),
  },
  context: {
    active: vi.fn(),
    with: vi.fn(),
  },
  SpanKind: {
    INTERNAL: 0,
    SERVER: 1,
    CLIENT: 2,
  },
  SpanStatusCode: {
    UNSET: 0,
    OK: 1,
    ERROR: 2,
  },
}));

describe('Tracing Decorators', () => {
  let mockTracer: any;
  let mockSpan: any;
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSpan = {
      setAttributes: vi.fn(),
      setStatus: vi.fn(),
      recordException: vi.fn(),
      end: vi.fn(),
      spanContext: vi.fn().mockReturnValue({
        traceId: 'trace-123',
        spanId: 'span-456',
      }),
      addEvent: vi.fn(),
    };

    mockTracer = {
      startSpan: vi.fn().mockReturnValue(mockSpan),
    };

    mockContext = {};

    (trace.getTracer as any).mockReturnValue(mockTracer);
    (trace.setSpan as any).mockReturnValue(mockContext);
    (context.with as any).mockImplementation((ctx: any, fn: Function) => fn());
  });

  describe('@Trace', () => {
    it('should create span for synchronous method', () => {
      class TestService {
        @Trace()
        testMethod(param1: string, param2: number) {
          return `${param1}-${param2}`;
        }
      }

      const service = new TestService();
      const result = service.testMethod('test', 123);

      expect(result).toBe('test-123');
      expect(trace.getTracer).toHaveBeenCalledWith('TestService');
      expect(mockTracer.startSpan).toHaveBeenCalledWith(
        'TestService.testMethod',
        expect.objectContaining({
          kind: SpanKind.INTERNAL,
          attributes: {
            'code.function': 'testMethod',
            'code.namespace': 'TestService',
            'args.param1': 'test',
            'args.param2': 123,
          },
        })
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should handle async methods', async () => {
      class TestService {
        @Trace('custom-span-name')
        async asyncMethod(value: string): Promise<string> {
          await new Promise(resolve => setTimeout(resolve, 10));
          return `async-${value}`;
        }
      }

      const service = new TestService();
      const result = await service.asyncMethod('test');

      expect(result).toBe('async-test');
      expect(mockTracer.startSpan).toHaveBeenCalledWith(
        'custom-span-name',
        expect.any(Object)
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should record exceptions for failed methods', () => {
      const testError = new Error('Test error');

      class TestService {
        @Trace()
        failingMethod() {
          throw testError;
        }
      }

      const service = new TestService();

      expect(() => service.failingMethod()).toThrow(testError);
      expect(mockSpan.recordException).toHaveBeenCalledWith(testError);
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: 'Test error',
      });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should handle async method failures', async () => {
      const testError = new Error('Async error');

      class TestService {
        @Trace()
        async failingAsyncMethod(): Promise<void> {
          throw testError;
        }
      }

      const service = new TestService();

      await expect(service.failingAsyncMethod()).rejects.toThrow(testError);
      expect(mockSpan.recordException).toHaveBeenCalledWith(testError);
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: 'Async error',
      });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should skip sensitive parameters', () => {
      class TestService {
        @Trace(undefined, { skipArgs: ['password', 'token'] })
        authenticate(username: string, password: string, token: string) {
          return true;
        }
      }

      const service = new TestService();
      service.authenticate('user123', 'secret', 'token123');

      expect(mockTracer.startSpan).toHaveBeenCalledWith(
        'TestService.authenticate',
        expect.objectContaining({
          attributes: expect.objectContaining({
            'args.username': 'user123',
            // password and token should be skipped
          }),
        })
      );

      const attributes = mockTracer.startSpan.mock.calls[0][1].attributes;
      expect(attributes['args.password']).toBeUndefined();
      expect(attributes['args.token']).toBeUndefined();
    });

    it('should use custom span kind', () => {
      class TestService {
        @Trace(undefined, { kind: SpanKind.CLIENT })
        clientMethod() {
          return 'client';
        }
      }

      const service = new TestService();
      service.clientMethod();

      expect(mockTracer.startSpan).toHaveBeenCalledWith(
        'TestService.clientMethod',
        expect.objectContaining({
          kind: SpanKind.CLIENT,
        })
      );
    });

    it('should add custom attributes', () => {
      class TestService {
        @Trace(undefined, { 
          attributes: { 
            'custom.attr': 'value',
            'service.version': '1.0.0'
          }
        })
        methodWithAttrs() {
          return 'attrs';
        }
      }

      const service = new TestService();
      service.methodWithAttrs();

      expect(mockTracer.startSpan).toHaveBeenCalledWith(
        'TestService.methodWithAttrs',
        expect.objectContaining({
          attributes: expect.objectContaining({
            'custom.attr': 'value',
            'service.version': '1.0.0',
          }),
        })
      );
    });
  });

  describe('@Span', () => {
    it('should create span for method', () => {
      class TestService {
        @Span('custom-operation')
        performOperation(data: string) {
          return `processed-${data}`;
        }
      }

      const service = new TestService();
      const result = service.performOperation('input');

      expect(result).toBe('processed-input');
      expect(mockTracer.startSpan).toHaveBeenCalledWith('custom-operation');
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should use method name if no span name provided', () => {
      class TestService {
        @Span()
        defaultNameMethod() {
          return 'default';
        }
      }

      const service = new TestService();
      service.defaultNameMethod();

      expect(mockTracer.startSpan).toHaveBeenCalledWith('defaultNameMethod');
    });

    it('should handle async methods', async () => {
      class TestService {
        @Span('async-operation')
        async asyncOperation(): Promise<string> {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'async-result';
        }
      }

      const service = new TestService();
      const result = await service.asyncOperation();

      expect(result).toBe('async-result');
      expect(mockTracer.startSpan).toHaveBeenCalledWith('async-operation');
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should record exceptions', () => {
      const error = new Error('Operation failed');

      class TestService {
        @Span('failing-operation')
        failingOperation() {
          throw error;
        }
      }

      const service = new TestService();

      expect(() => service.failingOperation()).toThrow(error);
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: 'Operation failed',
      });
      expect(mockSpan.end).toHaveBeenCalled();
    });
  });

  describe('@WithSpan', () => {
    it('should inject span as first parameter', () => {
      let capturedSpan: any;

      class TestService {
        @WithSpan()
        methodWithSpan(span: any, data: string) {
          capturedSpan = span;
          span.setAttributes({ custom: 'attribute' });
          return `with-span-${data}`;
        }
      }

      const service = new TestService();
      const result = service.methodWithSpan('test');

      expect(result).toBe('with-span-test');
      expect(capturedSpan).toBe(mockSpan);
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({ custom: 'attribute' });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should handle async methods with span injection', async () => {
      let capturedSpan: any;

      class TestService {
        @WithSpan('async-with-span')
        async asyncWithSpan(span: any, value: number): Promise<number> {
          capturedSpan = span;
          await new Promise(resolve => setTimeout(resolve, 10));
          span.addEvent('processing', { value });
          return value * 2;
        }
      }

      const service = new TestService();
      const result = await service.asyncWithSpan(5);

      expect(result).toBe(10);
      expect(capturedSpan).toBe(mockSpan);
      expect(mockTracer.startSpan).toHaveBeenCalledWith('async-with-span');
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should handle errors and still end span', () => {
      const error = new Error('With span error');

      class TestService {
        @WithSpan()
        failingWithSpan(span: any) {
          throw error;
        }
      }

      const service = new TestService();

      expect(() => service.failingWithSpan()).toThrow(error);
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: 'With span error',
      });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should maintain correct argument order after span injection', () => {
      let capturedArgs: any[] = [];

      class TestService {
        @WithSpan()
        multiArgMethod(span: any, arg1: string, arg2: number, arg3: boolean) {
          capturedArgs = [arg1, arg2, arg3];
          return { arg1, arg2, arg3 };
        }
      }

      const service = new TestService();
      const result = service.multiArgMethod('test', 42, true);

      expect(result).toEqual({ arg1: 'test', arg2: 42, arg3: true });
      expect(capturedArgs).toEqual(['test', 42, true]);
    });
  });

  describe('Decorator Composition', () => {
    it('should allow multiple decorators on same method', () => {
      class TestService {
        @Trace()
        @Span('inner-span')
        composedMethod(value: string) {
          return `composed-${value}`;
        }
      }

      const service = new TestService();
      const result = service.composedMethod('test');

      expect(result).toBe('composed-test');
      // Both decorators should create spans
      expect(mockTracer.startSpan).toHaveBeenCalledTimes(2);
    });
  });
});