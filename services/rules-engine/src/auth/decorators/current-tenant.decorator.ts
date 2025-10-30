import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface TenantContext {
  id: string;
  name?: string;
  organizationId: string;
}

/**
 * Current Tenant decorator for Rules Engine Service
 * Extracts tenant information from the request
 * TODO: Implement proper multi-tenant logic when auth service is integrated
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest();
    
    // Mock tenant context for development - TODO: Replace with real tenant resolution
    const mockTenant: TenantContext = {
      id: 'default-tenant',
      name: 'Default Tenant',
      organizationId: request.user?.organizationId || 'mock-org-id',
    };

    return mockTenant;
  },
);

// Export the interface for type safety
// Note: TenantContext interface is already exported above