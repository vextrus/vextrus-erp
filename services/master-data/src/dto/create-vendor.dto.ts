import { IsString, IsEmail, IsOptional, IsBoolean, IsArray, ValidateNested, IsObject, Matches, MinLength, MaxLength, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VendorCategory, VendorType } from '../entities/vendor.entity';

class BankAccountDto {
  @ApiProperty({ description: 'Bank name' })
  @IsString()
  bankName: string;

  @ApiProperty({ description: 'Branch name' })
  @IsString()
  branchName: string;

  @ApiProperty({ description: 'Account number' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ description: 'Account holder name' })
  @IsString()
  accountName: string;

  @ApiPropertyOptional({ description: 'Routing number' })
  @IsOptional()
  @IsString()
  routingNumber?: string;

  @ApiPropertyOptional({ description: 'SWIFT code' })
  @IsOptional()
  @IsString()
  swiftCode?: string;
}

class AddressDto {
  @ApiProperty({ description: 'Street address line 1' })
  @IsString()
  street1: string;

  @ApiPropertyOptional({ description: 'Street address line 2' })
  @IsOptional()
  @IsString()
  street2?: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'District' })
  @IsString()
  district: string;

  @ApiProperty({ description: 'Division' })
  @IsString()
  division: string;

  @ApiProperty({ description: 'Postal code' })
  @IsString()
  postalCode: string;

  @ApiPropertyOptional({ description: 'Country', default: 'Bangladesh' })
  @IsOptional()
  @IsString()
  country?: string = 'Bangladesh';
}

export class CreateVendorDto {
  @ApiProperty({ description: 'Unique vendor code', example: 'VEND-001' })
  @IsString()
  @Matches(/^[A-Z0-9-]+$/, { message: 'Code must contain only uppercase letters, numbers, and hyphens' })
  code: string;

  @ApiProperty({ description: 'Vendor name' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Vendor name in Bengali' })
  @IsOptional()
  @IsString()
  nameInBengali?: string;

  @ApiProperty({ description: 'Bangladesh Tax Identification Number (12 digits)' })
  @IsString()
  @Matches(/^\d{12}$/, { message: 'TIN must be exactly 12 digits' })
  tin: string;

  @ApiPropertyOptional({ description: 'Business Identification Number (9 digits)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{9}$/, { message: 'BIN must be exactly 9 digits' })
  bin?: string;

  @ApiProperty({ description: 'Contact phone number', example: '+8801712345678' })
  @IsString()
  @Matches(/^\+880\d{10}$/, { message: 'Phone must be in Bangladesh format: +880XXXXXXXXXX' })
  phone: string;

  @ApiProperty({ description: 'Contact email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Vendor address', type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({ description: 'Bank account details', type: BankAccountDto })
  @ValidateNested()
  @Type(() => BankAccountDto)
  bankAccount: BankAccountDto;

  @ApiProperty({ 
    description: 'Vendor categories', 
    enum: VendorCategory,
    isArray: true,
    example: [VendorCategory.CONSTRUCTION_MATERIALS] 
  })
  @IsArray()
  @IsEnum(VendorCategory, { each: true })
  categories: VendorCategory[];

  @ApiPropertyOptional({ description: 'Contact person name' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Contact person phone' })
  @IsOptional()
  @IsString()
  @Matches(/^\+880\d{10}$/, { message: 'Phone must be in Bangladesh format: +880XXXXXXXXXX' })
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Trade license number' })
  @IsOptional()
  @IsString()
  tradeLicense?: string;

  @ApiPropertyOptional({ description: 'Is vendor approved', default: false })
  @IsOptional()
  @IsBoolean()
  approved?: boolean = false;

  @ApiPropertyOptional({ description: 'Is vendor blacklisted', default: false })
  @IsOptional()
  @IsBoolean()
  blacklisted?: boolean = false;

  // @ApiPropertyOptional({ description: 'Additional metadata' })
  // @IsOptional()
  // @IsObject()
  // metadata?: Record<string, any>;
}