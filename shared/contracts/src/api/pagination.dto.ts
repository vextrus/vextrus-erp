export interface PaginationRequest {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  search?: string;
  fields?: string[];
}

export interface PaginationResponse<T = any> {
  items: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  nextPage?: number;
  previousPage?: number;
}

export interface CursorPaginationRequest {
  cursor?: string;
  limit: number;
  direction?: 'forward' | 'backward';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface CursorPaginationResponse<T = any> {
  items: T[];
  cursor: CursorMeta;
}

export interface CursorMeta {
  next?: string;
  previous?: string;
  hasNext: boolean;
  hasPrevious: boolean;
  count: number;
}

export class PaginationBuilder {
  static createMeta(
    page: number,
    limit: number,
    total: number
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;
    
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrevious,
      nextPage: hasNext ? page + 1 : undefined,
      previousPage: hasPrevious ? page - 1 : undefined
    };
  }
  
  static createResponse<T>(
    items: T[],
    page: number,
    limit: number,
    total: number
  ): PaginationResponse<T> {
    return {
      items,
      pagination: this.createMeta(page, limit, total)
    };
  }
  
  static createCursorResponse<T>(
    items: T[],
    nextCursor?: string,
    previousCursor?: string
  ): CursorPaginationResponse<T> {
    return {
      items,
      cursor: {
        next: nextCursor,
        previous: previousCursor,
        hasNext: !!nextCursor,
        hasPrevious: !!previousCursor,
        count: items.length
      }
    };
  }
  
  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }
  
  static validatePagination(request: PaginationRequest): void {
    if (request.page < 1) {
      throw new Error('Page must be greater than 0');
    }
    
    if (request.limit < 1 || request.limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
  }
}

export interface InfiniteScrollRequest {
  lastId?: string;
  limit: number;
  filters?: Record<string, any>;
}

export interface InfiniteScrollResponse<T = any> {
  items: T[];
  lastId?: string;
  hasMore: boolean;
  total?: number;
}