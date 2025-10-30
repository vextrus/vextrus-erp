import { IsString, IsOptional, IsUUID, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MoveFileDto {
  @ApiProperty({ description: 'Target folder ID' })
  @IsUUID()
  target_folder_id: string;

  @ApiPropertyOptional({ description: 'New file name' })
  @IsOptional()
  @IsString()
  new_name?: string;

  @ApiPropertyOptional({ description: 'Overwrite if exists', default: false })
  @IsOptional()
  overwrite?: boolean;
}

export class CopyFileDto {
  @ApiProperty({ description: 'Target folder ID' })
  @IsUUID()
  target_folder_id: string;

  @ApiPropertyOptional({ description: 'New file name' })
  @IsOptional()
  @IsString()
  new_name?: string;

  @ApiPropertyOptional({ description: 'Copy with versions', default: false })
  @IsOptional()
  copy_versions?: boolean;

  @ApiPropertyOptional({ description: 'Copy metadata', default: true })
  @IsOptional()
  copy_metadata?: boolean;
}

export class BatchOperationDto {
  @ApiProperty({ description: 'File IDs to operate on' })
  @IsArray()
  @IsUUID('4', { each: true })
  file_ids: string[];

  @ApiProperty({ description: 'Operation type' })
  @IsEnum(['move', 'copy', 'delete', 'archive', 'restore', 'tag', 'untag'])
  operation: 'move' | 'copy' | 'delete' | 'archive' | 'restore' | 'tag' | 'untag';

  @ApiPropertyOptional({ description: 'Target folder ID for move/copy' })
  @IsOptional()
  @IsUUID()
  target_folder_id?: string;

  @ApiPropertyOptional({ description: 'Tags to add/remove' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Force operation', default: false })
  @IsOptional()
  force?: boolean;
}

export class ShareFileDto {
  @ApiProperty({ description: 'Expiration time in hours', default: 24 })
  @IsOptional()
  expires_in_hours?: number;

  @ApiPropertyOptional({ description: 'Password protection' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'Maximum download count' })
  @IsOptional()
  max_downloads?: number;

  @ApiPropertyOptional({ description: 'Allowed email addresses' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowed_emails?: string[];

  @ApiPropertyOptional({ description: 'Send notification to emails' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notify_emails?: string[];
}

export class SearchFilesDto {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'File types' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  file_types?: string[];

  @ApiPropertyOptional({ description: 'MIME type filter' })
  @IsOptional()
  @IsString()
  mime_type?: string;

  @ApiPropertyOptional({ description: 'Tags to filter' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Parent folder ID' })
  @IsOptional()
  @IsUUID()
  parent_folder_id?: string;

  @ApiPropertyOptional({ description: 'File status' })
  @IsOptional()
  status?: any;

  @ApiPropertyOptional({ description: 'Access level' })
  @IsOptional()
  access_level?: any;

  @ApiPropertyOptional({ description: 'Min file size in bytes' })
  @IsOptional()
  min_size?: number;

  @ApiPropertyOptional({ description: 'Max file size in bytes' })
  @IsOptional()
  max_size?: number;

  @ApiPropertyOptional({ description: 'Created after date' })
  @IsOptional()
  created_after?: Date;

  @ApiPropertyOptional({ description: 'Created before date' })
  @IsOptional()
  created_before?: Date;

  @ApiPropertyOptional({ description: 'Include archived files', default: false })
  @IsOptional()
  include_archived?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 50 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Offset for pagination' })
  @IsOptional()
  offset?: number;
}