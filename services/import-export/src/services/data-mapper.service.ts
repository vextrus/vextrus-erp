import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataMapping, MappingType } from '../entities/data-mapping.entity';
import { CreateMappingDto } from '../dto/create-mapping.dto';
import { UpdateMappingDto } from '../dto/update-mapping.dto';

@Injectable()
export class DataMapperService {
  constructor(
    @InjectRepository(DataMapping)
    private readonly mappingRepository: Repository<DataMapping>,
  ) {}

  async createMapping(tenantId: string, dto: CreateMappingDto): Promise<DataMapping> {
    // Check for duplicate name
    const existing = await this.mappingRepository.findOne({
      where: { name: dto.name, tenant_id: tenantId },
    });

    if (existing) {
      throw new ConflictException(`Mapping with name "${dto.name}" already exists`);
    }

    const mapping = this.mappingRepository.create({
      ...dto,
      tenant_id: tenantId,
      is_active: true,
    } as any);

    const savedMapping = await this.mappingRepository.save(mapping);
    if (Array.isArray(savedMapping)) {
      if (savedMapping.length === 0) {
        throw new Error('Failed to save mapping');
      }
      return savedMapping[0]!;
    }
    return savedMapping;
  }

  async getMappings(
    tenantId: string,
    options: {
      entityType?: string;
      mappingType?: MappingType;
      isTemplate?: boolean;
      page: number;
      limit: number;
    },
  ) {
    const query = this.mappingRepository.createQueryBuilder('mapping')
      .where('mapping.tenant_id = :tenantId', { tenantId });

    if (options.entityType) {
      query.andWhere('mapping.entity_type = :entityType', { entityType: options.entityType });
    }

    if (options.mappingType) {
      query.andWhere('mapping.mapping_type = :mappingType', { mappingType: options.mappingType });
    }

    if (options.isTemplate !== undefined) {
      query.andWhere('mapping.is_template = :isTemplate', { isTemplate: options.isTemplate });
    }

    const [mappings, total] = await query
      .skip((options.page - 1) * options.limit)
      .take(options.limit)
      .orderBy('mapping.created_at', 'DESC')
      .getManyAndCount();

    return {
      data: mappings,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async getMapping(tenantId: string, id: string): Promise<DataMapping> {
    const mapping = await this.mappingRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!mapping) {
      throw new NotFoundException(`Mapping ${id} not found`);
    }

    return mapping;
  }

  async updateMapping(
    tenantId: string,
    id: string,
    dto: UpdateMappingDto,
  ): Promise<DataMapping> {
    const mapping = await this.getMapping(tenantId, id);

    // Check for duplicate name if name is being changed
    if (dto.name && dto.name !== mapping.name) {
      const existing = await this.mappingRepository.findOne({
        where: { name: dto.name, tenant_id: tenantId },
      });

      if (existing) {
        throw new ConflictException(`Mapping with name "${dto.name}" already exists`);
      }
    }

    Object.assign(mapping, dto);
    return this.mappingRepository.save(mapping);
  }

  async deleteMapping(tenantId: string, id: string): Promise<void> {
    const mapping = await this.getMapping(tenantId, id);
    await this.mappingRepository.remove(mapping);
  }

  async duplicateMapping(
    tenantId: string,
    id: string,
    newName: string,
  ): Promise<DataMapping> {
    const original = await this.getMapping(tenantId, id);

    // Check for duplicate name
    const existing = await this.mappingRepository.findOne({
      where: { name: newName, tenant_id: tenantId },
    });

    if (existing) {
      throw new ConflictException(`Mapping with name "${newName}" already exists`);
    }

    const duplicate = this.mappingRepository.create({
      ...original,
      id: undefined,
      name: newName,
      created_at: undefined,
      updated_at: undefined,
    });

    return this.mappingRepository.save(duplicate);
  }

  async testMapping(
    tenantId: string,
    mappingId: string,
    sampleData: any,
  ): Promise<any> {
    const mapping = await this.getMapping(tenantId, mappingId);
    
    const result = this.applyMapping(sampleData, mapping);
    const validation = this.validateMappedData(result, mapping);

    return {
      input: sampleData,
      output: result,
      validation,
      mapping_summary: {
        fields_mapped: Object.keys(result).length,
        transformations_applied: this.getAppliedTransformations(sampleData, mapping),
      },
    };
  }

  async getTemplateLibrary(): Promise<DataMapping[]> {
    return this.mappingRepository.find({
      where: { is_template: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  applyMapping(data: any, mapping: DataMapping): any {
    const result = {};

    // Apply field mappings
    mapping.field_mappings.forEach(fm => {
      let value = this.getNestedValue(data, fm.source_field);

      // Apply default value if needed
      if (value === null || value === undefined) {
        value = fm.default_value !== undefined ? fm.default_value : mapping.default_values?.[fm.target_field];
      }

      // Apply transformation
      if (fm.transformation) {
        value = this.applyTransformation(value, fm.transformation, mapping);
      }

      this.setNestedValue(result, fm.target_field, value);
    });

    // Apply conditional mappings
    if (mapping.conditional_mappings) {
      mapping.conditional_mappings.forEach(cm => {
        if (this.evaluateCondition(data, cm.condition)) {
          Object.assign(result, cm.field_mappings);
        }
      });
    }

    // Apply lookup tables
    if (mapping.lookup_tables) {
      mapping.lookup_tables.forEach(lt => {
        const value = result[lt.field];
        if (value !== undefined) {
          result[lt.field] = this.lookupValue(value, lt);
        }
      });
    }

    return result;
  }

  private applyTransformation(value: any, transformation: string, mapping: DataMapping): any {
    const transform = mapping.transformations?.find(t => t.name === transformation);
    if (!transform) return value;

    switch (transform.type) {
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      
      case 'date_format':
        if (value instanceof Date || typeof value === 'string') {
          const date = new Date(value);
          return this.formatDate(date, transform.config?.format || 'YYYY-MM-DD');
        }
        return value;
      
      case 'number_format':
        if (typeof value === 'number') {
          return this.formatNumber(value, transform.config);
        }
        return value;
      
      case 'custom':
        if (transform.script) {
          try {
            const func = new Function('value', 'config', transform.script);
            return func(value, transform.config);
          } catch (error: any) {
            console.error(`Custom transformation error: ${error.message}`);
            return value;
          }
        }
        return value;
      
      default:
        return value;
    }
  }

  private validateMappedData(data: any, mapping: DataMapping): any {
    const errors: any[] = [];
    const warnings: any[] = [];

    if (mapping.validation_rules) {
      mapping.validation_rules.forEach(rule => {
        const value = data[rule.field];
        const validation = this.validateField(value, rule);
        
        if (!validation.valid) {
          errors.push({
            field: rule.field,
            value,
            error: validation.error || rule.error_message,
          });
        }
      });
    }

    // Check required fields
    mapping.field_mappings
      .filter(fm => fm.required)
      .forEach(fm => {
        const value = data[fm.target_field];
        if (value === null || value === undefined || value === '') {
          errors.push({
            field: fm.target_field,
            error: `Required field is missing`,
          });
        }
      });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateField(value: any, rule: any): { valid: boolean; error?: string } {
    switch (rule.rule) {
      case 'required':
        return {
          valid: value !== null && value !== undefined && value !== '',
          error: 'Field is required',
        };
      
      case 'min_length':
        return {
          valid: !value || value.toString().length >= (rule.params?.[0] || 0),
          error: `Minimum length is ${rule.params?.[0]}`,
        };
      
      case 'max_length':
        return {
          valid: !value || value.toString().length <= (rule.params?.[0] || 999999),
          error: `Maximum length is ${rule.params?.[0]}`,
        };
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
          valid: !value || emailRegex.test(value),
          error: 'Invalid email format',
        };
      
      case 'numeric':
        return {
          valid: !value || !isNaN(value),
          error: 'Value must be numeric',
        };
      
      case 'regex':
        try {
          const regex = new RegExp(rule.params?.[0] || '.*');
          return {
            valid: !value || regex.test(value.toString()),
            error: `Value does not match pattern`,
          };
        } catch {
          return { valid: true };
        }
      
      default:
        return { valid: true };
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    const lastProp = parts.pop();
    
    const target = parts.reduce((current, prop) => {
      if (!current[prop]) {
        current[prop] = {};
      }
      return current[prop];
    }, obj);

    if (lastProp) {
      target[lastProp] = value;
    }
  }

  private evaluateCondition(data: any, condition: string): boolean {
    try {
      const func = new Function('data', `return ${condition}`);
      return func(data);
    } catch {
      return false;
    }
  }

  private lookupValue(value: any, lookupTable: any): any {
    // This would normally query the actual lookup table
    // For now, returning the original value
    return value;
  }

  private getAppliedTransformations(data: any, mapping: DataMapping): string[] {
    const applied: any[] = [];
    
    mapping.field_mappings.forEach(fm => {
      if (fm.transformation && this.getNestedValue(data, fm.source_field) !== undefined) {
        applied.push(fm.transformation);
      }
    });

    return [...new Set(applied)];
  }

  private formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return format
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day);
  }

  private formatNumber(value: number, config?: any): string {
    const decimals = config?.decimals ?? 2;
    const thousandsSeparator = config?.thousands_separator || ',';
    const decimalSeparator = config?.decimal_separator || '.';
    
    const parts = value.toFixed(decimals).split('.');
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
    }
    
    return parts.join(decimalSeparator);
  }
}