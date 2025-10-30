import { IsString, IsOptional, IsUUID, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileAccessLevel } from '../entities/file.entity';

export class CreateFolderDto {
  @ApiProperty({ description: 'Folder name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Parent folder ID' })
  @IsOptional()
  @IsUUID()
  parent_folder_id?: string;

  @ApiPropertyOptional({ description: 'Folder description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Folder tags' })
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
  metadata?: Record<string, any>;
}

export class UpdateFolderDto {
  @ApiPropertyOptional({ description: 'Folder name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Folder description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Folder tags' })
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
  metadata?: Record<string, any>;
}

export class ListFolderContentsDto {
  @ApiPropertyOptional({ description: 'Include subfolders', default: true })
  @IsOptional()
  include_folders?: boolean;

  @ApiPropertyOptional({ description: 'Include files', default: true })
  @IsOptional()
  include_files?: boolean;

  @ApiPropertyOptional({ description: 'Recursive listing', default: false })
  @IsOptional()
  recursive?: boolean;

  @ApiPropertyOptional({ description: 'Sort field', default: 'name' })
  @IsOptional()
  @IsString()
  sort_by?: 'name' | 'size' | 'created_at' | 'updated_at';

  @ApiPropertyOptional({ description: 'Sort order', default: 'ASC' })
  @IsOptional()
  @IsString()
  sort_order?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 50 })
  @IsOptional()
  limit?: number;
}