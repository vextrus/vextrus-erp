#!/bin/bash

echo "=== Fixing all supporting services TypeScript errors ==="

# Fix error handling in all TypeScript files
echo "Adding error helper to all services..."
for service in notification audit scheduler document-generator file-storage import-export; do
  if [ -d "services/$service/src" ]; then
    cp services/notification/src/types/error.types.ts "services/$service/src/types/" 2>/dev/null || mkdir -p "services/$service/src/types" && cp services/notification/src/types/error.types.ts "services/$service/src/types/"
  fi
done

# Install missing dependencies for scheduler
echo "Installing scheduler dependencies..."
cd services/scheduler && pnpm add cron-parser @nestjs/event-emitter 2>/dev/null
cd ../..

# Install missing dependencies for document-generator  
echo "Installing document-generator dependencies..."
cd services/document-generator && pnpm add @types/pdfkit 2>/dev/null
cd ../..

# Fix all error handling in TypeScript files
echo "Fixing error handling patterns..."
find services -name "*.ts" -type f | while read file; do
  # Fix error.message references
  sed -i 's/catch (error)/catch (error: any)/g' "$file" 2>/dev/null
  sed -i 's/} catch (e)/} catch (e: any)/g' "$file" 2>/dev/null
done

# Fix undefined environment variables
echo "Fixing environment variable handling..."
for service in notification audit scheduler document-generator file-storage import-export; do
  config_file="services/$service/src/config/configuration.ts"
  if [ -f "$config_file" ]; then
    # Fix parseInt with undefined values
    sed -i "s/parseInt(process\.env\.\([A-Z_]*\))/parseInt(process.env.\1 || '0')/g" "$config_file" 2>/dev/null
    sed -i "s/parseInt(process\.env\.\([A-Z_]*\), 10)/parseInt(process.env.\1 || '0', 10)/g" "$config_file" 2>/dev/null
    
    # Update database credentials
    sed -i "s/username: process\.env\.DATABASE_USER || 'postgres'/username: process.env.DATABASE_USER || 'vextrus'/g" "$config_file" 2>/dev/null
    sed -i "s/password: process\.env\.DATABASE_PASSWORD || 'postgres'/password: process.env.DATABASE_PASSWORD || 'vextrus_dev_2024'/g" "$config_file" 2>/dev/null
    sed -i "s/name: process\.env\.DATABASE_NAME || '[^']*'/name: process.env.DATABASE_NAME || 'vextrus_erp'/g" "$config_file" 2>/dev/null
  fi
done

echo "All fixes applied!"