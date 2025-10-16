# Shared Contracts CLAUDE.md

## Purpose
Defines standardized interfaces, error codes, and event types for consistent inter-service communication across the Vextrus ERP ecosystem.

## Architecture Overview
The Shared Contracts module establishes the communication protocols between microservices, ensuring type safety and consistency across service boundaries. It provides authentication contracts for user management, standardized error handling with specific error codes, and comprehensive event definitions for event-driven architecture. This module serves as the single source of truth for all cross-service interactions.

## Module Structure
- `auth/` - Authentication service contracts
  - `auth.contracts.ts` - User, token, and authentication interfaces
- `errors/` - Standardized error handling
  - `error.contracts.ts` - Error codes, exceptions, and response formats
- `events/` - Event-driven architecture contracts
  - `event.contracts.ts` - Event types and payload structures

## Key Components
### Authentication Contracts (auth/auth.contracts.ts)
- `IAuthUser:1-9` - User representation across services
- `IAuthTokens:11-15` - JWT and refresh token structure
- `ILoginRequest:17-20` - Login payload interface
- `IRegisterRequest:22-31` - User registration with organization assignment
- `IAuthResponse:37-40` - Complete authentication response

### Error Contracts (errors/error.contracts.ts)
- `ErrorCodes:1-26` - Standardized error code enumeration
  - Authentication errors: AUTH001-005 (credentials, tokens, permissions)
  - Validation errors: VAL001-004 (input validation, format)
  - Business logic errors: BUS001-004 (entities, rules)
  - System errors: SYS001-004 (internal, database, external)
- `IErrorResponse:28-35` - Standard error response format with correlation
- `DomainError:37-46` - Base domain exception class
- Specific errors: ValidationError, BusinessRuleError, EntityNotFoundError

### Event Contracts (events/event.contracts.ts)
- `EventTypes:1-39` - Comprehensive event type enumeration
  - User events: registration, login, profile updates, account management
  - Organization events: creation, updates, deletion
  - Project events: lifecycle management
  - Finance events: invoicing, payments, expenses
  - HR events: employee lifecycle, leave management
  - SCM events: material ordering, inventory updates
- `IEventPayload:41-55` - Standard event structure with metadata

## Integration Points
### Used By
- services/auth: User authentication and registration interfaces
- All services: Error handling and event publishing
- Frontend applications: API response type definitions
- Message brokers: Event payload structure for Kafka

### Provides
- Type-safe service communication interfaces
- Consistent error handling across all services
- Event-driven architecture foundation
- API contract definitions for OpenAPI/Swagger

## Error Handling Strategy
Standardized error codes enable:
- Consistent error responses across services
- Frontend localization of error messages
- Monitoring and alerting based on error categories
- Debugging with correlation IDs and structured details

## Event-Driven Architecture
Event contracts support:
- Domain event publishing from aggregates
- Cross-service event consumption
- Event sourcing with versioning
- Audit trails with correlation and causation tracking
- Metadata capture for security and debugging

## Usage Patterns
```typescript
// Service implementations import contracts
import { IAuthUser, IAuthResponse } from '@shared/contracts/auth'
import { ErrorCodes, DomainError } from '@shared/contracts/errors'
import { EventTypes, IEventPayload } from '@shared/contracts/events'
```

## Testing
- Contract tests verify interface compatibility
- Error handling tests ensure consistent behavior
- Event schema validation for message integrity
- Integration tests validate cross-service communication

## Patterns & Conventions
- Interface-first design for service contracts
- Hierarchical error code organization by domain
- Event naming following domain.action pattern
- Metadata standardization for observability
- Version compatibility through interface evolution

## Related Documentation
- ../../services/auth/CLAUDE.md - Authentication contract usage
- ../kernel/CLAUDE.md - Domain primitives and event interfaces
- ../../docs/adr/ - Service communication architectural decisions
- ../../services/service-template/CLAUDE.md - Contract integration in templates