import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private register: client.Registry;

  // Custom metrics
  private httpRequestDuration: client.Histogram;
  private httpRequestTotal: client.Counter;
  private notificationsSent: client.Counter;
  private notificationsFailed: client.Counter;
  private notificationDeliveryTime: client.Histogram;
  private dbConnectionPool: client.Gauge;

  constructor() {
    this.register = new client.Registry();
    client.collectDefaultMetrics({ register: this.register });

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

    this.notificationsSent = new client.Counter({
      name: 'notifications_sent_total',
      help: 'Total number of notifications sent',
      labelNames: ['channel', 'type', 'tenant_id'],
    });

    this.notificationsFailed = new client.Counter({
      name: 'notifications_failed_total',
      help: 'Total number of failed notifications',
      labelNames: ['channel', 'type', 'error_type', 'tenant_id'],
    });

    this.notificationDeliveryTime = new client.Histogram({
      name: 'notification_delivery_time_seconds',
      help: 'Notification delivery time in seconds',
      labelNames: ['channel', 'type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
    });

    this.dbConnectionPool = new client.Gauge({
      name: 'db_connection_pool_size',
      help: 'Database connection pool size',
      labelNames: ['state'],
    });

    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.notificationsSent);
    this.register.registerMetric(this.notificationsFailed);
    this.register.registerMetric(this.notificationDeliveryTime);
    this.register.registerMetric(this.dbConnectionPool);
  }

  onModuleInit() {
    this.dbConnectionPool.set({ state: 'active' }, 0);
    this.dbConnectionPool.set({ state: 'idle' }, 10);
    this.dbConnectionPool.set({ state: 'total' }, 10);
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}
