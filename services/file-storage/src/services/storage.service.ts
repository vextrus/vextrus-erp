import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, IsNull, Not } from 'typeorm';
import { File, FileStatus, FileAccessLevel } from '../entities/file.entity';
import { MinioProvider } from '../providers/minio.provider';
import { ConfigService } from '@nestjs/config';
import {
  CreateFileInput,
  UpdateFileInput,
  SearchFileInput,
  ShareFileInput,
  FileConnection
} from '../dto/file.dto';
import * as crypto from 'crypto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private minioProvider: MinioProvider,
    private configService: ConfigService,
    @Inject('KAFKA_CLIENT') private kafkaClient: ClientProxy,
  ) {}

  async findById(id: string): Promise<File> {
    const file = await this.fileRepository.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }
    return file;
  }

  async findByTenant(tenantId: string): Promise<File[]> {
    return this.fileRepository.find({
      where: {
        tenant_id: tenantId,
        status: FileStatus.ACTIVE
      },
      order: { created_at: 'DESC' }
    });
  }

  async findByFolder(tenantId: string, folderId?: string): Promise<File[]> {
    return this.fileRepository.find({
      where: {
        tenant_id: tenantId,
        parent_folder_id: folderId || IsNull(),
        status: FileStatus.ACTIVE
      },
      order: { original_name: 'ASC' }
    });
  }

  async searchFiles(input: SearchFileInput): Promise<FileConnection> {
    const query = this.fileRepository.createQueryBuilder('file');

    query.where('file.tenant_id = :tenantId', { tenantId: input.tenantId });

    if (input.query) {
      query.andWhere('(file.original_name ILIKE :query OR file.description ILIKE :query)',
        { query: `%${input.query}%` });
    }

    if (input.status) {
      query.andWhere('file.status = :status', { status: input.status });
    }

    if (input.accessLevel) {
      query.andWhere('file.access_level = :accessLevel', { accessLevel: input.accessLevel });
    }

    if (input.mimeType) {
      query.andWhere('file.mime_type LIKE :mimeType', { mimeType: `${input.mimeType}%` });
    }

    if (input.parentFolderId !== undefined) {
      if (input.parentFolderId === null) {
        query.andWhere('file.parent_folder_id IS NULL');
      } else {
        query.andWhere('file.parent_folder_id = :parentFolderId',
          { parentFolderId: input.parentFolderId });
      }
    }

    if (input.tags && input.tags.length > 0) {
      query.andWhere('file.tags @> :tags', { tags: JSON.stringify(input.tags) });
    }

    const totalCount = await query.getCount();

    query.skip(input.offset || 0).take(input.limit || 10);
    query.orderBy('file.created_at', 'DESC');

    const files = await query.getMany();

    return {
      nodes: files,
      totalCount,
      hasNextPage: (input.offset || 0) + (input.limit || 10) < totalCount,
      hasPreviousPage: (input.offset || 0) > 0
    };
  }

  async findPaginated(
    tenantId: string,
    limit: number,
    offset: number
  ): Promise<FileConnection> {
    const [files, totalCount] = await this.fileRepository.findAndCount({
      where: { tenant_id: tenantId, status: FileStatus.ACTIVE },
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit
    });

    return {
      nodes: files,
      totalCount,
      hasNextPage: offset + limit < totalCount,
      hasPreviousPage: offset > 0
    };
  }

  async getDownloadUrl(id: string, expiresIn: number = 3600): Promise<string> {
    const file = await this.findById(id);

    try {
      return await this.minioProvider.generatePresignedUrl({
        bucket: file.bucket,
        key: file.object_key,
        operation: 'getObject',
        expires: expiresIn
      });
    } catch (error: any) {
      this.logger.error(`Failed to generate download URL: ${error?.message || error}`);
      throw new BadRequestException('Failed to generate download URL');
    }
  }

  async uploadFile(input: CreateFileInput): Promise<File> {
    const bucket = this.getBucketName(input.tenantId);
    const objectKey = this.generateObjectKey(input.tenantId, input.originalName);

    try {
      // Ensure bucket exists
      await this.minioProvider.createBucket({ bucket });

      // Create file record with uploading status
      const fileEntity = this.fileRepository.create({
        tenant_id: input.tenantId,
        original_name: input.originalName,
        file_path: `${bucket}/${objectKey}`,
        bucket,
        object_key: objectKey,
        mime_type: input.mimeType,
        size: input.size,
        status: FileStatus.UPLOADING,
        access_level: input.accessLevel || FileAccessLevel.PRIVATE,
        description: input.description,
        parent_folder_id: input.parentFolderId,
        tags: input.tags,
        created_by: input.createdBy,
      });

      const savedFile = await this.fileRepository.save(fileEntity);

      // Emit file upload event
      this.kafkaClient.emit('file.uploaded', {
        fileId: savedFile.id,
        tenantId: input.tenantId,
        fileName: input.originalName,
        size: input.size,
        mimeType: input.mimeType,
      });

      // Mark as active after successful upload
      savedFile.status = FileStatus.ACTIVE;
      return await this.fileRepository.save(savedFile);
    } catch (error: any) {
      this.logger.error(`Failed to upload file: ${error?.message || error}`);
      throw new BadRequestException('Failed to upload file');
    }
  }

  async updateFile(id: string, input: UpdateFileInput): Promise<File> {
    const file = await this.findById(id);

    if (input.originalName) file.original_name = input.originalName;
    if (input.description !== undefined) file.description = input.description;
    if (input.accessLevel) file.access_level = input.accessLevel;
    if (input.tags) file.tags = input.tags;
    if (input.updatedBy) file.updated_by = input.updatedBy;

    return await this.fileRepository.save(file);
  }

  async moveFile(id: string, targetFolderId?: string): Promise<File> {
    const file = await this.findById(id);
    file.parent_folder_id = targetFolderId || null;

    const movedFile = await this.fileRepository.save(file);

    // Emit file moved event
    this.kafkaClient.emit('file.moved', {
      fileId: id,
      oldFolderId: file.parent_folder_id,
      newFolderId: targetFolderId,
    });

    return movedFile;
  }

  async createFileVersion(id: string, input: any): Promise<any> {
    const file = await this.findById(id);
    // Implement versioning logic here
    return {
      file_id: id,
      version_number: 1,
      created_at: new Date(),
      changed_by: input.changedBy,
      change_description: input.changeDescription
    };
  }

  async shareFile(id: string, input: ShareFileInput): Promise<File> {
    const file = await this.findById(id);

    file.share_settings = {
      public_url: input.publicUrl,
      expires_at: input.expiresAt,
      password: input.password,
      max_downloads: input.maxDownloads,
      current_downloads: 0
    };

    file.access_level = FileAccessLevel.PUBLIC;

    const sharedFile = await this.fileRepository.save(file);

    // Emit file shared event
    this.kafkaClient.emit('file.shared', {
      fileId: id,
      publicUrl: input.publicUrl,
      expiresAt: input.expiresAt,
    });

    return sharedFile;
  }

  async archiveFile(id: string): Promise<File> {
    const file = await this.findById(id);
    file.status = FileStatus.ARCHIVED;

    const archivedFile = await this.fileRepository.save(file);

    // Emit file archived event
    this.kafkaClient.emit('file.archived', {
      fileId: id,
      archivedAt: new Date(),
    });

    return archivedFile;
  }

  async deleteFile(id: string, permanent: boolean = false): Promise<boolean> {
    const file = await this.findById(id);

    if (permanent) {
      // Delete from storage
      try {
        await this.minioProvider.deleteFile({
          bucket: file.bucket,
          key: file.object_key,
        });
      } catch (error: any) {
        this.logger.error(`Failed to delete file from storage: ${error?.message || error}`);
      }

      // Delete from database
      await this.fileRepository.remove(file);

      // Emit file deleted event
      this.kafkaClient.emit('file.deleted.permanent', {
        fileId: id,
        deletedAt: new Date(),
      });
    } else {
      // Soft delete
      file.status = FileStatus.DELETED;
      file.deleted_at = new Date();
      await this.fileRepository.save(file);

      // Emit file deleted event
      this.kafkaClient.emit('file.deleted.soft', {
        fileId: id,
        deletedAt: new Date(),
      });
    }

    return true;
  }

  async restoreFile(id: string): Promise<File> {
    const file = await this.findById(id);

    if (file.status !== FileStatus.DELETED) {
      throw new BadRequestException('File is not deleted');
    }

    file.status = FileStatus.ACTIVE;
    file.deleted_at = null as any;

    const restoredFile = await this.fileRepository.save(file);

    // Emit file restored event
    this.kafkaClient.emit('file.restored', {
      fileId: id,
      restoredAt: new Date(),
    });

    return restoredFile;
  }

  async generateThumbnail(id: string): Promise<string> {
    const file = await this.findById(id);

    // Check if file is an image
    if (!file.mime_type?.startsWith('image/')) {
      throw new BadRequestException('File is not an image');
    }

    const thumbnailKey = `thumbnails/${file.object_key}`;
    const thumbnailUrl = `${this.configService.get('MINIO_ENDPOINT')}/${file.bucket}/${thumbnailKey}`;

    // Update file with thumbnail URL
    file.thumbnail_url = thumbnailUrl;
    await this.fileRepository.save(file);

    // Emit thumbnail generation event for async processing
    this.kafkaClient.emit('file.thumbnail.generate', {
      fileId: id,
      sourceKey: file.object_key,
      thumbnailKey,
      bucket: file.bucket,
    });

    return thumbnailUrl;
  }

  async scanForVirus(id: string): Promise<File> {
    const file = await this.findById(id);

    // Update virus scan status to pending
    file.virus_scan = {
      status: 'pending',
      scanned_at: new Date(),
      engine: 'ClamAV',
      details: undefined
    };

    const updatedFile = await this.fileRepository.save(file);

    // Emit virus scan event for async processing
    this.kafkaClient.emit('file.virus.scan', {
      fileId: id,
      bucket: file.bucket,
      objectKey: file.object_key,
    });

    return updatedFile;
  }

  async cleanupExpiredFiles(): Promise<boolean> {
    try {
      // Find expired files
      const expiredFiles = await this.fileRepository.find({
        where: {
          expires_at: Not(IsNull()),
          status: FileStatus.ACTIVE
        }
      });

      const now = new Date();
      const filesToDelete = expiredFiles.filter(file => file.expires_at < now);

      for (const file of filesToDelete) {
        await this.deleteFile(file.id, true);
      }

      this.logger.log(`Cleaned up ${filesToDelete.length} expired files`);

      return true;
    } catch (error: any) {
      this.logger.error(`Failed to cleanup expired files: ${error?.message || error}`);
      return false;
    }
  }

  getBucketName(tenantId: string): string {
    return `tenant-${tenantId}`;
  }

  private generateObjectKey(tenantId: string, fileName: string): string {
    const timestamp = Date.now();
    const hash = crypto.createHash('md5').update(`${tenantId}-${timestamp}`).digest('hex');
    const extension = fileName.split('.').pop();
    return `files/${hash}.${extension}`;
  }
}