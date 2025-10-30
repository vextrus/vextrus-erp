import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsUUID, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'Username' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username!: string;

  @ApiProperty({ description: 'Password (min 8 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Password must contain uppercase, lowercase, number and special character',
    },
  )
  password!: string;

  @ApiProperty({ description: 'First name', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ description: 'Last name', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ description: 'First name in Bengali', required: false })
  @IsString()
  @IsOptional()
  firstNameBn?: string;

  @ApiProperty({ description: 'Last name in Bengali', required: false })
  @IsString()
  @IsOptional()
  lastNameBn?: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^(\+88)?01[3-9]\d{8}$/, {
    message: 'Please provide a valid Bangladesh phone number',
  })
  phone?: string;
}