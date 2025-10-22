# Task Completion Checklist (Detailed)

**Purpose**: Comprehensive quality-gated completion for Vextrus ERP tasks
**Last Updated**: 2025-10-20

---

## 1. Automated Quality Gates (REQUIRED)

### Code Quality
- [ ] `/review` executed successfully
- [ ] Zero critical issues
- [ ] Warnings <5 (justified)
- [ ] TypeScript strict mode compliant

### Security Scan
- [ ] `/security-scan` executed successfully
- [ ] Zero critical/high vulnerabilities
- [ ] No secrets in code
- [ ] Input validation implemented

### Tests
- [ ] `/test` executed successfully
- [ ] All tests pass (100%)
- [ ] Coverage ≥ baseline (target: 90%)
- [ ] Edge cases tested

### Build
- [ ] `pnpm build` succeeds
- [ ] Zero TypeScript errors
- [ ] No `as any` without justification

---

## 2. Advanced Quality Reviews (Medium/Complex)

### Architecture Review (architecture-strategist)
- [ ] Design patterns correctly applied
- [ ] SOLID principles followed
- [ ] DDD boundaries respected
- [ ] No circular dependencies

**When**: Multi-service changes, new patterns

### TypeScript Quality (kieran-typescript-reviewer)
- [ ] Type safety at 100%
- [ ] No `any` types (or justified)
- [ ] Proper null/undefined handling

**When**: Complex types, >500 lines TypeScript

### Performance Review (performance-oracle)
- [ ] No N+1 query problems
- [ ] Database queries optimized
- [ ] Pagination implemented
- [ ] API response <300ms

**When**: Database changes, API endpoints

### Security Audit (security-sentinel)
- [ ] Authentication implemented
- [ ] Authorization guards in place
- [ ] SQL injection prevented
- [ ] XSS protection implemented

**When**: Auth changes, sensitive data

### Database Safety (data-integrity-guardian)
- [ ] Migration tested (up and down)
- [ ] No data loss risk
- [ ] Foreign key constraints defined
- [ ] Rollback plan documented

**When**: Schema changes, migrations

---

## 3. Domain-Specific Validations

### Bangladesh ERP Compliance (Finance)
- [ ] VAT rates correct (15%, 7.5%, 5%, 0%)
- [ ] TIN validation: 10-digit
- [ ] BIN validation: 9-digit
- [ ] Mushak forms: 6.1, 6.3, 9.1
- [ ] Fiscal year: July 1 - June 30

**Reference**: `checklists/bangladesh-compliance.md`

### GraphQL Federation (Schema Changes)
- [ ] Federation directives correct (@key, @external)
- [ ] Schema composition validates
- [ ] Pagination follows Relay spec
- [ ] Error handling standardized

### Event Sourcing (Event-Driven)
- [ ] Event versioning implemented
- [ ] Event handlers idempotent
- [ ] Projections updated
- [ ] Replay safety verified

---

## 4. Testing Requirements

### Unit Testing
- [ ] All business logic tested
- [ ] Domain aggregates fully tested
- [ ] Test coverage ≥90% for domain
- [ ] Happy path + error paths

### Integration Testing
- [ ] API endpoints tested end-to-end
- [ ] Database operations tested
- [ ] Multi-tenant isolation verified
- [ ] Authentication flow tested

### Edge Cases
- [ ] Invalid input tested
- [ ] Boundary values tested (0, negative, max)
- [ ] Null/undefined handling
- [ ] Timeout scenarios

---

## 5. Security Checklist

### Authentication
- [ ] JWT tokens validated
- [ ] Token expiration enforced
- [ ] No authentication bypass
- [ ] Health endpoints excluded from auth

### Authorization
- [ ] RBAC implemented
- [ ] Permission checks on sensitive operations
- [ ] Tenant isolation enforced
- [ ] Cross-tenant access prevented

### Input Validation
- [ ] Global ValidationPipe configured
- [ ] DTOs use class-validator
- [ ] UUID format validated
- [ ] Amount validation (positive, 2 decimals)

### Data Protection
- [ ] No secrets in code
- [ ] TLS/SSL enforced in production
- [ ] CORS configured (no wildcard)
- [ ] Security headers configured

---

## 6. Documentation Updates

- [ ] Service CLAUDE.md updated
- [ ] API documentation updated
- [ ] Migration file documented
- [ ] Known limitations noted

---

## 7. Performance Validation

### API Performance
- [ ] Response time <300ms (target)
- [ ] Database queries <100ms
- [ ] N+1 queries prevented
- [ ] Caching strategy defined

### Database Performance
- [ ] Indexes on foreign keys
- [ ] Connection pooling configured
- [ ] Query execution plans reviewed

---

## 8. Compounding: Learning Capture

- [ ] New patterns documented
- [ ] Service CLAUDE.md updated
- [ ] Knowledge base updated (if new patterns)

**For complex tasks**: Use `feedback-codifier` agent

---

## 9. Git & Deployment

### Git Operations
- [ ] All changes staged (`git add .`)
- [ ] Commit message follows convention (feat/fix/refactor)
- [ ] Commit message descriptive (what + why)
- [ ] Co-authored by Claude attribution

### Branch Management
- [ ] Feature branch naming followed
- [ ] Branch pushed to remote
- [ ] Main branch up to date

### Deployment Readiness
- [ ] Environment variables documented
- [ ] Docker images build successfully
- [ ] Health checks passing

---

## 10. Task Archival

- [ ] Status changed to `completed`
- [ ] Completion date added
- [ ] Moved to `sessions/tasks/done/`
- [ ] `.claude/state/current_task.json` cleared

---

## Summary Checklist (Quick View)

### Essential (Every Task)
- [ ] `/review`, `/security-scan`, `/test` passed
- [ ] Build succeeds
- [ ] Tests pass (≥90% coverage)
- [ ] No debug code
- [ ] Documentation updated
- [ ] Git commit with clear message

### Security (Critical)
- [ ] No secrets in code
- [ ] Authentication/authorization implemented
- [ ] Input validation comprehensive
- [ ] SQL injection prevented

### Performance (Important)
- [ ] API <300ms, DB <100ms
- [ ] No N+1 queries
- [ ] Indexes added

### Compounding (Complex)
- [ ] Learnings captured
- [ ] Patterns documented
- [ ] Knowledge base updated

---

**Version**: 1.0 (Detailed)
**Based On**: `sessions/protocols/task-completion.md` (v7.0)
