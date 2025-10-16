# Observability & Monitoring Guide

Comprehensive guide for monitoring, observability, and performance baseline management in Vextrus ERP.

## Table of Contents

- [Overview](#overview)
- [Monitoring Stack](#monitoring-stack)
- [Grafana Dashboards](#grafana-dashboards)
- [Performance Baselines](#performance-baselines)
- [Alerting](#alerting)
- [SLA Monitoring](#sla-monitoring)
- [Distributed Tracing](#distributed-tracing)
- [Best Practices](#best-practices)

## Overview

Vextrus ERP uses a comprehensive observability stack for monitoring system health, performance, and compliance with SLAs.

### Key Components

- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Jaeger**: Distributed tracing
- **OpenTelemetry**: Instrumentation and telemetry
- **Alert Manager**: Alert routing and management

### Access URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | http://localhost:3000 | admin / vextrus_grafana_2024 |
| Prometheus | http://localhost:9090 | N/A |
| Jaeger UI | http://localhost:16686 | N/A |
| AlertManager | http://localhost:9093 | N/A |

## Monitoring Stack

### Starting Monitoring Services

```bash
# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Check status
docker-compose -f docker-compose.monitoring.yml ps

# View logs
docker-compose -f docker-compose.monitoring.yml logs -f grafana
```

### Stopping Monitoring Services

```bash
docker-compose -f docker-compose.monitoring.yml down
```

## Grafana Dashboards

### Available Dashboards

1. **Service Health Dashboard** (`service-health`)
   - Service availability status
   - Response time metrics (p95)
   - Database connection pool usage
   - Redis memory usage
   - Error rates
   - Request rate by service
   - Response time heatmap

2. **GraphQL Operations Dashboard** (`graphql-operations`)
   - GraphQL operation rates
   - Operation duration (p95, p99)
   - Top operations
   - Error rates
   - Slow operations
   - Errors by type
   - Federation query execution time
   - Subgraph request rates

3. **Authentication & Security Dashboard** (`authentication`)
   - Login success rate
   - Active sessions
   - Failed login attempts
   - Token validations
   - Token operations (issued, refreshed, expired, revoked)
   - Login failures by reason
   - Auth methods distribution
   - JWT validation success rate

4. **SLA Monitoring Dashboard** (`sla-monitoring`)
   - Availability SLA (99.9% target)
   - Response time SLA (< 500ms target)
   - Error rate SLA (< 1% target)
   - SLA compliance score
   - Uptime tracking
   - Per-service SLA compliance
   - Recent SLA violations

5. **Business KPIs Dashboard** (`business-kpis`)
   - Business metrics and KPIs
   - Transaction volumes
   - User activity

6. **Infrastructure Metrics Dashboard** (`infrastructure-metrics`)
   - System resources
   - Container metrics
   - Network metrics

### Accessing Dashboards

1. Navigate to Grafana: http://localhost:3000
2. Login with credentials
3. Click "Dashboards" in the left menu
4. Select desired dashboard

### Creating Custom Dashboards

```json
{
  "dashboard": {
    "title": "My Custom Dashboard",
    "panels": [
      {
        "id": 1,
        "type": "timeseries",
        "title": "Custom Metric",
        "targets": [
          {
            "expr": "your_prometheus_query_here",
            "refId": "A"
          }
        ]
      }
    ]
  }
}
```

## Performance Baselines

### Established Baselines

#### API Gateway

| Metric | Good | Acceptable | Warning | Critical |
|--------|------|------------|---------|----------|
| Response Time (p95) | < 300ms | < 500ms | < 1s | > 1s |
| Response Time (p99) | < 500ms | < 1s | < 2s | > 2s |
| Error Rate | < 0.5% | < 1% | < 3% | > 5% |
| Request Rate | > 100 req/s | > 50 req/s | > 10 req/s | < 10 req/s |
| CPU Usage | < 50% | < 70% | < 85% | > 85% |
| Memory Usage | < 60% | < 75% | < 85% | > 85% |

#### Auth Service

| Metric | Good | Acceptable | Warning | Critical |
|--------|------|------------|---------|----------|
| Login Response Time | < 200ms | < 400ms | < 800ms | > 800ms |
| Token Validation | < 50ms | < 100ms | < 200ms | > 200ms |
| Login Success Rate | > 95% | > 90% | > 80% | < 80% |
| Failed Login Attempts | < 5/min | < 10/min | < 20/min | > 50/min |

#### Master Data Service

| Metric | Good | Acceptable | Warning | Critical |
|--------|------|------------|---------|----------|
| Query Response Time | < 150ms | < 300ms | < 600ms | > 600ms |
| Mutation Response Time | < 250ms | < 500ms | < 1s | > 1s |
| Database Query Time | < 100ms | < 250ms | < 500ms | > 500ms |

#### Finance Service

| Metric | Good | Acceptable | Warning | Critical |
|--------|------|------------|---------|----------|
| Invoice Creation | < 300ms | < 600ms | < 1.5s | > 1.5s |
| Account Query | < 150ms | < 300ms | < 600ms | > 600ms |
| Report Generation | < 5s | < 10s | < 20s | > 20s |

#### Workflow Service

| Metric | Good | Acceptable | Warning | Critical |
|--------|------|------------|---------|----------|
| Task Creation | < 200ms | < 400ms | < 800ms | > 800ms |
| Workflow Execution | < 500ms | < 1s | < 3s | > 3s |
| Task Query | < 150ms | < 300ms | < 600ms | > 600ms |

#### Rules Engine Service

| Metric | Good | Acceptable | Warning | Critical |
|--------|------|------------|---------|----------|
| Rule Evaluation | < 100ms | < 250ms | < 500ms | > 500ms |
| Rule Query | < 150ms | < 300ms | < 600ms | > 600ms |

#### Database

| Metric | Good | Acceptable | Warning | Critical |
|--------|------|------------|---------|----------|
| Query Execution Time | < 50ms | < 100ms | < 250ms | > 250ms |
| Connection Pool Usage | < 60% | < 75% | < 85% | > 85% |
| Replication Lag | < 10s | < 30s | < 60s | > 60s |

#### Redis

| Metric | Good | Acceptable | Warning | Critical |
|--------|------|------------|---------|----------|
| Memory Usage | < 60% | < 75% | < 85% | > 85% |
| Command Latency | < 1ms | < 5ms | < 10ms | > 10ms |

#### Kafka

| Metric | Good | Acceptable | Warning | Critical |
|--------|------|------------|---------|----------|
| Consumer Lag | < 100 msgs | < 500 msgs | < 1000 msgs | > 1000 msgs |
| Message Throughput | > 1000/s | > 500/s | > 100/s | < 100/s |

### Measuring Baselines

Use Prometheus queries to measure current performance:

```promql
# API Gateway p95 response time
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service="api-gateway"}[5m])) by (le))

# Error rate
(sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) * 100

# CPU usage
rate(process_cpu_seconds_total[5m]) * 100

# Memory usage
process_resident_memory_bytes
```

### Performance Regression Detection

Set up alerts for performance degradation:

```yaml
- alert: PerformanceRegression
  expr: |
    histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (service, le))
    >
    avg_over_time(
      histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (service, le))[7d:]
    ) * 1.5
  for: 15m
  annotations:
    summary: "Performance regression detected on {{ $labels.service }}"
    description: "Response time is 50% higher than 7-day average"
```

## Alerting

### Alert Rules

Located in: `infrastructure/docker/prometheus/alert-rules.yml`

#### Alert Categories

1. **Service Health**
   - ServiceDown: Service unavailable for > 1 minute
   - HighErrorRate: Error rate > 5% for 5 minutes
   - CriticalErrorRate: Error rate > 10% for 2 minutes

2. **Performance**
   - HighResponseTime: p95 > 1s for 5 minutes
   - CriticalResponseTime: p95 > 3s for 2 minutes
   - HighMemoryUsage: Memory > 85% for 5 minutes
   - HighCPUUsage: CPU > 80% for 5 minutes

3. **Authentication**
   - HighAuthenticationFailureRate: > 20% failures for 5 minutes
   - PossibleBruteForceAttack: > 10 failures/minute for 2 minutes
   - ExpiredTokenSpike: > 5 expired tokens/second

4. **Database**
   - HighDatabaseConnectionPoolUsage: > 80% for 5 minutes
   - SlowDatabaseQueries: Avg execution > 0.5s
   - DatabaseReplicationLag: > 60s for 2 minutes

5. **Infrastructure**
   - RedisHighMemoryUsage: > 85% for 5 minutes
   - KafkaConsumerLag: > 1000 messages
   - DiskSpaceLow: < 15% remaining

6. **SLA Violations**
   - SLAViolation_Availability: < 99.9% for 5 minutes
   - SLAViolation_ResponseTime: p95 > 500ms for 10 minutes
   - SLAViolation_ErrorRate: > 1% for 10 minutes

### Alert Severity Levels

| Level | Response Time | Example |
|-------|---------------|---------|
| **Critical** | Immediate | Service down, data loss risk |
| **Warning** | 30 minutes | High resource usage, slow queries |
| **Info** | 1 hour | Performance degradation |

### Configuring Alert Notifications

To set up Slack notifications:

```yaml
# prometheus.yml
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

Create `alertmanager.yml`:

```yaml
global:
  slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'slack-notifications'

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - channel: '#vextrus-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

## SLA Monitoring

### SLA Targets

| Metric | Target | Measurement Period |
|--------|--------|-------------------|
| Availability | 99.9% | Monthly |
| Response Time (p95) | < 500ms | Daily |
| Error Rate | < 1% | Daily |
| Data Durability | 99.99% | Monthly |

### SLA Calculations

**Availability SLA:**
```
Availability = (Total Uptime / Total Time) * 100
```

**Response Time SLA:**
```
Compliant if p95 < 500ms for > 95% of measurement period
```

**Error Rate SLA:**
```
Error Rate = (5xx Errors / Total Requests) * 100
Compliant if < 1% for > 95% of measurement period
```

### SLA Reporting

Generate monthly SLA reports:

```bash
# Query Prometheus for SLA metrics
curl -G http://localhost:9090/api/v1/query \
  --data-urlencode 'query=avg_over_time(up{job=~".*-service"}[30d])' | jq .

# Generate availability report
curl -G http://localhost:9090/api/v1/query_range \
  --data-urlencode 'query=(sum(up) / count(up)) * 100' \
  --data-urlencode 'start=2025-01-01T00:00:00Z' \
  --data-urlencode 'end=2025-01-31T23:59:59Z' \
  --data-urlencode 'step=1h' | jq .
```

## Distributed Tracing

### Jaeger Setup

Jaeger is running at: http://localhost:16686

### Viewing Traces

1. Navigate to Jaeger UI: http://localhost:16686
2. Select service from dropdown (e.g., "api-gateway")
3. Click "Find Traces"
4. Select a trace to view span details

### Trace Context

All requests include trace context headers:

```
X-Trace-Id: <unique-trace-id>
X-Span-Id: <span-id>
X-Parent-Span-Id: <parent-span-id>
```

### Instrumenting Code

Example in NestJS service:

```typescript
import { Span } from '@nestjs/otel';
import { trace } from '@opentelemetry/api';

@Injectable()
export class YourService {
  @Span()
  async yourMethod() {
    const span = trace.getActiveSpan();
    span?.setAttribute('custom.attribute', 'value');

    // Your code here

    return result;
  }
}
```

### Common Trace Queries

Find slow requests:
```
minDuration: 1s
```

Find errors:
```
tags: error=true
```

Find specific operation:
```
operation: POST /graphql
```

## Best Practices

### 1. Dashboard Organization

- Create role-specific dashboards (Dev, Ops, Business)
- Use consistent color schemes
- Add annotations for deployments
- Include links to related dashboards

### 2. Alert Configuration

- Avoid alert fatigue (tune thresholds)
- Use appropriate severity levels
- Include runbook links in annotations
- Test alerts before deploying

### 3. Metric Collection

- Use consistent naming conventions
- Include service labels
- Collect business metrics
- Monitor golden signals (latency, traffic, errors, saturation)

### 4. Performance Monitoring

- Establish baselines early
- Monitor trends over time
- Set up automated regression detection
- Review baselines quarterly

### 5. Trace Sampling

- Sample 100% in development
- Sample 1-10% in production
- Increase sampling for errors
- Always trace critical paths

### 6. Data Retention

- Prometheus: 30 days
- Jaeger: 7 days
- Long-term storage: Use Thanos or Cortex
- Archive critical data

## Troubleshooting

### Grafana Not Showing Data

1. Check Prometheus is running:
   ```bash
   curl http://localhost:9090/-/healthy
   ```

2. Verify datasource connection in Grafana:
   - Go to Configuration > Data Sources
   - Test Prometheus connection

3. Check service metrics endpoints:
   ```bash
   curl http://localhost:4000/metrics
   ```

### Missing Traces in Jaeger

1. Verify OpenTelemetry Collector is running:
   ```bash
   docker-compose -f docker-compose.monitoring.yml ps otel-collector
   ```

2. Check collector logs:
   ```bash
   docker-compose -f docker-compose.monitoring.yml logs otel-collector
   ```

3. Verify service instrumentation

### Alerts Not Firing

1. Check alert rules syntax:
   ```bash
   promtool check rules infrastructure/docker/prometheus/alert-rules.yml
   ```

2. Verify alert state in Prometheus:
   - Navigate to http://localhost:9090/alerts
   - Check pending/firing status

3. Check AlertManager configuration

## Monitoring Checklist

- [ ] All services exposing /metrics endpoint
- [ ] Grafana dashboards accessible
- [ ] Alert rules configured and tested
- [ ] SLA targets documented
- [ ] Performance baselines established
- [ ] Trace sampling configured
- [ ] Alert notifications working
- [ ] Backup and retention policies set
- [ ] Runbooks created for common alerts
- [ ] Team trained on monitoring tools

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [SRE Book - Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
