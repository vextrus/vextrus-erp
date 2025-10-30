// Export all contracts
export * from './auth/auth.contracts';
export * from './events/event.contracts';

// Export from error.contracts EXCEPT ValidationError to avoid conflicts
export {
  ErrorCodes,
  IErrorResponse,
  DomainError,
  BusinessRuleError,
  EntityNotFoundError
} from './errors/error.contracts';

// Export ValidationError class with a specific name to avoid conflicts
export { ValidationError as ValidationErrorClass } from './errors/error.contracts';

// Export new enterprise contracts
export * from './integration';
export * from './events/domain-event.interface';
export * from './events/integration-event.interface';
export * from './events/event-standards';

// Export all from API except ValidationError
export {
  ApiRequest,
  RequestMetadata,
  ApiResponse,
  ResponseMetadata,
  ApiError,
  DeprecationInfo,
  ApiResponseBuilder
} from './api/request-response.dto';
export * from './api/pagination.dto';
export * from './api/api-versioning.interface';

// Export ValidationError interface from API with a different name
export type { ValidationError as ApiValidationError } from './api/request-response.dto';

// Export new error types from business-exception (excluding ValidationError to avoid conflict)
export { 
  BusinessException,
  ValidationException,
  IntegrationException,
  AuthorizationException,
  AuthenticationException,
  ResourceNotFoundException,
  ConflictException,
  RateLimitException
} from './errors/business-exception';

// Export ValidationError interface from business-exception with a different name
export type { ValidationError as ValidationErrorDetail } from './errors/business-exception';

// Export error codes and registry
export { ErrorCode, ErrorCategory, ErrorCodeRegistry } from './errors/error-codes';
export type { ErrorCodeInfo } from './errors/error-codes';