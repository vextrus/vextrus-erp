# Rollout Procedures & Kubernetes Patterns

**Purpose**: Complete Kubernetes deployment manifests, rollback procedures, and phased rollout strategies for Vextrus ERP.

---

## Phased Rollout Strategy (4-Week Plan)

### Week 1: 20% Traffic (Early Adopters)

**Objectives**:
- Establish monitoring baseline
- Validate critical functionality
- Test with early adopter tenants

**Configuration**:
```yaml
# File: k8s/03-production-week1-20percent.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: finance-service-v2
  namespace: vextrus-prod
  labels:
    app: finance-service
    version: v2.0.0
    rollout-week: week1
spec:
  replicas: 1  # 20% of 5-pod capacity

  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0  # Zero downtime

  selector:
    matchLabels:
      app: finance-service
      version: v2.0.0

  template:
    metadata:
      labels:
        app: finance-service
        version: v2.0.0
        rollout-week: week1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: finance-service
        image: vextrus/finance-service:v2.0.0
        ports:
        - containerPort: 3000
          name: http
        - containerPort: 9090
          name: metrics

        env:
        - name: NODE_ENV
          value: "production"
        - name: ROLLOUT_STAGE
          value: "week1-20percent"

        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"

        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3

        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 20
          periodSeconds: 5
          timeoutSeconds: 3
          successThreshold: 3
          failureThreshold: 2
```

**Success Criteria**:
- Error rate <1%
- P95 latency <300ms
- All health checks passing
- Zero critical incidents

---

### Week 2: 50% Traffic (Expand)

**Configuration**:
```yaml
# File: k8s/05-production-week2-50percent.yaml

spec:
  replicas: 3  # 50% of 5-pod capacity (rounding up from 2.5)
```

**Success Criteria**:
- Error rate stable <1%
- P95 latency <300ms
- Database connection pool healthy
- EventStore performance normal

---

### Week 3: 80% Traffic (Near-Full)

**Configuration**:
```yaml
# File: k8s/07-production-week3-80percent.yaml

spec:
  replicas: 4  # 80% of 5-pod capacity
```

**Success Criteria**:
- All metrics within SLOs
- No degradation in dependent services
- Memory/CPU usage stable

---

### Week 4: 100% Traffic (Complete)

**Configuration**:
```yaml
# File: k8s/09-production-week4-100percent.yaml

spec:
  replicas: 5  # Full capacity
```

**Post-Deployment**:
- Remove old version
- Update documentation
- Conduct retrospective

---

## Complete Kubernetes Deployment Manifest

### Full Production Deployment

```yaml
# File: k8s/deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: finance-service
  namespace: vextrus-prod
  labels:
    app: finance-service
    tier: backend
    component: finance
spec:
  replicas: 5

  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Create 1 extra pod during update
      maxUnavailable: 0  # Never take pods down (zero downtime)

  selector:
    matchLabels:
      app: finance-service

  template:
    metadata:
      labels:
        app: finance-service
        tier: backend
        component: finance
      annotations:
        # Prometheus scraping
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"

        # Restart on config change
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        checksum/secret: {{ include (print $.Template.BasePath "/secret.yaml") . | sha256sum }}

    spec:
      # Security
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 2000

      # Service Account
      serviceAccountName: finance-service

      # Init Containers (run migrations)
      initContainers:
      - name: migration
        image: vextrus/finance-service:v1.2.3
        command: ['npm', 'run', 'migration:run']
        env:
        - name: DATABASE_HOST
          valueFrom:
            secretKeyRef:
              name: finance-db-credentials
              key: host
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: finance-db-credentials
              key: password

      # Main Container
      containers:
      - name: finance-service
        image: vextrus/finance-service:v1.2.3
        imagePullPolicy: IfNotPresent

        ports:
        - containerPort: 3000
          name: http
          protocol: TCP
        - containerPort: 9090
          name: metrics
          protocol: TCP

        # Environment from ConfigMap
        envFrom:
        - configMapRef:
            name: finance-service-config

        # Environment from Secrets
        env:
        - name: DATABASE_HOST
          valueFrom:
            secretKeyRef:
              name: finance-db-credentials
              key: host
        - name: DATABASE_PORT
          valueFrom:
            secretKeyRef:
              name: finance-db-credentials
              key: port
        - name: DATABASE_USER
          valueFrom:
            secretKeyRef:
              name: finance-db-credentials
              key: username
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: finance-db-credentials
              key: password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: finance-jwt-secret
              key: secret

        # Resource Limits
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"

        # Health Checks
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3

        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 20
          periodSeconds: 5
          timeoutSeconds: 3
          successThreshold: 3
          failureThreshold: 2

        # Graceful Shutdown
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 10"]

        # Volume Mounts
        volumeMounts:
        - name: config
          mountPath: /app/config
          readOnly: true
        - name: logs
          mountPath: /app/logs

      # Volumes
      volumes:
      - name: config
        configMap:
          name: finance-service-config
      - name: logs
        emptyDir: {}

      # Affinity (spread across nodes)
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

---
apiVersion: v1
kind: Service
metadata:
  name: finance-service
  namespace: vextrus-prod
  labels:
    app: finance-service
spec:
  type: ClusterIP
  selector:
    app: finance-service
  ports:
  - name: http
    protocol: TCP
    port: 80
    targetPort: 3000
  - name: metrics
    protocol: TCP
    port: 9090
    targetPort: 9090

  sessionAffinity: None

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: finance-service
  namespace: vextrus-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: finance-service
  minReplicas: 5
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max
```

---

## Rollback Procedures

### Automatic Rollback Triggers

**1. Readiness Probe Failure** (3 consecutive)
```yaml
readinessProbe:
  failureThreshold: 2  # After 2 failures, pod removed from service
  periodSeconds: 5
  timeoutSeconds: 3
```

K8s behavior:
- Stops routing traffic to unhealthy pod
- Old version continues serving requests
- If all new pods fail readiness → automatic rollback

**2. Critical Business Metric Degradation**

Monitored metrics:
- Error rate >5% (baseline <1%)
- Response time >2x baseline
- Database connection pool exhaustion (>90% usage)
- EventStore disconnections

**3. Dependency Unavailability**
- Database unavailable >30s
- Redis cache unavailable >60s
- EventStore connection drops

---

### Manual Rollback Commands

#### Check Deployment Status
```bash
# Current deployment
kubectl get deployments -n vextrus-prod

# Pod status
kubectl get pods -n vextrus-prod -l app=finance-service

# Deployment events
kubectl describe deployment finance-service -n vextrus-prod

# Recent logs
kubectl logs -n vextrus-prod -l app=finance-service --tail=100
```

#### View Rollout History
```bash
# List all revisions
kubectl rollout history deployment/finance-service -n vextrus-prod

# Inspect specific revision
kubectl rollout history deployment/finance-service -n vextrus-prod --revision=3
```

#### Execute Rollback
```bash
# Rollback to previous version (quick)
kubectl rollout undo deployment/finance-service -n vextrus-prod

# Rollback to specific revision
kubectl rollout undo deployment/finance-service -n vextrus-prod --to-revision=3

# Monitor rollback progress
kubectl rollout status deployment/finance-service -n vextrus-prod

# Verify pods running
kubectl get pods -n vextrus-prod -l app=finance-service -w
```

#### Pause/Resume Rollout
```bash
# Pause rollout (stop creating new pods)
kubectl rollout pause deployment/finance-service -n vextrus-prod

# Investigate, fix issues, then resume
kubectl rollout resume deployment/finance-service -n vextrus-prod
```

---

### Event Sourcing Service Rollback

For event-sourced services (Finance), events are immutable:

```typescript
// Location: services/finance/src/infrastructure/rollback/projection-rollback.service.ts

export class ProjectionRollbackService {
  /**
   * Rollback projection to specific version
   * Events are never rolled back (immutable)
   * Only read model is rebuilt
   */
  async rollbackToVersion(version: number): Promise<void> {
    const logger = this.logger.child({ operation: 'projection-rollback', targetVersion: version });

    try {
      // 1. Stop projection manager (prevent new projections)
      logger.info('Stopping projection manager');
      await this.projectionManager.stop();

      // 2. Clear current read model
      logger.info('Clearing read model');
      await this.clearReadModel();

      // 3. Replay events up to target version
      logger.info('Replaying events', { maxVersion: version });
      const events = await this.eventStore.readAllEvents({
        maxVersion: version,
        filter: { streamPrefix: 'invoice-' },
      });

      // 4. Rebuild projections
      logger.info('Rebuilding projections', { eventCount: events.length });
      for (const event of events) {
        await this.projectionHandler.handle(event);
      }

      // 5. Verify integrity
      logger.info('Verifying data integrity');
      await this.verifyIntegrity();

      // 6. Resume normal operation
      logger.info('Resuming projection manager');
      await this.projectionManager.start();

      logger.info('Projection rollback complete');
    } catch (error) {
      logger.error('Projection rollback failed', { error });
      throw error;
    }
  }

  private async clearReadModel(): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.query('TRUNCATE TABLE invoice_read_model CASCADE');
      await manager.query('TRUNCATE TABLE payment_read_model CASCADE');
      await manager.query('TRUNCATE TABLE journal_entry_read_model CASCADE');
    });
  }

  private async verifyIntegrity(): Promise<void> {
    // Check for orphaned records, missing relationships, etc.
    const orphanedPayments = await this.paymentRepo.count({
      where: { invoiceId: IsNull() },
    });

    if (orphanedPayments > 0) {
      throw new Error(`Integrity check failed: ${orphanedPayments} orphaned payments`);
    }
  }
}
```

#### Rollback Procedure for Event Sourcing

```bash
# 1. Identify target event version
kubectl exec -it finance-service-pod -- npm run events:inspect

# 2. Trigger projection rebuild via admin API
curl -X POST https://api.vextrus.com/admin/finance/projection-rollback \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"targetVersion": 12345}'

# 3. Monitor rebuild progress
kubectl logs -f finance-service-pod | grep "projection-rollback"

# 4. Verify read model integrity
curl https://api.vextrus.com/admin/finance/projection-verify \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Deployment Automation (GitOps with ArgoCD)

### ArgoCD Application Manifest

```yaml
# File: k8s/argocd/finance-service-app.yaml

apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: finance-service
  namespace: argocd
spec:
  project: vextrus-prod

  source:
    repoURL: https://github.com/vextrus/erp-infrastructure
    targetRevision: main
    path: services/finance/k8s

  destination:
    server: https://kubernetes.default.svc
    namespace: vextrus-prod

  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
    - CreateNamespace=true
    - PruneLast=true

    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m

  # Health checks
  ignoreDifferences:
  - group: apps
    kind: Deployment
    jsonPointers:
    - /spec/replicas  # Ignore HPA-managed replicas
```

---

## Blue-Green Deployment Pattern

### Setup Two Environments

```yaml
# Blue (current production)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finance-service-blue
spec:
  replicas: 5
  selector:
    matchLabels:
      app: finance-service
      color: blue

---
# Green (new version)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finance-service-green
spec:
  replicas: 5
  selector:
    matchLabels:
      app: finance-service
      color: green
```

### Service Selector Switch

```yaml
# Service points to blue (stable)
apiVersion: v1
kind: Service
metadata:
  name: finance-service
spec:
  selector:
    app: finance-service
    color: blue  # Switch to 'green' after validation
```

### Cutover Procedure

```bash
# 1. Deploy green
kubectl apply -f k8s/deployment-green.yaml

# 2. Validate green
kubectl port-forward deployment/finance-service-green 8080:3000
curl http://localhost:8080/health

# 3. Switch traffic (atomic operation)
kubectl patch service finance-service -p '{"spec":{"selector":{"color":"green"}}}'

# 4. Monitor for issues
# If issues: Rollback by patching back to blue
kubectl patch service finance-service -p '{"spec":{"selector":{"color":"blue"}}}'

# 5. If successful: Delete blue
kubectl delete deployment finance-service-blue
kubectl rename deployment finance-service-green finance-service-blue
```

---

## Canary Deployment with Istio

### VirtualService for Traffic Splitting

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: finance-service
spec:
  hosts:
  - finance-service
  http:
  - match:
    - headers:
        x-canary:
          exact: "true"
    route:
    - destination:
        host: finance-service
        subset: v2
  - route:
    - destination:
        host: finance-service
        subset: v1
      weight: 90
    - destination:
        host: finance-service
        subset: v2
      weight: 10  # 10% canary traffic
```

### Gradual Traffic Increase

```bash
# Week 1: 10%
kubectl apply -f canary-10percent.yaml

# Week 2: 30%
kubectl apply -f canary-30percent.yaml

# Week 3: 50%
kubectl apply -f canary-50percent.yaml

# Week 4: 100%
kubectl apply -f canary-100percent.yaml
```

---

## Resources

- **Kubernetes Deployments**: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
- **Zero-Downtime**: https://kubernetes.io/blog/2018/04/30/zero-downtime-deployment-kubernetes-jenkins/
- **ArgoCD**: https://argo-cd.readthedocs.io/
- **Istio Canary**: https://istio.io/latest/docs/concepts/traffic-management/
- **Phased Rollout Guide**: sessions/knowledge/vextrus-erp/guides/phased-rollout-guide.md
