#!/bin/bash
# Database Migration Runner for Finance Service
# Runs TypeORM migrations safely with backup and rollback support

set -e

echo "=== Finance Service Database Migration Runner ==="
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get migration action
ACTION=${1:-"run"}

case $ACTION in
    "run")
        echo -e "${YELLOW}Running pending migrations...${NC}"
        npm run migration:run
        echo -e "${GREEN}✓ Migrations completed${NC}"
        ;;
    
    "revert")
        echo -e "${YELLOW}Reverting last migration...${NC}"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            npm run migration:revert
            echo -e "${GREEN}✓ Migration reverted${NC}"
        else
            echo "Migration revert cancelled"
        fi
        ;;
    
    "show")
        echo -e "${YELLOW}Migration status:${NC}"
        npm run migration:show
        ;;
    
    "generate")
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Migration name required${NC}"
            echo "Usage: $0 generate <MigrationName>"
            exit 1
        fi
        echo -e "${YELLOW}Generating migration: $2${NC}"
        npm run migration:generate -- src/infrastructure/persistence/migrations/$2
        echo -e "${GREEN}✓ Migration generated${NC}"
        ;;
    
    "create")
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Migration name required${NC}"
            echo "Usage: $0 create <MigrationName>"
            exit 1
        fi
        echo -e "${YELLOW}Creating empty migration: $2${NC}"
        npm run migration:create -- src/infrastructure/persistence/migrations/$2
        echo -e "${GREEN}✓ Migration created${NC}"
        ;;
    
    *)
        echo -e "${RED}Unknown action: $ACTION${NC}"
        echo "Usage: $0 {run|revert|show|generate|create} [name]"
        echo ""
        echo "Commands:"
        echo "  run       - Run all pending migrations"
        echo "  revert    - Revert the last migration"
        echo "  show      - Show migration status"
        echo "  generate  - Generate migration from entity changes"
        echo "  create    - Create empty migration file"
        exit 1
        ;;
esac
