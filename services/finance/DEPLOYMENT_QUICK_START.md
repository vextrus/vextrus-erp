# Finance Service Week 1 - Quick Start Deployment

**Ready to Deploy**: ✅ All security fixes complete, infrastructure ready
**Deployment Time**: ~45 minutes total
**Strategy**: 10% canary traffic split

---

## Prerequisites

Before starting, ensure you have:
- [ ] Kubernetes cluster access (`kubectl cluster-info`)
- [ ] Docker installed and running
- [ ] Docker registry credentials configured
- [ ] JWT tokens for staging and production

---

## Deployment Workflow (3 Simple Steps)

### Step 1: Pre-Flight Verification (2 minutes)

Run the pre-deployment checklist to verify all prerequisites:

```bash
cd services/finance/k8s
./00-pre-deployment-checklist.sh
```

**Expected Output**: `✅ ALL CHECKS PASSED`

If checks fail, the script will provide specific guidance on what to fix.

**Common Setup Tasks**:

```bash
# Create namespaces (if needed)
kubectl create namespace vextrus-staging
kubectl create namespace vextrus-production

# Create staging secrets
kubectl create secret generic finance-db-staging -n vextrus-staging \
  --from-literal=host=postgres-staging.vextrus.svc.cluster.local \
  --from-literal=username=finance_user \
  --from-literal=password=<SECURE_PASSWORD>

kubectl create secret generic finance-secrets-staging -n vextrus-staging \
  --from-literal=jwt-secret=<JWT_SECRET> \
  --from-literal=eventstore-connection=esdb://eventstore-staging:2113?tls=false

# Create production secrets
kubectl create secret generic finance-db-production -n vextrus-production \
  --from-literal=host=postgres-production.vextrus.svc.cluster.local \
  --from-literal=username=finance_user \
  --from-literal=password=<PRODUCTION_PASSWORD>

kubectl create secret generic finance-secrets-production -n vextrus-production \
  --from-literal=jwt-secret=<PRODUCTION_JWT_SECRET> \
  --from-literal=cors-origin=https://vextrus.com,https://app.vextrus.com \
  --from-literal=eventstore-connection=esdb://eventstore-production:2113?tls=true
```

---

### Step 2: Execute Deployment (35 minutes)

**Set Environment Variables**:

```bash
# Required for smoke tests
export STAGING_JWT_TOKEN="<your-staging-jwt-token>"
export PROD_JWT_TOKEN="<your-production-jwt-token>"

# Optional: Custom Docker registry
export DOCKER_REGISTRY="your-registry.io/vextrus"
```

**Run Deployment**:

```bash
cd services/finance/k8s
./deploy-week1.sh
```

**What This Does**:
1. ✅ Builds production Docker image
2. ✅ Pushes to registry
3. ✅ Deploys to staging
4. ✅ Runs staging smoke tests
5. ✅ Deploys to production (10% canary)
6. ✅ Runs production smoke tests
7. ✅ Configures monitoring

The script will pause before production deployment to give you a chance to review staging results.

**Expected Duration**:
- Phase 1 (Build): ~5 minutes
- Phase 2 (Staging): ~10 minutes
- Phase 3 (Staging Tests): ~5 minutes
- Phase 4 (Production): ~15 minutes
- Phase 5 (Production Tests): ~5 minutes

---

### Step 3: Monitor (48 hours)

After successful deployment, monitor the canary:

**Monitoring Dashboard**:
```
https://grafana.vextrus.com/d/finance-week1
```

**Key Metrics to Watch**:
- ✅ Error rate: <0.5% (target)
- ✅ P95 latency: <500ms (target)
- ✅ Pod restarts: 0
- ✅ Memory usage: <85%

**Check Pod Status**:
```bash
# Watch pod health
kubectl get pods -n vextrus-production -l app=finance-service

# Check canary logs
kubectl logs -f deployment/finance-service-week1 -n vextrus-production

# View metrics
kubectl top pods -n vextrus-production -l version=week1
```

**Monitoring Schedule**:
- **Hour 0-6**: Check every 15-30 minutes
- **Hour 6-24**: Check every hour
- **Hour 24-48**: Check every 2 hours

---

## Emergency Rollback

If issues are detected, immediately rollback:

```bash
cd services/finance/k8s
./rollback-week1.sh
```

**Rollback Options**:
1. Scale down canary (keeps for investigation)
2. Delete canary completely
3. Rollback to previous version

**Rollback Time**: ~5 minutes

---

## Success Criteria (After 48 Hours)

- [x] ✅ 0 critical security vulnerabilities
- [ ] Error rate <0.5% sustained
- [ ] P95 latency <500ms sustained
- [ ] 0 production incidents
- [ ] 0 rollbacks required
- [ ] Customer satisfaction maintained

**If all criteria met**: Proceed to Week 2 (30% traffic)
**If criteria not met**: Extend monitoring, investigate, remediate

---

## Troubleshooting

### Issue: Pre-flight checks fail

**Solution**: Run the checklist script, it will tell you exactly what's missing:
```bash
./00-pre-deployment-checklist.sh
```

### Issue: Docker build fails

**Check**:
```bash
cd services/finance
docker build -t test -f Dockerfile --target production .
```

### Issue: Staging smoke tests fail

**Check logs**:
```bash
kubectl logs -f deployment/finance-service-staging -n vextrus-staging
```

**Common causes**:
- Missing secrets
- Database connectivity issues
- EventStore not accessible

### Issue: High error rate in production

**Immediate action**:
```bash
./rollback-week1.sh
```

Then investigate:
```bash
kubectl logs deployment/finance-service-week1 -n vextrus-production | grep ERROR
kubectl get events -n vextrus-production --sort-by='.lastTimestamp'
```

---

## Manual Deployment (Alternative)

If you prefer step-by-step manual deployment, follow:

```
k8s/DEPLOYMENT_GUIDE.md
```

This provides detailed instructions for each phase with validation steps.

---

## Files Reference

### Created Deployment Assets

```
k8s/
├── 00-pre-deployment-checklist.sh  ← Verify prerequisites
├── deploy-week1.sh                 ← Automated deployment
├── rollback-week1.sh               ← Emergency rollback
├── 04-smoke-tests.sh               ← Test suite
├── 01-staging-deployment.yaml      ← Staging config
├── 02-production-week1-canary.yaml ← Production canary
├── 03-monitoring-serviceMonitor.yaml ← Monitoring setup
└── DEPLOYMENT_GUIDE.md             ← Detailed manual
```

### Security Audit Reports

```
SECURITY_AUDIT_REPORT.md    ← Complete security analysis (650+ lines)
WEEK1_DEPLOYMENT_READY.md   ← Executive summary
```

---

## Week 2+ Roadmap

After successful Week 1 (48 hours stable):

- **Week 2**: 30% traffic (3 canary pods, 7 stable)
- **Week 3**: 60% traffic (6 canary pods, 4 stable)
- **Week 4**: 100% traffic (all canary, phase out stable)

Each week requires 48-hour monitoring before progression.

---

## Support

**Documentation**:
- Detailed guide: `k8s/DEPLOYMENT_GUIDE.md`
- Security report: `SECURITY_AUDIT_REPORT.md`

**Deployment Team**: devops@vextrus.com
**On-Call Engineer**: [Check PagerDuty]
**Runbook**: https://runbooks.vextrus.com/finance-deployment

---

**Prepared**: 2025-10-16
**Version**: Week 1 - 10% Traffic
**Security Fixes**: eval(), CSRF, CORS, credentials
**Status**: ✅ READY FOR EXECUTION
