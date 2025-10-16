import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { GeneratedDocument } from './generated-document.entity';

export enum TemplateType {
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  REPORT = 'report',
  LETTER = 'letter',
  CONTRACT = 'contract',
  QUOTATION = 'quotation',
  PURCHASE_ORDER = 'purchase_order',
  DELIVERY_NOTE = 'delivery_note',
  PAYSLIP = 'payslip',
  CUSTOM = 'custom',
}

export enum OutputFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  XLSX = 'xlsx',
  HTML = 'html',
  CSV = 'csv',
}

@Entity('document_templates')
@Index(['tenant_id', 'type'])
@Index(['name', 'tenant_id'], { unique: true })
export class DocumentTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenant_id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TemplateType,
    default: TemplateType.CUSTOM,
  })
  type: TemplateType;

  @Column({ type: 'text' })
  template_content: string;

  @Column({
    type: 'simple-array',
    default: 'pdf',
  })
  supported_formats: OutputFormat[];

  @Column({ type: 'jsonb', nullable: true })
  default_styles: {
    font_family?: string;
    font_size?: number;
    page_size?: 'A4' | 'A3' | 'Letter' | 'Legal';
    orientation?: 'portrait' | 'landscape';
    margins?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    bengali_font?: string;
    rtl_support?: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  variables: {
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
    required: boolean;
    default_value?: any;
    description?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  header_template: string;

  @Column({ type: 'jsonb', nullable: true })
  footer_template: string;

  @Column({ default: true })
  supports_bengali: boolean;

  @Column({ nullable: true })
  bengali_font_path: string;

  @Column({ type: 'jsonb', nullable: true })
  localization: {
    [key: string]: {
      template_content?: string;
      header_template?: string;
      footer_template?: string;
    };
  };

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  created_by: string;

  @Column({ nullable: true })
  updated_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => GeneratedDocument, (document) => document.template)
  generated_documents: GeneratedDocument[];
}