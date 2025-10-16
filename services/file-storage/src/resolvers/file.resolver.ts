import { Resolver, Query, Mutation, Args, ResolveReference, ID, Int } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { File } from '../entities/file.entity';
import { StorageService } from '../services/storage.service';
import { CreateFileInput, UpdateFileInput, FileConnection, SearchFileInput, ShareFileInput } from '../dto/file.dto';

@Injectable()
@Resolver(() => File)
export class FileResolver {
  constructor(private readonly storageService: StorageService) {}

  @Query(() => File, { nullable: true })
  async file(@Args('id', { type: () => ID }) id: string): Promise<File> {
    return this.storageService.findById(id);
  }

  @Query(() => [File])
  async filesByTenant(@Args('tenantId', { type: () => ID }) tenantId: string): Promise<File[]> {
    return this.storageService.findByTenant(tenantId);
  }

  @Query(() => [File])
  async filesByFolder(
    @Args('tenantId', { type: () => ID }) tenantId: string,
    @Args('folderId', { type: () => ID, nullable: true }) folderId?: string
  ): Promise<File[]> {
    return this.storageService.findByFolder(tenantId, folderId);
  }

  @Query(() => FileConnection)
  async searchFiles(
    @Args('input') input: SearchFileInput
  ): Promise<FileConnection> {
    return this.storageService.searchFiles(input);
  }

  @Query(() => FileConnection)
  async filesPaginated(
    @Args('tenantId', { type: () => ID }) tenantId: string,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number
  ): Promise<FileConnection> {
    return this.storageService.findPaginated(tenantId, limit, offset);
  }

  @Query(() => String)
  async fileDownloadUrl(
    @Args('id', { type: () => ID }) id: string,
    @Args('expiresIn', { type: () => Int, defaultValue: 3600 }) expiresIn: number
  ): Promise<string> {
    return this.storageService.getDownloadUrl(id, expiresIn);
  }

  @Mutation(() => File)
  async uploadFile(
    @Args('input') input: CreateFileInput
  ): Promise<File> {
    return this.storageService.uploadFile(input);
  }

  @Mutation(() => File)
  async updateFile(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateFileInput
  ): Promise<File> {
    return this.storageService.updateFile(id, input);
  }

  @Mutation(() => File)
  async moveFile(
    @Args('id', { type: () => ID }) id: string,
    @Args('targetFolderId', { type: () => ID, nullable: true }) targetFolderId?: string
  ): Promise<File> {
    return this.storageService.moveFile(id, targetFolderId);
  }

  @Mutation(() => File)
  async shareFile(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: ShareFileInput
  ): Promise<File> {
    return this.storageService.shareFile(id, input);
  }

  @Mutation(() => File)
  async archiveFile(
    @Args('id', { type: () => ID }) id: string
  ): Promise<File> {
    return this.storageService.archiveFile(id);
  }

  @Mutation(() => Boolean)
  async deleteFile(
    @Args('id', { type: () => ID }) id: string,
    @Args('permanent', { type: () => Boolean, defaultValue: false }) permanent: boolean
  ): Promise<boolean> {
    return this.storageService.deleteFile(id, permanent);
  }

  @Mutation(() => File)
  async restoreFile(
    @Args('id', { type: () => ID }) id: string
  ): Promise<File> {
    return this.storageService.restoreFile(id);
  }

  @Mutation(() => String)
  async generateThumbnail(
    @Args('id', { type: () => ID }) id: string
  ): Promise<string> {
    return this.storageService.generateThumbnail(id);
  }

  @Mutation(() => File)
  async scanFile(
    @Args('id', { type: () => ID }) id: string
  ): Promise<File> {
    return this.storageService.scanForVirus(id);
  }

  @Mutation(() => Boolean)
  async cleanupExpiredFiles(): Promise<boolean> {
    return this.storageService.cleanupExpiredFiles();
  }

  @ResolveReference()
  async resolveReference(reference: { __typename: string; id: string }): Promise<File> {
    return this.storageService.findById(reference.id);
  }
}