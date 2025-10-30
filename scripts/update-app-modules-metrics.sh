#!/bin/bash

# Script to update app.module.ts files to import MetricsModule
# Usage: ./update-app-modules-metrics.sh

set -e

echo "=== Updating app.module.ts files to import MetricsModule ==="
echo ""

# Function to update app.module for a service
update_app_module() {
    local SERVICE=$1
    local APP_MODULE="services/$SERVICE/src/app.module.ts"

    echo "Processing $SERVICE..."

    if [ ! -f "$APP_MODULE" ]; then
        echo "⚠️  app.module.ts not found for $SERVICE"
        return
    fi

    # Check if MetricsModule is already imported
    if grep -q "MetricsModule" "$APP_MODULE"; then
        echo "✅ $SERVICE already has MetricsModule imported"
        return
    fi

    echo "Adding MetricsModule import to $SERVICE..."

    # Add import statement after HealthModule import if it exists, otherwise before @Module
    if grep -q "HealthModule" "$APP_MODULE"; then
        # Add after HealthModule import
        sed -i "/import.*HealthModule.*from/a\import { MetricsModule } from './modules/metrics/metrics.module';" "$APP_MODULE"
    else
        # Add before @Module decorator
        sed -i '/@Module({/i\import { MetricsModule } from '"'"'./modules/metrics/metrics.module'"'"';\n' "$APP_MODULE"
    fi

    # Add MetricsModule to imports array after HealthModule if it exists
    if grep -q "HealthModule," "$APP_MODULE"; then
        # Add after HealthModule
        sed -i '/HealthModule,/a\    MetricsModule,' "$APP_MODULE"
    else
        # Add as first import after @Module decorator
        sed -i '/@Module({/,/imports: \[/ {
            /imports: \[/a\    MetricsModule,
        }' "$APP_MODULE"
    fi

    echo "✅ Updated $SERVICE"
}

# Update all core services
SERVICES=("auth" "master-data" "workflow" "rules-engine" "api-gateway")

for SERVICE in "${SERVICES[@]}"; do
    update_app_module "$SERVICE"
done

echo ""
echo "=== App Module Updates Complete ==="
echo ""
echo "Next steps:"
echo "1. Build all services to verify: npm run build"
echo "2. Test metrics endpoints: curl http://localhost:PORT/metrics"
echo "3. Verify Prometheus can scrape the metrics"
echo ""