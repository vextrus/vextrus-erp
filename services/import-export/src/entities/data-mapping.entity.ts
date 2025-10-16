import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MappingType {
  IMPORT = 'import',
  EXPORT = 'export',
  BIDIRECTIONAL = 'bidirectional',
}

@Entity('data_mappings')
@Index(['tenant_id', 'entity_type'])
@Index(['name', 'tenant_id'], { unique: true })
export class DataMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenant_id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  entity_type: string;

  @Column({
    type: 'enum',
    enum: MappingType,
    default: MappingType.BIDIRECTIONAL,
  })
  mapping_type: MappingType;

  @Column({ type: 'jsonb' })
  field_mappings: {
    source_field: string;
    target_field: string;
    data_type?: string;
    required?: boolean;
    default_value?: any;
    transformation?: string;
    validation?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  transformations: {
    name: string;
    type: 'uppercase' | 'lowercase' | 'trim' | 'date_format' | 'number_format' | 'custom';
    config?: Record<string, any>;
    script?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  validation_rules: {
    field: string;
    rule: string;
    params?: any[];
    error_message?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  default_values: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  lookup_tables: {
    field: string;
    table: string;
    key_field: string;
    value_field: string;
    cache?: boolean;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  conditional_mappings: {
    condition: string;
    field_mappings: Record<string, string>;
  }[];

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_template: boolean;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'jsonb', nullable: true })
  sample_data: {
    input?: Record<string, any>[];
    output?: Record<string, any>[];
  };

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
}