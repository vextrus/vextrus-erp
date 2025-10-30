---
task: h-implement-production-phased-rollout-week3
parent: h-implement-production-phased-rollout
branch: feature/production-phased-rollout-week3
status: pending
created: 2025-10-16
week: 3
estimated_hours: 12
dependencies: [02-week2-performance-optimization]
---

# Week 3: Security Hardening + Scale to 60%

## Goal
Implement rate limiting, RBAC authorization guards, and fix tenant isolation vulnerabilities to achieve 0 high security issues at 60 concurrent users.

## Success Criteria
- [ ] Add API rate limiting (100 req/15min per IP)
- [ ] Implement RBAC guards for all mutations
- [ ] Fix tenant isolation bypass vulnerabilities
- [ ] Add Helmet security headers
- [ ] Security revalidation: 0 high vulnerabilities
- [ ] Scale to 60% of users successfully
- [ ] Monitor for 48 hours: error rate <0.5%, P95 <300ms

## Key Tasks

### 1. Rate Limiting (4 hours)
**Files**:
- `main.ts`
- Create `src/infrastructure/guards/rate-limit.guard.ts`

**Implementation**:
- Express rate limiter: 100 req/15min global
- Auth endpoints: 5 attempts/15min
- GraphQL query complexity limits: 1000 max

### 2. RBAC Guards (8 hours)
**Files**:
- Create `src/infrastructure/guards/rbac.guard.ts`
- Create `src/infrastructure/decorators/permissions.decorator.ts`
- Update all resolvers

**Permissions**:
- `invoice:create`, `invoice:approve`, `invoice:cancel`
- `payment:process`, `payment:reconcile`
- `journal:post`, `journal:reverse`

**Tenant Isolation Fix**:
- Extract tenant from JWT only (not headers)
- Verify header matches JWT if provided
- Apply tenant validation to GraphQL

### 3. Security Headers
**File**: `main.ts`

Add Helmet configuration with:
- Content Security Policy
- HSTS
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff

## Deployment
- Deploy to production with 60% traffic split
- Security revalidation scan
- Monitor for 48 hours

## Quality Gates
- [ ] `/security-scan` - 0 high vulnerabilities
- [ ] Rate limiting functional
- [ ] RBAC enforcement verified
- [ ] 60% deployment successful
- [ ] 48-hour stability confirmed
- [ ] Ready for Week 4
