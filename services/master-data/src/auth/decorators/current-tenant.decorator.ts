import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface TenantContext {
  id: string;
  name?: string;
  organizationId: string;
}

/**
 * Current Tenant decorator for Master Data Service
 * Extracts tenant information from the request
 * TODO: Implement proper multi-tenant logic when auth service is integrated
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TenantContext => {
    let request: any;

    // Check if this is a GraphQL request
    const type = ctx.getType() as string;
    if (type === 'graphql') {
      const gqlContext = GqlExecutionContext.create(ctx);
      request = gqlContext.getContext().req;
    } else {
      // HTTP request
      request = ctx.switchToHttp().getRequest();
    }

    // Extract tenant ID from headers
    const tenantId = request?.headers?.['x-tenant-id'] ||
                     request?.headers?.['tenant-id'] ||
                     'default-tenant';

    // Mock tenant context for development - TODO: Replace with real tenant resolution
    const mockTenant: TenantContext = {
      id: tenantId,
      name: 'Default Tenant',
      organizationId: request?.user?.organizationId || 'mock-org-id',
    };

    return mockTenant;
  },
);

// Export the interface for type safety
// Note: TenantContext interface is already exported above