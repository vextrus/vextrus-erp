import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ServiceType {
  CONSTRUCTION = 'construction',
  SUPPLY = 'supply',
  CONSULTING = 'consulting',
  LEGAL = 'legal',
  ACCOUNTING = 'accounting',
  ENGINEERING = 'engineering',
  TRANSPORT = 'transport',
  MAINTENANCE = 'maintenance',
  SECURITY = 'security',
  CLEANING = 'cleaning',
  OTHER = 'other',
}

export enum VendorType {
  CONTRACTOR = 'contractor',
  SUPPLIER = 'supplier',
  SERVICE_PROVIDER = 'service-provider',
  CONSULTANT = 'consultant',
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
}

export class CalculateAITDto {
  @ApiProperty({ 
    description: 'Type of service',
    enum: ServiceType,
    example: ServiceType.CONSTRUCTION 
  })
  @IsEnum(ServiceType)
  serviceType: string;

  @ApiProperty({ 
    description: 'Type of vendor',
    enum: VendorType,
    example: VendorType.CONTRACTOR 
  })
  @IsEnum(VendorType)
  vendorType: string;

  @ApiProperty({ 
    description: 'Amount in BDT',
    example: 100000 
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ 
    description: 'Does vendor have tax certificate?',
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  hasTaxCertificate?: boolean = false;
}