import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from './jwt-auth.guard';

/**
 * RBAC (Role-Based Access Control) Guard
 *
 * This guard checks if the authenticated user has the required permissions
 * to access a route or resolver.
 *
 * Usage:
 * 1. Apply JwtAuthGuard first to authenticate user
 * 2. Apply RbacGuard second to check permissions
 * 3. Use @Permissions decorator to specify required permissions
 *
 * @example
 * @UseGuards(JwtAuthGuard, RbacGuard)
 * @Permissions('invoice:create')
 * async createInvoice() { ... }
 */
@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Get required permissions from metadata
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no permissions specified, deny access (deny-by-default security)
    if (!requiredPermissions || requiredPermissions.length === 0) {
      this.logger.warn(
        `Access denied: No permissions specified for ${context.getHandler().name}. ` +
        `All endpoints must declare required permissions.`
      );
      throw new ForbiddenException('Endpoint permissions not configured');
    }

    // Get user from request (set by JwtAuthGuard)
    const request = this.getRequest(context);
    const user = request.user;

    if (!user) {
      this.logger.error('RBAC Guard: No user found in request. JwtAuthGuard must run first.');
      throw new ForbiddenException('Authentication required');
    }

    // Extract user permissions from user object or role
    const userPermissions = this.getUserPermissions(user);

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(
        (permission) => !userPermissions.includes(permission)
      );

      this.logger.warn(
        `Access denied for user ${user.userId} (${user.email}). ` +
        `Missing permissions: ${missingPermissions.join(', ')}`
      );

      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`
      );
    }

    this.logger.debug(
      `Access granted for user ${user.userId} with permissions: ${requiredPermissions.join(', ')}`
    );

    return true;
  }

  private getRequest(context: ExecutionContext) {
    const type = context.getType();

    if (type === 'http') {
      return context.switchToHttp().getRequest();
    } else {
      // GraphQL
      const ctx = GqlExecutionContext.create(context);
      return ctx.getContext().req;
    }
  }

  /**
   * Extract permissions from user object
   *
   * Permissions can be:
   * 1. Directly in user.permissions array
   * 2. Derived from user.role
   * 3. From user.roles array with permissions
   */
  private getUserPermissions(user: any): string[] {
    const permissions: string[] = [];

    // 1. Direct permissions array
    if (user.permissions && Array.isArray(user.permissions)) {
      permissions.push(...user.permissions);
    }

    // 2. Role-based permissions mapping
    if (user.role) {
      const rolePermissions = this.getRolePermissions(user.role);
      permissions.push(...rolePermissions);
    }

    // 3. Multiple roles with permissions
    if (user.roles && Array.isArray(user.roles)) {
      user.roles.forEach((role: any) => {
        if (typeof role === 'string') {
          permissions.push(...this.getRolePermissions(role));
        } else if (role.permissions) {
          permissions.push(...role.permissions);
        }
      });
    }

    // Remove duplicates
    return [...new Set(permissions)];
  }

  /**
   * Map roles to permissions
   *
   * This provides default permissions for common roles.
   * In production, this should be loaded from database or config service.
   */
  private getRolePermissions(role: string): string[] {
    const rolePermissionsMap: Record<string, string[]> = {
      // Admin has all permissions
      admin: [
        'invoice:*',
        'payment:*',
        'journal:*',
        'account:*',
        'report:*',
      ],

      // Finance Manager has most permissions
      finance_manager: [
        'invoice:create',
        'invoice:read',
        'invoice:update',
        'invoice:approve',
        'invoice:cancel',
        'payment:create',
        'payment:read',
        'payment:process',
        'payment:reconcile',
        'journal:create',
        'journal:read',
        'journal:post',
        'journal:reverse',
        'account:read',
        'account:update',
        'report:read',
        'report:export',
      ],

      // Accountant has operational permissions
      accountant: [
        'invoice:create',
        'invoice:read',
        'invoice:update',
        'payment:create',
        'payment:read',
        'journal:create',
        'journal:read',
        'account:read',
        'report:read',
      ],

      // Accounts Payable clerk
      accounts_payable: [
        'invoice:create',
        'invoice:read',
        'payment:create',
        'payment:read',
        'report:read',
      ],

      // Accounts Receivable clerk
      accounts_receivable: [
        'invoice:create',
        'invoice:read',
        'invoice:update',
        'payment:read',
        'report:read',
      ],

      // Auditor (read-only)
      auditor: [
        'invoice:read',
        'payment:read',
        'journal:read',
        'account:read',
        'report:read',
        'report:export',
      ],

      // Basic user (minimal access)
      user: [
        'invoice:read',
        'report:read',
      ],
    };

    // Support wildcard permissions
    const permissions = rolePermissionsMap[role.toLowerCase()] || [];
    const expandedPermissions: string[] = [];

    permissions.forEach((permission) => {
      if (permission.endsWith(':*')) {
        // Expand wildcard to all operations
        const resource = permission.split(':')[0];
        expandedPermissions.push(
          `${resource}:create`,
          `${resource}:read`,
          `${resource}:update`,
          `${resource}:delete`,
          `${resource}:approve`,
          `${resource}:cancel`,
          `${resource}:process`,
          `${resource}:reconcile`,
          `${resource}:post`,
          `${resource}:reverse`,
          `${resource}:export`,
        );
      } else {
        expandedPermissions.push(permission);
      }
    });

    return expandedPermissions;
  }
}
