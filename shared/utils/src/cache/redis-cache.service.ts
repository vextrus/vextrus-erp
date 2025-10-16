import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ICacheManager, CacheOptions, CacheStatistics, CacheStore } from './cache-manager.interface';

@Injectable()
export class RedisCacheService implements ICacheManager, CacheStore, OnModuleDestroy {
  private client: Redis;
  private stats: CacheStatistics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    hitRate: 0
  };

  constructor(
    private readonly config: {
      host?: string;
      port?: number;
      password?: string;
      db?: number;
      keyPrefix?: string;
    } = {}
  ) {
    this.client = new Redis({
      host: config.host || 'localhost',
      port: config.port || 6379,
      password: config.password,
      db: config.db || 0,
      keyPrefix: config.keyPrefix || 'vextrus:',
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  getName(): string {
    return 'redis';
  }

  async connect(): Promise<void> {
    await this.client.ping();
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }

  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async flush(): Promise<void> {
    await this.client.flushdb();
    this.resetStats();
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      
      if (value === null) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }
      
      this.stats.hits++;
      this.updateHitRate();
      
      return JSON.parse(value) as T;
    } catch (error) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  async set<T = any>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const serialized = JSON.stringify(value);
    
    if (options.ttl) {
      await this.client.setex(key, options.ttl, serialized);
    } else {
      await this.client.set(key, serialized);
    }
    
    // Store tags if provided
    if (options.tags && options.tags.length > 0) {
      for (const tag of options.tags) {
        await this.client.sadd(`tag:${tag}`, key);
      }
    }
    
    this.stats.sets++;
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.client.del(key);
    
    if (result > 0) {
      this.stats.deletes++;
      return true;
    }
    
    return false;
  }

  async has(key: string): Promise<boolean> {
    const exists = await this.client.exists(key);
    return exists === 1;
  }

  async clear(): Promise<void> {
    const keys = await this.client.keys('*');
    
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
    
    this.resetStats();
  }

  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    const values = await this.client.mget(...keys);
    
    return values.map(value => {
      if (value === null) {
        this.stats.misses++;
        return null;
      }
      
      try {
        this.stats.hits++;
        return JSON.parse(value) as T;
      } catch {
        this.stats.misses++;
        return null;
      }
    });
  }

  async mset<T = any>(entries: Array<{ key: string; value: T; options?: CacheOptions }>): Promise<void> {
    const pipeline = this.client.pipeline();
    
    for (const entry of entries) {
      const serialized = JSON.stringify(entry.value);
      
      if (entry.options?.ttl) {
        pipeline.setex(entry.key, entry.options.ttl, serialized);
      } else {
        pipeline.set(entry.key, serialized);
      }
      
      // Add tags
      if (entry.options?.tags) {
        for (const tag of entry.options.tags) {
          pipeline.sadd(`tag:${tag}`, entry.key);
        }
      }
    }
    
    await pipeline.exec();
    this.stats.sets += entries.length;
  }

  async deletePattern(pattern: string): Promise<number> {
    const keys = await this.client.keys(pattern);
    
    if (keys.length === 0) {
      return 0;
    }
    
    const result = await this.client.del(...keys);
    this.stats.deletes += result;
    
    return result;
  }

  async deleteTags(tags: string[]): Promise<number> {
    let totalDeleted = 0;
    
    for (const tag of tags) {
      const keys = await this.client.smembers(`tag:${tag}`);
      
      if (keys.length > 0) {
        const deleted = await this.client.del(...keys);
        totalDeleted += deleted;
        
        // Clean up the tag set
        await this.client.del(`tag:${tag}`);
      }
    }
    
    this.stats.deletes += totalDeleted;
    return totalDeleted;
  }

  async getStats(): Promise<CacheStatistics> {
    const info = await this.client.info('memory');
    const memoryMatch = info.match(/used_memory:(\d+)/);
    
    if (memoryMatch && memoryMatch[1]) {
      this.stats.memory = parseInt(memoryMatch[1]) / 1024 / 1024; // Convert to MB
    }
    
    const dbSize = await this.client.dbsize();
    this.stats.size = dbSize;
    
    return { ...this.stats };
  }

  async getOrSet<T = any>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    // Generate value
    const value = await factory();
    
    // Store in cache
    await this.set(key, value, options);
    
    return value;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
      memory: 0,
      hitRate: 0
    };
  }
}