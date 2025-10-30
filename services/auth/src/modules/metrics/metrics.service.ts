import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private register: client.Registry;

  // Generic HTTP metrics
  private httpRequestDuration: client.Histogram;
  private httpRequestTotal: client.Counter;

  // Auth-specific metrics
  private loginAttemptsTotal: client.Counter;
  private loginSuccessTotal: client.Counter;
  private loginFailureTotal: client.Counter;
  private tokenGenerationTotal: client.Counter;
  private tokenRefreshTotal: client.Counter;
  private activeSessionsGauge: client.Gauge;
  private sessionDuration: client.Histogram;
  private passwordResetTotal: client.Counter;
  private rbacCheckDuration: client.Histogram;
  private rbacCheckTotal: client.Counter;

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

    // Auth-specific metrics
    this.loginAttemptsTotal = new client.Counter({
      name: 'auth_login_attempts_total',
      help: 'Total number of login attempts',
      labelNames: ['type', 'tenant_id'],
    });

    this.loginSuccessTotal = new client.Counter({
      name: 'auth_login_success_total',
      help: 'Total number of successful logins',
      labelNames: ['type', 'tenant_id'],
    });

    this.loginFailureTotal = new client.Counter({
      name: 'auth_login_failure_total',
      help: 'Total number of failed logins',
      labelNames: ['reason', 'tenant_id'],
    });

    this.tokenGenerationTotal = new client.Counter({
      name: 'auth_token_generation_total',
      help: 'Total number of tokens generated',
      labelNames: ['type', 'tenant_id'],
    });

    this.tokenRefreshTotal = new client.Counter({
      name: 'auth_token_refresh_total',
      help: 'Total number of token refreshes',
      labelNames: ['status', 'tenant_id'],
    });

    this.activeSessionsGauge = new client.Gauge({
      name: 'auth_active_sessions',
      help: 'Number of active sessions',
      labelNames: ['tenant_id'],
    });

    this.sessionDuration = new client.Histogram({
      name: 'auth_session_duration_seconds',
      help: 'Duration of user sessions in seconds',
      labelNames: ['tenant_id'],
      buckets: [60, 300, 900, 1800, 3600, 7200, 14400, 28800],
    });

    this.passwordResetTotal = new client.Counter({
      name: 'auth_password_reset_total',
      help: 'Total number of password resets',
      labelNames: ['status', 'tenant_id'],
    });

    this.rbacCheckDuration = new client.Histogram({
      name: 'auth_rbac_check_duration_seconds',
      help: 'Duration of RBAC permission checks',
      labelNames: ['resource', 'action', 'result'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
    });

    this.rbacCheckTotal = new client.Counter({
      name: 'auth_rbac_checks_total',
      help: 'Total number of RBAC permission checks',
      labelNames: ['resource', 'action', 'result'],
    });

    // Register all metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.loginAttemptsTotal);
    this.register.registerMetric(this.loginSuccessTotal);
    this.register.registerMetric(this.loginFailureTotal);
    this.register.registerMetric(this.tokenGenerationTotal);
    this.register.registerMetric(this.tokenRefreshTotal);
    this.register.registerMetric(this.activeSessionsGauge);
    this.register.registerMetric(this.sessionDuration);
    this.register.registerMetric(this.passwordResetTotal);
    this.register.registerMetric(this.rbacCheckDuration);
    this.register.registerMetric(this.rbacCheckTotal);
  }

  onModuleInit() {
    // Initialize gauges
    this.activeSessionsGauge.set({ tenant_id: 'default' }, 0);
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  // Helper methods for tracking metrics
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestTotal.inc({ method, route, status_code: statusCode.toString() });
    this.httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
  }

  recordLoginAttempt(type: string, tenantId: string) {
    this.loginAttemptsTotal.inc({ type, tenant_id: tenantId });
  }

  recordLoginSuccess(type: string, tenantId: string) {
    this.loginSuccessTotal.inc({ type, tenant_id: tenantId });
  }

  recordLoginFailure(reason: string, tenantId: string) {
    this.loginFailureTotal.inc({ reason, tenant_id: tenantId });
  }

  recordTokenGeneration(type: string, tenantId: string) {
    this.tokenGenerationTotal.inc({ type, tenant_id: tenantId });
  }

  recordTokenRefresh(status: string, tenantId: string) {
    this.tokenRefreshTotal.inc({ status, tenant_id: tenantId });
  }

  updateActiveSessions(tenantId: string, count: number) {
    this.activeSessionsGauge.set({ tenant_id: tenantId }, count);
  }

  recordSessionDuration(tenantId: string, duration: number) {
    this.sessionDuration.observe({ tenant_id: tenantId }, duration);
  }

  recordPasswordReset(status: string, tenantId: string) {
    this.passwordResetTotal.inc({ status, tenant_id: tenantId });
  }

  recordRbacCheck(resource: string, action: string, result: string, duration: number) {
    this.rbacCheckTotal.inc({ resource, action, result });
    this.rbacCheckDuration.observe({ resource, action, result }, duration);
  }
}
