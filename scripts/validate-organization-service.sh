#!/bin/bash
set -e

echo "Validating Organization Service Production Infrastructure..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Summary counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
ERRORS=""

# Function to check if file exists
check_file() {
    local file=$1
    local description=$2
    
    ((TOTAL_CHECKS++))
    echo -n "  Checking $description... "
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC}"
        ((PASSED_CHECKS++))
        return 0
    else
        echo -e "${RED}✗${NC}"
        ((FAILED_CHECKS++))
        ERRORS="$ERRORS\n  - Missing: $file"
        return 1
    fi
}

# Function to check directory exists
check_dir() {
    local dir=$1
    local description=$2
    
    ((TOTAL_CHECKS++))
    echo -n "  Checking $description... "
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC}"
        ((PASSED_CHECKS++))
        return 0
    else
        echo -e "${RED}✗${NC}"
        ((FAILED_CHECKS++))
        ERRORS="$ERRORS\n  - Missing directory: $dir"
        return 1
    fi
}

echo -e "\n${BLUE}=== Phase 1: Entity Validation ===${NC}"
echo "Checking entity definitions..."

check_file "services/organization/src/entities/organization.entity.ts" "Organization entity"
check_file "services/organization/src/entities/tenant.entity.ts" "Tenant entity"
check_file "services/organization/src/entities/division.entity.ts" "Division entity"
check_file "services/organization/src/entities/index.ts" "Entity exports"

echo -e "\n${BLUE}=== Phase 2: Health Module Validation ===${NC}"
echo "Checking health infrastructure..."

check_dir "services/organization/src/modules/health" "Health module directory"
check_file "services/organization/src/modules/health/health.module.ts" "Health module"
check_file "services/organization/src/modules/health/health.controller.ts" "Health controller"
check_file "services/organization/src/modules/health/health.service.ts" "Health service"

echo -e "\n${BLUE}=== Phase 3: Metrics Module Validation ===${NC}"
echo "Checking metrics infrastructure..."

check_dir "services/organization/src/modules/metrics" "Metrics module directory"
check_file "services/organization/src/modules/metrics/metrics.module.ts" "Metrics module"
check_file "services/organization/src/modules/metrics/metrics.controller.ts" "Metrics controller"
check_file "services/organization/src/modules/metrics/metrics.service.ts" "Metrics service"

echo -e "\n${BLUE}=== Phase 4: Kafka Module Validation ===${NC}"
echo "Checking Kafka integration..."

check_dir "services/organization/src/modules/kafka" "Kafka module directory"
check_file "services/organization/src/modules/kafka/kafka.module.ts" "Kafka module"
check_file "services/organization/src/modules/kafka/kafka.service.ts" "Kafka service"

echo -e "\n${BLUE}=== Phase 5: Database Migration Validation ===${NC}"
echo "Checking database migrations..."

check_dir "services/organization/src/migrations" "Migrations directory"
check_file "services/organization/src/migrations/20250925120000-OrganizationServiceInitial.ts" "Initial migration"

echo -e "\n${BLUE}=== Phase 6: Module Configuration ===${NC}"
echo "Checking module configuration..."

check_file "services/organization/src/app.module.ts" "App module"
check_file "services/organization/src/main.ts" "Main bootstrap file"

echo -e "\n${BLUE}=== Phase 7: Bangladesh-Specific Features ===${NC}"
echo "Verifying Bangladesh ERP compliance features..."

# Check if entities have Bangladesh-specific fields
((TOTAL_CHECKS++))
echo -n "  Checking TIN/BIN fields in Organization entity... "
if grep -q "tin.*string" services/organization/src/entities/organization.entity.ts && \
   grep -q "bin.*string" services/organization/src/entities/organization.entity.ts; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}✗${NC}"
    ((FAILED_CHECKS++))
    ERRORS="$ERRORS\n  - Missing TIN/BIN fields in Organization entity"
fi

((TOTAL_CHECKS++))
echo -n "  Checking regulatory compliance fields... "
if grep -q "regulatoryBody" services/organization/src/entities/organization.entity.ts && \
   grep -q "tradeLicense" services/organization/src/entities/organization.entity.ts; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}✗${NC}"
    ((FAILED_CHECKS++))
    ERRORS="$ERRORS\n  - Missing regulatory compliance fields"
fi

((TOTAL_CHECKS++))
echo -n "  Checking multi-tenant support in Tenant entity... "
if grep -q "class Tenant" services/organization/src/entities/tenant.entity.ts && \
   grep -q "companyInfo" services/organization/src/entities/tenant.entity.ts; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}✗${NC}"
    ((FAILED_CHECKS++))
    ERRORS="$ERRORS\n  - Missing multi-tenant support in Tenant entity"
fi

echo -e "\n${BLUE}=== Phase 8: Production Features ===${NC}"
echo "Verifying production-ready features..."

((TOTAL_CHECKS++))
echo -n "  Checking health endpoints implementation... "
if grep -q "health()" services/organization/src/modules/health/health.controller.ts && \
   grep -q "liveness()" services/organization/src/modules/health/health.controller.ts && \
   grep -q "readiness()" services/organization/src/modules/health/health.controller.ts; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}✗${NC}"
    ((FAILED_CHECKS++))
    ERRORS="$ERRORS\n  - Incomplete health endpoints"
fi

((TOTAL_CHECKS++))
echo -n "  Checking metrics implementation... "
if grep -q "organization_total" services/organization/src/modules/metrics/metrics.service.ts && \
   grep -q "tenant_total" services/organization/src/modules/metrics/metrics.service.ts && \
   grep -q "license_usage" services/organization/src/modules/metrics/metrics.service.ts; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}✗${NC}"
    ((FAILED_CHECKS++))
    ERRORS="$ERRORS\n  - Incomplete metrics implementation"
fi

((TOTAL_CHECKS++))
echo -n "  Checking Kafka event publishing... "
if grep -q "publishOrganizationCreated" services/organization/src/modules/kafka/kafka.service.ts && \
   grep -q "publishTenantCreated" services/organization/src/modules/kafka/kafka.service.ts && \
   grep -q "publishComplianceValidated" services/organization/src/modules/kafka/kafka.service.ts; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}✗${NC}"
    ((FAILED_CHECKS++))
    ERRORS="$ERRORS\n  - Incomplete Kafka event publishing"
fi

# Summary
echo -e "\n${BLUE}=== Validation Summary ===${NC}"
echo -e "Total checks: $TOTAL_CHECKS"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "\n${GREEN}✓ Organization Service is production-ready!${NC}"
    echo -e "\n${GREEN}All production infrastructure components are in place:${NC}"
    echo "  ✓ Entity definitions with Bangladesh-specific fields"
    echo "  ✓ Health monitoring endpoints"
    echo "  ✓ Prometheus metrics collection"
    echo "  ✓ Kafka event integration"
    echo "  ✓ Database migrations"
    echo "  ✓ Multi-tenant support"
    echo "  ✓ Compliance validation features"
    exit 0
else
    echo -e "\n${RED}Validation failed with $FAILED_CHECKS errors:${NC}"
    echo -e "$ERRORS"
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo "1. Review the missing components listed above"
    echo "2. Ensure all modules are properly imported in app.module.ts"
    echo "3. Check that TypeORM entities are registered"
    echo "4. Verify environment variables are configured"
    exit 1
fi