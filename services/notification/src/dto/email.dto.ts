import { IsEmail, IsString, IsOptional, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class EmailAttachmentDto {
  @IsString()
  filename: string;

  @IsString()
  content: string; // base64 encoded

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  disposition?: string;
}

export class EmailDto {
  @IsEmail()
  to: string;

  @IsOptional()
  @IsEmail()
  from?: string;

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  html?: string;

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsObject()
  templateData?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  attachments?: EmailAttachmentDto[];

  @IsOptional()
  @IsString()
  locale?: string;
}