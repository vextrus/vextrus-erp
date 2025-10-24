---
name: Production Ready Workflow
version: 3.0.0
triggers:
  - "production"
  - "production ready"
  - "checkpoint"
  - "quality gates"
  - "deploy"
  - "deployment"
  - "release"
---

# Production Ready Workflow Skill

## Purpose
**Checkpoint-driven development** and **production deployment** patterns. Proven in finance task: 10 days, 9.5/10 quality, <5% rework, 0 bugs.

---

## When This Skill Activates

**Automatic activation on**:
- Production deployment preparation
- Checkpoint creation requests
- Quality gate validation
- Release planning
- Multi-day task management

---

## 1. Checkpoint-Driven Development

### When to Create Checkpoints

✅ **Create After**:
- Major phase completion (4-8 hours work)
- End of day (multi-day tasks)
- Before context switch
- Major milestone achieved

❌ **Don't Create For**:
- Simple tasks (<4 hours)
- Mid-phase work
- Every commit (too granular)

### Checkpoint Template (300-600 lines)

```markdown
# Phase [N] [Name]: COMPLETE

## Summary (5-10 bullets)
- Accomplishment 1
- Accomplishment 2
- Key metrics (files, tests, performance)
- Quality gates status

## Files Created ([count])
1. path/to/file.ts ([lines] lines) - Description

## Files Modified ([count])
1. existing/file.ts (+[lines] lines) - What changed

## Implementation Details
### [Feature 1 Name]
**What**: Brief description
**How**: Implementation approach
**Pattern**: Which pattern used
**Code**: path/to/file.ts:[line]

\```typescript
// Key code snippet (10-30 lines)
export class Example {
  // Important logic
}
\```

## Tests Added ([count])
- Unit tests: [count] ([coverage]%)
- Integration tests: [count]
- E2E tests: [count]

## Quality Gates ✅
- [x] Build passing (zero errors)
- [x] Tests passing ([count]/[count])
- [x] Pattern consistency: 100%
- [x] Multi-tenant isolation: Verified
- [x] Performance: <[target]ms

## Agent Reviews
- [x] kieran-typescript-reviewer: [score]/10
- [x] security-sentinel: [findings]

## Learnings
1. [Learning 1] - Why it matters
2. [Pattern discovered] - How to apply

## Next Session Plan
**Phase**: [Next phase name]
**Estimated Time**: [hours]
**Key Tasks**:
1. [Task 1]
2. [Task 2]

**Context Load**: Read this checkpoint (5 min)
```

### Checkpoint Management

**Directory Structure**:
```
sessions/tasks/
└── done/
    ├── task-CHECKPOINT-Phase1.md
    ├── task-CHECKPOINT-Phase2.md
    └── task-CHECKPOINT-COMPLETE.md
```

**Naming**: `[task-name]-CHECKPOINT-[phase]-[status].md`

---

## 2. Quality Gates (NON-NEGOTIABLE)

### Automated Gates (2-5 min)

```bash
# Build (zero TypeScript errors)
pnpm build

# Tests (all passing)
npm test

# Coverage (optional but recommended)
npm test -- --coverage
```

**Result**: MUST be green before commit

### Agent Review Gates (15-45 min)

**ALWAYS use for medium+ tasks**:
- `kieran-typescript-reviewer` (MANDATORY)

**Conditionally use**:
- `security-sentinel` (if auth, RBAC, sensitive data)
- `performance-oracle` (if caching, optimization)
- `data-integrity-guardian` (if database changes)

**Invocation**:
```
"Review this implementation with:
- kieran-typescript-reviewer (code quality)
- security-sentinel (security audit)
- performance-oracle (performance check)"
```

### Domain-Specific Gates

**Bangladesh Compliance**:
- [ ] VAT calculated correctly (15% standard)
- [ ] TDS withheld (5-10% based on vendor)
- [ ] Mushak 6.3 generated (if invoice)
- [ ] Fiscal year July-June used

**GraphQL Federation v2**:
- [ ] `@key` directive on entities
- [ ] Pagination on list queries
- [ ] Payload types with errors
- [ ] 100% authentication coverage

**Event Sourcing**:
- [ ] Events immutable (past tense)
- [ ] Event versioning (if schema change)
- [ ] Idempotent handlers
- [ ] Cache invalidation on events

**Multi-Tenancy**:
- [ ] tenantId in ALL queries
- [ ] Cross-tenant tests added
- [ ] Row-level security (backup)

---

## 3. Production Deployment Checklist

### Pre-Deployment (1-2 hours)

**Security Review**:
```
"Perform security audit with security-sentinel before production deployment"
```
- [ ] No @Public() decorators
- [ ] Input validation on all mutations
- [ ] No sensitive data in logs
- [ ] Multi-tenant isolation verified

**Performance Review**:
```
"Analyze performance with performance-oracle"
```
- [ ] All operations <300ms
- [ ] Caching implemented (if needed)
- [ ] Database indexes created
- [ ] N+1 queries eliminated

**Data Integrity Review**:
```
"Review migrations with data-integrity-guardian"
```
- [ ] Zero-downtime migration strategy
- [ ] Rollback plan documented
- [ ] Data backfilled (if schema change)
- [ ] Indexes created CONCURRENTLY

**Code Quality Review**:
```
"Final review with kieran-typescript-reviewer"
```
- [ ] Quality score 9+/10
- [ ] Pattern consistency 100%
- [ ] No tech debt introduced

### Deployment Strategy

**Phased Rollout**:
```yaml
Phase 1: Canary (5% traffic, 1 hour)
Phase 2: 50% traffic (4 hours)
Phase 3: 100% traffic (full rollout)
```

**Blue-Green Deployment**:
```bash
# Deploy green (new version)
kubectl apply -f deployment-green.yaml

# Verify health
kubectl rollout status deployment/finance-service-green

# Switch traffic
kubectl patch service finance-service -p '{"spec":{"selector":{"version":"green"}}}'

# Monitor 1 hour → Delete blue
```

### Post-Deployment (30 min)

- [ ] Health checks passing
- [ ] Metrics normal (error rate, latency)
- [ ] Logs clean (no errors)
- [ ] Feature flags enabled
- [ ] Rollback plan tested

---

## 4. Commit Message Format

### Simple Commit
```bash
git commit -m "fix: VAT calculation for Bangladesh (15% standard rate)

- Update VATCalculationService to use correct rate
- Add test for construction materials
- Verified against NBR guidelines

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Checkpoint Commit (Comprehensive)
```bash
git commit -m "feat: Complete payment reconciliation feature

SUMMARY:
Automatic payment-invoice matching with bank statement parsing

FEATURES:
- CSV parser for bank statements
- Automatic matching algorithm
- Discrepancy handling
- Multi-tenant isolation

IMPLEMENTATION:
- 12 files created, 18 files modified
- 45 tests added (467 total, 100% passing)
- 3 domain events, 3 projection handlers

QUALITY:
- Build: ✅ Zero errors
- Tests: ✅ 467/467 passing
- Coverage: ✅ 92% (domain layer)
- Security: ✅ No vulnerabilities
- Performance: ✅ <300ms

REVIEWS:
- kieran-typescript-reviewer: 9.5/10
- security-sentinel: No issues
- performance-oracle: Acceptable

Phase Complete (100%)
Checkpoint: sessions/tasks/done/payment-recon-COMPLETE.md

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 5. Task State Management

### TodoWrite for Planning

**Create todos at task start**:
```typescript
// Example: Invoice-Payment Linking
[
  { content: "Phase 1: Domain events", status: "pending" },
  { content: "Phase 2: Aggregate updates", status: "pending" },
  { content: "Phase 3: GraphQL schema", status: "pending" },
  { content: "Phase 4: Tests", status: "pending" },
  { content: "Phase 5: Quality review", status: "pending" },
]
```

**Update as you work**:
- Mark in_progress when starting
- Mark completed when done
- ONE task in_progress at a time
- Complete before marking (no partial)

### Git for Context

**Branches for features**:
```bash
git checkout -b feature/payment-reconciliation
```

**Commits for milestones**:
```bash
git commit -m "feat: Add ReconciliationService"
git commit -m "test: Add reconciliation tests"
```

**Tags for releases**:
```bash
git tag -a v2.5.0 -m "Payment reconciliation release"
```

---

## 6. Success Metrics

### Target (Finance Task Proven)
- **Time**: 2-5 days (complex features)
- **Quality**: 9-9.5/10
- **Bug rate**: <0.1 per feature
- **Rework**: <5%
- **Test coverage**: 90%+ (domain layer)
- **Pattern consistency**: 100%

### Measurement
```bash
# Quality: Run all gates
pnpm build && npm test

# Coverage: Check domain layer
npm test -- --coverage --testPathPattern=domain

# Performance: Benchmark critical paths
npm run test:performance
```

---

## 7. Rollback Plan

### If Deployment Fails

**Immediate**:
```bash
# Roll back to previous version
kubectl rollout undo deployment/finance-service

# Verify health
kubectl get pods
```

**Database**:
```bash
# Revert migration (if needed)
npm run migration:revert
```

**Feature Flags**:
```bash
# Disable feature
curl -X POST /api/feature-flags/payment-recon/disable
```

---

## Quick Reference

| Workflow Stage | Action | Time | Tools |
|----------------|--------|------|-------|
| **Phase Complete** | Create checkpoint | 30 min | Markdown template |
| **Quality Gates** | Build + test + review | 20-45 min | pnpm, npm, agents |
| **Pre-Deploy** | Security + perf + data review | 1-2 hours | 3-4 agents |
| **Deploy** | Phased rollout | 4-6 hours | Kubernetes, monitoring |
| **Post-Deploy** | Health check + monitor | 30 min | Logs, metrics |

---

**Version**: 3.0.0
**Proven**: Finance task (10 days, 9.5/10 quality, 0 bugs, <5% rework)
**Pattern**: Checkpoint-driven → Quality gates → Phased rollout

**See Also**:
- [Checkpoint-Driven Development](../../workflows/checkpoint-driven.md) - Complete guide
- [Complex Task Workflow](../../workflows/complex-task-workflow.md) - Multi-day pattern
- [Agent Directory](../../agents/AGENT-DIRECTORY.md) - Review agents
