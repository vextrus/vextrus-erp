import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { Reflector } from '@nestjs/core';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from './cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // Get cache metadata from handler
    const cacheKey = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );

    const cacheTTL = this.reflector.get<number>(
      CACHE_TTL_METADATA,
      context.getHandler(),
    );

    if (!cacheKey) {
      return next.handle();
    }

    // Build cache key with request parameters
    const request = context.switchToHttp().getRequest();
    const finalKey = this.buildCacheKey(cacheKey, request);

    // Try to get from cache
    const cachedValue = await this.cacheService.get(finalKey);
    if (cachedValue !== null) {
      return of(cachedValue);
    }

    // If not cached, execute handler and cache the result
    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheService.set(finalKey, response, cacheTTL);
      }),
    );
  }

  private buildCacheKey(baseKey: string, request: any): string {
    const parts = [baseKey];

    // Add tenant ID if available
    if (request.user?.tenantId) {
      parts.push(`tenant:${request.user.tenantId}`);
    }

    // Add user ID if available
    if (request.user?.id) {
      parts.push(`user:${request.user.id}`);
    }

    // Add query parameters
    if (request.query && Object.keys(request.query).length > 0) {
      const queryStr = JSON.stringify(request.query);
      parts.push(`query:${Buffer.from(queryStr).toString('base64')}`);
    }

    // Add path parameters
    if (request.params && Object.keys(request.params).length > 0) {
      const paramsStr = JSON.stringify(request.params);
      parts.push(`params:${Buffer.from(paramsStr).toString('base64')}`);
    }

    return parts.join(':');
  }
}