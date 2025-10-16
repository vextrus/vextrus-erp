import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProductCategory {
  CONSTRUCTION_MATERIALS = 'construction-materials',
  MEDICINE = 'medicine',
  BASIC_FOOD = 'basic-food',
  AGRICULTURE = 'agriculture',
  EDUCATION = 'education',
  GENERAL_GOODS = 'general-goods',
  SERVICES = 'services',
  ELECTRONICS = 'electronics',
  FURNITURE = 'furniture',
  MACHINERY = 'machinery',
}

export enum CustomerType {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business',
  GOVERNMENT = 'government',
  NGO = 'ngo',
  EXPORT = 'export',
}

export class CalculateVATDto {
  @ApiProperty({ 
    description: 'Product category',
    enum: ProductCategory,
    example: ProductCategory.GENERAL_GOODS 
  })
  @IsEnum(ProductCategory)
  productCategory: string;

  @ApiProperty({ 
    description: 'Customer type',
    enum: CustomerType,
    example: CustomerType.BUSINESS 
  })
  @IsEnum(CustomerType)
  customerType: string;

  @ApiProperty({ 
    description: 'Amount in BDT',
    example: 10000 
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ 
    description: 'Is this an export transaction?',
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  isExport?: boolean = false;

  @ApiPropertyOptional({ 
    description: 'Does customer have VAT exemption certificate?',
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  hasExemptionCertificate?: boolean = false;
}