# performance-oracle Agent Card

**Type**: Performance Optimization
**Model**: Sonnet 4.5
**When**: Caching, queries, optimization, scalability

---

## Quick Invocation

```
I'm running performance-oracle agent to analyze performance.

Scope: [caching/queries/optimization]
Files: [list files]
Target: <300ms response time, efficient queries

[Use Task tool with subagent_type=compounding-engineering:performance-oracle]
```

---

## What It Does

Analyzes:
- Database query performance
- Caching strategies
- N+1 query problems
- Memory usage
- Response times
- Scalability bottlenecks
- Algorithm efficiency

---

## Use Cases

### ALWAYS Review When
- ✅ Adding caching (Redis, DataLoader)
- ✅ Complex database queries
- ✅ List/pagination endpoints
- ✅ Bulk operations
- ✅ Report generation
- ✅ Search functionality

### Skip When
- ❌ Simple CRUD operations
- ❌ Cached queries (already optimized)
- ❌ Non-critical background jobs

---

## Typical Output

```
⚡ Performance Analysis Complete

Metrics:
- Average Response Time: 245ms ✅ Target: <300ms
- Database Queries: 12 queries, 1 N+1 detected ⚠️
- Cache Hit Rate: 85% ✅ Target: >80%
- Memory Usage: Acceptable

Bottlenecks Found:

HIGH Priority:
- get-invoices.query.ts:34 - N+1 query loading customers
  Impact: 500ms for 100 invoices
  Fix: Use DataLoader or JOIN query

MEDIUM Priority:
- trial-balance.query.ts:56 - No caching for trial balance
  Impact: 1.2s for 10k accounts
  Fix: Add Redis cache with 30min TTL

Optimizations:
- ✅ Using DataLoader for account lookups
- ✅ Pagination implemented correctly
- ⚠️ Consider adding database indexes on customer_id

Status: ⚠️ FIX HIGH ISSUES FOR OPTIMAL PERFORMANCE
```

---

## Performance Targets

### Response Times
- **Simple queries**: <100ms
- **Complex queries**: <300ms
- **Reports**: <1s
- **Bulk operations**: <5s

### Database
- **N+1 queries**: 0 (use DataLoader/JOINs)
- **Index usage**: >90%
- **Query count**: <20 per request

### Caching
- **Hit rate**: >80%
- **TTL**: Appropriate for data volatility
- **Cache invalidation**: On writes

---

## Integration with Workflow

```
1. Implement feature with queries/caching
2. Run kieran-typescript-reviewer (code quality)
3. Run performance-oracle ← HERE
4. Fix High priority issues
5. Validate metrics (response time <300ms)
6. Create checkpoint
7. Commit
```

---

## Checklist

- [ ] Performance-sensitive code identified
- [ ] Agent invoked with scope
- [ ] Bottlenecks documented
- [ ] High priority issues fixed
- [ ] Metrics validated (<300ms, no N+1)
- [ ] Caching strategy confirmed
- [ ] Ready for deployment
