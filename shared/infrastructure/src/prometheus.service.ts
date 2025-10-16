import { Injectable } from '@nestjs/common';
import * as promClient from 'prom-client';

@Injectable()
export class PrometheusService {
  private readonly register: promClient.Registry;
  private readonly httpRequestDuration: promClient.Histogram<string>;
  private readonly httpRequestTotal: promClient.Counter<string>;
  private readonly errorTotal: promClient.Counter<string>;
  private readonly activeConnections: promClient.Gauge<string>;

  constructor() {
    this.register = new promClient.Registry();

    // Add default metrics
    promClient.collectDefaultMetrics({ register: this.register });

    // HTTP Request Duration Histogram
    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_ms',
      help: 'Duration of HTTP requests in ms',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 5, 15, 50, 100, 500, 1000, 5000],
    });
    this.register.registerMetric(this.httpRequestDuration);

    // HTTP Request Total Counter
    this.httpRequestTotal = new promClient.Counter({
      name: 'http_request_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });
    this.register.registerMetric(this.httpRequestTotal);

    // Error Total Counter
    this.errorTotal = new promClient.Counter({
      name: 'error_total',
      help: 'Total number of errors',
      labelNames: ['type', 'service'],
    });
    this.register.registerMetric(this.errorTotal);

    // Active Connections Gauge
    this.activeConnections = new promClient.Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      labelNames: ['service'],
    });
    this.register.registerMetric(this.activeConnections);
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
  ): void {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration);
    this.httpRequestTotal
      .labels(method, route, statusCode.toString())
      .inc();
  }

  recordError(type: string, service: string): void {
    this.errorTotal.labels(type, service).inc();
  }

  setActiveConnections(service: string, count: number): void {
    this.activeConnections.labels(service).set(count);
  }

  incrementActiveConnections(service: string): void {
    this.activeConnections.labels(service).inc();
  }

  decrementActiveConnections(service: string): void {
    this.activeConnections.labels(service).dec();
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  getContentType(): string {
    return this.register.contentType;
  }

  createCounter(
    name: string,
    help: string,
    labelNames: string[] = [],
  ): promClient.Counter<string> {
    const counter = new promClient.Counter({
      name,
      help,
      labelNames,
    });
    this.register.registerMetric(counter);
    return counter;
  }

  createGauge(
    name: string,
    help: string,
    labelNames: string[] = [],
  ): promClient.Gauge<string> {
    const gauge = new promClient.Gauge({
      name,
      help,
      labelNames,
    });
    this.register.registerMetric(gauge);
    return gauge;
  }

  createHistogram(
    name: string,
    help: string,
    labelNames: string[] = [],
    buckets?: number[],
  ): promClient.Histogram<string> {
    const histogram = new promClient.Histogram({
      name,
      help,
      labelNames,
      buckets,
    });
    this.register.registerMetric(histogram);
    return histogram;
  }

  createSummary(
    name: string,
    help: string,
    labelNames: string[] = [],
    percentiles?: number[],
  ): promClient.Summary<string> {
    const summary = new promClient.Summary({
      name,
      help,
      labelNames,
      percentiles,
    });
    this.register.registerMetric(summary);
    return summary;
  }

  reset(): void {
    this.register.clear();
  }
}