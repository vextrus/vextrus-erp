import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private register: client.Registry;

  // Generic HTTP metrics
  private httpRequestDuration: client.Histogram;
  private httpRequestTotal: client.Counter;

  // API Gateway specific metrics
  private federatedQueryTotal: client.Counter;
  private federatedQueryDuration: client.Histogram;
  private serviceCallTotal: client.Counter;
  private serviceCallDuration: client.Histogram;
  private rateLimitHits: client.Counter;
  private authFailures: client.Counter;
  private requestSize: client.Histogram;
  private responseSize: client.Histogram;
  private cacheHitRate: client.Counter;
  private circuitBreakerStatus: client.Gauge;
  private activeConnectionsGauge: client.Gauge;
  private requestQueueSize: client.Gauge;

  constructor() {
    // Create a Registry
    this.register = new client.Registry();

    // Add default metrics
    client.collectDefaultMetrics({ register: this.register });

    // HTTP metrics
    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    });

    this.httpRequestTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    // API Gateway specific metrics
    this.federatedQueryTotal = new client.Counter({
      name: 'gateway_federated_query_total',
      help: 'Total number of federated GraphQL queries',
      labelNames: ['operation_type', 'operation_name', 'tenant_id'],
    });

    this.federatedQueryDuration = new client.Histogram({
      name: 'gateway_federated_query_duration_seconds',
      help: 'Duration of federated GraphQL queries',
      labelNames: ['operation_type', 'complexity'],
      buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10],
    });

    this.serviceCallTotal = new client.Counter({
      name: 'gateway_service_call_total',
      help: 'Total number of calls to backend services',
      labelNames: ['service', 'method', 'status'],
    });

    this.serviceCallDuration = new client.Histogram({
      name: 'gateway_service_call_duration_seconds',
      help: 'Duration of calls to backend services',
      labelNames: ['service', 'method'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    });

    this.rateLimitHits = new client.Counter({
      name: 'gateway_rate_limit_hits_total',
      help: 'Total number of rate limit violations',
      labelNames: ['client_id', 'limit_type'],
    });

    this.authFailures = new client.Counter({
      name: 'gateway_auth_failures_total',
      help: 'Total number of authentication failures',
      labelNames: ['failure_type', 'client_type'],
    });

    this.requestSize = new client.Histogram({
      name: 'gateway_request_size_bytes',
      help: 'Size of incoming requests in bytes',
      labelNames: ['method', 'route'],
      buckets: [100, 1000, 10000, 100000, 1000000, 10000000],
    });

    this.responseSize = new client.Histogram({
      name: 'gateway_response_size_bytes',
      help: 'Size of outgoing responses in bytes',
      labelNames: ['method', 'route'],
      buckets: [100, 1000, 10000, 100000, 1000000, 10000000],
    });

    this.cacheHitRate = new client.Counter({
      name: 'gateway_cache_hits_total',
      help: 'Cache hit/miss rate for cached responses',
      labelNames: ['cache_type', 'result'],
    });

    this.circuitBreakerStatus = new client.Gauge({
      name: 'gateway_circuit_breaker_status',
      help: 'Circuit breaker status (0=closed, 1=open, 0.5=half-open)',
      labelNames: ['service'],
    });

    this.activeConnectionsGauge = new client.Gauge({
      name: 'gateway_active_connections',
      help: 'Number of active connections',
      labelNames: ['protocol'],
    });

    this.requestQueueSize = new client.Gauge({
      name: 'gateway_request_queue_size',
      help: 'Size of request queue',
      labelNames: ['priority'],
    });

    // Register all metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.federatedQueryTotal);
    this.register.registerMetric(this.federatedQueryDuration);
    this.register.registerMetric(this.serviceCallTotal);
    this.register.registerMetric(this.serviceCallDuration);
    this.register.registerMetric(this.rateLimitHits);
    this.register.registerMetric(this.authFailures);
    this.register.registerMetric(this.requestSize);
    this.register.registerMetric(this.responseSize);
    this.register.registerMetric(this.cacheHitRate);
    this.register.registerMetric(this.circuitBreakerStatus);
    this.register.registerMetric(this.activeConnectionsGauge);
    this.register.registerMetric(this.requestQueueSize);
  }

  onModuleInit() {
    // Initialize gauges
    this.circuitBreakerStatus.set({ service: 'default' }, 0);
    this.activeConnectionsGauge.set({ protocol: 'http' }, 0);
    this.activeConnectionsGauge.set({ protocol: 'websocket' }, 0);
    this.requestQueueSize.set({ priority: 'normal' }, 0);
    this.requestQueueSize.set({ priority: 'high' }, 0);
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  // Helper methods for tracking metrics
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestTotal.inc({ method, route, status_code: statusCode.toString() });
    this.httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
  }

  recordFederatedQuery(operationType: string, operationName: string, tenantId: string, duration: number, complexity: string) {
    this.federatedQueryTotal.inc({ operation_type: operationType, operation_name: operationName, tenant_id: tenantId });
    this.federatedQueryDuration.observe({ operation_type: operationType, complexity }, duration);
  }

  recordServiceCall(service: string, method: string, status: string, duration: number) {
    this.serviceCallTotal.inc({ service, method, status });
    this.serviceCallDuration.observe({ service, method }, duration);
  }

  recordRateLimitHit(clientId: string, limitType: string) {
    this.rateLimitHits.inc({ client_id: clientId, limit_type: limitType });
  }

  recordAuthFailure(failureType: string, clientType: string) {
    this.authFailures.inc({ failure_type: failureType, client_type: clientType });
  }

  recordRequestSize(method: string, route: string, size: number) {
    this.requestSize.observe({ method, route }, size);
  }

  recordResponseSize(method: string, route: string, size: number) {
    this.responseSize.observe({ method, route }, size);
  }

  recordCacheAccess(cacheType: string, hit: boolean) {
    this.cacheHitRate.inc({ cache_type: cacheType, result: hit ? 'hit' : 'miss' });
  }

  updateCircuitBreakerStatus(service: string, status: number) {
    this.circuitBreakerStatus.set({ service }, status);
  }

  updateActiveConnections(protocol: string, count: number) {
    this.activeConnectionsGauge.set({ protocol }, count);
  }

  updateRequestQueueSize(priority: string, size: number) {
    this.requestQueueSize.set({ priority }, size);
  }
}
