import { IsString, IsEmail, IsOptional, IsNumber, ValidateNested, IsObject, Matches, MinLength, MaxLength, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerType } from '../entities/customer.entity';

class BengaliAddressDto {
  @ApiProperty({ description: 'Address line 1 in Bengali' })
  @IsString()
  line1: string;

  @ApiProperty({ description: 'Area in Bengali' })
  @IsString()
  area: string;

  @ApiProperty({ description: 'District in Bengali' })
  @IsString()
  district: string;

  @ApiProperty({ description: 'Division in Bengali' })
  @IsString()
  division: string;
}

class AddressDto {
  @ApiProperty({ description: 'Address line 1' })
  @IsString()
  line1: string;

  @ApiPropertyOptional({ description: 'Address line 2' })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty({ description: 'Area/Thana/Upazila' })
  @IsString()
  area: string;

  @ApiProperty({ description: 'District' })
  @IsString()
  district: string;

  @ApiProperty({ description: 'Division' })
  @IsString()
  division: string;

  @ApiProperty({ description: 'Postal code' })
  @IsString()
  postal_code: string;

  @ApiProperty({ description: 'Country', default: 'Bangladesh' })
  @IsString()
  country: string = 'Bangladesh';

  @ApiPropertyOptional({ description: 'Bengali address' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BengaliAddressDto)
  address_bn?: BengaliAddressDto;
}

class PaymentTermsDto {
  @ApiProperty({ description: 'Payment due in X days', example: 30 })
  @IsNumber()
  days: number;

  @ApiPropertyOptional({ description: 'Early payment discount percentage' })
  @IsOptional()
  @IsNumber()
  discount_percentage?: number;

  @ApiPropertyOptional({ description: 'Days for early payment discount' })
  @IsOptional()
  @IsNumber()
  discount_days?: number;

  @ApiPropertyOptional({ description: 'Late payment fee percentage' })
  @IsOptional()
  @IsNumber()
  late_fee_percentage?: number;
}

export class CreateCustomerDto {
  @ApiProperty({ description: 'Unique customer code', example: 'CUST-001' })
  @IsString()
  @Matches(/^[A-Z0-9-]+$/, { message: 'Code must contain only uppercase letters, numbers, and hyphens' })
  code: string;

  @ApiProperty({ description: 'Customer name' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Customer name in Bengali' })
  @IsOptional()
  @IsString()
  name_bn?: string;

  @ApiPropertyOptional({ description: 'Customer type', enum: CustomerType })
  @IsOptional()
  @IsEnum(CustomerType)
  customer_type?: CustomerType;

  @ApiPropertyOptional({ description: 'Bangladesh Tax Identification Number (10-12 digits)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10,12}$/, { message: 'TIN must be 10-12 digits' })
  tin?: string;

  @ApiPropertyOptional({ description: 'Business Identification Number (9 digits)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{9}$/, { message: 'BIN must be 9 digits' })
  bin?: string;

  @ApiPropertyOptional({ description: 'National ID (10-17 digits)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10,17}$/, { message: 'NID must be between 10 and 17 digits' })
  nid?: string;

  @ApiProperty({ description: 'Phone number (Bangladesh format)', example: '+8801712345678' })
  @IsString()
  @Matches(/^(\+?880|0)1[3-9]\d{8}$/, { message: 'Invalid Bangladesh phone number' })
  phone: string;

  @ApiPropertyOptional({ description: 'Secondary phone number' })
  @IsOptional()
  @IsString()
  @Matches(/^(\+?880|0)1[3-9]\d{8}$/, { message: 'Invalid Bangladesh phone number' })
  phone_secondary?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Customer address', type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiPropertyOptional({ description: 'Billing address', type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  billing_address?: AddressDto;

  @ApiPropertyOptional({ description: 'Shipping address', type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  shipping_address?: AddressDto;

  @ApiProperty({ description: 'Credit limit in BDT', example: 1000000 })
  @IsNumber()
  credit_limit: number;

  @ApiProperty({ description: 'Payment terms', type: PaymentTermsDto })
  @ValidateNested()
  @Type(() => PaymentTermsDto)
  payment_terms: PaymentTermsDto;
}