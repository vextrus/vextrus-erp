#!/bin/bash

echo "=== COMPREHENSIVE SERVICE ANALYSIS ==="
echo "Date: $(date)"
echo ""

# Service categories
INFRASTRUCTURE_SERVICES="audit notification file-storage document-generator scheduler configuration import-export"
CORE_SERVICES="auth master-data workflow rules-engine api-gateway"
BUSINESS_SERVICES="crm finance hr organization project-management scm"

echo "=== SERVICE INVENTORY ==="
echo "Infrastructure Services (7): $INFRASTRUCTURE_SERVICES"
echo "Core Business Services (5): $CORE_SERVICES"
echo "Business Module Services (6): $BUSINESS_SERVICES"
echo ""

# Check metrics for all services
echo "=== METRICS IMPLEMENTATION STATUS ==="
for service in $INFRASTRUCTURE_SERVICES $CORE_SERVICES; do
    if [ -f "services/$service/src/modules/metrics/metrics.service.ts" ]; then
        echo "✅ $service - has metrics module"
    else
        if grep -q "prom-client" "services/$service/package.json" 2>/dev/null; then
            echo "⚠️  $service - has prom-client but no metrics module"
        else
            echo "❌ $service - no metrics implementation"
        fi
    fi
done
echo ""

# Check migrations
echo "=== DATABASE MIGRATIONS STATUS ==="
for service in $INFRASTRUCTURE_SERVICES $CORE_SERVICES; do
    migration_count=$(ls services/$service/src/migrations/*.ts 2>/dev/null | wc -l)
    if [ $migration_count -gt 0 ]; then
        echo "✅ $service - $migration_count migration(s)"
    else
        echo "❌ $service - no migrations"
    fi
done
echo ""

# Check GraphQL federation
echo "=== GRAPHQL FEDERATION STATUS ==="
for service in $INFRASTRUCTURE_SERVICES $CORE_SERVICES; do
    if grep -q "@apollo/subgraph" "services/$service/package.json" 2>/dev/null; then
        echo "✅ $service - has GraphQL federation"
    else
        echo "❌ $service - no GraphQL federation"
    fi
done
echo ""

# Check Kafka integration
echo "=== KAFKA INTEGRATION STATUS ==="
for service in $INFRASTRUCTURE_SERVICES $CORE_SERVICES; do
    if grep -q "kafkajs" "services/$service/package.json" 2>/dev/null; then
        echo "✅ $service - has Kafka integration"
    else
        echo "❌ $service - no Kafka integration"
    fi
done
echo ""

# Check health endpoints
echo "=== HEALTH CHECK STATUS ==="
for service in $INFRASTRUCTURE_SERVICES $CORE_SERVICES; do
    if [ -f "services/$service/src/health/health.controller.ts" ]; then
        echo "✅ $service - has health controller"
    else
        echo "❌ $service - no health controller"
    fi
done
echo ""

# Check service ports
echo "=== SERVICE PORT ASSIGNMENTS ==="
echo "3001 - Auth Service"
echo "3002 - Master Data Service"
echo "3003 - Notification Service"
echo "3004 - File Storage Service"
echo "3005 - Scheduler Service"
echo "3006 - CRM Service"
echo "3007 - Configuration Service"
echo "3008 - Document Generator Service"
echo "3009 - Audit Service"
echo "3010 - Import/Export Service"
echo "3011 - Workflow Service"
echo "3012 - Rules Engine Service"
echo "4000 - API Gateway"
echo ""

echo "=== SUMMARY ==="
echo "Total Services: 19"
echo "Infrastructure Services: 7"
echo "Core Business Services: 5"
echo "Business Module Services: 6"
echo "Template: 1"