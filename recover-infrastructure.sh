#!/bin/bash

# Infrastructure Recovery Script
# Run this after Docker Desktop is restarted and working

echo "=== Infrastructure Recovery Script ==="
echo "Starting recovery process..."

# 1. Check Docker daemon health
echo ""
echo "[1/6] Checking Docker daemon..."
docker version > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "ERROR: Docker daemon is not responding. Please restart Docker Desktop."
    exit 1
fi
echo "✓ Docker daemon is healthy"

# 2. Check existing containers
echo ""
echo "[2/6] Checking existing containers..."
docker ps --format "table {{.Names}}\t{{.Status}}" | grep vextrus

# 3. Fix any stopped containers
echo ""
echo "[3/6] Starting stopped core services..."
docker-compose up -d postgres redis kafka zookeeper temporal elasticsearch

# 4. Start SignOz OTEL Collector if not running
echo ""
echo "[4/6] Ensuring SignOz OTEL Collector is running..."
docker-compose up -d signoz-otel-collector

# 5. Start core application services
echo ""
echo "[5/6] Starting core application services..."
docker-compose up -d auth master-data configuration notification audit workflow rules-engine

# Wait for services to initialize
echo "Waiting 30 seconds for services to initialize..."
sleep 30

# 6. Start new business services
echo ""
echo "[6/6] Starting business services..."
docker-compose up -d scheduler document-generator import-export file-storage crm finance hr organization project-management scm

# Wait for services to start
echo "Waiting 30 seconds for services to start..."
sleep 30

# Check health endpoints
echo ""
echo "=== Health Check Results ==="
echo ""

services=(
    "3001:Auth"
    "3002:Master-Data"
    "3003:Notification"
    "3004:Configuration"
    "3005:Scheduler"
    "3006:Document-Generator"
    "3007:Import-Export"
    "3008:File-Storage"
    "3009:Audit"
    "3011:Workflow"
    "3012:Rules-Engine"
    "3013:CRM"
    "3014:Finance"
    "3015:HR"
    "3016:Organization"
    "3017:Project-Management"
    "3018:SCM"
)

healthy_count=0
total_count=0

for service in "${services[@]}"; do
    IFS=':' read -r port name <<< "$service"
    total_count=$((total_count + 1))

    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health)

    if [ "$response" = "200" ]; then
        echo "✓ $name (port $port): Healthy"
        healthy_count=$((healthy_count + 1))
    else
        echo "✗ $name (port $port): Not responding (HTTP $response)"
    fi
done

echo ""
echo "=== Summary ==="
echo "Healthy services: $healthy_count/$total_count"

if [ $healthy_count -eq $total_count ]; then
    echo "✓ All services are healthy!"
else
    echo "⚠ Some services are not healthy. Check logs with:"
    echo "  docker-compose logs [service-name] --tail 50"
fi

echo ""
echo "=== Monitoring Services ==="
echo "Prometheus: http://localhost:9090"
echo "Grafana: http://localhost:3000 (admin/admin)"
echo "Jaeger: http://localhost:16686"
echo "Temporal UI: http://localhost:8088"

echo ""
echo "Recovery complete!"