import { Entity, Column, Index, BeforeInsert, BeforeUpdate } from 'typeorm';
import { ObjectType, Field, ID, Directive } from '@nestjs/graphql';
import { BaseEntity } from './base.entity';
import { Matches, IsEmail, IsOptional } from 'class-validator';

export enum VendorType {
  SUPPLIER = 'supplier',
  CONTRACTOR = 'contractor',
  SERVICE_PROVIDER = 'service_provider',
  CONSULTANT = 'consultant',
  MANUFACTURER = 'manufacturer'
}

export enum VendorStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  SUSPENDED = 'suspended',
  BLACKLISTED = 'blacklisted',
  INACTIVE = 'inactive'
}

export enum VendorCategory {
  CONSTRUCTION_MATERIALS = 'construction_materials',
  HEAVY_EQUIPMENT = 'heavy_equipment',
  OFFICE_SUPPLIES = 'office_supplies',
  IT_SERVICES = 'it_services',
  PROFESSIONAL_SERVICES = 'professional_services',
  LOGISTICS = 'logistics',
  MAINTENANCE = 'maintenance',
  RAW_MATERIALS = 'raw_materials'
}

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('vendors')
@Index(['tenant_id', 'code'], { unique: true })
@Index(['tenant_id', 'tin'], { unique: true })
@Index(['tenant_id', 'status'])
@Index(['tenant_id', 'vendor_type'])
export class Vendor extends BaseEntity {
  @Field(() => ID)
  id: string;

  @Field()
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  name_bn: string; // Name in Bengali

  @Field()
  @Column({ type: 'enum', enum: VendorType })
  vendor_type: VendorType;

  @Field()
  @Column({ type: 'varchar', length: 12 })
  @Matches(/^\d{10,12}$/, { message: 'TIN must be 10-12 digits' })
  tin: string; // Tax Identification Number (Required for NBR)

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 9, nullable: true })
  @Matches(/^\d{9}$/, { message: 'BIN must be 9 digits' })
  bin: string; // Business Identification Number

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 50, nullable: true })
  trade_license_no: string;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  trade_license_expiry: Date;

  @Field()
  @Column({ type: 'varchar', length: 20 })
  @Matches(/^(\+?880|0)1[3-9]\d{8}$/, { message: 'Invalid Bangladesh phone number' })
  phone: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @Matches(/^(\+?880|0)1[3-9]\d{8}$/, { message: 'Invalid Bangladesh phone number' })
  phone_secondary: string;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  @IsEmail()
  email: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

  @Column({ type: 'jsonb' })
  address: {
    line1: string;
    line2?: string;
    area: string; // Thana/Upazila
    district: string;
    division: string;
    postal_code: string;
    country: string;
    address_bn?: { // Bengali address
      line1: string;
      area: string;
      district: string;
      division: string;
    };
  };

  @Column({ type: 'jsonb' })
  bank_account: {
    account_name: string;
    account_number: string;
    bank_name: string;
    branch: string;
    routing_number: string;
    swift_code?: string;
    mobile_banking?: {
      bkash?: string;
      nagad?: string;
      rocket?: string;
    };
  };

  @Column({ type: 'varchar', array: true })
  categories: VendorCategory[];

  @Column({ type: 'enum', enum: VendorStatus, default: VendorStatus.PENDING })
  status: VendorStatus;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ type: 'date', nullable: true })
  verified_at: Date;

  @Column({ type: 'uuid', nullable: true })
  verified_by: string;

  @Column({ type: 'boolean', default: false })
  blacklisted: boolean;

  @Column({ type: 'date', nullable: true })
  blacklisted_at: Date;

  @Column({ type: 'text', nullable: true })
  blacklist_reason: string;

  @Column({ type: 'jsonb' })
  payment_terms: {
    days: number; // Payment terms in days
    advance_percentage?: number; // Advance payment percentage
    retention_percentage?: number; // Retention money percentage
    penalty_percentage?: number; // Late payment penalty
  };

  @Column({ type: 'jsonb', nullable: true })
  tax_info: {
    vat_registration_no?: string;
    ait_rate?: number; // Advance Income Tax rate
    tax_exempted?: boolean;
    tax_exemption_certificate?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  compliance: {
    iso_certified?: boolean;
    iso_certificates?: string[];
    environmental_clearance?: boolean;
    fire_license?: boolean;
    other_certificates?: Array<{
      name: string;
      number: string;
      expiry_date?: Date;
    }>;
  };

  @Column({ type: 'jsonb', nullable: true })
  contact_persons: Array<{
    name: string;
    designation: string;
    department?: string;
    phone: string;
    email?: string;
    is_primary: boolean;
  }>;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number; // Vendor rating (0-5)

  @Column({ type: 'int', default: 0 })
  total_orders: number;

  @Column({ type: 'int', default: 0 })
  completed_orders: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_business_amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  on_time_delivery_rate: number; // Percentage

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  quality_score: number; // Percentage

  @Column({ type: 'jsonb', nullable: true })
  products_services: Array<{
    category: string;
    name: string;
    description?: string;
    unit_price?: number;
    lead_time_days?: number;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  documents: Array<{
    type: string; // 'trade_license', 'tin_certificate', 'bank_statement', etc.
    document_number?: string;
    file_path: string;
    uploaded_at: Date;
    expiry_date?: Date;
    verified: boolean;
  }>;

  @Column({ type: 'varchar', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  evaluation_history: Array<{
    evaluated_at: Date;
    evaluated_by: string;
    score: number;
    comments?: string;
    areas: {
      quality: number;
      delivery: number;
      pricing: number;
      communication: number;
      compliance: number;
    };
  }>;

  @Column({ type: 'date', nullable: true })
  contract_start_date: Date;

  @Column({ type: 'date', nullable: true })
  contract_end_date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  contract_value: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @BeforeInsert()
  @BeforeUpdate()
  validateBangladeshFormats() {
    // Normalize phone numbers
    if (this.phone) {
      this.phone = this.normalizePhoneNumber(this.phone);
    }
    if (this.phone_secondary) {
      this.phone_secondary = this.normalizePhoneNumber(this.phone_secondary);
    }

    // TIN is mandatory for vendors in Bangladesh
    if (!this.tin) {
      throw new Error('TIN is required for all vendors');
    }

    // Validate mobile banking numbers
    if (this.bank_account?.mobile_banking) {
      const mb = this.bank_account.mobile_banking;
      if (mb.bkash) mb.bkash = this.normalizePhoneNumber(mb.bkash);
      if (mb.nagad) mb.nagad = this.normalizePhoneNumber(mb.nagad);
      if (mb.rocket) mb.rocket = this.normalizePhoneNumber(mb.rocket);
    }
  }

  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digits
    let normalized = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (normalized.startsWith('1')) {
      normalized = '880' + normalized;
    } else if (normalized.startsWith('01')) {
      normalized = '880' + normalized.substring(1);
    } else if (!normalized.startsWith('880')) {
      normalized = '880' + normalized;
    }
    
    return '+' + normalized;
  }
}