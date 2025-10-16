import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { ElasticsearchService } from '../services/elasticsearch.service';
import { SearchAuditDto, AggregateAuditDto, ExportAuditDto } from '../dto/search-audit.dto';

@ApiTags('Audit Search')
@Controller('audit/search')
export class SearchController {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  @Post('query')
  @ApiOperation({ summary: 'Advanced search in Elasticsearch' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(
    @Body() dto: SearchAuditDto,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<any> {
    // Add tenant filter
    const searchDto = { ...dto };
    if (!searchDto.query) {
      searchDto.query = `tenant_id:${tenantId}`;
    } else {
      searchDto.query += ` AND tenant_id:${tenantId}`;
    }
    
    return await this.elasticsearchService.searchAuditLogs(searchDto);
  }

  @Post('aggregate')
  @ApiOperation({ summary: 'Aggregate audit logs' })
  async aggregate(
    @Body() dto: AggregateAuditDto,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<any> {
    return await this.elasticsearchService.aggregateAuditLogs(dto);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export audit logs' })
  async export(
    @Body() dto: ExportAuditDto,
    @Headers('x-tenant-id') tenantId: string,
    @Res() res: Response,
  ): Promise<void> {
    const searchDto = { ...dto };
    const result = await this.elasticsearchService.searchAuditLogs(searchDto);

    switch (dto.format) {
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.json"');
        res.send(JSON.stringify(result.hits, null, 2));
        break;

      case 'csv':
        const csv = this.convertToCSV(result.hits);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
        res.send(csv);
        break;

      default:
        res.status(HttpStatus.BAD_REQUEST).send('Unsupported format');
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get Elasticsearch statistics' })
  async getStatistics(): Promise<any> {
    return await this.elasticsearchService.getStatistics();
  }

  @Get('health')
  @ApiOperation({ summary: 'Check Elasticsearch health' })
  async checkHealth(): Promise<{ healthy: boolean }> {
    const healthy = await this.elasticsearchService.checkHealth();
    return { healthy };
  }

  private convertToCSV(logs: any[]): string {
    if (logs.length === 0) return '';

    const headers = Object.keys(logs[0]).filter(key => 
      typeof logs[0][key] !== 'object'
    );

    const csvRows = [
      headers.join(','),
      ...logs.map(log => 
        headers.map(header => {
          const value = log[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        }).join(',')
      ),
    ];

    return csvRows.join('\n');
  }
}