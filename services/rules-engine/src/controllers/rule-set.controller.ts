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
import { RuleSetService, RuleSet } from '../services/rule-set.service';

@ApiTags('Rule Sets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rule-sets')
export class RuleSetController {
  constructor(private readonly ruleSetService: RuleSetService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new rule set' })
  @ApiResponse({ status: 201, description: 'Rule set created successfully' })
  async createRuleSet(
    @CurrentTenant() tenant: TenantContext,
    @Body() ruleSet: Omit<RuleSet, 'id'>,
  ) {
    return this.ruleSetService.createRuleSet(tenant.id, ruleSet);
  }

  @Get()
  @ApiOperation({ summary: 'List all rule sets' })
  @ApiResponse({ status: 200, description: 'List of rule sets' })
  async listRuleSets(
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.ruleSetService.listRuleSets(tenant.id);
  }

  @Get(':ruleSetId')
  @ApiOperation({ summary: 'Get rule set by ID' })
  @ApiResponse({ status: 200, description: 'Rule set found' })
  @ApiResponse({ status: 404, description: 'Rule set not found' })
  async getRuleSet(
    @CurrentTenant() tenant: TenantContext,
    @Param('ruleSetId') ruleSetId: string,
  ) {
    return this.ruleSetService.getRuleSet(tenant.id, ruleSetId);
  }

  @Put(':ruleSetId')
  @ApiOperation({ summary: 'Update rule set' })
  @ApiResponse({ status: 200, description: 'Rule set updated successfully' })
  @ApiResponse({ status: 404, description: 'Rule set not found' })
  async updateRuleSet(
    @CurrentTenant() tenant: TenantContext,
    @Param('ruleSetId') ruleSetId: string,
    @Body() updates: Partial<RuleSet>,
  ) {
    return this.ruleSetService.updateRuleSet(tenant.id, ruleSetId, updates);
  }

  @Delete(':ruleSetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete rule set' })
  @ApiResponse({ status: 204, description: 'Rule set deleted successfully' })
  @ApiResponse({ status: 404, description: 'Rule set not found' })
  async deleteRuleSet(
    @CurrentTenant() tenant: TenantContext,
    @Param('ruleSetId') ruleSetId: string,
  ) {
    await this.ruleSetService.deleteRuleSet(tenant.id, ruleSetId);
  }

  @Post(':ruleSetId/rules/:ruleId')
  @ApiOperation({ summary: 'Add rule to rule set' })
  @ApiResponse({ status: 200, description: 'Rule added to set' })
  async addRuleToSet(
    @CurrentTenant() tenant: TenantContext,
    @Param('ruleSetId') ruleSetId: string,
    @Param('ruleId') ruleId: string,
  ) {
    return this.ruleSetService.addRuleToSet(tenant.id, ruleSetId, ruleId);
  }

  @Delete(':ruleSetId/rules/:ruleId')
  @ApiOperation({ summary: 'Remove rule from rule set' })
  @ApiResponse({ status: 200, description: 'Rule removed from set' })
  async removeRuleFromSet(
    @CurrentTenant() tenant: TenantContext,
    @Param('ruleSetId') ruleSetId: string,
    @Param('ruleId') ruleId: string,
  ) {
    return this.ruleSetService.removeRuleFromSet(tenant.id, ruleSetId, ruleId);
  }

  @Post(':ruleSetId/evaluate')
  @ApiOperation({ summary: 'Evaluate facts against rule set' })
  @ApiResponse({ status: 200, description: 'Evaluation results' })
  async evaluateRuleSet(
    @CurrentTenant() tenant: TenantContext,
    @Param('ruleSetId') ruleSetId: string,
    @Body() data: { facts: any },
  ) {
    return this.ruleSetService.evaluateRuleSet(tenant.id, ruleSetId, data.facts);
  }

  @Put(':ruleSetId/enable')
  @ApiOperation({ summary: 'Enable rule set' })
  @ApiResponse({ status: 200, description: 'Rule set enabled' })
  async enableRuleSet(
    @CurrentTenant() tenant: TenantContext,
    @Param('ruleSetId') ruleSetId: string,
  ) {
    return this.ruleSetService.enableRuleSet(tenant.id, ruleSetId);
  }

  @Put(':ruleSetId/disable')
  @ApiOperation({ summary: 'Disable rule set' })
  @ApiResponse({ status: 200, description: 'Rule set disabled' })
  async disableRuleSet(
    @CurrentTenant() tenant: TenantContext,
    @Param('ruleSetId') ruleSetId: string,
  ) {
    return this.ruleSetService.disableRuleSet(tenant.id, ruleSetId);
  }

  @Post(':ruleSetId/clone')
  @ApiOperation({ summary: 'Clone rule set' })
  @ApiResponse({ status: 201, description: 'Rule set cloned successfully' })
  async cloneRuleSet(
    @CurrentTenant() tenant: TenantContext,
    @Param('ruleSetId') ruleSetId: string,
    @Body() data: { name: string },
  ) {
    return this.ruleSetService.cloneRuleSet(tenant.id, ruleSetId, data.name);
  }
}