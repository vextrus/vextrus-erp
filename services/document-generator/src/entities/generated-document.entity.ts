import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DocumentTemplate, OutputFormat } from './document-template.entity';

export enum DocumentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('generated_documents')
@Index(['tenant_id', 'status'])
@Index(['reference_id', 'reference_type'])
@Index(['created_at'])
export class GeneratedDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenant_id: string;

  @Column()
  template_id: string;

  @ManyToOne(() => DocumentTemplate, (template) => template.generated_documents)
  @JoinColumn({ name: 'template_id' })
  template: DocumentTemplate;

  @Column()
  document_name: string;

  @Column({
    type: 'enum',
    enum: OutputFormat,
    enumName: 'output_format',
  })
  format: OutputFormat;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    enumName: 'document_status',
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column({ type: 'jsonb' })
  data: Record<string, any>;

  @Column({ nullable: true })
  file_path: string;

  @Column({ nullable: true })
  file_url: string;

  @Column({ nullable: true })
  file_size: number;

  @Column({ nullable: true })
  mime_type: string;

  @Column({ nullable: true })
  reference_type: string;

  @Column({ nullable: true })
  reference_id: string;

  @Column({ default: 'en' })
  language: string;

  @Column({ default: false })
  has_bengali_content: boolean;

  @Column({ nullable: true })
  error_message: string;

  @Column({ nullable: true })
  error_details: string;

  @Column({ nullable: true })
  processing_time_ms: number;

  @Column({ type: 'jsonb', nullable: true })
  generation_options: {
    watermark?: boolean;
    password_protected?: boolean;
    digital_signature?: boolean;
    compress?: boolean;
    merge_with?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  generated_by: string;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}