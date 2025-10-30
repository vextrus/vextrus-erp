#!/bin/bash
# Docker build script for heavy dependency services
# Uses optimized multi-stage Dockerfile

echo "========================================="
echo "Building Heavy Services with Docker"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 successful${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Function to build Docker image for a service
build_docker_image() {
    local service_name=$1
    local service_path=$2

    echo -e "\n${YELLOW}Building Docker image for $service_name...${NC}"

    # Build the Docker image using the optimized Dockerfile
    docker build \
        -f infrastructure/docker/services/heavy-service.Dockerfile \
        --build-arg SERVICE_NAME=$service_name \
        --build-arg SERVICE_PATH=$service_path \
        -t vextrus-erp/$service_name:latest \
        --progress=plain \
        .

    check_status "Docker build for $service_name"

    # Show image size
    echo -e "${GREEN}Image size:${NC}"
    docker images vextrus-erp/$service_name:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
}

# Main execution
echo -e "${YELLOW}Starting Docker build process for heavy services...${NC}\n"

# Clean old images if requested
if [ "$1" == "--clean" ]; then
    echo "Cleaning old images..."
    docker rmi vextrus-erp/document-generator:latest 2>/dev/null || true
    docker rmi vextrus-erp/file-storage:latest 2>/dev/null || true
    docker rmi vextrus-erp/import-export:latest 2>/dev/null || true
    echo "Old images removed."
fi

# Build each heavy service with Docker
echo -e "\n${YELLOW}1. Building Document Generator Service${NC}"
build_docker_image "document-generator" "document-generator"

echo -e "\n${YELLOW}2. Building File Storage Service${NC}"
build_docker_image "file-storage" "file-storage"

echo -e "\n${YELLOW}3. Building Import/Export Service${NC}"
build_docker_image "import-export" "import-export"

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}All Docker images built successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"

# Show all built images
echo -e "\n${YELLOW}Built Docker images:${NC}"
docker images | grep vextrus-erp | grep -E "document-generator|file-storage|import-export"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Update docker-compose.yml to use these images"
echo "2. Run: docker-compose up -d document-generator file-storage import-export"
echo "3. Check health: docker-compose ps"