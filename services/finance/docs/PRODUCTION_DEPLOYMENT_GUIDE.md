# Finance Service - Production Deployment Guide

**Version**: 1.0  
**Last Updated**: 2025-10-14  
**Service**: Finance (Invoice Management with CQRS + Event Sourcing)

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Infrastructure Setup](#infrastructure-setup)
4. [Database Migration](#database-migration)
5. [Deployment Steps](#deployment-steps)
6. [Health Checks](#health-checks)
7. [Monitoring & Observability](#monitoring--observability)
8. [Security Hardening](#security-hardening)
9. [Troubleshooting](#troubleshooting)
10. [Rollback Procedures](#rollback-procedures)

---

## Overview

The Finance service implements invoice management using:
- **Architecture**: Domain-Driven Design (DDD) + CQRS + Event Sourcing
- **Write Model**: EventStore DB (append-only event streams)
- **Read Model**: PostgreSQL (optimized for queries)
- **API**: GraphQL with Apollo Federation
- **Multi-Tenancy**: Schema-based isolation
- **Compliance**: Bangladesh tax regulations (TIN/BIN, VAT, Mushak-6.3)

---

## Prerequisites

### Required Services
- **PostgreSQL 16+**: Read model database
- **EventStore DB 23+**: Event sourcing write model
- **Kafka 3.5+**: Event bus for read model projection
- **Redis 7+**: Caching layer
- **Node.js 20+**: Runtime environment

### Optional Services
- **OpenTelemetry Collector**: Distributed tracing
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards

### Environment Variables
```bash
# Application
NODE_ENV=production
PORT=3006

# Database (PostgreSQL)
DATABASE_HOST=postgres.production.internal
DATABASE_PORT=5432
DATABASE_USERNAME=vextrus_finance_user
DATABASE_PASSWORD=<secure-password>
DATABASE_NAME=vextrus_finance
DATABASE_SSL=true
DATABASE_POOL_SIZE=20

# EventStore
EVENTSTORE_CONNECTION_STRING=esdb://eventstore.production.internal:2113?tls=true
EVENTSTORE_USERNAME=admin
EVENTSTORE_PASSWORD=<secure-password>
EVENTSTORE_POOL_SIZE=10

# Kafka
KAFKA_BROKERS=kafka-1.production.internal:9092,kafka-2.production.internal:9092
KAFKA_CLIENT_ID=finance-service
KAFKA_CONSUMER_GROUP_ID=finance-service-group
KAFKA_SSL=true

# Security
JWT_ACCESS_SECRET=<generate-with-openssl-rand-hex-64>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-hex-64>

# Observability
OTEL_SERVICE_NAME=finance-service
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
OTEL_TRACES_EXPORTER=otlp
OTEL_METRICS_EXPORTER=otlp
```

---

## Infrastructure Setup

### 1. PostgreSQL Database Setup

```sql
-- Create database
CREATE DATABASE vextrus_finance
    WITH ENCODING='UTF8'
    LC_COLLATE='en_US.UTF-8'
    LC_CTYPE='en_US.UTF-8';

-- Create service user
CREATE USER vextrus_finance_user WITH ENCRYPTED PASSWORD '<secure-password>';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE vextrus_finance TO vextrus_finance_user;

-- Connect to database
\c vextrus_finance

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO vextrus_finance_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vextrus_finance_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vextrus_finance_user;
```

### 2. EventStore DB Setup

```bash
# Docker Compose (recommended)
version: '3.8'
services:
  eventstore:
    image: eventstore/eventstore:23.10.0-bookworm-slim
    environment:
      - EVENTSTORE_CLUSTER_SIZE=1
      - EVENTSTORE_RUN_PROJECTIONS=All
      - EVENTSTORE_START_STANDARD_PROJECTIONS=true
      - EVENTSTORE_HTTP_PORT=2113
      - EVENTSTORE_INSECURE=false
      - EVENTSTORE_ENABLE_EXTERNAL_TCP=true
      - EVENTSTORE_ENABLE_ATOM_PUB_OVER_HTTP=true
    ports:
      - "2113:2113"
      - "1113:1113"
    volumes:
      - eventstore-data:/var/lib/eventstore
      - eventstore-logs:/var/log/eventstore
```

### 3. Kafka Setup

```yaml
version: '3.8'
services:
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: 'zookeeper:2181'
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
      KAFKA_NUM_PARTITIONS: 3
      KAFKA_DEFAULT_REPLICATION_FACTOR: 1
```

---

## Database Migration

### Step 1: Verify Migration Files

```bash
cd services/finance
ls -la src/infrastructure/persistence/migrations/
```

Expected file:
- `1736880000000-CreateInvoiceReadModel.ts`

### Step 2: Run Migrations

```bash
# Show pending migrations
npm run migration:show

# Run migrations
npm run migration:run

# Verify migrations
npm run migration:show
```

### Step 3: Verify Schema

```bash
# Connect to database
psql -h <host> -U vextrus_finance_user -d vextrus_finance

# Check tables
\dt

# Expected tables:
#  migrations
#  invoices

# Check invoices table structure
\d invoices

# Check indexes
\di
```

Expected indexes:
1. `PK_invoices` (PRIMARY KEY on id)
2. `IDX_invoices_tenant_invoice_number` (UNIQUE on tenantId, invoiceNumber)
3. `IDX_invoices_tenant_customer` (on tenantId, customerId)
4. `IDX_invoices_tenant_vendor` (on tenantId, vendorId)
5. `IDX_invoices_tenant_status` (on tenantId, status)
6. `IDX_invoices_tenant_fiscal_year` (on tenantId, fiscalYear)
7. `IDX_invoices_tenant_date` (on tenantId, invoiceDate)
8. `IDX_invoices_mushak_number` (on mushakNumber)

---

## Deployment Steps

### Option 1: Docker Deployment (Recommended)

```bash
# 1. Build Docker image
cd services/finance
docker build -t vextrus-erp/finance:latest -f ../../infrastructure/docker/templates/node-service-production.Dockerfile --build-arg SERVICE_NAME=finance --build-arg SERVICE_PORT=3006 .

# 2. Tag for registry
docker tag vextrus-erp/finance:latest registry.company.com/vextrus-erp/finance:1.0.0

# 3. Push to registry
docker push registry.company.com/vextrus-erp/finance:1.0.0

# 4. Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d finance
```

### Option 2: PM2 Deployment

```bash
# 1. Install dependencies
npm ci --production

# 2. Build application
npm run build

# 3. Run migrations
npm run migration:run

# 4. Start with PM2
pm2 start ecosystem.config.js --env production

# 5. Save PM2 configuration
pm2 save

# 6. Setup PM2 startup
pm2 startup systemd
```

**PM2 Ecosystem Config** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'finance-service',
    script: 'dist/main.js',
    instances: 4,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3006
    },
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_memory_restart: '1G'
  }]
};
```

### Option 3: Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finance-service
  namespace: vextrus-erp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: finance-service
  template:
    metadata:
      labels:
        app: finance-service
    spec:
      containers:
      - name: finance
        image: registry.company.com/vextrus-erp/finance:1.0.0
        ports:
        - containerPort: 3006
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_HOST
          valueFrom:
            secretKeyRef:
              name: finance-secrets
              key: database-host
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
            port: 3006
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3006
          initialDelaySeconds: 10
          periodSeconds: 5
```

---

## Health Checks

### Liveness Probe
```bash
curl http://localhost:3006/health/live
```

Expected Response:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "eventstore": { "status": "up" }
  }
}
```

### Readiness Probe
```bash
curl http://localhost:3006/health/ready
```

### GraphQL Endpoint
```bash
curl http://localhost:3006/graphql
```

---

## Monitoring & Observability

### OpenTelemetry Traces

The service automatically exports traces to the configured OTLP endpoint. Key spans:
- GraphQL operations (mutations, queries)
- Command execution (CreateInvoiceCommand, ApproveInvoiceCommand)
- EventStore operations (save, load aggregates)
- Database queries (read model)

### Prometheus Metrics

Expose metrics at: `http://localhost:3006/metrics`

Key metrics:
- `http_requests_total`: Total HTTP requests
- `graphql_operations_duration_seconds`: GraphQL operation latency
- `eventstore_append_duration_seconds`: EventStore write latency
- `database_query_duration_seconds`: Database query latency
- `nodejs_heap_size_used_bytes`: Memory usage

### Logging

Structured logging with correlation IDs:
```json
{
  "level": "info",
  "timestamp": "2025-01-15T10:30:00.123Z",
  "correlationId": "abc-123",
  "tenantId": "tenant-123",
  "message": "Invoice created",
  "context": {
    "invoiceId": "uuid",
    "customerId": "customer-001"
  }
}
```

---

## Security Hardening

### 1. JWT Configuration
```bash
# Generate secure secrets
openssl rand -hex 64 > jwt-access-secret.txt
openssl rand -hex 64 > jwt-refresh-secret.txt
```

### 2. Rate Limiting
Configure in API Gateway (Traefik/Nginx):
```yaml
# Traefik middleware
http:
  middlewares:
    rate-limit:
      rateLimit:
        average: 100
        burst: 200
```

### 3. Input Validation
All inputs are validated using:
- GraphQL schema validation
- Class-validator decorators
- Domain value objects (TIN, BIN, InvoiceNumber)

### 4. SQL Injection Prevention
- TypeORM parameterized queries
- No raw SQL in application code
- Read-only database user for query operations

### 5. CORS Configuration
```typescript
// In main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN?.split(',') || [],
  credentials: true,
});
```

---

## Troubleshooting

### Issue: Migrations Fail

**Symptom**: `npm run migration:run` fails  
**Solution**:
```bash
# Check database connectivity
psql -h <host> -U vextrus_finance_user -d vextrus_finance -c "SELECT 1"

# Check migration lock
SELECT * FROM migrations;

# If stuck, manually release lock (CAUTION)
DELETE FROM typeorm_metadata WHERE type = 'MIGRATION_LOCK';
```

### Issue: EventStore Connection Errors

**Symptom**: `ECONNREFUSED` errors in logs  
**Solution**:
```bash
# Check EventStore health
curl http://<eventstore-host>:2113/health/live

# Check connection string format
echo $EVENTSTORE_CONNECTION_STRING
# Should be: esdb://host:2113?tls=false
```

### Issue: Read Model Not Updating

**Symptom**: Queries return stale data  
**Solution**:
```bash
# Check Kafka consumer group lag
kafka-consumer-groups --bootstrap-server <kafka> --group finance-service-group --describe

# Check event handler logs
pm2 logs finance-service | grep "EventHandler"

# Manually trigger projection (development only)
# Query EventStore and replay events
```

### Issue: High Memory Usage

**Symptom**: Service crashes with OOM errors  
**Solution**:
```bash
# Check heap usage
curl http://localhost:3006/metrics | grep nodejs_heap

# Analyze heap dump
node --heap-prof dist/main.js

# Increase memory limit
NODE_OPTIONS="--max-old-space-size=2048" node dist/main.js
```

---

## Rollback Procedures

### Rollback Application

```bash
# PM2 rollback
pm2 restart finance-service --update-env

# Docker rollback
docker-compose -f docker-compose.prod.yml up -d finance:previous-version

# Kubernetes rollback
kubectl rollout undo deployment/finance-service -n vextrus-erp
```

### Rollback Database Migration

```bash
# Revert last migration
npm run migration:revert

# Verify rollback
npm run migration:show
```

### Emergency Rollback

```bash
# 1. Stop service
pm2 stop finance-service

# 2. Revert migration
npm run migration:revert

# 3. Deploy previous version
pm2 start ecosystem.config.js --env production

# 4. Verify health
curl http://localhost:3006/health/live
```

---

## Post-Deployment Checklist

- [ ] All infrastructure services running (PostgreSQL, EventStore, Kafka)
- [ ] Database migrations completed successfully
- [ ] Health checks passing (live and ready)
- [ ] GraphQL endpoint responding
- [ ] Sample invoice creation test passed
- [ ] OpenTelemetry traces visible in monitoring
- [ ] Prometheus metrics being collected
- [ ] Log aggregation working
- [ ] Backup procedures tested
- [ ] Rollback procedures documented
- [ ] On-call team notified

---

## Support & Contacts

**Service Owner**: Finance Team  
**On-Call**: PagerDuty rotation  
**Documentation**: https://docs.company.com/finance-service  
**Runbook**: https://runbooks.company.com/finance-service

---

**Document Version**: 1.0  
**Last Review**: 2025-10-14  
**Next Review**: 2025-11-14
