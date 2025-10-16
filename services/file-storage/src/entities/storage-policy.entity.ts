import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum PolicyType {
  RETENTION = 'retention',
  LIFECYCLE = 'lifecycle',
  BACKUP = 'backup',
  ARCHIVE = 'archive',
  QUOTA = 'quota'
}

export enum PolicyScope {
  GLOBAL = 'global',
  TENANT = 'tenant',
  BUCKET = 'bucket',
  FOLDER = 'folder',
  USER = 'user'
}

@Entity('storage_policies')
@Index(['tenant_id', 'is_active'])
@Index(['policy_type', 'scope'])
export class StoragePolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  tenant_id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PolicyType
  })
  policy_type: PolicyType;

  @Column({
    type: 'enum',
    enum: PolicyScope,
    default: PolicyScope.TENANT
  })
  scope: PolicyScope;

  @Column({ type: 'varchar', length: 255, nullable: true })
  scope_id: string;

  @Column({ type: 'jsonb' })
  rules: {
    retention?: {
      days?: number;
      months?: number;
      years?: number;
      action: 'delete' | 'archive' | 'move';
      destination?: string;
    };
    lifecycle?: {
      transitions: {
        days: number;
        storage_class: string;
      }[];
      expiration?: {
        days: number;
        expired_object_delete_marker?: boolean;
      };
    };
    backup?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      retention_days: number;
      destination: string;
      encryption?: boolean;
    };
    archive?: {
      after_days: number;
      storage_class: string;
      retrieval_tier?: 'expedited' | 'standard' | 'bulk';
    };
    quota?: {
      max_storage_gb?: number;
      max_files?: number;
      max_file_size_mb?: number;
      warning_threshold?: number;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  conditions: {
    file_types?: string[];
    min_size_mb?: number;
    max_size_mb?: number;
    tags?: string[];
    metadata_match?: Record<string, any>;
    created_before?: Date;
    accessed_before?: Date;
  };

  @Column({ type: 'jsonb', nullable: true })
  actions: {
    notifications?: {
      email?: string[];
      webhook?: string;
      events?: string[];
    };
    auto_tag?: string[];
    move_to_folder?: string;
    change_access_level?: string;
  };

  @Column({ type: 'integer', default: 0 })
  priority: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_default: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_applied_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  statistics: {
    files_affected?: number;
    storage_saved_gb?: number;
    last_run_duration_ms?: number;
    errors?: number;
  };

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @Column({ type: 'uuid', nullable: true })
  updated_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}