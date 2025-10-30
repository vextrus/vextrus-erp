# Authentication Patterns

Reference for Security First Skill - JWT Authentication Implementation

---

## JWT Token Structure

### Access Token Payload
```typescript
interface JwtPayload {
  sub: string;        // User ID
  email: string;
  roles: string[];
  permissions: string[];
  organizationId: string;
  iat: number;        // Issued at
  exp: number;        // Expiration (15 minutes)
}
```

### Refresh Token Payload
```typescript
interface RefreshToken {
  sub: string;
  tokenFamily: string; // For rotation
  exp: number;        // 7 days
}
```

**Security Notes**:
- Access tokens: Short-lived (15 minutes)
- Refresh tokens: Longer-lived (7 days)
- Token rotation prevents replay attacks
- Family tracking prevents token theft

---

## Authentication Guard Implementation

### JWT Auth Guard
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean {
    const request = this.getRequest(context);

    // Extract token from Authorization header
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    // Verify token signature and expiration
    try {
      const payload = this.jwtService.verify(token);
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  private getRequest(context: ExecutionContext): any {
    // Handle both HTTP and GraphQL contexts
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest();
    }

    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
```

---

## Usage on Resolvers

### Simple Authentication
```typescript
@Resolver(() => Invoice)
export class InvoiceResolver {
  @Query(() => Invoice)
  @UseGuards(JwtAuthGuard) // Authentication required
  async invoice(@Args('id') id: string): Promise<Invoice> {
    return this.queryBus.execute(new GetInvoiceQuery(id));
  }
}
```

### Authentication + Authorization
```typescript
@Mutation(() => InvoicePayload)
@UseGuards(JwtAuthGuard, RbacGuard) // Both authentication and RBAC
@RequirePermissions('invoice:create')
async createInvoice(@Args('input') input: CreateInvoiceInput) {
  // Only authenticated users with 'invoice:create' permission
  return this.commandBus.execute(new CreateInvoiceCommand(input));
}
```

---

## Token Refresh Flow

```typescript
@Mutation(() => AuthPayload)
async refreshToken(@Args('refreshToken') refreshToken: string) {
  // 1. Verify refresh token
  const payload = await this.jwtService.verify(refreshToken);

  // 2. Check token family (rotation)
  const isValid = await this.tokenService.validateTokenFamily(
    payload.sub,
    payload.tokenFamily,
  );

  if (!isValid) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  // 3. Issue new access token + refresh token
  const newAccessToken = await this.jwtService.sign({
    sub: payload.sub,
    // ... other claims
    exp: Date.now() + 15 * 60 * 1000, // 15 minutes
  });

  const newRefreshToken = await this.jwtService.sign({
    sub: payload.sub,
    tokenFamily: uuid(), // New family
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // 4. Invalidate old refresh token
  await this.tokenService.revokeToken(refreshToken);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}
```

---

## Best Practices

1. **Always use HTTPS** - Tokens transmitted over TLS only
2. **Short-lived access tokens** - 15 minutes max
3. **Refresh token rotation** - New family on each refresh
4. **Secure storage** - HttpOnly cookies or secure client storage
5. **Token revocation** - Implement blacklist for logout
6. **Rate limiting** - Prevent brute force on login/refresh
