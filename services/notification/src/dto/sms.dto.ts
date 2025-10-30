import { IsString, IsOptional, IsEnum, IsMobilePhone } from 'class-validator';

export enum SMSPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

export class SMSDto {
  @IsString()
  to: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(SMSPriority)
  priority?: SMSPriority;

  @IsOptional()
  @IsString()
  senderId?: string;

  @IsOptional()
  @IsString()
  locale?: string;
}