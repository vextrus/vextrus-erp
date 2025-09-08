# Vextrus ERP Monitoring Stack (Free/OSS)

## Overview
Complete monitoring solution using 100% free and open-source tools for the Vextrus ERP system.

## Components

### Metrics & Visualization
- **Prometheus**: Time-series metrics database
- **Grafana OSS**: Dashboards and visualization
- **Node Exporter**: System metrics collector
- **Alert Manager**: Alert routing and management

### Logging
- **Loki**: Log aggregation (free alternative to ELK)
- **Promtail**: Log shipping agent

## Quick Start

### 1. Start Monitoring Stack
```bash
cd infrastructure/monitoring
docker-compose up -d
```

### 2. Access Dashboards
- **Grafana**: http://localhost:3030
  - Username: `admin`
  - Password: `vextrus2025`
- **Prometheus**: http://localhost:9090
- **Alert Manager**: http://localhost:9093

### 3. Configure Application Metrics

Add Prometheus metrics to your NestJS services:

```typescript
// main.ts
import { register } from 'prom-client';

// Enable metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});
```

## Dashboard Templates

### Package Publishing Dashboard
Monitors package registry and publishing pipeline:
- Publishing success rate
- Package download metrics
- Registry availability
- Version history

### System Health Dashboard
Overall system monitoring:
- CPU/Memory usage
- Disk I/O
- Network traffic
- Container health

### Application Performance
Service-level metrics:
- API response times
- Request throughput
- Error rates
- Database query performance

### Security Dashboard
Security-focused metrics:
- Failed authentication attempts
- API rate limiting
- Vulnerability scan results
- Package signature verification

## Alerts Configuration

### Critical Alerts
- Service down > 2 minutes
- Database connection pool > 80%
- Package registry unavailable
- Disk space < 10%

### Warning Alerts
- CPU usage > 80%
- Memory usage > 85%
- API response time > 500ms
- Redis memory > 90%

## Adding Custom Metrics

### Application Metrics
```javascript
// Example: Track package publishing
const publishCounter = new Counter({
  name: 'npm_publish_total',
  help: 'Total number of package publishes',
  labelNames: ['package', 'status']
});

// Success
publishCounter.inc({ package: '@vextrus/kernel', status: 'success' });

// Failure
publishCounter.inc({ package: '@vextrus/kernel', status: 'failure' });
```

### Custom Dashboards
1. Create JSON dashboard in Grafana
2. Export dashboard
3. Save to `grafana/dashboards/`
4. Restart Grafana container

## Log Aggregation

### Application Logging
Configure your app to write JSON logs:

```typescript
// logger.config.ts
import * as winston from 'winston';

export const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: '/var/log/vextrus/app.log' 
    })
  ]
});
```

### Viewing Logs
1. Open Grafana
2. Go to Explore
3. Select Loki datasource
4. Query: `{job="vextrus"}`

## Backup & Persistence

Data is persisted in Docker volumes:
- `prometheus_data`: Metrics history
- `grafana_data`: Dashboards and settings
- `loki_data`: Log storage
- `alertmanager_data`: Alert state

### Backup
```bash
# Backup all monitoring data
docker run --rm -v monitoring_prometheus_data:/data -v $(pwd):/backup alpine tar czf /backup/prometheus-backup.tar.gz /data
docker run --rm -v monitoring_grafana_data:/data -v $(pwd):/backup alpine tar czf /backup/grafana-backup.tar.gz /data
```

### Restore
```bash
# Restore from backup
docker run --rm -v monitoring_prometheus_data:/data -v $(pwd):/backup alpine tar xzf /backup/prometheus-backup.tar.gz -C /
docker run --rm -v monitoring_grafana_data:/data -v $(pwd):/backup alpine tar xzf /backup/grafana-backup.tar.gz -C /
```

## Resource Requirements

### Minimum (Development)
- CPU: 2 cores
- RAM: 4GB
- Disk: 10GB

### Recommended (Production)
- CPU: 4 cores
- RAM: 8GB
- Disk: 50GB (with 30-day retention)

## Troubleshooting

### Prometheus Not Scraping
```bash
# Check targets
curl http://localhost:9090/api/v1/targets

# Check service discovery
curl http://localhost:9090/api/v1/service-discovery
```

### Grafana Connection Issues
```bash
# Test datasource
curl http://localhost:3030/api/datasources/1/health

# Check logs
docker logs vextrus-grafana
```

### High Memory Usage
```bash
# Reduce retention
# Edit prometheus.yml
--storage.tsdb.retention.time=7d
--storage.tsdb.retention.size=5GB
```

## Cost Comparison

| Solution | Monthly Cost | Features |
|----------|-------------|----------|
| **Our Stack (OSS)** | $0 | Full metrics, logs, alerts |
| Datadog | $500+ | SaaS, more features |
| New Relic | $600+ | APM focused |
| AWS CloudWatch | $200+ | AWS integrated |

## Future Enhancements (When Budget Available)

### Paid Tools to Consider
1. **Datadog** ($500/month)
   - Advanced APM
   - Distributed tracing
   - ML-based anomaly detection

2. **Sentry** ($300/month)
   - Error tracking
   - Performance monitoring
   - Release tracking

3. **PagerDuty** ($200/month)
   - Advanced alerting
   - On-call management
   - Incident response

### Keep Using (Free)
- Grafana OSS
- Prometheus
- Loki
- Basic alerting

## Support

For monitoring issues:
1. Check container logs: `docker-compose logs [service]`
2. Verify network connectivity
3. Check disk space
4. Review configuration files

---

*Last Updated: 2025-09-08*
*Version: 1.0.0*
*Status: Production Ready*