import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, IsJSON, IsNumber, IsEnum } from 'class-validator';
import { ImportFormat } from '../entities/import-job.entity';

@InputType()
export class CreateImportJobInput {
  @Field()
  @IsString()
  tenant_id: string;

  @Field()
  @IsString()
  job_name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field()
  @IsString()
  entity_type: string;

  @Field(() => ImportFormat)
  @IsEnum(ImportFormat)
  format: ImportFormat;

  @Field()
  @IsString()
  file_path: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  original_filename?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  file_size?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  mapping_id?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsJSON()
  mapping_config?: {
    fields: Record<string, string>;
    defaults?: Record<string, any>;
    transformations?: Record<string, string>;
    skip_rows?: number;
    sheet_name?: string;
    delimiter?: string;
  };

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsJSON()
  validation_rules?: {
    required_fields?: string[];
    unique_fields?: string[];
    field_types?: Record<string, string>;
    custom_validators?: Record<string, string>;
  };

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  rollback_on_error?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  batch_size?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  dry_run?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsJSON()
  options?: {
    update_existing?: boolean;
    ignore_duplicates?: boolean;
    case_sensitive?: boolean;
    trim_values?: boolean;
    null_on_empty?: boolean;
    date_format?: string;
    number_format?: string;
  };

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  created_by?: string;
}