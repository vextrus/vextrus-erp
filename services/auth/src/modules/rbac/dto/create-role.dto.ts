import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNumber,
  IsEnum,
  ValidateNested,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RoleMetadataDto {
  @ApiProperty({
    description: 'Maximum number of projects this role can manage',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxProjects?: number;

  @ApiProperty({
    description: 'Maximum number of users this role can manage',
    example: 50,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxUsers?: number;

  @ApiProperty({
    description: 'Allowed modules for this role',
    example: ['project', 'finance', 'document'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedModules?: string[];
}

export class CreateRoleDto {
  @ApiProperty({
    description: 'Unique role identifier',
    example: 'project-manager',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Role name in English',
    example: 'Project Manager',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  nameEn!: string;

  @ApiProperty({
    description: 'Role name in Bengali',
    example: 'প্রকল্প ব্যবস্থাপক',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  nameBn!: string;

  @ApiProperty({
    description: 'Role description',
    example: 'Manages day-to-day project operations',
  })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({
    description: 'Role description in Bengali',
    example: 'দৈনন্দিন প্রকল্প কার্যক্রম পরিচালনা করে',
    required: false,
  })
  @IsOptional()
  @IsString()
  descriptionBn?: string;

  @ApiProperty({
    description: 'Organization ID',
    example: 'org_123456',
  })
  @IsNotEmpty()
  @IsUUID()
  organizationId!: string;

  @ApiProperty({
    description: 'Parent role ID for hierarchy',
    example: 'role_parent_123',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  parentRoleId?: string;

  @ApiProperty({
    description: 'Direct permission keys',
    example: ['project.create', 'project.read', 'project.update'],
    default: [],
  })
  @IsArray()
  @IsString({ each: true })
  permissions!: string[];

  @ApiProperty({
    description: 'Permission entity IDs to associate',
    example: ['perm_123', 'perm_456'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds?: string[];

  @ApiProperty({
    description: 'Role priority for precedence',
    example: 50,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({
    description: 'Whether this is a system role',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiProperty({
    description: 'Whether this is the default role for new users',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({
    description: 'Role metadata',
    type: RoleMetadataDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RoleMetadataDto)
  metadata?: RoleMetadataDto;

  @ApiProperty({
    description: 'User ID who created this role',
    example: 'user_123',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}