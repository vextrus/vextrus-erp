import { IsString, IsOptional, IsEnum, IsObject, IsNumber, IsBoolean, IsUUID, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PolicyType, PolicyScope } from '../entities/storage-policy.entity';

export class CreateStoragePolicyDto {
  @ApiProperty({ description: 'Policy name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Policy description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: PolicyType })
  @IsEnum(PolicyType)
  policy_type: PolicyType;

  @ApiProperty({ enum: PolicyScope })
  @IsEnum(PolicyScope)
  scope: PolicyScope;

  @ApiPropertyOptional({ description: 'Scope ID (bucket, folder, user ID)' })
  @IsOptional()
  @IsString()
  scope_id?: string;

  @ApiProperty({ description: 'Policy rules' })
  @IsObject()
  rules: {
    retention?: {
      days?: number;
      months?: number;
      years?: number;
      action: 'delete' | 'archive' | 'move';
      destination?: string;
    };
    lifecycle?: {
      transitions: {
        days: number;
        storage_class: string;
      }[];
      expiration?: {
        days: number;
        expired_object_delete_marker?: boolean;
      };
    };
    backup?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      retention_days: number;
      destination: string;
      encryption?: boolean;
    };
    archive?: {
      after_days: number;
      storage_class: string;
      retrieval_tier?: 'expedited' | 'standard' | 'bulk';
    };
    quota?: {
      max_storage_gb?: number;
      max_files?: number;
      max_file_size_mb?: number;
      warning_threshold?: number;
    };
  };

  @ApiPropertyOptional({ description: 'Policy conditions' })
  @IsOptional()
  @IsObject()
  conditions?: {
    file_types?: string[];
    min_size_mb?: number;
    max_size_mb?: number;
    tags?: string[];
    metadata_match?: Record<string, any>;
    created_before?: Date;
    accessed_before?: Date;
  };

  @ApiPropertyOptional({ description: 'Policy actions' })
  @IsOptional()
  @IsObject()
  actions?: {
    notifications?: {
      email?: string[];
      webhook?: string;
      events?: string[];
    };
    auto_tag?: string[];
    move_to_folder?: string;
    change_access_level?: string;
  };

  @ApiPropertyOptional({ description: 'Policy priority', default: 0 })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Is default policy', default: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

export class UpdateStoragePolicyDto {
  @ApiPropertyOptional({ description: 'Policy name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Policy description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Policy rules' })
  @IsOptional()
  @IsObject()
  rules?: any;

  @ApiPropertyOptional({ description: 'Policy conditions' })
  @IsOptional()
  @IsObject()
  conditions?: any;

  @ApiPropertyOptional({ description: 'Policy actions' })
  @IsOptional()
  @IsObject()
  actions?: any;

  @ApiPropertyOptional({ description: 'Policy priority' })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class ApplyPolicyDto {
  @ApiProperty({ description: 'Policy ID' })
  @IsUUID()
  policy_id: string;

  @ApiPropertyOptional({ description: 'Target IDs to apply policy' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  target_ids?: string[];

  @ApiPropertyOptional({ description: 'Dry run mode', default: false })
  @IsOptional()
  @IsBoolean()
  dry_run?: boolean;

  @ApiPropertyOptional({ description: 'Force apply even if conflicts', default: false })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

export class PolicyAnalyticsDto {
  @ApiPropertyOptional({ description: 'Policy IDs to analyze' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  policy_ids?: string[];

  @ApiPropertyOptional({ description: 'Date range start' })
  @IsOptional()
  start_date?: Date;

  @ApiPropertyOptional({ description: 'Date range end' })
  @IsOptional()
  end_date?: Date;

  @ApiPropertyOptional({ description: 'Group by field' })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'policy_type', 'scope'])
  group_by?: 'day' | 'week' | 'month' | 'policy_type' | 'scope';
}