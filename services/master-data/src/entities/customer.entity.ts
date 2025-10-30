import { Entity, Column, Index, OneToMany, BeforeInsert, BeforeUpdate } from 'typeorm';
import { ObjectType, Field, ID, Directive } from '@nestjs/graphql';
import { BaseEntity } from './base.entity';
import { IsEmail, IsPhoneNumber, IsOptional, Length, Matches } from 'class-validator';

export enum CustomerType {
  INDIVIDUAL = 'individual',
  CORPORATE = 'corporate',
  GOVERNMENT = 'government',
  NGO = 'ngo'
}

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BLACKLISTED = 'blacklisted'
}

@ObjectType({
  description: 'Customer entity for master data management',
})
@Directive('@key(fields: "id")')
@Entity('customers')
@Index(['tenant_id', 'code'], { unique: true })
@Index(['tenant_id', 'tin'])
@Index(['tenant_id', 'nid'])
@Index(['tenant_id', 'phone'])
@Index(['tenant_id', 'email'])
export class Customer extends BaseEntity {
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
  @Column({ type: 'enum', enum: CustomerType, default: CustomerType.INDIVIDUAL })
  customer_type: CustomerType;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 12, nullable: true })
  @Matches(/^\d{10,12}$/, { message: 'TIN must be 10-12 digits' })
  tin: string; // Tax Identification Number

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 9, nullable: true })
  @Matches(/^\d{9}$/, { message: 'BIN must be 9 digits' })
  bin: string; // Business Identification Number

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 17, nullable: true })
  @Matches(/^\d{10,17}$/, { message: 'NID must be 10-17 digits' })
  nid: string; // National ID

  @Field()
  @Column({ type: 'varchar', length: 20 })
  @Matches(/^(\+?880|0)1[3-9]\d{8}$/, { message: 'Invalid Bangladesh phone number' })
  phone: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @Matches(/^(\+?880|0)1[3-9]\d{8}$/, { message: 'Invalid Bangladesh phone number' })
  phone_secondary: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsEmail()
  @IsOptional()
  email: string;

  @Field(() => String)
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

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  billing_address: {
    line1: string;
    line2?: string;
    area: string;
    district: string;
    division: string;
    postal_code: string;
    country: string;
  };

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  shipping_address: {
    line1: string;
    line2?: string;
    area: string;
    district: string;
    division: string;
    postal_code: string;
    country: string;
  };

  @Field(() => Number)
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  credit_limit: number;

  @Field(() => Number)
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  outstanding_balance: number;

  @Field(() => String)
  @Column({ type: 'jsonb' })
  payment_terms: {
    days: number; // Payment due in X days
    discount_percentage?: number; // Early payment discount
    discount_days?: number; // Days for early payment discount
    late_fee_percentage?: number; // Late payment fee
  };

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  bank_details: {
    account_name: string;
    account_number: string;
    bank_name: string;
    branch: string;
    routing_number: string;
    swift_code?: string;
  };

  @Field()
  @Column({ type: 'enum', enum: CustomerStatus, default: CustomerStatus.ACTIVE })
  status: CustomerStatus;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  contact_persons: Array<{
    name: string;
    designation: string;
    phone: string;
    email?: string;
    is_primary: boolean;
  }>;

  @Field(() => [String])
  @Column({ type: 'varchar', array: true, default: '{}' })
  tags: string[];

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  preferences: {
    communication_language: 'en' | 'bn';
    invoice_delivery: 'email' | 'sms' | 'print';
    payment_reminders: boolean;
    marketing_consent: boolean;
  };

  @Field(() => Date, { nullable: true })
  @Column({ type: 'date', nullable: true })
  first_transaction_date: Date;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'date', nullable: true })
  last_transaction_date: Date;

  @Field(() => Number)
  @Column({ type: 'int', default: 0 })
  total_transactions: number;

  @Field(() => Number)
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_revenue: number;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 50, nullable: true })
  customer_group: string;

  @Field(() => Number)
  @Column({ type: 'int', default: 0 })
  loyalty_points: number;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 20, nullable: true })
  discount_group: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  kyc_documents: Array<{
    type: string;
    document_number: string;
    issue_date: Date;
    expiry_date?: Date;
    verified: boolean;
    verified_by?: string;
    verified_at?: Date;
  }>;

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

    // Validate TIN for corporate customers
    if (this.customer_type === CustomerType.CORPORATE && !this.tin) {
      throw new Error('TIN is required for corporate customers');
    }

    // Validate NID for individual customers
    if (this.customer_type === CustomerType.INDIVIDUAL && !this.nid && !this.tin) {
      throw new Error('NID or TIN is required for individual customers');
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