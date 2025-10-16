import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private register: client.Registry;

  // Custom metrics
  private httpRequestDuration: client.Histogram;
  private httpRequestTotal: client.Counter;
  private auditEventsTotal: client.Counter;
  private dbConnectionPool: client.Gauge;
  private activeConnections: client.Gauge;

  constructor() {
    // Create a Registry
    this.register = new client.Registry();

    // Add default metrics
    client.collectDefaultMetrics({ register: this.register });

    // Custom metrics
    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    });

    this.httpRequestTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.auditEventsTotal = new client.Counter({
      name: 'audit_events_total',
      help: 'Total number of audit events',
      labelNames: ['event_type', 'severity', 'outcome', 'tenant_id'],
    });

    this.dbConnectionPool = new client.Gauge({
      name: 'db_connection_pool_size',
      help: 'Database connection pool size',
      labelNames: ['state'],
    });

    this.activeConnections = new client.Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      labelNames: ['type'],
    });

    // Register custom metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.auditEventsTotal);
    this.register.registerMetric(this.dbConnectionPool);
    this.register.registerMetric(this.activeConnections);
  }

  onModuleInit() {
    // Initialize connection pool metrics
    this.dbConnectionPool.set({ state: 'active' }, 0);
    this.dbConnectionPool.set({ state: 'idle' }, 10);
    this.dbConnectionPool.set({ state: 'total' }, 10);
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  // Helper methods for tracking metrics
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestTotal.inc({ method, route, status_code: statusCode.toString() });
    this.httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
  }

  recordAuditEvent(eventType: string, severity: string, outcome: string, tenantId: string) {
    this.auditEventsTotal.inc({
      event_type: eventType,
      severity,
      outcome,
      tenant_id: tenantId
    });
  }

  updateConnectionPool(active: number, idle: number) {
    this.dbConnectionPool.set({ state: 'active' }, active);
    this.dbConnectionPool.set({ state: 'idle' }, idle);
    this.dbConnectionPool.set({ state: 'total' }, active + idle);
  }

  updateActiveConnections(type: string, count: number) {
    this.activeConnections.set({ type }, count);
  }
}