import { Injectable, Logger } from '@nestjs/common';
import { EngineService } from './engine.service';
import { RulesService } from './rules.service';
import { RuleSetService } from './rule-set.service';

export interface EvaluationRequest {
  facts: any;
  ruleSetId?: string;
  ruleIds?: string[];
  engineId?: string;
  includeTrace?: boolean;
}

export interface EvaluationHistory {
  id: string;
  tenantId: string;
  timestamp: Date;
  request: EvaluationRequest;
  result: any;
  executionTime: number;
}

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);
  private evaluationHistory: EvaluationHistory[] = [];

  constructor(
    private readonly engineService: EngineService,
    private readonly rulesService: RulesService,
    private readonly ruleSetService: RuleSetService,
  ) {}

  async evaluate(tenantId: string, request: EvaluationRequest): Promise<any> {
    const startTime = Date.now();
    let result: any;

    try {
      if (request.ruleSetId) {
        // Evaluate using a rule set
        result = await this.ruleSetService.evaluateRuleSet(tenantId, request.ruleSetId, request.facts);
      } else if (request.ruleIds && request.ruleIds.length > 0) {
        // Create temporary engine with specific rules
        const tempEngineId = `${tenantId}-eval-${Date.now()}`;
        this.engineService.createEngine(tempEngineId);

        try {
          for (const ruleId of request.ruleIds) {
            const rule = await this.rulesService.getRule(tenantId, ruleId);
            this.engineService.addRule(tempEngineId, rule);
          }

          result = await this.engineService.evaluate(tempEngineId, request.facts);
        } finally {
          this.engineService.deleteEngine(tempEngineId);
        }
      } else {
        // Use default tenant engine
        const engineId = request.engineId || `${tenantId}-default`;
        result = await this.engineService.evaluate(engineId, request.facts);
      }

      const executionTime = Date.now() - startTime;

      // Store in history
      const historyEntry: EvaluationHistory = {
        id: `eval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tenantId,
        timestamp: new Date(),
        request,
        result,
        executionTime,
      };

      this.evaluationHistory.push(historyEntry);
      
      // Keep only last 1000 entries per tenant
      this.pruneHistory(tenantId);

      this.logger.log(`Evaluation completed for tenant ${tenantId} in ${executionTime}ms`);

      return {
        ...result,
        evaluationId: historyEntry.id,
        executionTime,
      };
    } catch (error) {
      this.logger.error(`Evaluation failed for tenant ${tenantId}`, error);
      throw error;
    }
  }

  async batchEvaluate(tenantId: string, requests: EvaluationRequest[]): Promise<any[]> {
    const results = await Promise.all(
      requests.map(request => this.evaluate(tenantId, request))
    );

    return results;
  }

  async getEvaluationHistory(tenantId: string, limit: number = 100): Promise<EvaluationHistory[]> {
    return this.evaluationHistory
      .filter(h => h.tenantId === tenantId)
      .slice(-limit)
      .reverse();
  }

  async getEvaluation(tenantId: string, evaluationId: string): Promise<EvaluationHistory | null> {
    return this.evaluationHistory.find(
      h => h.tenantId === tenantId && h.id === evaluationId
    ) || null;
  }

  async explainEvaluation(tenantId: string, request: EvaluationRequest): Promise<any> {
    // Create a detailed explanation of how rules would be evaluated
    const explanation = {
      facts: request.facts,
      applicableRules: [],
      evaluationPath: [],
      expectedOutcome: null,
    };

    if (request.ruleSetId) {
      const ruleSet = await this.ruleSetService.getRuleSet(tenantId, request.ruleSetId);
      for (const ruleId of ruleSet.rules) {
        const rule = await this.rulesService.getRule(tenantId, ruleId);
        explanation.applicableRules.push({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          conditions: rule.conditions,
          event: rule.event,
        });
      }
    }

    // Perform dry run
    const result = await this.evaluate(tenantId, { ...request, includeTrace: true });
    explanation.expectedOutcome = result;

    return explanation;
  }

  async compareEvaluations(
    tenantId: string,
    facts: any,
    scenarios: Array<{ name: string; overrides: any }>
  ): Promise<any> {
    const results = [];

    for (const scenario of scenarios) {
      const scenarioFacts = { ...facts, ...scenario.overrides };
      const result = await this.evaluate(tenantId, { facts: scenarioFacts });
      
      results.push({
        scenario: scenario.name,
        facts: scenarioFacts,
        result,
      });
    }

    return {
      baseFacts: facts,
      scenarios: results,
      summary: this.summarizeComparison(results),
    };
  }

  private summarizeComparison(results: any[]): any {
    const summary = {
      totalScenarios: results.length,
      triggeredEvents: new Set(),
      commonEvents: [],
      differentOutcomes: false,
    };

    results.forEach(r => {
      r.result.events.forEach(e => summary.triggeredEvents.add(e.type));
    });

    // Check for common events across all scenarios
    const allEvents = results.map(r => r.result.events.map(e => e.type));
    if (allEvents.length > 0) {
      summary.commonEvents = allEvents[0].filter(e => 
        allEvents.every(events => events.includes(e))
      );
    }

    // Check if outcomes differ
    const firstOutcome = JSON.stringify(results[0]?.result.events);
    summary.differentOutcomes = results.some(r => 
      JSON.stringify(r.result.events) !== firstOutcome
    );

    return summary;
  }

  private pruneHistory(tenantId: string): void {
    const tenantHistory = this.evaluationHistory.filter(h => h.tenantId === tenantId);
    if (tenantHistory.length > 1000) {
      const toRemove = tenantHistory.length - 1000;
      const removeIds = tenantHistory.slice(0, toRemove).map(h => h.id);
      this.evaluationHistory = this.evaluationHistory.filter(h => !removeIds.includes(h.id));
    }
  }

  async getStatistics(tenantId: string): Promise<any> {
    const tenantHistory = this.evaluationHistory.filter(h => h.tenantId === tenantId);
    
    if (tenantHistory.length === 0) {
      return {
        totalEvaluations: 0,
        averageExecutionTime: 0,
        successRate: 0,
        mostTriggeredEvents: [],
      };
    }

    const totalExecutionTime = tenantHistory.reduce((sum, h) => sum + h.executionTime, 0);
    const successfulEvaluations = tenantHistory.filter(h => h.result.success).length;
    
    // Count event occurrences
    const eventCounts = new Map<string, number>();
    tenantHistory.forEach(h => {
      h.result.events?.forEach(e => {
        const count = eventCounts.get(e.type) || 0;
        eventCounts.set(e.type, count + 1);
      });
    });

    const mostTriggeredEvents = Array.from(eventCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([event, count]) => ({ event, count }));

    return {
      totalEvaluations: tenantHistory.length,
      averageExecutionTime: totalExecutionTime / tenantHistory.length,
      successRate: (successfulEvaluations / tenantHistory.length) * 100,
      mostTriggeredEvents,
      recentEvaluations: tenantHistory.slice(-10).map(h => ({
        id: h.id,
        timestamp: h.timestamp,
        executionTime: h.executionTime,
        success: h.result.success,
        eventCount: h.result.events?.length || 0,
      })),
    };
  }
}