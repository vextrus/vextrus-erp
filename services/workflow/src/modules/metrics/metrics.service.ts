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
