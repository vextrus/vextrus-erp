import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsBoolean,
  IsNotEmpty,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MappingType } from '../entities/data-mapping.entity';

export class FieldMappingDto {
  @ApiProperty()
  @IsString()
  source_field: string;

  @ApiProperty()
  @IsString()
  target_field: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  data_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  default_value?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transformation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  validation?: string;
}

export class TransformationDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ['uppercase', 'lowercase', 'trim', 'date_format', 'number_format', 'custom'] })
  @IsEnum(['uppercase', 'lowercase', 'trim', 'date_format', 'number_format', 'custom'])
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  script?: string;
}

export class ValidationRuleDto {
  @ApiProperty()
  @IsString()
  field: string;

  @ApiProperty()
  @IsString()
  rule: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  params?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  error_message?: string;
}

export class LookupTableDto {
  @ApiProperty()
  @IsString()
  field: string;

  @ApiProperty()
  @IsString()
  table: string;

  @ApiProperty()
  @IsString()
  key_field: string;

  @ApiProperty()
  @IsString()
  value_field: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cache?: boolean;
}

export class ConditionalMappingDto {
  @ApiProperty()
  @IsString()
  condition: string;

  @ApiProperty()
  @IsObject()
  field_mappings: Record<string, string>;
}

export class CreateMappingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  entity_type: string;

  @ApiProperty({ enum: MappingType })
  @IsEnum(MappingType)
  mapping_type: MappingType;

  @ApiProperty({ type: [FieldMappingDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldMappingDto)
  field_mappings: FieldMappingDto[];

  @ApiPropertyOptional({ type: [TransformationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransformationDto)
  transformations?: TransformationDto[];

  @ApiPropertyOptional({ type: [ValidationRuleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidationRuleDto)
  validation_rules?: ValidationRuleDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  default_values?: Record<string, any>;

  @ApiPropertyOptional({ type: [LookupTableDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LookupTableDto)
  lookup_tables?: LookupTableDto[];

  @ApiPropertyOptional({ type: [ConditionalMappingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionalMappingDto)
  conditional_mappings?: ConditionalMappingDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_template?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  sample_data?: {
    input?: Record<string, any>[];
    output?: Record<string, any>[];
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}