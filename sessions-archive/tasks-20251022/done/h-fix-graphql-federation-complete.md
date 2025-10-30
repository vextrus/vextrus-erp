# Task: Fix GraphQL Federation Complete

## Metadata
- **Task**: h-fix-graphql-federation-complete
- **Branch**: fix/graphql-federation-complete
- **Status**: completed
- **Created**: 2025-09-22
- **Modules**: [workflow, master-data, rules-engine, api-gateway]
- **Complexity**: 45 points

## Context Summary

The GraphQL federation setup is incomplete, preventing the API Gateway from composing the supergraph. Context7 analysis identified specific issues:

1. **Workflow Service**: Dockerfile doesn't start HTTP server (only Temporal worker)
2. **Master-data/Rules-engine**: Entities missing @Key federation decorator
3. **Federation Configuration**: Services need proper Apollo Federation v2 setup

## Success Criteria
- [x] Fix workflow-service.Dockerfile to start NestJS HTTP server
- [x] Add @Key decorators to all entities in master-data service
- [x] Add @Key decorators to all entities in rules-engine service
- [x] Verify workflow service responds on port 3011
- [x] Verify all services expose federation _service SDL query
- [x] API Gateway successfully composes supergraph from all services
- [x] GraphQL Playground at http://localhost:4000/graphql shows all federated types
- [x] Remove SKIP_SERVICES environment variable completely

## Technical Approach

### 1. Fix Workflow Service Dockerfile
**Issue**: `workflow-service.Dockerfile` likely only starts Temporal worker, not the NestJS app
**Fix**: Ensure CMD runs `node dist/main.js` which starts both HTTP server and worker

### 2. Add Federation Keys to Entities
**Pattern Required**:
```typescript
import { ObjectType, Field, ID, Key } from '@nestjs/graphql';

@ObjectType()
@Key({ fields: 'id' })  // <-- This is missing
export class Customer {
  @Field(() => ID)
  id: string;
  // ...
}
```

### 3. Services Needing Entity Updates
- **master-data**: Customer, Vendor, Product, Account entities
- **rules-engine**: Rule entity
- **workflow**: Already has @Directive decorator in DTOs but entities may need @Key

### 4. Verification Steps
1. Each service exposes `_service { sdl }` query
2. API Gateway can introspect all subgraphs
3. Federation composition succeeds
4. All types available in unified schema

## Implementation Steps

1. **Fix Workflow Dockerfile**
   - Check `infrastructure/docker/services/workflow-service.Dockerfile`
   - Update CMD to run main.js
   - Rebuild and test service

2. **Update Entity Decorators**
   - Add @Key to all entity classes
   - Import Key from @nestjs/graphql
   - Ensure entities extend correct base classes

3. **Rebuild Services**
   - `pnpm run build` in each service
   - Restart Docker containers
   - Verify federation endpoints

4. **Test Federation**
   - Query each service's `_service { sdl }`
   - Restart API Gateway
   - Test unified GraphQL endpoint

## Work Log

### 2025-09-24

#### Completed
- **Workflow Service Fix**: Updated workflow service to start both NestJS HTTP server and Temporal worker properly
- **Authentication Guards Resolution**: Discovered and fixed authentication guards blocking federation introspection queries
- **Entity ID Field Exposure**: Fixed all entities in master-data service to expose ID field with @Field(() => ID) decorator for federation @key directive
- **Network Binding Fix**: Fixed services to bind to 0.0.0.0 instead of localhost for container networking
- **Environment Cleanup**: Removed SKIP_SERVICES environment variable from docker-compose.yml
- **Federation Testing**: Successfully verified API Gateway supergraph composition
- **Documentation**: Created comprehensive GraphQL federation troubleshooting guide

#### Decisions
- Used method-level authentication guards instead of class-level to allow federation queries
- Explicitly added @Field(() => ID) decorator to entities rather than relying on BaseEntity inheritance
- Configured services to bind to all network interfaces for Docker container communication

#### Discovered
- Authentication guards at class level were blocking federation's _service query
- GraphQL schema wasn't recognizing inherited ID field from BaseEntity without explicit decorator
- Services bound to localhost were unreachable from API Gateway container
- Federation requires unauthenticated access to _service and _entities queries

#### Validated
- All services now expose _service SDL query correctly
- API Gateway successfully composes supergraph from all federated services
- GraphQL schema includes types from auth, master-data, workflow, and rules-engine services
- Federation is working end-to-end with proper type composition

## Notes
- Auth service (3001) already works with federation - use as reference
- Services use ApolloFederationDriver but need complete federation setup
- Reference resolvers added but ineffective without @Key decorators
- Workflow service has unique Dockerfile that needs investigation

### Discovered During Implementation
Date: 2025-09-24 / Session: h-fix-graphql-federation-complete

During implementation, we discovered several critical architectural patterns that weren't documented in the original context. These discoveries reveal fundamental issues with how GraphQL Federation interacts with authentication and networking in our microservices architecture.

The primary issue was that **class-level authentication guards block federation introspection queries**. When a resolver class is decorated with `@UseGuards(JwtAuthGuard)`, it applies to ALL queries and mutations in that class, including the special federation queries `_service` and `_entities`. The Apollo Gateway requires unauthenticated access to these queries to compose the supergraph, but the authentication guard intercepts and rejects these requests, causing the federation to fail with "400: Bad Request" errors.

Additionally, we discovered that **entity ID fields must be explicitly exposed** for federation @key directives to work. Even when entities extend BaseEntity (which includes an ID field), the GraphQL schema doesn't recognize inherited fields unless they have an explicit `@Field(() => ID)` decorator. This prevents the federation @key directive from functioning properly.

Finally, **services in Docker containers must bind to 0.0.0.0** not localhost for inter-container networking. When services listen only on localhost, they become unreachable from other containers in the Docker network, causing the API Gateway to fail when trying to introspect subgraph services.

#### Updated Technical Details
- **Authentication Pattern**: Apply `@UseGuards(JwtAuthGuard)` to individual queries/mutations, never at class level for federated resolvers
- **Entity Field Exposure**: Always use explicit `@Field(() => ID) id: string` in federated entities, regardless of inheritance
- **Network Binding**: Use `app.listen(port, '0.0.0.0')` in main.ts for all containerized services
- **Federation Queries**: The `_service` and `_entities` queries must remain public/unauthenticated for Apollo Gateway to function
- **Global API Prefixes**: GraphQL endpoints must be excluded from global API prefixes to maintain federation compatibility

#### Architectural Implications
This discovery highlights a fundamental tension between security and federation in our architecture. Federation requires certain endpoints to be publicly accessible, which conflicts with our desire to protect all endpoints with authentication. Future federated services must carefully balance these requirements by:

1. Using method-level guards instead of class-level guards
2. Documenting which endpoints must remain public for federation
3. Ensuring network accessibility between containerized services
4. Testing federation introspection as part of the deployment process