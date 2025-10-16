#!/bin/bash
# Build script for heavy dependency services
# Run this directly in your terminal outside Docker first

echo "========================================="
echo "Building Heavy Dependency Services Locally"
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

# Function to build a service
build_service() {
    local service_name=$1
    local service_dir=$2

    echo -e "\n${YELLOW}Building $service_name...${NC}"
    cd services/$service_dir

    # Clean previous builds
    rm -rf node_modules dist

    # Install dependencies with timeout
    echo "Installing dependencies..."
    timeout 600 pnpm install
    check_status "Dependencies installation for $service_name"

    # Build the service
    echo "Building service..."
    pnpm build
    check_status "Build for $service_name"

    cd ../..
    echo -e "${GREEN}$service_name built successfully!${NC}"
}

# Main execution
echo -e "${YELLOW}Starting local build process...${NC}\n"

# Update lockfile first
echo "Updating pnpm lockfile..."
pnpm install
check_status "Lockfile update"

# Build each heavy service
echo -e "\n${YELLOW}1. Building Document Generator Service${NC}"
build_service "document-generator" "document-generator"

echo -e "\n${YELLOW}2. Building File Storage Service${NC}"
build_service "file-storage" "file-storage"

echo -e "\n${YELLOW}3. Building Import/Export Service${NC}"
build_service "import-export" "import-export"

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}All services built successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"

# Show built artifacts
echo -e "\n${YELLOW}Built artifacts:${NC}"
ls -la services/document-generator/dist 2>/dev/null && echo "✓ document-generator/dist"
ls -la services/file-storage/dist 2>/dev/null && echo "✓ file-storage/dist"
ls -la services/import-export/dist 2>/dev/null && echo "✓ import-export/dist"

echo -e "\n${YELLOW}Next step: Run docker-heavy-build.sh to create optimized Docker images${NC}"