import { IsString, IsOptional, IsObject, IsNotEmpty, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuditLogDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  action: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  entity_type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entity_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  old_values?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  new_values?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ip_address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  user_agent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  event_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outcome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  user_email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  user_role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  service_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resource_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resource_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resource_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  details?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  http_method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  request_path?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  response_status?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  response_time_ms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_sensitive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  request_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  session_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  correlation_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  status_code?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  error_message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stack_trace?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  location?: {
    ip?: string;
    city?: string;
    country?: string;
  };
}
