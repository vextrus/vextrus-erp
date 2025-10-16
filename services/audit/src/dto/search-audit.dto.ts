import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsArray, IsUUID, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuditEventType, AuditSeverity, AuditOutcome } from '../entities/audit-log.entity';

export class SearchAuditDto {
  @ApiPropertyOptional({ description: 'Full-text search query' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Filter by event types', type: [String] })
  @IsOptional()
  @IsArray()
  @IsEnum(AuditEventType, { each: true })
  event_types?: AuditEventType[];

  @ApiPropertyOptional({ description: 'Filter by severity levels', type: [String] })
  @IsOptional()
  @IsArray()
  @IsEnum(AuditSeverity, { each: true })
  severity_levels?: AuditSeverity[];

  @ApiPropertyOptional({ description: 'Filter by outcome', enum: AuditOutcome })
  @IsOptional()
  @IsEnum(AuditOutcome)
  outcome?: AuditOutcome;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({ description: 'Filter by username' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'Filter by service name' })
  @IsOptional()
  @IsString()
  service_name?: string;

  @ApiPropertyOptional({ description: 'Filter by resource type' })
  @IsOptional()
  @IsString()
  resource_type?: string;

  @ApiPropertyOptional({ description: 'Filter by resource ID' })
  @IsOptional()
  @IsString()
  resource_id?: string;

  @ApiPropertyOptional({ description: 'Filter by action' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'Filter by IP address' })
  @IsOptional()
  @IsString()
  ip_address?: string;

  @ApiPropertyOptional({ description: 'Filter by session ID' })
  @IsOptional()
  @IsString()
  session_id?: string;

  @ApiPropertyOptional({ description: 'Filter by correlation ID' })
  @IsOptional()
  @IsString()
  correlation_id?: string;

  @ApiPropertyOptional({ description: 'Start date for time range' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date for time range' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Sort field', default: 'timestamp' })
  @IsOptional()
  @IsString()
  sort_by?: string = 'timestamp';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ description: 'Include only sensitive logs' })
  @IsOptional()
  is_sensitive?: boolean;

  @ApiPropertyOptional({ description: 'Include archived logs' })
  @IsOptional()
  include_archived?: boolean = false;
}

export class AggregateAuditDto {
  @ApiPropertyOptional({ description: 'Group by field' })
  @IsOptional()
  @IsString()
  group_by?: 'event_type' | 'user_id' | 'service_name' | 'resource_type' | 'outcome' | 'severity';

  @ApiPropertyOptional({ description: 'Time interval for aggregation' })
  @IsOptional()
  @IsString()
  interval?: 'hour' | 'day' | 'week' | 'month';

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Filter by event types' })
  @IsOptional()
  @IsArray()
  event_types?: AuditEventType[];

  @ApiPropertyOptional({ description: 'Include top N results', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  top?: number = 10;
}

export class ExportAuditDto extends SearchAuditDto {
  @ApiPropertyOptional({ description: 'Export format', enum: ['csv', 'json', 'pdf', 'excel'] })
  @IsOptional()
  @IsEnum(['csv', 'json', 'pdf', 'excel'])
  format?: 'csv' | 'json' | 'pdf' | 'excel' = 'csv';

  @ApiPropertyOptional({ description: 'Fields to include in export' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @ApiPropertyOptional({ description: 'Include compliance fields' })
  @IsOptional()
  include_compliance?: boolean = false;

  @ApiPropertyOptional({ description: 'Encrypt exported file' })
  @IsOptional()
  encrypt?: boolean = false;

  @ApiPropertyOptional({ description: 'Email addresses to send export' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  email_recipients?: string[];
}