import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueryWorkflowDto {
  @ApiProperty({ description: 'Query type to execute' })
  @IsString()
  queryType: string;

  @ApiPropertyOptional({ description: 'Arguments to pass with the query', type: [Object] })
  @IsOptional()
  @IsArray()
  args?: any[];
}