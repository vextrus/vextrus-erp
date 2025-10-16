import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { TemplateService } from '../services/template.service';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';
import { TemplateType } from '../entities/document-template.entity';

@ApiTags('templates')
@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createTemplate(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.templateService.createTemplate(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all templates' })
  @ApiQuery({ name: 'type', required: false, enum: TemplateType })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTemplates(
    @Headers('x-tenant-id') tenantId: string,
    @Query('type') type?: TemplateType,
    @Query('category') category?: string,
    @Query('is_active') isActive?: boolean,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.templateService.getTemplates(tenantId, {
      type,
      category,
      isActive,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  async getTemplate(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.templateService.getTemplate(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a template' })
  async updateTemplate(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templateService.updateTemplate(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a template' })
  async deleteTemplate(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.templateService.deleteTemplate(tenantId, id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a template' })
  async duplicateTemplate(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body('name') name: string,
  ) {
    return this.templateService.duplicateTemplate(tenantId, id, name);
  }

  @Post(':id/preview')
  @ApiOperation({ summary: 'Preview template with sample data' })
  async previewTemplate(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() sampleData: Record<string, any>,
  ) {
    return this.templateService.previewTemplate(tenantId, id, sampleData);
  }

  @Get(':id/variables')
  @ApiOperation({ summary: 'Get template variables' })
  async getTemplateVariables(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.templateService.getTemplateVariables(tenantId, id);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate template content' })
  async validateTemplate(
    @Body('template_content') templateContent: string,
    @Body('variables') variables?: any[],
  ) {
    return this.templateService.validateTemplate(templateContent, variables);
  }
}