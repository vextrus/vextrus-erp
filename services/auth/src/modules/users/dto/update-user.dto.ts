import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LOCKED = 'LOCKED',
  DELETED = 'DELETED',
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ description: 'User status', enum: UserStatus, required: false })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiProperty({ description: 'Enable MFA', required: false })
  @IsOptional()
  mfaEnabled?: boolean;

  @ApiProperty({ description: 'Email verified', required: false })
  @IsOptional()
  emailVerified?: boolean;

  @ApiProperty({ description: 'Phone verified', required: false })
  @IsOptional()
  phoneVerified?: boolean;
}