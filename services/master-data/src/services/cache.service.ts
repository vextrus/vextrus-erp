import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      return value || null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
    } catch (error) {
      console.error('Cache reset error:', error);
    }
  }

  generateKey(prefix: string, tenantId: string, ...parts: string[]): string {
    return `${prefix}:${tenantId}:${parts.join(':')}`;
  }

  generateCustomerKey(tenantId: string, customerId: string): string {
    return this.generateKey('customer', tenantId, customerId);
  }

  generateVendorKey(tenantId: string, vendorId: string): string {
    return this.generateKey('vendor', tenantId, vendorId);
  }

  generateProductKey(tenantId: string, productId: string): string {
    return this.generateKey('product', tenantId, productId);
  }

  generateAccountKey(tenantId: string, accountId: string): string {
    return this.generateKey('account', tenantId, accountId);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // This would need Redis SCAN implementation
    // For now, we'll just log
    console.log(`Would invalidate cache keys matching pattern: ${pattern}`);
  }
}