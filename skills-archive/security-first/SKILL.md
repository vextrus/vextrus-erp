---
name: Security First
description: When implementing authentication, authorization, data validation, or handling sensitive financial data, activate this skill to enforce security best practices. Use when user says "security", "auth", "permission", "rbac", "validation", "sensitive", or when working with user data, financial records, or API endpoints.
---

# Security First Skill

## Purpose
Enforce **security-by-design** for financial ERP systems handling sensitive business data.

## Activation Triggers
- User says: "security", "auth", "permission", "rbac", "validation", "sanitize"
- Working with: User data, financial records, payment info, API endpoints
- Implementing: Authentication, authorization, data validation, encryption
- Creating: New GraphQL resolvers, REST endpoints, domain logic

## Security Principles

### 1. Defense in Depth
Multiple security layers:
```
Layer 1: Network (API Gateway)
Layer 2: Authentication (JWT)
Layer 3: Authorization (RBAC Guards)
Layer 4: Input Validation (DTOs, Schemas)
Layer 5: Business Logic (Domain Rules)
Layer 6: Data Access (Row-level Security)
Layer 7: Audit Trail (Event Logging)
```

### 2. Principle of Least Privilege
- Users have minimum permissions needed
- Services have minimum access scope
- Tokens expire quickly (15min access, 7d refresh)

### 3. Assume Breach
- Encrypt sensitive data at rest
- Never log sensitive data (passwords, tokens, PII)
- Audit all access to financial data
- Implement rate limiting

## Quick Security Checklist

Before deploying changes:
- [ ] Authentication guard on all resolvers/controllers
- [ ] Authorization (RBAC) on sensitive operations
- [ ] Input validation on all DTOs/inputs
- [ ] Sanitization of user-provided strings
- [ ] SQL injection prevention (parameterized queries)
- [ ] Rate limiting on endpoints
- [ ] Audit logging for sensitive operations
- [ ] Encryption for sensitive data at rest
- [ ] Token expiration configured
- [ ] No sensitive data in logs

## Pattern Overview

### Authentication Patterns
JWT token structure, authentication guards, resolver usage patterns.

**See**: resources/authentication.md for complete implementation details

### Authorization Patterns
RBAC permissions structure, guards, decorators, hierarchical permissions.

**See**: resources/authorization.md for complete implementation details

### Input Validation Patterns
DTO validation with class-validator, GraphQL input validation, sanitization strategies.

**See**: resources/input-validation.md for complete implementation details

### Data Protection Patterns
Encryption at rest (AES-256-GCM), sensitive data handling, SQL injection prevention, rate limiting.

**See**: resources/data-protection.md for complete implementation details

### Audit & Compliance
Audit event structure, interceptors, security testing patterns, OWASP Top 10.

**See**: resources/audit-compliance.md for complete implementation details

### Threat Reference
Common vulnerabilities, OWASP Top 10 for APIs, security testing strategies.

**See**: resources/threats-checklist.md for complete implementation details

## Plan Mode Integration

In plan mode:
1. User describes security-sensitive feature
2. Skill analyzes authentication, authorization, validation needs
3. Presents security-first implementation plan
4. User approves security measures
5. Execute with all security layers
6. Test security (authentication, authorization, validation)

## Integration with Execute First

Security-first and execute-first work together:

```
1. [TodoWrite: Security-sensitive feature]
2. [/explore services/finance] → Find security patterns
3. [Write: DTOs with validation] → Security-first validates
4. [Add: @UseGuards(JwtAuthGuard, RbacGuard)] → Security-first enforces
5. [Add: @RequirePermissions('invoice:create')] → Security-first RBAC
6. [Write: Security tests] → Test-first creates tests
7. [Bash: npm test] → Execute-first runs tests
8. [Mark done] → Execute-first completes
```

## Resources & References

**Pattern Files**:
- resources/authentication.md - JWT, guards, usage patterns
- resources/authorization.md - RBAC, permissions, decorators
- resources/input-validation.md - DTOs, validation, sanitization
- resources/data-protection.md - Encryption, SQL injection prevention
- resources/audit-compliance.md - Logging, testing, security compliance
- resources/threats-checklist.md - OWASP Top 10, vulnerabilities

**External Resources**:
- OWASP Top 10: https://owasp.org/API-Security/
- JWT Best Practices: https://datatracker.ietf.org/doc/html/rfc8725
- NestJS Security: https://docs.nestjs.com/security/authentication

## Override

Never skip security if:
- Handling user data
- Financial/payment data
- API endpoints exposed
- Authentication/authorization

User must explicitly say:
- "prototype only" (development environment)
- "local testing" (never production)

**Default for Vextrus ERP**: SECURITY FIRST, ALWAYS
