import { metrics, Meter, Counter, Histogram, ObservableGauge } from '@opentelemetry/api';

// Cache for metrics to avoid recreating them
const metricsCache = new Map<string, any>();

/**
 * Decorator for recording method execution metrics
 */
export function Metric(metricName?: string, options?: MetricOptions) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = propertyName;
    const name = metricName || `${className}.${methodName}`;

    let callCounter: Counter;
    let errorCounter: Counter;
    let durationHistogram: Histogram;

    descriptor.value = function (...args: any[]) {
      // Lazy initialize metrics
      if (!callCounter) {
        const meter = metrics.getMeter(className);
        
        callCounter = metricsCache.get(`${name}.calls`) || 
          meter.createCounter(`${name}.calls`, {
            description: `Number of calls to ${className}.${methodName}`,
          });
        metricsCache.set(`${name}.calls`, callCounter);
        
        errorCounter = metricsCache.get(`${name}.errors`) ||
          meter.createCounter(`${name}.errors`, {
            description: `Number of errors in ${className}.${methodName}`,
          });
        metricsCache.set(`${name}.errors`, errorCounter);
        
        durationHistogram = metricsCache.get(`${name}.duration`) ||
          meter.createHistogram(`${name}.duration`, {
            description: `Duration of ${className}.${methodName} in milliseconds`,
            unit: 'ms',
          });
        metricsCache.set(`${name}.duration`, durationHistogram);
      }

      const startTime = Date.now();
      
      // Handle both direct labels and options.labels
      let customLabels = {};
      if (options) {
        // If options has known MetricOptions properties, use labels from it
        if ('meterName' in options || 'meterVersion' in options || 'labels' in options) {
          customLabels = options.labels || {};
        } else {
          // Otherwise treat the entire options object as labels
          customLabels = options;
        }
      }
      
      const labels = {
        method: methodName,
        class: className,
        ...customLabels
      };

      try {
        callCounter.add(1, labels);
        const result = originalMethod.apply(this, args);
        
        // Handle both sync and async results
        if (result && typeof result.then === 'function') {
          return result
            .then((res: any) => {
              const duration = Date.now() - startTime;
              durationHistogram.record(duration, labels);
              return res;
            })
            .catch((error: any) => {
              errorCounter.add(1, { ...labels, error: 'true' });
              const duration = Date.now() - startTime;
              durationHistogram.record(duration, { ...labels, error: 'true' });
              throw error;
            });
        } else {
          const duration = Date.now() - startTime;
          durationHistogram.record(duration, labels);
          return result;
        }
      } catch (error: any) {
        errorCounter.add(1, { ...labels, error: 'true' });
        const duration = Date.now() - startTime;
        durationHistogram.record(duration, { ...labels, error: 'true' });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator for counting method calls
 */
export function Count(counterName?: string, options?: CountOptions) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = propertyName;
    const name = counterName || `${className}.${methodName}.count`;

    let counter: Counter;

    descriptor.value = function (...args: any[]) {
      // Lazy initialize counter
      if (!counter) {
        const meter = metrics.getMeter(className);
        const description = options?.description || 
          (counterName ? `Count of ${counterName} invocations` : `Count of ${className}.${methodName} invocations`);
        counter = metricsCache.get(name) ||
          meter.createCounter(name, { description });
        metricsCache.set(name, counter);
      }

      // Handle both direct labels and options.labels
      let customLabels = {};
      if (options) {
        // If options has known CountOptions properties, use labels from it
        if ('description' in options || 'labels' in options || 'meterName' in options || 'meterVersion' in options) {
          customLabels = options.labels || {};
        } else {
          // Otherwise treat the entire options object as labels
          customLabels = options;
        }
      }
      
      const labels = {
        method: methodName,
        class: className,
        ...customLabels
      };

      counter.add(1, labels);
      
      const result = originalMethod.apply(this, args);
      
      // Handle both sync and async results
      if (result && typeof result.then === 'function') {
        return result.catch((error: any) => {
          // Still count even on error
          throw error;
        });
      }
      return result;
    };

    return descriptor;
  };
}

/**
 * Decorator for recording timing metrics
 */
export function Timed(histogramName?: string, options?: TimedOptions) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = propertyName;
    const name = histogramName || `${className}.${methodName}.duration`;

    let histogram: Histogram;

    descriptor.value = function (...args: any[]) {
      // Lazy initialize histogram
      if (!histogram) {
        const meter = metrics.getMeter(className);
        const description = options?.description || 
          (histogramName ? `Duration of ${histogramName}` : `Duration of ${className}.${methodName}`);
        histogram = metricsCache.get(name) ||
          meter.createHistogram(name, {
            description,
            unit: options?.unit || 'ms',
          });
        metricsCache.set(name, histogram);
      }

      const startTime = Date.now();
      
      // Handle both direct labels and options.labels
      let customLabels = {};
      if (options) {
        // If options has known TimedOptions properties, use labels from it
        if ('description' in options || 'unit' in options || 'labels' in options || 'meterName' in options || 'meterVersion' in options) {
          customLabels = options.labels || {};
        } else {
          // Otherwise treat the entire options object as labels
          customLabels = options;
        }
      }
      
      const labels = {
        method: methodName,
        class: className,
        ...customLabels
      };

      try {
        const result = originalMethod.apply(this, args);
        
        // Handle both sync and async results
        if (result && typeof result.then === 'function') {
          return result
            .then((res: any) => {
              const duration = Date.now() - startTime;
              histogram.record(duration, labels);
              return res;
            })
            .catch((error: any) => {
              const duration = Date.now() - startTime;
              histogram.record(duration, { ...labels, error: 'true' });
              throw error;
            });
        } else {
          const duration = Date.now() - startTime;
          histogram.record(duration, labels);
          return result;
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        histogram.record(duration, { ...labels, error: 'true' });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator for observable gauge metrics
 */
export function Gauge(gaugeName?: string, options?: GaugeOptions) {
  return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    const className = target.constructor.name;
    const propertyName = propertyKey;
    const name = gaugeName || `${className}.${propertyName}`;

    // This is a getter decorator
    if (descriptor && descriptor.get) {
      const originalGetter = descriptor.get;
      let gauge: ObservableGauge;
      let initialized = false;

      descriptor.get = function () {
        if (!initialized) {
          const meter = metrics.getMeter(className);
          gauge = metricsCache.get(name) ||
            meter.createObservableGauge(name, {
              description: options?.description || `Gauge for ${name}`,
            });
          metricsCache.set(name, gauge);

          gauge.addCallback((observableResult) => {
            const value = originalGetter.call(this);
            
            // Handle both direct labels and options.labels
            let customLabels = {};
            if (options) {
              // If options has known GaugeOptions properties, use labels from it
              if ('description' in options || 'labels' in options || 'meterName' in options || 'meterVersion' in options) {
                customLabels = options.labels || {};
              } else {
                // Otherwise treat the entire options object as labels
                customLabels = options;
              }
            }
            
            observableResult.observe(value, customLabels);
          });

          initialized = true;
        }

        return originalGetter.call(this);
      };

      return descriptor;
    }
    
    // Return undefined for property decorators (when descriptor is not provided)
    return;
  };
}

export interface MetricOptions {
  meterName?: string;
  meterVersion?: string;
  labels?: Record<string, any>;
}

export interface CountOptions extends MetricOptions {
  description?: string;
}

export interface TimedOptions extends MetricOptions {
  description?: string;
  unit?: string;
}

export interface GaugeOptions extends MetricOptions {
  description?: string;
}