/**
 * Base interface for queries
 */
export interface IQuery {
  readonly correlationId?: string;
  readonly metadata?: Record<string, any>;
}

/**
 * Query handler interface
 */
export interface IQueryHandler<TQuery extends IQuery = IQuery, TResult = any> {
  execute(query: TQuery): Promise<TResult>;
}

/**
 * Query metadata
 */
export interface QueryMetadata {
  correlationId: string;
  userId?: string;
  timestamp: number;
  [key: string]: any;
}

/**
 * Query handler decorator metadata
 */
export interface QueryHandlerMetadata {
  queryType: string;
  handler: IQueryHandler;
}