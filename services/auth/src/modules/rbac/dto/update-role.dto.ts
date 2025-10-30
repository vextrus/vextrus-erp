import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';
import { IsUUID, IsOptional } from 'class-validator';

export class UpdateRoleDto extends PartialType(
  OmitType(CreateRoleDto, ['organizationId', 'isSystem'] as const),
) {
  @ApiProperty({
    description: 'User ID who updated this role',
    example: 'user_123',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  updatedBy?: string;
}