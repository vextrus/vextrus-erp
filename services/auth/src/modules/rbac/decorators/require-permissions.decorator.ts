import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to require specific permissions for accessing a route
 * @param permissions - Array of permission keys required
 * 
 * @example
 * @RequirePermissions('project.create', 'project.update')
 * @RequirePermissions('finance.*')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Decorator to require any of the specified permissions
 * @param permissions - Array of permission keys (user needs at least one)
 * 
 * @example
 * @RequireAnyPermission('project.read', 'project.list')
 */
export const RequireAnyPermission = (...permissions: string[]) =>
  SetMetadata('anyPermissions', permissions);

/**
 * Decorator to require specific roles for accessing a route
 * @param roles - Array of role names required
 * 
 * @example
 * @RequireRoles('admin', 'project-manager')
 */
export const RequireRoles = (...roles: string[]) =>
  SetMetadata('roles', roles);

/**
 * Decorator to mark a route as public (no authentication required)
 * 
 * @example
 * @Public()
 */
export const Public = () => SetMetadata('isPublic', true);

/**
 * Decorator to require multi-factor authentication
 * 
 * @example
 * @RequireMFA()
 */
export const RequireMFA = () => SetMetadata('requireMFA', true);

/**
 * Decorator to specify resource ownership check
 * 
 * @example
 * @CheckResourceOwnership('project')
 */
export const CheckResourceOwnership = (resourceType: string) =>
  SetMetadata('resourceOwnership', resourceType);