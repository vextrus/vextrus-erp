import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import {
  StorageProvider,
  UploadParams,
  UploadResult,
  DownloadParams,
  DeleteParams,
  CopyParams,
  CopyResult,
  MoveParams,
  MoveResult,
  ListParams,
  ListResult,
  FileInfo,
  MetadataParams,
  FileMetadata,
  PresignedUrlParams,
  CreateBucketParams,
  DeleteBucketParams,
  BucketPolicyParams,
  BucketStatsParams,
  BucketStats,
  MultipartUploadParams,
  MultipartUploadResult,
  CompleteMultipartParams,
  CompleteMultipartResult,
  AbortMultipartParams
} from './storage.interface';

@Injectable()
export class MinioProvider implements StorageProvider {
  private readonly logger = new Logger(MinioProvider.name);
  private minioClient: Minio.Client;

  constructor(private configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.configService.get('MINIO_PORT', '9000')),
      useSSL: this.configService.get('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get('MINIO_SECRET_KEY', 'minioadmin'),
    });
  }

  async uploadFile(params: UploadParams): Promise<UploadResult> {
    const metadata = {
      'Content-Type': params.contentType || 'application/octet-stream',
      ...params.metadata,
    };

    const result = await this.minioClient.putObject(
      params.bucket,
      params.key,
      params.body as Buffer,
      undefined,
      metadata
    );

    if (params.tags) {
      await this.minioClient.setObjectTagging(
        params.bucket,
        params.key,
        params.tags
      );
    }

    return {
      etag: result.etag,
      versionId: result.versionId || undefined,
      location: `${params.bucket}/${params.key}`,
      key: params.key,
      bucket: params.bucket,
    };
  }

  async downloadFile(params: DownloadParams): Promise<Buffer> {
    const stream = await this.minioClient.getObject(
      params.bucket,
      params.key
    );

    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  async deleteFile(params: DeleteParams): Promise<void> {
    await this.minioClient.removeObject(
      params.bucket,
      params.key
    );
  }

  async copyFile(params: CopyParams): Promise<CopyResult> {
    const result = await this.minioClient.copyObject(
      params.destinationBucket,
      params.destinationKey,
      `/${params.sourceBucket}/${params.sourceKey}`,
      undefined
    );

    return {
      etag: (result as any).etag || '',
      lastModified: (result as any).lastModified || new Date(),
      versionId: (result as any).versionId || undefined,
    };
  }

  async moveFile(params: MoveParams): Promise<MoveResult> {
    const copyResult = await this.copyFile({
      sourceBucket: params.sourceBucket,
      sourceKey: params.sourceKey,
      destinationBucket: params.destinationBucket,
      destinationKey: params.destinationKey,
    });

    await this.deleteFile({
      bucket: params.sourceBucket,
      key: params.sourceKey,
    });

    return {
      etag: copyResult.etag,
      location: `${params.destinationBucket}/${params.destinationKey}`,
    };
  }

  async listFiles(params: ListParams): Promise<ListResult> {
    const stream = this.minioClient.listObjectsV2(
      params.bucket,
      params.prefix,
      params.delimiter === '/',
      params.startAfter
    );

    const contents: FileInfo[] = [];
    let isTruncated = false;

    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name) {
          contents.push({
            key: obj.name,
            lastModified: obj.lastModified,
            etag: obj.etag,
            size: obj.size,
          });
        }
      });

      stream.on('end', () => {
        resolve({
          contents,
          isTruncated,
          keyCount: contents.length,
        });
      });

      stream.on('error', reject);
    });
  }

  async getFileMetadata(params: MetadataParams): Promise<FileMetadata> {
    const stat = await this.minioClient.statObject(
      params.bucket,
      params.key
    );

    return {
      contentType: stat.metaData['content-type'] || 'application/octet-stream',
      contentLength: stat.size,
      etag: stat.etag,
      lastModified: stat.lastModified,
      metadata: stat.metaData,
      versionId: stat.versionId || undefined,
    };
  }

  async generatePresignedUrl(params: PresignedUrlParams): Promise<string> {
    const method = params.operation === 'putObject' ? 'PUT' : 'GET';
    
    const reqParams: any = {};
    if (params.responseContentDisposition) {
      reqParams['response-content-disposition'] = params.responseContentDisposition;
    }
    if (params.responseContentType) {
      reqParams['response-content-type'] = params.responseContentType;
    }

    return await this.minioClient.presignedUrl(
      method,
      params.bucket,
      params.key,
      params.expires,
      reqParams
    );
  }

  async createBucket(params: CreateBucketParams): Promise<void> {
    const exists = await this.minioClient.bucketExists(params.bucket);
    
    if (!exists) {
      await this.minioClient.makeBucket(
        params.bucket,
        params.region || 'us-east-1'
      );

      if (params.versioning) {
        await this.minioClient.setBucketVersioning(
          params.bucket,
          { Status: 'Enabled' }
        );
      }
    }
  }

  async deleteBucket(params: DeleteBucketParams): Promise<void> {
    if (params.force) {
      const objectsList = await this.listFiles({ bucket: params.bucket });
      for (const obj of objectsList.contents) {
        await this.deleteFile({ bucket: params.bucket, key: obj.key });
      }
    }

    await this.minioClient.removeBucket(params.bucket);
  }

  async setBucketPolicy(params: BucketPolicyParams): Promise<void> {
    const policyJson = JSON.stringify(params.policy);
    await this.minioClient.setBucketPolicy(params.bucket, policyJson);
  }

  async getBucketStats(params: BucketStatsParams): Promise<BucketStats> {
    const stream = this.minioClient.listObjectsV2(params.bucket, '', true);
    
    let size = 0;
    let objectCount = 0;
    let lastModified = new Date(0);

    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name) {
          size += obj.size;
          objectCount++;
          if (obj.lastModified > lastModified) {
            lastModified = obj.lastModified;
          }
        }
      });

      stream.on('end', async () => {
        try {
          const versioning = await this.minioClient.getBucketVersioning(params.bucket);
          
          resolve({
            size,
            objectCount,
            lastModified,
            versioning: versioning.Status === 'Enabled',
            encryption: false,
          });
        } catch (error: any) {
          resolve({
            size,
            objectCount,
            lastModified,
            versioning: false,
            encryption: false,
          });
        }
      });

      stream.on('error', reject);
    });
  }

  async uploadMultipart(params: MultipartUploadParams): Promise<MultipartUploadResult> {
    this.logger.log('Multipart upload initiated for ' + params.key);
    
    return {
      uploadId: `upload-${Date.now()}`,
      bucket: params.bucket,
      key: params.key,
    };
  }

  async completeMultipartUpload(params: CompleteMultipartParams): Promise<CompleteMultipartResult> {
    this.logger.log('Completing multipart upload for ' + params.key);
    
    return {
      location: `${params.bucket}/${params.key}`,
      bucket: params.bucket,
      key: params.key,
      etag: `etag-${Date.now()}`,
    };
  }

  async abortMultipartUpload(params: AbortMultipartParams): Promise<void> {
    this.logger.log('Aborting multipart upload for ' + params.key);
  }
}