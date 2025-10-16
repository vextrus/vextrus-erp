import { Inject } from '@nestjs/common';
import { ICacheManager } from './cache-manager.interface';

const CACHE_MANAGER = Symbol('CACHE_MANAGER');
let globalCacheManager: ICacheManager | null = null;

/**
 * Set global cache manager for decorators
 */
export function setGlobalCacheManager(manager: ICacheManager): void {
  globalCacheManager = manager;
}

/**
 * Generate cache key from method name and arguments
 */
function generateCacheKey(
  target: any,
  propertyName: string,
  args: any[],
  keyGenerator?: (...args: any[]) => string
): string {
  if (keyGenerator) {
    return keyGenerator(...args);
  }
  
  const className = target.constructor.name;
  const argsKey = JSON.stringify(args);
  return `${className}:${propertyName}:${argsKey}`;
}

/**
 * Cache method results
 */
export function Cacheable(options: {
  ttl?: number;
  key?: string | ((...args: any[]) => string);
  tags?: string[];
  condition?: (...args: any[]) => boolean;
} = {}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // Check condition
      if (options.condition && !options.condition(...args)) {
        return originalMethod.apply(this, args);
      }
      
      // Get cache manager
      const cacheManager = (this as any).cacheManager || globalCacheManager;
      if (!cacheManager) {
        console.warn('Cache manager not found, skipping cache');
        return originalMethod.apply(this, args);
      }
      
      // Generate cache key
      const keyGenerator = typeof options.key === 'function' ? options.key : undefined;
      const cacheKey = options.key && typeof options.key === 'string'
        ? options.key
        : generateCacheKey(target, propertyName, args, keyGenerator);
      
      try {
        // Try to get from cache
        const cached = await cacheManager.get(cacheKey);
        if (cached !== null) {
          return cached;
        }
        
        // Execute method
        const result = await originalMethod.apply(this, args);
        
        // Store in cache
        await cacheManager.set(cacheKey, result, {
          ttl: options.ttl,
          tags: options.tags
        });
        
        return result;
      } catch (error) {
        console.error('Cache error, falling back to method execution:', error);
        return originalMethod.apply(this, args);
      }
    };
    
    return descriptor;
  };
}

/**
 * Evict cache entries
 */
export function CacheEvict(options: {
  key?: string | ((...args: any[]) => string);
  keys?: string[] | ((...args: any[]) => string[]);
  tags?: string[];
  allEntries?: boolean;
  beforeInvocation?: boolean;
} = {}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheManager = (this as any).cacheManager || globalCacheManager;
      if (!cacheManager) {
        return originalMethod.apply(this, args);
      }
      
      const evict = async () => {
        try {
          if (options.allEntries) {
            await cacheManager.clear();
          } else if (options.tags) {
            await cacheManager.deleteTags(options.tags);
          } else if (options.keys) {
            const keys = typeof options.keys === 'function'
              ? options.keys(...args)
              : options.keys;
            
            for (const key of keys) {
              await cacheManager.delete(key);
            }
          } else if (options.key) {
            const key = typeof options.key === 'function'
              ? options.key(...args)
              : options.key;
            
            await cacheManager.delete(key);
          } else {
            // Default: evict key based on method name and args
            const keyGenerator = typeof options.key === 'function' ? options.key : undefined;
            const cacheKey = generateCacheKey(target, propertyName, args, keyGenerator);
            await cacheManager.delete(cacheKey);
          }
        } catch (error) {
          console.error('Cache eviction error:', error);
        }
      };
      
      if (options.beforeInvocation) {
        await evict();
      }
      
      const result = await originalMethod.apply(this, args);
      
      if (!options.beforeInvocation) {
        await evict();
      }
      
      return result;
    };
    
    return descriptor;
  };
}

/**
 * Update cache entry
 */
export function CachePut(options: {
  key?: string | ((...args: any[]) => string);
  ttl?: number;
  tags?: string[];
  condition?: (...args: any[]) => boolean;
} = {}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      // Check condition
      if (options.condition && !options.condition(...args)) {
        return result;
      }
      
      const cacheManager = (this as any).cacheManager || globalCacheManager;
      if (!cacheManager) {
        return result;
      }
      
      // Generate cache key
      const keyGenerator = typeof options.key === 'function' ? options.key : undefined;
      const cacheKey = options.key && typeof options.key === 'string'
        ? options.key
        : generateCacheKey(target, propertyName, args, keyGenerator);
      
      try {
        // Always update cache with result
        await cacheManager.set(cacheKey, result, {
          ttl: options.ttl,
          tags: options.tags
        });
      } catch (error) {
        console.error('Cache put error:', error);
      }
      
      return result;
    };
    
    return descriptor;
  };
}

/**
 * Cache manager injection decorator
 */
export function InjectCacheManager() {
  return Inject(CACHE_MANAGER);
}