export interface ApiRequest<T = any> {
  data: T;
  metadata?: RequestMetadata;
}

export interface RequestMetadata {
  correlationId: string;
  timestamp: Date;
  source?: string;
  userId?: string;
  tenantId?: string;
  locale?: string;
  timezone?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata: ResponseMetadata;
}

export interface ResponseMetadata {
  correlationId: string;
  timestamp: Date;
  duration?: number;
  version?: string;
  deprecation?: DeprecationInfo;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
  validationErrors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

export interface DeprecationInfo {
  deprecated: boolean;
  message?: string;
  removeDate?: Date;
  alternative?: string;
}

export class ApiResponseBuilder<T = any> {
  private response: ApiResponse<T>;
  
  constructor(correlationId: string) {
    this.response = {
      success: true,
      metadata: {
        correlationId,
        timestamp: new Date()
      }
    };
  }
  
  static success<T>(data: T, correlationId: string): ApiResponse<T> {
    return new ApiResponseBuilder<T>(correlationId)
      .withData(data)
      .build();
  }
  
  static error(error: ApiError, correlationId: string): ApiResponse {
    return new ApiResponseBuilder(correlationId)
      .withError(error)
      .build();
  }
  
  withData(data: T): this {
    this.response.data = data;
    this.response.success = true;
    return this;
  }
  
  withError(error: ApiError): this {
    this.response.error = error;
    this.response.success = false;
    delete this.response.data;
    return this;
  }
  
  withDuration(duration: number): this {
    this.response.metadata.duration = duration;
    return this;
  }
  
  withVersion(version: string): this {
    this.response.metadata.version = version;
    return this;
  }
  
  withDeprecation(deprecation: DeprecationInfo): this {
    this.response.metadata.deprecation = deprecation;
    return this;
  }
  
  build(): ApiResponse<T> {
    return this.response;
  }
}