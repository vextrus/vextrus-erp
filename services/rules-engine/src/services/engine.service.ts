import { Injectable, Logger } from '@nestjs/common';
import { Engine, Rule, RuleProperties } from 'json-rules-engine';

export interface RuleDefinition {
  id: string;
  name: string;
  description?: string;
  conditions: any;
  event: any;
  priority?: number;
  enabled?: boolean;
}

export interface EvaluationResult {
  success: boolean;
  events: any[];
  facts: any;
  errors?: string[];
  executionTime: number;
}

@Injectable()
export class EngineService {
  private readonly logger = new Logger(EngineService.name);
  private engines: Map<string, Engine> = new Map();
  private engineRules: Map<string, Rule[]> = new Map();

  createEngine(engineId: string): Engine {
    const engine = new Engine();
    this.engines.set(engineId, engine);
    this.engineRules.set(engineId, []);
    return engine;
  }

  getEngine(engineId: string): Engine | undefined {
    return this.engines.get(engineId);
  }

  getOrCreateEngine(engineId: string): Engine {
    let engine = this.engines.get(engineId);
    if (!engine) {
      engine = this.createEngine(engineId);
    }
    return engine;
  }

  addRule(engineId: string, rule: RuleDefinition): void {
    const engine = this.getOrCreateEngine(engineId);
    
    const ruleProperties: RuleProperties = {
      conditions: rule.conditions,
      event: rule.event,
      priority: rule.priority,
      name: rule.name,
    };

    const ruleInstance = new Rule(ruleProperties);
    engine.addRule(ruleProperties);
    
    // Track the rule manually
    const rules = this.engineRules.get(engineId) || [];
    rules.push(ruleInstance);
    this.engineRules.set(engineId, rules);
    
    this.logger.log(`Added rule ${rule.name} to engine ${engineId}`);
  }

  removeRule(engineId: string, ruleName: string): boolean {
    const engine = this.getEngine(engineId);
    if (!engine) {
      return false;
    }

    const rules = this.engineRules.get(engineId) || [];
    const ruleIndex = rules.findIndex(r => r.name === ruleName);
    if (ruleIndex >= 0) {
      const rule = rules[ruleIndex];
      engine.removeRule(rule.name);
      rules.splice(ruleIndex, 1);
      this.engineRules.set(engineId, rules);
      this.logger.log(`Removed rule ${ruleName} from engine ${engineId}`);
      return true;
    }
    return false;
  }

  async evaluate(engineId: string, facts: any): Promise<EvaluationResult> {
    const startTime = Date.now();
    const engine = this.getEngine(engineId);
    
    if (!engine) {
      return {
        success: false,
        events: [],
        facts,
        errors: [`Engine ${engineId} not found`],
        executionTime: Date.now() - startTime,
      };
    }

    try {
      const result = await engine.run(facts);
      
      return {
        success: true,
        events: result.events,
        facts: facts, // Use original facts since almanac doesn't expose factMap
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`Error evaluating rules in engine ${engineId}`, error);
      return {
        success: false,
        events: [],
        facts,
        errors: [error.message],
        executionTime: Date.now() - startTime,
      };
    }
  }

  clearEngine(engineId: string): void {
    const engine = this.getEngine(engineId);
    if (engine) {
      // Remove all rules
      const rules = this.engineRules.get(engineId) || [];
      rules.forEach(rule => engine.removeRule(rule.name));
      this.engineRules.set(engineId, []);
      this.logger.log(`Cleared all rules from engine ${engineId}`);
    }
  }

  deleteEngine(engineId: string): boolean {
    this.engineRules.delete(engineId);
    return this.engines.delete(engineId);
  }

  // Add custom operators
  addOperator(engineId: string, name: string, evaluator: (factValue: any, jsonValue: any) => boolean): void {
    const engine = this.getOrCreateEngine(engineId);
    engine.addOperator(name, evaluator);
    this.logger.log(`Added custom operator ${name} to engine ${engineId}`);
  }

  // Add facts dynamically
  addFact(engineId: string, name: string, value: any | ((params: any) => any), options?: any): void {
    const engine = this.getOrCreateEngine(engineId);
    engine.addFact(name, value, options);
    this.logger.log(`Added fact ${name} to engine ${engineId}`);
  }

  // Get all rules in an engine
  getRules(engineId: string): Rule[] {
    return this.engineRules.get(engineId) || [];
  }

  // Get engine statistics
  getEngineStats(engineId: string): any {
    const engine = this.getEngine(engineId);
    if (!engine) {
      return null;
    }

    const rules = this.engineRules.get(engineId) || [];
    return {
      engineId,
      ruleCount: rules.length,
      rules: rules.map(r => ({
        name: r.name,
        priority: r.priority,
      })),
    };
  }
}