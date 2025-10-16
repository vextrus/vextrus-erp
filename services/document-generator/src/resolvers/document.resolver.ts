import { Resolver, Query, Mutation, Args, ResolveReference, ID, Int } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { Document } from '../entities/document.entity';
import { DocumentService } from '../services/document.service';
import { CreateDocumentInput, GenerateDocumentInput, DocumentConnection, SearchDocumentInput } from '../dto/document.dto';

@Injectable()
@Resolver(() => Document)
export class DocumentResolver {
  constructor(private readonly documentService: DocumentService) {}

  @Query(() => Document, { nullable: true })
  async document(@Args('id', { type: () => ID }) id: string): Promise<Document> {
    return this.documentService.findById(id);
  }

  @Query(() => [Document])
  async documentsByTenant(@Args('tenantId', { type: () => ID }) tenantId: string): Promise<Document[]> {
    return this.documentService.findByTenant(tenantId);
  }

  @Query(() => [Document])
  async documentsByTemplate(
    @Args('tenantId', { type: () => ID }) tenantId: string,
    @Args('templateId', { type: () => ID }) templateId: string
  ): Promise<Document[]> {
    return this.documentService.findByTemplate(tenantId, templateId);
  }

  @Query(() => DocumentConnection)
  async searchDocuments(
    @Args('input') input: SearchDocumentInput
  ): Promise<DocumentConnection> {
    return this.documentService.searchDocuments(input);
  }

  @Query(() => DocumentConnection)
  async documentsPaginated(
    @Args('tenantId', { type: () => ID }) tenantId: string,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number
  ): Promise<DocumentConnection> {
    return this.documentService.findPaginated(tenantId, limit, offset);
  }

  @Query(() => String, { nullable: true })
  async documentDownloadUrl(
    @Args('id', { type: () => ID }) id: string
  ): Promise<string> {
    return this.documentService.getDownloadUrl(id);
  }

  @Mutation(() => Document)
  async generateDocument(
    @Args('input') input: GenerateDocumentInput
  ): Promise<Document> {
    return this.documentService.generateDocument(input);
  }

  @Mutation(() => Document)
  async generatePdf(
    @Args('tenantId', { type: () => ID }) tenantId: string,
    @Args('templateId', { type: () => ID }) templateId: string,
    @Args('data', { type: () => String }) data: string
  ): Promise<Document> {
    return this.documentService.generatePdf(tenantId, templateId, JSON.parse(data));
  }

  @Mutation(() => Document)
  async generateExcel(
    @Args('tenantId', { type: () => ID }) tenantId: string,
    @Args('templateId', { type: () => ID }) templateId: string,
    @Args('data', { type: () => String }) data: string
  ): Promise<Document> {
    return this.documentService.generateExcel(tenantId, templateId, JSON.parse(data));
  }

  @Mutation(() => Document)
  async generateWord(
    @Args('tenantId', { type: () => ID }) tenantId: string,
    @Args('templateId', { type: () => ID }) templateId: string,
    @Args('data', { type: () => String }) data: string
  ): Promise<Document> {
    return this.documentService.generateWord(tenantId, templateId, JSON.parse(data));
  }

  @Mutation(() => Document)
  async regenerateDocument(
    @Args('id', { type: () => ID }) id: string
  ): Promise<Document> {
    return this.documentService.regenerateDocument(id);
  }

  @Mutation(() => Boolean)
  async deleteDocument(
    @Args('id', { type: () => ID }) id: string
  ): Promise<boolean> {
    return this.documentService.deleteDocument(id);
  }

  @Mutation(() => Boolean)
  async cleanupOldDocuments(
    @Args('daysOld', { type: () => Int, defaultValue: 30 }) daysOld: number
  ): Promise<boolean> {
    return this.documentService.cleanupOldDocuments(daysOld);
  }

  @ResolveReference()
  async resolveReference(reference: { __typename: string; id: string }): Promise<Document> {
    return this.documentService.findById(reference.id);
  }
}