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
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExportFormat } from '../entities/export-job.entity';

export class QueryParamsDto {
  @ApiPropertyOptional({ description: 'Filters to apply' })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Sort configuration' })
  @IsOptional()
  @IsArray()
  sort?: { field: string; order: 'ASC' | 'DESC' }[];

  @ApiPropertyOptional({ description: 'Fields to include' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @ApiPropertyOptional({ description: 'Relations to include' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relations?: string[];

  @ApiPropertyOptional({ description: 'Date range filter' })
  @IsOptional()
  @IsObject()
  date_range?: {
    field: string;
    from: Date;
    to: Date;
  };
}

export class ExportConfigDto {
  @ApiPropertyOptional({ description: 'Custom headers' })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Field mapping' })
  @IsOptional()
  @IsObject()
  field_mapping?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Date format pattern' })
  @IsOptional()
  @IsString()
  date_format?: string;

  @ApiPropertyOptional({ description: 'Number format pattern' })
  @IsOptional()
  @IsString()
  number_format?: string;

  @ApiPropertyOptional({ description: 'Boolean format' })
  @IsOptional()
  @IsObject()
  boolean_format?: { true: string; false: string };

  @ApiPropertyOptional({ description: 'Null value representation' })
  @IsOptional()
  @IsString()
  null_value?: string;

  @ApiPropertyOptional({ description: 'CSV delimiter' })
  @IsOptional()
  @IsString()
  delimiter?: string;

  @ApiPropertyOptional({ description: 'Include headers', default: true })
  @IsOptional()
  @IsBoolean()
  include_headers?: boolean;

  @ApiPropertyOptional({ description: 'Excel sheet name' })
  @IsOptional()
  @IsString()
  sheet_name?: string;
}

export class ScheduleConfigDto {
  @ApiPropertyOptional({ description: 'Cron expression' })
  @IsOptional()
  @IsString()
  cron?: string;

  @ApiPropertyOptional({ description: 'Is recurring' })
  @IsOptional()
  @IsBoolean()
  recurring?: boolean;

  @ApiPropertyOptional({ description: 'Next run date' })
  @IsOptional()
  @IsDateString()
  next_run?: string;
}

export class NotificationConfigDto {
  @ApiPropertyOptional({ description: 'Email addresses' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  email?: string[];

  @ApiPropertyOptional({ description: 'Notify on completion' })
  @IsOptional()
  @IsBoolean()
  on_complete?: boolean;

  @ApiPropertyOptional({ description: 'Notify on failure' })
  @IsOptional()
  @IsBoolean()
  on_failure?: boolean;
}

export class CreateExportJobDto {
  @ApiProperty({ description: 'Job name' })
  @IsNotEmpty()
  @IsString()
  job_name: string;

  @ApiPropertyOptional({ description: 'Job description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Entity type to export' })
  @IsNotEmpty()
  @IsString()
  entity_type: string;

  @ApiProperty({ enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({ description: 'Query parameters' })
  @IsOptional()
  @ValidateNested()
  @Type(() => QueryParamsDto)
  query_params?: QueryParamsDto;

  @ApiPropertyOptional({ description: 'Export configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExportConfigDto)
  export_config?: ExportConfigDto;

  @ApiPropertyOptional({ description: 'Batch size', default: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  batch_size?: number;

  @ApiPropertyOptional({ description: 'Compress output' })
  @IsOptional()
  @IsBoolean()
  compress?: boolean;

  @ApiPropertyOptional({ description: 'Compression type' })
  @IsOptional()
  @IsString()
  compression_type?: string;

  @ApiPropertyOptional({ description: 'Schedule configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ScheduleConfigDto)
  schedule_config?: ScheduleConfigDto;

  @ApiPropertyOptional({ description: 'Notification configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationConfigDto)
  notification_config?: NotificationConfigDto;

  @ApiPropertyOptional({ description: 'Expiration date' })
  @IsOptional()
  @IsDateString()
  expires_at?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}