import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsDateString,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobType, JobStatus } from '../entities/job-schedule.entity';

export class RetryConfigDto {
  @ApiPropertyOptional({ description: 'Maximum number of retry attempts' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  max_attempts?: number;

  @ApiPropertyOptional({ description: 'Delay between retries in milliseconds' })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  backoff_delay?: number;

  @ApiPropertyOptional({ enum: ['fixed', 'exponential'] })
  @IsOptional()
  @IsEnum(['fixed', 'exponential'])
  backoff_type?: 'fixed' | 'exponential';
}

export class NotificationConfigDto {
  @ApiPropertyOptional({ description: 'Email addresses to notify on success' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  on_success?: string[];

  @ApiPropertyOptional({ description: 'Email addresses to notify on failure' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  on_failure?: string[];

  @ApiPropertyOptional({ enum: ['email', 'sms', 'push'], isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(['email', 'sms', 'push'], { each: true })
  channels?: ('email' | 'sms' | 'push')[];
}

export class CreateJobScheduleDto {
  @ApiProperty({ description: 'Name of the scheduled job' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the job' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: JobType, default: JobType.CRON })
  @IsEnum(JobType)
  job_type: JobType;

  @ApiPropertyOptional({ description: 'Cron expression for scheduling', example: '0 0 * * *' })
  @IsOptional()
  @IsString()
  cron_expression?: string;

  @ApiPropertyOptional({ description: 'Start date for the job schedule' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date for the job schedule' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiProperty({ description: 'Handler name to execute' })
  @IsNotEmpty()
  @IsString()
  handler_name: string;

  @ApiPropertyOptional({ description: 'Data to pass to the job handler' })
  @IsOptional()
  @IsObject()
  job_data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Retry configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => RetryConfigDto)
  retry_config?: RetryConfigDto;

  @ApiPropertyOptional({ description: 'Timezone for the schedule', example: 'Asia/Dhaka' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Notification configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationConfigDto)
  notification_config?: NotificationConfigDto;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}