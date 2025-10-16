#!/bin/bash

# Start all services locally (they'll connect to Docker infrastructure)

echo "Starting services locally..."
echo "Make sure Docker infrastructure is running: docker-compose -f docker-compose-core.yml up -d"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to start service in new terminal
start_service() {
    local service_name=$1
    local service_path=$2
    local port=$3
    
    echo -e "${YELLOW}Starting $service_name on port $port...${NC}"
    
    # Windows Git Bash / MinGW
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        start cmd //c "cd $service_path && npm run start:dev"
    # macOS
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e "tell app \"Terminal\" to do script \"cd $(pwd)/$service_path && npm run start:dev\""
    # Linux
    else
        gnome-terminal -- bash -c "cd $service_path && npm run start:dev; exec bash"
    fi
}

# Start services
start_service "Auth Service" "services/auth" 3001
sleep 2
start_service "Master Data Service" "services/master-data" 3010
sleep 2
start_service "Workflow Service" "services/workflow" 3011
sleep 2
start_service "Rules Engine Service" "services/rules-engine" 3012
sleep 2
start_service "API Gateway" "services/api-gateway" 4000

echo ""
echo -e "${GREEN}All services starting...${NC}"
echo ""
echo "Service URLs:"
echo "  Auth Service: http://localhost:3001"
echo "  Master Data: http://localhost:3010"
echo "  Workflow: http://localhost:3011"
echo "  Rules Engine: http://localhost:3012"
echo "  API Gateway: http://localhost:4000/graphql"
echo ""
echo "Infrastructure URLs:"
echo "  PostgreSQL: localhost:5432"
echo "  Redis: localhost:6379"
echo "  Kafka: localhost:9092"
echo "  MinIO: http://localhost:9001"
echo ""
echo "Press Ctrl+C in each terminal to stop services"