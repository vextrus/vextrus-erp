export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for cache invalidation
  compress?: boolean; // Compress large values
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  createdAt: Date;
  expiresAt?: Date;
  tags?: string[];
  hits: number;
}

export interface ICacheManager {
  /**
   * Get a value from cache
   */
  get<T = any>(key: string): Promise<T | null>;
  
  /**
   * Set a value in cache
   */
  set<T = any>(key: string, value: T, options?: CacheOptions): Promise<void>;
  
  /**
   * Delete a value from cache
   */
  delete(key: string): Promise<boolean>;
  
  /**
   * Check if key exists
   */
  has(key: string): Promise<boolean>;
  
  /**
   * Clear all cache
   */
  clear(): Promise<void>;
  
  /**
   * Get multiple values
   */
  mget<T = any>(keys: string[]): Promise<(T | null)[]>;
  
  /**
   * Set multiple values
   */
  mset<T = any>(entries: Array<{ key: string; value: T; options?: CacheOptions }>): Promise<void>;
  
  /**
   * Delete by pattern
   */
  deletePattern(pattern: string): Promise<number>;
  
  /**
   * Delete by tags
   */
  deleteTags(tags: string[]): Promise<number>;
  
  /**
   * Get cache statistics
   */
  getStats(): Promise<CacheStatistics>;
  
  /**
   * Get or set (cache-aside pattern)
   */
  getOrSet<T = any>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T>;
}

export interface CacheStatistics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  memory?: number;
  hitRate: number;
}

export interface CacheStore {
  /**
   * Store implementation name
   */
  getName(): string;
  
  /**
   * Connect to cache store
   */
  connect(): Promise<void>;
  
  /**
   * Disconnect from cache store
   */
  disconnect(): Promise<void>;
  
  /**
   * Health check
   */
  isHealthy(): Promise<boolean>;
  
  /**
   * Flush all data
   */
  flush(): Promise<void>;
}