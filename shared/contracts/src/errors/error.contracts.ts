export enum ErrorCodes {
  // Authentication Errors
  INVALID_CREDENTIALS = 'AUTH001',
  TOKEN_EXPIRED = 'AUTH002',
  TOKEN_INVALID = 'AUTH003',
  ACCOUNT_LOCKED = 'AUTH004',
  INSUFFICIENT_PERMISSIONS = 'AUTH005',
  
  // Validation Errors
  VALIDATION_FAILED = 'VAL001',
  INVALID_INPUT = 'VAL002',
  MISSING_REQUIRED_FIELD = 'VAL003',
  INVALID_FORMAT = 'VAL004',
  
  // Business Logic Errors
  ENTITY_NOT_FOUND = 'BUS001',
  ENTITY_ALREADY_EXISTS = 'BUS002',
  OPERATION_NOT_ALLOWED = 'BUS003',
  BUSINESS_RULE_VIOLATION = 'BUS004',
  
  // System Errors
  INTERNAL_SERVER_ERROR = 'SYS001',
  DATABASE_ERROR = 'SYS002',
  EXTERNAL_SERVICE_ERROR = 'SYS003',
  CONFIGURATION_ERROR = 'SYS004',
}

export interface IErrorResponse {
  code: ErrorCodes;
  message: string;
  details?: any;
  timestamp: Date;
  path?: string;
  correlationId?: string;
}

export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCodes,
    message: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: any) {
    super(ErrorCodes.VALIDATION_FAILED, message, details);
    this.name = 'ValidationError';
  }
}

export class BusinessRuleError extends DomainError {
  constructor(message: string, details?: any) {
    super(ErrorCodes.BUSINESS_RULE_VIOLATION, message, details);
    this.name = 'BusinessRuleError';
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entityName: string, id: string) {
    super(ErrorCodes.ENTITY_NOT_FOUND, `${entityName} with id ${id} not found`);
    this.name = 'EntityNotFoundError';
  }
}