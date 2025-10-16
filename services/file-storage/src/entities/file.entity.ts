import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Int, Float, registerEnumType, Directive } from '@nestjs/graphql';

export enum FileStatus {
  UPLOADING = 'uploading',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
  QUARANTINED = 'quarantined',
  FAILED = 'failed'
}

export enum FileAccessLevel {
  PRIVATE = 'private',
  TENANT = 'tenant',
  PUBLIC = 'public',
  RESTRICTED = 'restricted'
}

// Register enums for GraphQL
registerEnumType(FileStatus, {
  name: 'FileStatus',
  description: 'The status of a file',
});

registerEnumType(FileAccessLevel, {
  name: 'FileAccessLevel',
  description: 'The access level of a file',
});

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('files')
@Index(['tenant_id', 'status'])
@Index(['bucket', 'object_key'])
@Index(['parent_folder_id'])
@Index(['created_by'])
export class File {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'uuid' })
  tenant_id: string;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  original_name: string;

  @Field()
  @Column({ type: 'varchar', length: 500 })
  file_path: string;

  @Field()
  @Column({ type: 'varchar', length: 100 })
  bucket: string;

  @Field()
  @Column({ type: 'varchar', length: 500 })
  object_key: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  mime_type: string;

  @Field(() => Float)
  @Column({ type: 'bigint' })
  size: number;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 64, nullable: true })
  checksum: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  encoding: string;

  @Field(() => FileStatus)
  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.UPLOADING
  })
  status: FileStatus;

  @Field(() => FileAccessLevel)
  @Column({
    type: 'enum',
    enum: FileAccessLevel,
    default: FileAccessLevel.PRIVATE
  })
  access_level: FileAccessLevel;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    pages?: number;
    format?: string;
    compression?: string;
    custom?: Record<string, any>;
  };

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  parent_folder_id: string | null;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnail_url: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 500, nullable: true })
  preview_url: string;

  @Field(() => Int)
  @Column({ type: 'integer', default: 1 })
  version: number;

  @Column({ type: 'boolean', default: false })
  is_versioned: boolean;

  @Column({ type: 'uuid', nullable: true })
  parent_version_id: string;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  retention_policy: {
    days?: number;
    action?: 'delete' | 'archive';
    notification?: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  virus_scan: {
    status?: 'pending' | 'clean' | 'infected' | 'error';
    scanned_at?: Date;
    engine?: string;
    details?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  processing_info: {
    status?: string;
    progress?: number;
    error?: string;
    completed_at?: Date;
  };

  @Column({ type: 'jsonb', nullable: true })
  share_settings: {
    public_url?: string;
    expires_at?: Date;
    password?: string;
    max_downloads?: number;
    current_downloads?: number;
  };

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @Column({ type: 'uuid', nullable: true })
  updated_by: string;

  @Column({ type: 'uuid', nullable: true })
  deleted_by: string;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  @Field()
  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => FileVersion, version => version.file)
  versions: FileVersion[];
}

@Entity('file_versions')
@Index(['file_id', 'version_number'])
export class FileVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  file_id: string;

  @ManyToOne(() => File, file => file.versions)
  @JoinColumn({ name: 'file_id' })
  file: File;

  @Column({ type: 'integer' })
  version_number: number;

  @Column({ type: 'varchar', length: 500 })
  object_key: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  checksum: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  change_notes: string;

  @Column({ type: 'uuid' })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;
}