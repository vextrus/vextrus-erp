import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Directive } from '@nestjs/graphql';
import { Division } from './division.entity';

export interface OrganizationSettings {
  timezone: string;
  currency: string;
  language: string;
  fiscalYear: {
    start: string;
    end: string;
  };
  dateFormat: string;
  numberFormat: string;
  vatRate?: number;
  taxSettings?: {
    vatEnabled: boolean;
    taxEnabled: boolean;
    withholdingTaxRate?: number;
  };
  complianceSettings?: {
    requireTin: boolean;
    requireBin: boolean;
    requireNid: boolean;
    requireTradeLicense: boolean;
  };
}

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('organizations')
@Index('idx_organization_slug', ['slug'], { unique: true })
@Index('idx_organization_tenant', ['id', 'isActive'])
export class Organization {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Field()
  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Field()
  @Column({
    type: 'varchar',
    length: 50,
    default: 'construction',
    enum: ['construction', 'real-estate', 'both']
  })
  type: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', default: {} })
  settings: OrganizationSettings;

  @Field()
  @Column({
    type: 'varchar',
    length: 50,
    default: 'basic',
    enum: ['basic', 'professional', 'enterprise']
  })
  subscriptionPlan: string;

  @Field()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  logoUrl?: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'jsonb', nullable: true })
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };

  // Bangladesh-specific fields for multi-tenant ERP
  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index('idx_organization_tin')
  tin?: string; // Tax Identification Number (10 digits)

  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index('idx_organization_bin')
  bin?: string; // Business Identification Number (9 digits)

  @Column({ type: 'varchar', length: 50, nullable: true })
  tradeLicenseNumber?: string;

  @Column({ type: 'date', nullable: true })
  tradeLicenseExpiry?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  regulatoryBody?: string; // RAJUK, CDA, KDA, RDA, CCC, etc.

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index('idx_organization_status')
  status: string; // active, suspended, pending, archived

  @Column({ type: 'int', default: 5 })
  maxUsers: number; // License limit for users

  @Column({ type: 'int', default: 1 })
  maxDivisions: number; // License limit for divisions

  @Column({ type: 'int', default: 100 })
  maxProjects: number; // License limit for projects

  @Column({ type: 'date', nullable: true })
  subscriptionExpiryDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  billingInfo?: {
    contactPerson: string;
    contactPhone: string;
    contactEmail: string;
    billingAddress?: string;
    paymentMethod?: string;
    bankAccount?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  features?: {
    inventory: boolean;
    accounting: boolean;
    hr: boolean;
    crm: boolean;
    projectManagement: boolean;
    documentManagement: boolean;
    reporting: boolean;
    mobileApp: boolean;
  };

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastModifiedBy?: string;

  @Field(() => [Division], { nullable: true })
  @OneToMany(() => Division, (division) => division.organization, {
    cascade: true,
  })
  divisions: Division[];

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}