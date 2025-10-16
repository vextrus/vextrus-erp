import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, IsJSON, IsNumber, IsEnum } from 'class-validator';
import { ImportStatus } from '../entities/import-job.entity';

@InputType()
export class UpdateImportJobInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  job_name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => ImportStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ImportStatus)
  status?: ImportStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  total_rows?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  processed_rows?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  successful_rows?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  failed_rows?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  skipped_rows?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsJSON()
  error_details?: {
    row: number;
    field?: string;
    value?: any;
    error: string;
  }[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  error_file_path?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsJSON()
  summary?: {
    created?: number;
    updated?: number;
    duplicates?: number;
    validation_errors?: Record<string, number>;
  };

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsJSON()
  metadata?: Record<string, any>;
}