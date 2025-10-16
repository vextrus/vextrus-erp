# Monorepo Best Practices

## Overview

This guide outlines best practices for working with the Vextrus ERP monorepo structure. Following these patterns ensures consistency, maintainability, and optimal developer experience across all packages and services.

## Architecture Principles

### 1. Clear Package Boundaries

Each package should have a single, well-defined responsibility:

```
shared/
├── kernel/      # Domain primitives only
├── contracts/   # Interfaces and DTOs only
├── utils/       # Pure utility functions only
```

### 2. Dependency Direction

Dependencies should flow in one direction:

```
apps → services → shared libraries
         ↓
    service-specific modules
```

Never create circular dependencies between packages.

### 3. Shared Code Philosophy

- **Share wisely**: Not everything needs to be shared
- **Domain first**: Shared code should represent domain concepts
- **Avoid premature abstraction**: Extract to shared only when genuinely reused

## Development Practices

### 1. Workspace Management

#### Using Workspace Protocol

Always use workspace protocol for internal dependencies:

```json
{
  "dependencies": {
    "@vextrus/kernel": "workspace:*",
    "@vextrus/contracts": "workspace:*"
  }
}
```

#### Installing Dependencies

```bash
# Install for specific workspace
npm install express --workspace=services/auth

# Install for shared library
npm install uuid --workspace=@vextrus/kernel

# Install root dependency
npm install -D turbo
```

### 2. TypeScript Configuration

#### Project References

Use TypeScript project references for proper build ordering:

```json
// services/auth/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "references": [
    { "path": "../../shared/kernel" },
    { "path": "../../shared/contracts" }
  ]
}
```

#### Path Mapping

Avoid path mapping for workspace packages - let npm resolution handle it:

```json
// ❌ Don't do this
{
  "paths": {
    "@vextrus/kernel": ["../../shared/kernel/src"]
  }
}

// ✅ Let npm workspace resolution work
// No path mapping needed for workspace packages
```

### 3. Build Pipeline

#### Turbo Configuration

Define clear task dependencies in `turbo.json`:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "dev": {
      "cache": false
    }
  }
}
```

#### Build Order

Ensure proper build order:

1. Shared libraries first
2. Services that depend on shared libraries
3. Applications that depend on services

```bash
# Turbo handles this automatically
turbo build
```

### 4. Testing Strategy

#### Unit Tests

Keep unit tests close to the code:

```
shared/kernel/
├── src/
│   ├── domain/
│   │   ├── entity.ts
│   │   └── entity.spec.ts  # Unit test
```

#### Integration Tests

Test package integration at service level:

```typescript
// services/auth/test/integration/shared-libs.spec.ts
import { AggregateRoot } from '@vextrus/kernel';

describe('Shared Library Integration', () => {
  it('should import kernel classes', () => {
    expect(AggregateRoot).toBeDefined();
  });
});
```

#### E2E Tests

Keep E2E tests in dedicated directory:

```
apps/web/
├── e2e/
│   ├── auth.e2e.spec.ts
│   └── user-flow.e2e.spec.ts
```

## Code Organization

### 1. Service Structure

Standard service structure:

```
services/[service-name]/
├── src/
│   ├── config/         # Configuration
│   ├── domain/         # Domain logic
│   ├── application/    # Use cases
│   ├── infrastructure/ # External integrations
│   ├── interfaces/     # Controllers, GraphQL
│   └── main.ts         # Entry point
├── test/
├── package.json
└── tsconfig.json
```

### 2. Shared Library Structure

Standard shared library structure:

```
shared/[library-name]/
├── src/
│   ├── index.ts        # Public API
│   └── [modules]/      # Internal modules
├── test/
├── package.json
└── tsconfig.json
```

### 3. Import/Export Patterns

#### Barrel Exports

Use index files for clean imports:

```typescript
// shared/kernel/src/index.ts
export * from './domain/aggregate-root';
export * from './domain/entity';
export * from './domain/value-object';

// Usage
import { Entity, ValueObject } from '@vextrus/kernel';
```

#### Named Exports Only

Prefer named exports over default exports:

```typescript
// ✅ Good
export class UserService { }
export const userConfig = { };

// ❌ Avoid
export default class UserService { }
```

## Version Management

### 1. Internal Packages

Use fixed versions for internal packages:

```json
{
  "name": "@vextrus/kernel",
  "version": "1.0.0"
}
```

### 2. External Dependencies

Pin exact versions in production:

```json
{
  "dependencies": {
    "express": "4.18.2",  // Exact version
    "@nestjs/common": "^10.0.0"  // Range for frameworks
  }
}
```

### 3. Dependency Updates

Update dependencies systematically:

```bash
# Check outdated packages
npm outdated

# Update specific workspace
npm update --workspace=services/auth

# Update all workspaces
npm update --workspaces
```

## Performance Optimization

### 1. Build Caching

Leverage Turbo's caching:

```bash
# Local caching (default)
turbo build

# Remote caching (requires setup)
turbo build --team --token=$TURBO_TOKEN
```

### 2. Selective Builds

Build only what changed:

```bash
# Build only affected by changes
turbo build --filter=...[HEAD^]

# Build specific service and dependencies
turbo build --filter=services/auth...
```

### 3. Development Mode

Use concurrent development servers:

```json
// package.json
{
  "scripts": {
    "dev": "turbo dev",
    "dev:auth": "turbo dev --filter=services/auth",
    "dev:shared": "turbo dev --filter=@vextrus/*"
  }
}
```

## CI/CD Integration

### 1. GitHub Actions

Optimize CI with caching:

```yaml
- name: Setup Turbo Cache
  uses: actions/cache@v3
  with:
    path: .turbo
    key: turbo-${{ github.sha }}
    restore-keys: turbo-

- name: Build
  run: turbo build --filter=...[origin/main]
```

### 2. Docker Builds

Use multi-stage builds:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN turbo build --filter=services/auth

# Runtime stage
FROM node:20-alpine
COPY --from=builder /app/services/auth/dist ./dist
CMD ["node", "dist/main.js"]
```

### 3. Deployment Strategy

Deploy services independently:

```bash
# Deploy only changed services
turbo deploy --filter=...[HEAD^] --env=production
```

## Common Patterns

### 1. Service Communication

Use contracts for type safety:

```typescript
// shared/contracts/src/user.contract.ts
export interface IUserCreatedEvent {
  userId: string;
  email: string;
  timestamp: Date;
}

// services/auth/src/events/user-created.ts
import { IUserCreatedEvent } from '@vextrus/contracts';

export class UserCreatedEvent implements IUserCreatedEvent {
  // Implementation
}
```

### 2. Configuration Management

Centralize configuration:

```typescript
// shared/config/src/database.config.ts
export interface IDatabaseConfig {
  host: string;
  port: number;
  // ...
}

// services/auth/src/config/database.ts
import { IDatabaseConfig } from '@vextrus/config';
```

### 3. Error Handling

Standardize error handling:

```typescript
// shared/contracts/src/errors.ts
export class DomainError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
  }
}

// Usage across services
import { DomainError } from '@vextrus/contracts';
```

## Troubleshooting

### Common Issues

1. **Workspace not found**
   ```bash
   npm install  # Reinstall to link workspaces
   ```

2. **TypeScript errors after changes**
   ```bash
   npm run build:ts  # Rebuild references
   ```

3. **Turbo cache issues**
   ```bash
   turbo build --force  # Skip cache
   ```

4. **Circular dependency detected**
   ```bash
   npm run check:circular  # Use dependency-cruiser
   ```

### Debug Commands

```bash
# List all workspaces
npm ls -ws

# Show workspace info
npm explain @vextrus/kernel

# Check TypeScript project references
tsc -b --listFiles

# Turbo task graph
turbo build --graph
```

## Checklist for New Services

When creating a new service:

- [ ] Use service template generator
- [ ] Add workspace to root package.json
- [ ] Configure TypeScript project references
- [ ] Add to Turbo pipeline
- [ ] Set up proper dependencies
- [ ] Create CLAUDE.md documentation
- [ ] Add health checks
- [ ] Configure environment variables
- [ ] Set up testing structure
- [ ] Update CI/CD configuration

## Anti-patterns to Avoid

### ❌ Don't

- Import from other services directly
- Create circular dependencies
- Mix domain logic with infrastructure
- Share database schemas between services
- Use relative imports across package boundaries
- Commit generated files (dist/, node_modules/)
- Hard-code environment-specific values

### ✅ Do

- Use shared contracts for communication
- Keep services loosely coupled
- Separate concerns clearly
- Use event-driven communication
- Import from package names
- Use .gitignore properly
- Use environment variables

## Further Reading

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [npm Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)