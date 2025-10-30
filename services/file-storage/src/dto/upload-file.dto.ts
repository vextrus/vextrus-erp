import { IsString, IsOptional, IsEnum, IsObject, IsArray, IsUUID, IsNumber, IsBoolean, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileAccessLevel } from '../entities/file.entity';

export class UploadFileDto {
  @ApiProperty({ description: 'Original file name' })
  @IsString()
  original_name: string;

  @ApiProperty({ description: 'MIME type of the file' })
  @IsString()
  mime_type: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  size: number;

  @ApiPropertyOptional({ description: 'Parent folder ID' })
  @IsOptional()
  @IsUUID()
  parent_folder_id?: string;

  @ApiPropertyOptional({ description: 'File description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'File tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: FileAccessLevel })
  @IsOptional()
  @IsEnum(FileAccessLevel)
  access_level?: FileAccessLevel;

  @ApiPropertyOptional({ description: 'Custom metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Enable versioning for this file' })
  @IsOptional()
  @IsBoolean()
  is_versioned?: boolean;

  @ApiPropertyOptional({ description: 'Retention policy' })
  @IsOptional()
  @IsObject()
  retention_policy?: {
    days?: number;
    action?: 'delete' | 'archive';
    notification?: boolean;
  };

  @ApiPropertyOptional({ description: 'File expiration date' })
  @IsOptional()
  @IsDateString()
  expires_at?: string;
}

export class UploadChunkDto {
  @ApiProperty({ description: 'Upload session ID' })
  @IsUUID()
  session_id: string;

  @ApiProperty({ description: 'Chunk number' })
  @IsNumber()
  chunk_number: number;

  @ApiProperty({ description: 'Total chunks' })
  @IsNumber()
  total_chunks: number;

  @ApiProperty({ description: 'Chunk size in bytes' })
  @IsNumber()
  chunk_size: number;

  @ApiPropertyOptional({ description: 'Checksum of the chunk' })
  @IsOptional()
  @IsString()
  checksum?: string;
}

export class GeneratePresignedUrlDto {
  @ApiProperty({ description: 'File ID' })
  @IsUUID()
  file_id: string;

  @ApiProperty({ description: 'Operation type', enum: ['upload', 'download'] })
  @IsEnum(['upload', 'download'])
  operation: 'upload' | 'download';

  @ApiPropertyOptional({ description: 'URL expiration in seconds', default: 3600 })
  @IsOptional()
  @IsNumber()
  expires_in?: number;

  @ApiPropertyOptional({ description: 'Content type for upload' })
  @IsOptional()
  @IsString()
  content_type?: string;

  @ApiPropertyOptional({ description: 'Response content disposition' })
  @IsOptional()
  @IsString()
  response_disposition?: string;
}

export class BatchUploadDto {
  @ApiProperty({ description: 'Parent folder ID for all files' })
  @IsOptional()
  @IsUUID()
  parent_folder_id?: string;

  @ApiProperty({ description: 'Files to upload', type: [UploadFileDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadFileDto)
  files: UploadFileDto[];

  @ApiPropertyOptional({ description: 'Common tags for all files' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  common_tags?: string[];

  @ApiPropertyOptional({ description: 'Common access level', enum: FileAccessLevel })
  @IsOptional()
  @IsEnum(FileAccessLevel)
  common_access_level?: FileAccessLevel;
}