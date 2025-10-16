import { PartialType } from '@nestjs/swagger';
import { CreateJobScheduleDto } from './create-job-schedule.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { JobStatus } from '../entities/job-schedule.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateJobScheduleDto extends PartialType(CreateJobScheduleDto) {
  @ApiPropertyOptional({ enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}