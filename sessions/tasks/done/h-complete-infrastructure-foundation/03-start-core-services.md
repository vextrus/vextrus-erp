---
task: h-complete-infrastructure-foundation/03-start-core-services
status: pending
created: 2025-09-20
---

# Subtask 3: Start Core Services

## Objective
Start all application services in the correct order with proper health checks and verification.

## Success Criteria
- [ ] All core services running (Auth, Master Data, Workflow, Rules Engine)
- [ ] All supporting services running (Notification, Audit, File Storage, etc.)
- [ ] GraphQL Federation Gateway operational
- [ ] Inter-service communication verified
- [ ] All health checks passing

## Tasks

### 1. Start Services in Order
- [ ] Infrastructure services (already running)
- [ ] Auth service
- [ ] Master Data service
- [ ] Configuration service
- [ ] Rules Engine service
- [ ] Workflow service
- [ ] Notification service
- [ ] Other supporting services
- [ ] API Gateway (last)

### 2. Verify Health Endpoints
- [ ] Check /health endpoint for each service
- [ ] Check /ready endpoint for readiness
- [ ] Check /live endpoint for liveness
- [ ] Verify database connections
- [ ] Test Redis connections

### 3. Test Inter-Service Communication
- [ ] Auth service can validate tokens
- [ ] Master Data accessible via GraphQL
- [ ] Workflow can trigger rules
- [ ] Notifications can be sent
- [ ] Audit logs are captured

### 4. GraphQL Federation
- [ ] Verify all services registered
- [ ] Test federated queries
- [ ] Check schema stitching
- [ ] Validate resolvers

## Service Start Commands
```bash
# Start all services
docker-compose up -d

# Start services individually in order
docker-compose up -d auth
docker-compose up -d master-data
docker-compose up -d configuration
docker-compose up -d rules-engine
docker-compose up -d workflow
docker-compose up -d notification
docker-compose up -d audit
docker-compose up -d file-storage
docker-compose up -d api-gateway

# Check service status
docker-compose ps
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

## Validation
```bash
# Check all services are running
docker ps | grep vextrus | wc -l

# Test health endpoints
for port in 3001 3002 3003 3004 3005 3006 3007 3008 3009 3011 3012 4000; do
  echo "Testing port $port:"
  curl -s http://localhost:$port/health || echo "Failed"
done
```