import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EngineService, RuleDefinition } from './engine.service';
import { RulesService } from './rules.service';

export interface RuleSet {
  id: string;
  name: string;
  description?: string;
  rules: string[]; // Array of rule IDs
  enabled: boolean;
  priority?: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class RuleSetService {
  private readonly logger = new Logger(RuleSetService.name);
  private ruleSets: Map<string, RuleSet> = new Map();

  constructor(
    private readonly engineService: EngineService,
    private readonly rulesService: RulesService,
  ) {}

  async createRuleSet(tenantId: string, ruleSet: Omit<RuleSet, 'id'>): Promise<RuleSet> {
    const ruleSetId = `${tenantId}-ruleset-${Date.now()}`;
    const newRuleSet: RuleSet = {
      ...ruleSet,
      id: ruleSetId,
      enabled: ruleSet.enabled !== false,
    };

    this.ruleSets.set(ruleSetId, newRuleSet);

    // Create a dedicated engine for this rule set
    const engineId = `ruleset-${ruleSetId}`;
    this.engineService.createEngine(engineId);

    // Add all rules to the engine
    for (const ruleId of ruleSet.rules) {
      const rule = await this.rulesService.getRule(tenantId, ruleId);
      this.engineService.addRule(engineId, rule);
    }

    this.logger.log(`Created rule set ${ruleSetId} for tenant ${tenantId}`);
    return newRuleSet;
  }

  async getRuleSet(tenantId: string, ruleSetId: string): Promise<RuleSet> {
    const fullRuleSetId = ruleSetId.startsWith(`${tenantId}-`) ? ruleSetId : `${tenantId}-${ruleSetId}`;
    const ruleSet = this.ruleSets.get(fullRuleSetId);
    
    if (!ruleSet) {
      throw new NotFoundException(`Rule set ${ruleSetId} not found`);
    }

    return ruleSet;
  }

  async updateRuleSet(tenantId: string, ruleSetId: string, updates: Partial<RuleSet>): Promise<RuleSet> {
    const ruleSet = await this.getRuleSet(tenantId, ruleSetId);
    const updated = { ...ruleSet, ...updates };
    
    this.ruleSets.set(ruleSet.id, updated);

    // If rules have changed, update the engine
    if (updates.rules) {
      const engineId = `ruleset-${ruleSet.id}`;
      this.engineService.clearEngine(engineId);
      
      for (const ruleId of updated.rules) {
        const rule = await this.rulesService.getRule(tenantId, ruleId);
        this.engineService.addRule(engineId, rule);
      }
    }

    this.logger.log(`Updated rule set ${ruleSet.id}`);
    return updated;
  }

  async deleteRuleSet(tenantId: string, ruleSetId: string): Promise<void> {
    const ruleSet = await this.getRuleSet(tenantId, ruleSetId);
    
    this.ruleSets.delete(ruleSet.id);
    
    // Delete the associated engine
    const engineId = `ruleset-${ruleSet.id}`;
    this.engineService.deleteEngine(engineId);
    
    this.logger.log(`Deleted rule set ${ruleSet.id}`);
  }

  async listRuleSets(tenantId: string): Promise<RuleSet[]> {
    const tenantRuleSets: RuleSet[] = [];
    
    for (const [id, ruleSet] of this.ruleSets) {
      if (id.startsWith(`${tenantId}-`)) {
        tenantRuleSets.push(ruleSet);
      }
    }

    return tenantRuleSets;
  }

  async addRuleToSet(tenantId: string, ruleSetId: string, ruleId: string): Promise<RuleSet> {
    const ruleSet = await this.getRuleSet(tenantId, ruleSetId);
    
    if (!ruleSet.rules.includes(ruleId)) {
      ruleSet.rules.push(ruleId);
      this.ruleSets.set(ruleSet.id, ruleSet);

      // Add rule to engine
      const rule = await this.rulesService.getRule(tenantId, ruleId);
      const engineId = `ruleset-${ruleSet.id}`;
      this.engineService.addRule(engineId, rule);
    }

    return ruleSet;
  }

  async removeRuleFromSet(tenantId: string, ruleSetId: string, ruleId: string): Promise<RuleSet> {
    const ruleSet = await this.getRuleSet(tenantId, ruleSetId);
    
    const index = ruleSet.rules.indexOf(ruleId);
    if (index > -1) {
      ruleSet.rules.splice(index, 1);
      this.ruleSets.set(ruleSet.id, ruleSet);

      // Remove rule from engine
      const rule = await this.rulesService.getRule(tenantId, ruleId);
      const engineId = `ruleset-${ruleSet.id}`;
      this.engineService.removeRule(engineId, rule.name);
    }

    return ruleSet;
  }

  async evaluateRuleSet(tenantId: string, ruleSetId: string, facts: any): Promise<any> {
    const ruleSet = await this.getRuleSet(tenantId, ruleSetId);
    
    if (!ruleSet.enabled) {
      return {
        success: false,
        message: 'Rule set is disabled',
        events: [],
      };
    }

    const engineId = `ruleset-${ruleSet.id}`;
    return this.engineService.evaluate(engineId, facts);
  }

  async enableRuleSet(tenantId: string, ruleSetId: string): Promise<RuleSet> {
    return this.updateRuleSet(tenantId, ruleSetId, { enabled: true });
  }

  async disableRuleSet(tenantId: string, ruleSetId: string): Promise<RuleSet> {
    return this.updateRuleSet(tenantId, ruleSetId, { enabled: false });
  }

  async cloneRuleSet(tenantId: string, ruleSetId: string, newName: string): Promise<RuleSet> {
    const original = await this.getRuleSet(tenantId, ruleSetId);
    
    return this.createRuleSet(tenantId, {
      name: newName,
      description: `Clone of ${original.name}`,
      rules: [...original.rules],
      enabled: false, // Start disabled
      priority: original.priority,
      metadata: {
        ...original.metadata,
        clonedFrom: original.id,
        clonedAt: new Date(),
      },
    });
  }
}