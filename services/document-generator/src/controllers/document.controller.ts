import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  Res,
  HttpStatus,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentService } from '../services/document.service';
import { GenerateDocumentDto } from '../dto/generate-document.dto';
import { DocumentStatus } from '../entities/generated-document.entity';

@ApiTags('documents')
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new document' })
  @ApiResponse({ status: 201, description: 'Document generation initiated' })
  async generateDocument(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: GenerateDocumentDto,
  ) {
    const input = {
      tenantId,
      templateId: dto.template_id,
      fileName: dto.document_name,
      format: dto.format,
      data: JSON.stringify(dto.data),
      options: dto.generation_options ? JSON.stringify(dto.generation_options) : undefined,
    };
    return this.documentService.generateDocument(input);
  }

  @Post('generate-sync')
  @ApiOperation({ summary: 'Generate document synchronously' })
  async generateDocumentSync(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: GenerateDocumentDto,
    @Res() res: Response,
  ) {
    // For now, use the regular generate method
    const input = {
      tenantId,
      templateId: dto.template_id,
      fileName: dto.document_name,
      format: dto.format,
      data: JSON.stringify(dto.data),
      options: dto.generation_options ? JSON.stringify(dto.generation_options) : undefined,
    };
    const document = await this.documentService.generateDocument(input);
    
    res.set({
      'Content-Type': document.mime_type,
      'Content-Disposition': `attachment; filename="${document.file_name}"`,
      'Content-Length': document.file_size,
    });

    // TODO: Return actual file buffer
    return new StreamableFile(Buffer.from('Document content'));
  }

  @Post('bulk-generate')
  @ApiOperation({ summary: 'Generate multiple documents' })
  async bulkGenerate(
    @Headers('x-tenant-id') tenantId: string,
    @Body() documents: GenerateDocumentDto[],
  ) {
    // Bulk generation - process each document
    const results: any[] = [];
    for (const doc of documents) {
      const input = {
        tenantId,
        templateId: doc.template_id,
        fileName: doc.document_name,
        format: doc.format,
        data: JSON.stringify(doc.data),
        options: doc.generation_options ? JSON.stringify(doc.generation_options) : undefined,
      };
      const result = await this.documentService.generateDocument(input);
      results.push(result);
    }
    return results;
  }

  @Get()
  @ApiOperation({ summary: 'Get generated documents' })
  @ApiQuery({ name: 'status', required: false, enum: DocumentStatus })
  @ApiQuery({ name: 'reference_type', required: false })
  @ApiQuery({ name: 'reference_id', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getDocuments(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: DocumentStatus,
    @Query('reference_type') referenceType?: string,
    @Query('reference_id') referenceId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    // TODO: Implement getDocuments method in service
    return {
      documents: [],
      total: 0,
      page,
      limit,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details' })
  async getDocument(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    // TODO: Implement getDocument method in service
    return this.documentService.findById(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download generated document' })
  async downloadDocument(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    // TODO: Implement downloadDocument method in service
    const document = await this.documentService.findById(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="document-${id}.pdf"`,
    });

    return new StreamableFile(Buffer.from('PDF content placeholder'));
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview document' })
  async previewDocument(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    // TODO: Implement preview method in service
    const document = await this.documentService.findById(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="document-${id}.pdf"`,
    });

    return new StreamableFile(Buffer.from('PDF preview placeholder'));
  }

  @Post(':id/regenerate')
  @ApiOperation({ summary: 'Regenerate a document' })
  async regenerateDocument(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.documentService.regenerateDocument(id);
  }

  @Get('statistics/summary')
  @ApiOperation({ summary: 'Get document generation statistics' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getStatistics(
    @Headers('x-tenant-id') tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    // TODO: Implement getStatistics method in service
    return {
      total: 0,
      pending: 0,
      completed: 0,
      failed: 0,
      byTemplate: {},
      byFormat: {},
      period: {
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      },
    };
  }
}