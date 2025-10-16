import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File, FileStatus, FileAccessLevel } from '../entities/file.entity';
import { CreateFolderDto, UpdateFolderDto, ListFolderContentsDto } from '../dto/create-folder.dto';
import { StorageService } from '../services/storage.service';

@ApiTags('Folders')
@Controller('folders')
export class FolderController {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private storageService: StorageService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new folder' })
  async createFolder(
    @Body() dto: CreateFolderDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<File> {
    const folder = this.fileRepository.create({
      tenant_id: tenantId,
      original_name: dto.name,
      file_path: `folder/${dto.name}`,
      bucket: `tenant-${tenantId}`,
      object_key: `folder/${dto.name}`,
      mime_type: 'application/x-directory',
      size: 0,
      status: FileStatus.ACTIVE,
      access_level: dto.access_level || FileAccessLevel.PRIVATE,
      parent_folder_id: dto.parent_folder_id,
      description: dto.description,
      tags: dto.tags,
      metadata: dto.metadata,
      created_by: userId,
    });

    return await this.fileRepository.save(folder);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get folder details' })
  async getFolder(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<File> {
    const folder = await this.fileRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
        mime_type: 'application/x-directory',
      },
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    return folder;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update folder' })
  async updateFolder(
    @Param('id') id: string,
    @Body() dto: UpdateFolderDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<File> {
    const folder = await this.getFolder(id, tenantId);

    Object.assign(folder, {
      ...dto,
      updated_by: userId,
    });

    return await this.fileRepository.save(folder);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a folder' })
  async deleteFolder(
    @Param('id') id: string,
    @Query('force') force: boolean,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<void> {
    const folder = await this.getFolder(id, tenantId);

    // Check if folder has contents
    const contents = await this.fileRepository.count({
      where: {
        parent_folder_id: id,
        tenant_id: tenantId,
        status: FileStatus.ACTIVE,
      },
    });

    if (contents > 0 && !force) {
      throw new Error('Folder is not empty. Use force=true to delete with contents.');
    }

    if (force) {
      // Delete all contents recursively
      await this.deleteFolderContents(id, tenantId, userId);
    }

    folder.status = FileStatus.DELETED;
    folder.deleted_by = userId;
    folder.deleted_at = new Date();
    await this.fileRepository.save(folder);
  }

  @Get(':id/contents')
  @ApiOperation({ summary: 'List folder contents' })
  async listContents(
    @Param('id') id: string,
    @Query() dto: ListFolderContentsDto,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<{ items: File[]; total: number }> {
    const query = this.fileRepository.createQueryBuilder('file')
      .where('file.tenant_id = :tenantId', { tenantId })
      .andWhere('file.status = :status', { status: FileStatus.ACTIVE });

    if (id === 'root') {
      query.andWhere('file.parent_folder_id IS NULL');
    } else {
      const folder = await this.getFolder(id, tenantId);
      query.andWhere('file.parent_folder_id = :folderId', { folderId: id });
    }

    if (dto.include_folders === false) {
      query.andWhere('file.mime_type != :folderType', { folderType: 'application/x-directory' });
    }

    if (dto.include_files === false) {
      query.andWhere('file.mime_type = :folderType', { folderType: 'application/x-directory' });
    }

    // Sort
    const sortField = dto.sort_by || 'name';
    const sortOrder = dto.sort_order || 'ASC';
    query.orderBy(`file.${sortField === 'name' ? 'original_name' : sortField}`, sortOrder);

    // Pagination
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    query.skip((page - 1) * limit).take(limit);

    const [items, total] = await query.getManyAndCount();

    return { items, total };
  }

  @Get(':id/tree')
  @ApiOperation({ summary: 'Get folder tree structure' })
  async getFolderTree(
    @Param('id') id: string,
    @Query('depth') depth: number = 3,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<any> {
    const rootFolder = id === 'root' ? null : await this.getFolder(id, tenantId);

    const tree = await this.buildFolderTree(
      id === 'root' ? null : id,
      tenantId,
      0,
      depth
    );

    return {
      id: rootFolder?.id || 'root',
      name: rootFolder?.original_name || 'Root',
      type: 'folder',
      children: tree,
    };
  }

  @Get(':id/breadcrumb')
  @ApiOperation({ summary: 'Get folder breadcrumb path' })
  async getBreadcrumb(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<Array<{ id: string; name: string }>> {
    const breadcrumb: Array<{ id: string; name: string }> = [];

    if (id === 'root') {
      return [{ id: 'root', name: 'Root' }];
    }

    let currentFolder = await this.getFolder(id, tenantId);
    breadcrumb.unshift({ id: currentFolder.id, name: currentFolder.original_name });

    while (currentFolder.parent_folder_id) {
      currentFolder = await this.getFolder(currentFolder.parent_folder_id, tenantId);
      breadcrumb.unshift({ id: currentFolder.id, name: currentFolder.original_name });
    }

    breadcrumb.unshift({ id: 'root', name: 'Root' });
    return breadcrumb;
  }

  @Get(':id/size')
  @ApiOperation({ summary: 'Calculate folder size' })
  async getFolderSize(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<{ size: number; file_count: number; folder_count: number }> {
    const result = await this.calculateFolderSize(id, tenantId);
    return result;
  }

  @Post(':id/move')
  @ApiOperation({ summary: 'Move folder to another location' })
  async moveFolder(
    @Param('id') id: string,
    @Body('target_folder_id') targetFolderId: string,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<File> {
    const folder = await this.getFolder(id, tenantId);

    // Prevent moving folder into itself or its children
    if (targetFolderId && targetFolderId !== 'root') {
      const isChild = await this.isFolderChild(targetFolderId, id, tenantId);
      if (isChild) {
        throw new Error('Cannot move folder into its own child');
      }
    }

    folder.parent_folder_id = targetFolderId === 'root' ? null : targetFolderId;
    folder.updated_by = userId;

    return await this.fileRepository.save(folder);
  }

  @Post(':id/copy')
  @ApiOperation({ summary: 'Copy folder with its contents' })
  async copyFolder(
    @Param('id') id: string,
    @Body() body: { target_folder_id?: string; new_name?: string },
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<File> {
    const sourceFolder = await this.getFolder(id, tenantId);

    const newFolder = this.fileRepository.create({
      ...sourceFolder,
      id: undefined,
      original_name: body.new_name || `Copy of ${sourceFolder.original_name}`,
      parent_folder_id: body.target_folder_id,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const savedFolder = await this.fileRepository.save(newFolder);

    // Copy contents recursively
    await this.copyFolderContents(id, savedFolder.id, tenantId, userId);

    return savedFolder;
  }

  private async buildFolderTree(
    parentId: string | null,
    tenantId: string,
    currentDepth: number,
    maxDepth: number
  ): Promise<any[]> {
    if (currentDepth >= maxDepth) {
      return [];
    }

    const items = await this.fileRepository.find({
      where: {
        parent_folder_id: parentId === null ? undefined : parentId,
        tenant_id: tenantId,
        status: FileStatus.ACTIVE,
      } as any,
    });

    const tree: any[] = [];

    for (const item of items) {
      const node: any = {
        id: item.id,
        name: item.original_name,
        type: item.mime_type === 'application/x-directory' ? 'folder' : 'file',
        size: item.size,
      };

      if (item.mime_type === 'application/x-directory') {
        node.children = await this.buildFolderTree(
          item.id,
          tenantId,
          currentDepth + 1,
          maxDepth
        );
      }

      tree.push(node);
    }

    return tree;
  }

  private async deleteFolderContents(
    folderId: string,
    tenantId: string,
    userId: string
  ): Promise<void> {
    const contents = await this.fileRepository.find({
      where: {
        parent_folder_id: folderId,
        tenant_id: tenantId,
        status: FileStatus.ACTIVE,
      },
    });

    for (const item of contents) {
      if (item.mime_type === 'application/x-directory') {
        await this.deleteFolderContents(item.id, tenantId, userId);
      }

      item.status = FileStatus.DELETED;
      item.deleted_by = userId;
      item.deleted_at = new Date();
      await this.fileRepository.save(item);
    }
  }

  private async copyFolderContents(
    sourceFolderId: string,
    targetFolderId: string,
    tenantId: string,
    userId: string
  ): Promise<void> {
    const contents = await this.fileRepository.find({
      where: {
        parent_folder_id: sourceFolderId,
        tenant_id: tenantId,
        status: FileStatus.ACTIVE,
      },
    });

    for (const item of contents) {
      const newItem = this.fileRepository.create({
        ...item,
        id: undefined,
        parent_folder_id: targetFolderId,
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const savedItem = await this.fileRepository.save(newItem);

      if (item.mime_type === 'application/x-directory') {
        await this.copyFolderContents(item.id, savedItem.id, tenantId, userId);
      }
    }
  }

  private async calculateFolderSize(
    folderId: string,
    tenantId: string
  ): Promise<{ size: number; file_count: number; folder_count: number }> {
    const query = this.fileRepository.createQueryBuilder('file')
      .select('SUM(file.size)', 'total_size')
      .addSelect('COUNT(CASE WHEN file.mime_type != :folderType THEN 1 END)', 'file_count')
      .addSelect('COUNT(CASE WHEN file.mime_type = :folderType THEN 1 END)', 'folder_count')
      .where('file.tenant_id = :tenantId', { tenantId })
      .andWhere('file.status = :status', { status: FileStatus.ACTIVE })
      .setParameter('folderType', 'application/x-directory');

    if (folderId === 'root' || !folderId) {
      query.andWhere('file.parent_folder_id IS NULL');
    } else {
      // Get all descendant folders
      const descendantIds = await this.getAllDescendantFolderIds(folderId, tenantId);
      descendantIds.push(folderId);
      query.andWhere('file.parent_folder_id IN (:...folderIds)', { folderIds: descendantIds });
    }

    const result = await query.getRawOne();

    return {
      size: parseInt(result.total_size) || 0,
      file_count: parseInt(result.file_count) || 0,
      folder_count: parseInt(result.folder_count) || 0,
    };
  }

  private async getAllDescendantFolderIds(
    folderId: string,
    tenantId: string
  ): Promise<string[]> {
    const folders = await this.fileRepository.find({
      where: {
        parent_folder_id: folderId,
        tenant_id: tenantId,
        mime_type: 'application/x-directory',
        status: FileStatus.ACTIVE,
      },
      select: ['id'],
    });

    const ids = folders.map(f => f.id);
    
    for (const folder of folders) {
      const childIds = await this.getAllDescendantFolderIds(folder.id, tenantId);
      ids.push(...childIds);
    }

    return ids;
  }

  private async isFolderChild(
    potentialChildId: string,
    parentId: string,
    tenantId: string
  ): Promise<boolean> {
    const descendants = await this.getAllDescendantFolderIds(parentId, tenantId);
    return descendants.includes(potentialChildId);
  }
}