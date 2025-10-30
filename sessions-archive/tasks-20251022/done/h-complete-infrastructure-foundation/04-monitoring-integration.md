---
task: h-complete-infrastructure-foundation/04-monitoring-integration
status: pending
created: 2025-09-20
---

# Subtask 4: Monitoring Integration

## Objective
Configure comprehensive monitoring for all services with Prometheus metrics collection, Grafana dashboards, and OpenTelemetry tracing.

## Success Criteria
- [ ] All services expose /metrics endpoints
- [ ] Prometheus scraping all service metrics
- [ ] Custom metrics implemented for business operations
- [ ] Grafana dashboards showing real-time data
- [ ] OpenTelemetry tracing configured
- [ ] Log aggregation working

## Tasks

### 1. Add Metrics Endpoints to Services
- [ ] Add prom-client to all Node.js services
- [ ] Expose /metrics endpoint on each service
- [ ] Implement default Node.js metrics
- [ ] Add custom business metrics
- [ ] Test metric collection

### 2. Configure Prometheus Scraping
- [ ] Update prometheus.yml with all service targets
- [ ] Configure service discovery
- [ ] Set appropriate scrape intervals
- [ ] Add alerting rules
- [ ] Verify all targets are UP

### 3. Create Service-Specific Dashboards
- [ ] Auth Service Dashboard (login rates, token generation)
- [ ] Master Data Dashboard (CRUD operations, cache hits)
- [ ] Workflow Dashboard (process instances, task completion)
- [ ] Rules Engine Dashboard (rule evaluations, performance)
- [ ] Finance Dashboard (transaction volumes, processing times)

### 4. OpenTelemetry Configuration
- [ ] Add OTEL SDK to all services
- [ ] Configure trace exporters
- [ ] Set up span context propagation
- [ ] Configure sampling strategies
- [ ] Verify traces in Jaeger

### 5. Business Metrics
- [ ] Transaction processing times
- [ ] API response times by endpoint
- [ ] Database query performance
- [ ] Cache hit/miss ratios
- [ ] Queue processing rates

## Metrics Implementation Example

```typescript
// services/auth/src/metrics.ts
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

// Default metrics
import { collectDefaultMetrics } from 'prom-client';
collectDefaultMetrics({ register });

// Custom metrics
export const loginAttempts = new Counter({
  name: 'auth_login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['status', 'method'],
  registers: [register]
});

export const tokenGeneration = new Histogram({
  name: 'auth_token_generation_duration_seconds',
  help: 'Token generation duration',
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
  registers: [register]
});

export const activeSessions = new Gauge({
  name: 'auth_active_sessions',
  help: 'Number of active user sessions',
  registers: [register]
});

export default register;
```

## Dashboard Query Examples

```promql
# Service availability
up{job=~"auth|master-data|workflow|rules-engine"}

# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Response time percentiles
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Database connection pool
pg_pool_connections_active / pg_pool_connections_total
```

## Validation
```bash
# Check all metrics endpoints
for port in 3001 3002 3003 3004 3005 3006 3007 3008 3009; do
  echo "Service on port $port:"
  curl -s http://localhost:$port/metrics | head -20
done

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[].health'

# Verify Grafana dashboards
curl -s http://admin:admin@localhost:3000/api/dashboards | jq '.[] | .title'
```

## Alert Rules Example
```yaml
groups:
  - name: service_alerts
    rules:
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.instance }} is down"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate on {{ $labels.instance }}"

      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow response times on {{ $labels.instance }}"
```