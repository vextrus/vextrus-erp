export interface MetricValue {
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

export interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description?: string;
  unit?: string;
  values: MetricValue[];
}

export interface MetricOptions {
  labels?: Record<string, string>;
  buckets?: number[];
  percentiles?: number[];
  maxAge?: number;
}

export interface IMetricsProvider {
  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value?: number, labels?: Record<string, string>): void;
  
  /**
   * Set a gauge metric
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void;
  
  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void;
  
  /**
   * Record a summary value
   */
  recordSummary(name: string, value: number, labels?: Record<string, string>): void;
  
  /**
   * Get metric by name
   */
  getMetric(name: string): Metric | null;
  
  /**
   * Get all metrics
   */
  getAllMetrics(): Metric[];
  
  /**
   * Register a new metric
   */
  registerMetric(name: string, type: Metric['type'], description?: string, options?: MetricOptions): void;
  
  /**
   * Unregister a metric
   */
  unregisterMetric(name: string): void;
  
  /**
   * Clear all metrics
   */
  clearMetrics(): void;
  
  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(): string;
  
  /**
   * Export metrics as JSON
   */
  exportJson(): Record<string, any>;
}

export interface IMetricsCollector {
  /**
   * Start collecting metrics
   */
  start(): void;
  
  /**
   * Stop collecting metrics
   */
  stop(): void;
  
  /**
   * Collect metrics snapshot
   */
  collect(): Promise<Metric[]>;
  
  /**
   * Set collection interval
   */
  setInterval(seconds: number): void;
  
  /**
   * Register metrics provider
   */
  registerProvider(provider: IMetricsProvider): void;
}