import { describe, it, expect, vi, beforeEach } from 'vitest';
import { context, propagation, trace } from '@opentelemetry/api';
import {
  extractTraceContext,
  injectTraceContext,
  createPropagationHeaders,
  parseTraceparent,
  formatTraceparent,
  getCorrelationId,
  getRequestId,
  generateId,
  addUserContext,
  addErrorContext,
  createChildSpan,
} from '../context-propagation.utils';
import { TRACE_HEADERS, CUSTOM_HEADERS } from '../observability.constants';

// Mock OpenTelemetry APIs
vi.mock('@opentelemetry/api', () => ({
  context: {
    active: vi.fn(),
    with: vi.fn(),
  },
  propagation: {
    inject: vi.fn(),
    extract: vi.fn(),
  },
  trace: {
    getSpan: vi.fn(),
    setSpan: vi.fn(),
    getTracer: vi.fn(),
  },
}));

describe('Context Propagation Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractTraceContext', () => {
    it('should extract valid W3C trace context from headers', () => {
      const headers = {
        traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
        tracestate: 'vendor1=value1,vendor2=value2',
      };

      const result = extractTraceContext(headers);

      expect(result).toEqual({
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
        spanId: '00f067aa0ba902b7',
        traceFlags: 1,
        traceState: 'vendor1=value1,vendor2=value2',
      });
    });

    it('should handle lowercase header names', () => {
      const headers = {
        'traceparent': '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
      };

      const result = extractTraceContext(headers);

      expect(result).toEqual({
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
        spanId: '00f067aa0ba902b7',
        traceFlags: 1,
        traceState: undefined,
      });
    });

    it('should return null for missing traceparent', () => {
      const headers = {};
      const result = extractTraceContext(headers);
      expect(result).toBeNull();
    });

    it('should return null for invalid traceparent format', () => {
      const headers = {
        traceparent: 'invalid-format',
      };
      const result = extractTraceContext(headers);
      expect(result).toBeNull();
    });
  });

  describe('injectTraceContext', () => {
    it('should inject trace context into headers', () => {
      const mockSpan = {
        spanContext: vi.fn().mockReturnValue({
          traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
          spanId: '00f067aa0ba902b7',
          traceFlags: 1,
        }),
      };

      (trace.getSpan as any).mockReturnValue(mockSpan);

      const headers = {};
      const result = injectTraceContext(headers);

      expect(propagation.inject).toHaveBeenCalledWith(context.active(), headers);
      expect(result[CUSTOM_HEADERS.TRACE_ID]).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
      expect(result[CUSTOM_HEADERS.SPAN_ID]).toBe('00f067aa0ba902b7');
    });

    it('should return headers unchanged if no active span', () => {
      (trace.getSpan as any).mockReturnValue(null);

      const headers = { existing: 'header' };
      const result = injectTraceContext(headers);

      expect(result).toEqual({ existing: 'header' });
      expect(propagation.inject).not.toHaveBeenCalled();
    });
  });

  describe('createPropagationHeaders', () => {
    it('should create W3C propagation headers from active span', () => {
      const mockSpan = {
        spanContext: vi.fn().mockReturnValue({
          traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
          spanId: '00f067aa0ba902b7',
          traceFlags: 1,
          traceState: {
            serialize: vi.fn().mockReturnValue('vendor1=value1'),
          },
        }),
      };

      (trace.getSpan as any).mockReturnValue(mockSpan);

      const result = createPropagationHeaders();

      expect(result).toEqual({
        traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
        tracestate: 'vendor1=value1',
      });
    });

    it('should return null if no active span', () => {
      (trace.getSpan as any).mockReturnValue(null);
      const result = createPropagationHeaders();
      expect(result).toBeNull();
    });
  });

  describe('parseTraceparent', () => {
    it('should parse valid W3C traceparent header', () => {
      const traceparent = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
      const result = parseTraceparent(traceparent);

      expect(result).toEqual({
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
        spanId: '00f067aa0ba902b7',
        traceFlags: 1,
      });
    });

    it('should return null for invalid format', () => {
      const traceparent = 'invalid';
      const result = parseTraceparent(traceparent);
      expect(result).toBeNull();
    });

    it('should return null for unsupported version', () => {
      const traceparent = '01-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
      const result = parseTraceparent(traceparent);
      expect(result).toBeNull();
    });
  });

  describe('formatTraceparent', () => {
    it('should format trace context as W3C traceparent', () => {
      const context = {
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
        spanId: '00f067aa0ba902b7',
        traceFlags: 1,
      };

      const result = formatTraceparent(context);
      expect(result).toBe('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01');
    });

    it('should handle missing traceFlags', () => {
      const context = {
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
        spanId: '00f067aa0ba902b7',
      };

      const result = formatTraceparent(context);
      expect(result).toBe('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00');
    });
  });

  describe('getCorrelationId', () => {
    it('should return correlation ID from headers', () => {
      const headers = {
        [CUSTOM_HEADERS.CORRELATION_ID]: 'existing-correlation-id',
      };

      const result = getCorrelationId(headers);
      expect(result).toBe('existing-correlation-id');
    });

    it('should return trace ID if no correlation ID in headers', () => {
      const mockSpan = {
        spanContext: vi.fn().mockReturnValue({
          traceId: 'trace-id-123',
        }),
      };

      (trace.getSpan as any).mockReturnValue(mockSpan);

      const result = getCorrelationId({});
      expect(result).toBe('trace-id-123');
    });

    it('should generate new ID if no headers or span', () => {
      (trace.getSpan as any).mockReturnValue(null);
      
      // Mock crypto.getRandomValues
      const originalCrypto = global.crypto;
      Object.defineProperty(global, 'crypto', {
        value: {
          getRandomValues: vi.fn((arr) => {
            for (let i = 0; i < arr.length; i++) {
              arr[i] = Math.floor(Math.random() * 256);
            }
            return arr;
          }),
        },
        writable: true,
        configurable: true
      });

      const result = getCorrelationId();
      expect(result).toMatch(/^[0-9a-f]{32}$/);
    });
  });

  describe('getRequestId', () => {
    it('should return request ID from headers', () => {
      const headers = {
        [CUSTOM_HEADERS.REQUEST_ID]: 'existing-request-id',
      };

      const result = getRequestId(headers);
      expect(result).toBe('existing-request-id');
    });

    it('should return span ID if no request ID in headers', () => {
      const mockSpan = {
        spanContext: vi.fn().mockReturnValue({
          spanId: 'span-id-456',
        }),
      };

      (trace.getSpan as any).mockReturnValue(mockSpan);

      const result = getRequestId({});
      expect(result).toBe('span-id-456');
    });
  });

  describe('generateId', () => {
    it('should generate a 32-character hex ID', () => {
      const originalCrypto = global.crypto;
      Object.defineProperty(global, 'crypto', {
        value: {
          getRandomValues: vi.fn((arr) => {
            for (let i = 0; i < arr.length; i++) {
              arr[i] = i;
            }
            return arr;
          }),
        },
        writable: true,
        configurable: true
      });

      const result = generateId();
      expect(result).toMatch(/^[0-9a-f]{32}$/);
      expect(result).toHaveLength(32);
    });
  });

  describe('addUserContext', () => {
    it('should add user attributes to current span', () => {
      const mockSpan = {
        setAttributes: vi.fn(),
      };

      (trace.getSpan as any).mockReturnValue(mockSpan);

      addUserContext('user-123', 'user@example.com', 'tenant-456');

      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        'user.id': 'user-123',
        'user.email': 'user@example.com',
        'tenant.id': 'tenant-456',
      });
    });

    it('should handle missing optional parameters', () => {
      const mockSpan = {
        setAttributes: vi.fn(),
      };

      (trace.getSpan as any).mockReturnValue(mockSpan);

      addUserContext('user-123');

      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        'user.id': 'user-123',
      });
    });

    it('should do nothing if no active span', () => {
      (trace.getSpan as any).mockReturnValue(null);
      addUserContext('user-123');
      // No error should be thrown
    });
  });

  describe('addErrorContext', () => {
    it('should record exception and add error attributes to span', () => {
      const mockSpan = {
        recordException: vi.fn(),
        setAttributes: vi.fn(),
      };

      (trace.getSpan as any).mockReturnValue(mockSpan);

      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      addErrorContext(error);

      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        'error.type': 'Error',
        'error.message': 'Test error',
        'error.stack': 'Error stack trace',
      });
    });

    it('should do nothing if no active span', () => {
      (trace.getSpan as any).mockReturnValue(null);
      const error = new Error('Test error');
      addErrorContext(error);
      // No error should be thrown
    });
  });

  describe('createChildSpan', () => {
    it('should create child span with parent context', () => {
      const mockTracer = {
        startSpan: vi.fn().mockReturnValue('new-span'),
      };
      const mockParentSpan = {};
      const mockContext = {};

      (trace.getTracer as any).mockReturnValue(mockTracer);
      (trace.getSpan as jest.Mock).mockReturnValue(mockParentSpan);
      (trace.setSpan as any).mockReturnValue(mockContext);

      const parentContext = {} as any;
      const result = createChildSpan('child-span', parentContext);

      expect(trace.getTracer).toHaveBeenCalledWith('utils');
      expect(mockTracer.startSpan).toHaveBeenCalledWith('child-span', undefined, mockContext);
      expect(result).toBe('new-span');
    });

    it('should create root span if no parent context', () => {
      const mockTracer = {
        startSpan: vi.fn().mockReturnValue('root-span'),
      };

      (trace.getTracer as any).mockReturnValue(mockTracer);

      const result = createChildSpan('root-span');

      expect(mockTracer.startSpan).toHaveBeenCalledWith('root-span');
      expect(result).toBe('root-span');
    });
  });
});