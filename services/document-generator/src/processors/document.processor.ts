import { Process, Processor } from '@nestjs/bull';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneratedDocument, DocumentStatus } from '../entities/generated-document.entity';
import { DocumentTemplate } from '../entities/document-template.entity';
import { PdfGeneratorService } from '../services/pdf-generator.service';
import { ExcelGeneratorService } from '../services/excel-generator.service';
import { WordGeneratorService } from '../services/word-generator.service';
import { ClientKafka } from '@nestjs/microservices';

@Processor('document-generation')
export class DocumentProcessor {
  private readonly logger = new Logger(DocumentProcessor.name);

  constructor(
    @InjectRepository(GeneratedDocument)
    private readonly documentRepository: Repository<GeneratedDocument>,
    @InjectRepository(DocumentTemplate)
    private readonly templateRepository: Repository<DocumentTemplate>,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly excelGenerator: ExcelGeneratorService,
    private readonly wordGenerator: WordGeneratorService,
    @Inject('KAFKA_CLIENT')
    private readonly kafkaClient: ClientKafka,
  ) {}

  @Process('generate')
  async handleGeneration(job: Job<any>) {
    const { documentId, tenantId } = job.data;

    this.logger.log(`Processing document ${documentId} for tenant ${tenantId}`);

    const document = await this.documentRepository.findOne({
      where: { id: documentId, tenant_id: tenantId },
    });

    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    const template = await this.templateRepository.findOne({
      where: { id: document.template_id, tenant_id: tenantId },
    });

    if (!template) {
      throw new Error(`Template ${document.template_id} not found`);
    }

    const startTime = Date.now();

    try {
      // Update status to processing
      document.status = DocumentStatus.PROCESSING;
      await this.documentRepository.save(document);

      let result: { buffer: Buffer; pages?: number; sheets?: number };
      let mimeType: string;
      let fileExtension: string;

      // Generate based on format
      switch (document.format) {
        case 'pdf':
          result = await this.pdfGenerator.generate(template, document.data, document.language);
          mimeType = 'application/pdf';
          fileExtension = 'pdf';
          break;
        
        case 'docx':
          result = await this.wordGenerator.generate(template, document.data, document.language);
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          fileExtension = 'docx';
          break;
        
        case 'xlsx':
          result = await this.excelGenerator.generate(template, document.data, document.language);
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          fileExtension = 'xlsx';
          break;
        
        case 'html':
          result = await this.generateHtml(template, document.data, document.language);
          mimeType = 'text/html';
          fileExtension = 'html';
          break;
        
        case 'csv':
          result = await this.generateCsv(template, document.data);
          mimeType = 'text/csv';
          fileExtension = 'csv';
          break;
        
        default:
          throw new Error(`Unsupported format: ${document.format}`);
      }

      // Store file (simplified - would normally use file storage service)
      const fileName = `${document.id}.${fileExtension}`;
      const filePath = `/documents/${tenantId}/${fileName}`;
      
      // Update document with success
      document.status = DocumentStatus.COMPLETED;
      document.file_path = filePath;
      document.file_url = `/api/documents/${document.id}/download`;
      document.file_size = result.buffer.length;
      document.mime_type = mimeType;
      document.processing_time_ms = Date.now() - startTime;

      await this.documentRepository.save(document);

      // Emit success event
      this.kafkaClient.emit('document.generation.completed', {
        document_id: document.id,
        tenant_id: tenantId,
        template_id: template.id,
        format: document.format,
        file_size: document.file_size,
        processing_time: document.processing_time_ms,
      });

      this.logger.log(`Document ${documentId} generated successfully in ${document.processing_time_ms}ms`);

      return document;
    } catch (error: any) {
      this.logger.error(`Document generation failed: ${error.message}`, error.stack);

      // Update document with failure
      document.status = DocumentStatus.FAILED;
      document.error_message = error.message;
      document.error_details = error.stack;
      document.processing_time_ms = Date.now() - startTime;

      await this.documentRepository.save(document);

      // Emit failure event
      this.kafkaClient.emit('document.generation.failed', {
        document_id: document.id,
        tenant_id: tenantId,
        template_id: template.id,
        error: error.message,
      });

      throw error;
    }
  }

  @Process('bulk')
  async handleBulkGeneration(job: Job<any>) {
    const { documents, tenantId } = job.data;

    this.logger.log(`Processing bulk generation of ${documents.length} documents`);

    const results: { id: any; status: string; result?: any }[] = [];
    const errors: { id: any; status: string; error?: string }[] = [];

    for (const docData of documents) {
      try {
        const result = await this.handleGeneration({
          data: { documentId: docData.id, tenantId },
        } as Job);
        results.push({ id: docData.id, status: 'success', result });
      } catch (error: any) {
        errors.push({ id: docData.id, status: 'failed', error: error.message });
        this.logger.error(`Bulk document ${docData.id} failed: ${error.message}`);
      }
    }

    return {
      total: documents.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }

  private async generateHtml(
    template: DocumentTemplate,
    data: Record<string, any>,
    language: string
  ): Promise<{ buffer: Buffer }> {
    const Handlebars = require('handlebars');
    
    const templateContent = this.getLocalizedTemplate(template, language);
    const compiled = Handlebars.compile(templateContent);
    const html = compiled(data);

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="${language}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.title || 'Document'}</title>
          <style>
            body {
              font-family: ${template.default_styles?.font_family || 'Arial, sans-serif'};
              font-size: ${template.default_styles?.font_size || 12}px;
              line-height: 1.6;
              color: #333;
              margin: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              padding: 10px;
              border: 1px solid #ddd;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
            }
            .bengali {
              font-family: 'Kalpurush', 'Noto Sans Bengali', sans-serif;
            }
          </style>
        </head>
        <body>
          ${template.header_template ? `<header>${Handlebars.compile(template.header_template)(data)}</header>` : ''}
          <main>${html}</main>
          ${template.footer_template ? `<footer>${Handlebars.compile(template.footer_template)(data)}</footer>` : ''}
        </body>
      </html>
    `;

    return { buffer: Buffer.from(fullHtml, 'utf-8') };
  }

  private async generateCsv(
    template: DocumentTemplate,
    data: Record<string, any>
  ): Promise<{ buffer: Buffer }> {
    let csv = '';

    // If data has items array, generate CSV from it
    if (data.items && Array.isArray(data.items)) {
      // Get headers from first item
      const headers = Object.keys(data.items[0]);
      csv += headers.join(',') + '\n';

      // Add data rows
      for (const item of data.items) {
        const row = headers.map(h => {
          const value = item[h];
          // Escape commas and quotes in values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csv += row.join(',') + '\n';
      }
    } else {
      // Generate simple key-value CSV
      csv = 'Key,Value\n';
      for (const [key, value] of Object.entries(data)) {
        if (typeof value !== 'object') {
          csv += `${key},${value}\n`;
        }
      }
    }

    return { buffer: Buffer.from(csv, 'utf-8') };
  }

  private getLocalizedTemplate(template: DocumentTemplate, language: string): string {
    if (language !== 'en' && template.localization?.[language]?.template_content) {
      return template.localization[language].template_content;
    }
    return template.template_content;
  }
}