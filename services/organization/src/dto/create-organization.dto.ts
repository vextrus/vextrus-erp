import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsEmail, IsUrl, MaxLength, MinLength } from 'class-validator';
import { OrganizationSettings } from '../entities/organization.entity';

export class CreateOrganizationDto {
  @ApiProperty({ description: 'Organization name' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Unique slug for organization' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  slug: string;

  @ApiProperty({ 
    description: 'Organization type',
    enum: ['construction', 'real-estate', 'both'],
    default: 'construction'
  })
  @IsEnum(['construction', 'real-estate', 'both'])
  @IsOptional()
  type?: string = 'construction';

  @ApiProperty({ description: 'Organization settings', required: false })
  @IsObject()
  @IsOptional()
  settings?: Partial<OrganizationSettings>;

  @ApiProperty({ 
    description: 'Subscription plan',
    enum: ['basic', 'professional', 'enterprise'],
    default: 'basic'
  })
  @IsEnum(['basic', 'professional', 'enterprise'])
  @IsOptional()
  subscriptionPlan?: string = 'basic';

  @ApiProperty({ description: 'Organization description', required: false })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Organization website', required: false })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiProperty({ description: 'Organization phone', required: false })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'Organization email', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Organization address', required: false })
  @IsObject()
  @IsOptional()
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}