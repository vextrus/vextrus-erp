#!/bin/bash

# Infrastructure Validation Script for Vextrus ERP
# This script validates that all services are properly configured and running

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
SERVICES=(
    "postgres"
    "redis"
    "kafka"
    "minio"
    "elasticsearch"
    "temporal"
    "auth"
    "master-data"
    "workflow"
    "rules-engine"
    "api-gateway"
    "signoz-clickhouse"
    "signoz-otel-collector"
    "signoz-query-service"
    "signoz-frontend"
)

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    
    if [ "$status" = "success" ]; then
        echo -e "${GREEN}✓${NC} $message"
    elif [ "$status" = "error" ]; then
        echo -e "${RED}✗${NC} $message"
    elif [ "$status" = "warning" ]; then
        echo -e "${YELLOW}⚠${NC} $message"
    else
        echo "  $message"
    fi
}

# Function to check if a service is running
check_service() {
    local service=$1
    if docker-compose ps | grep -q "$service.*Up"; then
        return 0
    else
        return 1
    fi
}

# Function to check service health
check_health() {
    local service=$1
    local health=$(docker inspect --format='{{.State.Health.Status}}' "vextrus-$service" 2>/dev/null || echo "none")
    
    if [ "$health" = "healthy" ]; then
        return 0
    elif [ "$health" = "none" ]; then
        return 2  # No health check defined
    else
        return 1  # Unhealthy
    fi
}

# Function to test HTTP endpoint
test_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        return 0
    else
        return 1
    fi
}

# Function to test database connection
test_database() {
    docker exec vextrus-postgres psql -U vextrus -d vextrus_erp -c "SELECT 1" > /dev/null 2>&1
    return $?
}

# Function to test Redis connection
test_redis() {
    docker exec vextrus-redis redis-cli -a vextrus_redis_2024 ping > /dev/null 2>&1
    return $?
}

# Function to test Kafka
test_kafka() {
    docker exec vextrus-kafka kafka-topics --bootstrap-server localhost:9093 --list > /dev/null 2>&1
    return $?
}

# Main validation script
echo "======================================"
echo "Vextrus ERP Infrastructure Validation"
echo "======================================"
echo ""

# Check if Docker is running
echo "1. Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    print_status "error" "Docker is not running. Please start Docker first."
    exit 1
fi
print_status "success" "Docker is running"
echo ""

# Check if docker-compose file exists
echo "2. Checking docker-compose.yml..."
if [ ! -f "$COMPOSE_FILE" ]; then
    print_status "error" "$COMPOSE_FILE not found"
    exit 1
fi
print_status "success" "$COMPOSE_FILE found"
echo ""

# Check service status
echo "3. Checking service status..."
for service in "${SERVICES[@]}"; do
    if check_service "$service"; then
        # Check health if available
        check_health "$service"
        health_status=$?
        if [ $health_status -eq 0 ]; then
            print_status "success" "$service is running and healthy"
        elif [ $health_status -eq 2 ]; then
            print_status "success" "$service is running"
        else
            print_status "warning" "$service is running but unhealthy"
        fi
    else
        print_status "error" "$service is not running"
    fi
done
echo ""

# Test core infrastructure
echo "4. Testing core infrastructure..."

# PostgreSQL
if test_database; then
    print_status "success" "PostgreSQL connection successful"
else
    print_status "error" "PostgreSQL connection failed"
fi

# Redis
if test_redis; then
    print_status "success" "Redis connection successful"
else
    print_status "error" "Redis connection failed"
fi

# Kafka
if test_kafka; then
    print_status "success" "Kafka connection successful"
else
    print_status "error" "Kafka connection failed"
fi
echo ""

# Test service endpoints
echo "5. Testing service endpoints..."

# Auth service
if test_endpoint "http://localhost:3001/health"; then
    print_status "success" "Auth service endpoint accessible"
else
    print_status "warning" "Auth service endpoint not accessible"
fi

# Master Data service
if test_endpoint "http://localhost:3010/health"; then
    print_status "success" "Master Data service endpoint accessible"
else
    print_status "warning" "Master Data service endpoint not accessible"
fi

# Workflow service
if test_endpoint "http://localhost:3011/health"; then
    print_status "success" "Workflow service endpoint accessible"
else
    print_status "warning" "Workflow service endpoint not accessible"
fi

# Rules Engine service
if test_endpoint "http://localhost:3012/health"; then
    print_status "success" "Rules Engine service endpoint accessible"
else
    print_status "warning" "Rules Engine service endpoint not accessible"
fi

# API Gateway
if test_endpoint "http://localhost:4000/.well-known/apollo/server-health"; then
    print_status "success" "API Gateway endpoint accessible"
else
    print_status "warning" "API Gateway endpoint not accessible"
fi

# Traefik Dashboard
if test_endpoint "http://localhost:8080/api/overview"; then
    print_status "success" "Traefik dashboard accessible"
else
    print_status "warning" "Traefik dashboard not accessible"
fi

# Temporal UI
if test_endpoint "http://localhost:8088"; then
    print_status "success" "Temporal UI accessible"
else
    print_status "warning" "Temporal UI not accessible"
fi

# SigNoz Frontend
if test_endpoint "http://localhost:3301"; then
    print_status "success" "SigNoz monitoring UI accessible"
else
    print_status "warning" "SigNoz monitoring UI not accessible"
fi
echo ""

# Test observability
echo "6. Testing observability stack..."

# OpenTelemetry Collector
if test_endpoint "http://localhost:4318/v1/traces" 405; then
    print_status "success" "OpenTelemetry HTTP endpoint ready"
else
    print_status "warning" "OpenTelemetry HTTP endpoint not ready"
fi

# SigNoz Query Service
if test_endpoint "http://localhost:8081/api/v1/services"; then
    print_status "success" "SigNoz query service accessible"
else
    print_status "warning" "SigNoz query service not accessible"
fi
echo ""

# Summary
echo "======================================"
echo "Validation Summary"
echo "======================================"

# Count running services
running_count=0
for service in "${SERVICES[@]}"; do
    if check_service "$service"; then
        ((running_count++))
    fi
done

echo "Services: $running_count/${#SERVICES[@]} running"

# Provide recommendations
if [ $running_count -lt ${#SERVICES[@]} ]; then
    echo ""
    echo "Recommendations:"
    echo "1. Start missing services: docker-compose up -d"
    echo "2. Check logs for failed services: docker-compose logs [service-name]"
    echo "3. Restart unhealthy services: docker-compose restart [service-name]"
fi

echo ""
echo "Access Points:"
echo "  - GraphQL Playground: http://localhost:4000/graphql"
echo "  - Traefik Dashboard: http://localhost:8080"
echo "  - Temporal UI: http://localhost:8088"
echo "  - SigNoz Monitoring: http://localhost:3301"
echo "  - Kafka UI: http://localhost:8085"
echo "  - MinIO Console: http://localhost:9001"
echo "  - Adminer (DB): http://localhost:8082"
echo "  - Redis Commander: http://localhost:8083"
echo "  - RabbitMQ Management: http://localhost:15672"
echo "  - Verdaccio (NPM): http://localhost:4873"

exit 0