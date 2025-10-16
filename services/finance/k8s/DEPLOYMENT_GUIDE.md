# Finance Service Week 1 Deployment Guide

**Deployment Date**: 2025-10-16
**Security Fixes**: eval(), CSRF, CORS, Hardcoded Credentials
**Strategy**: Phased Rollout (10% → 30% → 60% → 100%)
**Week 1 Target**: 10% of production traffic

---

## Pre-Deployment Checklist

### 1. Security Validation
- [x] All 4 critical vulnerabilities fixed
- [x] Security audit completed (Score: 85/100)
- [x] 0 critical/high security issues
- [x] Build succeeds with no errors

### 2. Environment Preparation
- [ ] Kubernetes cluster access verified
- [ ] Docker registry credentials configured
- [ ] Secrets created in K8s (database, JWT, EventStore, etc.)
- [ ] Monitoring stack operational (Prometheus, Grafana, SigNoz)
- [ ] Staging environment available

### 3. Rollback Preparation
- [ ] Current stable version documented
- [ ] Rollback scripts tested
- [ ] Database backup completed
- [ ] EventStore backup verified

---

## Deployment Steps

### Phase 1: Build Docker Image (5 minutes)

```bash
# Navigate to finance service
cd services/finance

# Build production-optimized image
docker build -t vextrus/finance:week1-prod -f Dockerfile --target production .

# Tag for registry
docker tag vextrus/finance:week1-prod <your-registry>/vextrus/finance:week1-prod

# Push to registry
docker push <your-registry>/vextrus/finance:week1-prod
```

**Validation**:
```bash
# Verify image in registry
docker pull <your-registry>/vextrus/finance:week1-prod
docker inspect <your-registry>/vextrus/finance:week1-prod
```

---

### Phase 2: Deploy to Staging (10 minutes)

```bash
# Create staging namespace (if not exists)
kubectl create namespace vextrus-staging

# Create secrets (IMPORTANT: Replace with actual values)
kubectl create secret generic finance-db-staging -n vextrus-staging \
  --from-literal=host=postgres-staging.vextrus.svc.cluster.local \
  --from-literal=username=finance_user \
  --from-literal=password=<SECURE_PASSWORD>

kubectl create secret generic finance-secrets-staging -n vextrus-staging \
  --from-literal=jwt-secret=<JWT_SECRET> \
  --from-literal=eventstore-connection=esdb://eventstore-staging:2113?tls=false

# Deploy to staging
kubectl apply -f k8s/01-staging-deployment.yaml

# Wait for rollout
kubectl rollout status deployment/finance-service-staging -n vextrus-staging
```

**Validation**:
```bash
# Check pod status
kubectl get pods -n vextrus-staging -l app=finance-service

# Check logs
kubectl logs -f deployment/finance-service-staging -n vextrus-staging

# Port forward for local testing
kubectl port-forward -n vextrus-staging svc/finance-service-staging 3014:80
```

---

### Phase 3: Run Smoke Tests on Staging (5 minutes)

```bash
# Set staging JWT token
export STAGING_JWT_TOKEN="<your-staging-jwt-token>"

# Run smoke tests
chmod +x k8s/04-smoke-tests.sh
./k8s/04-smoke-tests.sh staging
```

**Expected Output**:
```
================================
SMOKE TEST SUMMARY
================================
Total Tests: 12
Passed: 12
Failed: 0
================================
✅ ALL SMOKE TESTS PASSED
Deployment is healthy!
================================
```

**If Tests Fail**:
- Review logs: `kubectl logs -f deployment/finance-service-staging -n vextrus-staging`
- Check secrets: `kubectl get secrets -n vextrus-staging`
- Verify environment variables
- DO NOT proceed to production

---

### Phase 4: Production Deployment - 10% Traffic (15 minutes)

#### Step 1: Create Production Secrets

```bash
# Create production namespace (if not exists)
kubectl create namespace vextrus-production

# Create secrets (IMPORTANT: Use production-grade secrets)
kubectl create secret generic finance-db-production -n vextrus-production \
  --from-literal=host=postgres-production.vextrus.svc.cluster.local \
  --from-literal=username=finance_user \
  --from-literal=password=<PRODUCTION_PASSWORD>

kubectl create secret generic finance-secrets-production -n vextrus-production \
  --from-literal=jwt-secret=<PRODUCTION_JWT_SECRET> \
  --from-literal=cors-origin=https://vextrus.com,https://app.vextrus.com \
  --from-literal=eventstore-connection=esdb://eventstore-production:2113?tls=true
```

#### Step 2: Deploy Canary (10% traffic)

```bash
# Deploy both stable (90%) and canary (10%)
kubectl apply -f k8s/02-production-week1-canary.yaml

# Wait for canary rollout
kubectl rollout status deployment/finance-service-week1 -n vextrus-production

# Verify pod distribution
kubectl get pods -n vextrus-production -l app=finance-service
```

**Expected Pod Distribution**:
```
NAME                                      READY   STATUS
finance-service-stable-xxx-1              1/1     Running    (90% traffic)
finance-service-stable-xxx-2              1/1     Running    (90% traffic)
finance-service-stable-xxx-3              1/1     Running    (90% traffic)
...
finance-service-stable-xxx-9              1/1     Running    (90% traffic)
finance-service-week1-xxx-1               1/1     Running    (10% traffic)
```

#### Step 3: Setup Monitoring

```bash
# Deploy monitoring stack
kubectl apply -f k8s/03-monitoring-serviceMonitor.yaml

# Verify Prometheus scraping
kubectl get servicemonitor -n vextrus-production finance-service-week1

# Check Grafana dashboard
# Navigate to: https://grafana.vextrus.com/d/finance-week1
```

#### Step 4: Run Production Smoke Tests

```bash
# Set production JWT token
export PROD_JWT_TOKEN="<your-production-jwt-token>"

# Run smoke tests against canary pods
./k8s/04-smoke-tests.sh production
```

---

### Phase 5: 48-Hour Monitoring (Ongoing)

**Key Metrics to Monitor**:

1. **Error Rate** (Target: <0.5%)
   ```promql
   # Canary error rate
   (sum(rate(http_requests_total{track="canary",code=~"5.."}[5m]))
   /
   sum(rate(http_requests_total{track="canary"}[5m]))) * 100
   ```

2. **P95 Latency** (Target: <500ms)
   ```promql
   # Canary P95 latency
   histogram_quantile(0.95,
     sum(rate(http_request_duration_seconds_bucket{track="canary"}[5m])) by (le)
   )
   ```

3. **Pod Health**
   ```bash
   # Check pod status every 15 minutes
   watch -n 900 'kubectl get pods -n vextrus-production -l version=week1'
   ```

4. **Resource Usage**
   ```bash
   # Monitor CPU/Memory
   kubectl top pods -n vextrus-production -l version=week1
   ```

**Alerting Thresholds**:
- **Critical**: Error rate >1% for 5 minutes → Auto-rollback
- **Critical**: P95 latency >500ms for 5 minutes → Manual review
- **Warning**: Pod restarts >0 in 15 minutes → Investigate

**Monitoring Checklist**:
- [ ] Hour 1: Check every 15 minutes
- [ ] Hour 2-6: Check every 30 minutes
- [ ] Hour 6-24: Check every hour
- [ ] Hour 24-48: Check every 2 hours
- [ ] After 48h: Standard monitoring (every 4 hours)

---

## Rollback Procedures

### Automatic Rollback Triggers

Prometheus alerts will trigger automatic rollback if:
- Error rate >1% for 5 minutes
- Pod crash loop detected
- Health checks failing

### Manual Rollback (5 minutes)

#### Option 1: Scale Down Canary

```bash
# Reduce canary to 0 replicas (keeps deployment for investigation)
kubectl scale deployment/finance-service-week1 -n vextrus-production --replicas=0

# Verify traffic to stable only
kubectl get pods -n vextrus-production -l app=finance-service
```

#### Option 2: Delete Canary Deployment

```bash
# Complete rollback - remove canary
kubectl delete deployment finance-service-week1 -n vextrus-production

# Verify only stable version running
kubectl get deployments -n vextrus-production
```

#### Option 3: Rollback to Previous Version

```bash
# Use kubectl rollout undo
kubectl rollout undo deployment/finance-service-week1 -n vextrus-production

# Or specify revision
kubectl rollout undo deployment/finance-service-week1 --to-revision=1 -n vextrus-production
```

### Post-Rollback Actions

1. **Verify Stability**:
   ```bash
   # Check error rate returned to normal
   ./k8s/04-smoke-tests.sh production

   # Monitor for 30 minutes
   watch -n 60 'kubectl get pods -n vextrus-production'
   ```

2. **Investigate Root Cause**:
   ```bash
   # Collect logs from failed canary
   kubectl logs -n vextrus-production -l version=week1 --previous > week1-failure-logs.txt

   # Check events
   kubectl get events -n vextrus-production --sort-by='.lastTimestamp'
   ```

3. **Update Team**:
   - Notify team of rollback
   - Document failure reason
   - Plan remediation
   - Schedule retry deployment

---

## Success Criteria - Week 1

After 48 hours of stable operation:

- [x] 0 critical security vulnerabilities
- [ ] Error rate <0.5% sustained
- [ ] P95 latency <500ms sustained
- [ ] 0 production incidents
- [ ] 0 rollbacks required
- [ ] Customer satisfaction maintained

**If all criteria met**: Proceed to Week 2 (30% traffic split)

**If criteria not met**:
- Extend monitoring period by 24 hours
- Investigate and fix issues
- Retry deployment after fixes

---

## Troubleshooting

### Issue: Pods Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n vextrus-production

# Check logs
kubectl logs <pod-name> -n vextrus-production

# Common causes:
# - Missing secrets
# - Image pull errors
# - Resource limits too low
# - Environment variable validation failing
```

### Issue: High Error Rate

```bash
# Check application logs
kubectl logs -f deployment/finance-service-week1 -n vextrus-production | grep ERROR

# Check database connectivity
kubectl exec -it <pod-name> -n vextrus-production -- curl postgres-production:5432

# Check EventStore connectivity
kubectl exec -it <pod-name> -n vextrus-production -- curl eventstore-production:2113
```

### Issue: High Latency

```bash
# Check resource usage
kubectl top pods -n vextrus-production -l version=week1

# Check database query performance
# Review application metrics in Grafana

# Consider:
# - Database connection pool size
# - N+1 query issues
# - External service timeouts
```

---

## Post-Deployment

### Documentation

- [ ] Update deployment log
- [ ] Document any issues encountered
- [ ] Update runbooks if new issues found
- [ ] Capture metrics screenshots

### Next Steps

After successful 48-hour monitoring:
1. Review Week 1 metrics
2. Plan Week 2 deployment (30% traffic)
3. Update deployment manifests for 30% split
4. Schedule Week 2 deployment

---

## Contact & Support

**Deployment Team**: devops@vextrus.com
**On-Call Engineer**: [Check PagerDuty]
**Runbook**: https://runbooks.vextrus.com/finance-deployment
**Monitoring**: https://grafana.vextrus.com/d/finance-week1

---

**Prepared**: 2025-10-16
**Version**: Week 1 - 10% Traffic
**Next Review**: 2025-10-18 (48 hours after deployment)
