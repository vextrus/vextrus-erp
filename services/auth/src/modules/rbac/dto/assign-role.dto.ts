import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsDateString,
  IsString,
  ValidateNested,
  IsArray,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RoleScopeDto {
  @ApiProperty({
    description: 'Specific project IDs this role applies to',
    example: ['proj_123', 'proj_456'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  projects?: string[];

  @ApiProperty({
    description: 'Specific departments this role applies to',
    example: ['engineering', 'construction'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departments?: string[];

  @ApiProperty({
    description: 'Specific locations/sites this role applies to',
    example: ['dhaka-site-1', 'chittagong-site-2'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locations?: string[];
}

export class TemporaryDelegationDto {
  @ApiProperty({
    description: 'Original user delegating this role',
    example: 'user_original_123',
  })
  @IsUUID()
  fromUserId!: string;

  @ApiProperty({
    description: 'Reason for temporary delegation',
    example: 'On vacation from Dec 1-15',
  })
  @IsString()
  reason!: string;

  @ApiProperty({
    description: 'Original role being delegated',
    example: 'role_original_123',
  })
  @IsUUID()
  originalRoleId!: string;
}

export class AssignRoleDto {
  @ApiProperty({
    description: 'User ID to assign the role to',
    example: 'user_123',
  })
  @IsNotEmpty()
  @IsUUID()
  userId!: string;

  @ApiProperty({
    description: 'Role ID to assign',
    example: 'role_456',
  })
  @IsNotEmpty()
  @IsUUID()
  roleId!: string;

  @ApiProperty({
    description: 'Organization ID',
    example: 'org_789',
  })
  @IsNotEmpty()
  @IsUUID()
  organizationId!: string;

  @ApiProperty({
    description: 'User ID who is assigning this role',
    example: 'admin_123',
  })
  @IsNotEmpty()
  @IsUUID()
  assignedBy!: string;

  @ApiProperty({
    description: 'Role expiration date',
    example: '2025-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: Date;

  @ApiProperty({
    description: 'Reason for role assignment',
    example: 'Promoted to Project Manager',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'Scope restrictions for this role assignment',
    type: RoleScopeDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RoleScopeDto)
  scope?: RoleScopeDto;

  @ApiProperty({
    description: 'Temporary delegation details',
    type: TemporaryDelegationDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TemporaryDelegationDto)
  temporaryDelegation?: TemporaryDelegationDto;
}