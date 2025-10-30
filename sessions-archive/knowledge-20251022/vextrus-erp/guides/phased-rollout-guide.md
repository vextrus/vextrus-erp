# Phased Rollout Guide

**Source**: Production Deployment Skill
**Purpose**: Safe production deployments for Vextrus ERP

---

## Vextrus ERP Standard Strategy

```
Week 1:  20% traffic → Early adopters, monitoring baseline
Week 2:  50% traffic → Expand, validate performance
Week 3:  80% traffic → Near-full deployment
Week 4: 100% traffic → Complete rollout

Rollback trigger: Any critical metric degradation
```

---

## Week-by-Week Deployment

### Week 1: 20% (Early Adopters)

**Kubernetes Manifest**: `k8s/03-production-week1-20percent.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finance-service-v2
spec:
  replicas: 1  # 20% of total capacity (5 pods = 100%)
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0  # Zero downtime requirement
```

**Monitoring Focus**:
- Error rate <1%
- Response time <300ms (p95)
- CPU usage <70%
- Memory usage <80%

**Rollback Condition**: Any metric exceeds threshold

### Week 2: 50% (Expand)

**Kubernetes Manifest**: `k8s/05-production-week2-50percent.yaml`

```yaml
spec:
  replicas: 3  # 50% capacity
```

**Monitoring Focus**:
- Database query performance
- External API latency
- Cache hit rate
- Queue processing time

### Week 3: 80% (Near-Full)

**Kubernetes Manifest**: `k8s/07-production-week3-80percent.yaml`

```yaml
spec:
  replicas: 4  # 80% capacity
```

**Monitoring Focus**:
- Peak load handling
- Resource scaling behavior
- Error recovery
- Data consistency

### Week 4: 100% (Complete)

**Kubernetes Manifest**: `k8s/09-production-week4-100percent.yaml`

```yaml
spec:
  replicas: 5  # Full capacity
```

**Monitoring Focus**:
- Full production load
- Cost optimization
- Performance trends
- Capacity planning

---

## Three-Tier Health Checks

### Tier 1: Liveness Probe

**Purpose**: Container orchestration (K8s restarts if fails)

```typescript
@Get('/health/live')
@Public()
async checkLiveness(): Promise<HealthResponse> {
  return {
    status: 'alive',
    uptime: process.uptime(),
    memory: process.memoryUsage().heapUsed,
    timestamp: new Date().toISOString(),
  };
}
```

**Kubernetes Config**:
```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

### Tier 2: Readiness Probe

**Purpose**: Load balancer traffic routing (K8s removes from service if fails)

```typescript
@Get('/health/ready')
@Public()
async checkReadiness(): Promise<ReadinessResponse> {
  const checks = await Promise.all([
    this.checkDatabase(),
    this.checkRedis(),
    this.checkKafka(),
    this.checkEventStore(),
  ]);

  const allReady = checks.every(check => check.status === 'ready');

  return {
    status: allReady ? 'ready' : 'not_ready',
    checks: {
      database: checks[0].status,
      redis: checks[1].status,
      kafka: checks[2].status,
      eventstore: checks[3]?.status,
    },
    timestamp: new Date().toISOString(),
  };
}
```

**Kubernetes Config**:
```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  successThreshold: 1
  failureThreshold: 3
```

### Tier 3: Comprehensive Health

**Purpose**: Monitoring dashboards, detailed diagnostics

```typescript
@Get('/health')
@UseGuards(JwtAuthGuard, RbacGuard)
@RequirePermissions('admin:monitoring')
async checkHealth(): Promise<ComprehensiveHealthResponse> {
  return {
    status: 'healthy',
    version: process.env.APP_VERSION,
    environment: process.env.NODE_ENV,
    dependencies: {
      database: await this.checkDatabaseDetailed(),
      redis: await this.checkRedisDetailed(),
      kafka: await this.checkKafkaDetailed(),
      eventstore: await this.checkEventStoreDetailed(),
      externalAPIs: await this.checkExternalAPIs(),
    },
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
    timestamp: new Date().toISOString(),
  };
}
```

---

## Rollback Procedure

### When to Rollback

**Immediate Rollback If**:
- Error rate >5%
- Response time >1000ms (p95)
- CPU usage >90%
- Database connection failures
- Critical business flow failures

### How to Rollback

```bash
# 1. Scale down new deployment to 0
kubectl scale deployment finance-service-v2 --replicas=0

# 2. Scale up old deployment
kubectl scale deployment finance-service-v1 --replicas=5

# 3. Verify old version serving traffic
kubectl get pods
kubectl logs -f deployment/finance-service-v1

# 4. Monitor metrics
# Check error rate, response time return to normal
```

---

## Monitoring During Rollout

### Key Metrics

```yaml
# Grafana Dashboard: Production Rollout Monitoring

Error Rate:
  - Alert if >1% (Week 1)
  - Alert if >2% (Weeks 2-4)

Response Time (p95):
  - Alert if >300ms (Week 1)
  - Alert if >500ms (Weeks 2-4)

Database Queries:
  - Alert if >100ms (p95)

External API Calls:
  - Alert if >1000ms (p95)

CPU Usage:
  - Warn if >70%
  - Alert if >85%

Memory Usage:
  - Warn if >80%
  - Alert if >90%
```

### Alerts

```yaml
# AlertManager Config

- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
  for: 5m
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value }} (threshold: 1%)"

- alert: SlowResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.3
  for: 5m
  annotations:
    summary: "Slow response time detected"
    description: "P95 response time is {{ $value }}s (threshold: 300ms)"
```

---

## Pre-Deployment Checklist

Before Week 1 deployment:

- [ ] Health check endpoints implemented
- [ ] Monitoring dashboards configured
- [ ] Alerts configured
- [ ] Rollback procedure documented and tested
- [ ] On-call team notified
- [ ] Deployment window scheduled (low-traffic hours)
- [ ] Database migrations completed
- [ ] Feature flags configured (if needed)
- [ ] Load testing passed
- [ ] Security scan passed

---

## Post-Deployment Tasks

After each week:

- [ ] Review error logs
- [ ] Analyze performance metrics
- [ ] Check resource utilization
- [ ] Verify business metrics (transactions processed, revenue, etc.)
- [ ] Update team on progress
- [ ] Document any issues encountered
- [ ] Decide: Proceed to next week or rollback?

---

**See Also**:
- `.claude/skills/production-deployment/SKILL.md` - Complete deployment patterns
- `services/finance/k8s/` - Production Kubernetes manifests
- `docs/guides/FRONTEND_INTEGRATION_GUIDE.md` - Frontend integration
