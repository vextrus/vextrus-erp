import { Process, Processor } from '@nestjs/bull';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExportJob, ExportStatus, ExportFormat } from '../entities/export-job.entity';
import { ClientKafka } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';

@Processor('export-jobs')
export class ExportProcessor {
  private readonly logger = new Logger(ExportProcessor.name);

  constructor(
    @InjectRepository(ExportJob)
    private readonly exportJobRepository: Repository<ExportJob>,
    @Inject('KAFKA_CLIENT')
    private readonly kafkaClient: ClientKafka,
  ) {}

  @Process('process')
  async handleExport(job: Job<any>) {
    const { jobId, tenantId, retry = false } = job.data;

    this.logger.log(`Processing export job ${jobId} for tenant ${tenantId}`);

    const exportJob = await this.exportJobRepository.findOne({
      where: { id: jobId, tenant_id: tenantId },
    });

    if (!exportJob) {
      throw new Error(`Export job ${jobId} not found`);
    }

    const startTime = Date.now();

    try {
      // Update status to querying
      exportJob.status = ExportStatus.QUERYING;
      exportJob.started_at = new Date();
      await this.exportJobRepository.save(exportJob);

      // Fetch data from entity service
      const data = await this.fetchData(
        tenantId,
        exportJob.entity_type,
        exportJob.query_params,
      );

      exportJob.total_records = data.length;

      // Update status to processing
      exportJob.status = ExportStatus.PROCESSING;
      await this.exportJobRepository.save(exportJob);

      // Process in batches
      const batchSize = exportJob.batch_size || 1000;
      const chunks: any[][] = [];

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const processedBatch = await this.processBatch(batch, exportJob.export_config);
        chunks.push(processedBatch);

        // Update progress
        exportJob.processed_records = Math.min(i + batchSize, data.length);
        await this.exportJobRepository.save(exportJob);

        // Emit progress event
        this.kafkaClient.emit('export.job.progress', {
          job_id: exportJob.id,
          tenant_id: tenantId,
          progress: (exportJob.processed_records / exportJob.total_records) * 100,
        });
      }

      // Generate export file
      const exportFile = await this.generateExportFile(
        chunks,
        exportJob.format,
        exportJob.export_config,
      );

      // Save file
      const filePath = await this.saveExportFile(
        exportJob.id,
        exportFile.buffer,
        exportJob.format,
      );

      // Compress if requested
      if (exportJob.compress) {
        const compressedPath = await this.compressFile(
          filePath,
          exportJob.compression_type || 'zip',
        );
        exportJob.file_path = compressedPath;
        exportJob.file_size = fs.statSync(compressedPath).size;
      } else {
        exportJob.file_path = filePath;
        exportJob.file_size = exportFile.buffer.length;
      }

      // Set file metadata
      exportJob.file_url = `/api/export/jobs/${exportJob.id}/download`;
      exportJob.mime_type = exportFile.mime_type;
      exportJob.status = ExportStatus.COMPLETED;
      exportJob.completed_at = new Date();
      exportJob.processing_time_ms = Date.now() - startTime;

      // Set expiration if configured
      if (!exportJob.expires_at) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7); // Default 7 days
        exportJob.expires_at = expirationDate;
      }

      await this.exportJobRepository.save(exportJob);

      // Send notifications if configured
      if (exportJob.notification_config?.on_complete) {
        await this.sendNotification(exportJob, 'complete');
      }

      // Emit completion event
      this.kafkaClient.emit('export.job.completed', {
        job_id: exportJob.id,
        tenant_id: tenantId,
        file_url: exportJob.file_url,
        file_size: exportJob.file_size,
        total_records: exportJob.total_records,
      });

      this.logger.log(`Export job ${jobId} completed successfully`);
      return exportJob;

    } catch (error: any) {
      this.logger.error(`Export job ${jobId} failed: ${error.message}`, error.stack);

      exportJob.status = ExportStatus.FAILED;
      exportJob.error_message = error.message;
      exportJob.error_details = error.stack;
      exportJob.completed_at = new Date();
      exportJob.processing_time_ms = Date.now() - startTime;

      await this.exportJobRepository.save(exportJob);

      // Send failure notification if configured
      if (exportJob.notification_config?.on_failure) {
        await this.sendNotification(exportJob, 'failure');
      }

      // Emit failure event
      this.kafkaClient.emit('export.job.failed', {
        job_id: exportJob.id,
        tenant_id: tenantId,
        error: error.message,
      });

      throw error;
    }
  }

  private async fetchData(
    tenantId: string,
    entityType: string,
    queryParams?: any,
  ): Promise<any[]> {
    // Emit request to appropriate service
    const response = await this.kafkaClient
      .send(`${entityType}.export.query`, {
        tenant_id: tenantId,
        filters: queryParams?.filters,
        sort: queryParams?.sort,
        fields: queryParams?.fields,
        relations: queryParams?.relations,
        date_range: queryParams?.date_range,
      })
      .toPromise();

    // For now, return mock data
    const mockData: any[] = [];
    const count = 100;

    for (let i = 0; i < count; i++) {
      mockData.push({
        id: i + 1,
        name: `${entityType} ${i + 1}`,
        description: `Description for ${entityType} ${i + 1}`,
        price: Math.random() * 1000,
        quantity: Math.floor(Math.random() * 100),
        created_at: new Date(),
      });
    }

    return mockData;
  }

  private async processBatch(data: any[], config?: any): Promise<any[]> {
    return data.map(row => {
      const processed = {};

      // Apply field mapping
      if (config?.field_mapping) {
        Object.entries(config.field_mapping).forEach(([source, target]) => {
          processed[target as string] = row[source];
        });
      } else {
        Object.assign(processed, row);
      }

      // Apply formatting
      Object.keys(processed).forEach(key => {
        const value = processed[key];

        // Date formatting
        if (value instanceof Date && config?.date_format) {
          processed[key] = this.formatDate(value, config.date_format);
        }

        // Number formatting
        if (typeof value === 'number' && config?.number_format) {
          processed[key] = this.formatNumber(value, config.number_format);
        }

        // Boolean formatting
        if (typeof value === 'boolean' && config?.boolean_format) {
          processed[key] = value ? config.boolean_format.true : config.boolean_format.false;
        }

        // Null formatting
        if (value === null && config?.null_value !== undefined) {
          processed[key] = config.null_value;
        }
      });

      return processed;
    });
  }

  private async generateExportFile(
    chunks: any[][],
    format: ExportFormat,
    config?: any,
  ): Promise<{ buffer: Buffer; mime_type: string }> {
    const data = chunks.flat();

    switch (format) {
      case ExportFormat.CSV:
        return this.generateCsv(data, config);
      case ExportFormat.EXCEL:
        return this.generateExcel(data, config);
      case ExportFormat.JSON:
        return this.generateJson(data);
      case ExportFormat.XML:
        return this.generateXml(data);
      case ExportFormat.TSV:
        return this.generateCsv(data, { ...config, delimiter: '\t' });
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private generateCsv(data: any[], config?: any): { buffer: Buffer; mime_type: string } {
    const csv = require('csv-stringify/sync');
    
    const output = csv.stringify(data, {
      header: config?.include_headers !== false,
      delimiter: config?.delimiter || ',',
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
      const headers = Object.keys(data[0]);
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
      worksheet.addRow(Object.values(row));
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const length = cell.value ? cell.value.toString().length : 0;
        if (length > maxLength) {
          maxLength = length;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer: Buffer.from(buffer),
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private generateJson(data: any[]): { buffer: Buffer; mime_type: string } {
    return {
      buffer: Buffer.from(JSON.stringify(data, null, 2)),
      mime_type: 'application/json',
    };
  }

  private generateXml(data: any[]): { buffer: Buffer; mime_type: string } {
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

  private async saveExportFile(
    jobId: string,
    buffer: Buffer,
    format: ExportFormat,
  ): Promise<string> {
    const exportDir = path.join('uploads', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filename = `${jobId}_export.${format}`;
    const filepath = path.join(exportDir, filename);
    
    fs.writeFileSync(filepath, buffer);
    return filepath;
  }

  private async compressFile(filePath: string, type: string): Promise<string> {
    const outputPath = `${filePath}.${type}`;
    const output = fs.createWriteStream(outputPath);
    const archive = archiver(type as archiver.Format, {
      zlib: { level: 9 },
    });

    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(outputPath));
      archive.on('error', reject);

      archive.pipe(output);
      archive.file(filePath, { name: path.basename(filePath) });
      archive.finalize();
    });
  }

  private async sendNotification(exportJob: ExportJob, type: 'complete' | 'failure') {
    if (!exportJob.notification_config?.email?.length) return;

    this.kafkaClient.emit('notification.send', {
      tenant_id: exportJob.tenant_id,
      channel: 'email',
      recipients: exportJob.notification_config.email,
      template: `export_${type}`,
      data: {
        job_name: exportJob.job_name,
        entity_type: exportJob.entity_type,
        total_records: exportJob.total_records,
        file_url: exportJob.file_url,
        error: exportJob.error_message,
      },
    });
  }

  private formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  private formatNumber(value: number, format: string): string {
    // Simple number formatting
    if (format === 'currency') {
      return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    if (format === 'percentage') {
      return (value * 100).toFixed(2) + '%';
    }
    return value.toString();
  }
}