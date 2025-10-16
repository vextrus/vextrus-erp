import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Directive } from '@nestjs/graphql';
import { Organization } from './organization.entity';

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('divisions')
@Index('idx_division_org_code', ['organizationId', 'code'], { unique: true })
export class Division {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'uuid' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization, (org) => org.divisions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 50, nullable: true })
  code?: string;

  @Field({ nullable: true })
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    enum: ['residential', 'commercial', 'infrastructure', 'mixed']
  })
  type?: string;

  @Field(() => String)
  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @Field()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  managerId?: string;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}