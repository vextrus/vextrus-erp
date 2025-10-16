import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EngineService, RuleDefinition } from './engine.service';
import { CacheService } from './cache.service';

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);
  private rules: Map<string, RuleDefinition> = new Map();

  constructor(
    private readonly engineService: EngineService,
    private readonly cacheService: CacheService,
  ) {}

  async createRule(tenantId: string, rule: RuleDefinition): Promise<RuleDefinition> {
    const ruleId = `${tenantId}-${rule.id}`;
    rule.id = ruleId;
    
    this.rules.set(ruleId, rule);
    
    // Add to appropriate engine
    const engineId = `${tenantId}-default`;
    this.engineService.addRule(engineId, rule);
    
    // Cache the rule
    await this.cacheService.set(`rule:${ruleId}`, rule, 3600);
    
    this.logger.log(`Created rule ${ruleId} for tenant ${tenantId}`);
    return rule;
  }

  async getRule(tenantId: string, ruleId: string): Promise<RuleDefinition> {
    const fullRuleId = `${tenantId}-${ruleId}`;
    
    // Check cache first
    const cached = await this.cacheService.get<RuleDefinition>(`rule:${fullRuleId}`);
    if (cached) {
      return cached;
    }
    
    const rule = this.rules.get(fullRuleId);
    if (!rule) {
      throw new NotFoundException(`Rule ${ruleId} not found`);
    }
    
    // Update cache
    await this.cacheService.set(`rule:${fullRuleId}`, rule, 3600);
    
    return rule;
  }

  async updateRule(tenantId: string, ruleId: string, updates: Partial<RuleDefinition>): Promise<RuleDefinition> {
    const fullRuleId = `${tenantId}-${ruleId}`;
    const existing = await this.getRule(tenantId, ruleId);
    
    const updated = { ...existing, ...updates, id: fullRuleId };
    this.rules.set(fullRuleId, updated);
    
    // Update in engine
    const engineId = `${tenantId}-default`;
    this.engineService.removeRule(engineId, existing.name);
    this.engineService.addRule(engineId, updated);
    
    // Update cache
    await this.cacheService.set(`rule:${fullRuleId}`, updated, 3600);
    await this.cacheService.delete(`rule-list:${tenantId}`);
    
    this.logger.log(`Updated rule ${fullRuleId}`);
    return updated;
  }

  async deleteRule(tenantId: string, ruleId: string): Promise<void> {
    const fullRuleId = `${tenantId}-${ruleId}`;
    const rule = await this.getRule(tenantId, ruleId);
    
    this.rules.delete(fullRuleId);
    
    // Remove from engine
    const engineId = `${tenantId}-default`;
    this.engineService.removeRule(engineId, rule.name);
    
    // Clear cache
    await this.cacheService.delete(`rule:${fullRuleId}`);
    await this.cacheService.delete(`rule-list:${tenantId}`);
    
    this.logger.log(`Deleted rule ${fullRuleId}`);
  }

  async listRules(tenantId: string): Promise<RuleDefinition[]> {
    // Check cache first
    const cacheKey = `rule-list:${tenantId}`;
    const cached = await this.cacheService.get<RuleDefinition[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    const tenantRules: RuleDefinition[] = [];
    for (const [id, rule] of this.rules) {
      if (id.startsWith(`${tenantId}-`)) {
        tenantRules.push(rule);
      }
    }
    
    // Cache the list
    await this.cacheService.set(cacheKey, tenantRules, 300);
    
    return tenantRules;
  }

  async evaluateRules(tenantId: string, facts: any, engineId?: string): Promise<any> {
    const engine = engineId || `${tenantId}-default`;
    return this.engineService.evaluate(engine, facts);
  }

  async testRule(tenantId: string, rule: RuleDefinition, facts: any): Promise<any> {
    // Create a temporary engine for testing
    const testEngineId = `${tenantId}-test-${Date.now()}`;
    
    try {
      this.engineService.createEngine(testEngineId);
      this.engineService.addRule(testEngineId, rule);
      
      const result = await this.engineService.evaluate(testEngineId, facts);
      
      return {
        success: result.success,
        triggered: result.events.length > 0,
        events: result.events,
        executionTime: result.executionTime,
      };
    } finally {
      // Clean up test engine
      this.engineService.deleteEngine(testEngineId);
    }
  }

  async enableRule(tenantId: string, ruleId: string): Promise<RuleDefinition> {
    return this.updateRule(tenantId, ruleId, { enabled: true });
  }

  async disableRule(tenantId: string, ruleId: string): Promise<RuleDefinition> {
    const rule = await this.updateRule(tenantId, ruleId, { enabled: false });
    
    // Remove from engine when disabled
    const engineId = `${tenantId}-default`;
    this.engineService.removeRule(engineId, rule.name);
    
    return rule;
  }

  async getRuleStatistics(tenantId: string): Promise<any> {
    const rules = await this.listRules(tenantId);
    const engineId = `${tenantId}-default`;
    const engineStats = this.engineService.getEngineStats(engineId);
    
    return {
      totalRules: rules.length,
      enabledRules: rules.filter(r => r.enabled !== false).length,
      disabledRules: rules.filter(r => r.enabled === false).length,
      engineStats,
      rulesByPriority: this.groupRulesByPriority(rules),
    };
  }

  private groupRulesByPriority(rules: RuleDefinition[]): Record<string, number> {
    const groups: Record<string, number> = {
      high: 0,
      medium: 0,
      low: 0,
      default: 0,
    };

    rules.forEach(rule => {
      const priority = rule.priority || 0;
      if (priority >= 80) groups.high++;
      else if (priority >= 50) groups.medium++;
      else if (priority > 0) groups.low++;
      else groups.default++;
    });

    return groups;
  }

  // GraphQL resolver compatibility methods
  async findAll(tenantId: string, filters?: any) {
    const rules = await this.listRules(tenantId);
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const start = (page - 1) * limit;
    const items = rules.slice(start, start + limit).map(rule => this.toRuleResponse(rule));

    return {
      items,
      total: rules.length,
      page,
      limit,
      totalPages: Math.ceil(rules.length / limit),
    };
  }

  async findOne(tenantId: string, ruleId: string) {
    const rule = await this.getRule(tenantId, ruleId);
    return this.toRuleResponse(rule);
  }

  async findByCategory(tenantId: string, category: string) {
    const rules = await this.listRules(tenantId);
    return rules.filter(rule => (rule as any).category === category).map(rule => this.toRuleResponse(rule));
  }

  async findByEntity(tenantId: string, entityType: string) {
    const rules = await this.listRules(tenantId);
    return rules.filter(rule => (rule as any).entityType === entityType).map(rule => this.toRuleResponse(rule));
  }

  async create(tenantId: string, data: any) {
    const rule: RuleDefinition = {
      id: data.id || `rule-${Date.now()}`,
      name: data.name,
      description: data.description,
      enabled: data.enabled !== false,
      priority: data.priority || 50,
      conditions: data.conditions || {},
      event: data.event || {},
      ...data,
    };
    const created = await this.createRule(tenantId, rule);
    return this.toRuleResponse(created);
  }

  async update(tenantId: string, ruleId: string, data: any) {
    const updated = await this.updateRule(tenantId, ruleId, data);
    return this.toRuleResponse(updated);
  }

  async delete(tenantId: string, ruleId: string) {
    await this.deleteRule(tenantId, ruleId);
    return true;
  }

  async remove(tenantId: string, ruleId: string) {
    return this.delete(tenantId, ruleId);
  }

  async getApplicableRules(tenantId: string, entityType: string, action: string) {
    const rules = await this.listRules(tenantId);
    return rules
      .filter(rule => {
        const ruleEntityType = (rule as any).entityType;
        const ruleAction = (rule as any).action;
        return (
          (!ruleEntityType || ruleEntityType === entityType || ruleEntityType === 'general') &&
          (!ruleAction || ruleAction === action || ruleAction === '*')
        );
      })
      .map(rule => this.toRuleResponse(rule));
  }

  async activate(tenantId: string, ruleId: string) {
    const rule = await this.enableRule(tenantId, ruleId);
    return this.toRuleResponse(rule);
  }

  async deactivate(tenantId: string, ruleId: string) {
    const rule = await this.disableRule(tenantId, ruleId);
    return this.toRuleResponse(rule);
  }

  async evaluate(tenantId: string, ruleId: string, context?: any) {
    const rule = await this.getRule(tenantId, ruleId);
    const result = await this.evaluateRules(tenantId, context, ruleId);
    const now = new Date();
    return {
      success: result.success,
      passed: result.events && result.events.length > 0,
      message: null,
      errors: result.errors ? JSON.stringify(result.errors) : null,
      warnings: null,
      result: JSON.stringify(result),
      appliedRules: JSON.stringify([ruleId]),
      failedRules: result.success ? null : JSON.stringify([ruleId]),
      actions: result.events ? JSON.stringify(result.events) : null,
      executionTime: result.executionTime || 0,
      timestamp: now,
      context: context ? JSON.stringify(context) : null,
      metadata: null,
    };
  }

  private toRuleResponse(rule: RuleDefinition): any {
    const now = new Date();
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description || null,
      category: (rule as any).category || 'default',
      entityType: (rule as any).entityType || 'general',
      action: (rule as any).action || null,
      expression: (rule as any).expression || JSON.stringify(rule.conditions),
      conditions: JSON.stringify(rule.conditions || {}),
      actions: JSON.stringify(rule.event || {}),
      priority: rule.priority || 50,
      status: rule.enabled ? 'active' : 'inactive',
      operator: (rule as any).operator || 'and',
      severity: (rule as any).severity || 'medium',
      errorMessage: (rule as any).errorMessage || null,
      successMessage: (rule as any).successMessage || null,
      isSystemRule: (rule as any).isSystemRule || false,
      isActive: rule.enabled !== false,
      requiresApproval: (rule as any).requiresApproval || false,
      metadata: JSON.stringify((rule as any).metadata || {}),
      tags: (rule as any).tags || null,
      createdAt: (rule as any).createdAt || now,
      updatedAt: (rule as any).updatedAt || now,
      createdBy: (rule as any).createdBy || null,
      updatedBy: (rule as any).updatedBy || null,
      executionCount: (rule as any).executionCount || 0,
      successCount: (rule as any).successCount || 0,
      failureCount: (rule as any).failureCount || 0,
      lastExecutedAt: (rule as any).lastExecutedAt || null,
      averageExecutionTime: (rule as any).averageExecutionTime || 0,
    };
  }
}