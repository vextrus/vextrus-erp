# Task: Resolve GraphQL Federation Dependency Injection Blocker

**Priority**: P0 - CRITICAL BLOCKER
**Status**: Completed
**Created**: 2025-10-07
**Completed**: 2025-10-07
**Service**: master-data
**Type**: Deep Investigation & Fix

## Problem Statement

The master-data service crashes on startup with a GraphQL Federation dependency injection error that has resisted 6 different solution attempts over 1+ hour:

```
Error: Nest can't resolve dependencies of the ApolloFederationDriver (?, ModulesContainer).
Please make sure that the argument GraphQLFederationFactory at index [0] is available in the GraphQLModule context.
```

**Critical Context**: All P1 DDD implementation code (value objects, aggregates, domain events, telemetry) is complete and compiles successfully. The ONLY blocker is GraphQL runtime initialization.

## Reference Documentation

**Comprehensive Investigation Report**: `.claude/state/checkpoint-2025-10-07-graphql-federation-blocker.md`

This checkpoint contains:
- Full error details and stack traces
- 6 attempted solutions with implementations
- Technical analysis of auth vs master-data comparison
- Timeline of investigation

## Previous Attempts Summary

### Failed Solutions (All 6)

1. **Sub-Module Approach** - Moved GraphQL to `graphql.module.ts` like auth service
2. **Root Module Approach** - Reverted to app.module.ts configuration
3. **Async Configuration** - Used `forRootAsync()` with factory pattern
4. **Package Updates** - Apollo v4.12.2, graphql v16.11.0
5. **Package Downgrade** - GraphQL v12 for NestJS v10 compatibility
6. **Version Matching** - Exact NestJS v10.4.20 versions matching auth service

**Result**: All failed with identical error - `GraphQLFederationFactory` cannot be resolved

## Deep Investigation Plan

### Phase 1: Root Cause Analysis (CRITICAL)

#### 1.1 Docker Package Resolution Analysis
**Hypothesis**: pnpm workspace hoisting in Docker may not properly resolve internal GraphQL providers

**Actions**:
- [ ] Compare `node_modules` structure between auth and master-data containers
- [ ] Check if `GraphQLFederationFactory` exists in `@nestjs/graphql/dist/federation` path
- [ ] Verify symlinks are correctly created in Docker environment
- [ ] Test with `shamefully-hoist=true` in .npmrc
- [ ] Try `node-linker=hoisted` instead of default

**Commands to run IN DOCKER**:
```bash
# Inside master-data container
docker exec -it vextrus-master-data sh

# Check if GraphQLFederationFactory exists
find /app -name "*federation*" | grep graphql

# Check package structure
ls -la /app/node_modules/.pnpm/@nestjs+graphql@*/node_modules/@nestjs/graphql/dist/

# Compare with auth
docker exec -it vextrus-auth sh
ls -la /app/node_modules/.pnpm/@nestjs+graphql@*/node_modules/@nestjs/graphql/dist/
```

#### 1.2 NestJS Module Initialization Order
**Hypothesis**: Some required provider isn't loaded before GraphQL

**Actions**:
- [ ] Add verbose logging to NestJS bootstrap
- [ ] Check module dependency graph
- [ ] Verify ConfigModule is loaded before GraphQLModule
- [ ] Test moving GraphQLModule to end of imports array

**Code to add**:
```typescript
// In main.ts
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  logger.verbose('Starting application...');
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose', 'debug', 'log', 'warn', 'error'],
  });

  logger.verbose('Application created successfully');
  // ... rest
}
```

#### 1.3 Internal GraphQL Provider Registration
**Hypothesis**: `GraphQLFederationFactory` isn't being registered by GraphQLModule

**Actions**:
- [ ] Examine `@nestjs/graphql` source code for provider registration
- [ ] Check if `ApolloFederationDriver` is importing factory correctly
- [ ] Verify `@nestjs/apollo` exports are correct
- [ ] Test with manual provider registration

**Investigation code**:
```typescript
// In app.module.ts - try explicit provider
import { GraphQLFederationFactory } from '@nestjs/graphql/dist/federation';

@Module({
  providers: [
    GraphQLFederationFactory, // Explicit registration
    // ... other providers
  ],
})
```

### Phase 2: Comparative Analysis

#### 2.1 Auth Service Deep Dive
**Actions**:
- [ ] Extract EXACT auth service GraphQL configuration
- [ ] Compare tsconfig.json settings
- [ ] Check for any custom decorators or providers
- [ ] Verify build output differences
- [ ] Compare Dockerfile build steps

#### 2.2 Package Manifest Comparison
**Actions**:
- [ ] Diff package.json between auth and master-data
- [ ] Check for hidden dependencies in lockfile
- [ ] Verify peerDependencies are satisfied
- [ ] Compare devDependencies that might affect build

### Phase 3: Alternative Approaches

#### 3.1 Code-First GraphQL (Alternative Driver)
**Hypothesis**: Issue is specific to ApolloFederationDriver

**Actions**:
- [ ] Try `ApolloDriver` instead of `ApolloFederationDriver` (no federation)
- [ ] Test if basic GraphQL works without federation
- [ ] If works, investigate federation-specific code

**Test configuration**:
```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver, // NOT ApolloFederationDriver
  autoSchemaFile: true,
})
```

#### 3.2 Mercurius Driver (Alternative Framework)
**Actions**:
- [ ] Try `@nestjs/mercurius` instead of `@nestjs/apollo`
- [ ] Test if GraphQL works with different driver
- [ ] Compare dependency injection behavior

#### 3.3 Manual GraphQL Setup
**Actions**:
- [ ] Bypass `@nestjs/graphql` module system
- [ ] Create GraphQL server manually in main.ts
- [ ] Use Apollo Server directly without NestJS wrapper

### Phase 4: Advanced Debugging

#### 4.1 Dynamic Module Analysis
**Actions**:
- [ ] Add breakpoints in NestJS core injector
- [ ] Use Node.js inspector in Docker
- [ ] Trace exact DI container state during initialization
- [ ] Check GraphQLModule's forRoot() dynamic module creation

**Debug command**:
```bash
# Enable Node.js inspector
docker-compose exec master-data node --inspect-brk=0.0.0.0:9229 dist/main.js
```

#### 4.2 Webpack/Build Output Analysis
**Actions**:
- [ ] Check if GraphQL decorators are preserved
- [ ] Verify metadata is not stripped during build
- [ ] Compare production vs development builds
- [ ] Test with `--skip-build` to use ts-node

#### 4.3 Minimal Reproduction
**Actions**:
- [ ] Create standalone NestJS project with ONLY GraphQL + TypeORM
- [ ] Test in Docker with same pnpm workspace setup
- [ ] If reproduces, report to @nestjs/graphql GitHub
- [ ] If doesn't reproduce, compare with master-data incrementally

### Phase 5: Nuclear Options

#### 5.1 Complete Package Reinstall
**Actions**:
- [ ] Delete all node_modules and lockfiles
- [ ] Clear pnpm store cache
- [ ] Reinstall from scratch
- [ ] Rebuild Docker without cache

```bash
# Complete clean
rm -rf node_modules services/*/node_modules pnpm-lock.yaml
pnpm store prune
pnpm install
docker-compose build --no-cache master-data
```

#### 5.2 Different Package Manager
**Actions**:
- [ ] Try npm instead of pnpm
- [ ] Test with yarn v3
- [ ] Compare dependency trees

#### 5.3 NestJS v11 Upgrade
**Last Resort** - Major breaking change
**Actions**:
- [ ] Upgrade all @nestjs packages to v11
- [ ] Fix breaking changes
- [ ] Test if GraphQL works in v11

## Success Criteria

- [x] master-data service starts without GraphQL errors
- [x] GraphQL endpoint responds to queries
- [x] Federation schema is correctly generated
- [x] API gateway can query master-data via GraphQL
- [x] All P1 DDD patterns remain functional
- [x] REST and GraphQL both work

## Acceptance Tests

```bash
# Service starts successfully
docker-compose up -d master-data
docker logs vextrus-master-data | grep "Nest application successfully started"

# GraphQL endpoint accessible
curl http://localhost:3002/graphql -d '{"query":"{__schema{types{name}}}"}'

# Federation schema exists
cat services/master-data/src/schema.gql | grep "directive @key"
```

## Rollback Plan

If all deep investigation fails:
1. Keep GraphQL disabled (current state)
2. Document findings for NestJS community
3. Use REST API only for master-data
4. Schedule GraphQL as future enhancement

## Estimated Effort

- **Phase 1-2**: 2-3 hours (deep analysis)
- **Phase 3**: 1-2 hours (alternatives)
- **Phase 4**: 2-4 hours (advanced debugging)
- **Phase 5**: 1 hour (nuclear options)

**Total**: 6-10 hours deep investigation

## Dependencies

- Docker environment access
- Node.js debugging tools
- Access to @nestjs/graphql source code
- Ability to modify infrastructure (pnpm, Dockerfile)

## Notes

- This is a **critical blocker** - allocate uninterrupted time
- Document every finding, even failed attempts
- Consider pair debugging session if stuck
- May need to engage @nestjs/graphql maintainers on GitHub

## Context Manifest

### Current State
- All P1 DDD code complete and compiling
- Service builds successfully in Docker
- Service crashes on startup due to GraphQL DI error
- 6 previous solution attempts documented in checkpoint

### Technical Environment
- NestJS v10.4.20
- @nestjs/graphql v13.1.0
- @nestjs/apollo v13.1.0
- Apollo Server v4.12.2
- GraphQL v16.11.0
- pnpm v8.15.0 in Docker
- node:20-alpine base image

### Working Reference
- auth service has identical GraphQL setup and works correctly
- Same package versions, same NestJS version
- Only difference: auth works, master-data doesn't

### Key Files
- `services/master-data/src/app.module.ts` - GraphQL configuration
- `services/master-data/src/main.ts` - Bootstrap with telemetry
- `.claude/state/checkpoint-2025-10-07-graphql-federation-blocker.md` - Full investigation history

## Work Log

### 2025-10-07

#### Completed
- Identified root causes of GraphQL Federation error after 9+ failed attempts in previous sessions
- Discovered missing Apollo packages: @apollo/subgraph and @apollo/federation
- Identified Docker cache as contributing factor
- Found configuration pattern issues in GraphQL module setup
- Upgraded NestJS from v10 to v11 for better Apollo compatibility
- Added missing packages: @apollo/subgraph@^2.11.2 and @apollo/federation@^0.38.1
- Switched GraphQL configuration from forRoot to forRootAsync pattern
- Implemented GraphQLFederationConfig interface properly
- Removed duplicate driver specification causing conflicts
- Executed full Docker rebuild with --no-cache flag
- Verified GraphQL Federation v2.3 compatibility
- Confirmed all 4 entities working: Customer, Vendor, Product, ChartOfAccount
- Tested REST and GraphQL endpoints successfully

#### Decisions
- Chose to upgrade NestJS to v11 instead of downgrading packages - better long-term solution
- Used forRootAsync pattern with GraphQLFederationConfig for better type safety
- Opted for full Docker rebuild with --no-cache to eliminate stale dependencies

#### Discovered
- The error persisted through 9+ attempts because of multiple compounding issues
- Docker cache was masking package installation changes
- Missing @apollo packages were critical dependencies not explicitly documented
- Configuration pattern mattered more than package versions alone
- NestJS v11 has better Apollo Federation v2 support

#### Next Steps
- Monitor service stability in production
- Document the resolution pattern for other services
- Consider adding automated tests for GraphQL Federation setup
- Update service documentation with new NestJS v11 requirements
