import { ErrorCode } from './error-codes';

export abstract class BusinessException extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;
  public correlationId?: string;
  
  constructor(
    message: string,
    code: string,
    statusCode: number = 400,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
    
    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
  
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      correlationId: this.correlationId
    };
  }
  
  withCorrelationId(correlationId: string): this {
    this.correlationId = correlationId;
    return this;
  }
}

export class ValidationException extends BusinessException {
  public readonly validationErrors: ValidationError[];
  
  constructor(
    message: string = 'Validation failed',
    validationErrors: ValidationError[]
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, { validationErrors });
    this.validationErrors = validationErrors;
  }
  
  static fromFieldError(field: string, message: string): ValidationException {
    return new ValidationException('Validation failed', [
      { field, message }
    ]);
  }
  
  static fromFieldErrors(errors: Record<string, string>): ValidationException {
    const validationErrors = Object.entries(errors).map(([field, message]) => ({
      field,
      message
    }));
    
    return new ValidationException('Validation failed', validationErrors);
  }
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  code?: string;
}

export class IntegrationException extends BusinessException {
  public readonly service: string;
  public readonly retryable: boolean;
  public readonly retryAfter?: number;
  
  constructor(
    message: string,
    service: string,
    retryable: boolean = false,
    retryAfter?: number
  ) {
    super(
      message,
      ErrorCode.INTEGRATION_ERROR,
      503,
      { service, retryable, retryAfter }
    );
    this.service = service;
    this.retryable = retryable;
    this.retryAfter = retryAfter;
  }
}

export class AuthorizationException extends BusinessException {
  public readonly resource?: string;
  public readonly action?: string;
  
  constructor(
    message: string = 'Unauthorized access',
    resource?: string,
    action?: string
  ) {
    super(
      message,
      ErrorCode.UNAUTHORIZED,
      403,
      { resource, action }
    );
    this.resource = resource;
    this.action = action;
  }
}

export class AuthenticationException extends BusinessException {
  constructor(message: string = 'Authentication required') {
    super(message, ErrorCode.AUTHENTICATION_REQUIRED, 401);
  }
}

export class ResourceNotFoundException extends BusinessException {
  public readonly resourceType: string;
  public readonly resourceId: string;
  
  constructor(resourceType: string, resourceId: string) {
    super(
      `${resourceType} with ID ${resourceId} not found`,
      ErrorCode.RESOURCE_NOT_FOUND,
      404,
      { resourceType, resourceId }
    );
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

export class ConflictException extends BusinessException {
  public readonly conflictType: string;
  
  constructor(
    message: string,
    conflictType: string,
    details?: Record<string, any>
  ) {
    super(message, ErrorCode.CONFLICT, 409, { conflictType, ...details });
    this.conflictType = conflictType;
  }
}

export class RateLimitException extends BusinessException {
  public readonly limit: number;
  public readonly resetAt: Date;
  
  constructor(limit: number, resetAt: Date) {
    super(
      `Rate limit exceeded. Limit: ${limit}`,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      429,
      { limit, resetAt }
    );
    this.limit = limit;
    this.resetAt = resetAt;
  }
}