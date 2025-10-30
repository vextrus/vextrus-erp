import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RbacService } from '../rbac.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { AssignRoleDto } from '../dto/assign-role.dto';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RoleController {
  constructor(private readonly rbacService: RbacService) {}

  @Post()
  @RequirePermissions('role.create')
  @ApiOperation({
    summary: 'Create a new role',
    description: `
      Creates a new role with specified permissions.
      
      **Required Permission:** role.create
      
      **Business Rules:**
      - Role name must be unique within organization
      - System roles cannot be created via API
      - Parent role must exist if specified
      - Bengali translations are required
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    type: Role,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: 409,
    description: 'Role already exists',
  })
  async createRole(
    @Body() createRoleDto: CreateRoleDto,
    @Request() req: any,
  ): Promise<Role> {
    return this.rbacService.createRole({
      ...createRoleDto,
      createdBy: req.user.id,
    });
  }

  @Get()
  @RequirePermissions('role.read')
  @ApiOperation({
    summary: 'Get all roles for organization',
    description: `
      Returns all active roles for the specified organization.
      Roles are returned in hierarchical order.
      
      **Required Permission:** role.read
    `,
  })
  @ApiQuery({
    name: 'organizationId',
    description: 'Organization ID to filter roles',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of roles',
    type: [Role],
  })
  async getRoles(@Query('organizationId') organizationId: string): Promise<Role[]> {
    return this.rbacService.getRoles(organizationId);
  }

  @Get(':id')
  @RequirePermissions('role.read')
  @ApiOperation({
    summary: 'Get role by ID',
    description: 'Returns detailed information about a specific role',
  })
  @ApiParam({
    name: 'id',
    description: 'Role ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Role details',
    type: Role,
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  async getRole(@Param('id') id: string): Promise<Role> {
    // Implementation would be added to RbacService
    throw new Error('Not implemented');
  }

  @Put(':id')
  @RequirePermissions('role.update')
  @ApiOperation({
    summary: 'Update a role',
    description: `
      Updates an existing role.
      
      **Required Permission:** role.update
      
      **Business Rules:**
      - System roles cannot be modified
      - Cannot change organization ID
      - Version number incremented on update
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Role ID to update',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
    type: Role,
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot modify system role',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @Request() req: any,
  ): Promise<Role> {
    return this.rbacService.updateRole(id, {
      ...updateRoleDto,
      updatedBy: req.user.id,
    });
  }

  @Delete(':id')
  @RequirePermissions('role.delete')
  @ApiOperation({
    summary: 'Delete a role',
    description: `
      Soft deletes a role.
      
      **Required Permission:** role.delete
      
      **Business Rules:**
      - System roles cannot be deleted
      - Cannot delete if users are assigned
      - Performs soft delete only
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Role ID to delete',
    type: String,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'Role deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot delete system role',
  })
  @ApiResponse({
    status: 409,
    description: 'Role has active users',
  })
  async deleteRole(@Param('id') id: string): Promise<void> {
    // Implementation would be added to RbacService
    throw new Error('Not implemented');
  }

  @Post('assign')
  @RequirePermissions('role.assign')
  @ApiOperation({
    summary: 'Assign role to user',
    description: `
      Assigns a role to a user with optional scope and expiration.
      
      **Required Permission:** role.assign
      
      **Business Rules:**
      - User and role must exist
      - Cannot assign expired roles
      - Scope restrictions are enforced
      - Temporary delegations tracked
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Role assigned successfully',
    type: UserRole,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid assignment data',
  })
  @ApiResponse({
    status: 404,
    description: 'User or role not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Role already assigned',
  })
  async assignRole(
    @Body() assignRoleDto: AssignRoleDto,
    @Request() req: any,
  ): Promise<UserRole> {
    return this.rbacService.assignRole({
      ...assignRoleDto,
      assignedBy: req.user.id,
    });
  }

  @Post('revoke')
  @RequirePermissions('role.revoke')
  @ApiOperation({
    summary: 'Revoke role from user',
    description: `
      Revokes a role assignment from a user.
      
      **Required Permission:** role.revoke
      
      **Business Rules:**
      - Tracks who revoked and why
      - Maintains audit trail
      - Cannot revoke system admin from last admin
    `,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'Role revoked successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Role assignment not found',
  })
  async revokeRole(
    @Body() revokeDto: { userId: string; roleId: string; reason?: string },
    @Request() req: any,
  ): Promise<void> {
    return this.rbacService.revokeRole(
      revokeDto.userId,
      revokeDto.roleId,
      req.user.id,
      revokeDto.reason,
    );
  }

  @Get('user/:userId')
  @RequirePermissions('role.read', 'user.read')
  @ApiOperation({
    summary: 'Get user roles',
    description: `
      Returns all active roles assigned to a user.
      
      **Required Permissions:** role.read AND user.read
    `,
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    type: String,
  })
  @ApiQuery({
    name: 'organizationId',
    description: 'Filter by organization',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of user role assignments',
    type: [UserRole],
  })
  async getUserRoles(
    @Param('userId') userId: string,
    @Query('organizationId') organizationId?: string,
  ): Promise<UserRole[]> {
    return this.rbacService.getUserRoles(userId, organizationId);
  }

  @Post('initialize/:organizationId')
  @RequirePermissions('organization.manage', 'role.create')
  @ApiOperation({
    summary: 'Initialize default roles',
    description: `
      Creates default roles for Bangladesh Construction context.
      
      **Required Permissions:** organization.manage AND role.create
      
      **Created Roles:**
      - System Administrator (সিস্টেম প্রশাসক)
      - Organization Owner (সংস্থার মালিক)
      - Project Director (প্রকল্প পরিচালক)
      - Project Manager (প্রকল্প ব্যবস্থাপক)
      - Site Engineer (সাইট ইঞ্জিনিয়ার)
      - Contractor (ঠিকাদার)
      - Accountant (হিসাবরক্ষক)
    `,
  })
  @ApiParam({
    name: 'organizationId',
    description: 'Organization ID',
    type: String,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'Default roles initialized',
  })
  async initializeDefaultRoles(
    @Param('organizationId') organizationId: string,
  ): Promise<void> {
    return this.rbacService.initializeDefaultRoles(organizationId);
  }
}