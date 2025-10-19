---
name: Production Deployment
description: When deploying to production, creating phased rollouts, or setting up observability, activate this skill to enforce production-ready patterns. Use when user says "deploy", "production", "rollout", "monitoring", "observability", "k8s", "kubernetes", "health check".
---

# Production Deployment Skill

## Purpose
Ensure production deployments are safe, monitored, reversible, and follow Vextrus ERP phased rollout strategy

## Activation Triggers
- User says: "deploy", "production", "rollout", "monitoring", "observability", "k8s", "kubernetes"
- Working in: k8s/ directories, health endpoints, observability setup
- Creating: Deployment manifests, health checks, metrics endpoints
- Modifying: Service configurations for production

## Phased Rollout Strategy

Vextrus ERP Standard (from Finance service pattern):

```
Week 1:  20% traffic → Early adopters, monitoring baseline
Week 2:  50% traffic → Expand, validate performance
Week 3:  80% traffic → Near-full deployment
Week 4: 100% traffic → Complete rollout

Rollback trigger: Any critical metric degradation
```

**For detailed week-by-week Kubernetes manifests**, see `resources/rollout-procedures.md`

---

## Three-Tier Health Check System

### Tier 1: Liveness Probe (`/health/live`)

**Purpose**: Container orchestration (Docker/K8s)
**Response Time**: <100ms
**Checks**: Process alive only

```typescript
@Get('/health/live')
@Public()
async checkLiveness(): Promise<HealthResponse> {
  return {
    status: 'alive',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
}
```

**Kubernetes config**:
```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3
```

### Tier 2: Readiness Probe (`/health/ready`)

**Purpose**: Load balancer traffic routing
**Response Time**: <500ms
**Checks**: All critical dependencies (Database, Redis, Kafka, EventStore)

```typescript
@Get('/health/ready')
@Public()
async checkReadiness(): Promise<ReadinessResponse> {
  const checks = await Promise.all([
    this.checkDatabase(),
    this.checkRedis(),
    this.checkEventStore(),
  ]);

  return {
    status: checks.every(c => c.status === 'ready') ? 'ready' : 'not_ready',
    checks: { /* ... */ },
  };
}
```

**Kubernetes config**:
```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  successThreshold: 3  # Must pass 3 times before routing traffic
  failureThreshold: 2
```

### Tier 3: Comprehensive Health (`/health`)

**Purpose**: Monitoring dashboards, alerting
**Response Time**: <2s
**Checks**: Full system health + metadata + dependencies

**For complete health check implementations**, see `sessions/knowledge/vextrus-erp/guides/phased-rollout-guide.md`

---

## Observability Setup (Brief Overview)

### OpenTelemetry
```typescript
// Auto-instrumentation for HTTP, NestJS, PostgreSQL
OpenTelemetryModule.forRoot({
  serviceName: process.env.OTEL_SERVICE_NAME,
  traceExporter: { otlp: { url: '...' } },
  instrumentations: [
    new HttpInstrumentation(),
    new NestInstrumentation(),
    new PgInstrumentation(),
  ],
})
```

### Prometheus Metrics
```typescript
@Controller('metrics')
export class MetricsController {
  @Get()
  @Public()
  async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
```

**For complete OpenTelemetry setup, distributed tracing, Prometheus patterns, and alerting rules**, see `resources/monitoring-observability.md`

---

## Kubernetes Integration (Brief)

### Zero-Downtime Deployment Strategy

```yaml
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Create 1 extra pod during update
      maxUnavailable: 0  # Zero downtime requirement

  template:
    spec:
      containers:
      - name: service
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

**For complete Kubernetes manifests, HPA, affinity rules, and service definitions**, see `resources/rollout-procedures.md`

---

## Rollback Procedures (Brief)

### Automatic Triggers
1. **Readiness Probe Failure** (3 consecutive) → K8s stops routing traffic
2. **Critical Metric Degradation** → Error rate >5%, response time >2x baseline
3. **Dependency Unavailability** → Database/EventStore unavailable >30s

### Manual Rollback
```bash
# Quick rollback to previous version
kubectl rollout undo deployment/finance-service -n vextrus

# Rollback to specific revision
kubectl rollout undo deployment/finance-service --to-revision=3 -n vextrus
```

### Event Sourcing Rollback
Events are immutable → Rollback by rebuilding read model projections from events

**For complete rollback procedures, blue-green deployments, and canary releases**, see `resources/rollout-procedures.md`

---

## Production Configuration Pattern

```env
# Service Identity
NODE_ENV=production
SERVICE_VERSION=1.2.3

# Security (from vault/secrets manager)
JWT_SECRET=[from-vault]
DATABASE_PASSWORD=[from-secrets-manager]

# Database (Connection Pooling)
DATABASE_SYNCHRONIZE=false  # CRITICAL
DATABASE_POOL_SIZE=20
DATABASE_POOL_MAX=50

# Observability
OTEL_SERVICE_NAME=finance-service
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.monitoring:4317
```

---

## Deployment Checklist

**Before deployment**:
- [ ] All tests passing (unit + integration + e2e)
- [ ] Security scan clean (`/security-scan`)
- [ ] Database migrations tested on staging
- [ ] Health checks implemented (3 tiers)
- [ ] Observability configured (OTEL + Prometheus)
- [ ] Secrets in vault (not env vars)
- [ ] Resource limits defined
- [ ] Rollback procedure documented
- [ ] Phased rollout plan approved

**During deployment**:
- [ ] Monitor health checks (readiness passes)
- [ ] Watch error rates (<1%)
- [ ] Check response times (<300ms p95)
- [ ] Verify distributed tracing
- [ ] Validate metrics exporting

**After deployment**:
- [ ] All pods healthy
- [ ] Traffic routing correctly
- [ ] Performance within SLOs
- [ ] Alerts configured and silent

---

## Common Mistakes to Avoid

❌ **Don't**:
- Skip readiness probes (traffic routed too early)
- Use comprehensive health for K8s probes (too slow)
- Store secrets in environment variables
- Deploy without rollback plan
- Skip phased rollout for critical services
- Forget to set resource limits

✅ **Do**:
- Implement all 3 health check tiers
- Use secrets manager for credentials
- Define resource requests + limits
- Test rollback procedure in staging
- Monitor during phased rollout
- Document deployment steps

---

## Plan Mode Integration

In plan mode:
1. User requests production deployment
2. Skill presents phased rollout plan (Week 1-4)
3. User approves week-by-week strategy
4. Execute deployment with monitoring
5. Monitor metrics, rollback if needed

**Workflow**: Plan → Approve → Week 1 → Monitor → Week 2 → ... → Complete

---

## Integration with Other Skills

- **Database Migrations**: Ensure migrations run before deployment (init containers)
- **Multi-Tenancy**: Validate tenant isolation maintained in production
- **Security First**: Verify secrets management, no hardcoded credentials
- **Event Sourcing**: EventStore connectivity in health checks

**Coordination**: Deployment → Migrations → Health Checks → Monitoring → Rollback Plan

---

## Resources

- **Rollout Procedures**: `resources/rollout-procedures.md` (phased rollout, K8s manifests, rollback procedures, blue-green, canary)
- **Monitoring & Observability**: `resources/monitoring-observability.md` (OpenTelemetry, Prometheus, distributed tracing, SLI/SLO, alerting)
- **Phased Rollout Guide**: sessions/knowledge/vextrus-erp/guides/phased-rollout-guide.md
- **Health Check Patterns**: services/organization/CLAUDE.md (lines 39-44)
- **Kubernetes Best Practices**: https://kubernetes.io/docs/concepts/configuration/

---

## Override

User can bypass with:
- "skip phased rollout for hotfix"
- "deploy directly to 100%"

**Default**: ENFORCE PHASED ROLLOUT
