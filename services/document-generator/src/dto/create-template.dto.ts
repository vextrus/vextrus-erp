import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateType, OutputFormat } from '../entities/document-template.entity';

export class TemplateVariableDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ['string', 'number', 'date', 'boolean', 'array', 'object'] })
  @IsEnum(['string', 'number', 'date', 'boolean', 'array', 'object'])
  type: string;

  @ApiProperty()
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  default_value?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class DefaultStylesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  font_family?: string;

  @ApiPropertyOptional()
  @IsOptional()
  font_size?: number;

  @ApiPropertyOptional({ enum: ['A4', 'A3', 'Letter', 'Legal'] })
  @IsOptional()
  @IsEnum(['A4', 'A3', 'Letter', 'Legal'])
  page_size?: 'A4' | 'A3' | 'Letter' | 'Legal';

  @ApiPropertyOptional({ enum: ['portrait', 'landscape'] })
  @IsOptional()
  @IsEnum(['portrait', 'landscape'])
  orientation?: 'portrait' | 'landscape';

  @ApiPropertyOptional()
  @IsOptional()
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bengali_font?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  rtl_support?: boolean;
}

export class CreateTemplateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: TemplateType })
  @IsEnum(TemplateType)
  type: TemplateType;

  @ApiProperty({ description: 'Template content (HTML/Handlebars)' })
  @IsNotEmpty()
  @IsString()
  template_content: string;

  @ApiProperty({ enum: OutputFormat, isArray: true })
  @IsArray()
  @IsEnum(OutputFormat, { each: true })
  supported_formats: OutputFormat[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => DefaultStylesDto)
  default_styles?: DefaultStylesDto;

  @ApiPropertyOptional({ type: [TemplateVariableDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateVariableDto)
  variables?: TemplateVariableDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  header_template?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  footer_template?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  supports_bengali?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bengali_font_path?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  localization?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}