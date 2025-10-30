#!/bin/bash

# Script to set up metrics modules for all infrastructure services

services=("notification" "file-storage" "document-generator" "scheduler" "configuration" "import-export")

echo "Setting up metrics modules for infrastructure services..."

for service in "${services[@]}"; do
    echo "Processing $service..."

    # Create metrics module directory
    mkdir -p "services/$service/src/modules/metrics"

    # Copy metrics files from audit service
    cp services/audit/src/modules/metrics/metrics.module.ts "services/$service/src/modules/metrics/"
    cp services/audit/src/modules/metrics/metrics.controller.ts "services/$service/src/modules/metrics/"

    # Customize metrics.service.ts for each service
    case $service in
        "notification")
            cat > "services/$service/src/modules/metrics/metrics.service.ts" << 'EOF'
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
EOF
            ;;
        "file-storage")
            cat > "services/$service/src/modules/metrics/metrics.service.ts" << 'EOF'
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
EOF
            ;;
        *)
            # Default metrics service for other services
            cp services/audit/src/modules/metrics/metrics.service.ts "services/$service/src/modules/metrics/"
            ;;
    esac

    echo "  ✓ Created metrics module for $service"
done

echo ""
echo "Updating app.module.ts files..."

# Update app.module.ts for each service
for service in "${services[@]}"; do
    app_module="services/$service/src/app.module.ts"

    # Add MetricsModule import if not already present
    if ! grep -q "MetricsModule" "$app_module"; then
        # Add import statement
        sed -i "/^import.*Module.*from.*@nestjs/a\\\nimport { MetricsModule } from './modules/metrics/metrics.module';" "$app_module"

        # Add to imports array (before the last closing bracket of imports)
        sed -i '/ScheduleModule\.forRoot()/a\    MetricsModule,' "$app_module"

        echo "  ✓ Updated app.module.ts for $service"
    else
        echo "  ✓ $service already has MetricsModule"
    fi
done

echo ""
echo "Done! All services now have metrics modules configured."
echo "Services will expose metrics at http://<service>:<port>/metrics"