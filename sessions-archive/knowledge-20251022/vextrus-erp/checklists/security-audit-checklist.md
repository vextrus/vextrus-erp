# Security Audit Checklist

**Source**: Security First Skill - OWASP Top 10
**Purpose**: Pre-deployment security validation for Vextrus ERP

---

## 🔐 Authentication & Authorization

### Authentication
- [ ] JWT expiration set to 15 minutes
- [ ] Refresh tokens rotated on use
- [ ] Password complexity requirements enforced
- [ ] Account lockout after 5 failed attempts
- [ ] Rate limit on login endpoint (5 attempts / 5 minutes)
- [ ] MFA enabled for admin accounts

### Authorization (RBAC)
- [ ] All mutations have RBAC guards
- [ ] Admin functions require admin permissions
- [ ] No function-level bypass possible
- [ ] Test unauthorized access attempts
- [ ] Resource ownership checks on all queries

---

## 🛡️ OWASP Top 10 for APIs

### 1. Broken Object Level Authorization
- [ ] Check resource ownership on every fetch
- [ ] Don't rely only on UUIDs for security
- [ ] Implement proper RBAC
- [ ] Log unauthorized access attempts

### 2. Broken User Authentication
- [ ] Short-lived access tokens (15 min)
- [ ] Secure password hashing (bcrypt, cost 12+)
- [ ] MFA for sensitive operations
- [ ] Test unauthenticated access (should fail)

### 3. Broken Object Property Level Authorization
- [ ] Whitelist response fields
- [ ] Don't return entire database entity
- [ ] Filter sensitive fields based on permissions
- [ ] Use DTOs for responses

### 4. Unrestricted Resource Consumption
- [ ] Rate limiting on all endpoints
- [ ] Pagination limits enforced (max 100 items)
- [ ] GraphQL query depth limit (max 5 levels)
- [ ] Database query timeout configured
- [ ] File upload size limits enforced

### 5. Broken Function Level Authorization
- [ ] All mutations have RBAC guards
- [ ] Admin functions require admin permissions
- [ ] No function-level bypass possible

### 6. Unrestricted Access to Sensitive Business Flows
- [ ] Rate limit on critical business flows
- [ ] Validate business rules before execution
- [ ] Check approval limits/thresholds
- [ ] Audit all critical operations

### 7. Server Side Request Forgery (SSRF)
- [ ] Validate all external URLs
- [ ] Whitelist allowed domains
- [ ] Block internal IP ranges (localhost, 192.168.x.x)
- [ ] Use URL parsing libraries

### 8. Security Misconfiguration
- [ ] Debug mode disabled in production
- [ ] Database synchronize disabled
- [ ] CORS configured (not wildcard *)
- [ ] GraphQL introspection disabled in production
- [ ] Security headers enabled (Helmet)
- [ ] Error messages don't expose stack traces

### 9. Improper Inventory Management
- [ ] All endpoints documented
- [ ] API versioning strategy implemented
- [ ] Deprecated endpoints removed
- [ ] Regular API inventory audit

### 10. Unsafe Consumption of APIs
- [ ] Validate all external API responses
- [ ] Set timeouts on external requests (5s max)
- [ ] Limit response size (1MB max)
- [ ] Don't trust external data
- [ ] Handle external API errors gracefully

---

## 🧪 Security Testing

### Pre-Deployment Tests
```bash
# Run security test suite
npm run test:security

# Run authentication tests
npm run test -- --grep "authentication"

# Run authorization tests
npm run test -- --grep "authorization"

# Run input validation tests
npm run test -- --grep "validation"
```

### Manual Security Checks
```bash
# 1. Check for hardcoded secrets
grep -r "password\|secret\|key" src/ --include="*.ts" | grep -v "interface\|type\|import"

# 2. Check for console.log (remove in production)
grep -r "console.log" src/ --include="*.ts"

# 3. Check for @Public() decorators (review each one)
grep -r "@Public()" src/ --include="*.ts"

# 4. Verify .env not committed
git ls-files | grep ".env"
```

---

## 📝 Input Validation

- [ ] Test invalid data types
- [ ] Test out-of-range values
- [ ] Test missing required fields
- [ ] Test SQL injection attempts
- [ ] Test XSS attempts
- [ ] Test command injection attempts
- [ ] Test path traversal attempts

---

## 🔢 Rate Limiting

- [ ] Test exceeding rate limits (should return 429)
- [ ] Test rate limit headers (X-RateLimit-*)
- [ ] Test rate limit reset
- [ ] Critical flows rate limited (5-10 req/min)
- [ ] Standard queries rate limited (100 req/min)

---

## 📊 Audit & Logging

- [ ] Audit logging for critical operations (payments, approvals)
- [ ] Security event logging for failed auth
- [ ] Anomaly detection (multiple failures)
- [ ] Log rotation configured
- [ ] Sensitive data not logged (passwords, tokens)

---

## 🌐 Multi-Tenancy Security

- [ ] X-Tenant-Id header required on all requests
- [ ] Tenant validation in middleware
- [ ] Tenant context set for request lifecycle
- [ ] PostgreSQL RLS policies active
- [ ] Test cross-tenant data access (should fail)

---

## 🔧 Environment Configuration

### Production .env Validation
```env
# ✅ Required production settings
NODE_ENV=production
DEBUG=false
DATABASE_SYNCHRONIZE=false # NEVER true in production
CORS_ORIGIN=https://app.vextrus.com # Specific origin, not *
ENABLE_INTROSPECTION=false # GraphQL introspection off
HELMET_ENABLED=true # Security headers
```

**Checklist**:
- [ ] NODE_ENV=production
- [ ] DEBUG=false
- [ ] DATABASE_SYNCHRONIZE=false
- [ ] CORS_ORIGIN specific (not *)
- [ ] ENABLE_INTROSPECTION=false
- [ ] HELMET_ENABLED=true

---

## 🚀 Pre-Deployment Checklist

### Code Review
- [ ] Security review completed
- [ ] No hardcoded secrets
- [ ] No console.log in production code
- [ ] All @Public() decorators justified

### Testing
- [ ] All security tests passing
- [ ] Authentication tests passing
- [ ] Authorization tests passing
- [ ] Input validation tests passing
- [ ] Rate limiting tests passing

### Configuration
- [ ] Environment variables validated
- [ ] CORS configured correctly
- [ ] Rate limits configured
- [ ] Security headers enabled

### Documentation
- [ ] Security decisions documented
- [ ] New endpoints documented
- [ ] Permission requirements documented
- [ ] Security incidents procedure documented

---

## 📅 Ongoing Security

### Weekly
- [ ] Review audit logs for anomalies
- [ ] Check failed authentication attempts
- [ ] Monitor rate limit violations
- [ ] Review new dependencies for vulnerabilities

### Monthly
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Review @Public() endpoints
- [ ] Update security documentation
- [ ] Review RBAC permissions

### Quarterly
- [ ] Penetration testing by security team
- [ ] Full security audit
- [ ] Review and update security policies
- [ ] Security training for team

---

## ⚠️ Critical Failures (Block Deployment)

These issues MUST be resolved before production deployment:

❌ **Blockers**:
- [ ] Hardcoded secrets in code
- [ ] DATABASE_SYNCHRONIZE=true
- [ ] CORS_ORIGIN=*
- [ ] Debug mode enabled
- [ ] Failed authentication tests
- [ ] Failed authorization tests
- [ ] Missing rate limits on critical flows
- [ ] npm audit critical vulnerabilities

---

## 📖 References

- **OWASP Top 10 APIs**: https://owasp.org/www-project-api-security/
- **Security First Skill**: `.claude/skills/security-first/SKILL.md`
- **RBAC Patterns**: `sessions/knowledge/vextrus-erp/patterns/rbac-patterns.md`
- **Multi-Tenancy**: `.claude/skills/multi-tenancy/SKILL.md`

---

**Last Updated**: 2025-10-19
**Next Review**: Weekly before production deployments
