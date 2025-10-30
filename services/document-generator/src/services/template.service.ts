import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentTemplate, TemplateType } from '../entities/document-template.entity';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';
import * as Handlebars from 'handlebars';

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(DocumentTemplate)
    private readonly templateRepository: Repository<DocumentTemplate>,
  ) {}

  async createTemplate(tenantId: string, dto: CreateTemplateDto): Promise<DocumentTemplate> {
    // Check for duplicate name
    const existing = await this.templateRepository.findOne({
      where: { name: dto.name, tenant_id: tenantId },
    });

    if (existing) {
      throw new ConflictException(`Template with name "${dto.name}" already exists`);
    }

    // Validate template content
    const validation = this.validateTemplate(dto.template_content, dto.variables);
    if (!validation.valid) {
      throw new ConflictException(`Invalid template: ${validation.error}`);
    }

    const template = this.templateRepository.create({
      tenant_id: tenantId,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      template_content: dto.template_content,
      supported_formats: dto.supported_formats,
      default_styles: dto.default_styles,
      variables: dto.variables?.map(v => ({
        name: v.name,
        type: v.type as 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object',
        required: v.required,
        default_value: v.default_value,
        description: v.description,
      })),
      header_template: dto.header_template,
      footer_template: dto.footer_template,
      supports_bengali: dto.supports_bengali ?? true,
      bengali_font_path: dto.bengali_font_path,
      localization: dto.localization,
      category: dto.category,
      metadata: dto.metadata,
      is_active: true,
    });

    return this.templateRepository.save(template);
  }

  async getTemplates(
    tenantId: string,
    options: {
      type?: TemplateType;
      category?: string;
      isActive?: boolean;
      page: number;
      limit: number;
    }
  ) {
    const query = this.templateRepository.createQueryBuilder('template')
      .where('template.tenant_id = :tenantId', { tenantId });

    if (options.type) {
      query.andWhere('template.type = :type', { type: options.type });
    }

    if (options.category) {
      query.andWhere('template.category = :category', { category: options.category });
    }

    if (options.isActive !== undefined) {
      query.andWhere('template.is_active = :isActive', { isActive: options.isActive });
    }

    const [templates, total] = await query
      .skip((options.page - 1) * options.limit)
      .take(options.limit)
      .orderBy('template.created_at', 'DESC')
      .getManyAndCount();

    return {
      data: templates,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async getTemplate(tenantId: string, id: string): Promise<DocumentTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }

    return template;
  }

  async updateTemplate(
    tenantId: string,
    id: string,
    dto: UpdateTemplateDto
  ): Promise<DocumentTemplate> {
    const template = await this.getTemplate(tenantId, id);

    // Check for duplicate name if name is being changed
    if (dto.name && dto.name !== template.name) {
      const existing = await this.templateRepository.findOne({
        where: { name: dto.name, tenant_id: tenantId },
      });

      if (existing) {
        throw new ConflictException(`Template with name "${dto.name}" already exists`);
      }
    }

    // Validate template content if provided
    if (dto.template_content) {
      const validation = this.validateTemplate(dto.template_content, dto.variables || template.variables);
      if (!validation.valid) {
        throw new ConflictException(`Invalid template: ${validation.error}`);
      }
    }

    Object.assign(template, dto);
    return this.templateRepository.save(template);
  }

  async deleteTemplate(tenantId: string, id: string): Promise<void> {
    const template = await this.getTemplate(tenantId, id);
    await this.templateRepository.remove(template);
  }

  async duplicateTemplate(
    tenantId: string,
    id: string,
    newName: string
  ): Promise<DocumentTemplate> {
    const original = await this.getTemplate(tenantId, id);

    // Check for duplicate name
    const existing = await this.templateRepository.findOne({
      where: { name: newName, tenant_id: tenantId },
    });

    if (existing) {
      throw new ConflictException(`Template with name "${newName}" already exists`);
    }

    const duplicate = this.templateRepository.create({
      ...original,
      id: undefined,
      name: newName,
      created_at: undefined,
      updated_at: undefined,
    });

    return this.templateRepository.save(duplicate);
  }

  async previewTemplate(
    tenantId: string,
    id: string,
    sampleData: Record<string, any>
  ): Promise<{ html: string; variables: any[] }> {
    const template = await this.getTemplate(tenantId, id);

    try {
      const compiled = Handlebars.compile(template.template_content);
      const html = compiled(sampleData);

      return {
        html,
        variables: template.variables || [],
      };
    } catch (error: any) {
      throw new ConflictException(`Template preview failed: ${error.message}`);
    }
  }

  async getTemplateVariables(
    tenantId: string,
    id: string
  ): Promise<any[]> {
    const template = await this.getTemplate(tenantId, id);
    
    // Extract variables from template
    const extractedVars = this.extractVariables(template.template_content);
    
    // Merge with defined variables
    const definedVars = template.variables || [];
    const allVars = new Set([
      ...definedVars.map(v => v.name),
      ...extractedVars,
    ]);

    return Array.from(allVars).map(name => {
      const defined = definedVars.find(v => v.name === name);
      return defined || {
        name,
        type: 'string',
        required: true,
        description: 'Extracted from template',
      };
    });
  }

  validateTemplate(
    templateContent: string,
    variables?: any[]
  ): { valid: boolean; error?: string } {
    try {
      // Try to compile the template
      const compiled = Handlebars.compile(templateContent);
      
      // Create sample data from variables
      const sampleData = {};
      if (variables) {
        variables.forEach(v => {
          switch (v.type) {
            case 'string':
              sampleData[v.name] = v.default_value || 'Sample Text';
              break;
            case 'number':
              sampleData[v.name] = v.default_value || 123;
              break;
            case 'date':
              sampleData[v.name] = v.default_value || new Date();
              break;
            case 'boolean':
              sampleData[v.name] = v.default_value !== undefined ? v.default_value : true;
              break;
            case 'array':
              sampleData[v.name] = v.default_value || [];
              break;
            case 'object':
              sampleData[v.name] = v.default_value || {};
              break;
          }
        });
      }

      // Try to render with sample data
      compiled(sampleData);

      return { valid: true };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }

  private extractVariables(templateContent: string): string[] {
    const variables = new Set<string>();
    
    // Extract Handlebars variables
    const regex = /\{\{[\s]*([a-zA-Z_][a-zA-Z0-9_\.]*?)[\s]*\}\}/g;
    let match;
    
    while ((match = regex.exec(templateContent)) !== null) {
      const varPath = match[1];
      // Get root variable name
      const rootVar = varPath.split('.')[0];
      variables.add(rootVar);
    }

    // Extract from helpers
    const helperRegex = /\{\{#[a-zA-Z]+\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
    while ((match = helperRegex.exec(templateContent)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }
}