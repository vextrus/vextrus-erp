import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Simple JWT Auth Guard for Rules Engine Service
 * TODO: Replace with proper JWT validation when auth service is integrated
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    
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