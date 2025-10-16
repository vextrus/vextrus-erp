import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  Delete,
  HttpCode,
  HttpStatus,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService } from '../services/export.service';
import { CreateExportJobDto } from '../dto/create-export-job.dto';
import { ExportStatus } from '../entities/export-job.entity';

@ApiTags('export')
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('job')
  @ApiOperation({ summary: 'Create export job' })
  async createExportJob(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreateExportJobDto,
  ) {
    return this.exportService.createExportJob(tenantId, dto);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Export data synchronously' })
  async exportSync(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreateExportJobDto,
    @Res() res: Response,
  ) {
    const result = await this.exportService.exportSync(tenantId, dto);
    
    res.set({
      'Content-Type': result.mime_type,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Content-Length': result.size,
    });

    return new StreamableFile(result.buffer);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Get export jobs' })
  @ApiQuery({ name: 'status', required: false, enum: ExportStatus })
  @ApiQuery({ name: 'entity_type', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getExportJobs(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: ExportStatus,
    @Query('entity_type') entityType?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.exportService.getExportJobs(tenantId, {
      status,
      entityType,
      page,
      limit,
    });
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get export job details' })
  async getExportJob(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.exportService.getExportJob(tenantId, id);
  }

  @Get('jobs/:id/progress')
  @ApiOperation({ summary: 'Get export job progress' })
  async getExportProgress(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.exportService.getExportProgress(tenantId, id);
  }

  @Get('jobs/:id/download')
  @ApiOperation({ summary: 'Download exported file' })
  async downloadExport(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const file = await this.exportService.downloadExport(tenantId, id);
    
    res.set({
      'Content-Type': file.mime_type,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      'Content-Length': file.size,
    });

    return new StreamableFile(file.buffer);
  }

  @Post('jobs/:id/retry')
  @ApiOperation({ summary: 'Retry failed export job' })
  async retryExport(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.exportService.retryExport(tenantId, id);
  }

  @Post('jobs/:id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel export job' })
  async cancelExport(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.exportService.cancelExport(tenantId, id);
  }

  @Delete('jobs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete export job' })
  async deleteExportJob(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.exportService.deleteExportJob(tenantId, id);
  }

  @Get('fields/:entityType')
  @ApiOperation({ summary: 'Get available fields for entity type' })
  async getAvailableFields(
    @Headers('x-tenant-id') tenantId: string,
    @Param('entityType') entityType: string,
  ) {
    return this.exportService.getAvailableFields(tenantId, entityType);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get export statistics' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getStatistics(
    @Headers('x-tenant-id') tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.exportService.getStatistics(tenantId, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Schedule recurring export' })
  async scheduleExport(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreateExportJobDto,
  ) {
    return this.exportService.scheduleExport(tenantId, dto);
  }

  @Get('scheduled')
  @ApiOperation({ summary: 'Get scheduled exports' })
  async getScheduledExports(
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.exportService.getScheduledExports(tenantId);
  }
}