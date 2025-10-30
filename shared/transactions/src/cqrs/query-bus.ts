// Injectable decorator not needed for plain class
import { IQuery, IQueryHandler } from './query.interface';
import { EventEmitter } from 'events';
import { v4 as uuid } from 'uuid';

/**
 * Query bus for executing queries
 */
export class QueryBus extends EventEmitter {
  private handlers = new Map<string, IQueryHandler>();
  private middleware: Array<(query: IQuery) => Promise<void>> = [];
  private cache = new Map<string, { result: any; timestamp: number }>();
  private cacheTimeout = 60000; // 1 minute default

  /**
   * Register a query handler
   */
  register<TQuery extends IQuery>(
    queryType: string,
    handler: IQueryHandler<TQuery>
  ): void {
    if (this.handlers.has(queryType)) {
      throw new Error(`Handler for query ${queryType} already registered`);
    }
    this.handlers.set(queryType, handler);
    this.emit('handler:registered', { queryType });
  }

  /**
   * Unregister a query handler
   */
  unregister(queryType: string): void {
    this.handlers.delete(queryType);
    this.emit('handler:unregistered', { queryType });
  }

  /**
   * Add middleware to the query pipeline
   */
  use(middleware: (query: IQuery) => Promise<void>): void {
    this.middleware.push(middleware);
  }

  /**
   * Execute a query
   */
  async execute<TResult = any>(
    query: IQuery,
    options?: { cache?: boolean; cacheKey?: string }
  ): Promise<TResult> {
    const queryType = query.constructor.name;
    const handler = this.handlers.get(queryType);

    if (!handler) {
      throw new Error(`No handler registered for query: ${queryType}`);
    }

    // Check cache if enabled
    if (options?.cache) {
      const cacheKey = options.cacheKey || this.generateCacheKey(query);
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        this.emit('query:cache-hit', { query, type: queryType });
        return cached.result as TResult;
      }
    }

    // Add metadata if not present
    const enrichedQuery = this.enrichQuery(query);

    // Emit pre-execution event
    this.emit('query:executing', { query: enrichedQuery, type: queryType });

    try {
      // Run middleware
      for (const mw of this.middleware) {
        await mw(enrichedQuery);
      }

      // Execute query
      const result = await handler.execute(enrichedQuery);

      // Cache result if enabled
      if (options?.cache) {
        const cacheKey = options.cacheKey || this.generateCacheKey(query);
        this.cache.set(cacheKey, { result, timestamp: Date.now() });
      }

      // Emit post-execution event
      this.emit('query:executed', { 
        query: enrichedQuery, 
        type: queryType, 
        result 
      });

      return result as TResult;
    } catch (error) {
      // Emit error event
      this.emit('query:failed', { 
        query: enrichedQuery, 
        type: queryType, 
        error 
      });
      throw error;
    }
  }

  /**
   * Execute multiple queries in parallel
   */
  async executeMany<TResult = any>(
    queries: IQuery[]
  ): Promise<TResult[]> {
    return Promise.all(
      queries.map(query => this.execute<TResult>(query))
    );
  }

  /**
   * Get registered handler for a query type
   */
  getHandler(queryType: string): IQueryHandler | undefined {
    return this.handlers.get(queryType);
  }

  /**
   * Check if a handler is registered
   */
  hasHandler(queryType: string): boolean {
    return this.handlers.has(queryType);
  }

  /**
   * Get all registered query types
   */
  getRegisteredQueries(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Set cache timeout
   */
  setCacheTimeout(timeout: number): void {
    this.cacheTimeout = timeout;
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
    this.middleware = [];
    this.cache.clear();
    this.removeAllListeners();
  }

  /**
   * Enrich query with metadata
   */
  private enrichQuery(query: IQuery): IQuery {
    if (!query.correlationId) {
      (query as any).correlationId = uuid();
    }
    if (!query.metadata) {
      (query as any).metadata = {};
    }
    (query as any).metadata.timestamp = Date.now();
    return query;
  }

  /**
   * Generate cache key for a query
   */
  private generateCacheKey(query: IQuery): string {
    const queryType = query.constructor.name;
    const queryData = { ...query };
    delete (queryData as any).correlationId;
    delete (queryData as any).metadata;
    return `${queryType}:${JSON.stringify(queryData)}`;
  }
}