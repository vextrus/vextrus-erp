import { PartialType } from '@nestjs/swagger';
import { CreateMappingDto } from './create-mapping.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMappingDto extends PartialType(CreateMappingDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}