import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpStatus,
  HttpCode,
  Headers,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { StorageService } from '../services/storage.service';
import { ThumbnailService } from '../services/thumbnail.service';
import { UploadFileDto, GeneratePresignedUrlDto, BatchUploadDto, UploadChunkDto } from '../dto/upload-file.dto';
import { MoveFileDto, CopyFileDto, BatchOperationDto, ShareFileDto, SearchFilesDto } from '../dto/move-file.dto';
import { File } from '../entities/file.entity';

@ApiTags('Files')
@Controller('files')
export class FileController {
  constructor(
    private readonly storageService: StorageService,
    private readonly thumbnailService: ThumbnailService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        original_name: { type: 'string' },
        mime_type: { type: 'string' },
        parent_folder_id: { type: 'string' },
        description: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<File> {
    // Convert to CreateFileInput format
    const createFileInput = {
      tenantId,
      originalName: dto.original_name || file.originalname,
      bucket: this.storageService['getBucketName'](tenantId),
      mimeType: dto.mime_type || file.mimetype,
      size: dto.size || file.size,
      description: dto.description,
      parentFolderId: dto.parent_folder_id,
      accessLevel: dto.access_level,
      tags: dto.tags,
      createdBy: userId,
    };

    const uploadedFile = await this.storageService.uploadFile(createFileInput);

    // Generate thumbnail for images
    if (file.mimetype.startsWith('image/')) {
      const thumbnailUrl = await this.thumbnailService.generateThumbnail(
        uploadedFile,
        file.buffer,
        'medium'
      );
      if (thumbnailUrl) {
        uploadedFile.thumbnail_url = thumbnailUrl;
      }
    }

    return uploadedFile;
  }

  @Post('upload/batch')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple files' })
  async uploadBatch(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: BatchUploadDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<File[]> {
    const uploadedFiles: File[] = [];

    for (const file of files) {
      const createFileInput = {
        tenantId,
        originalName: file.originalname,
        bucket: this.storageService['getBucketName'](tenantId),
        mimeType: file.mimetype,
        size: file.size,
        parentFolderId: dto.parent_folder_id,
        accessLevel: dto.common_access_level,
        tags: dto.common_tags,
        createdBy: userId,
      };

      const uploadedFile = await this.storageService.uploadFile(createFileInput);
      uploadedFiles.push(uploadedFile);
    }

    return uploadedFiles;
  }

  @Post('upload/chunk')
  @UseInterceptors(FileInterceptor('chunk'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload file chunk for large files' })
  async uploadChunk(
    @UploadedFile() chunk: Express.Multer.File,
    @Body() dto: UploadChunkDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<{ status: string; chunk_number: number }> {
    // Implementation for chunked upload
    // This would typically store chunks temporarily and assemble when all chunks are received
    return {
      status: 'received',
      chunk_number: dto.chunk_number,
    };
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a file' })
  async downloadFile(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.storageService.findById(id);
    const downloadUrl = await this.storageService.getDownloadUrl(id);

    res.set({
      'Content-Type': file.mime_type || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${file.original_name}"`,
    });

    // For now, redirect to the presigned URL
    res.redirect(downloadUrl);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file metadata' })
  async getFile(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<File> {
    return await this.storageService['findFileByIdAndTenant'](id, tenantId);
  }

  @Put(':id/move')
  @ApiOperation({ summary: 'Move file to another location' })
  async moveFile(
    @Param('id') id: string,
    @Body() dto: MoveFileDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<File> {
    return await this.storageService.moveFile(id, dto.target_folder_id);
  }

  @Post(':id/copy')
  @ApiOperation({ summary: 'Copy file to another location' })
  async copyFile(
    @Param('id') id: string,
    @Body() dto: CopyFileDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<File> {
    // Copy functionality - create a new file with same content
    const originalFile = await this.storageService.findById(id);
    const createFileInput = {
      tenantId,
      originalName: dto.new_name || originalFile.original_name,
      bucket: this.storageService.getBucketName(tenantId),
      mimeType: originalFile.mime_type,
      size: originalFile.size,
      description: originalFile.description,
      parentFolderId: dto.target_folder_id,
      accessLevel: originalFile.access_level,
      tags: originalFile.tags,
      createdBy: userId,
    };
    return await this.storageService.uploadFile(createFileInput);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(
    @Param('id') id: string,
    @Query('permanent') permanent: boolean,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<void> {
    await this.storageService.deleteFile(id, !permanent);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Perform batch operations on files' })
  async batchOperation(
    @Body() dto: BatchOperationDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const fileId of dto.file_ids) {
      try {
        switch (dto.operation) {
          case 'delete':
            await this.storageService.deleteFile(fileId, true);
            break;
          case 'move':
            if (dto.target_folder_id) {
              await this.storageService.moveFile(fileId, dto.target_folder_id);
            }
            break;
          case 'copy':
            if (dto.target_folder_id) {
              const originalFile = await this.storageService.findById(fileId);
              const createFileInput = {
                tenantId,
                originalName: originalFile.original_name,
                bucket: this.storageService.getBucketName(tenantId),
                mimeType: originalFile.mime_type,
                size: originalFile.size,
                description: originalFile.description,
                parentFolderId: dto.target_folder_id,
                accessLevel: originalFile.access_level,
                tags: originalFile.tags,
                createdBy: userId,
              };
              await this.storageService.uploadFile(createFileInput);
            }
            break;
          case 'archive':
            const file = await this.storageService.findById(fileId);
            file.status = 'archived' as any;
            await this.storageService['fileRepository'].save(file);
            break;
        }
        success.push(fileId);
      } catch (error: any) {
        failed.push(fileId);
      }
    }

    return { success, failed };
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Share a file' })
  async shareFile(
    @Param('id') id: string,
    @Body() dto: ShareFileDto,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<{ url: string; expires_at: Date }> {
    const shareResult = await this.storageService.shareFile(id, dto);
    const shareSettings = (shareResult as any).share_settings || {};
    return {
      url: shareSettings.public_url || await this.storageService.getDownloadUrl(id, 86400),
      expires_at: shareSettings.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }

  @Post('presigned-url')
  @ApiOperation({ summary: 'Generate presigned URL for direct upload/download' })
  async generatePresignedUrl(
    @Body() dto: GeneratePresignedUrlDto,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<{ url: string }> {
    const url = await this.storageService.getDownloadUrl(dto.file_id, dto.expires_in);
    return { url };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search files' })
  async searchFiles(
    @Query() dto: SearchFilesDto,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<{ files: File[]; total: number }> {
    const searchInput = {
      tenantId,
      query: dto.query,
      status: dto.status,
      accessLevel: dto.access_level,
      mimeType: dto.mime_type,
      parentFolderId: dto.parent_folder_id,
      tags: dto.tags,
      limit: dto.limit || 10,
      offset: dto.offset || 0,
    };
    const result = await this.storageService.searchFiles(searchInput);
    return {
      files: result.nodes,
      total: result.totalCount
    };
  }

  @Post(':id/version')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new version of the file' })
  async createVersion(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<any> {
    return await this.storageService.createFileVersion(id, {
      versionNumber: 1,
      changedBy: userId,
      changeDescription: 'New version uploaded'
    });
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get all versions of a file' })
  async getVersions(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<any[]> {
    const file = await this.storageService['findFileByIdAndTenant'](id, tenantId);
    return await this.storageService['fileVersionRepository'].find({
      where: { file_id: id },
      order: { version_number: 'DESC' },
    });
  }

  @Post(':id/restore/:versionId')
  @ApiOperation({ summary: 'Restore a specific version of the file' })
  async restoreVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<File> {
    // Implementation for version restoration
    const file = await this.storageService['findFileByIdAndTenant'](id, tenantId);
    const version = await this.storageService['fileVersionRepository'].findOne({
      where: { id: versionId, file_id: id },
    });

    if (!version) {
      throw new Error('Version not found');
    }

    // Copy version content to main file
    await this.storageService['minioProvider'].copyFile({
      sourceBucket: file.bucket,
      sourceKey: version.object_key,
      destinationBucket: file.bucket,
      destinationKey: file.object_key,
    });

    file.updated_by = userId;
    file.version++;
    return await this.storageService['fileRepository'].save(file);
  }
}