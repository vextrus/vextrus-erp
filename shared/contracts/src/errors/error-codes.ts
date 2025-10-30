export enum ErrorCode {
  // Authentication & Authorization (1xxx)
  AUTHENTICATION_REQUIRED = 'AUTH_1001',
  INVALID_CREDENTIALS = 'AUTH_1002',
  TOKEN_EXPIRED = 'AUTH_1003',
  TOKEN_INVALID = 'AUTH_1004',
  UNAUTHORIZED = 'AUTH_1005',
  INSUFFICIENT_PERMISSIONS = 'AUTH_1006',
  SESSION_EXPIRED = 'AUTH_1007',
  MFA_REQUIRED = 'AUTH_1008',
  
  // Validation (2xxx)
  VALIDATION_ERROR = 'VAL_2001',
  INVALID_INPUT = 'VAL_2002',
  MISSING_REQUIRED_FIELD = 'VAL_2003',
  INVALID_FORMAT = 'VAL_2004',
  VALUE_OUT_OF_RANGE = 'VAL_2005',
  DUPLICATE_VALUE = 'VAL_2006',
  INVALID_STATE_TRANSITION = 'VAL_2007',
  
  // Resource (3xxx)
  RESOURCE_NOT_FOUND = 'RES_3001',
  RESOURCE_ALREADY_EXISTS = 'RES_3002',
  RESOURCE_LOCKED = 'RES_3003',
  RESOURCE_DELETED = 'RES_3004',
  RESOURCE_EXPIRED = 'RES_3005',
  
  // Business Logic (4xxx)
  BUSINESS_RULE_VIOLATION = 'BUS_4001',
  INSUFFICIENT_BALANCE = 'BUS_4002',
  QUOTA_EXCEEDED = 'BUS_4003',
  OPERATION_NOT_ALLOWED = 'BUS_4004',
  WORKFLOW_ERROR = 'BUS_4005',
  PRECONDITION_FAILED = 'BUS_4006',
  
  // Integration (5xxx)
  INTEGRATION_ERROR = 'INT_5001',
  EXTERNAL_SERVICE_ERROR = 'INT_5002',
  TIMEOUT_ERROR = 'INT_5003',
  CIRCUIT_BREAKER_OPEN = 'INT_5004',
  SERVICE_UNAVAILABLE = 'INT_5005',
  
  // Data (6xxx)
  DATABASE_ERROR = 'DATA_6001',
  TRANSACTION_FAILED = 'DATA_6002',
  OPTIMISTIC_LOCK_ERROR = 'DATA_6003',
  DATA_INTEGRITY_ERROR = 'DATA_6004',
  MIGRATION_ERROR = 'DATA_6005',
  
  // System (7xxx)
  INTERNAL_SERVER_ERROR = 'SYS_7001',
  CONFIGURATION_ERROR = 'SYS_7002',
  INITIALIZATION_ERROR = 'SYS_7003',
  MEMORY_ERROR = 'SYS_7004',
  FILE_SYSTEM_ERROR = 'SYS_7005',
  
  // Rate Limiting (8xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_8001',
  QUOTA_LIMIT_EXCEEDED = 'RATE_8002',
  CONCURRENT_LIMIT_EXCEEDED = 'RATE_8003',
  
  // Conflict (9xxx)
  CONFLICT = 'CON_9001',
  VERSION_CONFLICT = 'CON_9002',
  MERGE_CONFLICT = 'CON_9003',
  STATE_CONFLICT = 'CON_9004'
}

export interface ErrorCodeInfo {
  code: string;
  message: string;
  httpStatus: number;
  retryable: boolean;
  category: ErrorCategory;
}

export enum ErrorCategory {
  CLIENT_ERROR = 'client_error',
  SERVER_ERROR = 'server_error',
  INTEGRATION_ERROR = 'integration_error',
  BUSINESS_ERROR = 'business_error'
}

export class ErrorCodeRegistry {
  private static readonly errorInfo: Map<string, ErrorCodeInfo> = new Map([
    [ErrorCode.AUTHENTICATION_REQUIRED, {
      code: ErrorCode.AUTHENTICATION_REQUIRED,
      message: 'Authentication is required',
      httpStatus: 401,
      retryable: false,
      category: ErrorCategory.CLIENT_ERROR
    }],
    [ErrorCode.VALIDATION_ERROR, {
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Validation failed',
      httpStatus: 400,
      retryable: false,
      category: ErrorCategory.CLIENT_ERROR
    }],
    [ErrorCode.RESOURCE_NOT_FOUND, {
      code: ErrorCode.RESOURCE_NOT_FOUND,
      message: 'Resource not found',
      httpStatus: 404,
      retryable: false,
      category: ErrorCategory.CLIENT_ERROR
    }],
    [ErrorCode.INTERNAL_SERVER_ERROR, {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      httpStatus: 500,
      retryable: true,
      category: ErrorCategory.SERVER_ERROR
    }],
    [ErrorCode.SERVICE_UNAVAILABLE, {
      code: ErrorCode.SERVICE_UNAVAILABLE,
      message: 'Service temporarily unavailable',
      httpStatus: 503,
      retryable: true,
      category: ErrorCategory.INTEGRATION_ERROR
    }]
  ]);
  
  static getInfo(code: string): ErrorCodeInfo | undefined {
    return this.errorInfo.get(code);
  }
  
  static isRetryable(code: string): boolean {
    return this.errorInfo.get(code)?.retryable ?? false;
  }
  
  static getHttpStatus(code: string): number {
    return this.errorInfo.get(code)?.httpStatus ?? 500;
  }
}