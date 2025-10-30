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

    const request = this.getRequest(context);
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL', 'http://localhost:3001');
      const response = await firstValueFrom(
        this.httpService.post(
          `${authServiceUrl}/auth/verify`,
          { token },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Service-Name': 'organization-service',
            },
          }
        )
      );

      const user = response.data.user;

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Attach user to request
      request.user = user;
      request.userId = user.id;
      request.userRole = user.role;

      this.logger.debug(`Authenticated user: ${user.id} with role: ${user.role}`);

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
