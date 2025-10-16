#!/bin/bash

# Script to update app.module.ts files to import HealthModule
# Usage: ./update-app-modules-health.sh

set -e

echo "=== Updating app.module.ts files to import HealthModule ==="
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

    # Check if HealthModule is already imported
    if grep -q "HealthModule" "$APP_MODULE"; then
        echo "✅ $SERVICE already has HealthModule imported"
        return
    fi

    # Check if HealthController is imported (old pattern)
    if grep -q "HealthController" "$APP_MODULE"; then
        echo "Updating $SERVICE to use HealthModule instead of HealthController..."

        # Replace HealthController import with HealthModule
        sed -i "s|import { HealthController } from './controllers/health.controller';|import { HealthModule } from './modules/health/health.module';|g" "$APP_MODULE"

        # Remove HealthController from controllers array
        sed -i '/HealthController,/d' "$APP_MODULE"

        # Add HealthModule to imports
        if ! grep -q "HealthModule," "$APP_MODULE"; then
            # Add HealthModule as first import after @Module decorator
            sed -i '/@Module({/,/imports: \[/ {
                /imports: \[/a\    HealthModule,
            }' "$APP_MODULE"
        fi
    else
        echo "Adding HealthModule import to $SERVICE..."

        # Add import statement before @Module decorator
        sed -i '/@Module({/i\import { HealthModule } from '"'"'./modules/health/health.module'"'"';\n' "$APP_MODULE"

        # Add HealthModule to imports array
        sed -i '/@Module({/,/imports: \[/ {
            /imports: \[/a\    HealthModule,
        }' "$APP_MODULE"
    fi

    echo "✅ Updated $SERVICE"
}

# Update each service
SERVICES=("master-data" "workflow" "rules-engine" "api-gateway")

for SERVICE in "${SERVICES[@]}"; do
    update_app_module "$SERVICE"
done

# Auth service already has health module, but verify it's properly imported
echo ""
echo "Checking auth service..."
if grep -q "HealthModule" "services/auth/src/app.module.ts"; then
    echo "✅ Auth service already has HealthModule imported"
else
    update_app_module "auth"
fi

echo ""
echo "=== App Module Updates Complete ==="
echo ""
echo "Next steps:"
echo "1. Verify all services compile: npm run build"
echo "2. Test health endpoints: curl http://localhost:PORT/health"
echo "3. Run docker-compose up to verify all services start"
echo ""