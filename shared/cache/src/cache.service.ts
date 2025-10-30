import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CACHE_CLIENT } from './redis-cache.module';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  compress?: boolean;
}

export interface CachePattern {
  pattern: string;
  ttl: number;
  description: string;
}

@Injectable()
export class CacheService {
  // Predefined cache patterns for different data types
  private readonly cachePatterns: Map<string, CachePattern> = new Map([
    ['session', { pattern: 'session:', ttl: 3600, description: 'User session data (1 hour)' }],
    ['auth', { pattern: 'auth:', ttl: 900, description: 'Authentication tokens (15 minutes)' }],
    ['user', { pattern: 'user:', ttl: 300, description: 'User profile data (5 minutes)' }],
    ['config', { pattern: 'config:', ttl: 86400, description: 'Configuration data (24 hours)' }],
    ['feature', { pattern: 'feature:', ttl: 3600, description: 'Feature flags (1 hour)' }],
    ['lookup', { pattern: 'lookup:', ttl: 7200, description: 'Lookup/reference data (2 hours)' }],
    ['query', { pattern: 'query:', ttl: 60, description: 'Database query results (1 minute)' }],
    ['report', { pattern: 'report:', ttl: 1800, description: 'Generated reports (30 minutes)' }],
    ['temp', { pattern: 'temp:', ttl: 300, description: 'Temporary data (5 minutes)' }],
    ['notification', { pattern: 'notification:', ttl: 86400, description: 'Notification data (24 hours)' }],
    ['file', { pattern: 'file:', ttl: 3600, description: 'File metadata (1 hour)' }],
    ['document', { pattern: 'document:', ttl: 1800, description: 'Document generation cache (30 minutes)' }],
  ]);

  constructor(
    @Inject(REDIS_CACHE_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deleteByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      return await this.redis.del(...keys);
    } catch (error) {
      console.error(`Cache delete by pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      console.error(`Cache ttl error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Set TTL for an existing key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, ttl);
      return result === 1;
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Cache-aside pattern implementation
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, get from source
    const value = await factory();

    // Store in cache
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Increment a counter
   */
  async increment(key: string, by: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(key, by);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Decrement a counter
   */
  async decrement(key: string, by: number = 1): Promise<number> {
    try {
      return await this.redis.decrby(key, by);
    } catch (error) {
      console.error(`Cache decrement error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Add item to a set
   */
  async addToSet(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.redis.sadd(key, ...members);
    } catch (error) {
      console.error(`Cache add to set error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Remove item from a set
   */
  async removeFromSet(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.redis.srem(key, ...members);
    } catch (error) {
      console.error(`Cache remove from set error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get all members of a set
   */
  async getSetMembers(key: string): Promise<string[]> {
    try {
      return await this.redis.smembers(key);
    } catch (error) {
      console.error(`Cache get set members error for key ${key}:`, error);
      return [];
    }
  }

  /**
   * Add item to a sorted set with score
   */
  async addToSortedSet(key: string, score: number, member: string): Promise<number> {
    try {
      return await this.redis.zadd(key, score, member);
    } catch (error) {
      console.error(`Cache add to sorted set error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get sorted set range by score
   */
  async getSortedSetRangeByScore(
    key: string,
    min: number | string,
    max: number | string,
    limit?: number,
  ): Promise<string[]> {
    try {
      if (limit) {
        return await this.redis.zrangebyscore(key, min, max, 'LIMIT', 0, limit);
      }
      return await this.redis.zrangebyscore(key, min, max);
    } catch (error) {
      console.error(`Cache get sorted set range error for key ${key}:`, error);
      return [];
    }
  }

  /**
   * Push item to a list
   */
  async pushToList(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.redis.rpush(key, ...values);
    } catch (error) {
      console.error(`Cache push to list error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Pop item from a list
   */
  async popFromList(key: string): Promise<string | null> {
    try {
      return await this.redis.lpop(key);
    } catch (error) {
      console.error(`Cache pop from list error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Get list range
   */
  async getListRange(key: string, start: number = 0, stop: number = -1): Promise<string[]> {
    try {
      return await this.redis.lrange(key, start, stop);
    } catch (error) {
      console.error(`Cache get list range error for key ${key}:`, error);
      return [];
    }
  }

  /**
   * Set hash field
   */
  async setHashField(key: string, field: string, value: string): Promise<number> {
    try {
      return await this.redis.hset(key, field, value);
    } catch (error) {
      console.error(`Cache set hash field error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get hash field
   */
  async getHashField(key: string, field: string): Promise<string | null> {
    try {
      return await this.redis.hget(key, field);
    } catch (error) {
      console.error(`Cache get hash field error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Get all hash fields
   */
  async getHash(key: string): Promise<Record<string, string>> {
    try {
      return await this.redis.hgetall(key);
    } catch (error) {
      console.error(`Cache get hash error for key ${key}:`, error);
      return {};
    }
  }

  /**
   * Flush all cache (use with caution)
   */
  async flushAll(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error('Cache flush all error:', error);
    }
  }

  /**
   * Get cache pattern by type
   */
  getCachePattern(type: string): CachePattern | undefined {
    return this.cachePatterns.get(type);
  }

  /**
   * Generate cache key with pattern
   */
  generateKey(type: string, ...parts: string[]): string {
    const pattern = this.cachePatterns.get(type);
    if (!pattern) {
      throw new Error(`Unknown cache pattern type: ${type}`);
    }
    return `${pattern.pattern}${parts.join(':')}`;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<Record<string, any>> {
    try {
      const info = await this.redis.info('stats');
      const lines = info.split('\r\n');
      const stats: Record<string, any> = {};

      for (const line of lines) {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          if (key && value) {
            stats[key] = isNaN(Number(value)) ? value : Number(value);
          }
        }
      }

      return stats;
    } catch (error) {
      console.error('Cache get stats error:', error);
      return {};
    }
  }
}