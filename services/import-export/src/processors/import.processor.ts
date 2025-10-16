import { Process, Processor } from '@nestjs/bull';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImportJob, ImportStatus, ImportFormat } from '../entities/import-job.entity';
import { DataMapping } from '../entities/data-mapping.entity';
import { ValidationService } from '../services/validation.service';
import { DataMapperService } from '../services/data-mapper.service';
import { ClientKafka } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';

@Processor('import-jobs')
export class ImportProcessor {
  private readonly logger = new Logger(ImportProcessor.name);

  constructor(
    @InjectRepository(ImportJob)
    private readonly importJobRepository: Repository<ImportJob>,
    @InjectRepository(DataMapping)
    private readonly mappingRepository: Repository<DataMapping>,
    private readonly validationService: ValidationService,
    private readonly mapperService: DataMapperService,
    @Inject('KAFKA_CLIENT')
    private readonly kafkaClient: ClientKafka,
  ) {}

  @Process('process')
  async handleImport(job: Job<any>) {
    const { jobId, tenantId, retry = false } = job.data;

    this.logger.log(`Processing import job ${jobId} for tenant ${tenantId}`);

    const importJob = await this.importJobRepository.findOne({
      where: { id: jobId, tenant_id: tenantId },
    });

    if (!importJob) {
      throw new Error(`Import job ${jobId} not found`);
    }

    const startTime = Date.now();

    try {
      // Update status to validating
      importJob.status = ImportStatus.VALIDATING;
      importJob.started_at = new Date();
      await this.importJobRepository.save(importJob);

      // Read file
      const fileContent = await this.readFile(importJob.file_path, importJob.format);
      const data = await this.parseFile(fileContent, importJob.format, importJob.mapping_config);
      
      importJob.total_rows = data.length;

      // Validate data
      const validationResults = await this.validationService.validateBatch(
        data,
        importJob.validation_rules,
      );

      if (!importJob.dry_run && (validationResults.valid || !importJob.rollback_on_error)) {
        // Update status to processing
        importJob.status = ImportStatus.PROCESSING;
        await this.importJobRepository.save(importJob);

        // Get mapping if configured
        let mapping: DataMapping | null = null;
        if (importJob.mapping_id) {
          mapping = await this.mappingRepository.findOne({
            where: { id: importJob.mapping_id },
          });
        }

        // Process in batches
        const batchSize = importJob.batch_size || 100;
        const results = {
          successful: 0,
          failed: 0,
          skipped: 0,
          errors: [] as any[],
        };

        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          const batchResults = await this.processBatch(
            batch,
            importJob,
            mapping,
            i,
          );

          results.successful += batchResults.successful;
          results.failed += batchResults.failed;
          results.skipped += batchResults.skipped;
          results.errors.push(...batchResults.errors);

          // Update progress
          importJob.processed_rows = i + batch.length;
          importJob.successful_rows = results.successful;
          importJob.failed_rows = results.failed;
          importJob.skipped_rows = results.skipped;
          await this.importJobRepository.save(importJob);

          // Emit progress event
          this.kafkaClient.emit('import.job.progress', {
            job_id: importJob.id,
            tenant_id: tenantId,
            progress: (importJob.processed_rows / importJob.total_rows) * 100,
          });
        }

        // Save error details
        if (results.errors.length > 0) {
          importJob.error_details = results.errors.slice(0, 1000); // Limit to 1000 errors
          
          // Save full error report to file
          if (results.errors.length > 100) {
            const errorFile = await this.saveErrorReport(importJob.id, results.errors);
            importJob.error_file_path = errorFile;
          }
        }

        // Set final status
        if (results.failed === 0) {
          importJob.status = ImportStatus.COMPLETED;
        } else if (results.successful > 0) {
          importJob.status = ImportStatus.PARTIAL;
        } else {
          importJob.status = ImportStatus.FAILED;
        }

        // Set summary
        importJob.summary = {
          created: results.successful,
          updated: 0, // Would track updates separately
          duplicates: results.skipped,
          validation_errors: { total: validationResults.totalErrors },
        };
      } else {
        // Dry run or validation failed
        importJob.status = ImportStatus.FAILED;
        importJob.error_details = validationResults.results
          .filter(r => !r.valid)
          .flatMap(r => r.errors);
      }

      importJob.completed_at = new Date();
      importJob.processing_time_ms = Date.now() - startTime;
      await this.importJobRepository.save(importJob);

      // Emit completion event
      this.kafkaClient.emit('import.job.completed', {
        job_id: importJob.id,
        tenant_id: tenantId,
        status: importJob.status,
        summary: importJob.summary,
      });

      this.logger.log(`Import job ${jobId} completed with status ${importJob.status}`);
      return importJob;

    } catch (error: any) {
      this.logger.error(`Import job ${jobId} failed: ${error.message}`, error.stack);

      importJob.status = ImportStatus.FAILED;
      importJob.error_details = [{
        row: 0,
        error: error.message,
      }];
      importJob.completed_at = new Date();
      importJob.processing_time_ms = Date.now() - startTime;

      await this.importJobRepository.save(importJob);

      // Emit failure event
      this.kafkaClient.emit('import.job.failed', {
        job_id: importJob.id,
        tenant_id: tenantId,
        error: error.message,
      });

      throw error;
    }
  }

  private async readFile(filePath: string, format: ImportFormat): Promise<Buffer> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return fs.readFileSync(filePath);
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
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private parseCsv(buffer: Buffer, config?: any): any[] {
    const csv = require('csv-parse/sync');
    return csv.parse(buffer, {
      columns: true,
      delimiter: config?.delimiter || ',',
      skip_empty_lines: true,
      skip_records_with_error: true,
      trim: config?.options?.trim_values !== false,
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
        if (Object.keys(obj).length > 0) {
          data.push(obj);
        }
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

  private async processBatch(
    batch: any[],
    importJob: ImportJob,
    mapping: DataMapping | null,
    startIndex: number,
  ): Promise<any> {
    const results = {
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as any[],
    };

    for (let i = 0; i < batch.length; i++) {
      const row = batch[i];
      const rowNumber = startIndex + i + 1;

      try {
        // Apply mapping if configured
        const mappedData = mapping
          ? this.mapperService.applyMapping(row, mapping)
          : row;

        // Process row (emit to appropriate service)
        await this.processRow(mappedData, importJob.entity_type, importJob.tenant_id);

        results.successful++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          data: row,
          error: error.message,
        });
      }
    }

    return results;
  }

  private async processRow(
    data: any,
    entityType: string,
    tenantId: string,
  ): Promise<void> {
    // Emit event to appropriate service for processing
    this.kafkaClient.emit(`${entityType}.import`, {
      tenant_id: tenantId,
      data,
    });

    // In a real implementation, this would call the appropriate service
    // For now, simulating async processing
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  private async saveErrorReport(jobId: string, errors: any[]): Promise<string> {
    const errorDir = path.join('uploads', 'imports', 'errors');
    if (!fs.existsSync(errorDir)) {
      fs.mkdirSync(errorDir, { recursive: true });
    }

    const filename = `${jobId}_errors.json`;
    const filepath = path.join(errorDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(errors, null, 2));
    return filepath;
  }
}