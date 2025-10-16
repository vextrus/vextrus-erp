import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ExportStatus } from '../entities/export-job.entity';

@InputType()
export class UpdateExportJobInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  job_name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => ExportStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ExportStatus)
  status?: ExportStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  total_records?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  processed_records?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  file_path?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  file_url?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  file_size?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  mime_type?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  error_message?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  error_details?: string;
}