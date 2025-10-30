import { Injectable } from '@nestjs/common';
import { ICacheManager, CacheOptions, CacheStatistics, CacheEntry } from './cache-manager.interface';

interface MemoryCacheEntry<T = any> extends CacheEntry<T> {
  lastAccessed: Date;
  size: number;
}

@Injectable()
export class MemoryCacheService implements ICacheManager {
  private cache: Map<string, MemoryCacheEntry> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private stats: CacheStatistics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    memory: 0,
    hitRate: 0
  };
  
  private readonly maxSize: number;
  private readonly maxMemory: number; // in bytes
  private currentMemory: number = 0;

  constructor(
    private readonly config: {
      maxSize?: number;
      maxMemory?: number;
      defaultTtl?: number;
    } = {}
  ) {
    this.maxSize = config.maxSize || 1000;
    this.maxMemory = config.maxMemory || 100 * 1024 * 1024; // 100MB default
  }

  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
    
    // Check expiration
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      await this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
    
    // Update access time and hits
    entry.lastAccessed = new Date();
    entry.hits++;
    this.stats.hits++;
    this.updateHitRate();
    
    return entry.value as T;
  }

  async set<T = any>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const size = this.estimateSize(value);
    
    // Check if we need to evict entries
    await this.ensureSpace(size);
    
    const ttl = options.ttl || this.config.defaultTtl;
    const expiresAt = ttl ? new Date(Date.now() + ttl * 1000) : undefined;
    
    const entry: MemoryCacheEntry<T> = {
      key,
      value,
      createdAt: new Date(),
      lastAccessed: new Date(),
      expiresAt,
      tags: options.tags,
      hits: 0,
      size
    };
    
    // Remove old entry if exists
    if (this.cache.has(key)) {
      await this.delete(key);
    }
    
    // Add new entry
    this.cache.set(key, entry);
    this.currentMemory += size;
    
    // Update tag index
    if (options.tags) {
      for (const tag of options.tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(key);
      }
    }
    
    this.stats.sets++;
    this.stats.size = this.cache.size;
  }

  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Remove from tag index
    if (entry.tags) {
      for (const tag of entry.tags) {
        const tagSet = this.tagIndex.get(tag);
        if (tagSet) {
          tagSet.delete(key);
          if (tagSet.size === 0) {
            this.tagIndex.delete(tag);
          }
        }
      }
    }
    
    // Remove from cache
    this.cache.delete(key);
    this.currentMemory -= entry.size;
    this.stats.deletes++;
    this.stats.size = this.cache.size;
    
    return true;
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check expiration
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      await this.delete(key);
      return false;
    }
    
    return true;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.tagIndex.clear();
    this.currentMemory = 0;
    this.resetStats();
  }

  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    const results: (T | null)[] = [];
    
    for (const key of keys) {
      results.push(await this.get<T>(key));
    }
    
    return results;
  }

  async mset<T = any>(entries: Array<{ key: string; value: T; options?: CacheOptions }>): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.value, entry.options);
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    let deleted = 0;
    for (const key of keysToDelete) {
      if (await this.delete(key)) {
        deleted++;
      }
    }
    
    return deleted;
  }

  async deleteTags(tags: string[]): Promise<number> {
    let deleted = 0;
    
    for (const tag of tags) {
      const keys = this.tagIndex.get(tag);
      
      if (keys) {
        for (const key of keys) {
          if (await this.delete(key)) {
            deleted++;
          }
        }
      }
    }
    
    return deleted;
  }

  async getStats(): Promise<CacheStatistics> {
    // Clean expired entries
    await this.cleanExpired();
    
    return {
      ...this.stats,
      memory: this.currentMemory / 1024 / 1024 // Convert to MB
    };
  }

  async getOrSet<T = any>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const value = await factory();
    await this.set(key, value, options);
    
    return value;
  }

  /**
   * LRU eviction to ensure space
   */
  private async ensureSpace(requiredSize: number): Promise<void> {
    // Check size limit
    while (this.cache.size >= this.maxSize) {
      await this.evictLRU();
    }
    
    // Check memory limit
    while (this.currentMemory + requiredSize > this.maxMemory) {
      if (!await this.evictLRU()) {
        break; // No more items to evict
      }
    }
  }

  /**
   * Evict least recently used entry
   */
  private async evictLRU(): Promise<boolean> {
    let lruKey: string | null = null;
    let lruTime = new Date();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      return await this.delete(lruKey);
    }
    
    return false;
  }

  /**
   * Clean expired entries
   */
  private async cleanExpired(): Promise<void> {
    const now = new Date();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      await this.delete(key);
    }
  }

  /**
   * Estimate size of value in bytes
   */
  private estimateSize(value: any): number {
    const str = JSON.stringify(value);
    return str.length * 2; // Rough estimate (2 bytes per character)
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