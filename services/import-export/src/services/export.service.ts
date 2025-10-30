import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ExportJob, ExportStatus, ExportFormat } from '../entities/export-job.entity';
import { CreateExportJobDto } from '../dto/create-export-job.dto';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(ExportJob)
    private readonly exportJobRepository: Repository<ExportJob>,
    @InjectQueue('export-jobs')
    private readonly exportQueue: Queue,
    @Inject('KAFKA_CLIENT')
    private readonly kafkaClient: ClientKafka,
  ) {}

  async createExportJob(tenantId: string, dto: CreateExportJobDto): Promise<ExportJob> {
    const job = this.exportJobRepository.create({
      ...dto,
      tenant_id: tenantId,
      status: ExportStatus.PENDING,
      total_records: 0,
      processed_records: 0,
    });

    const savedJob = await this.exportJobRepository.save(job);

    // Queue for processing
    await this.exportQueue.add('process', {
      jobId: savedJob.id,
      tenantId,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });

    // Schedule if configured
    if (dto.schedule_config?.cron) {
      await this.scheduleExport(tenantId, dto);
    }

    this.kafkaClient.emit('export.job.created', {
      job_id: savedJob.id,
      tenant_id: tenantId,
      entity_type: savedJob.entity_type,
      format: savedJob.format,
    });

    return savedJob;
  }

  async exportSync(
    tenantId: string,
    dto: CreateExportJobDto,
  ): Promise<{ buffer: Buffer; filename: string; mime_type: string; size: number }> {
    // Create job but don't queue
    const job = this.exportJobRepository.create({
      ...dto,
      tenant_id: tenantId,
      status: ExportStatus.PROCESSING,
      started_at: new Date(),
    });

    const savedJob = await this.exportJobRepository.save(job);

    try {
      // Fetch data
      const data = await this.fetchData(tenantId, dto.entity_type, dto.query_params);
      
      // Generate export
      const result = await this.generateExport(
        data,
        dto.format,
        dto.export_config,
      );

      // Update job
      savedJob.status = ExportStatus.COMPLETED;
      savedJob.completed_at = new Date();
      savedJob.processing_time_ms = Date.now() - savedJob.started_at.getTime();
      savedJob.total_records = data.length;
      savedJob.processed_records = data.length;
      savedJob.file_size = result.buffer.length;
      savedJob.mime_type = result.mime_type;

      await this.exportJobRepository.save(savedJob);

      return {
        buffer: result.buffer,
        filename: `${dto.entity_type}_export_${Date.now()}.${dto.format}`,
        mime_type: result.mime_type,
        size: result.buffer.length,
      };
    } catch (error: any) {
      savedJob.status = ExportStatus.FAILED;
      savedJob.error_message = error.message;
      savedJob.error_details = error.stack;
      await this.exportJobRepository.save(savedJob);
      throw error;
    }
  }

  async getExportJobs(
    tenantId: string,
    options: {
      status?: ExportStatus;
      entityType?: string;
      page: number;
      limit: number;
    },
  ) {
    const query = this.exportJobRepository.createQueryBuilder('job')
      .where('job.tenant_id = :tenantId', { tenantId });

    if (options.status) {
      query.andWhere('job.status = :status', { status: options.status });
    }

    if (options.entityType) {
      query.andWhere('job.entity_type = :entityType', { entityType: options.entityType });
    }

    const [jobs, total] = await query
      .skip((options.page - 1) * options.limit)
      .take(options.limit)
      .orderBy('job.created_at', 'DESC')
      .getManyAndCount();

    return {
      data: jobs,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async getExportJob(tenantId: string, id: string): Promise<ExportJob> {
    const job = await this.exportJobRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!job) {
      throw new NotFoundException(`Export job ${id} not found`);
    }

    return job;
  }

  async getExportProgress(tenantId: string, id: string) {
    const job = await this.getExportJob(tenantId, id);

    const progress = job.total_records > 0
      ? (job.processed_records / job.total_records) * 100
      : 0;

    return {
      job_id: job.id,
      status: job.status,
      progress: Math.round(progress),
      total_records: job.total_records,
      processed_records: job.processed_records,
      elapsed_time: job.processing_time_ms,
      file_size: job.file_size,
      file_url: job.file_url,
    };
  }

  async downloadExport(tenantId: string, id: string) {
    const job = await this.getExportJob(tenantId, id);

    if (job.status !== ExportStatus.COMPLETED) {
      throw new BadRequestException('Export is not ready for download');
    }

    if (!job.file_path || !fs.existsSync(job.file_path)) {
      throw new NotFoundException('Export file not found');
    }

    const buffer = fs.readFileSync(job.file_path);

    return {
      buffer,
      filename: path.basename(job.file_path),
      mime_type: job.mime_type,
      size: job.file_size,
    };
  }

  async retryExport(tenantId: string, id: string): Promise<ExportJob> {
    const job = await this.getExportJob(tenantId, id);

    if (job.status !== ExportStatus.FAILED) {
      throw new BadRequestException('Only failed exports can be retried');
    }

    // Reset job status
    job.status = ExportStatus.PENDING;
    job.error_message = undefined as any;
    job.error_details = undefined as any;

    await this.exportJobRepository.save(job);

    // Re-queue for processing
    await this.exportQueue.add('process', {
      jobId: job.id,
      tenantId,
      retry: true,
    });

    return job;
  }

  async cancelExport(tenantId: string, id: string): Promise<void> {
    const job = await this.getExportJob(tenantId, id);

    if (job.status === ExportStatus.COMPLETED || job.status === ExportStatus.CANCELLED) {
      throw new BadRequestException('Cannot cancel completed or already cancelled job');
    }

    job.status = ExportStatus.CANCELLED;
    await this.exportJobRepository.save(job);

    // Remove from queue if pending
    const queueJobs = await this.exportQueue.getJobs(['waiting', 'delayed']);
    for (const qJob of queueJobs) {
      if (qJob.data.jobId === id) {
        await qJob.remove();
      }
    }

    this.kafkaClient.emit('export.job.cancelled', {
      job_id: id,
      tenant_id: tenantId,
    });
  }

  async deleteExportJob(tenantId: string, id: string): Promise<void> {
    const job = await this.getExportJob(tenantId, id);
    
    // Delete associated file
    if (job.file_path && fs.existsSync(job.file_path)) {
      fs.unlinkSync(job.file_path);
    }

    await this.exportJobRepository.remove(job);
  }

  async getAvailableFields(tenantId: string, entityType: string) {
    // This would normally query the entity metadata
    const fieldMap = {
      product: ['id', 'name', 'sku', 'price', 'quantity', 'category', 'description', 'created_at', 'updated_at'],
      customer: ['id', 'name', 'email', 'phone', 'address', 'city', 'state', 'country', 'created_at'],
      order: ['id', 'order_number', 'customer_id', 'total', 'status', 'payment_method', 'created_at'],
      invoice: ['id', 'invoice_number', 'customer_id', 'amount', 'tax', 'total', 'due_date', 'status'],
    };

    return {
      entity_type: entityType,
      fields: fieldMap[entityType] || [],
      relations: this.getAvailableRelations(entityType),
    };
  }

  async scheduleExport(tenantId: string, dto: CreateExportJobDto) {
    if (!dto.schedule_config?.cron) {
      throw new BadRequestException('Cron expression required for scheduling');
    }

    // Create scheduled job
    const job = await this.createExportJob(tenantId, {
      ...dto,
      metadata: {
        ...dto.metadata,
        scheduled: true,
        cron: dto.schedule_config.cron,
      },
    });

    // Add to cron scheduler (would integrate with scheduler service)
    this.kafkaClient.emit('scheduler.job.create', {
      tenant_id: tenantId,
      job_type: 'export',
      job_id: job.id,
      cron_expression: dto.schedule_config.cron,
      handler_name: 'export_data',
      job_data: {
        export_job_id: job.id,
      },
    });

    return job;
  }

  async getScheduledExports(tenantId: string) {
    const jobs = await this.exportJobRepository
      .createQueryBuilder('export_job')
      .where('export_job.tenant_id = :tenantId', { tenantId })
      .andWhere("export_job.metadata->>'scheduled' = 'true'")
      .orderBy('export_job.created_at', 'DESC')
      .getMany();

    return jobs;
  }

  async getStatistics(
    tenantId: string,
    options: { from?: Date; to?: Date },
  ) {
    const query = this.exportJobRepository.createQueryBuilder('job')
      .where('job.tenant_id = :tenantId', { tenantId });

    if (options.from) {
      query.andWhere('job.created_at >= :from', { from: options.from });
    }

    if (options.to) {
      query.andWhere('job.created_at <= :to', { to: options.to });
    }

    const stats = await query
      .select('job.status', 'status')
      .addSelect('job.format', 'format')
      .addSelect('job.entity_type', 'entity_type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(job.total_records)', 'total_records')
      .addSelect('SUM(job.file_size)', 'total_size')
      .addSelect('AVG(job.processing_time_ms)', 'avg_processing_time')
      .groupBy('job.status')
      .addGroupBy('job.format')
      .addGroupBy('job.entity_type')
      .getRawMany();

    return {
      by_status: this.groupByField(stats, 'status'),
      by_format: this.groupByField(stats, 'format'),
      by_entity_type: this.groupByField(stats, 'entity_type'),
      total_jobs: stats.reduce((sum, s) => sum + parseInt(s.count), 0),
      total_records_exported: stats.reduce((sum, s) => sum + parseInt(s.total_records || 0), 0),
      total_size_mb: stats.reduce((sum, s) => sum + parseInt(s.total_size || 0), 0) / (1024 * 1024),
      average_processing_time: this.calculateAverage(stats, 'avg_processing_time'),
      period: {
        from: options.from,
        to: options.to,
      },
    };
  }

  private async fetchData(
    tenantId: string,
    entityType: string,
    queryParams?: any,
  ): Promise<any[]> {
    // This would normally query the actual entity service
    // For now, returning mock data
    const mockData: any[] = [];
    const count = queryParams?.limit || 100;

    for (let i = 0; i < count; i++) {
      mockData.push({
        id: i + 1,
        name: `${entityType} ${i + 1}`,
        description: `Description for ${entityType} ${i + 1}`,
        created_at: new Date(),
      });
    }

    return mockData;
  }

  private async generateExport(
    data: any[],
    format: ExportFormat,
    config?: any,
  ): Promise<{ buffer: Buffer; mime_type: string }> {
    switch (format) {
      case ExportFormat.CSV:
        return this.generateCsv(data, config);
      case ExportFormat.EXCEL:
        return this.generateExcel(data, config);
      case ExportFormat.JSON:
        return this.generateJson(data, config);
      case ExportFormat.XML:
        return this.generateXml(data, config);
      case ExportFormat.PDF:
        return this.generatePdf(data, config);
      default:
        throw new BadRequestException(`Unsupported format: ${format}`);
    }
  }

  private generateCsv(data: any[], config?: any): { buffer: Buffer; mime_type: string } {
    const csv = require('csv-stringify/sync');
    
    const output = csv.stringify(data, {
      header: config?.include_headers !== false,
      delimiter: config?.delimiter || ',',
      columns: config?.fields,
    });

    return {
      buffer: Buffer.from(output),
      mime_type: 'text/csv',
    };
  }

  private async generateExcel(data: any[], config?: any): Promise<{ buffer: Buffer; mime_type: string }> {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(config?.sheet_name || 'Data');

    // Add headers
    if (data.length > 0 && config?.include_headers !== false) {
      const headers = config?.fields || Object.keys(data[0]);
      worksheet.addRow(headers);
      
      // Style headers
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    }

    // Add data
    data.forEach(row => {
      const values = config?.fields
        ? config.fields.map(field => row[field])
        : Object.values(row);
      worksheet.addRow(values);
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer: Buffer.from(buffer),
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private generateJson(data: any[], config?: any): { buffer: Buffer; mime_type: string } {
    const output = JSON.stringify(data, null, 2);

    return {
      buffer: Buffer.from(output),
      mime_type: 'application/json',
    };
  }

  private generateXml(data: any[], config?: any): { buffer: Buffer; mime_type: string } {
    const xml2js = require('xml2js');
    const builder = new xml2js.Builder();
    
    const xml = builder.buildObject({
      root: {
        record: data,
      },
    });

    return {
      buffer: Buffer.from(xml),
      mime_type: 'application/xml',
    };
  }

  private async generatePdf(data: any[], config?: any): Promise<{ buffer: Buffer; mime_type: string }> {
    // This would use puppeteer or similar to generate PDF
    // For now, returning a simple text representation
    const content = JSON.stringify(data, null, 2);

    return {
      buffer: Buffer.from(content),
      mime_type: 'application/pdf',
    };
  }

  private getAvailableRelations(entityType: string): string[] {
    const relations = {
      product: ['category', 'supplier', 'images'],
      customer: ['orders', 'addresses', 'payments'],
      order: ['customer', 'items', 'payments'],
      invoice: ['customer', 'items', 'payments'],
    };

    return relations[entityType] || [];
  }

  private groupByField(stats: any[], field: string): any {
    const result = {};
    stats.forEach(s => {
      const key = s[field];
      if (!result[key]) {
        result[key] = 0;
      }
      result[key] += parseInt(s.count);
    });
    return result;
  }

  private calculateAverage(stats: any[], field: string): number {
    const values = stats.map(s => parseFloat(s[field] || 0)).filter(v => v > 0);
    return values.length > 0
      ? values.reduce((sum, v) => sum + v, 0) / values.length
      : 0;
  }
}