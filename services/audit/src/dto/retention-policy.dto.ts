import { IsString, IsOptional, IsEnum, IsObject, IsNumber, IsBoolean, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RetentionAction, RetentionScope } from '../entities/retention-policy.entity';
import { AuditEventType, AuditSeverity } from '../entities/audit-log.entity';

export class CreateRetentionPolicyDto {
  @ApiProperty({ description: 'Policy name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Policy description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: RetentionScope })
  @IsEnum(RetentionScope)
  scope: RetentionScope;

  @ApiProperty({ description: 'Criteria for applying the policy' })
  @IsObject()
  criteria: {
    event_types?: AuditEventType[];
    severity_levels?: AuditSeverity[];
    compliance_types?: string[];
    data_classifications?: string[];
    services?: string[];
    custom_filters?: {
      field: string;
      operator: string;
      value: any;
    }[];
  };

  @ApiProperty({ description: 'Retention rules' })
  @IsObject()
  retention_rules: {
    standard: {
      duration_days: number;
      action: RetentionAction;
    };
    compliance?: {
      regulation: string;
      duration_days: number;
      action: RetentionAction;
    }[];
    legal_hold?: {
      active: boolean;
      reason: string;
      until_date?: Date;
    };
  };

  @ApiPropertyOptional({ description: 'Archive configuration' })
  @IsOptional()
  @IsObject()
  archive_config?: {
    destination?: string;
    compression?: boolean;
    encryption?: boolean;
    format?: string;
    schedule?: string;
  };

  @ApiPropertyOptional({ description: 'Export configuration' })
  @IsOptional()
  @IsObject()
  export_config?: {
    format?: string;
    destination?: string;
    include_metadata?: boolean;
    encrypt?: boolean;
    notification_emails?: string[];
  };

  @ApiPropertyOptional({ description: 'Priority (higher number = higher priority)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number = 0;

  @ApiPropertyOptional({ description: 'Is policy active?' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;

  @ApiPropertyOptional({ description: 'Is this the default policy?' })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean = false;

  @ApiPropertyOptional({ description: 'Cron schedule for automatic execution' })
  @IsOptional()
  @IsString()
  schedule_cron?: string;
}

export class UpdateRetentionPolicyDto {
  @ApiPropertyOptional({ description: 'Policy name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Policy description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Criteria for applying the policy' })
  @IsOptional()
  @IsObject()
  criteria?: any;

  @ApiPropertyOptional({ description: 'Retention rules' })
  @IsOptional()
  @IsObject()
  retention_rules?: any;

  @ApiPropertyOptional({ description: 'Archive configuration' })
  @IsOptional()
  @IsObject()
  archive_config?: any;

  @ApiPropertyOptional({ description: 'Export configuration' })
  @IsOptional()
  @IsObject()
  export_config?: any;

  @ApiPropertyOptional({ description: 'Priority' })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ description: 'Is policy active?' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Cron schedule' })
  @IsOptional()
  @IsString()
  schedule_cron?: string;
}

export class ApplyRetentionPolicyDto {
  @ApiPropertyOptional({ description: 'Policy IDs to apply' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  policy_ids?: string[];

  @ApiPropertyOptional({ description: 'Apply to specific event types' })
  @IsOptional()
  @IsArray()
  event_types?: AuditEventType[];

  @ApiPropertyOptional({ description: 'Dry run mode' })
  @IsOptional()
  @IsBoolean()
  dry_run?: boolean = false;

  @ApiPropertyOptional({ description: 'Force execution even if recently run' })
  @IsOptional()
  @IsBoolean()
  force?: boolean = false;

  @ApiPropertyOptional({ description: 'Include statistics in response' })
  @IsOptional()
  @IsBoolean()
  include_stats?: boolean = true;
}

export class RetentionStatisticsDto {
  @ApiPropertyOptional({ description: 'Start date for statistics' })
  @IsOptional()
  start_date?: Date;

  @ApiPropertyOptional({ description: 'End date for statistics' })
  @IsOptional()
  end_date?: Date;

  @ApiPropertyOptional({ description: 'Group statistics by' })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'policy', 'action'])
  group_by?: 'day' | 'week' | 'month' | 'policy' | 'action';

  @ApiPropertyOptional({ description: 'Include detailed breakdown' })
  @IsOptional()
  @IsBoolean()
  detailed?: boolean = false;
}