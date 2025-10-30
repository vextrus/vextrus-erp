# Shared Libraries Guide

## Overview

The Vextrus ERP monorepo provides three core shared libraries that enable domain-driven design and consistent patterns across all services:

- **@vextrus/kernel** - Core domain primitives and patterns
- **@vextrus/contracts** - Cross-service contracts and interfaces
- **@vextrus/utils** - Common utilities and helpers

## Package Structure

### @vextrus/kernel

Location: `shared/kernel/`

The kernel package provides fundamental building blocks for domain-driven design:

```typescript
// Import domain primitives
import { AggregateRoot, Entity, ValueObject } from '@vextrus/kernel';
import { Specification } from '@vextrus/kernel/patterns';
import { IRepository, IUnitOfWork } from '@vextrus/kernel/repositories';
```

**Key Components:**
- `AggregateRoot` - Base class for aggregates with event sourcing
- `Entity<TId>` - Base class for entities with identity
- `ValueObject<T>` - Base class for immutable value objects
- `UUID` - Value object for UUID handling
- `Specification<T>` - Implementation of specification pattern
- Repository interfaces for data access patterns

### @vextrus/contracts

Location: `shared/contracts/`

Shared contracts for cross-service communication:

```typescript
// Import auth contracts
import { IAuthUser, IAuthTokens } from '@vextrus/contracts/auth';

// Import event contracts
import { EventTypes, UserEvents } from '@vextrus/contracts/events';

// Import error contracts
import { ErrorCodes, DomainError } from '@vextrus/contracts/errors';
```

**Contract Categories:**
- Auth contracts - User DTOs, authentication interfaces
- Event contracts - Domain event types and schemas
- Error contracts - Standardized error codes and exceptions

### @vextrus/utils

Location: `shared/utils/`

Common utilities for the entire application:

```typescript
// Import utilities
import { formatCurrency, formatDate } from '@vextrus/utils';
import { toBengali, fromBengali } from '@vextrus/utils/bengali';
import { validators } from '@vextrus/utils/validation';
```

**Utility Categories:**
- Date/time formatting and manipulation
- Currency formatting (BDT support)
- Bengali language utilities
- Validation helpers
- Common constants

## Installation and Usage

### In a Service

Add shared libraries as dependencies in your service's `package.json`:

```json
{
  "dependencies": {
    "@vextrus/kernel": "workspace:*",
    "@vextrus/contracts": "workspace:*",
    "@vextrus/utils": "workspace:*"
  }
}
```

### Importing in Code

```typescript
// Domain example
import { AggregateRoot, Entity } from '@vextrus/kernel';
import { IAuthUser } from '@vextrus/contracts/auth';
import { formatCurrency } from '@vextrus/utils';

export class User extends AggregateRoot {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly role: string
  ) {
    super();
  }
}

export class Product extends Entity<string> {
  constructor(
    id: string,
    public readonly name: string,
    public readonly price: number
  ) {
    super(id);
  }

  getFormattedPrice(): string {
    return formatCurrency(this.price, 'BDT');
  }
}
```

## Building Shared Libraries

### Development Build

From the root of the monorepo:

```bash
# Build all shared libraries
npm run build:shared

# Build specific library
npm run build --workspace=@vextrus/kernel
```

### Watch Mode

For development with automatic rebuilds:

```bash
# Watch all shared libraries
npm run dev:shared

# Watch specific library
npm run dev --workspace=@vextrus/kernel
```

## TypeScript Configuration

Shared libraries use TypeScript project references for proper incremental compilation. Each library has its own `tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "composite": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.spec.ts", "**/*.test.ts"]
}
```

## Best Practices

### 1. Domain Isolation

Keep domain logic in the kernel, not in contracts:

```typescript
// ✅ Good: Domain logic in kernel
// In @vextrus/kernel
export abstract class ValueObject<T> {
  equals(other: ValueObject<T>): boolean {
    // Implementation
  }
}

// ❌ Bad: Domain logic in contracts
// In @vextrus/contracts
export class UserDTO {
  validate(): boolean {
    // Domain logic should be in kernel
  }
}
```

### 2. Contract Versioning

When updating contracts, maintain backward compatibility:

```typescript
// ✅ Good: Extending interface
export interface IAuthUserV2 extends IAuthUser {
  additionalField?: string;
}

// ❌ Bad: Breaking existing interface
export interface IAuthUser {
  // Removing or changing existing fields breaks consumers
}
```

### 3. Utility Organization

Group utilities by function, not by service:

```typescript
// ✅ Good: Grouped by function
// @vextrus/utils/date.ts
export const formatDate = () => {};
export const parseDate = () => {};

// ❌ Bad: Service-specific utilities
// @vextrus/utils/auth-utils.ts
export const authSpecificHelper = () => {};
```

### 4. Peer Dependencies

Declare framework dependencies as peer dependencies to avoid version conflicts:

```json
{
  "peerDependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/cqrs": "^10.0.0",
    "class-transformer": "^0.5.0",
    "class-validator": "^0.14.0"
  }
}
```

## Testing Shared Libraries

### Unit Tests

Each library includes unit tests:

```bash
# Run tests for all shared libraries
npm run test:shared

# Run tests for specific library
npm run test --workspace=@vextrus/kernel
```

### Integration Tests

Test library integration in a service:

```typescript
// services/auth/src/domain/user.spec.ts
import { AggregateRoot } from '@vextrus/kernel';
import { IAuthUser } from '@vextrus/contracts/auth';

describe('User Aggregate', () => {
  it('should extend AggregateRoot', () => {
    const user = new User('123', 'test@example.com');
    expect(user).toBeInstanceOf(AggregateRoot);
  });
});
```

## Migration Guide

### From Local Imports to Package Imports

Before:
```typescript
// Old: Direct file imports
import { AggregateRoot } from '../../../shared/kernel/domain/aggregate-root';
import { IAuthUser } from '../../../shared/contracts/auth.contracts';
```

After:
```typescript
// New: Package imports
import { AggregateRoot } from '@vextrus/kernel';
import { IAuthUser } from '@vextrus/contracts/auth';
```

### Updating Service tsconfig.json

Remove old path mappings:
```json
{
  "compilerOptions": {
    "paths": {
      // Remove these
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

The workspace packages are automatically resolved by npm/yarn.

## Troubleshooting

### Common Issues

1. **Import not found**
   - Ensure `npm install` has been run after adding dependencies
   - Check that the shared library is built (`npm run build:shared`)

2. **Type errors**
   - Rebuild TypeScript project references: `npm run build:ts`
   - Clear TypeScript cache: `rm -rf dist/ *.tsbuildinfo`

3. **Circular dependencies**
   - Use dependency cruiser: `npm run check:circular`
   - Move shared interfaces to contracts package

4. **Version mismatches**
   - Use workspace protocol: `"@vextrus/kernel": "workspace:*"`
   - Run `npm install` to sync versions

## Contributing

When adding new functionality to shared libraries:

1. Add to appropriate package (kernel for domain, contracts for interfaces, utils for helpers)
2. Export from package index file
3. Add unit tests
4. Update this documentation
5. Rebuild and test in consuming service
6. Create PR with clear description of additions

## Version Management

Shared libraries use fixed versioning (1.0.0) for internal packages. Version bumps occur only for major architectural changes and are coordinated across the entire monorepo.

For external publication (if ever needed), semantic versioning would be adopted with proper changelog management.