# Infrastructure Access Guide

## Current Infrastructure Status (2025-09-17)

### ✅ Running Services

| Service | Status | Access URL | Purpose |
|---------|--------|------------|---------|
| **Grafana** | ✅ Running | http://localhost:3000 | Metrics visualization |
| **Prometheus** | ✅ Running | http://localhost:9090 | Metrics collection |
| **Temporal UI** | ✅ Running | http://localhost:8088 | Workflow management |
| **PostgreSQL** | ✅ Running | localhost:5432 | Primary database |
| **Redis** | ✅ Running | localhost:6379 | Caching & sessions |
| **Kafka** | ✅ Running | localhost:9092-9093 | Event streaming |
| **Jaeger** | ⚠️ Check status | http://localhost:16686 | Distributed tracing |
| **MinIO** | ⚠️ Check status | http://localhost:9000 | Object storage |
| **Adminer** | ⚠️ Check status | http://localhost:8082 | Database UI |
| **Redis Commander** | ✅ Running | http://localhost:8083 | Redis UI |
| **Kafka UI** | ✅ Running | http://localhost:8085 | Kafka management |

## Accessing Grafana Dashboards

### 1. Open Grafana
```bash
# Open in browser
open http://localhost:3000
# Or on Windows
start http://localhost:3000
```

### 2. Login Credentials
- **Username**: admin
- **Password**: vextrus_grafana_2024

### 3. Available Dashboards
Navigate to **Dashboards** → **Browse** to access:

1. **Service Health Dashboard** (`service-health`)
   - Real-time service status
   - Response times (95th percentile)
   - Error rates and request rates
   - Database connection pool usage
   - Redis memory usage

2. **Business KPIs Dashboard** (`business-kpis`)
   - Total revenue in BDT
   - Active purchase orders
   - Pending approvals count
   - VAT collection (15% rate)
   - Tax withholding by vendor type
   - NBR compliance score
   - Workflow completion rates

3. **Infrastructure Metrics Dashboard** (`infrastructure-metrics`)
   - Kubernetes pod status
   - CPU and memory usage by service
   - Network and disk I/O
   - HPA scaling events
   - Temporal queue lag
   - Kafka consumer lag

### 4. Import Dashboards (If Not Visible)
If dashboards aren't loaded:
```bash
# Dashboards are located at:
ls infrastructure/monitoring/grafana/dashboards/
```

1. Go to **Dashboards** → **Import**
2. Upload JSON files from the dashboards directory
3. Select Prometheus as the data source

## Accessing Other UIs

### Temporal Workflow UI
```bash
open http://localhost:8088
```
- View running workflows
- Check workflow history
- Debug failed workflows
- Monitor activity execution

### Redis Commander
```bash
open http://localhost:8083
```
- View cached data
- Monitor session storage
- Check Redis memory usage
- Flush cache if needed

### Kafka UI
```bash
open http://localhost:8085
```
- Monitor topics and partitions
- View consumer groups
- Check message lag
- Browse messages

### Database Admin (Adminer)
```bash
# Start if not running
docker start vextrus-adminer
open http://localhost:8082
```
- **System**: PostgreSQL
- **Server**: vextrus-postgres
- **Username**: vextrus_user
- **Password**: vextrus_password
- **Database**: vextrus_db

## Verifying Service Health

### Quick Health Check
```bash
# Check all services
docker ps | grep vextrus

# Check specific service logs
docker logs vextrus-grafana --tail 50
docker logs vextrus-temporal --tail 50

# Test service endpoints
curl http://localhost:3000/api/health  # Grafana
curl http://localhost:9090/-/healthy   # Prometheus
curl http://localhost:7233/health      # Temporal
```

### Start Missing Services
```bash
# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Start core services
docker-compose up -d

# Start specific service
docker-compose up -d grafana
```

## Troubleshooting

### Grafana Not Loading
```bash
# Check container status
docker ps -a | grep grafana

# Restart Grafana
docker restart vextrus-grafana

# Check logs for errors
docker logs vextrus-grafana --tail 100
```

### Prometheus Not Collecting Metrics
```bash
# Check Prometheus targets
open http://localhost:9090/targets

# Verify scrape configuration
docker exec vextrus-prometheus cat /etc/prometheus/prometheus.yml
```

### Services Not Starting
```bash
# Check port conflicts
netstat -an | grep -E "3000|9090|7233|5432|6379"

# Clean restart
docker-compose down
docker-compose up -d
```

## Default Credentials Summary

| Service | Username | Password | Notes |
|---------|----------|----------|-------|
| Grafana | admin | vextrus_grafana_2024 | Set in docker-compose |
| PostgreSQL | vextrus_user | vextrus_password | Database: vextrus_db |
| MinIO | minioadmin | minioadmin | Change in production |
| Temporal | - | - | No auth in dev mode |

## Next Steps
1. Access Grafana and verify dashboards are loading
2. Check Temporal UI for workflow status
3. Verify all health endpoints are responding
4. Begin business module development (see NEXT_STEPS_ROADMAP.md)