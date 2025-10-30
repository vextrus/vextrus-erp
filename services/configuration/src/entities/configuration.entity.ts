import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Directive } from '@nestjs/graphql';

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('configurations')
@Index(['key', 'tenant_id'], { unique: true })
@Index(['tenant_id'])
@Index(['category'])
export class Configuration {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  key: string;

  @Field()
  @Column()
  value: string;

  @Field()
  @Column()
  category: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field()
  @Column()
  type: string; // 'string' | 'number' | 'boolean' | 'json' | 'array'

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  tenant_id: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  environment: string; // 'development' | 'staging' | 'production'

  @Field()
  @Column({ default: true })
  is_active: boolean;

  @Field()
  @Column({ default: false })
  is_encrypted: boolean;

  @Field(() => String, { nullable: true })
  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Field(() => String, { nullable: true })
  @Column('jsonb', { nullable: true })
  validation_rules: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  created_by: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  updated_by: string;
}