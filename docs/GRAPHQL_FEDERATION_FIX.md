# GraphQL Federation Issue Resolution

## Problem Summary
The API Gateway was unable to compose the federation supergraph from microservices, resulting in "400: Bad Request" errors when attempting to introspect subgraph schemas.

## Root Causes Identified

### 1. Authentication Guards Blocking Federation
**Issue**: Class-level `@UseGuards(JwtAuthGuard)` decorators on GraphQL resolvers were blocking the federation introspection queries.

**Why it happened**: Federation requires unauthenticated access to the `_service { sdl }` query for schema introspection, but class-level guards were protecting ALL queries including federation-specific ones.

**Fix**: Move authentication guards from class-level to individual method-level decorators, excluding federation methods.

```typescript
// WRONG - Blocks federation
@Resolver(() => Customer)
@UseGuards(JwtAuthGuard)  // This blocks _service query
export class CustomerResolver {
  // methods...
}

// CORRECT - Allows federation
@Resolver(() => Customer)
export class CustomerResolver {
  @Query(() => Customer)
  @UseGuards(JwtAuthGuard)  // Only protect individual methods
  async findOne() { /* ... */ }
}
```

### 2. Missing ID Field in GraphQL Schema
**Issue**: The `@key(fields: "id")` directive referenced an `id` field that wasn't exposed in the GraphQL schema.

**Why it happened**: The `id` field was defined in `BaseEntity` without the `@Field()` decorator, making it invisible to GraphQL despite being present in TypeORM.

**Fix**: Add `@Field(() => ID)` decorator to expose the ID field in GraphQL schema.

```typescript
// In BaseEntity
export abstract class BaseEntity {
  @Field(() => ID)  // Add this decorator
  @PrimaryGeneratedColumn('uuid')
  id: string;
}

// OR in each entity if BaseEntity can't be modified
export class Customer extends BaseEntity {
  @Field(() => ID)  // Explicitly add ID field
  id: string;
}
```

### 3. Network Interface Binding
**Issue**: Services were binding to `localhost` instead of `0.0.0.0`, making them unreachable from other containers.

**Why it happened**: NestJS defaults to localhost binding, which only allows local connections.

**Fix**: Explicitly bind to all interfaces in the service startup.

```typescript
// main.ts
const port = configService.get<number>('app.port') || 3002;
await app.listen(port, '0.0.0.0');  // Add '0.0.0.0' parameter
```

### 4. Global Prefix Affecting GraphQL Endpoint
**Issue**: The global prefix `api/v1` was being applied to the GraphQL endpoint.

**Why it happened**: Global prefix was applied without excluding the GraphQL route.

**Fix**: Exclude GraphQL from global prefix.

```typescript
app.setGlobalPrefix('api/v1', {
  exclude: ['graphql'],  // Exclude GraphQL endpoint
});
```

## Prevention Workflow

### 1. Service Template Standards
When creating new services, ensure the service template includes:
- Proper federation setup with `@key` directives
- ID field exposed with `@Field(() => ID)` decorator
- Method-level authentication guards (not class-level)
- Network binding to `0.0.0.0`
- GraphQL endpoint exclusion from global prefix

### 2. Federation Checklist
Before deploying a new federated service:
- [ ] Verify `_service { sdl }` query works without authentication
- [ ] Check that all `@key` fields are exposed in GraphQL schema
- [ ] Test service is reachable from API Gateway container
- [ ] Ensure `@ResolveReference()` method exists for entity resolution
- [ ] Verify no class-level guards on resolvers

### 3. Testing Protocol
```bash
# 1. Test individual service federation
curl -X POST http://localhost:SERVICE_PORT/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ _service { sdl } }"}'

# 2. Test from within Docker network
docker exec api-gateway-container ping service-name
docker exec api-gateway-container wget -qO- http://service-name:PORT/graphql

# 3. Test API Gateway composition
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name } } }"}'
```

### 4. Development Guidelines

#### DO:
- Use method-level authentication guards for protected operations
- Expose all federated entity ID fields in GraphQL schema
- Test federation queries during development
- Bind services to `0.0.0.0` for container networking
- Keep federation-specific queries (`_service`, `_entities`) unprotected

#### DON'T:
- Apply class-level guards on GraphQL resolvers
- Forget to add `@Field()` decorator on key fields
- Use `localhost` or `127.0.0.1` binding in containerized services
- Include GraphQL endpoint in global API prefix

## Monitoring Federation Health

Add health checks to verify federation:
```typescript
// In API Gateway
@Get('/health/federation')
async checkFederation() {
  const services = ['auth', 'master-data', 'workflow', 'rules-engine'];
  const results = await Promise.all(
    services.map(async (service) => {
      try {
        const response = await fetch(`http://${service}:PORT/graphql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: '{ _service { sdl } }' }),
        });
        return { service, status: response.ok ? 'healthy' : 'unhealthy' };
      } catch (error) {
        return { service, status: 'unreachable' };
      }
    })
  );
  return { federation: results };
}
```

## Quick Troubleshooting

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| "Cannot query field _service" | Federation not properly configured | Ensure `@apollo/subgraph` is installed and GraphQL module uses `ApolloFederationDriver` |
| "400: Bad Request" from subgraph | Authentication blocking federation | Remove class-level guards from resolvers |
| "Cannot query field 'id'" | ID field not exposed | Add `@Field(() => ID)` to ID field |
| "ECONNREFUSED" | Service binding to localhost | Change `app.listen(port)` to `app.listen(port, '0.0.0.0')` |
| "404 on /graphql" | Global prefix affecting GraphQL | Exclude GraphQL from global prefix |

## References
- Apollo Federation v2 Documentation: https://www.apollographql.com/docs/federation/
- NestJS GraphQL Federation: https://docs.nestjs.com/graphql/federation
- Docker Networking: https://docs.docker.com/network/