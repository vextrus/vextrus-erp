import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Directive, registerEnumType } from '@nestjs/graphql';

export enum ExportStatus {
  PENDING = 'pending',
  QUERYING = 'querying',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json',
  XML = 'xml',
  PDF = 'pdf',
  TSV = 'tsv',
}

// Register enums for GraphQL
registerEnumType(ExportStatus, {
  name: 'ExportStatus',
});

registerEnumType(ExportFormat, {
  name: 'ExportFormat',
});

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('export_jobs')
@Index(['tenant_id', 'status'])
@Index(['entity_type', 'status'])
@Index(['created_at'])
export class ExportJob {
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

  @Field(() => ExportFormat)
  @Column({
    type: 'enum',
    enum: ExportFormat,
  })
  format: ExportFormat;

  @Field(() => ExportStatus)
  @Column({
    type: 'enum',
    enum: ExportStatus,
    default: ExportStatus.PENDING,
  })
  status: ExportStatus;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  query_params: {
    filters?: Record<string, any>;
    sort?: { field: string; order: 'ASC' | 'DESC' }[];
    fields?: string[];
    relations?: string[];
    date_range?: {
      field: string;
      from: Date;
      to: Date;
    };
  };

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  export_config: {
    headers?: Record<string, string>;
    field_mapping?: Record<string, string>;
    date_format?: string;
    number_format?: string;
    boolean_format?: { true: string; false: string };
    null_value?: string;
    delimiter?: string;
    include_headers?: boolean;
    sheet_name?: string;
  };

  @Field()
  @Column({ default: 0 })
  total_records: number;

  @Field()
  @Column({ default: 0 })
  processed_records: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  file_path: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  file_url: string;

  @Field()
  @Column({ default: 0 })
  file_size: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  mime_type: string;

  @Field()
  @Column({ default: 1000 })
  batch_size: number;

  @Field()
  @Column({ default: false })
  compress: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  compression_type: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  schedule_config: {
    cron?: string;
    recurring?: boolean;
    next_run?: Date;
  };

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  notification_config: {
    email?: string[];
    on_complete?: boolean;
    on_failure?: boolean;
  };

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  error_details: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  started_at: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  processing_time_ms: number;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  expires_at: Date;

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