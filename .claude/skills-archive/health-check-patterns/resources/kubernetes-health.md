# Kubernetes Health Check Configuration

**Purpose**: Production-ready Kubernetes probe configurations for Vextrus ERP microservices.

---

## Probe Configuration Reference

### Complete Deployment Example (Finance Service)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finance-service
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: finance
  template:
    metadata:
      labels:
        app: finance
        version: v1.0.0
    spec:
      containers:
      - name: finance
        image: finance-service:v1.0.0
        ports:
        - containerPort: 3014
          name: http
          protocol: TCP

        # Startup Probe: Allow 150s for initialization
        startupProbe:
          httpGet:
            path: /health/startup
            port: 3014
            scheme: HTTP
          initialDelaySeconds: 0
          periodSeconds: 5
          timeoutSeconds: 3
          successThreshold: 1
          failureThreshold: 30  # 30 * 5s = 150s max startup

        # Liveness Probe: Detect deadlocks/crashes
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3014
            scheme: HTTP
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 3
          successThreshold: 1
          failureThreshold: 3   # Restart after 3 failures (30s)

        # Readiness Probe: Check dependencies
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3014
            scheme: HTTP
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          successThreshold: 1
          failureThreshold: 2   # Remove from LB after 2 failures (10s)

        # Resource limits (for memory health checks)
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

        # Graceful shutdown
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 5"]

      # Allow 30 seconds for graceful shutdown
      terminationGracePeriodSeconds: 30

      # Restart policy
      restartPolicy: Always
```

---

## Probe Type Selection

### When to Use Startup Probe

**Use if**:
- Database migrations run on startup
- Cache warming takes >10 seconds
- EventStore connection is slow
- External service validation needed

**Don't use if**:
- App starts in <5 seconds
- No heavy initialization tasks

**Example**: Finance service with migrations

```yaml
startupProbe:
  httpGet:
    path: /health/startup
    port: 3014
  periodSeconds: 5
  failureThreshold: 30  # 150s total (migrations + EventStore)
```

---

### When to Use Liveness Probe

**Always use** - Detects:
- Process deadlocks
- Infinite loops
- Memory leaks (if memory health indicator fails)
- Thread exhaustion

**Never check**:
- Database connectivity (temporary DB down shouldn't restart container)
- External services
- Network issues

**Example**: Minimal liveness

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3014
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3
```

---

### When to Use Readiness Probe

**Always use** - Detects:
- Database unavailable
- EventStore disconnected
- Kafka broker down
- Required external services unhealthy

**Consider graceful degradation**:
- Optional external services (Master Data, Auth) → mark "degraded" not "down"

**Example**: Comprehensive readiness

```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3014
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 2  # Quick removal from LB
```

---

## Timeout & Failure Threshold Tuning

### Recommended Values

```yaml
# Fast services (REST API, simple queries)
startupProbe:
  periodSeconds: 5
  failureThreshold: 12   # 60s total

livenessProbe:
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3    # 30s until restart

readinessProbe:
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2    # 10s until traffic removal

# Slow services (complex queries, heavy processing)
startupProbe:
  periodSeconds: 10
  failureThreshold: 30   # 300s total

livenessProbe:
  periodSeconds: 15
  timeoutSeconds: 5
  failureThreshold: 3    # 45s until restart

readinessProbe:
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3    # 30s until traffic removal
```

---

## Multi-Container Pods

**Pattern**: Sidecar containers with separate health checks

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      # Main application
      - name: finance
        image: finance-service:v1.0.0
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3014

      # Sidecar: Envoy proxy (service mesh)
      - name: envoy
        image: envoyproxy/envoy:v1.25.0
        livenessProbe:
          httpGet:
            path: /ready
            port: 15021  # Envoy admin port
```

**Evidence from Vextrus ERP**:
- No sidecars currently
- Opportunity: Add Istio/Envoy for Federation gateway

---

## Probe Failure Handling

### Container Restart Flow (Liveness Failure)

```
1. Liveness probe fails (3 consecutive failures)
2. Kubernetes sends SIGTERM to container
3. Container has terminationGracePeriodSeconds (30s) to shut down
4. If still running, Kubernetes sends SIGKILL
5. New container created
6. Startup probe runs
7. Once startup succeeds, liveness/readiness begin
```

### Load Balancer Removal (Readiness Failure)

```
1. Readiness probe fails (2 consecutive failures)
2. Pod marked as NOT READY
3. Endpoints controller removes pod from Service
4. No new traffic sent to pod
5. Existing connections allowed to complete
6. If readiness recovers, pod added back to Service
```

---

## Testing Health Checks

### Simulate Liveness Failure

```bash
# SSH into pod
kubectl exec -it finance-service-abc123 -- /bin/sh

# Kill main process (trigger liveness failure)
kill -9 1

# Watch pod restart
kubectl get pods -w
```

### Simulate Readiness Failure

```bash
# Stop database (readiness should fail)
kubectl exec -it postgres-0 -- pg_ctl stop

# Check pod status (should become NOT READY)
kubectl get pods

# Check Service endpoints (pod removed)
kubectl get endpoints finance-service

# Restart database
kubectl exec -it postgres-0 -- pg_ctl start

# Pod should become READY again
```

---

## Production Deployment Strategies

### Rolling Update with Health Checks

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2        # Add 2 new pods
      maxUnavailable: 1  # Keep 9 pods available

  template:
    spec:
      containers:
      - name: finance
        readinessProbe:
          httpGet:
            path: /health/ready
          failureThreshold: 2
```

**Flow**:
1. Create 2 new pods (v1.1.0)
2. Wait for startupProbe success
3. Wait for readinessProbe success
4. Add to load balancer
5. Remove 1 old pod (v1.0.0)
6. Repeat until all 10 pods are v1.1.0

---

## HPA (Horizontal Pod Autoscaler) Integration

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: finance-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: finance-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70

  # Only scale pods that are READY
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5min before scaling down
      policies:
      - type: Percent
        value: 50   # Scale down max 50% at a time
        periodSeconds: 60
```

**Health Check Impact**:
- Only READY pods count towards HPA metrics
- NOT READY pods ignored in CPU/memory calculations
- Prevents scaling based on unhealthy pods

---

## Kubernetes Event Monitoring

```bash
# Watch health-related events
kubectl get events --field-selector involvedObject.name=finance-service-abc123

# Example output:
# Liveness probe failed: Get http://10.1.2.3:3014/health/live: dial tcp 10.1.2.3:3014: connect: connection refused
# Killing container with id docker://abc123 (reason:FailedLivenessProbe)
# Started container finance
```

---

## Best Practices Summary

1. **Startup Probe**: Use if initialization >10s (migrations, cache warming)
2. **Liveness Probe**: Minimal checks (process health only)
3. **Readiness Probe**: Comprehensive checks (all dependencies)
4. **Failure Thresholds**: Liveness (3 failures), Readiness (2 failures)
5. **Timeouts**: Fast checks (<3s), slow services (<5s)
6. **Graceful Shutdown**: terminationGracePeriodSeconds = 30s
7. **Rolling Updates**: maxUnavailable = 1 (high availability)
8. **HPA**: Only scale READY pods
9. **Test**: Simulate failures in staging
10. **Monitor**: Watch Kubernetes events for probe failures

---

## Further Reading

- **Dependency Checks**: `.claude/skills/health-check-patterns/resources/dependency-checks.md`
- **Monitoring Integration**: `.claude/skills/health-check-patterns/resources/monitoring-integration.md`
- **Kubernetes Docs**: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
