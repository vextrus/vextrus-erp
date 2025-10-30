import {
  IsString,
  IsObject,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OutputFormat } from '../entities/document-template.entity';

export class GenerationOptionsDto {
  @ApiPropertyOptional({ description: 'Add watermark to document' })
  @IsOptional()
  @IsBoolean()
  watermark?: boolean;

  @ApiPropertyOptional({ description: 'Password protect the document' })
  @IsOptional()
  @IsBoolean()
  password_protected?: boolean;

  @ApiPropertyOptional({ description: 'Add digital signature' })
  @IsOptional()
  @IsBoolean()
  digital_signature?: boolean;

  @ApiPropertyOptional({ description: 'Compress the output file' })
  @IsOptional()
  @IsBoolean()
  compress?: boolean;

  @ApiPropertyOptional({ description: 'Document IDs to merge with' })
  @IsOptional()
  @IsString({ each: true })
  merge_with?: string[];
}

export class GenerateDocumentDto {
  @ApiProperty({ description: 'Template ID to use for generation' })
  @IsNotEmpty()
  @IsUUID()
  template_id: string;

  @ApiProperty({ description: 'Name for the generated document' })
  @IsNotEmpty()
  @IsString()
  document_name: string;

  @ApiProperty({ enum: OutputFormat })
  @IsEnum(OutputFormat)
  format: OutputFormat;

  @ApiProperty({ description: 'Data to populate the template' })
  @IsNotEmpty()
  @IsObject()
  data: Record<string, any>;

  @ApiPropertyOptional({ description: 'Language for the document', default: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Reference type for linking' })
  @IsOptional()
  @IsString()
  reference_type?: string;

  @ApiPropertyOptional({ description: 'Reference ID for linking' })
  @IsOptional()
  @IsString()
  reference_id?: string;

  @ApiPropertyOptional({ description: 'Document expiration date' })
  @IsOptional()
  @IsDateString()
  expires_at?: string;

  @ApiPropertyOptional({ description: 'Generation options' })
  @IsOptional()
  @ValidateNested()
  @Type(() => GenerationOptionsDto)
  generation_options?: GenerationOptionsDto;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}