import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, IsJSON, IsNumber, IsEnum } from 'class-validator';
import { ExportFormat } from '../entities/export-job.entity';

@InputType()
export class CreateExportJobInput {
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

  @Field(() => ExportFormat)
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsJSON()
  query_params?: {
    filters?: Record<string, any>;
    sort?: { field: string; order: 'ASC' | 'DESC' }[];
    fields?: string[];
    relations?: string[];
    date_range?: {
      field: string;
      from: Date;
      to: Date;
    };
  };

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsJSON()
  export_config?: {
    headers?: Record<string, string>;
    field_mapping?: Record<string, string>;
    date_format?: string;
    number_format?: string;
    boolean_format?: { true: string; false: string };
    null_value?: string;
    delimiter?: string;
    include_headers?: boolean;
    sheet_name?: string;
  };

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  batch_size?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  compress?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  compression_type?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsJSON()
  schedule_config?: {
    cron?: string;
    recurring?: boolean;
    next_run?: Date;
  };

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsJSON()
  notification_config?: {
    email?: string[];
    on_complete?: boolean;
    on_failure?: boolean;
  };

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  created_by?: string;
}