import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Directive, registerEnumType } from '@nestjs/graphql';

export enum ImportStatus {
  PENDING = 'pending',
  VALIDATING = 'validating',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PARTIAL = 'partial',
}

export enum ImportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json',
  XML = 'xml',
  TSV = 'tsv',
}

// Register enums for GraphQL
registerEnumType(ImportStatus, {
  name: 'ImportStatus',
});

registerEnumType(ImportFormat, {
  name: 'ImportFormat',
});

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('import_jobs')
@Index(['tenant_id', 'status'])
@Index(['entity_type', 'status'])
@Index(['created_at'])
export class ImportJob {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  @Index()
  tenant_id: string;

  @Field()
  @Column()
  job_name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field()
  @Column()
  entity_type: string;

  @Field(() => ImportFormat)
  @Column({
    type: 'enum',
    enum: ImportFormat,
  })
  format: ImportFormat;

  @Field(() => ImportStatus)
  @Column({
    type: 'enum',
    enum: ImportStatus,
    default: ImportStatus.PENDING,
  })
  status: ImportStatus;

  @Field()
  @Column()
  file_path: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  original_filename: string;

  @Field()
  @Column({ default: 0 })
  file_size: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  mapping_id: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  mapping_config: {
    fields: Record<string, string>;
    defaults?: Record<string, any>;
    transformations?: Record<string, string>;
    skip_rows?: number;
    sheet_name?: string;
    delimiter?: string;
  };

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  validation_rules: {
    required_fields?: string[];
    unique_fields?: string[];
    field_types?: Record<string, string>;
    custom_validators?: Record<string, string>;
  };

  @Field()
  @Column({ default: 0 })
  total_rows: number;

  @Field()
  @Column({ default: 0 })
  processed_rows: number;

  @Field()
  @Column({ default: 0 })
  successful_rows: number;

  @Field()
  @Column({ default: 0 })
  failed_rows: number;

  @Field()
  @Column({ default: 0 })
  skipped_rows: number;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  error_details: {
    row: number;
    field?: string;
    value?: any;
    error: string;
  }[];

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  error_file_path: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  summary: {
    created?: number;
    updated?: number;
    duplicates?: number;
    validation_errors?: Record<string, number>;
  };

  @Field()
  @Column({ default: false })
  rollback_on_error: boolean;

  @Field()
  @Column({ default: 100 })
  batch_size: number;

  @Field()
  @Column({ default: false })
  dry_run: boolean;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  options: {
    update_existing?: boolean;
    ignore_duplicates?: boolean;
    case_sensitive?: boolean;
    trim_values?: boolean;
    null_on_empty?: boolean;
    date_format?: string;
    number_format?: string;
  };

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  started_at: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  processing_time_ms: number;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Field({ nullable: true })
  @Column({ nullable: true })
  created_by: string;

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;
}