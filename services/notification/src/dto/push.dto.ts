import { IsString, IsOptional, IsArray, IsObject, IsNumber, IsEnum } from 'class-validator';

export enum PushUrgency {
  VERY_LOW = 'very-low',
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

export class AndroidConfig {
  @IsOptional()
  @IsString()
  priority?: 'normal' | 'high';

  @IsOptional()
  @IsString()
  sound?: string;

  @IsOptional()
  @IsString()
  channelId?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

export class APNSConfig {
  @IsOptional()
  @IsString()
  sound?: string;

  @IsOptional()
  @IsNumber()
  badge?: number;

  @IsOptional()
  @IsString()
  category?: string;
}

export class WebPushConfig {
  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsArray()
  vibrate?: number[];

  @IsOptional()
  @IsArray()
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export class PushDto {
  @IsArray()
  @IsString({ each: true })
  tokens: string[];

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, string>;

  @IsOptional()
  @IsObject()
  android?: AndroidConfig;

  @IsOptional()
  @IsObject()
  apns?: APNSConfig;

  @IsOptional()
  @IsObject()
  webpush?: WebPushConfig;

  @IsOptional()
  @IsNumber()
  ttl?: number;

  @IsOptional()
  @IsEnum(PushUrgency)
  urgency?: PushUrgency;

  @IsOptional()
  @IsString()
  provider?: 'firebase' | 'web-push';
}