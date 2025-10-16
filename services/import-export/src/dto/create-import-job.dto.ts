import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsBoolean,
  IsNumber,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ImportFormat } from '../entities/import-job.entity';

export class MappingConfigDto {
  @ApiProperty({ description: 'Field mappings from source to target' })
  @IsObject()
  fields: Record<string, string>;

  @ApiPropertyOptional({ description: 'Default values for fields' })
  @IsOptional()
  @IsObject()
  defaults?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Field transformations' })
  @IsOptional()
  @IsObject()
  transformations?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Number of header rows to skip' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  skip_rows?: number;

  @ApiPropertyOptional({ description: 'Excel sheet name' })
  @IsOptional()
  @IsString()
  sheet_name?: string;

  @ApiPropertyOptional({ description: 'CSV delimiter' })
  @IsOptional()
  @IsString()
  delimiter?: string;
}

export class ValidationRulesDto {
  @ApiPropertyOptional({ description: 'Required fields' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  required_fields?: string[];

  @ApiPropertyOptional({ description: 'Unique fields' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  unique_fields?: string[];

  @ApiPropertyOptional({ description: 'Field types' })
  @IsOptional()
  @IsObject()
  field_types?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Custom validators' })
  @IsOptional()
  @IsObject()
  custom_validators?: Record<string, string>;
}

export class ImportOptionsDto {
  @ApiPropertyOptional({ description: 'Update existing records' })
  @IsOptional()
  @IsBoolean()
  update_existing?: boolean;

  @ApiPropertyOptional({ description: 'Ignore duplicate records' })
  @IsOptional()
  @IsBoolean()
  ignore_duplicates?: boolean;

  @ApiPropertyOptional({ description: 'Case sensitive matching' })
  @IsOptional()
  @IsBoolean()
  case_sensitive?: boolean;

  @ApiPropertyOptional({ description: 'Trim whitespace from values' })
  @IsOptional()
  @IsBoolean()
  trim_values?: boolean;

  @ApiPropertyOptional({ description: 'Set null for empty values' })
  @IsOptional()
  @IsBoolean()
  null_on_empty?: boolean;

  @ApiPropertyOptional({ description: 'Date format pattern' })
  @IsOptional()
  @IsString()
  date_format?: string;

  @ApiPropertyOptional({ description: 'Number format pattern' })
  @IsOptional()
  @IsString()
  number_format?: string;
}

export class CreateImportJobDto {
  @ApiProperty({ description: 'Job name' })
  @IsNotEmpty()
  @IsString()
  job_name: string;

  @ApiPropertyOptional({ description: 'Job description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Entity type to import' })
  @IsNotEmpty()
  @IsString()
  entity_type: string;

  @ApiProperty({ enum: ImportFormat })
  @IsEnum(ImportFormat)
  format: ImportFormat;

  @ApiProperty({ description: 'File path or base64 encoded content' })
  @IsNotEmpty()
  @IsString()
  file_path: string;

  @ApiPropertyOptional({ description: 'Original filename' })
  @IsOptional()
  @IsString()
  original_filename?: string;

  @ApiPropertyOptional({ description: 'Mapping configuration ID' })
  @IsOptional()
  @IsString()
  mapping_id?: string;

  @ApiPropertyOptional({ description: 'Mapping configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MappingConfigDto)
  mapping_config?: MappingConfigDto;

  @ApiPropertyOptional({ description: 'Validation rules' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ValidationRulesDto)
  validation_rules?: ValidationRulesDto;

  @ApiPropertyOptional({ description: 'Rollback on error', default: false })
  @IsOptional()
  @IsBoolean()
  rollback_on_error?: boolean;

  @ApiPropertyOptional({ description: 'Batch size for processing', default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  batch_size?: number;

  @ApiPropertyOptional({ description: 'Perform dry run without saving', default: false })
  @IsOptional()
  @IsBoolean()
  dry_run?: boolean;

  @ApiPropertyOptional({ description: 'Import options' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImportOptionsDto)
  options?: ImportOptionsDto;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}