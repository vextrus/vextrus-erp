import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ImportJob, ImportStatus, ImportFormat } from '../entities/import-job.entity';
import { DataMapping } from '../entities/data-mapping.entity';
import { CreateImportJobDto } from '../dto/create-import-job.dto';
import { ValidationService } from './validation.service';
import { DataMapperService } from './data-mapper.service';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(ImportJob)
    private readonly importJobRepository: Repository<ImportJob>,
    @InjectRepository(DataMapping)
    private readonly mappingRepository: Repository<DataMapping>,
    @InjectQueue('import-jobs')
    private readonly importQueue: Queue,
    private readonly validationService: ValidationService,
    private readonly mapperService: DataMapperService,
    @Inject('KAFKA_CLIENT')
    private readonly kafkaClient: ClientKafka,
  ) {}

  async createImportJob(tenantId: string, dto: CreateImportJobDto): Promise<ImportJob> {
    // Get mapping if provided
    let mapping: DataMapping | null = null;
    if (dto.mapping_id) {
      mapping = await this.mappingRepository.findOne({
        where: { id: dto.mapping_id, tenant_id: tenantId },
      });
      if (!mapping) {
        throw new NotFoundException(`Mapping ${dto.mapping_id} not found`);
      }
    }

    // Handle base64 file content
    let filePath = dto.file_path;
    if (dto.file_path.startsWith('data:') || dto.file_path.length > 500) {
      // Save base64 content to file
      const buffer = Buffer.from(dto.file_path.split(',')[1] || dto.file_path, 'base64');
      filePath = await this.saveUploadedFile(tenantId, buffer, dto.format);
    }

    const job = this.importJobRepository.create({
      ...dto,
      tenant_id: tenantId,
      file_path: filePath,
      file_size: await this.getFileSize(filePath),
      status: ImportStatus.PENDING,
      mapping_config: dto.mapping_config || mapping?.field_mappings,
      validation_rules: dto.validation_rules || mapping?.validation_rules,
      error_details: [],
      summary: {},
    } as any);

    const savedJobResult = await this.importJobRepository.save(job);
    const savedJob = Array.isArray(savedJobResult) ? savedJobResult[0] : savedJobResult;

    if (!savedJob) {
      throw new Error('Failed to save import job');
    }

    // Queue for processing
    await this.importQueue.add('process', {
      jobId: savedJob.id,
      tenantId,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });

    this.kafkaClient.emit('import.job.created', {
      job_id: savedJob.id,
      tenant_id: tenantId,
      entity_type: savedJob.entity_type,
    });

    return savedJob;
  }

  async validateImport(
    tenantId: string,
    file: Express.Multer.File,
    dto: CreateImportJobDto,
  ): Promise<any> {
    const data = await this.parseFile(file.buffer, dto.format, dto.mapping_config);

    const validationResults: any[] = [];
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const row = data[i];
      const validation = await this.validationService.validateRow(
        row,
        dto.validation_rules,
        i + 1,
      );
      validationResults.push(validation);
    }

    return {
      total_rows: data.length,
      sample_size: validationResults.length,
      validation_results: validationResults,
      has_errors: validationResults.some((r: any) => !r.valid),
      field_summary: this.getFieldSummary(data),
    };
  }

  async getImportJobs(
    tenantId: string,
    options: {
      status?: ImportStatus;
      entityType?: string;
      page: number;
      limit: number;
    },
  ) {
    const query = this.importJobRepository.createQueryBuilder('job')
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

  async getImportJob(tenantId: string, id: string): Promise<ImportJob> {
    const job = await this.importJobRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!job) {
      throw new NotFoundException(`Import job ${id} not found`);
    }

    return job;
  }

  async getImportProgress(tenantId: string, id: string) {
    const job = await this.getImportJob(tenantId, id);

    const progress = job.total_rows > 0
      ? (job.processed_rows / job.total_rows) * 100
      : 0;

    return {
      job_id: job.id,
      status: job.status,
      progress: Math.round(progress),
      total_rows: job.total_rows,
      processed_rows: job.processed_rows,
      successful_rows: job.successful_rows,
      failed_rows: job.failed_rows,
      skipped_rows: job.skipped_rows,
      elapsed_time: job.processing_time_ms,
      estimated_time_remaining: this.estimateTimeRemaining(job),
    };
  }

  async getImportErrors(
    tenantId: string,
    id: string,
    options: { page: number; limit: number },
  ) {
    const job = await this.getImportJob(tenantId, id);

    const errors = job.error_details || [];
    const start = (options.page - 1) * options.limit;
    const end = start + options.limit;

    return {
      data: errors.slice(start, end),
      pagination: {
        page: options.page,
        limit: options.limit,
        total: errors.length,
        totalPages: Math.ceil(errors.length / options.limit),
      },
    };
  }

  async retryImport(tenantId: string, id: string): Promise<ImportJob> {
    const job = await this.getImportJob(tenantId, id);

    if (job.status !== ImportStatus.FAILED && job.status !== ImportStatus.PARTIAL) {
      throw new BadRequestException('Only failed or partial imports can be retried');
    }

    // Reset job status
    job.status = ImportStatus.PENDING;
    job.error_details = [];
    job.failed_rows = 0;

    await this.importJobRepository.save(job);

    // Re-queue for processing
    await this.importQueue.add('process', {
      jobId: job.id,
      tenantId,
      retry: true,
    });

    return job;
  }

  async cancelImport(tenantId: string, id: string): Promise<void> {
    const job = await this.getImportJob(tenantId, id);

    if (job.status === ImportStatus.COMPLETED || job.status === ImportStatus.CANCELLED) {
      throw new BadRequestException('Cannot cancel completed or already cancelled job');
    }

    job.status = ImportStatus.CANCELLED;
    await this.importJobRepository.save(job);

    // Remove from queue if pending
    const queueJobs = await this.importQueue.getJobs(['waiting', 'delayed']);
    for (const qJob of queueJobs) {
      if (qJob.data.jobId === id) {
        await qJob.remove();
      }
    }

    this.kafkaClient.emit('import.job.cancelled', {
      job_id: id,
      tenant_id: tenantId,
    });
  }

  async deleteImportJob(tenantId: string, id: string): Promise<void> {
    const job = await this.getImportJob(tenantId, id);
    
    // Delete associated files
    if (job.file_path && fs.existsSync(job.file_path)) {
      fs.unlinkSync(job.file_path);
    }
    if (job.error_file_path && fs.existsSync(job.error_file_path)) {
      fs.unlinkSync(job.error_file_path);
    }

    await this.importJobRepository.remove(job);
  }

  async generateTemplate(
    tenantId: string,
    entityType: string,
    format: 'csv' | 'excel',
  ) {
    // Get mapping for entity type
    const mapping = await this.mappingRepository.findOne({
      where: {
        tenant_id: tenantId,
        entity_type: entityType,
        is_template: true,
      },
    });

    const fields = mapping?.field_mappings.map(fm => fm.source_field) || 
                  this.getDefaultFieldsForEntity(entityType);

    if (format === 'csv') {
      return {
        content: fields.join(',') + '\n',
        mime_type: 'text/csv',
        filename: `${entityType}_template.csv`,
      };
    } else {
      // Generate Excel template
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data');
      
      worksheet.addRow(fields);
      
      // Style headers
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      
      return {
        content: buffer,
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `${entityType}_template.xlsx`,
      };
    }
  }

  async getStatistics(
    tenantId: string,
    options: { from?: Date; to?: Date },
  ) {
    const query = this.importJobRepository.createQueryBuilder('job')
      .where('job.tenant_id = :tenantId', { tenantId });

    if (options.from) {
      query.andWhere('job.created_at >= :from', { from: options.from });
    }

    if (options.to) {
      query.andWhere('job.created_at <= :to', { to: options.to });
    }

    const stats = await query
      .select('job.status', 'status')
      .addSelect('job.entity_type', 'entity_type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(job.total_rows)', 'total_rows')
      .addSelect('SUM(job.successful_rows)', 'successful_rows')
      .addSelect('SUM(job.failed_rows)', 'failed_rows')
      .addSelect('AVG(job.processing_time_ms)', 'avg_processing_time')
      .groupBy('job.status')
      .addGroupBy('job.entity_type')
      .getRawMany();

    return {
      by_status: this.groupByStatus(stats),
      by_entity_type: this.groupByEntityType(stats),
      total_jobs: stats.reduce((sum, s) => sum + parseInt(s.count), 0),
      total_rows_processed: stats.reduce((sum, s) => sum + parseInt(s.total_rows || 0), 0),
      success_rate: this.calculateSuccessRate(stats),
      average_processing_time: this.calculateAverageTime(stats),
      period: {
        from: options.from,
        to: options.to,
      },
    };
  }

  private async saveUploadedFile(
    tenantId: string,
    buffer: Buffer,
    format: ImportFormat,
  ): Promise<string> {
    const uploadDir = path.join('uploads', 'imports', tenantId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}_import.${format}`;
    const filepath = path.join(uploadDir, filename);
    
    fs.writeFileSync(filepath, buffer);
    return filepath;
  }

  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  private async parseFile(
    buffer: Buffer,
    format: ImportFormat,
    config?: any,
  ): Promise<any[]> {
    switch (format) {
      case ImportFormat.CSV:
      case ImportFormat.TSV:
        return this.parseCsv(buffer, config);
      case ImportFormat.EXCEL:
        return this.parseExcel(buffer, config);
      case ImportFormat.JSON:
        return JSON.parse(buffer.toString());
      case ImportFormat.XML:
        return this.parseXml(buffer);
      default:
        throw new BadRequestException(`Unsupported format: ${format}`);
    }
  }

  private parseCsv(buffer: Buffer, config?: any): any[] {
    const csv = require('csv-parse/sync');
    return csv.parse(buffer, {
      columns: true,
      delimiter: config?.delimiter || ',',
      skip_empty_lines: true,
      trim: true,
    });
  }

  private parseExcel(buffer: Buffer, config?: any): any[] {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.xlsx.load(buffer);
    
    const worksheet = config?.sheet_name
      ? workbook.getWorksheet(config.sheet_name)
      : workbook.worksheets[0];

    const data: any[] = [];
    const headers: any[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1 + (config?.skip_rows || 0)) {
        row.values.forEach((value, i) => {
          if (i > 0) headers.push(value);
        });
      } else if (rowNumber > 1 + (config?.skip_rows || 0)) {
        const obj: any = {};
        row.values.forEach((value, i) => {
          if (i > 0 && headers[i - 1]) {
            obj[headers[i - 1]] = value;
          }
        });
        data.push(obj);
      }
    });

    return data;
  }

  private parseXml(buffer: Buffer): any[] {
    const xml2js = require('xml2js');
    const parser = new xml2js.Parser();
    const result = parser.parseStringSync(buffer.toString());
    return result.root?.record || [];
  }

  private getFieldSummary(data: any[]): any {
    if (!data.length) return {};
    
    const fields = Object.keys(data[0]);
    const summary = {};

    fields.forEach(field => {
      const values = data.map(row => row[field]).filter(v => v !== null && v !== undefined);
      summary[field] = {
        total: values.length,
        unique: new Set(values).size,
        nulls: data.length - values.length,
        sample: values.slice(0, 5),
      };
    });

    return summary;
  }

  private estimateTimeRemaining(job: ImportJob): number | null {
    if (!job.processing_time_ms || !job.processed_rows || !job.total_rows) {
      return null;
    }

    const avgTimePerRow = job.processing_time_ms / job.processed_rows;
    const remainingRows = job.total_rows - job.processed_rows;
    
    return Math.round(avgTimePerRow * remainingRows);
  }

  private getDefaultFieldsForEntity(entityType: string): string[] {
    // Return default fields based on entity type
    const defaults = {
      product: ['name', 'sku', 'price', 'quantity', 'description'],
      customer: ['name', 'email', 'phone', 'address', 'city', 'country'],
      order: ['order_number', 'customer_email', 'total', 'status', 'date'],
      invoice: ['invoice_number', 'customer_name', 'amount', 'due_date', 'status'],
    };

    return defaults[entityType] || ['id', 'name', 'description'];
  }

  private groupByStatus(stats: any[]): any {
    const result = {};
    stats.forEach(s => {
      if (!result[s.status]) {
        result[s.status] = 0;
      }
      result[s.status] += parseInt(s.count);
    });
    return result;
  }

  private groupByEntityType(stats: any[]): any {
    const result = {};
    stats.forEach(s => {
      if (!result[s.entity_type]) {
        result[s.entity_type] = 0;
      }
      result[s.entity_type] += parseInt(s.count);
    });
    return result;
  }

  private calculateSuccessRate(stats: any[]): number {
    const total = stats.reduce((sum, s) => sum + parseInt(s.total_rows || 0), 0);
    const successful = stats.reduce((sum, s) => sum + parseInt(s.successful_rows || 0), 0);
    
    return total > 0 ? (successful / total) * 100 : 0;
  }

  private calculateAverageTime(stats: any[]): number {
    const times = stats.map(s => parseFloat(s.avg_processing_time || 0)).filter(t => t > 0);
    
    return times.length > 0
      ? times.reduce((sum, t) => sum + t, 0) / times.length
      : 0;
  }
}