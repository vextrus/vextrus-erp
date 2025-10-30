import { describe, it, expect, vi, beforeEach } from 'vitest';
import { metrics } from '@opentelemetry/api';
import { Metric, Count, Timed, Gauge } from '../metrics.decorator';

// Mock OpenTelemetry metrics API
vi.mock('@opentelemetry/api', () => ({
  metrics: {
    getMeter: vi.fn(),
  },
}));

describe('Metrics Decorators', () => {
  let mockMeter: any;
  let mockCounter: any;
  let mockHistogram: any;
  let mockUpDownCounter: any;
  let mockObservableGauge: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCounter = {
      add: vi.fn(),
    };

    mockHistogram = {
      record: vi.fn(),
    };

    mockUpDownCounter = {
      add: vi.fn(),
    };

    mockObservableGauge = {
      addCallback: vi.fn(),
    };

    mockMeter = {
      createCounter: vi.fn().mockReturnValue(mockCounter),
      createHistogram: vi.fn().mockReturnValue(mockHistogram),
      createUpDownCounter: vi.fn().mockReturnValue(mockUpDownCounter),
      createObservableGauge: vi.fn().mockReturnValue(mockObservableGauge),
    };

    (metrics.getMeter as any).mockReturnValue(mockMeter);
  });

  describe('@Metric', () => {
    it('should track method calls, errors, and duration', () => {
      class TestService {
        @Metric()
        testMethod(value: string) {
          return `result-${value}`;
        }
      }

      const service = new TestService();
      const result = service.testMethod('test');

      expect(result).toBe('result-test');
      expect(metrics.getMeter).toHaveBeenCalledWith('TestService');
      
      // Should create metrics for calls, errors, and duration
      expect(mockMeter.createCounter).toHaveBeenCalledWith('TestService.testMethod.calls', {
        description: 'Number of calls to TestService.testMethod',
      });
      expect(mockMeter.createCounter).toHaveBeenCalledWith('TestService.testMethod.errors', {
        description: 'Number of errors in TestService.testMethod',
      });
      expect(mockMeter.createHistogram).toHaveBeenCalledWith('TestService.testMethod.duration', {
        description: 'Duration of TestService.testMethod in milliseconds',
        unit: 'ms',
      });

      // Should increment call counter
      expect(mockCounter.add).toHaveBeenCalledWith(1, expect.any(Object));
      
      // Should record duration
      expect(mockHistogram.record).toHaveBeenCalledWith(expect.any(Number), expect.any(Object));
    });

    it('should track errors when method throws', () => {
      const testError = new Error('Test error');

      class TestService {
        @Metric()
        failingMethod() {
          throw testError;
        }
      }

      const service = new TestService();

      expect(() => service.failingMethod()).toThrow(testError);
      
      // Should increment both calls and errors
      expect(mockCounter.add).toHaveBeenCalledWith(1, expect.any(Object));
      expect(mockCounter.add).toHaveBeenCalledWith(1, expect.objectContaining({
        method: 'failingMethod',
        class: 'TestService',
        error: 'true',
      }));
    });

    it('should handle async methods', async () => {
      class TestService {
        @Metric()
        async asyncMethod(value: number): Promise<number> {
          await new Promise(resolve => setTimeout(resolve, 10));
          return value * 2;
        }
      }

      const service = new TestService();
      const result = await service.asyncMethod(5);

      expect(result).toBe(10);
      expect(mockCounter.add).toHaveBeenCalledWith(1, expect.any(Object));
      expect(mockHistogram.record).toHaveBeenCalledWith(expect.any(Number), expect.any(Object));
    });

    it('should track async method errors', async () => {
      const testError = new Error('Async error');

      class TestService {
        @Metric()
        async failingAsyncMethod(): Promise<void> {
          throw testError;
        }
      }

      const service = new TestService();

      await expect(service.failingAsyncMethod()).rejects.toThrow(testError);
      
      // Should track error
      expect(mockCounter.add).toHaveBeenCalledWith(1, expect.objectContaining({
        error: 'true',
      }));
    });

    it('should use custom metric name', () => {
      class TestService {
        @Metric('custom.metric')
        customNamedMethod() {
          return 'custom';
        }
      }

      const service = new TestService();
      service.customNamedMethod();

      expect(mockMeter.createCounter).toHaveBeenCalledWith('custom.metric.calls', expect.any(Object));
      expect(mockMeter.createCounter).toHaveBeenCalledWith('custom.metric.errors', expect.any(Object));
      expect(mockMeter.createHistogram).toHaveBeenCalledWith('custom.metric.duration', expect.any(Object));
    });

    it('should add custom labels', () => {
      class TestService {
        @Metric(undefined, { service: 'auth', version: '1.0.0' })
        methodWithLabels() {
          return 'labeled';
        }
      }

      const service = new TestService();
      service.methodWithLabels();

      expect(mockCounter.add).toHaveBeenCalledWith(1, expect.objectContaining({
        service: 'auth',
        version: '1.0.0',
      }));
    });
  });

  describe('@Count', () => {
    it('should count method invocations', () => {
      class TestService {
        @Count()
        countedMethod(value: string) {
          return value.toUpperCase();
        }
      }

      const service = new TestService();
      const result = service.countedMethod('test');

      expect(result).toBe('TEST');
      expect(mockMeter.createCounter).toHaveBeenCalledWith('TestService.countedMethod.count', {
        description: 'Count of TestService.countedMethod invocations',
      });
      expect(mockCounter.add).toHaveBeenCalledWith(1, expect.objectContaining({
        method: 'countedMethod',
        class: 'TestService',
      }));
    });

    it('should use custom counter name', () => {
      class TestService {
        @Count('api.requests')
        apiRequest() {
          return 'request';
        }
      }

      const service = new TestService();
      service.apiRequest();

      expect(mockMeter.createCounter).toHaveBeenCalledWith('api.requests', {
        description: 'Count of api.requests invocations',
      });
    });

    it('should handle async methods', async () => {
      class TestService {
        @Count()
        async asyncCountedMethod(): Promise<string> {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'async';
        }
      }

      const service = new TestService();
      const result = await service.asyncCountedMethod();

      expect(result).toBe('async');
      expect(mockCounter.add).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should count even when method throws', () => {
      const error = new Error('Count error');

      class TestService {
        @Count()
        failingCountedMethod() {
          throw error;
        }
      }

      const service = new TestService();

      expect(() => service.failingCountedMethod()).toThrow(error);
      expect(mockCounter.add).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should apply custom labels', () => {
      class TestService {
        @Count(undefined, { endpoint: '/api/users', method: 'GET' })
        countWithLabels() {
          return 'labeled';
        }
      }

      const service = new TestService();
      service.countWithLabels();

      expect(mockCounter.add).toHaveBeenCalledWith(1, expect.objectContaining({
        endpoint: '/api/users',
        method: 'GET',
      }));
    });
  });

  describe('@Timed', () => {
    it('should measure method execution time', () => {
      class TestService {
        @Timed()
        timedMethod(value: number) {
          return value * 2;
        }
      }

      const service = new TestService();
      const result = service.timedMethod(5);

      expect(result).toBe(10);
      expect(mockMeter.createHistogram).toHaveBeenCalledWith('TestService.timedMethod.duration', {
        description: 'Duration of TestService.timedMethod',
        unit: 'ms',
      });
      expect(mockHistogram.record).toHaveBeenCalledWith(expect.any(Number), expect.objectContaining({
        method: 'timedMethod',
        class: 'TestService',
      }));
    });

    it('should use custom histogram name', () => {
      class TestService {
        @Timed('db.query.time')
        databaseQuery() {
          return 'query';
        }
      }

      const service = new TestService();
      service.databaseQuery();

      expect(mockMeter.createHistogram).toHaveBeenCalledWith('db.query.time', {
        description: 'Duration of db.query.time',
        unit: 'ms',
      });
    });

    it('should measure async method duration', async () => {
      class TestService {
        @Timed()
        async asyncTimedMethod(): Promise<string> {
          await new Promise(resolve => setTimeout(resolve, 50));
          return 'timed';
        }
      }

      const service = new TestService();
      const result = await service.asyncTimedMethod();

      expect(result).toBe('timed');
      expect(mockHistogram.record).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Object)
      );

      // Check that recorded time is at least 50ms
      const recordedTime = mockHistogram.record.mock.calls[0][0];
      expect(recordedTime).toBeGreaterThanOrEqual(50);
    });

    it('should record time even when method throws', () => {
      const error = new Error('Timed error');

      class TestService {
        @Timed()
        failingTimedMethod() {
          // Simulate some work
          const start = Date.now();
          while (Date.now() - start < 10) {
            // Busy wait
          }
          throw error;
        }
      }

      const service = new TestService();

      expect(() => service.failingTimedMethod()).toThrow(error);
      expect(mockHistogram.record).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('should apply custom labels', () => {
      class TestService {
        @Timed(undefined, { operation: 'read', resource: 'database' })
        timedWithLabels() {
          return 'labeled';
        }
      }

      const service = new TestService();
      service.timedWithLabels();

      expect(mockHistogram.record).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          operation: 'read',
          resource: 'database',
        })
      );
    });
  });

  describe('@Gauge', () => {
    it('should create observable gauge for property', () => {
      class TestService {
        private _activeConnections = 0;

        @Gauge('connections.active')
        get activeConnections() {
          return this._activeConnections;
        }

        setConnections(count: number) {
          this._activeConnections = count;
        }
      }

      const service = new TestService();
      
      // Access the getter to trigger decorator
      const value = service.activeConnections;
      
      expect(mockMeter.createObservableGauge).toHaveBeenCalledWith('connections.active', {
        description: 'Gauge for connections.active',
      });
      expect(mockObservableGauge.addCallback).toHaveBeenCalled();
    });

    it('should use default name based on property name', () => {
      class TestService {
        private _queueSize = 0;

        @Gauge()
        get queueSize() {
          return this._queueSize;
        }
      }

      const service = new TestService();
      const value = service.queueSize;

      expect(mockMeter.createObservableGauge).toHaveBeenCalledWith('TestService.queueSize', {
        description: 'Gauge for TestService.queueSize',
      });
    });

    it('should handle multiple gauges in same class', () => {
      class TestService {
        @Gauge('memory.usage')
        get memoryUsage() {
          return process.memoryUsage().heapUsed;
        }

        @Gauge('cpu.usage')
        get cpuUsage() {
          return 0.5; // Mock CPU usage
        }
      }

      const service = new TestService();
      const memory = service.memoryUsage;
      const cpu = service.cpuUsage;

      expect(mockMeter.createObservableGauge).toHaveBeenCalledWith('memory.usage', expect.any(Object));
      expect(mockMeter.createObservableGauge).toHaveBeenCalledWith('cpu.usage', expect.any(Object));
    });

    it('should apply labels to gauge', () => {
      class TestService {
        @Gauge('cache.size', { cache: 'redis', region: 'us-east-1' })
        get cacheSize() {
          return 1000;
        }
      }

      const service = new TestService();
      const size = service.cacheSize;

      expect(mockMeter.createObservableGauge).toHaveBeenCalledWith('cache.size', {
        description: 'Gauge for cache.size',
      });

      // The labels would be applied in the callback
      const callback = mockObservableGauge.addCallback.mock.calls[0][0];
      const mockObservableResult = { observe: vi.fn() };
      callback(mockObservableResult);
      
      expect(mockObservableResult.observe).toHaveBeenCalledWith(1000, {
        cache: 'redis',
        region: 'us-east-1',
      });
    });
  });

  describe('Decorator Composition', () => {
    it('should allow multiple metric decorators on same method', () => {
      class TestService {
        @Metric()
        @Count('method.calls')
        @Timed('method.time')
        composedMethod(value: string) {
          return `composed-${value}`;
        }
      }

      const service = new TestService();
      const result = service.composedMethod('test');

      expect(result).toBe('composed-test');
      
      // All three decorators should create their metrics
      expect(mockMeter.createCounter).toHaveBeenCalledTimes(3); // Metric creates 2 counters + Count creates 1
      expect(mockMeter.createHistogram).toHaveBeenCalledTimes(2); // Metric creates 1 + Timed creates 1
    });
  });
});