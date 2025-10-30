import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum TemplateType {
  INVOICE = 'invoice',
  PURCHASE_ORDER = 'purchase_order',
  SALES_ORDER = 'sales_order',
  RECEIPT = 'receipt',
  REPORT = 'report',
  PAYSLIP = 'payslip',
  CUSTOM = 'custom',
}

export enum OutputFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  WORD = 'word',
  CSV = 'csv',
  HTML = 'html',
}

@Entity('templates')
@Index(['tenant_id', 'is_active'])
export class Template {
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

  @Column({
    type: 'enum',
    enum: OutputFormat,
    default: OutputFormat.PDF,
  })
  format: OutputFormat;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  category: string;

  @Column('jsonb', { nullable: true })
  variables: any;

  @Column('jsonb', { nullable: true })
  metadata: any;

  @Column('jsonb', { nullable: true })
  settings: any;

  @Column({ default: false })
  is_default: boolean;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  usage_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
