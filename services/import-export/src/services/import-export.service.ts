import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { ImportJob, ImportStatus } from '../entities/import-job.entity';
import { ExportJob, ExportStatus } from '../entities/export-job.entity';
import { CreateImportJobInput } from '../dto/create-import-job.input';
import { CreateExportJobInput } from '../dto/create-export-job.input';
import { UpdateImportJobInput } from '../dto/update-import-job.input';
import { UpdateExportJobInput } from '../dto/update-export-job.input';
import { ImportJobConnection } from '../dto/import-job-connection.dto';
import { ExportJobConnection } from '../dto/export-job-connection.dto';

@Injectable()
export class ImportExportService {
  private readonly logger = new Logger(ImportExportService.name);

  constructor(
    @InjectRepository(ImportJob)
    private readonly importJobRepository: Repository<ImportJob>,
    @InjectRepository(ExportJob)
    private readonly exportJobRepository: Repository<ExportJob>,
  ) {}

  // Import Job Methods
  async findImportJobById(id: string): Promise<ImportJob> {
    const job = await this.importJobRepository.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Import job with ID ${id} not found`);
    }
    return job;
  }

  async findImportJobsByTenant(tenantId: string): Promise<ImportJob[]> {
    return this.importJobRepository.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
  }

  async findImportJobsByStatus(status: string, tenantId?: string): Promise<ImportJob[]> {
    const where: FindOptionsWhere<ImportJob> = { status: status as ImportStatus };
    if (tenantId) {
      where.tenant_id = tenantId;
    }
    return this.importJobRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async findImportJobsPaginated(params: {
    first: number;
    after?: string;
    tenantId?: string;
  }): Promise<ImportJobConnection> {
    const { first, after, tenantId } = params;
    const query = this.importJobRepository.createQueryBuilder('import_job');

    if (tenantId) {
      query.where('import_job.tenant_id = :tenantId', { tenantId });
    }

    if (after) {
      query.andWhere('import_job.id > :after', { after });
    }

    const [jobs, totalCount] = await query
      .take(first + 1)
      .orderBy('import_job.created_at', 'DESC')
      .getManyAndCount();

    const hasNextPage = jobs.length > first;
    const edges = jobs.slice(0, first).map(node => ({
      cursor: node.id,
      node,
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!after,
        startCursor: edges[0]?.cursor,
        endCursor: edges[edges.length - 1]?.cursor,
      },
      totalCount,
    };
  }

  async createImportJob(input: CreateImportJobInput): Promise<ImportJob> {
    const job = this.importJobRepository.create({
      ...input,
      status: ImportStatus.PENDING,
      created_at: new Date(),
    });
    return this.importJobRepository.save(job);
  }

  async updateImportJob(id: string, input: UpdateImportJobInput): Promise<ImportJob> {
    const job = await this.findImportJobById(id);
    Object.assign(job, input, { updated_at: new Date() });
    return this.importJobRepository.save(job);
  }

  async startImportJob(id: string): Promise<ImportJob> {
    const job = await this.findImportJobById(id);
    job.status = ImportStatus.PROCESSING;
    job.started_at = new Date();
    return this.importJobRepository.save(job);
  }

  async cancelImportJob(id: string): Promise<ImportJob> {
    const job = await this.findImportJobById(id);
    job.status = ImportStatus.CANCELLED;
    return this.importJobRepository.save(job);
  }

  async retryImportJob(id: string): Promise<ImportJob> {
    const job = await this.findImportJobById(id);
    job.status = ImportStatus.PENDING;
    job.processed_rows = 0;
    job.successful_rows = 0;
    job.failed_rows = 0;
    job.skipped_rows = 0;
    job.error_details = [];
    return this.importJobRepository.save(job);
  }

  async deleteImportJob(id: string): Promise<boolean> {
    const result = await this.importJobRepository.delete(id);
    return (result.affected || 0) > 0;
  }

  async validateImportFile(filePath: string, entityType: string, format: string): Promise<string> {
    // TODO: Implement file validation logic
    this.logger.log(`Validating import file: ${filePath} for entity: ${entityType} in format: ${format}`);
    return 'Validation successful';
  }

  // Export Job Methods
  async findExportJobById(id: string): Promise<ExportJob> {
    const job = await this.exportJobRepository.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Export job with ID ${id} not found`);
    }
    return job;
  }

  async findExportJobsByTenant(tenantId: string): Promise<ExportJob[]> {
    return this.exportJobRepository.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
  }

  async findExportJobsByStatus(status: string, tenantId?: string): Promise<ExportJob[]> {
    const where: FindOptionsWhere<ExportJob> = { status: status as ExportStatus };
    if (tenantId) {
      where.tenant_id = tenantId;
    }
    return this.exportJobRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async findExportJobsPaginated(params: {
    first: number;
    after?: string;
    tenantId?: string;
  }): Promise<ExportJobConnection> {
    const { first, after, tenantId } = params;
    const query = this.exportJobRepository.createQueryBuilder('export_job');

    if (tenantId) {
      query.where('export_job.tenant_id = :tenantId', { tenantId });
    }

    if (after) {
      query.andWhere('export_job.id > :after', { after });
    }

    const [jobs, totalCount] = await query
      .take(first + 1)
      .orderBy('export_job.created_at', 'DESC')
      .getManyAndCount();

    const hasNextPage = jobs.length > first;
    const edges = jobs.slice(0, first).map(node => ({
      cursor: node.id,
      node,
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!after,
        startCursor: edges[0]?.cursor,
        endCursor: edges[edges.length - 1]?.cursor,
      },
      totalCount,
    };
  }

  async createExportJob(input: CreateExportJobInput): Promise<ExportJob> {
    const job = this.exportJobRepository.create({
      ...input,
      status: ExportStatus.PENDING,
      created_at: new Date(),
    });
    return this.exportJobRepository.save(job);
  }

  async updateExportJob(id: string, input: UpdateExportJobInput): Promise<ExportJob> {
    const job = await this.findExportJobById(id);
    Object.assign(job, input, { updated_at: new Date() });
    return this.exportJobRepository.save(job);
  }

  async startExportJob(id: string): Promise<ExportJob> {
    const job = await this.findExportJobById(id);
    job.status = ExportStatus.PROCESSING;
    job.started_at = new Date();
    return this.exportJobRepository.save(job);
  }

  async cancelExportJob(id: string): Promise<ExportJob> {
    const job = await this.findExportJobById(id);
    job.status = ExportStatus.CANCELLED;
    return this.exportJobRepository.save(job);
  }

  async retryExportJob(id: string): Promise<ExportJob> {
    const job = await this.findExportJobById(id);
    job.status = ExportStatus.PENDING;
    job.processed_records = 0;
    job.error_message = undefined as any;
    job.error_details = undefined as any;
    return this.exportJobRepository.save(job);
  }

  async deleteExportJob(id: string): Promise<boolean> {
    const result = await this.exportJobRepository.delete(id);
    return (result.affected || 0) > 0;
  }

  async getExportFileUrl(id: string): Promise<string> {
    const job = await this.findExportJobById(id);
    if (!job.file_url) {
      throw new NotFoundException(`Export file URL not available for job ${id}`);
    }
    return job.file_url;
  }

  // Processing methods (to be implemented with actual business logic)
  async processImportJob(jobId: string): Promise<void> {
    const job = await this.findImportJobById(jobId);

    try {
      // Update status to processing
      job.status = ImportStatus.PROCESSING;
      job.started_at = new Date();
      await this.importJobRepository.save(job);

      // TODO: Implement actual import processing logic
      // This would include:
      // 1. Reading the file based on format
      // 2. Validating data based on validation_rules
      // 3. Processing in batches based on batch_size
      // 4. Applying mapping_config
      // 5. Handling errors and updating error_details
      // 6. Updating progress (processed_rows, successful_rows, failed_rows)

      // For now, just mark as completed
      job.status = ImportStatus.COMPLETED;
      job.completed_at = new Date();
      job.processing_time_ms = job.completed_at.getTime() - job.started_at.getTime();
      await this.importJobRepository.save(job);

    } catch (error: any) {
      job.status = ImportStatus.FAILED;
      job.error_details = [{ row: 0, error: error.message }];
      await this.importJobRepository.save(job);
      throw error;
    }
  }

  async processExportJob(jobId: string): Promise<void> {
    const job = await this.findExportJobById(jobId);

    try {
      // Update status to processing
      job.status = ExportStatus.PROCESSING;
      job.started_at = new Date();
      await this.exportJobRepository.save(job);

      // TODO: Implement actual export processing logic
      // This would include:
      // 1. Querying data based on query_params
      // 2. Applying export_config formatting
      // 3. Generating file in requested format
      // 4. Processing in batches based on batch_size
      // 5. Applying compression if requested
      // 6. Uploading to storage and generating file_url

      // For now, just mark as completed
      job.status = ExportStatus.COMPLETED;
      job.completed_at = new Date();
      job.processing_time_ms = job.completed_at.getTime() - job.started_at.getTime();
      await this.exportJobRepository.save(job);

    } catch (error: any) {
      job.status = ExportStatus.FAILED;
      job.error_message = error.message;
      job.error_details = JSON.stringify(error);
      await this.exportJobRepository.save(job);
      throw error;
    }
  }
}