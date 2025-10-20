---
task: h-implement-production-phased-rollout-week2
parent: h-implement-production-phased-rollout
branch: feature/production-phased-rollout-week2
status: pending
created: 2025-10-16
week: 2
estimated_hours: 10
dependencies: [01-week1-security-fixes]
---

# Week 2: Performance Optimization + Scale to 30%

## Goal
Fix N+1 query problem and implement Redis caching to achieve <300ms P95 response times at 30 concurrent users.

## Success Criteria
- [ ] Implement DataLoader pattern for Master Data lookups (N+1 fix)
- [ ] Implement Redis caching with 70%+ cache hit rate
- [ ] Add Master Data batch endpoints (getVendorsBatch, getCustomersBatch)
- [ ] Load test: 30 concurrent users, P95 <300ms
- [ ] Scale to 30% of users successfully
- [ ] Monitor for 48 hours: error rate <0.5%, cache hit >70%

## Key Tasks

### 1. Implement DataLoader Pattern (6 hours)
**Files**:
- `invoice-projection.handler.ts`
- `master-data.client.ts`

**Changes**:
- Add DataLoader for vendor/customer lookups
- Batch HTTP requests to Master Data service
- Reduce 200 calls → 2 calls for 100 invoices

**Expected Impact**: 10x faster event projection (200ms → 20ms per invoice)

### 2. Implement Redis Caching (4 hours)
**Files**:
- Create `src/infrastructure/cache/cache.interceptor.ts`
- Update `invoice.resolver.ts`, `payment.resolver.ts`

**Caching Strategy**:
- Master Data lookups: 5 minutes TTL
- Invoice lists: 1 minute TTL
- Account hierarchy: 10 minutes TTL

**Expected Impact**: 5-10x faster for cached queries, 60-70% database load reduction

### 3. Load Testing
```bash
k6 run --vus 30 --duration 5m load-test-finance.js
```

**Target Metrics**:
- P95 latency: <300ms
- P99 latency: <500ms
- Error rate: <0.5%
- Cache hit rate: >70%

## Deployment
- Deploy to production with 30% traffic split
- Monitor for 48 hours
- Validate performance improvements

## Quality Gates
- [ ] Load test passed (30 users, P95 <300ms)
- [ ] Cache hit rate >70%
- [ ] 30% deployment successful
- [ ] 48-hour stability confirmed
- [ ] Ready for Week 3
