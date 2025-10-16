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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from '../services/import.service';
import { CreateImportJobDto } from '../dto/create-import-job.dto';
import { ImportStatus } from '../entities/import-job.entity';

@ApiTags('import')
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload and start import job' })
  async uploadAndImport(
    @Headers('x-tenant-id') tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateImportJobDto,
  ) {
    return this.importService.createImportJob(tenantId, {
      ...dto,
      file_path: file.buffer.toString('base64'),
      original_filename: file.originalname,
    });
  }

  @Post('job')
  @ApiOperation({ summary: 'Create import job from file path' })
  async createImportJob(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreateImportJobDto,
  ) {
    return this.importService.createImportJob(tenantId, dto);
  }

  @Post('validate')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Validate import file without processing' })
  async validateImport(
    @Headers('x-tenant-id') tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateImportJobDto,
  ) {
    return this.importService.validateImport(tenantId, file, dto);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Get import jobs' })
  @ApiQuery({ name: 'status', required: false, enum: ImportStatus })
  @ApiQuery({ name: 'entity_type', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getImportJobs(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: ImportStatus,
    @Query('entity_type') entityType?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.importService.getImportJobs(tenantId, {
      status,
      entityType,
      page,
      limit,
    });
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get import job details' })
  async getImportJob(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.importService.getImportJob(tenantId, id);
  }

  @Get('jobs/:id/progress')
  @ApiOperation({ summary: 'Get import job progress' })
  async getImportProgress(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.importService.getImportProgress(tenantId, id);
  }

  @Get('jobs/:id/errors')
  @ApiOperation({ summary: 'Get import job errors' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getImportErrors(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.importService.getImportErrors(tenantId, id, { page, limit });
  }

  @Post('jobs/:id/retry')
  @ApiOperation({ summary: 'Retry failed import job' })
  async retryImport(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.importService.retryImport(tenantId, id);
  }

  @Post('jobs/:id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel import job' })
  async cancelImport(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.importService.cancelImport(tenantId, id);
  }

  @Delete('jobs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete import job' })
  async deleteImportJob(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.importService.deleteImportJob(tenantId, id);
  }

  @Get('templates/:entityType')
  @ApiOperation({ summary: 'Get import template for entity type' })
  async getImportTemplate(
    @Headers('x-tenant-id') tenantId: string,
    @Param('entityType') entityType: string,
    @Query('format') format: 'csv' | 'excel' = 'csv',
  ) {
    return this.importService.generateTemplate(tenantId, entityType, format);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get import statistics' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getStatistics(
    @Headers('x-tenant-id') tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.importService.getStatistics(tenantId, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }
}