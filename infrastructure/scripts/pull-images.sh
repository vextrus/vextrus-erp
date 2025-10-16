#!/bin/bash

# Docker Image Pull Script with Retry Logic
# This script pulls Docker images with retry logic to handle network timeouts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
MAX_RETRIES=3
RETRY_DELAY=10

# List of images to pull
IMAGES=(
    "traefik:v3.5"
    "postgres:16-alpine"
    "redis:7-alpine"
    "confluentinc/cp-zookeeper:7.5.0"
    "confluentinc/cp-kafka:7.5.0"
    "provectuslabs/kafka-ui:latest"
    "minio/minio:latest"
    "elasticsearch:8.11.1"
    "rabbitmq:3-management"
    "clickhouse/clickhouse-server:23.8-alpine"
    "signoz/signoz-otel-collector:0.88.11"
    "signoz/frontend:0.38.2"
    "signoz/query-service:0.38.2"
    "adminer:4.8.1"
    "rediscommander/redis-commander:latest"
    "verdaccio/verdaccio:5"
    "temporalio/auto-setup:1.22.0"
    "temporalio/ui:2.21.0"
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

# Function to pull image with retry
pull_image_with_retry() {
    local image=$1
    local attempt=1
    
    echo ""
    echo "Pulling image: $image"
    
    while [ $attempt -le $MAX_RETRIES ]; do
        echo "  Attempt $attempt of $MAX_RETRIES..."
        
        if docker pull "$image" 2>/dev/null; then
            print_status "success" "Successfully pulled $image"
            return 0
        else
            if [ $attempt -lt $MAX_RETRIES ]; then
                print_status "warning" "Failed to pull $image, retrying in ${RETRY_DELAY}s..."
                sleep $RETRY_DELAY
            else
                print_status "error" "Failed to pull $image after $MAX_RETRIES attempts"
                return 1
            fi
        fi
        
        ((attempt++))
    done
}

# Main script
echo "======================================"
echo "Docker Image Pull Script"
echo "======================================"
echo ""

# Check if Docker is running
echo "Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    print_status "error" "Docker is not running. Please start Docker first."
    exit 1
fi
print_status "success" "Docker is running"
echo ""

# Configure Docker settings for better performance
echo "Configuring Docker settings..."

# Set DNS if needed (helps with network issues)
if [ -f /etc/docker/daemon.json ]; then
    print_status "info" "Docker daemon.json exists, skipping DNS configuration"
else
    print_status "info" "Consider adding DNS settings to Docker if having network issues:"
    echo '  {
    "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1"]
  }'
fi

# Pull images
echo ""
echo "Starting image pulls..."
echo "Total images to pull: ${#IMAGES[@]}"

failed_images=()
successful_count=0

for image in "${IMAGES[@]}"; do
    if pull_image_with_retry "$image"; then
        ((successful_count++))
    else
        failed_images+=("$image")
    fi
done

# Summary
echo ""
echo "======================================"
echo "Pull Summary"
echo "======================================"
echo "Successfully pulled: $successful_count/${#IMAGES[@]} images"

if [ ${#failed_images[@]} -gt 0 ]; then
    echo ""
    print_status "error" "Failed to pull the following images:"
    for image in "${failed_images[@]}"; do
        echo "  - $image"
    done
    echo ""
    echo "Troubleshooting tips:"
    echo "1. Check your internet connection"
    echo "2. Try using a VPN if Docker Hub is blocked"
    echo "3. Configure Docker to use alternative registries"
    echo "4. Increase timeout settings in Docker"
    echo "5. Try pulling failed images manually:"
    echo "   docker pull <image-name>"
    exit 1
else
    print_status "success" "All images pulled successfully!"
    echo ""
    echo "You can now run: docker-compose up -d"
fi

exit 0