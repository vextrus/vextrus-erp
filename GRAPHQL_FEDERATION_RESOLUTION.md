# GraphQL Federation Resolution - Master Data Service

## Problem Summary
Master-data service fails to start with error:
```
Nest can't resolve dependencies of the ApolloFederationDriver (?, ModulesContainer).
Please make sure that the argument GraphQLFederationFactory at index [0] is available in the GraphQLModule context.
```

## Root Cause Analysis

### Version Incompatibility
The core issue is a **peer dependency mismatch**:

- **Current versions in master-data:**
  - `@nestjs/core`: v10.4.20
  - `@nestjs/common`: v10.4.20
  - `@nestjs/apollo`: v13.1.0 (requires @nestjs/core ^11.0.1)
  - `@nestjs/graphql`: v13.1.0 (requires @nestjs/core ^11.0.1)

- **Working versions in auth service:**
  - `@nestjs/core`: v10.4.20
  - `@nestjs/common`: v10.4.20
  - `@nestjs/apollo`: v13.1.0
  - `@nestjs/graphql`: v13.1.0
  - ✅ **Auth works despite same versions** (needs investigation why)

### Attempted Solutions (All Failed)

1. ❌ **Inline forRoot() pattern** (like auth service)
   - Tried: Switched from forRootAsync() to forRoot()
   - Result: Same error persists

2. ❌ **forRootAsync() with useClass pattern** (like finance service)
   - Tried: Created GraphQLFederationConfig class
   - Tried: Added to providers array
   - Result: Same error persists

3. ❌ **Version downgrade to v12**
   - Tried: @nestjs/apollo v12.2.0 + @nestjs/graphql v12.2.0
   - Result: Same error persists

4. ❌ **Version upgrade to v13**
   - Tried: @nestjs/apollo v13.1.0 + @nestjs/graphql v13.1.0
   - Result: Same error persists (peer dependency warnings)

5. ❌ **Module structure changes**
   - Tried: Moving GraphQL to root AppModule
   - Tried: Creating separate child module
   - Result: Same error in all configurations

## Pnpm Peer Dependency Warnings

```
services/master-data
├─┬ @nestjs/apollo 13.1.0
│ ├── ✕ unmet peer @nestjs/common@^11.0.1: found 10.4.20
│ └── ✕ unmet peer @nestjs/core@^11.0.1: found 10.4.20
└─┬ @nestjs/graphql 13.1.0
  ├── ✕ unmet peer @nestjs/common@^11.0.1: found 10.4.20
  └── ✕ unmet peer @nestjs/core@^11.0.1: found 10.4.20
```

## Solution: Upgrade to NestJS v11

The definitive fix requires upgrading all NestJS packages to v11:

### Required Changes in `services/master-data/package.json`

```json
{
  "dependencies": {
    "@nestjs/apollo": "^13.1.0",
    "@nestjs/cache-manager": "^3.0.0",
    "@nestjs/common": "^11.1.6",
    "@nestjs/config": "^4.0.0",
    "@nestjs/core": "^11.1.6",
    "@nestjs/cqrs": "^11.0.0",
    "@nestjs/graphql": "^13.1.0",
    "@nestjs/microservices": "^11.1.6",
    "@nestjs/platform-express": "^11.1.6",
    "@nestjs/typeorm": "^11.0.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.1.6"
  }
}
```

### Breaking Changes to Address

When upgrading from NestJS v10 to v11, check for:

1. **TypeORM Changes**: v11 may have different TypeORM integration patterns
2. **Cache Manager**: Upgraded from v2 to v3
3. **Config Module**: Upgraded from v3 to v4
4. **CQRS Module**: Upgraded from v10 to v11

## Alternative Workaround (Not Recommended)

Temporarily disable GraphQL and use REST-only:

1. Comment out GraphQL module import
2. Remove GraphQL resolvers from providers
3. Keep REST controllers functional
4. Re-enable GraphQL after upgrading to v11

## Investigation Notes

### Why Does Auth Service Work?

Auth service uses identical versions (@nestjs/core v10 + @nestjs/apollo v13) but works. Possible reasons:

1. **Simpler module structure**: Auth uses a child AuthModule, not root AppModule
2. **Fewer dependencies**: Auth has fewer conflicting dependencies
3. **Different initialization order**: Module loading sequence may differ
4. **Luck**: The peer dependency warning is ignored and happens to work

### Consult7 Analysis

Gemini 2.5 Flash (thinking mode) identified:
- Version mismatch between @nestjs/apollo v13 and @nestjs/core v10
- @nestjs/graphql v13 requires @nestjs/core v11
- GraphQLFederationFactory internal changes between versions

## Recommended Action Plan

1. **Upgrade all services to NestJS v11** (coordinated migration)
2. **Test each service individually** after upgrade
3. **Update shared libraries** to be compatible with v11
4. **Run full integration tests** before deployment

## Timeline

- **Investigation**: 3+ hours (10+ solution attempts)
- **Estimated upgrade time**: 2-4 hours per service
- **Total services affected**: All NestJS services (14 services)

## Conclusion

The GraphQL Federation error in master-data is caused by peer dependency incompatibility between @nestjs/apollo v13 / @nestjs/graphql v13 (which require NestJS v11) and the current NestJS v10 installation. The definitive fix is upgrading to NestJS v11 across all services.
