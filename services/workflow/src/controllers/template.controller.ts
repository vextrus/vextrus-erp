import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, TenantContext, CurrentTenant } from '../auth';
import { TemplateService } from '../services/template.service';

@ApiTags('Workflow Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get()
  @ApiOperation({ summary: 'List workflow templates' })
  @ApiResponse({ status: 200, description: 'List of workflow templates' })
  async listTemplates(
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.templateService.findAll(tenant.id);
  }

  @Get(':templateId')
  @ApiOperation({ summary: 'Get template details' })
  @ApiResponse({ status: 200, description: 'Template details' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getTemplate(
    @CurrentTenant() tenant: TenantContext,
    @Param('templateId') templateId: string,
  ) {
    return this.templateService.findOne(tenant.id, templateId);
  }

  @Post()
  @ApiOperation({ summary: 'Create custom workflow template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createTemplate(
    @CurrentTenant() tenant: TenantContext,
    @Body() data: any,
  ) {
    return this.templateService.createTemplate(tenant.id, data);
  }
}