import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { RbacService } from '../rbac.service';
import { Permission } from '../entities/permission.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PermissionController {
  constructor(private readonly rbacService: RbacService) {}

  @Get()
  @RequirePermissions('permission.read')
  @ApiOperation({
    summary: 'Get all permissions',
    description: `
      Returns all available permissions in the system.
      
      **Required Permission:** permission.read
      
      **Categories:**
      - project_management: Project-related permissions
      - financial_management: Finance and accounting permissions
      - document_management: Document handling permissions
      - compliance_management: RAJUK, NBR compliance permissions
      - resource_management: Resource allocation permissions
      - user_management: User and role permissions
      - system_administration: System-level permissions
    `,
  })
  @ApiQuery({
    name: 'category',
    description: 'Filter by permission category',
    required: false,
    enum: [
      'project_management',
      'financial_management',
      'document_management',
      'compliance_management',
      'resource_management',
      'user_management',
      'system_administration',
      'reporting',
      'audit',
    ],
  })
  @ApiResponse({
    status: 200,
    description: 'List of permissions',
    type: [Permission],
  })
  async getPermissions(
    @Query('category') category?: string,
  ): Promise<Permission[]> {
    return this.rbacService.getPermissions(category);
  }

  @Get('user/:userId')
  @RequirePermissions('permission.read', 'user.read')
  @ApiOperation({
    summary: 'Get user permissions',
    description: `
      Returns all effective permissions for a user including inherited ones.
      
      **Required Permissions:** permission.read AND user.read
      
      **Includes:**
      - Direct role permissions
      - Inherited permissions from parent roles
      - Temporary delegation permissions
      - Scope-restricted permissions
    `,
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    type: String,
  })
  @ApiQuery({
    name: 'organizationId',
    description: 'Organization context',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of user permissions',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: [
        'project.create',
        'project.read',
        'project.update',
        'finance.read',
        'document.upload',
      ],
    },
  })
  async getUserPermissions(
    @Param('userId') userId: string,
    @Query('organizationId') organizationId?: string,
  ): Promise<string[]> {
    return this.rbacService.getUserPermissions(userId, organizationId);
  }

  @Get('check')
  @ApiOperation({
    summary: 'Check permission for current user',
    description: `
      Checks if the current authenticated user has a specific permission.
      
      **No Required Permission** - Users can check their own permissions
    `,
  })
  @ApiQuery({
    name: 'permission',
    description: 'Permission key to check',
    required: true,
    example: 'project.create',
  })
  @ApiQuery({
    name: 'projectId',
    description: 'Project context for scope check',
    required: false,
  })
  @ApiQuery({
    name: 'resourceId',
    description: 'Resource context for scope check',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Permission check result',
    schema: {
      type: 'object',
      properties: {
        hasPermission: { type: 'boolean' },
        permission: { type: 'string' },
        userId: { type: 'string' },
        context: { type: 'object' },
      },
    },
  })
  async checkPermission(
    @Request() req: any,
    @Query('permission') permission: string,
    @Query('projectId') projectId?: string,
    @Query('resourceId') resourceId?: string,
  ): Promise<{
    hasPermission: boolean;
    permission: string;
    userId: string;
    context: any;
  }> {
    const context = {
      organizationId: req.user.organizationId,
      projectId,
      resourceId,
    };

    const hasPermission = await this.rbacService.checkPermission(
      req.user.id,
      permission,
      context,
    );

    return {
      hasPermission,
      permission,
      userId: req.user.id,
      context,
    };
  }

  @Get('matrix')
  @RequirePermissions('permission.read', 'role.read')
  @ApiOperation({
    summary: 'Get permission matrix',
    description: `
      Returns a matrix showing which roles have which permissions.
      Useful for auditing and role planning.
      
      **Required Permissions:** permission.read AND role.read
    `,
  })
  @ApiQuery({
    name: 'organizationId',
    description: 'Organization ID',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Permission matrix',
    schema: {
      type: 'object',
      example: {
        'project-manager': [
          'project.create',
          'project.read',
          'project.update',
          'resource.allocate',
        ],
        'site-engineer': [
          'project.read',
          'project.update',
          'document.upload',
          'resource.read',
        ],
        'accountant': [
          'finance.create',
          'finance.read',
          'finance.approve',
          'compliance.nbr.file',
        ],
      },
    },
  })
  async getPermissionMatrix(
    @Query('organizationId') organizationId: string,
  ): Promise<Record<string, string[]>> {
    const roles = await this.rbacService.getRoles(organizationId);
    const matrix: Record<string, string[]> = {};

    for (const role of roles) {
      // Get all permissions including inherited ones
      const permissions = new Set<string>();
      
      // Direct permissions
      role.permissions.forEach(p => permissions.add(p));
      
      // Permission entities
      if (role.permissionEntities) {
        role.permissionEntities
          .filter(p => p.isActive)
          .forEach(p => permissions.add(p.key));
      }

      matrix[role.name] = Array.from(permissions);
    }

    return matrix;
  }
}