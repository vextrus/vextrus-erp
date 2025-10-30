import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, TenantContext, CurrentTenant } from '../auth';
import { RulesService } from '../services/rules.service';
import { RuleDefinition } from '../services/engine.service';

@ApiTags('Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new rule' })
  @ApiResponse({ status: 201, description: 'Rule created successfully' })
  async createRule(
    @CurrentTenant() tenant: TenantContext,
    @Body() rule: RuleDefinition,
  ) {
    return this.rulesService.createRule(tenant.id, rule);
  }

  @Get()
  @ApiOperation({ summary: 'List all rules' })
  @ApiResponse({ status: 200, description: 'List of rules' })
  async listRules(
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.rulesService.listRules(tenant.id);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get rule statistics' })
  @ApiResponse({ status: 200, description: 'Rule statistics' })
  async getRuleStatistics(
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.rulesService.getRuleStatistics(tenant.id);
  }

  @Get(':ruleId')
  @ApiOperation({ summary: 'Get rule by ID' })
  @ApiResponse({ status: 200, description: 'Rule found' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  async getRule(
    @CurrentTenant() tenant: TenantContext,
    @Param('ruleId') ruleId: string,
  ) {
    return this.rulesService.getRule(tenant.id, ruleId);
  }

  @Put(':ruleId')
  @ApiOperation({ summary: 'Update rule' })
  @ApiResponse({ status: 200, description: 'Rule updated successfully' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  async updateRule(
    @CurrentTenant() tenant: TenantContext,
    @Param('ruleId') ruleId: string,
    @Body() updates: Partial<RuleDefinition>,
  ) {
    return this.rulesService.updateRule(tenant.id, ruleId, updates);
  }

  @Delete(':ruleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete rule' })
  @ApiResponse({ status: 204, description: 'Rule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  async deleteRule(
    @CurrentTenant() tenant: TenantContext,
    @Param('ruleId') ruleId: string,
  ) {
    await this.rulesService.deleteRule(tenant.id, ruleId);
  }

  @Post(':ruleId/test')
  @ApiOperation({ summary: 'Test rule with sample facts' })
  @ApiResponse({ status: 200, description: 'Test results' })
  async testRule(
    @CurrentTenant() tenant: TenantContext,
    @Param('ruleId') ruleId: string,
    @Body() data: { facts: any },
  ) {
    const rule = await this.rulesService.getRule(tenant.id, ruleId);
    return this.rulesService.testRule(tenant.id, rule, data.facts);
  }

  @Put(':ruleId/enable')
  @ApiOperation({ summary: 'Enable rule' })
  @ApiResponse({ status: 200, description: 'Rule enabled' })
  async enableRule(
    @CurrentTenant() tenant: TenantContext,
    @Param('ruleId') ruleId: string,
  ) {
    return this.rulesService.enableRule(tenant.id, ruleId);
  }

  @Put(':ruleId/disable')
  @ApiOperation({ summary: 'Disable rule' })
  @ApiResponse({ status: 200, description: 'Rule disabled' })
  async disableRule(
    @CurrentTenant() tenant: TenantContext,
    @Param('ruleId') ruleId: string,
  ) {
    return this.rulesService.disableRule(tenant.id, ruleId);
  }

  @Post('evaluate')
  @ApiOperation({ summary: 'Evaluate facts against rules' })
  @ApiResponse({ status: 200, description: 'Evaluation results' })
  async evaluateRules(
    @CurrentTenant() tenant: TenantContext,
    @Body() data: { facts: any; engineId?: string },
  ) {
    return this.rulesService.evaluateRules(tenant.id, data.facts, data.engineId);
  }
}