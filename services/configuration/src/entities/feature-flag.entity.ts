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
@Entity('feature_flags')
@Index(['key', 'tenant_id'], { unique: true })
@Index(['tenant_id', 'enabled'])
export class FeatureFlag {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  key: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field()
  @Column({ default: false })
  enabled: boolean;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  tenant_id: string;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  user_id: string;

  @Field(() => String, { nullable: true })
  @Column('jsonb', { nullable: true })
  rules: {
    percentage?: number;
    userGroups?: string[];
    startDate?: Date;
    endDate?: Date;
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  };

  @Field(() => String, { nullable: true })
  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;
}