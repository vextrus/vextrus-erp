# Production Deployment Guide

**v4.0 Deployment Automation** - One-click deployments with automated quality gates

---

## Quick Deployment

```bash
# Automated deployment workflow
gh workflow run deploy-automated.yml

# Monitor deployment
gh run watch
```

**Prerequisites**:
- All quality gates passing (pre-commit + PR)
- Approved PR merged to main
- Production environment configured

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (`npm test`)
- [ ] Zero TypeScript errors (`pnpm build`)
- [ ] Quality score ≥9.0/10 (from PR review)
- [ ] Security scan passed (`security-sentinel` review)
- [ ] Performance validated (<300ms response time)
- [ ] Database migrations tested (staging)
- [ ] Environment variables configured

### Deployment
- [ ] Create release tag (`v1.x.x`)
- [ ] Trigger deployment workflow
- [ ] Monitor deployment progress
- [ ] Verify smoke tests pass
- [ ] Check logs for errors

### Post-Deployment
- [ ] Smoke tests (`gh workflow run smoke-tests.yml`)
- [ ] Monitor metrics (5 min post-deploy)
- [ ] Verify key endpoints responding
- [ ] Check database connections
- [ ] Validate Kafka connectivity

---

## Rollback Procedure

If deployment fails:

```bash
# Automatic rollback (within 5 min window)
gh workflow run rollback.yml --ref main

# Manual rollback
git revert HEAD
git push origin main
gh workflow run deploy-automated.yml
```

**Rollback triggers**:
- Smoke tests fail
- Error rate >1%
- Response time >500ms
- Database connection errors

---

## Monitoring

**Prometheus Metrics**: http://prometheus.vextrus.com
**Grafana Dashboards**: http://grafana.vextrus.com
**Logs**: ELK stack (Elasticsearch, Logstash, Kibana)

**Key Metrics**:
- Request rate (requests/second)
- Error rate (% of requests)
- Response time (p50, p95, p99)
- Database connections (active/idle)

**Alerts** (PagerDuty):
- Error rate >1% (critical)
- Response time >500ms (warning)
- Database down (critical)
- Kafka down (critical)

---

## See Also

- `.github/workflows/deploy-automated.yml` - Automated deployment workflow
- `setup-github-actions.md` - GitHub Actions configuration
- `.claude/deployment/environments.md` - Environment setup (dev, staging, prod)
