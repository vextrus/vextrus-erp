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
