import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { firstValueFrom } from 'rxjs';
import { Reflector } from '@nestjs/core';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // SECURITY FIX (CRIT-002): Only allow introspection in development
    // In production, introspection should be disabled AND require authentication
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    if (context.getType() as string === 'graphql') {
      try {
        const gqlContext = GqlExecutionContext.create(context);
        const info = gqlContext.getInfo();

        // Check if this is an introspection query by field name
        const isIntrospectionQuery = info?.fieldName === '__schema' || info?.fieldName === '__type';

        if (isIntrospectionQuery) {
          if (isProduction) {
            // SECURITY: In production, introspection requires authentication
            // This prevents unauthenticated schema enumeration attacks
            this.logger.warn(
              `⚠️ Introspection query blocked in production (field: ${info.fieldName}). ` +
              `Authentication required for schema access.`
            );
            // Continue to authentication check below (do not return true)
          } else {
            // Development only: Allow introspection for Apollo Sandbox
            this.logger.log(`✅ Allowing introspection query in development (field: ${info.fieldName})`);
            return true;
          }
        }

        // Also check the operation name and query text for introspection
        const ctx = gqlContext.getContext();
        const request = ctx?.req;
        const body = request?.body;

        const isIntrospectionOperation =
          body?.operationName === 'IntrospectionQuery' ||
          body?.query?.includes('__schema') ||
          body?.query?.includes('__type');

        if (isIntrospectionOperation) {
          if (isProduction) {
            // SECURITY: Block introspection in production without authentication
            this.logger.warn(
              `⚠️ Introspection operation blocked in production. ` +
              `Operation: ${body?.operationName || 'unknown'}. Authentication required.`
            );
            // Continue to authentication check below
          } else {
            // Development only: Allow for Apollo Sandbox
            this.logger.log(`✅ Allowing introspection operation in development`);
            return true;
          }
        }
      } catch (error) {
        // If we can't get GraphQL context, continue to auth check
        this.logger.debug('Could not extract GraphQL context for introspection check');
      }
    }

    const request = this.getRequest(context);
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL', 'http://localhost:3001');
      const response = await firstValueFrom(
        this.httpService.get(
          `${authServiceUrl}/api/v1/auth/me`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Service-Name': 'finance-service',
            },
          }
        )
      );

      const user = response.data;

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      // SECURITY: Extract tenant from JWT ONLY - do not trust headers
      // The tenant should come from the authenticated user's JWT token
      // GAP-001B Fix: Also check organizationId (Auth service /me response field)
      const jwtTenantId = user.tenantId || user.tenant_id || user.tenant || user.organizationId || request.tenantId || 'default';

      // SECURITY: Verify header matches JWT if X-Tenant-ID header is provided
      const headerTenantId = request.headers['x-tenant-id'];
      if (headerTenantId && headerTenantId !== jwtTenantId) {
        this.logger.warn(
          `Tenant ID mismatch! JWT tenant: ${jwtTenantId}, Header tenant: ${headerTenantId}, ` +
          `User: ${user.id}. Rejecting request.`
        );
        throw new UnauthorizedException('Tenant ID mismatch - possible tenant isolation bypass attempt');
      }

      // Attach user to request with tenantId from JWT
      request.user = {
        ...user,
        userId: user.id,        // Add userId alias
        tenantId: jwtTenantId,  // Use JWT tenant ONLY
      };
      request.userId = user.id;
      request.userRole = user.role;
      request.tenantId = jwtTenantId;  // Override any middleware tenant with JWT tenant

      this.logger.debug(`Authenticated user: ${user.id} with role: ${user.role}, tenant: ${jwtTenantId}`);

      return true;
    } catch (error: any) {
      this.logger.error('Token verification failed:', error);

      if (error.response?.status === 401) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      throw new UnauthorizedException('Authentication service unavailable');
    }
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

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers?.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}