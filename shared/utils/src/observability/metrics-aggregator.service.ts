import { Injectable } from '@nestjs/common';
import { metrics, Meter, Counter, Histogram, UpDownCounter } from '@opentelemetry/api';

export interface MetricData {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: Date;
}

export interface AggregatedMetrics {
  counters: Record<string, number>;
  gauges: Record<string, number>;
  histograms: Record<string, { count: number; sum: number; min: number; max: number }>;
}

@Injectable()
export class MetricsAggregatorService {
  private meter: Meter;
  private counters: Map<string, Counter> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private gauges: Map<string, UpDownCounter> = new Map();
  private aggregatedData: AggregatedMetrics = {
    counters: {},
    gauges: {},
    histograms: {}
  };

  constructor() {
    this.meter = metrics.getMeter('vextrus-metrics', '1.0.0');
    this.initializeCommonMetrics();
  }

  private initializeCommonMetrics(): void {
    // HTTP metrics
    this.createCounter('http_requests_total', 'Total HTTP requests');
    this.createHistogram('http_request_duration', 'HTTP request duration in milliseconds');
    this.createGauge('http_active_connections', 'Number of active HTTP connections');
    
    // Business metrics
    this.createCounter('business_transactions_total', 'Total business transactions');
    this.createCounter('business_errors_total', 'Total business errors');
    this.createHistogram('business_operation_duration', 'Business operation duration');
    
    // System metrics
    this.createGauge('system_memory_usage', 'System memory usage in MB');
    this.createGauge('system_cpu_usage', 'System CPU usage percentage');
    this.createCounter('system_cache_hits', 'Cache hit count');
    this.createCounter('system_cache_misses', 'Cache miss count');
  }

  /**
   * Create or get a counter metric
   */
  createCounter(name: string, description?: string): Counter {
    if (!this.counters.has(name)) {
      const counter = this.meter.createCounter(name, { description });
      this.counters.set(name, counter);
      this.aggregatedData.counters[name] = 0;
    }
    return this.counters.get(name)!;
  }

  /**
   * Create or get a histogram metric
   */
  createHistogram(name: string, description?: string, unit?: string): Histogram {
    if (!this.histograms.has(name)) {
      const histogram = this.meter.createHistogram(name, { description, unit });
      this.histograms.set(name, histogram);
      this.aggregatedData.histograms[name] = { count: 0, sum: 0, min: Infinity, max: -Infinity };
    }
    return this.histograms.get(name)!;
  }

  /**
   * Create or get a gauge metric
   */
  createGauge(name: string, description?: string): UpDownCounter {
    if (!this.gauges.has(name)) {
      const gauge = this.meter.createUpDownCounter(name, { description });
      this.gauges.set(name, gauge);
      this.aggregatedData.gauges[name] = 0;
    }
    return this.gauges.get(name)!;
  }

  /**
   * Record a counter increment
   */
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const counter = this.createCounter(name);
    counter.add(value, labels);
    this.aggregatedData.counters[name] = (this.aggregatedData.counters[name] || 0) + value;
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const histogram = this.createHistogram(name);
    histogram.record(value, labels);
    
    const current = this.aggregatedData.histograms[name] || 
                   { count: 0, sum: 0, min: Infinity, max: -Infinity };
    
    this.aggregatedData.histograms[name] = {
      count: current.count + 1,
      sum: current.sum + value,
      min: Math.min(current.min, value),
      max: Math.max(current.max, value)
    };
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const gauge = this.createGauge(name);
    const current = this.aggregatedData.gauges[name] || 0;
    const delta = value - current;
    gauge.add(delta, labels);
    this.aggregatedData.gauges[name] = value;
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number
  ): void {
    const labels = { method, path, status: statusCode.toString() };
    
    this.incrementCounter('http_requests_total', 1, labels);
    this.recordHistogram('http_request_duration', duration, labels);
    
    if (statusCode >= 400) {
      this.incrementCounter('http_errors_total', 1, labels);
    }
  }

  /**
   * Record business transaction metrics
   */
  recordBusinessTransaction(
    type: string,
    success: boolean,
    duration: number,
    metadata?: Record<string, string>
  ): void {
    const labels = { type, success: success.toString(), ...metadata };
    
    this.incrementCounter('business_transactions_total', 1, labels);
    this.recordHistogram('business_operation_duration', duration, labels);
    
    if (!success) {
      this.incrementCounter('business_errors_total', 1, labels);
    }
  }

  /**
   * Record cache metrics
   */
  recordCacheOperation(hit: boolean, key?: string): void {
    const labels = key ? { key } : undefined;
    
    if (hit) {
      this.incrementCounter('system_cache_hits', 1, labels);
    } else {
      this.incrementCounter('system_cache_misses', 1, labels);
    }
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(): AggregatedMetrics {
    return { ...this.aggregatedData };
  }

  /**
   * Reset aggregated metrics
   */
  resetAggregatedMetrics(): void {
    this.aggregatedData = {
      counters: {},
      gauges: {},
      histograms: {}
    };
    
    // Re-initialize with zero values
    this.counters.forEach((_, name) => {
      this.aggregatedData.counters[name] = 0;
    });
    
    this.gauges.forEach((_, name) => {
      this.aggregatedData.gauges[name] = 0;
    });
    
    this.histograms.forEach((_, name) => {
      this.aggregatedData.histograms[name] = { count: 0, sum: 0, min: Infinity, max: -Infinity };
    });
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(): string {
    const lines: string[] = [];
    
    // Export counters
    Object.entries(this.aggregatedData.counters).forEach(([name, value]) => {
      lines.push(`# TYPE ${name} counter`);
      lines.push(`${name} ${value}`);
    });
    
    // Export gauges
    Object.entries(this.aggregatedData.gauges).forEach(([name, value]) => {
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${name} ${value}`);
    });
    
    // Export histograms
    Object.entries(this.aggregatedData.histograms).forEach(([name, data]) => {
      lines.push(`# TYPE ${name} histogram`);
      lines.push(`${name}_count ${data.count}`);
      lines.push(`${name}_sum ${data.sum}`);
      if (data.count > 0) {
        lines.push(`${name}_min ${data.min}`);
        lines.push(`${name}_max ${data.max}`);
      }
    });
    
    return lines.join('\n');
  }
}