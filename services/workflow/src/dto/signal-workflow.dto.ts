import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignalWorkflowDto {
  @ApiProperty({ description: 'Signal name to send' })
  @IsString()
  signalName: string;

  @ApiPropertyOptional({ description: 'Arguments to pass with the signal', type: [Object] })
  @IsOptional()
  @IsArray()
  args?: any[];
}