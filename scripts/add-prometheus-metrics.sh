#!/bin/bash

# Script to add prom-client dependency to infrastructure services

services=("file-storage" "document-generator" "scheduler" "configuration" "import-export")

for service in "${services[@]}"; do
    package_file="services/$service/package.json"

    echo "Adding prom-client to $service..."

    # Check if prom-client already exists
    if grep -q '"prom-client"' "$package_file"; then
        echo "  ✓ $service already has prom-client"
    else
        # Add prom-client after pg dependency
        sed -i '/"pg":/a\    "prom-client": "^15.1.0",' "$package_file"
        echo "  ✓ Added prom-client to $service"
    fi
done

echo "Done! All services now have prom-client dependency."