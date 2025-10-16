export interface StorageProvider {
  uploadFile(params: UploadParams): Promise<UploadResult>;
  downloadFile(params: DownloadParams): Promise<Buffer>;
  deleteFile(params: DeleteParams): Promise<void>;
  copyFile(params: CopyParams): Promise<CopyResult>;
  moveFile(params: MoveParams): Promise<MoveResult>;
  listFiles(params: ListParams): Promise<ListResult>;
  getFileMetadata(params: MetadataParams): Promise<FileMetadata>;
  generatePresignedUrl(params: PresignedUrlParams): Promise<string>;
  createBucket(params: CreateBucketParams): Promise<void>;
  deleteBucket(params: DeleteBucketParams): Promise<void>;
  setBucketPolicy(params: BucketPolicyParams): Promise<void>;
  getBucketStats(params: BucketStatsParams): Promise<BucketStats>;
  uploadMultipart(params: MultipartUploadParams): Promise<MultipartUploadResult>;
  completeMultipartUpload(params: CompleteMultipartParams): Promise<CompleteMultipartResult>;
  abortMultipartUpload(params: AbortMultipartParams): Promise<void>;
}

export interface UploadParams {
  bucket: string;
  key: string;
  body: Buffer | NodeJS.ReadableStream;
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  serverSideEncryption?: string;
  storageClass?: string;
  acl?: string;
}

export interface UploadResult {
  etag: string;
  versionId?: string;
  location: string;
  key: string;
  bucket: string;
}

export interface DownloadParams {
  bucket: string;
  key: string;
  versionId?: string;
  range?: string;
}

export interface DeleteParams {
  bucket: string;
  key: string;
  versionId?: string;
}

export interface CopyParams {
  sourceBucket: string;
  sourceKey: string;
  destinationBucket: string;
  destinationKey: string;
  metadata?: Record<string, string>;
  metadataDirective?: 'COPY' | 'REPLACE';
}

export interface CopyResult {
  etag: string;
  lastModified: Date;
  versionId?: string;
}

export interface MoveParams {
  sourceBucket: string;
  sourceKey: string;
  destinationBucket: string;
  destinationKey: string;
}

export interface MoveResult {
  etag: string;
  location: string;
}

export interface ListParams {
  bucket: string;
  prefix?: string;
  delimiter?: string;
  maxKeys?: number;
  continuationToken?: string;
  startAfter?: string;
}

export interface ListResult {
  contents: FileInfo[];
  isTruncated: boolean;
  nextContinuationToken?: string;
  keyCount: number;
}

export interface FileInfo {
  key: string;
  lastModified: Date;
  etag: string;
  size: number;
  storageClass?: string;
  owner?: {
    id: string;
    displayName: string;
  };
}

export interface MetadataParams {
  bucket: string;
  key: string;
  versionId?: string;
}

export interface FileMetadata {
  contentType: string;
  contentLength: number;
  etag: string;
  lastModified: Date;
  metadata: Record<string, string>;
  versionId?: string;
  storageClass?: string;
  serverSideEncryption?: string;
}

export interface PresignedUrlParams {
  bucket: string;
  key: string;
  operation: 'getObject' | 'putObject';
  expires: number;
  contentType?: string;
  responseContentDisposition?: string;
  responseContentType?: string;
}

export interface CreateBucketParams {
  bucket: string;
  region?: string;
  acl?: string;
  versioning?: boolean;
  encryption?: {
    algorithm: string;
    kmsKeyId?: string;
  };
}

export interface DeleteBucketParams {
  bucket: string;
  force?: boolean;
}

export interface BucketPolicyParams {
  bucket: string;
  policy: any;
}

export interface BucketStatsParams {
  bucket: string;
}

export interface BucketStats {
  size: number;
  objectCount: number;
  lastModified: Date;
  versioning: boolean;
  encryption: boolean;
}

export interface MultipartUploadParams {
  bucket: string;
  key: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface MultipartUploadResult {
  uploadId: string;
  bucket: string;
  key: string;
}

export interface CompleteMultipartParams {
  bucket: string;
  key: string;
  uploadId: string;
  parts: {
    etag: string;
    partNumber: number;
  }[];
}

export interface CompleteMultipartResult {
  location: string;
  bucket: string;
  key: string;
  etag: string;
  versionId?: string;
}

export interface AbortMultipartParams {
  bucket: string;
  key: string;
  uploadId: string;
}