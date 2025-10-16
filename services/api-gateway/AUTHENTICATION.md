# API Gateway Authentication Guide

## Overview

The API Gateway implements **JWT-based authentication** using Passport.js and NestJS Guards. Authentication is enforced at the **resolver level**, allowing fine-grained control over which GraphQL operations require authentication.

## Architecture

### Components

1. **JWT Strategy** (`src/auth/jwt.strategy.ts`)
   - Extracts JWT from `Authorization: Bearer <token>` header
   - Validates token signature using JWT secret
   - Decodes payload and attaches user context to request

2. **GraphQL Auth Guard** (`src/auth/gql-auth.guard.ts`)
   - NestJS guard for GraphQL resolvers
   - Returns proper HTTP 401 errors for invalid/expired tokens
   - Provides detailed error messages

3. **Current User Decorator** (`src/decorators/current-user.decorator.ts`)
   - Extracts authenticated user from GraphQL context
   - Provides type-safe user object to resolvers

## Configuration

### Environment Variables

Required in `docker-compose.yml` for API Gateway:

```yaml
JWT_ACCESS_SECRET: vextrus_jwt_access_secret_dev_2024
JWT_ACCESS_EXPIRES_IN: 15m
```

**Important**: These must match the auth service JWT configuration.

### JWT Payload Structure

```typescript
{
  sub: string;           // User ID (required)
  email: string;         // User email
  username: string;      // Username
  organizationId: string;// Organization ID
  iat: number;          // Issued at (timestamp)
  exp: number;          // Expiration (timestamp)
}
```

## Usage

### Protecting GraphQL Resolvers

To require authentication for a GraphQL query or mutation, apply the `@UseGuards(GqlAuthGuard)` decorator:

```typescript
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard, CurrentUser, CurrentUserContext } from '../auth';

@Resolver()
export class UserResolver {
  /**
   * Public query - no authentication required
   */
  @Query(() => String)
  async healthCheck() {
    return 'OK';
  }

  /**
   * Protected query - requires authentication
   */
  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: CurrentUserContext) {
    // user object is automatically populated from JWT
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      organizationId: user.organizationId,
    };
  }

  /**
   * Protected mutation - requires authentication
   */
  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async updateProfile(
    @Args('firstName') firstName: string,
    @CurrentUser() user: CurrentUserContext,
  ) {
    // user.id contains the authenticated user's ID
    await this.userService.updateProfile(user.id, { firstName });
    return true;
  }
}
```

### Client-Side Usage

#### 1. Obtain JWT Token

```graphql
mutation Login {
  login(input: {
    email: "user@example.com"
    password: "password123"
  }) {
    accessToken
    refreshToken
    user {
      id
      email
    }
  }
}
```

#### 2. Include Token in Requests

Add the Authorization header to all GraphQL requests:

```typescript
// Using axios
const client = axios.create({
  baseURL: 'http://localhost:4000/graphql',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  },
});

// Using Apollo Client
const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  headers: {
    authorization: `Bearer ${accessToken}`,
  },
});

// Using fetch
fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    query: '{ me { id email } }',
  }),
});
```

## Error Handling

### Authentication Errors

The guard returns proper error responses for various failure scenarios:

#### 1. Missing Token (401 Unauthorized)
```json
{
  "errors": [{
    "message": "Authentication required",
    "extensions": {
      "code": "UNAUTHENTICATED"
    }
  }]
}
```

#### 2. Expired Token (401 Unauthorized)
```json
{
  "errors": [{
    "message": "Token has expired",
    "extensions": {
      "code": "UNAUTHENTICATED"
    }
  }]
}
```

#### 3. Invalid Token (401 Unauthorized)
```json
{
  "errors": [{
    "message": "Invalid token",
    "extensions": {
      "code": "UNAUTHENTICATED"
    }
  }]
}
```

#### 4. Malformed Payload (401 Unauthorized)
```json
{
  "errors": [{
    "message": "Invalid token payload",
    "extensions": {
      "code": "UNAUTHENTICATED"
    }
  }]
}
```

## Token Forwarding to Subgraphs

The API Gateway automatically forwards authentication tokens to all federated subgraphs:

```typescript
// In app.module.ts - already configured
buildService({ url }) {
  return new RemoteGraphQLDataSource({
    url,
    willSendRequest({ request, context }) {
      // Forward auth token to subgraphs
      if (context.token) {
        request.http.headers.set('authorization', `Bearer ${context.token}`);
      }
      if (context.tenantId) {
        request.http.headers.set('x-tenant-id', context.tenantId);
      }
    },
  });
}
```

Subgraphs receive the token and can validate it independently.

## Testing

### Unit Testing Protected Resolvers

```typescript
import { Test } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { UserResolver } from './user.resolver';

describe('UserResolver', () => {
  let resolver: UserResolver;
  let guard: GqlAuthGuard;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserResolver],
    }).compile();

    resolver = module.get<UserResolver>(UserResolver);
  });

  it('should allow authenticated requests', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      username: 'testuser',
      organizationId: 'org-1',
    };

    const result = await resolver.me(mockUser);
    expect(result.id).toBe('123');
  });
});
```

### Integration Testing

See `test-integration/auth-token-forwarding.test.ts` for comprehensive integration tests.

## Security Best Practices

### 1. Token Expiration
- Access tokens expire after 15 minutes (configurable)
- Use refresh tokens for long-lived sessions
- Never store tokens in localStorage (use httpOnly cookies in production)

### 2. HTTPS in Production
- Always use HTTPS in production
- JWT tokens in plain HTTP can be intercepted

### 3. Token Refresh
```graphql
mutation RefreshToken {
  refreshToken(input: {
    refreshToken: "your-refresh-token"
  }) {
    accessToken
    refreshToken
  }
}
```

### 4. Guard All Sensitive Operations
```typescript
// Always protect mutations that modify data
@Mutation(() => Boolean)
@UseGuards(GqlAuthGuard)
async deleteUser(@Args('id') id: string, @CurrentUser() user: CurrentUserContext) {
  // Verify user has permission to delete
  if (user.id !== id && !user.isAdmin) {
    throw new ForbiddenException('Not authorized to delete this user');
  }
  return this.userService.delete(id);
}
```

### 5. Role-Based Access Control (Future Enhancement)

For role-based guards, extend the pattern:

```typescript
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Usage
@Mutation(() => Boolean)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles('admin', 'manager')
async deleteAllUsers() {
  return this.userService.deleteAll();
}
```

## Troubleshooting

### Issue: "Invalid token" error with valid token

**Cause**: JWT secret mismatch between auth service and API gateway

**Solution**: Ensure `JWT_ACCESS_SECRET` is identical in both services:
```bash
# Check auth service
docker-compose logs auth | grep JWT_ACCESS_SECRET

# Check API gateway
docker-compose logs api-gateway | grep JWT_ACCESS_SECRET
```

### Issue: Token works in auth service but not in gateway

**Cause**: Token not being forwarded correctly

**Solution**: Check Authorization header format:
```javascript
// ✅ Correct
headers: { 'Authorization': 'Bearer eyJhbGc...' }

// ❌ Incorrect
headers: { 'Authorization': 'eyJhbGc...' }
headers: { 'authorization': 'eyJhbGc...' }  // Case matters in some clients
```

### Issue: CORS errors when adding Authorization header

**Cause**: CORS configuration not allowing Authorization header

**Solution**: Update `cors` in API Gateway main.ts:
```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

## Migration Guide

### Protecting Existing Resolvers

1. **Identify sensitive resolvers**: Queries/mutations that access user-specific data
2. **Add guard decorator**: `@UseGuards(GqlAuthGuard)`
3. **Update resolver parameters**: Add `@CurrentUser()` to access authenticated user
4. **Test**: Verify protected queries return 401 without token

Example migration:

```typescript
// Before
@Query(() => [Order])
async myOrders() {
  return this.orderService.findAll();  // Returns ALL orders (security issue!)
}

// After
@Query(() => [Order])
@UseGuards(GqlAuthGuard)
async myOrders(@CurrentUser() user: CurrentUserContext) {
  return this.orderService.findByUserId(user.id);  // Returns only user's orders
}
```

## Related Files

- `src/auth/jwt.strategy.ts` - JWT validation strategy
- `src/auth/gql-auth.guard.ts` - GraphQL authentication guard
- `src/auth/auth.module.ts` - Authentication module configuration
- `src/decorators/current-user.decorator.ts` - Current user decorator
- `src/config/configuration.ts` - JWT configuration
- `test-integration/auth-token-forwarding.test.ts` - Integration tests

## Additional Resources

- [NestJS Authentication Docs](https://docs.nestjs.com/security/authentication)
- [Passport JWT Strategy](https://www.passportjs.org/packages/passport-jwt/)
- [GraphQL Authentication Best Practices](https://graphql.org/learn/authorization/)
- Auth Service Documentation: `services/auth/CLAUDE.md`

---

**Last Updated**: October 13, 2025
**Version**: 1.0.0
