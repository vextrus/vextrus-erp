import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';

/**
 * Simple JWT Auth Guard for Master Data Service
 * TODO: Replace with proper JWT validation when auth service is integrated
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    let request: any;

    // Check if this is a GraphQL request
    const type = context.getType() as string;
    if (type === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      request = gqlContext.getContext().req;
    } else {
      // HTTP request
      request = context.switchToHttp().getRequest();
    }

    // Handle missing request object
    if (!request || !request.headers) {
      // For development, allow GraphQL introspection queries
      if ((type as string) === 'graphql') {
        const gqlContext = GqlExecutionContext.create(context);
        const info = gqlContext.getInfo();
        if (info.fieldName === '__schema' || info.fieldName === '__type') {
          return true;
        }
      }
      throw new UnauthorizedException('Authorization header required');
    }

    // For now, just check if Authorization header exists
    // TODO: Implement proper JWT validation
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header required');
    }

    // Mock user for development - TODO: Replace with real JWT validation
    request.user = {
      id: 'mock-user-id',
      email: 'user@example.com',
      organizationId: 'mock-org-id',
      firstName: 'Mock',
      lastName: 'User',
    };

    return true;
  }
}