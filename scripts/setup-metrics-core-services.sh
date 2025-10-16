#!/bin/bash

# Script to add Prometheus metrics modules to core services
# Usage: ./setup-metrics-core-services.sh

set -e

echo "=== Adding Prometheus Metrics to Core Services ==="
echo "Date: $(date)"
echo ""

# Function to create metrics module for a service
create_metrics_module() {
    local SERVICE=$1
    local SERVICE_DIR="services/$SERVICE"

    echo "Processing $SERVICE..."

    # Create metrics module directory
    mkdir -p "$SERVICE_DIR/src/modules/metrics"

    # Create metrics service with service-specific metrics
    case "$SERVICE" in
        "auth")
            cat > "$SERVICE_DIR/src/modules/metrics/metrics.service.ts" << 'EOF'
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
EOF
            ;;

        "master-data")
            cat > "$SERVICE_DIR/src/modules/metrics/metrics.service.ts" << 'EOF'
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
EOF
            ;;

        "workflow")
            cat > "$SERVICE_DIR/src/modules/metrics/metrics.service.ts" << 'EOF'
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private register: client.Registry;

  // Generic HTTP metrics
  private httpRequestDuration: client.Histogram;
  private httpRequestTotal: client.Counter;

  // Workflow specific metrics
  private processStartTotal: client.Counter;
  private processCompletionTotal: client.Counter;
  private processFailureTotal: client.Counter;
  private processDuration: client.Histogram;
  private activeProcessesGauge: client.Gauge;
  private taskAssignmentTotal: client.Counter;
  private taskCompletionTotal: client.Counter;
  private taskDuration: client.Histogram;
  private slaBreachTotal: client.Counter;
  private transitionTotal: client.Counter;
  private parallelTasksGauge: client.Gauge;
  private workflowQueueSize: client.Gauge;

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

    // Workflow specific metrics
    this.processStartTotal = new client.Counter({
      name: 'workflow_process_start_total',
      help: 'Total number of workflow processes started',
      labelNames: ['workflow_type', 'tenant_id'],
    });

    this.processCompletionTotal = new client.Counter({
      name: 'workflow_process_completion_total',
      help: 'Total number of workflow processes completed',
      labelNames: ['workflow_type', 'status', 'tenant_id'],
    });

    this.processFailureTotal = new client.Counter({
      name: 'workflow_process_failure_total',
      help: 'Total number of workflow process failures',
      labelNames: ['workflow_type', 'failure_reason', 'tenant_id'],
    });

    this.processDuration = new client.Histogram({
      name: 'workflow_process_duration_seconds',
      help: 'Duration of workflow processes',
      labelNames: ['workflow_type', 'status'],
      buckets: [60, 300, 900, 1800, 3600, 7200, 14400, 28800, 86400],
    });

    this.activeProcessesGauge = new client.Gauge({
      name: 'workflow_active_processes',
      help: 'Number of currently active workflow processes',
      labelNames: ['workflow_type', 'tenant_id'],
    });

    this.taskAssignmentTotal = new client.Counter({
      name: 'workflow_task_assignment_total',
      help: 'Total number of task assignments',
      labelNames: ['task_type', 'assignee_type', 'tenant_id'],
    });

    this.taskCompletionTotal = new client.Counter({
      name: 'workflow_task_completion_total',
      help: 'Total number of task completions',
      labelNames: ['task_type', 'outcome', 'tenant_id'],
    });

    this.taskDuration = new client.Histogram({
      name: 'workflow_task_duration_seconds',
      help: 'Duration of workflow tasks',
      labelNames: ['task_type', 'outcome'],
      buckets: [60, 300, 900, 1800, 3600, 7200, 14400],
    });

    this.slaBreachTotal = new client.Counter({
      name: 'workflow_sla_breach_total',
      help: 'Total number of SLA breaches',
      labelNames: ['workflow_type', 'task_type', 'breach_type', 'tenant_id'],
    });

    this.transitionTotal = new client.Counter({
      name: 'workflow_transition_total',
      help: 'Total number of state transitions',
      labelNames: ['workflow_type', 'from_state', 'to_state'],
    });

    this.parallelTasksGauge = new client.Gauge({
      name: 'workflow_parallel_tasks',
      help: 'Number of tasks running in parallel',
      labelNames: ['workflow_type'],
    });

    this.workflowQueueSize = new client.Gauge({
      name: 'workflow_queue_size',
      help: 'Size of workflow task queue',
      labelNames: ['queue_type', 'priority'],
    });

    // Register all metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.processStartTotal);
    this.register.registerMetric(this.processCompletionTotal);
    this.register.registerMetric(this.processFailureTotal);
    this.register.registerMetric(this.processDuration);
    this.register.registerMetric(this.activeProcessesGauge);
    this.register.registerMetric(this.taskAssignmentTotal);
    this.register.registerMetric(this.taskCompletionTotal);
    this.register.registerMetric(this.taskDuration);
    this.register.registerMetric(this.slaBreachTotal);
    this.register.registerMetric(this.transitionTotal);
    this.register.registerMetric(this.parallelTasksGauge);
    this.register.registerMetric(this.workflowQueueSize);
  }

  onModuleInit() {
    // Initialize gauges
    this.activeProcessesGauge.set({ workflow_type: 'default', tenant_id: 'default' }, 0);
    this.parallelTasksGauge.set({ workflow_type: 'default' }, 0);
    this.workflowQueueSize.set({ queue_type: 'task', priority: 'normal' }, 0);
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  // Helper methods for tracking metrics
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestTotal.inc({ method, route, status_code: statusCode.toString() });
    this.httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
  }

  recordProcessStart(workflowType: string, tenantId: string) {
    this.processStartTotal.inc({ workflow_type: workflowType, tenant_id: tenantId });
  }

  recordProcessCompletion(workflowType: string, status: string, tenantId: string, duration: number) {
    this.processCompletionTotal.inc({ workflow_type: workflowType, status, tenant_id: tenantId });
    this.processDuration.observe({ workflow_type: workflowType, status }, duration);
  }

  recordProcessFailure(workflowType: string, reason: string, tenantId: string) {
    this.processFailureTotal.inc({ workflow_type: workflowType, failure_reason: reason, tenant_id: tenantId });
  }

  updateActiveProcesses(workflowType: string, tenantId: string, count: number) {
    this.activeProcessesGauge.set({ workflow_type: workflowType, tenant_id: tenantId }, count);
  }

  recordTaskAssignment(taskType: string, assigneeType: string, tenantId: string) {
    this.taskAssignmentTotal.inc({ task_type: taskType, assignee_type: assigneeType, tenant_id: tenantId });
  }

  recordTaskCompletion(taskType: string, outcome: string, tenantId: string, duration: number) {
    this.taskCompletionTotal.inc({ task_type: taskType, outcome, tenant_id: tenantId });
    this.taskDuration.observe({ task_type: taskType, outcome }, duration);
  }

  recordSlaBrech(workflowType: string, taskType: string, breachType: string, tenantId: string) {
    this.slaBreachTotal.inc({ workflow_type: workflowType, task_type: taskType, breach_type: breachType, tenant_id: tenantId });
  }

  recordTransition(workflowType: string, fromState: string, toState: string) {
    this.transitionTotal.inc({ workflow_type: workflowType, from_state: fromState, to_state: toState });
  }

  updateParallelTasks(workflowType: string, count: number) {
    this.parallelTasksGauge.set({ workflow_type: workflowType }, count);
  }

  updateQueueSize(queueType: string, priority: string, size: number) {
    this.workflowQueueSize.set({ queue_type: queueType, priority }, size);
  }
}
EOF
            ;;

        "rules-engine")
            cat > "$SERVICE_DIR/src/modules/metrics/metrics.service.ts" << 'EOF'
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private register: client.Registry;

  // Generic HTTP metrics
  private httpRequestDuration: client.Histogram;
  private httpRequestTotal: client.Counter;

  // Rules Engine specific metrics
  private ruleEvaluationTotal: client.Counter;
  private ruleEvaluationDuration: client.Histogram;
  private conditionCheckTotal: client.Counter;
  private actionExecutionTotal: client.Counter;
  private ruleMatchTotal: client.Counter;
  private ruleCacheHits: client.Counter;
  private ruleLoadTime: client.Histogram;
  private activeRulesGauge: client.Gauge;
  private ruleChainDepth: client.Histogram;
  private ruleConflictTotal: client.Counter;

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

    // Rules Engine specific metrics
    this.ruleEvaluationTotal = new client.Counter({
      name: 'rules_evaluation_total',
      help: 'Total number of rule evaluations',
      labelNames: ['rule_type', 'rule_set', 'tenant_id'],
    });

    this.ruleEvaluationDuration = new client.Histogram({
      name: 'rules_evaluation_duration_seconds',
      help: 'Duration of rule evaluations',
      labelNames: ['rule_type', 'rule_set', 'complexity'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
    });

    this.conditionCheckTotal = new client.Counter({
      name: 'rules_condition_check_total',
      help: 'Total number of condition checks',
      labelNames: ['condition_type', 'result'],
    });

    this.actionExecutionTotal = new client.Counter({
      name: 'rules_action_execution_total',
      help: 'Total number of rule actions executed',
      labelNames: ['action_type', 'status'],
    });

    this.ruleMatchTotal = new client.Counter({
      name: 'rules_match_total',
      help: 'Total number of rule matches',
      labelNames: ['rule_type', 'rule_set', 'matched'],
    });

    this.ruleCacheHits = new client.Counter({
      name: 'rules_cache_hits_total',
      help: 'Rule cache hit/miss rate',
      labelNames: ['cache_type', 'result'],
    });

    this.ruleLoadTime = new client.Histogram({
      name: 'rules_load_time_seconds',
      help: 'Time to load rules from storage',
      labelNames: ['source', 'rule_set'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    this.activeRulesGauge = new client.Gauge({
      name: 'rules_active_count',
      help: 'Number of active rules',
      labelNames: ['rule_type', 'rule_set', 'tenant_id'],
    });

    this.ruleChainDepth = new client.Histogram({
      name: 'rules_chain_depth',
      help: 'Depth of rule chains executed',
      labelNames: ['rule_set'],
      buckets: [1, 2, 3, 5, 10, 15, 20, 30],
    });

    this.ruleConflictTotal = new client.Counter({
      name: 'rules_conflict_total',
      help: 'Total number of rule conflicts detected',
      labelNames: ['rule_set', 'conflict_type'],
    });

    // Register all metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.ruleEvaluationTotal);
    this.register.registerMetric(this.ruleEvaluationDuration);
    this.register.registerMetric(this.conditionCheckTotal);
    this.register.registerMetric(this.actionExecutionTotal);
    this.register.registerMetric(this.ruleMatchTotal);
    this.register.registerMetric(this.ruleCacheHits);
    this.register.registerMetric(this.ruleLoadTime);
    this.register.registerMetric(this.activeRulesGauge);
    this.register.registerMetric(this.ruleChainDepth);
    this.register.registerMetric(this.ruleConflictTotal);
  }

  onModuleInit() {
    // Initialize gauges
    this.activeRulesGauge.set({ rule_type: 'business', rule_set: 'default', tenant_id: 'default' }, 0);
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  // Helper methods for tracking metrics
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestTotal.inc({ method, route, status_code: statusCode.toString() });
    this.httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
  }

  recordRuleEvaluation(ruleType: string, ruleSet: string, tenantId: string, duration: number, complexity: string) {
    this.ruleEvaluationTotal.inc({ rule_type: ruleType, rule_set: ruleSet, tenant_id: tenantId });
    this.ruleEvaluationDuration.observe({ rule_type: ruleType, rule_set: ruleSet, complexity }, duration);
  }

  recordConditionCheck(conditionType: string, result: boolean) {
    this.conditionCheckTotal.inc({ condition_type: conditionType, result: result ? 'true' : 'false' });
  }

  recordActionExecution(actionType: string, status: string) {
    this.actionExecutionTotal.inc({ action_type: actionType, status });
  }

  recordRuleMatch(ruleType: string, ruleSet: string, matched: boolean) {
    this.ruleMatchTotal.inc({ rule_type: ruleType, rule_set: ruleSet, matched: matched ? 'yes' : 'no' });
  }

  recordCacheAccess(cacheType: string, hit: boolean) {
    this.ruleCacheHits.inc({ cache_type: cacheType, result: hit ? 'hit' : 'miss' });
  }

  recordRuleLoadTime(source: string, ruleSet: string, duration: number) {
    this.ruleLoadTime.observe({ source, rule_set: ruleSet }, duration);
  }

  updateActiveRules(ruleType: string, ruleSet: string, tenantId: string, count: number) {
    this.activeRulesGauge.set({ rule_type: ruleType, rule_set: ruleSet, tenant_id: tenantId }, count);
  }

  recordRuleChainDepth(ruleSet: string, depth: number) {
    this.ruleChainDepth.observe({ rule_set: ruleSet }, depth);
  }

  recordRuleConflict(ruleSet: string, conflictType: string) {
    this.ruleConflictTotal.inc({ rule_set: ruleSet, conflict_type: conflictType });
  }
}
EOF
            ;;

        "api-gateway")
            cat > "$SERVICE_DIR/src/modules/metrics/metrics.service.ts" << 'EOF'
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
EOF
            ;;
    esac

    # Create metrics controller (same for all services)
    cat > "$SERVICE_DIR/src/modules/metrics/metrics.controller.ts" << 'EOF'
import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({ status: 200, description: 'Metrics in Prometheus format' })
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
EOF

    # Create metrics module (same for all services)
    cat > "$SERVICE_DIR/src/modules/metrics/metrics.module.ts" << 'EOF'
import { Module, Global } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
EOF

    echo "✅ Created metrics module for $SERVICE"
}

# Process all core services
SERVICES=("auth" "master-data" "workflow" "rules-engine" "api-gateway")

for SERVICE in "${SERVICES[@]}"; do
    create_metrics_module "$SERVICE"
done

echo ""
echo "=== Metrics Module Creation Complete ==="
echo ""
echo "Next steps:"
echo "1. Import MetricsModule in each service's app.module.ts"
echo "2. Test metrics endpoints: /metrics"
echo "3. Configure Prometheus to scrape metrics"
echo "4. Import MetricsService in service classes to record metrics"
echo ""
echo "Services updated:"
for SERVICE in "${SERVICES[@]}"; do
    echo "  - $SERVICE"
done
echo ""