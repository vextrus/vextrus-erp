import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Directive } from '@nestjs/graphql';
import { Organization } from './organization.entity';

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('tenants')
@Index('idx_tenant_organization', ['organizationId'])
@Index('idx_tenant_code', ['code'], { unique: true })
@Index('idx_tenant_status', ['status'])
export class Tenant {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Field()
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string; // Unique tenant code for isolation

  @Field()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  domain?: string; // Custom domain for tenant

  @Field()
  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string; // active, inactive, suspended, trial

  @Field(() => String)
  @Column({ type: 'jsonb', default: {} })
  settings: {
    timezone?: string;
    currency?: string;
    language?: string;
    dateFormat?: string;
    numberFormat?: string;
    fiscalYearStart?: string; // July for Bangladesh
    fiscalYearEnd?: string; // June for Bangladesh
    vatRate?: number; // 15% for Bangladesh
    withholdingTaxRate?: number;
  };

  @Field(() => String)
  @Column({ type: 'jsonb', default: {} })
  limits: {
    maxUsers?: number;
    maxTransactions?: number;
    maxStorage?: number; // in GB
    maxProjects?: number;
    maxInvoices?: number;
  };

  @Field(() => String)
  @Column({ type: 'jsonb', default: {} })
  usage: {
    currentUsers?: number;
    currentTransactions?: number;
    currentStorage?: number;
    currentProjects?: number;
    currentInvoices?: number;
    lastCalculated?: Date;
  };

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  companyInfo?: {
    legalName?: string;
    tradeName?: string;
    tin?: string; // Tax Identification Number
    bin?: string; // Business Identification Number
    tradeLicense?: string;
    incorporationDate?: Date;
    registrationNumber?: string;
  };

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  contactInfo?: {
    primaryContact?: string;
    email?: string;
    phone?: string;
    mobile?: string; // 01[3-9]-XXXXXXXX format
    fax?: string;
    website?: string;
  };

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  address?: {
    street?: string;
    area?: string; // Thana/Upazila
    city?: string;
    district?: string;
    division?: string;
    postalCode?: string;
    country?: string;
  };

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  bankInfo?: {
    bankName?: string;
    branchName?: string;
    accountName?: string;
    accountNumber?: string;
    routingNumber?: string;
    swiftCode?: string;
  };

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  subscriptionStartedAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  subscriptionEndsAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastActiveAt?: Date;

  @Field()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Field()
  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  lastModifiedBy?: string;

  @Field()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @Field()
  @Column({ type: 'int', default: 1 })
  version: number;
}