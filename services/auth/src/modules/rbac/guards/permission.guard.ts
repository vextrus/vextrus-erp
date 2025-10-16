import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../rbac.service';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract context from request
    const resourceContext = {
      organizationId: user.organizationId || request.params?.organizationId,
      projectId: request.params?.projectId,
      resourceId: request.params?.id || request.params?.resourceId,
    };

    // Check if user has ALL required permissions
    const hasAllPermissions = await this.checkAllPermissions(
      user.id,
      requiredPermissions,
      resourceContext,
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  private async checkAllPermissions(
    userId: string,
    permissions: string[],
    context: any,
  ): Promise<boolean> {
    for (const permission of permissions) {
      // Handle wildcard permissions
      if (permission.includes('*')) {
        const hasWildcardPermission = await this.checkWildcardPermission(
          userId,
          permission,
          context,
        );
        if (!hasWildcardPermission) {
          return false;
        }
      } else {
        const hasPermission = await this.rbacService.checkPermission(
          userId,
          permission,
          context,
        );
        if (!hasPermission) {
          return false;
        }
      }
    }
    return true;
  }

  private async checkWildcardPermission(
    userId: string,
    permission: string,
    context: any,
  ): Promise<boolean> {
    // Get user's permissions
    const userPermissions = await this.rbacService.getUserPermissions(
      userId,
      context.organizationId,
    );

    // Check for exact match first
    if (userPermissions.includes(permission)) {
      return true;
    }

    // Check for wildcard matches
    const permissionParts = permission.split('.');
    const resource = permissionParts[0];
    const action = permissionParts[1];

    // Check for resource.* permission
    if (action === '*') {
      const resourceWildcard = `${resource}.*`;
      if (userPermissions.includes(resourceWildcard)) {
        return true;
      }
      // Check for super wildcard
      if (userPermissions.includes('*')) {
        return true;
      }
    }

    // Check for specific permission
    const hasSpecificPermission = userPermissions.some(p => {
      if (p === '*') return true;
      if (p === `${resource}.*`) return true;
      if (p === permission) return true;
      
      // Advanced pattern matching for nested resources
      const regex = permission.replace(/\*/g, '.*');
      return new RegExp(`^${regex}$`).test(p);
    });

    return hasSpecificPermission;
  }
}

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user's roles
    const userRoles = await this.rbacService.getUserRoles(
      user.id,
      user.organizationId,
    );

    // Check if user has ANY of the required roles
    const hasRequiredRole = userRoles.some(userRole =>
      requiredRoles.includes(userRole.role.name),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}