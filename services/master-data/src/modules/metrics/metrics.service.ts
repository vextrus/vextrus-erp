import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private register: client.Registry;

  // Generic HTTP metrics
  private httpRequestDuration: client.Histogram;
  private httpRequestTotal: client.Counter;

  // Master Data specific metrics
  private crudOperationsTotal: client.Counter;
  private crudOperationDuration: client.Histogram;
  private queryDuration: client.Histogram;
  private cacheHitRate: client.Counter;
  private dataValidationErrors: client.Counter;
  private entityCount: client.Gauge;
  private bulkOperationsTotal: client.Counter;
  private dataExportTotal: client.Counter;
  private dataImportTotal: client.Counter;

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

    // Master Data specific metrics
    this.crudOperationsTotal = new client.Counter({
      name: 'master_data_crud_operations_total',
      help: 'Total number of CRUD operations',
      labelNames: ['entity_type', 'operation', 'tenant_id'],
    });

    this.crudOperationDuration = new client.Histogram({
      name: 'master_data_crud_operation_duration_seconds',
      help: 'Duration of CRUD operations',
      labelNames: ['entity_type', 'operation'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    });

    this.queryDuration = new client.Histogram({
      name: 'master_data_query_duration_seconds',
      help: 'Duration of database queries',
      labelNames: ['entity_type', 'query_type'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10],
    });

    this.cacheHitRate = new client.Counter({
      name: 'master_data_cache_hits_total',
      help: 'Cache hit/miss rate',
      labelNames: ['entity_type', 'result'],
    });

    this.dataValidationErrors = new client.Counter({
      name: 'master_data_validation_errors_total',
      help: 'Total number of data validation errors',
      labelNames: ['entity_type', 'field', 'error_type'],
    });

    this.entityCount = new client.Gauge({
      name: 'master_data_entity_count',
      help: 'Current count of entities',
      labelNames: ['entity_type', 'tenant_id'],
    });

    this.bulkOperationsTotal = new client.Counter({
      name: 'master_data_bulk_operations_total',
      help: 'Total number of bulk operations',
      labelNames: ['entity_type', 'operation', 'status'],
    });

    this.dataExportTotal = new client.Counter({
      name: 'master_data_export_total',
      help: 'Total number of data exports',
      labelNames: ['entity_type', 'format', 'status'],
    });

    this.dataImportTotal = new client.Counter({
      name: 'master_data_import_total',
      help: 'Total number of data imports',
      labelNames: ['entity_type', 'format', 'status'],
    });

    // Register all metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.crudOperationsTotal);
    this.register.registerMetric(this.crudOperationDuration);
    this.register.registerMetric(this.queryDuration);
    this.register.registerMetric(this.cacheHitRate);
    this.register.registerMetric(this.dataValidationErrors);
    this.register.registerMetric(this.entityCount);
    this.register.registerMetric(this.bulkOperationsTotal);
    this.register.registerMetric(this.dataExportTotal);
    this.register.registerMetric(this.dataImportTotal);
  }

  onModuleInit() {
    // Initialize entity counts
    const entities = ['customer', 'vendor', 'product', 'account'];
    entities.forEach(entity => {
      this.entityCount.set({ entity_type: entity, tenant_id: 'default' }, 0);
    });
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  // Helper methods for tracking metrics
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestTotal.inc({ method, route, status_code: statusCode.toString() });
    this.httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
  }

  recordCrudOperation(entityType: string, operation: string, tenantId: string, duration: number) {
    this.crudOperationsTotal.inc({ entity_type: entityType, operation, tenant_id: tenantId });
    this.crudOperationDuration.observe({ entity_type: entityType, operation }, duration);
  }

  recordQuery(entityType: string, queryType: string, duration: number) {
    this.queryDuration.observe({ entity_type: entityType, query_type: queryType }, duration);
  }

  recordCacheAccess(entityType: string, hit: boolean) {
    this.cacheHitRate.inc({ entity_type: entityType, result: hit ? 'hit' : 'miss' });
  }

  recordValidationError(entityType: string, field: string, errorType: string) {
    this.dataValidationErrors.inc({ entity_type: entityType, field, error_type: errorType });
  }

  updateEntityCount(entityType: string, tenantId: string, count: number) {
    this.entityCount.set({ entity_type: entityType, tenant_id: tenantId }, count);
  }

  recordBulkOperation(entityType: string, operation: string, status: string) {
    this.bulkOperationsTotal.inc({ entity_type: entityType, operation, status });
  }

  recordDataExport(entityType: string, format: string, status: string) {
    this.dataExportTotal.inc({ entity_type: entityType, format, status });
  }

  recordDataImport(entityType: string, format: string, status: string) {
    this.dataImportTotal.inc({ entity_type: entityType, format, status });
  }
}
