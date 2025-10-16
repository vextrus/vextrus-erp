import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);
  private register: client.Registry;
  
  // HTTP metrics
  private httpRequestDuration: client.Histogram;
  private httpRequestTotal: client.Counter;
  
  // Organization-specific metrics
  private organizationTotal: client.Gauge;
  private tenantTotal: client.Gauge;
  private divisionTotal: client.Gauge;
  private organizationOperations: client.Counter;
  private tenantOperations: client.Counter;
  private licenseUsage: client.Gauge;
  private subscriptionStatus: client.Gauge;
  private multiTenantQueries: client.Histogram;
  
  constructor() {
    this.register = new client.Registry();
  }

  onModuleInit() {
    this.initializeMetrics();
    this.logger.log('Metrics initialized');
  }

  private initializeMetrics() {
    // Collect default metrics
    client.collectDefaultMetrics({ register: this.register });

    // HTTP Request Duration
    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });
    this.register.registerMetric(this.httpRequestDuration);

    // HTTP Request Total
    this.httpRequestTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });
    this.register.registerMetric(this.httpRequestTotal);

    // Organization Total
    this.organizationTotal = new client.Gauge({
      name: 'organization_total',
      help: 'Total number of organizations',
      labelNames: ['status', 'type', 'subscription_plan'],
    });
    this.register.registerMetric(this.organizationTotal);

    // Tenant Total
    this.tenantTotal = new client.Gauge({
      name: 'tenant_total',
      help: 'Total number of tenants',
      labelNames: ['status', 'organization_id'],
    });
    this.register.registerMetric(this.tenantTotal);

    // Division Total
    this.divisionTotal = new client.Gauge({
      name: 'division_total',
      help: 'Total number of divisions',
      labelNames: ['type', 'is_active', 'organization_id'],
    });
    this.register.registerMetric(this.divisionTotal);

    // Organization Operations
    this.organizationOperations = new client.Counter({
      name: 'organization_operations_total',
      help: 'Total number of organization operations',
      labelNames: ['operation', 'status', 'subscription_plan'],
    });
    this.register.registerMetric(this.organizationOperations);

    // Tenant Operations
    this.tenantOperations = new client.Counter({
      name: 'tenant_operations_total',
      help: 'Total number of tenant operations',
      labelNames: ['operation', 'status', 'tenant_id'],
    });
    this.register.registerMetric(this.tenantOperations);

    // License Usage
    this.licenseUsage = new client.Gauge({
      name: 'license_usage',
      help: 'License usage metrics',
      labelNames: ['organization_id', 'resource_type', 'limit_type'],
    });
    this.register.registerMetric(this.licenseUsage);

    // Subscription Status
    this.subscriptionStatus = new client.Gauge({
      name: 'subscription_status',
      help: 'Subscription status for organizations',
      labelNames: ['organization_id', 'plan', 'days_until_expiry'],
    });
    this.register.registerMetric(this.subscriptionStatus);

    // Multi-Tenant Query Performance
    this.multiTenantQueries = new client.Histogram({
      name: 'multi_tenant_query_duration_seconds',
      help: 'Duration of multi-tenant queries in seconds',
      labelNames: ['query_type', 'tenant_id', 'organization_id'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
    });
    this.register.registerMetric(this.multiTenantQueries);
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestTotal.inc({ method, route, status_code: statusCode.toString() });
    this.httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
  }

  recordOrganizationCreated(orgType: string, subscriptionPlan: string) {
    this.organizationOperations.inc({ 
      operation: 'create', 
      status: 'success', 
      subscription_plan: subscriptionPlan 
    });
    this.organizationTotal.inc({ 
      status: 'active', 
      type: orgType, 
      subscription_plan: subscriptionPlan 
    });
  }

  recordOrganizationUpdated(subscriptionPlan: string, success: boolean = true) {
    this.organizationOperations.inc({ 
      operation: 'update', 
      status: success ? 'success' : 'failure', 
      subscription_plan: subscriptionPlan 
    });
  }

  recordOrganizationDeleted(subscriptionPlan: string) {
    this.organizationOperations.inc({ 
      operation: 'delete', 
      status: 'success', 
      subscription_plan: subscriptionPlan 
    });
  }

  recordTenantCreated(organizationId: string) {
    this.tenantOperations.inc({ 
      operation: 'create', 
      status: 'success', 
      tenant_id: 'new' 
    });
    this.tenantTotal.inc({ 
      status: 'active', 
      organization_id: organizationId 
    });
  }

  recordTenantOperation(operation: string, tenantId: string, success: boolean = true) {
    this.tenantOperations.inc({ 
      operation, 
      status: success ? 'success' : 'failure', 
      tenant_id: tenantId 
    });
  }

  updateLicenseUsage(organizationId: string, resourceType: string, current: number, limit: number) {
    this.licenseUsage.set(
      { organization_id: organizationId, resource_type: resourceType, limit_type: 'current' },
      current
    );
    this.licenseUsage.set(
      { organization_id: organizationId, resource_type: resourceType, limit_type: 'maximum' },
      limit
    );
  }

  updateSubscriptionStatus(organizationId: string, plan: string, daysUntilExpiry: number) {
    this.subscriptionStatus.set(
      { organization_id: organizationId, plan, days_until_expiry: daysUntilExpiry.toString() },
      daysUntilExpiry
    );
  }

  recordMultiTenantQuery(queryType: string, tenantId: string, organizationId: string, duration: number) {
    this.multiTenantQueries.observe(
      { query_type: queryType, tenant_id: tenantId, organization_id: organizationId },
      duration
    );
  }

  // Bangladesh-specific metrics
  recordComplianceCheck(complianceType: string, result: boolean) {
    const complianceCounter = new client.Counter({
      name: 'bangladesh_compliance_checks_total',
      help: 'Total number of Bangladesh compliance checks',
      labelNames: ['type', 'result'],
    });
    
    if (!this.register.getSingleMetric('bangladesh_compliance_checks_total')) {
      this.register.registerMetric(complianceCounter);
    }
    
    complianceCounter.inc({ type: complianceType, result: result ? 'pass' : 'fail' });
  }

  recordTinBinValidation(validationType: string, isValid: boolean) {
    const validationCounter = new client.Counter({
      name: 'tin_bin_validations_total',
      help: 'Total number of TIN/BIN validations',
      labelNames: ['type', 'valid'],
    });
    
    if (!this.register.getSingleMetric('tin_bin_validations_total')) {
      this.register.registerMetric(validationCounter);
    }
    
    validationCounter.inc({ type: validationType, valid: isValid ? 'yes' : 'no' });
  }
}