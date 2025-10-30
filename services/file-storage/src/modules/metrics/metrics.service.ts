import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private register: client.Registry;
  private httpRequestDuration: client.Histogram;
  private httpRequestTotal: client.Counter;
  private filesUploaded: client.Counter;
  private filesDownloaded: client.Counter;
  private storageUsed: client.Gauge;
  private uploadDuration: client.Histogram;

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

    this.filesUploaded = new client.Counter({
      name: 'files_uploaded_total',
      help: 'Total number of files uploaded',
      labelNames: ['mime_type', 'tenant_id'],
    });

    this.filesDownloaded = new client.Counter({
      name: 'files_downloaded_total',
      help: 'Total number of files downloaded',
      labelNames: ['mime_type', 'tenant_id'],
    });

    this.storageUsed = new client.Gauge({
      name: 'storage_used_bytes',
      help: 'Storage used in bytes',
      labelNames: ['tenant_id'],
    });

    this.uploadDuration = new client.Histogram({
      name: 'file_upload_duration_seconds',
      help: 'File upload duration in seconds',
      labelNames: ['mime_type'],
      buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 120],
    });

    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.filesUploaded);
    this.register.registerMetric(this.filesDownloaded);
    this.register.registerMetric(this.storageUsed);
    this.register.registerMetric(this.uploadDuration);
  }

  onModuleInit() {}

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}
