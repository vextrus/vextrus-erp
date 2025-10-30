import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import * as path from 'path';
import { MinioProvider } from '../providers/minio.provider';
import { File } from '../entities/file.entity';

@Injectable()
export class ThumbnailService {
  private readonly logger = new Logger(ThumbnailService.name);

  private readonly thumbnailConfigs = {
    small: { width: 150, height: 150 },
    medium: { width: 300, height: 300 },
    large: { width: 600, height: 600 },
  };

  private readonly supportedImageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ];

  constructor(private minioProvider: MinioProvider) {}

  async generateThumbnail(
    file: File,
    buffer: Buffer,
    size: 'small' | 'medium' | 'large' = 'medium'
  ): Promise<string | null> {
    if (!this.isImageFile(file.mime_type)) {
      this.logger.warn(`File ${file.id} is not an image, skipping thumbnail generation`);
      return null;
    }

    try {
      const config = this.thumbnailConfigs[size];
      const thumbnailBuffer = await sharp(buffer)
        .resize(config.width, config.height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbnailKey = this.generateThumbnailKey(file.object_key, size);
      
      await this.minioProvider.uploadFile({
        bucket: file.bucket,
        key: thumbnailKey,
        body: thumbnailBuffer,
        contentType: 'image/jpeg',
        metadata: {
          'original-file-id': file.id,
          'thumbnail-size': size,
        },
      });

      const thumbnailUrl = await this.minioProvider.generatePresignedUrl({
        bucket: file.bucket,
        key: thumbnailKey,
        operation: 'getObject',
        expires: 86400 * 7, // 7 days
      });

      return thumbnailUrl;
    } catch (error: any) {
      this.logger.error(`Failed to generate thumbnail for file ${file.id}:`, error);
      return null;
    }
  }

  async generateMultipleThumbnails(
    file: File,
    buffer: Buffer
  ): Promise<{ small?: string; medium?: string; large?: string }> {
    if (!this.isImageFile(file.mime_type)) {
      return {};
    }

    const thumbnails: { small?: string; medium?: string; large?: string } = {};

    for (const size of ['small', 'medium', 'large'] as const) {
      try {
        const thumbnail = await this.generateThumbnail(file, buffer, size);
        if (thumbnail) {
          thumbnails[size] = thumbnail;
        }
      } catch (error: any) {
        this.logger.error(`Failed to generate ${size} thumbnail for file ${file.id}:`, error);
      }
    }

    return thumbnails;
  }

  async generateDocumentPreview(file: File, buffer: Buffer): Promise<string | null> {
    if (!this.isDocumentFile(file.mime_type)) {
      this.logger.warn(`File ${file.id} is not a document, skipping preview generation`);
      return null;
    }

    try {
      // For PDF files, we would typically extract the first page
      // This is a simplified implementation
      if (file.mime_type === 'application/pdf') {
        // In a real implementation, you'd use a PDF library like pdf-lib or pdfjs
        this.logger.log(`Would generate PDF preview for file ${file.id}`);
        return null;
      }

      // For other document types, return null for now
      return null;
    } catch (error: any) {
      this.logger.error(`Failed to generate document preview for file ${file.id}:`, error);
      return null;
    }
  }

  async deleteThumbnails(file: File): Promise<void> {
    for (const size of ['small', 'medium', 'large']) {
      try {
        const thumbnailKey = this.generateThumbnailKey(file.object_key, size as any);
        await this.minioProvider.deleteFile({
          bucket: file.bucket,
          key: thumbnailKey,
        });
      } catch (error: any) {
        this.logger.warn(`Failed to delete ${size} thumbnail for file ${file.id}:`, error);
      }
    }
  }

  async getImageMetadata(buffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
    density?: number;
  } | null> {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: metadata.size || 0,
        density: metadata.density,
      };
    } catch (error: any) {
      this.logger.error('Failed to extract image metadata:', error);
      return null;
    }
  }

  async optimizeImage(
    buffer: Buffer,
    options: {
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<Buffer> {
    try {
      let pipeline = sharp(buffer);

      if (options.maxWidth || options.maxHeight) {
        pipeline = pipeline.resize(options.maxWidth, options.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      switch (options.format || 'jpeg') {
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality: options.quality || 85 });
          break;
        case 'png':
          pipeline = pipeline.png({ quality: options.quality || 90 });
          break;
        case 'webp':
          pipeline = pipeline.webp({ quality: options.quality || 85 });
          break;
      }

      return await pipeline.toBuffer();
    } catch (error: any) {
      this.logger.error('Failed to optimize image:', error);
      throw error;
    }
  }

  async extractImageColors(buffer: Buffer, count = 5): Promise<string[]> {
    try {
      const { dominant } = await sharp(buffer).stats();
      // This is a simplified implementation
      // In production, you'd use a proper color extraction library
      return [`rgb(${dominant.r}, ${dominant.g}, ${dominant.b})`];
    } catch (error: any) {
      this.logger.error('Failed to extract image colors:', error);
      return [];
    }
  }

  private isImageFile(mimeType: string): boolean {
    return this.supportedImageTypes.includes(mimeType);
  }

  private isDocumentFile(mimeType: string): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    return documentTypes.includes(mimeType);
  }

  private generateThumbnailKey(objectKey: string, size: string): string {
    const dir = path.dirname(objectKey);
    const filename = path.basename(objectKey);
    return `${dir}/thumbnails/${size}/${filename}.jpg`;
  }
}