import { Resolver, Query, Mutation, Args, ResolveReference } from '@nestjs/graphql';
import { ImportJob } from '../entities/import-job.entity';
import { ExportJob } from '../entities/export-job.entity';
import { ImportExportService } from '../services/import-export.service';
import { CreateImportJobInput } from '../dto/create-import-job.input';
import { CreateExportJobInput } from '../dto/create-export-job.input';
import { UpdateImportJobInput } from '../dto/update-import-job.input';
import { UpdateExportJobInput } from '../dto/update-export-job.input';
import { ImportJobConnection } from '../dto/import-job-connection.dto';
import { ExportJobConnection } from '../dto/export-job-connection.dto';

@Resolver(() => ImportJob)
export class ImportJobResolver {
  constructor(private readonly importExportService: ImportExportService) {}

  @Query(() => ImportJob, { nullable: true })
  async importJob(@Args('id') id: string): Promise<ImportJob> {
    return this.importExportService.findImportJobById(id);
  }

  @Query(() => [ImportJob])
  async importJobsByTenant(
    @Args('tenantId') tenantId: string,
  ): Promise<ImportJob[]> {
    return this.importExportService.findImportJobsByTenant(tenantId);
  }

  @Query(() => [ImportJob])
  async importJobsByStatus(
    @Args('status') status: string,
    @Args('tenantId', { nullable: true }) tenantId?: string,
  ): Promise<ImportJob[]> {
    return this.importExportService.findImportJobsByStatus(status, tenantId);
  }

  @Query(() => ImportJobConnection)
  async importJobsConnection(
    @Args('first', { type: () => Number, nullable: true }) first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
    @Args('tenantId', { nullable: true }) tenantId?: string,
  ): Promise<ImportJobConnection> {
    return this.importExportService.findImportJobsPaginated({
      first: first || 10,
      after,
      tenantId,
    });
  }

  @Mutation(() => ImportJob)
  async createImportJob(
    @Args('input') input: CreateImportJobInput,
  ): Promise<ImportJob> {
    return this.importExportService.createImportJob(input);
  }

  @Mutation(() => ImportJob)
  async updateImportJob(
    @Args('id') id: string,
    @Args('input') input: UpdateImportJobInput,
  ): Promise<ImportJob> {
    return this.importExportService.updateImportJob(id, input);
  }

  @Mutation(() => ImportJob)
  async startImportJob(@Args('id') id: string): Promise<ImportJob> {
    return this.importExportService.startImportJob(id);
  }

  @Mutation(() => ImportJob)
  async cancelImportJob(@Args('id') id: string): Promise<ImportJob> {
    return this.importExportService.cancelImportJob(id);
  }

  @Mutation(() => ImportJob)
  async retryImportJob(@Args('id') id: string): Promise<ImportJob> {
    return this.importExportService.retryImportJob(id);
  }

  @Mutation(() => Boolean)
  async deleteImportJob(@Args('id') id: string): Promise<boolean> {
    return this.importExportService.deleteImportJob(id);
  }

  @Mutation(() => String)
  async validateImportFile(
    @Args('filePath') filePath: string,
    @Args('entityType') entityType: string,
    @Args('format') format: string,
  ): Promise<string> {
    return this.importExportService.validateImportFile(filePath, entityType, format);
  }

  @ResolveReference()
  async resolveReference(reference: { __typename: string; id: string }): Promise<ImportJob> {
    return this.importExportService.findImportJobById(reference.id);
  }
}

@Resolver(() => ExportJob)
export class ExportJobResolver {
  constructor(private readonly importExportService: ImportExportService) {}

  @Query(() => ExportJob, { nullable: true })
  async exportJob(@Args('id') id: string): Promise<ExportJob> {
    return this.importExportService.findExportJobById(id);
  }

  @Query(() => [ExportJob])
  async exportJobsByTenant(
    @Args('tenantId') tenantId: string,
  ): Promise<ExportJob[]> {
    return this.importExportService.findExportJobsByTenant(tenantId);
  }

  @Query(() => [ExportJob])
  async exportJobsByStatus(
    @Args('status') status: string,
    @Args('tenantId', { nullable: true }) tenantId?: string,
  ): Promise<ExportJob[]> {
    return this.importExportService.findExportJobsByStatus(status, tenantId);
  }

  @Query(() => ExportJobConnection)
  async exportJobsConnection(
    @Args('first', { type: () => Number, nullable: true }) first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
    @Args('tenantId', { nullable: true }) tenantId?: string,
  ): Promise<ExportJobConnection> {
    return this.importExportService.findExportJobsPaginated({
      first: first || 10,
      after,
      tenantId,
    });
  }

  @Mutation(() => ExportJob)
  async createExportJob(
    @Args('input') input: CreateExportJobInput,
  ): Promise<ExportJob> {
    return this.importExportService.createExportJob(input);
  }

  @Mutation(() => ExportJob)
  async updateExportJob(
    @Args('id') id: string,
    @Args('input') input: UpdateExportJobInput,
  ): Promise<ExportJob> {
    return this.importExportService.updateExportJob(id, input);
  }

  @Mutation(() => ExportJob)
  async startExportJob(@Args('id') id: string): Promise<ExportJob> {
    return this.importExportService.startExportJob(id);
  }

  @Mutation(() => ExportJob)
  async cancelExportJob(@Args('id') id: string): Promise<ExportJob> {
    return this.importExportService.cancelExportJob(id);
  }

  @Mutation(() => ExportJob)
  async retryExportJob(@Args('id') id: string): Promise<ExportJob> {
    return this.importExportService.retryExportJob(id);
  }

  @Mutation(() => Boolean)
  async deleteExportJob(@Args('id') id: string): Promise<boolean> {
    return this.importExportService.deleteExportJob(id);
  }

  @Mutation(() => String)
  async downloadExportFile(@Args('id') id: string): Promise<string> {
    return this.importExportService.getExportFileUrl(id);
  }

  @ResolveReference()
  async resolveReference(reference: { __typename: string; id: string }): Promise<ExportJob> {
    return this.importExportService.findExportJobById(reference.id);
  }
}