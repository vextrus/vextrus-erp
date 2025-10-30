import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cache: Map<string, { value: any; expiry: number }> = new Map();
  private readonly enabled: boolean;
  private readonly defaultTtl: number;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<boolean>('rules.enableCache', true);
    this.defaultTtl = this.configService.get<number>('rules.cacheTtl', 60);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.enabled) return;

    const ttlSeconds = ttl || this.defaultTtl;
    const expiry = Date.now() + (ttlSeconds * 1000);
    
    this.cache.set(key, { value, expiry });
    this.logger.debug(`Cached ${key} with TTL ${ttlSeconds}s`);
    
    // Clean up expired entries periodically
    this.cleanupExpired();
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    this.logger.debug(`Cache hit for ${key}`);
    return entry.value as T;
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    this.logger.debug(`Deleted cache key ${key}`);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.logger.log('Cache cleared');
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  async getStats(): Promise<any> {
    this.cleanupExpired();
    
    return {
      enabled: this.enabled,
      size: this.cache.size,
      defaultTtl: this.defaultTtl,
    };
  }
}