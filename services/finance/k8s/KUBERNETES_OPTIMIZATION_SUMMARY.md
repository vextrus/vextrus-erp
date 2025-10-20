# Kubernetes Deployment Optimization Summary

## Overview
Optimized Kubernetes deployment configurations for Finance Service with EventStore snapshot support and blue-green deployment best practices.

**Updated Files:**
- `07-production-week3-60percent.yaml` - Week 3 canary (60% traffic)
- `09-production-week4-100percent.yaml` - Week 4 full production (100% traffic)

---

## Key Optimizations Applied

### 1. EventStore & Snapshot Configuration

#### Environment Variables Added
```yaml
# Core snapshot settings
SNAPSHOTS_ENABLED: "true"
SNAPSHOT_FREQUENCY: "50"              # Create snapshot every 50 events
SNAPSHOT_RETENTION_COUNT: "3"         # Keep last 3 snapshots (Week 4 only)

# EventStore connection optimization
EVENTSTORE_MAX_RETRY_ATTEMPTS: "5"
EVENTSTORE_RETRY_DELAY_MS: "1000"
EVENTSTORE_CONNECTION_TIMEOUT_MS: "10000"
EVENTSTORE_READ_BATCH_SIZE: "500"
EVENTSTORE_KEEP_ALIVE_INTERVAL: "10000"
EVENTSTORE_KEEP_ALIVE_TIMEOUT: "10000"
```

#### Resource Adjustments for Snapshots
**Week 3 (60%):**
- Memory: `1.5Gi` request / `3Gi` limit (up from 1Gi/2Gi)
- CPU: `600m` request / `1500m` limit (up from 500m/1000m)

**Week 4 (100%):**
- Memory: `1.5Gi` request / `3Gi` limit
- CPU: `600m` request / `1500m` limit
- Added: `NODE_OPTIONS: "--max-old-space-size=2048"` for Node.js heap optimization

#### Probe Adjustments
```yaml
livenessProbe:
  initialDelaySeconds: 60  # Increased from 45s for snapshot init

readinessProbe:
  initialDelaySeconds: 30  # Increased from 20s for snapshot warmup

startupProbe:              # NEW - handles slow snapshot loading
  initialDelaySeconds: 10
  periodSeconds: 10
  failureThreshold: 30     # Allow up to 5 minutes
```

---

### 2. Blue-Green Deployment Best Practices

#### Session Affinity (ClientIP-based)
```yaml
sessionAffinity: ClientIP
sessionAffinityConfig:
  clientIP:
    timeoutSeconds: 10800  # 3 hours for long-running financial operations
```
**Rationale:** Ensures users stay with the same version during canary rollout, preventing version switching mid-session.

#### Deployment Annotations
```yaml
annotations:
  deployment.kubernetes.io/revision: "week3" | "week4-final"
  rollback.target: "stable" | "week3"
  kubernetes.io/change-cause: "Descriptive change reason"
```
**Benefit:** Enables easy rollback with `kubectl rollout undo` and audit trail.

#### Graceful Shutdown
```yaml
terminationGracePeriodSeconds: 60

lifecycle:
  preStop:
    exec:
      command: ["/bin/sh", "-c", "sleep 10"]  # Week 3
      command: ["/bin/sh", "-c", "sleep 15"]  # Week 4
```
**Purpose:**
1. Wait for load balancer to remove pod from rotation
2. Flush in-memory snapshots to EventStore
3. Close EventStore/Kafka connections gracefully
4. Complete in-flight HTTP requests

#### Zero-Downtime Rolling Updates
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 2         # Week 3: allow 2 extra pods
    maxSurge: 3         # Week 4: allow 3 extra pods
    maxUnavailable: 0   # Never remove pods until new ones ready
```

---

### 3. High Availability & Resilience

#### PodDisruptionBudget (PDB)
**Week 3:**
```yaml
minAvailable: 4  # Ensure at least 4 of 6 pods available (67%)
```

**Week 4:**
```yaml
minAvailable: 7  # Ensure at least 7 of 10 pods available (70%)
```
**Protects against:** Voluntary disruptions (node drains, cluster upgrades)

#### Pod Anti-Affinity (Week 4)
```yaml
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - finance-service
        topologyKey: kubernetes.io/hostname
```
**Effect:** Spreads pods across different nodes for fault tolerance.

---

### 4. Autoscaling Optimization

#### Snapshot-Aware HPA Thresholds
**Week 3:**
```yaml
minReplicas: 6
maxReplicas: 12
metrics:
  - cpu: 65%      # Reduced from 70% (snapshot overhead)
  - memory: 75%   # Reduced from 80% (snapshot memory)
```

**Week 4:**
```yaml
minReplicas: 10
maxReplicas: 25   # Higher max for production + snapshots
metrics:
  - cpu: 65%
  - memory: 75%
```

#### Advanced Scaling Behavior
```yaml
behavior:
  scaleUp:
    stabilizationWindowSeconds: 60
    policies:
    - type: Percent
      value: 50  # Scale up by 50% at a time
    - type: Pods
      value: 3   # Or add 3 pods at a time
    selectPolicy: Max  # Use whichever scales faster

  scaleDown:
    stabilizationWindowSeconds: 300  # Wait 5min (conservative)
    policies:
    - type: Pod
      value: 1  # Scale down 1 pod at a time
      periodSeconds: 120  # Wait 2min between scale-downs
```
**Rationale:**
- Fast scale-up for traffic spikes
- Slow scale-down to avoid flapping
- Conservative due to snapshot initialization overhead

---

### 5. Observability & Monitoring

#### Prometheus Annotations
```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "3014"
  prometheus.io/path: "/metrics"
```

#### Snapshot-Specific Labels
```yaml
labels:
  snapshot-enabled: "true"
```
**Enables:** Filtering metrics by snapshot-enabled deployments.

#### ServiceMonitor (Week 4)
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: finance-service-production
spec:
  endpoints:
  - port: http
    path: /metrics
    interval: 15s
    scrapeTimeout: 10s
    relabelings:
    - sourceLabels: [__meta_kubernetes_pod_label_snapshot_enabled]
      targetLabel: snapshot_enabled
```

#### PrometheusRule Alerts (Week 4)
New snapshot-specific alerts:
```yaml
# Critical: Snapshot Creation Failures
- alert: FinanceSnapshotCreationFailures
  expr: rate(eventstore_snapshot_errors_total[5m]) > 0.05

# Warning: High Snapshot Creation Time
- alert: FinanceSnapshotHighLatency
  expr: histogram_quantile(0.95,
    sum(rate(eventstore_snapshot_duration_seconds_bucket[5m])) by (le)
  ) > 2

# Warning: EventStore Connection Issues
- alert: FinanceEventStoreConnectionErrors
  expr: rate(eventstore_connection_errors_total[5m]) > 0.01
```

---

### 6. Production-Grade Configuration

#### Database Connection Pooling (Week 4)
```yaml
DATABASE_POOL_SIZE: "20"
DATABASE_MAX_QUERY_EXECUTION_TIME: "5000"
```

#### Kafka Reliability (Week 4)
```yaml
KAFKA_CLIENT_ID: "finance-service-week4"
KAFKA_RETRY_ATTEMPTS: "5"
KAFKA_RETRY_DELAY_MS: "1000"
```

#### Enhanced Logging & Tracing (Week 4)
```yaml
OTEL_SERVICE_NAME: "finance-service"
OTEL_SERVICE_VERSION: "week4"
LOG_LEVEL: "info"
METRICS_SNAPSHOT_ENABLED: "true"
METRICS_DETAILED_ENABLED: "true"
```

---

## Deployment Strategy Comparison

### Week 3 (60% Canary)
- **Pods:** 6 canary + 4 stable = 10 total
- **Traffic Split:** 60% canary / 40% stable
- **Focus:** RBAC, security hardening, snapshot validation
- **Max Replicas:** 12 (allows 2x scale for validation)

### Week 4 (100% Production)
- **Pods:** 10 production
- **Traffic Split:** 100% production
- **Focus:** Full production hardening, observability, alerting
- **Max Replicas:** 25 (handles 2.5x production load)

---

## Rollback Strategy

### Quick Rollback Commands
```bash
# Rollback Week 4 to Week 3
kubectl rollout undo deployment/finance-service-production -n vextrus-production

# Rollback Week 3 to Stable
kubectl rollout undo deployment/finance-service-week3 -n vextrus-production

# View rollout history
kubectl rollout history deployment/finance-service-production -n vextrus-production

# Rollback to specific revision
kubectl rollout undo deployment/finance-service-production --to-revision=2 -n vextrus-production
```

### Annotations Support Rollback
```yaml
annotations:
  deployment.kubernetes.io/revision: "week4-final"
  rollback.target: "week3"
  kubernetes.io/change-cause: "Descriptive change reason"
```

---

## Performance Considerations

### Snapshot Impact Analysis

#### Memory Overhead
- **Base:** 1Gi → **With Snapshots:** 1.5Gi (50% increase)
- **Reason:** In-memory snapshot buffers before flush to EventStore

#### CPU Overhead
- **Base:** 500m → **With Snapshots:** 600m (20% increase)
- **Reason:** Snapshot serialization, compression, EventStore writes

#### Startup Time
- **Without Snapshots:** ~20s
- **With Snapshots:** ~30-60s (50-200% increase)
- **Mitigation:** Increased `initialDelaySeconds` on probes

#### HPA Threshold Adjustment
- **CPU:** 70% → 65% (accommodate snapshot CPU spikes)
- **Memory:** 80% → 75% (accommodate snapshot memory usage)

---

## Testing Recommendations

### Week 3 Validation Checklist
- [ ] Verify snapshot creation in EventStore
- [ ] Monitor snapshot creation latency (target <1s)
- [ ] Confirm memory usage stays under 2.5Gi
- [ ] Test aggregate rebuild from snapshots
- [ ] Validate graceful shutdown flushes snapshots
- [ ] Compare error rates: canary vs stable
- [ ] Verify session affinity works (user stays on same version)

### Week 4 Production Checklist
- [ ] All Week 3 validations passed
- [ ] Prometheus alerts firing correctly
- [ ] Pod anti-affinity spreading across nodes
- [ ] PDB preventing excessive disruptions
- [ ] HPA scaling up/down appropriately
- [ ] Rollback tested and working
- [ ] Runbooks documented for all alerts

---

## Environment Variables Reference

### Critical for Snapshot Operation
```bash
# Required
SNAPSHOTS_ENABLED=true
SNAPSHOT_FREQUENCY=50

# Recommended (Week 4)
SNAPSHOT_RETENTION_COUNT=3
EVENTSTORE_READ_BATCH_SIZE=500
NODE_OPTIONS=--max-old-space-size=2048

# Monitoring
METRICS_SNAPSHOT_ENABLED=true
```

### EventStore Connection Resilience
```bash
EVENTSTORE_MAX_RETRY_ATTEMPTS=5
EVENTSTORE_RETRY_DELAY_MS=1000
EVENTSTORE_CONNECTION_TIMEOUT_MS=10000
EVENTSTORE_KEEP_ALIVE_INTERVAL=10000
EVENTSTORE_KEEP_ALIVE_TIMEOUT=10000
```

---

## Cost Optimization Notes

### Resource Increase Impact
**Week 3 (6 pods):**
- **Before:** 6 * (1Gi + 500m) = 6Gi + 3000m
- **After:** 6 * (1.5Gi + 600m) = 9Gi + 3600m
- **Increase:** +50% memory, +20% CPU

**Week 4 (10 pods):**
- **Before:** 10 * (1Gi + 500m) = 10Gi + 5000m
- **After:** 10 * (1.5Gi + 600m) = 15Gi + 6000m
- **Increase:** +50% memory, +20% CPU

### Cost-Benefit Analysis
**Benefits:**
- Faster aggregate reconstruction (50-100x improvement)
- Reduced EventStore read load
- Better user experience (lower latency)
- Supports higher event volumes

**Trade-offs:**
- +50% memory cost
- +20% CPU cost
- Snapshot storage in EventStore (minimal)

**Break-even:** ~50+ events per aggregate (Week 4 target: 100+ events)

---

## Security Considerations

### Secrets Management
All sensitive configuration stored in Kubernetes Secrets:
```yaml
secretKeyRef:
  name: finance-db-production        # Database credentials
  name: finance-secrets-production   # JWT, CORS, EventStore
```

### Network Policies (Recommended Addition)
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: finance-service-production
spec:
  podSelector:
    matchLabels:
      app: finance-service
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-gateway
    ports:
    - protocol: TCP
      port: 3014
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: eventstore
    ports:
    - protocol: TCP
      port: 2113
  - to:
    - podSelector:
        matchLabels:
          app: kafka
    ports:
    - protocol: TCP
      port: 9092
```

---

## Next Steps

### Immediate Actions
1. Review and validate YAML syntax
2. Create Kubernetes Secrets if not exist
3. Deploy to staging environment first
4. Monitor snapshot metrics in Grafana

### Week 3 Deployment
```bash
# Deploy Week 3 (60% canary)
kubectl apply -f services/finance/k8s/07-production-week3-60percent.yaml

# Watch rollout
kubectl rollout status deployment/finance-service-week3 -n vextrus-production

# Monitor metrics
kubectl top pods -n vextrus-production -l app=finance-service
```

### Week 4 Deployment (after Week 3 validation)
```bash
# Deploy Week 4 (100% production)
kubectl apply -f services/finance/k8s/09-production-week4-100percent.yaml

# Watch rollout
kubectl rollout status deployment/finance-service-production -n vextrus-production

# Verify snapshot alerts configured
kubectl get prometheusrule -n vextrus-production finance-service-production-alerts
```

---

## Related Documentation
- `services/finance/CLAUDE.md` - Finance service architecture
- `services/finance/DEPLOYMENT_SUMMARY.md` - Week 1 & 2 deployment details
- `services/finance/WEEK1_DEPLOYMENT_COMPLETE.md` - Week 1 completion summary
- `docs/PHASE_2_COMPLETION_SUMMARY.md` - Overall phase 2 status

---

**Last Updated:** 2025-10-17
**Optimized By:** Kubernetes Architect (Claude Code)
**Review Status:** Ready for deployment validation
