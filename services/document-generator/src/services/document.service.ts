import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Document, DocumentStatus } from '../entities/document.entity';
import { GenerateDocumentInput, SearchDocumentInput, DocumentConnection } from '../dto/document.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectQueue('document-generation')
    private readonly documentQueue: Queue,
    @Inject('KAFKA_CLIENT') private kafkaClient: ClientProxy,
  ) {}

  async findById(id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return document;
  }

  async findByTenant(tenantId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' }
    });
  }

  async findByTemplate(tenantId: string, templateId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: {
        tenant_id: tenantId,
        template_id: templateId
      },
      order: { created_at: 'DESC' }
    });
  }

  async searchDocuments(input: SearchDocumentInput): Promise<DocumentConnection> {
    const query = this.documentRepository.createQueryBuilder('document');

    query.where('document.tenant_id = :tenantId', { tenantId: input.tenantId });

    if (input.query) {
      query.andWhere('document.file_name ILIKE :query', { query: `%${input.query}%` });
    }

    if (input.status) {
      query.andWhere('document.status = :status', { status: input.status });
    }

    if (input.templateId) {
      query.andWhere('document.template_id = :templateId', { templateId: input.templateId });
    }

    if (input.startDate) {
      query.andWhere('document.created_at >= :startDate', { startDate: input.startDate });
    }

    if (input.endDate) {
      query.andWhere('document.created_at <= :endDate', { endDate: input.endDate });
    }

    const totalCount = await query.getCount();

    query.skip(input.offset || 0).take(input.limit || 10);
    query.orderBy('document.created_at', 'DESC');

    const documents = await query.getMany();

    return {
      nodes: documents,
      totalCount,
      hasNextPage: (input.offset || 0) + (input.limit || 10) < totalCount,
      hasPreviousPage: (input.offset || 0) > 0
    };
  }

  async findPaginated(
    tenantId: string,
    limit: number,
    offset: number
  ): Promise<DocumentConnection> {
    const [documents, totalCount] = await this.documentRepository.findAndCount({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit
    });

    return {
      nodes: documents,
      totalCount,
      hasNextPage: offset + limit < totalCount,
      hasPreviousPage: offset > 0
    };
  }

  async getDownloadUrl(id: string): Promise<string> {
    const document = await this.findById(id);

    if (document.status !== DocumentStatus.COMPLETED) {
      throw new BadRequestException('Document generation not completed');
    }

    if (!document.file_path) {
      throw new NotFoundException('Document file not found');
    }

    // Generate a presigned URL or return the file path
    // This would integrate with your file storage service
    return `${process.env.API_URL}/documents/download/${id}`;
  }

  async generateDocument(input: GenerateDocumentInput): Promise<Document> {
    const document = this.documentRepository.create({
      tenant_id: input.tenantId,
      template_id: input.templateId,
      file_name: input.fileName,
      status: DocumentStatus.PENDING,
      data: JSON.parse(input.data),
      metadata: input.options ? JSON.parse(input.options) : null,
    });

    const savedDocument = await this.documentRepository.save(document);

    // Queue for async generation
    await this.documentQueue.add('generate', {
      documentId: savedDocument.id,
      format: input.format,
      data: input.data,
      options: input.options
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });

    // Emit event
    this.kafkaClient.emit('document.generation.started', {
      documentId: savedDocument.id,
      tenantId: input.tenantId,
      templateId: input.templateId,
      format: input.format
    });

    return savedDocument;
  }

  async generatePdf(tenantId: string, templateId: string, data: any): Promise<Document> {
    const document = this.documentRepository.create({
      tenant_id: tenantId,
      template_id: templateId,
      file_name: `document-${Date.now()}.pdf`,
      mime_type: 'application/pdf',
      status: DocumentStatus.PENDING,
      data: data,
    });

    const savedDocument = await this.documentRepository.save(document);

    // Queue for PDF generation
    await this.documentQueue.add('generate-pdf', {
      documentId: savedDocument.id,
      templateId,
      data
    });

    this.kafkaClient.emit('document.pdf.generation.started', {
      documentId: savedDocument.id,
      tenantId
    });

    return savedDocument;
  }

  async generateExcel(tenantId: string, templateId: string, data: any): Promise<Document> {
    const document = this.documentRepository.create({
      tenant_id: tenantId,
      template_id: templateId,
      file_name: `spreadsheet-${Date.now()}.xlsx`,
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      status: DocumentStatus.PENDING,
      data: data,
    });

    const savedDocument = await this.documentRepository.save(document);

    // Queue for Excel generation
    await this.documentQueue.add('generate-excel', {
      documentId: savedDocument.id,
      templateId,
      data
    });

    this.kafkaClient.emit('document.excel.generation.started', {
      documentId: savedDocument.id,
      tenantId
    });

    return savedDocument;
  }

  async generateWord(tenantId: string, templateId: string, data: any): Promise<Document> {
    const document = this.documentRepository.create({
      tenant_id: tenantId,
      template_id: templateId,
      file_name: `document-${Date.now()}.docx`,
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      status: DocumentStatus.PENDING,
      data: data,
    });

    const savedDocument = await this.documentRepository.save(document);

    // Queue for Word generation
    await this.documentQueue.add('generate-word', {
      documentId: savedDocument.id,
      templateId,
      data
    });

    this.kafkaClient.emit('document.word.generation.started', {
      documentId: savedDocument.id,
      tenantId
    });

    return savedDocument;
  }

  async regenerateDocument(id: string): Promise<Document> {
    const document = await this.findById(id);

    if (!document.data) {
      throw new BadRequestException('No data available for regeneration');
    }

    // Reset status
    document.status = DocumentStatus.PENDING;
    document.error_message = null as any;
    document.generated_at = null as any;

    const updatedDocument = await this.documentRepository.save(document);

    // Re-queue for generation
    await this.documentQueue.add('regenerate', {
      documentId: document.id,
      format: document.mime_type,
      data: document.data
    });

    this.kafkaClient.emit('document.regeneration.started', {
      documentId: document.id
    });

    return updatedDocument;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const document = await this.findById(id);

    // Delete physical file if exists
    if (document.file_path) {
      // This would integrate with your file storage service
      this.logger.log(`Deleting file: ${document.file_path}`);
    }

    await this.documentRepository.remove(document);

    this.kafkaClient.emit('document.deleted', {
      documentId: id,
      tenantId: document.tenant_id
    });

    return true;
  }

  async cleanupOldDocuments(daysOld: number): Promise<boolean> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const oldDocuments = await this.documentRepository
        .createQueryBuilder('document')
        .where('document.created_at < :cutoffDate', { cutoffDate })
        .andWhere('document.status = :status', { status: DocumentStatus.COMPLETED })
        .getMany();

      for (const document of oldDocuments) {
        await this.deleteDocument(document.id);
      }

      this.logger.log(`Cleaned up ${oldDocuments.length} old documents`);

      return true;
    } catch (error) {
      this.logger.error(`Failed to cleanup old documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  async updateDocumentStatus(id: string, status: DocumentStatus, error?: string): Promise<Document> {
    const document = await this.findById(id);

    document.status = status;
    if (error) {
      document.error_message = error;
    }
    if (status === DocumentStatus.COMPLETED) {
      document.generated_at = new Date();
    }

    return await this.documentRepository.save(document);
  }

  async updateDocumentFile(id: string, filePath: string, fileSize: number, mimeType: string): Promise<Document> {
    const document = await this.findById(id);

    document.file_path = filePath;
    document.file_size = fileSize;
    document.mime_type = mimeType;
    document.status = DocumentStatus.COMPLETED;
    document.generated_at = new Date();

    return await this.documentRepository.save(document);
  }
}