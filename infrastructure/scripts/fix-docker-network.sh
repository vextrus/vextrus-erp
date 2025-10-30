#!/bin/bash

# Docker Network Fix Script
# Resolves common Docker networking and pull issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================"
echo "Docker Network Troubleshooting Script"
echo "======================================"
echo ""

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
    elif [ "$status" = "info" ]; then
        echo -e "${BLUE}ℹ${NC} $message"
    else
        echo "  $message"
    fi
}

# 1. Check Docker version
echo "1. Docker Information:"
docker_version=$(docker --version 2>/dev/null || echo "Not installed")
print_status "info" "Docker version: $docker_version"

# 2. Check Docker daemon status
echo ""
echo "2. Docker Daemon Status:"
if docker info > /dev/null 2>&1; then
    print_status "success" "Docker daemon is running"
    
    # Check for proxy settings
    if docker info 2>/dev/null | grep -q "Http Proxy\|Https Proxy"; then
        print_status "warning" "Proxy detected in Docker configuration"
        echo "  Consider checking proxy settings if having connectivity issues"
    fi
else
    print_status "error" "Docker daemon is not running"
    echo "  Start Docker Desktop or run: sudo systemctl start docker"
    exit 1
fi

# 3. Test DNS resolution
echo ""
echo "3. DNS Resolution Test:"
if nslookup registry-1.docker.io > /dev/null 2>&1; then
    print_status "success" "DNS resolution working for Docker Hub"
else
    print_status "error" "DNS resolution failed for Docker Hub"
    echo "  Try changing DNS servers:"
    echo "    - Google DNS: 8.8.8.8, 8.8.4.4"
    echo "    - Cloudflare DNS: 1.1.1.1, 1.0.0.1"
fi

# 4. Test Docker Hub connectivity
echo ""
echo "4. Docker Hub Connectivity:"
if curl -s -o /dev/null -w "%{http_code}" https://hub.docker.com | grep -q "200\|301\|302"; then
    print_status "success" "Docker Hub is reachable"
else
    print_status "error" "Cannot reach Docker Hub"
    echo "  - Check internet connection"
    echo "  - Check firewall/proxy settings"
    echo "  - Try using VPN if Docker Hub is blocked"
fi

# 5. Check rate limiting
echo ""
echo "5. Docker Hub Rate Limiting:"
if [ -z "$DOCKER_USERNAME" ]; then
    print_status "warning" "Not logged in to Docker Hub"
    echo "  Anonymous users have lower rate limits (100 pulls per 6 hours)"
    echo "  Consider logging in: docker login"
else
    print_status "info" "Logged in as: $DOCKER_USERNAME"
    echo "  Authenticated users have higher rate limits (200 pulls per 6 hours)"
fi

# 6. Provide solutions
echo ""
echo "======================================"
echo "Recommended Solutions:"
echo "======================================"
echo ""

echo "Option 1: Use Alternative Registry (Recommended)"
echo "-------------------------------------------------"
print_status "info" "Use GitHub Container Registry mirror:"
echo "  docker pull ghcr.io/temporalio/temporal:1.22.0"
echo "  docker pull ghcr.io/temporalio/temporal-ui:2.21.0"
echo ""

echo "Option 2: Configure Docker with Better DNS"
echo "-------------------------------------------------"
print_status "info" "Create/edit /etc/docker/daemon.json (Linux/Mac) or Docker Desktop settings (Windows):"
echo '  {
    "dns": ["8.8.8.8", "8.8.4.4"],
    "max-concurrent-downloads": 2,
    "max-concurrent-uploads": 2,
    "registry-mirrors": ["https://mirror.gcr.io"]
  }'
echo "  Then restart Docker"
echo ""

echo "Option 3: Use Docker Compose Without Temporal"
echo "-------------------------------------------------"
print_status "info" "Use the alternative compose file:"
echo "  docker-compose -f docker-compose-without-temporal.yml up -d"
echo "  This runs all services except Temporal (workflow service in degraded mode)"
echo ""

echo "Option 4: Manual Pull with Retry"
echo "-------------------------------------------------"
print_status "info" "Try pulling with explicit settings:"
echo "  docker pull --platform linux/amd64 temporalio/auto-setup:1.22.0"
echo "  docker pull --platform linux/amd64 temporalio/ui:2.21.0"
echo ""

echo "Option 5: Use Local Registry Cache"
echo "-------------------------------------------------"
print_status "info" "Set up a local registry pull-through cache:"
echo "  docker run -d -p 5000:5000 --restart=always --name registry"
echo "    -e REGISTRY_PROXY_REMOTEURL=https://registry-1.docker.io"
echo "    registry:2"
echo ""

echo "Option 6: Build from Dockerfile Instead"
echo "-------------------------------------------------"
print_status "info" "Create local Dockerfiles for problematic images"
echo "  See: infrastructure/docker/temporal-alternative/"
echo ""

# 7. Test alternative registries
echo "Testing Alternative Registries:"
echo "--------------------------------"

# Test GitHub Container Registry
if curl -s -o /dev/null -w "%{http_code}" https://ghcr.io/v2/ | grep -q "200\|401\|403"; then
    print_status "success" "GitHub Container Registry is accessible"
else
    print_status "warning" "GitHub Container Registry may not be accessible"
fi

# Test Google Container Registry
if curl -s -o /dev/null -w "%{http_code}" https://gcr.io/v2/ | grep -q "200\|401\|403"; then
    print_status "success" "Google Container Registry is accessible"
else
    print_status "warning" "Google Container Registry may not be accessible"
fi

echo ""
echo "======================================"
echo "Quick Fix Commands:"
echo "======================================"
echo ""
echo "# 1. Restart Docker (Windows/Mac):"
echo "   Restart Docker Desktop from system tray"
echo ""
echo "# 2. Restart Docker (Linux):"
echo "   sudo systemctl restart docker"
echo ""
echo "# 3. Clear Docker cache:"
echo "   docker system prune -a --volumes"
echo ""
echo "# 4. Login to Docker Hub:"
echo "   docker login"
echo ""
echo "# 5. Use the non-Temporal stack:"
echo "   docker-compose -f docker-compose-without-temporal.yml up -d"
echo ""

exit 0