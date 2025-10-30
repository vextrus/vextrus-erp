# Monitoring Integration for Health Checks

**Purpose**: Integrate health checks with Prometheus, OpenTelemetry, and alerting systems.

---

## Prometheus Metrics for Health

### Installation

```bash
npm install --save @willsoto/nestjs-prometheus prom-client
```

### Health Metrics Module

```typescript
// health-metrics.module.ts
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { makeGaugeProvider } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  providers: [
    makeGaugeProvider({
      name: 'health_check_status',
      help: 'Health check status (1 = healthy, 0 = unhealthy)',
      labelNames: ['check_name', 'service'],
    }),
    makeGaugeProvider({
      name: 'health_check_response_time_ms',
      help: 'Health check response time in milliseconds',
      labelNames: ['check_name'],
    }),
  ],
  exports: [PrometheusModule],
})
export class HealthMetricsModule {}
```

---

### Health Controller with Metrics

```typescript
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Gauge } from 'prom-client';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    @InjectMetric('health_check_status')
    private healthCheckGauge: Gauge<string>,
    @InjectMetric('health_check_response_time_ms')
    private responseTimeGauge: Gauge<string>,
  ) {}

  @Get('ready')
  @HealthCheck()
  async checkReadiness() {
    const startTime = Date.now();

    const result = await this.health.check([
      () => this.db.pingCheck('database'),
      () => this.eventStore.isHealthy('eventstore'),
      () => this.kafka.isHealthy('kafka'),
    ]);

    const responseTime = Date.now() - startTime;

    // Record overall response time
    this.responseTimeGauge.set(
      { check_name: 'readiness' },
      responseTime,
    );

    // Record individual check statuses
    Object.entries(result.details).forEach(([name, detail]) => {
      const isHealthy = detail.status === 'up' ? 1 : 0;
      this.healthCheckGauge.set(
        { check_name: name, service: 'finance' },
        isHealthy,
      );
    });

    return result;
  }
}
```

---

## Prometheus Queries

### Check Health Status

```promql
# Is database healthy?
health_check_status{check_name="database",service="finance"}

# Result: 1 (healthy) or 0 (unhealthy)
```

### Alert Rules

```yaml
# prometheus-alerts.yml
groups:
- name: health_checks
  interval: 30s
  rules:
  # Alert if database health check fails
  - alert: DatabaseHealthCheckFailed
    expr: health_check_status{check_name="database"} == 0
    for: 1m
    labels:
      severity: critical
      service: "{{ $labels.service }}"
    annotations:
      summary: "Database health check failed for {{ $labels.service }}"
      description: "The database health check has been failing for 1 minute"

  # Alert if EventStore health check fails
  - alert: EventStoreHealthCheckFailed
    expr: health_check_status{check_name="eventstore"} == 0
    for: 2m
    labels:
      severity: high
      service: "{{ $labels.service }}"
    annotations:
      summary: "EventStore health check failed for {{ $labels.service }}"

  # Alert if health check is slow
  - alert: HealthCheckResponseSlow
    expr: health_check_response_time_ms{check_name="readiness"} > 3000
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Health check response time > 3s"
      description: "Readiness check taking {{ $value }}ms"

  # Alert if Kafka consumer lag is high
  - alert: KafkaConsumerLagHigh
    expr: kafka_consumer_lag > 1000
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "Kafka consumer lag > 1000 messages"
```

---

## Grafana Dashboard

### Health Check Dashboard JSON

```json
{
  "dashboard": {
    "title": "Vextrus ERP Health Checks",
    "panels": [
      {
        "title": "Health Check Status",
        "targets": [
          {
            "expr": "health_check_status",
            "legendFormat": "{{ check_name }} ({{ service }})"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Health Check Response Time",
        "targets": [
          {
            "expr": "health_check_response_time_ms",
            "legendFormat": "{{ check_name }}"
          }
        ],
        "type": "graph",
        "yaxes": [
          { "format": "ms" }
        ]
      },
      {
        "title": "Current Health Status",
        "targets": [
          {
            "expr": "health_check_status"
          }
        ],
        "type": "stat",
        "options": {
          "colorMode": "background",
          "graphMode": "none",
          "textMode": "value_and_name"
        },
        "fieldConfig": {
          "defaults": {
            "mappings": [
              {
                "type": "value",
                "options": {
                  "0": {
                    "text": "Unhealthy",
                    "color": "red"
                  },
                  "1": {
                    "text": "Healthy",
                    "color": "green"
                  }
                }
              }
            ]
          }
        }
      }
    ]
  }
}
```

---

## OpenTelemetry Integration

```typescript
// health-telemetry.interceptor.ts
import { Injectable, NestInterceptor } from '@nestjs/common';
import { trace } from '@opentelemetry/api';

@Injectable()
export class HealthTelemetryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const tracer = trace.getTracer('health-checks');
    const span = tracer.startSpan('health_check');

    return next.handle().pipe(
      tap((result) => {
        // Record health check result in span
        span.setAttributes({
          'health.status': result.status,
          'health.checks.total': Object.keys(result.details).length,
          'health.checks.failed': Object.values(result.details).filter(
            (d: any) => d.status !== 'up',
          ).length,
        });

        span.end();
      }),
      catchError((error) => {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.end();
        throw error;
      }),
    );
  }
}
```

---

## PagerDuty Integration

```typescript
// pagerduty.service.ts
@Injectable()
export class PagerDutyService {
  private readonly pdClient: PagerDutyClient;

  async sendHealthCheckAlert(checkName: string, error: string) {
    await this.pdClient.createIncident({
      title: `Health check failed: ${checkName}`,
      body: {
        type: 'incident_body',
        details: error,
      },
      urgency: 'high',
      incident_key: `health-check-${checkName}`,
    });
  }
}

// health.controller.ts
@Get('ready')
@HealthCheck()
async checkReadiness() {
  try {
    return await this.health.check([...checks]);
  } catch (error) {
    // Alert on-call engineer
    await this.pagerDuty.sendHealthCheckAlert('readiness', error.message);
    throw error;
  }
}
```

---

## Slack Notifications

```typescript
// slack.service.ts
@Injectable()
export class SlackService {
  private readonly webhookUrl = process.env.SLACK_WEBHOOK_URL;

  async sendHealthCheckAlert(checkName: string, status: string) {
    const message = {
      text: `🔴 Health Check Failed`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🔴 Health Check Alert',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Service:*\nFinance Service`,
            },
            {
              type: 'mrkdwn',
              text: `*Check:*\n${checkName}`,
            },
            {
              type: 'mrkdwn',
              text: `*Status:*\n${status}`,
            },
            {
              type: 'mrkdwn',
              text: `*Time:*\n${new Date().toISOString()}`,
            },
          ],
        },
      ],
    };

    await axios.post(this.webhookUrl, message);
  }
}
```

---

## Monitoring Best Practices

1. **Metrics**: Record status + response time
2. **Alerts**: Critical (1min), High (2min), Warning (5min)
3. **Dashboards**: Real-time health status
4. **OpenTelemetry**: Distributed tracing for health checks
5. **On-Call**: PagerDuty for critical failures
6. **Team Notifications**: Slack for warnings
7. **Historical Data**: Prometheus retention (30 days)
8. **Aggregation**: Group by service, check type
9. **SLO**: 99.9% uptime → max 43m downtime/month
10. **Runbooks**: Link alerts to troubleshooting docs

---

## Further Reading

- **Kubernetes Health**: `.claude/skills/health-check-patterns/resources/kubernetes-health.md`
- **Dependency Checks**: `.claude/skills/health-check-patterns/resources/dependency-checks.md`
- **Prometheus**: https://prometheus.io/
- **Grafana**: https://grafana.com/
