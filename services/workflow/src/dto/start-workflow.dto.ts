import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartWorkflowDto {
  @ApiProperty({ description: 'Workflow type to start' })
  @IsString()
  workflowType: string;

  @ApiProperty({ description: 'Arguments to pass to the workflow', type: [Object] })
  @IsArray()
  args: any[];

  @ApiPropertyOptional({ description: 'Custom workflow ID' })
  @IsOptional()
  @IsString()
  workflowId?: string;

  @ApiPropertyOptional({ description: 'Task queue to use' })
  @IsOptional()
  @IsString()
  taskQueue?: string;

  @ApiPropertyOptional({ description: 'Workflow memo for debugging' })
  @IsOptional()
  @IsObject()
  memo?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Search attributes for workflow visibility' })
  @IsOptional()
  @IsObject()
  searchAttributes?: Record<string, any>;
}