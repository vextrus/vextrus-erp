---
task: h-package-shared-libraries
branch: feature/package-shared-libraries
status: completed
created: 2025-09-06
modules: [shared/kernel, shared/contracts, shared/utils, services/auth, services/organization]
---

# Package and Configure Shared Libraries for Monorepo

## Problem/Goal
The shared domain primitives and contracts have been created but are not properly packaged as consumable npm packages within the monorepo. This is blocking other services from importing `@vextrus/kernel`, `@vextrus/contracts`, and `@vextrus/utils`, preventing Phase 1 development from proceeding. We need to properly configure these as internal packages with correct TypeScript configurations, exports, and monorepo integration.

## Success Criteria
- [x] Create package.json for each shared library with proper naming and exports
- [x] Configure TypeScript build for each shared library  
- [x] Update root workspace configuration to recognize shared packages
- [x] Fix import paths in auth service to use @vextrus/* packages
- [x] Verify turbo build works across entire monorepo
- [x] Create basic unit tests for shared library exports
- [x] Update service template generator to use packaged libraries
- [x] Document usage patterns for shared libraries
- [x] Ensure all shared libraries are version 1.0.0 and ready for consumption

## Context Manifest

### How the Current Monorepo System Works

The Vextrus ERP monorepo currently operates as a Yarn/npm workspaces-based system with a specific structure that includes shared libraries, but these shared libraries are not properly packaged as consumable npm modules. Here's how the current system functions and what needs to change:

**Current Workspace Structure:**
The root `package.json` defines workspaces as `["apps/*", "services/*", "shared/*"]` indicating that the monorepo expects shared packages to be consumable workspace packages. However, the shared directories currently lack proper package.json files and build configurations, making them unusable as importable packages.

**Shared Library Architecture - What Exists:**
Three critical shared libraries have been architected following Domain-Driven Design principles:

1. **@vextrus/kernel** (`shared/kernel/domain/`): Contains core domain primitives that all services depend on:
   - `AggregateRoot` class extending NestJS CQRS AggregateRoot with domain event management, versioning, and event sourcing capabilities
   - `Entity<TId>` abstract class with identity, timestamp tracking, and equality comparison
   - `ValueObject<T>` abstract class with immutable properties and structural equality, plus a `UUID` value object implementation
   - `Specification<T>` abstract class implementing the Specification pattern with composable boolean logic (AND, OR, NOT)
   - `IDomainEvent` interface defining the contract for domain events with aggregate tracking
   - Repository interfaces: `IRepository<T>`, `IEventStoreRepository`, and `IUnitOfWork` for data access patterns

2. **@vextrus/contracts** (`shared/contracts/`): Contains cross-service contract definitions:
   - Auth contracts (`auth.contracts.ts`): User DTOs, authentication interfaces, token structures
   - Event contracts (`event.contracts.ts`): Comprehensive event type enumeration covering User, Organization, Project, Finance, HR, and SCM domains
   - Error contracts (`error.contracts.ts`): Standardized error codes, error response interfaces, and domain exception classes

3. **@vextrus/utils** (`shared/utils/`): Currently contains only a project name constant but is intended for utility functions like Bengali localization, currency formatting, and date/time helpers.

**Current Import Problems:**
The auth service demonstrates the current broken import patterns. In `services/auth/src/modules/health/health.module.ts`, we see imports like `import { SharedModule } from '@shared/shared.module';` which reference the auth service's own internal shared module, NOT the monorepo-level shared libraries. The tsconfig path mapping in auth service maps `"@shared/*": ["src/shared/*"]` to local directories, not the monorepo shared packages.

**Service Template Generator Impact:**
The `services/service-template/generate-service.js` creates new services with the import `import { AggregateRoot } from '@shared/kernel/domain';` (line 286), expecting the shared kernel to be available as a package, but this currently fails because the kernel isn't packaged.

**Build System Requirements:**
The system uses TypeScript with strict configuration (`tsconfig.base.json`) including `"verbatimModuleSyntax": true` which requires explicit import/export syntax. The base config defines path mappings like `"@shared/*": ["shared/*"]` but these currently point to source directories, not built packages.

### For New Package Implementation: What Needs to Connect

**Package Configuration Strategy:**
Each shared library needs a complete package.json with proper `main`, `module`, `types`, and `exports` fields. The packages must be configured as internal workspace dependencies that can be imported using `@vextrus/kernel`, `@vextrus/contracts`, and `@vextrus/utils` package names.

**TypeScript Build Integration:**
Each package needs its own `tsconfig.json` extending the base config but configured for library building with declaration file generation. The build must produce CommonJS modules for Node.js compatibility while maintaining type definitions.

**Monorepo Path Resolution:**
The root `tsconfig.base.json` paths need updating from source directory mapping (`"@shared/*": ["shared/*"]`) to package-based mapping (`"@vextrus/*": ["shared/*/src", "node_modules/@vextrus/*/dist"]`). Services' tsconfig files need similar updates.

**Auth Service Migration Requirements:**
The auth service currently imports from local shared modules but needs migration to use the packaged shared libraries. This involves updating imports in health indicators, auth service, and module definitions. The service's internal shared modules (Redis, Kafka services) are separate from the domain shared libraries and should remain as service-specific shared modules.

**Service Template Integration:**
The template generator already expects `@shared/kernel/domain` imports but needs updating to use the proper `@vextrus/kernel` package name and ensure generated services have correct dependencies in their package.json.

**Build Pipeline Integration:**
Since the system currently lacks turbo.json, build orchestration needs implementation. Shared packages must build before consuming services, and the build system needs to handle TypeScript project references for incremental compilation.

### Technical Reference Details

#### Required Package.json Configurations

**@vextrus/kernel:**
```json
{
  "name": "@vextrus/kernel",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./domain": {
      "import": "./dist/domain/index.mjs", 
      "require": "./dist/domain/index.js",
      "types": "./dist/domain/index.d.ts"
    }
  }
}
```

#### Current Service Dependencies
Auth service package.json shows dependencies that shared libraries will need as peer dependencies:
- `@nestjs/cqrs: ^10.2.7` (for AggregateRoot)
- `class-transformer: ^0.5.1` (for DTOs)
- `class-validator: ^0.14.1` (for validation)
- `typeorm: ^0.3.20` (for repository patterns)

#### Import Path Transformations Required
- Current: `import { SharedModule } from '@shared/shared.module'` → Keep (service-internal)
- Current: `import { AggregateRoot } from '@shared/kernel/domain'` → `import { AggregateRoot } from '@vextrus/kernel'`
- New pattern: `import { IAuthUser, IAuthTokens } from '@vextrus/contracts/auth'`
- New pattern: `import { ErrorCodes, DomainError } from '@vextrus/contracts/errors'`

#### Build Configuration Requirements
- Each package needs TypeScript project references for incremental compilation
- Declaration maps for source mapping in development
- Turbo pipeline with proper dependency ordering: shared libs → services
- Path mapping updates in consuming service tsconfig files

#### File Locations for Implementation
- Package manifests: `shared/kernel/package.json`, `shared/contracts/package.json`, `shared/utils/package.json`
- Build configs: `shared/kernel/tsconfig.json`, etc.
- Entry points: `shared/kernel/src/index.ts` (barrel exports)
- Service migrations: `services/auth/package.json` (add dependencies), `services/auth/tsconfig.json` (update paths)
- Template updates: `services/service-template/generate-service.js` (lines 286, 120-121)

## Technical Requirements

### Package Structure
```
@vextrus/kernel (shared/kernel)
- Domain primitives: AggregateRoot, Entity, ValueObject
- Patterns: Specification, Repository, UnitOfWork
- Events: DomainEvent interfaces

@vextrus/contracts (shared/contracts)
- Auth contracts: User DTOs, Auth interfaces
- Event contracts: Event types, Event schemas
- Error contracts: Error codes, Domain exceptions

@vextrus/utils (shared/utils)  
- Date/time helpers
- Currency formatting
- Bengali utilities
- Validation helpers
```

### Configuration Requirements
- Each package needs proper main, module, types fields
- TypeScript compilation with declaration files
- Proper peer dependencies (NestJS, class-validator, etc.)
- Build scripts integrated with turbo
- Correct path mapping in tsconfig

### Integration Points
- Auth service must import from @vextrus packages
- Service template must generate imports correctly
- Future services depend on these packages

## User Notes
<!-- Rizvi's requirements -->
- This is critical path - blocking all service development
- Keep it simple but maintainable
- Follow npm best practices for internal packages
- Ensure Bengali support utilities are properly exported
- Make sure build process is fast for development

## Implementation Steps

1. **Package Configuration**
   - Create package.json for kernel with exports
   - Create package.json for contracts with exports  
   - Create package.json for utils with exports
   - Add build scripts and TypeScript configs

2. **Monorepo Integration**
   - Update root package.json workspaces
   - Configure turbo pipeline for shared libs
   - Set up TypeScript project references
   - Test workspace resolution

3. **Auth Service Migration**
   - Update imports to use @vextrus packages
   - Fix any circular dependency issues
   - Verify auth service still builds
   - Run auth service tests

4. **Template Updates**
   - Update service generator template
   - Test generating a new service
   - Verify new service can import shared libs

5. **Documentation**
   - Create README for each package
   - Document common usage patterns
   - Add examples to CLAUDE.md files

## Work Log
<!-- Updated as work progresses -->
- [2025-09-06] Task created based on comprehensive system analysis showing shared libraries as critical blocker for Phase 1
- [2025-09-06] Created package.json files for all three shared libraries (@vextrus/kernel, @vextrus/contracts, @vextrus/utils)
- [2025-09-06] Configured TypeScript build configurations with project references for incremental compilation
- [2025-09-06] Set up barrel exports (index.ts) for each shared library to expose public APIs
- [2025-09-06] Updated root workspace configuration to recognize shared packages
- [2025-09-06] Created turbo.json with optimized build pipeline for monorepo
- [2025-09-06] Fixed auth service imports to use @vextrus/* packages instead of relative paths
- [2025-09-06] Added comprehensive unit tests for all shared library exports
- [2025-09-06] Updated service template generator to use @vextrus/* package imports
- [2025-09-06] Created extensive documentation:
  - docs/guides/shared-libraries.md - Complete usage guide for shared libraries
  - docs/guides/monorepo-best-practices.md - Best practices for monorepo development
  - docs/guides/turbo-pipeline.md - Turbo build pipeline configuration and usage
  - docs/guides/mcp-servers.md - MCP server configuration and usage guide
  - services/service-template/README.md - Service template generator documentation
  - Updated docs/DEVELOPMENT_WORKFLOW.md with shared library information
  - Updated root README.md with monorepo structure and shared library details
- [2025-09-06] All success criteria met - shared libraries are now properly packaged and ready for consumption
- [2025-09-08] Implemented professional package publishing infrastructure:
  - Configured Verdaccio private NPM registry in Docker
  - Set up Changesets for version management with fixed versioning
  - Configured tsup bundling for all packages with dual ESM/CJS output
  - Modernized package.json files with exports field and publishConfig
  - Created GitHub Actions workflow for automated releases
  - Set up TypeDoc for API documentation generation
  - Created comprehensive documentation at docs/PACKAGE_PUBLISHING.md
- [2025-09-08] Task completed - All shared libraries have professional publishing infrastructure
