import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';

/**
 * Cache decorator to set cache key and TTL
 * @param key - Cache key pattern
 * @param ttl - Time to live in seconds (optional)
 */
export const Cacheable = (key: string, ttl?: number) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, key)(target, propertyName, descriptor);
    if (ttl) {
      SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyName, descriptor);
    }
    return descriptor;
  };
};

/**
 * Clear cache decorator to invalidate cache entries
 * @param patterns - Cache key patterns to clear
 */
export const CacheEvict = (...patterns: string[]) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // Clear cache entries after method execution
      const cacheService = (this as any).cacheService;
      if (cacheService) {
        for (const pattern of patterns) {
          await cacheService.deleteByPattern(pattern);
        }
      }

      return result;
    };

    return descriptor;
  };
};

/**
 * Cache put decorator to update cache entry
 * @param key - Cache key
 * @param ttl - Time to live in seconds (optional)
 */
export const CachePut = (key: string, ttl?: number) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // Update cache entry after method execution
      const cacheService = (this as any).cacheService;
      if (cacheService) {
        await cacheService.set(key, result, ttl);
      }

      return result;
    };

    return descriptor;
  };
};