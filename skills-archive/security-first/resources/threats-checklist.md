# Security Threats & Checklists

Reference for Security First Skill - OWASP Top 10 and Vulnerability Prevention

---

## OWASP Top 10 for APIs (2023)

### 1. Broken Object Level Authorization
**Threat**: User can access resources they don't own (e.g., viewing another user's invoice)

**Prevention**:
```typescript
@Query(() => Invoice)
async invoice(@Args('id') id: string, @Context() ctx: any) {
  const invoice = await this.service.findById(id);

  // ✅ Check ownership or permission
  if (invoice.userId !== ctx.user.id && !ctx.user.permissions.includes('invoice:read_all')) {
    throw new ForbiddenException('Cannot access this invoice');
  }

  return invoice;
}
```

**Checklist**:
- [ ] Check resource ownership on every fetch
- [ ] Don't rely only on UUIDs for security
- [ ] Implement proper RBAC
- [ ] Log unauthorized access attempts

---

### 2. Broken User Authentication
**Threat**: Weak authentication allows account takeover

**Prevention**:
- Short-lived access tokens (15 minutes)
- Refresh token rotation
- Secure password hashing (bcrypt, cost factor 12+)
- Multi-factor authentication (MFA) for sensitive operations
- Account lockout after failed attempts

**Checklist**:
- [ ] JWT expiration set to 15 minutes
- [ ] Refresh tokens rotated on use
- [ ] Password complexity requirements enforced
- [ ] Account lockout after 5 failed attempts
- [ ] Rate limit on login endpoint (5 attempts / 5 minutes)

---

### 3. Broken Object Property Level Authorization
**Threat**: API exposes sensitive fields based on lack of permission checks

**Prevention**:
```typescript
@ObjectType()
export class User {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  // ❌ Don't expose sensitive fields without permission check
  // password: string;
  // ssn: string;

  // ✅ Conditional field based on permissions
  @Field({ nullable: true })
  sensitiveData?: string;
}

// In resolver
async user(@Context() ctx: any) {
  const user = await this.service.findById(id);

  // Filter fields based on permissions
  if (!ctx.user.permissions.includes('user:view_sensitive')) {
    delete user.sensitiveData;
  }

  return user;
}
```

**Checklist**:
- [ ] Whitelist response fields
- [ ] Don't return entire database entity
- [ ] Filter sensitive fields based on permissions
- [ ] Use DTOs for responses

---

### 4. Unrestricted Resource Consumption
**Threat**: API allows excessive requests leading to DoS

**Prevention**:
- Rate limiting (100 req/min for queries, 10 req/min for mutations)
- Pagination limits (max 100 items per page)
- Query complexity limits (GraphQL depth limit)
- Timeout limits (30s max query execution)

**Checklist**:
- [ ] Rate limiting on all endpoints
- [ ] Pagination limits enforced
- [ ] GraphQL query depth limit (max 5 levels)
- [ ] Database query timeout configured
- [ ] File upload size limits enforced

---

### 5. Broken Function Level Authorization
**Threat**: Regular user can access admin functions

**Prevention**:
```typescript
@Mutation(() => User)
@UseGuards(JwtAuthGuard, RbacGuard)
@RequirePermissions('admin:user_management') // ✅ RBAC guard
async deleteUser(@Args('id') id: string) {
  return this.service.deleteUser(id);
}
```

**Checklist**:
- [ ] All mutations have RBAC guards
- [ ] Admin functions require admin permissions
- [ ] No function-level bypass possible
- [ ] Test unauthorized access attempts

---

### 6. Unrestricted Access to Sensitive Business Flows
**Threat**: Missing rate limiting on critical flows (e.g., payment approval)

**Prevention**:
```typescript
@Mutation(() => PaymentPayload)
@UseGuards(JwtAuthGuard, RbacGuard)
@RequirePermissions('payment:approve')
@Throttle(5, 60) // ✅ Rate limit critical operations
async approvePayment(@Args('id') id: string) {
  // Additional business logic checks
  const payment = await this.service.findById(id);

  // ✅ Check payment status
  if (payment.status !== 'pending') {
    throw new BadRequestException('Payment already processed');
  }

  // ✅ Check approval amount limits
  if (payment.amount > 100000 && !ctx.user.permissions.includes('payment:approve_large')) {
    throw new ForbiddenException('Cannot approve payments over 100,000');
  }

  return this.service.approve(id);
}
```

**Checklist**:
- [ ] Rate limit on critical business flows
- [ ] Validate business rules before execution
- [ ] Check approval limits/thresholds
- [ ] Audit all critical operations

---

### 7. Server Side Request Forgery (SSRF)
**Threat**: Attacker controls server-side URL requests

**Prevention**:
- Whitelist allowed domains
- Validate URL schemes (only https://)
- Use separate network for external requests
- Never use user input directly in URLs

**Checklist**:
- [ ] Validate all external URLs
- [ ] Whitelist allowed domains
- [ ] Use URL parsing libraries
- [ ] Block internal IP ranges (localhost, 192.168.x.x, etc.)

---

### 8. Security Misconfiguration
**Threat**: Default settings expose vulnerabilities

**Prevention**:
```env
# ✅ Production settings
NODE_ENV=production
DEBUG=false
DATABASE_SYNCHRONIZE=false # NEVER true in production
CORS_ORIGIN=https://app.vextrus.com # Specific origin, not *
ENABLE_INTROSPECTION=false # GraphQL introspection off in prod
HELMET_ENABLED=true # Security headers
```

**Checklist**:
- [ ] Debug mode disabled in production
- [ ] Database synchronize disabled
- [ ] CORS configured (not wildcard *)
- [ ] GraphQL introspection disabled in production
- [ ] Security headers enabled (Helmet)
- [ ] Error messages don't expose stack traces

---

### 9. Improper Inventory Management
**Threat**: Undocumented or deprecated endpoints remain active

**Prevention**:
- Maintain API documentation (GraphQL schema, OpenAPI)
- Version APIs properly
- Remove deprecated endpoints
- Monitor all active endpoints

**Checklist**:
- [ ] All endpoints documented
- [ ] API versioning strategy
- [ ] Deprecated endpoints removed or clearly marked
- [ ] Regular API inventory audit

---

### 10. Unsafe Consumption of APIs
**Threat**: Trusting external API responses without validation

**Prevention**:
```typescript
async fetchExternalData(url: string) {
  // ✅ Validate URL
  if (!this.isAllowedDomain(url)) {
    throw new BadRequestException('Domain not allowed');
  }

  try {
    const response = await axios.get(url, {
      timeout: 5000, // ✅ Timeout
      maxContentLength: 1024 * 1024, // ✅ Size limit (1MB)
    });

    // ✅ Validate response
    const validatedData = await this.validateExternalData(response.data);

    return validatedData;
  } catch (error) {
    // ✅ Don't expose internal errors
    throw new BadRequestException('Failed to fetch external data');
  }
}
```

**Checklist**:
- [ ] Validate all external API responses
- [ ] Set timeouts on external requests
- [ ] Limit response size
- [ ] Don't trust external data
- [ ] Handle external API errors gracefully

---

## Security Testing Checklist

### Authentication Tests
- [ ] Test unauthenticated access (should fail)
- [ ] Test invalid token (should fail)
- [ ] Test expired token (should fail)
- [ ] Test token refresh flow
- [ ] Test logout/token revocation

### Authorization Tests
- [ ] Test access without permissions (should fail)
- [ ] Test access with permissions (should succeed)
- [ ] Test wildcard permissions (admin:*)
- [ ] Test resource ownership checks

### Input Validation Tests
- [ ] Test invalid data types
- [ ] Test out-of-range values
- [ ] Test missing required fields
- [ ] Test SQL injection attempts
- [ ] Test XSS attempts

### Rate Limiting Tests
- [ ] Test exceeding rate limits (should return 429)
- [ ] Test rate limit headers (X-RateLimit-*)
- [ ] Test rate limit reset

### Security Event Tests
- [ ] Test audit logging for critical operations
- [ ] Test security event logging for failed auth
- [ ] Test anomaly detection (multiple failures)

---

## Quick Security Audit

Run before every production deployment:

```bash
# 1. Check for hardcoded secrets
grep -r "password\|secret\|key" src/ --include="*.ts" | grep -v "interface\|type\|import"

# 2. Check for console.log (remove in production)
grep -r "console.log" src/ --include="*.ts"

# 3. Check for @Public() decorators (review each one)
grep -r "@Public()" src/ --include="*.ts"

# 4. Verify .env not committed
git ls-files | grep ".env"

# 5. Run security tests
npm run test:security
```

---

## Best Practices Summary

1. **Never trust user input** - Validate everything
2. **Check authorization** - Both function-level and object-level
3. **Rate limit everything** - Queries and mutations
4. **Audit critical operations** - Financial transactions, approvals
5. **Use HTTPS only** - TLS everywhere
6. **Keep dependencies updated** - Regular security patches
7. **Regular security reviews** - Weekly audit log analysis
8. **Penetration testing** - Quarterly security audits
