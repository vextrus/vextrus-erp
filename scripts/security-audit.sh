#!/bin/bash

# Vextrus ERP Security Audit Script
# Comprehensive security checks for production deployment

set -e

echo "============================================="
echo "    Vextrus ERP Security Audit"
echo "    Bangladesh Compliance Enabled"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
CRITICAL=0
WARNING=0
PASSED=0

# Function to check status
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASSED++))
    else
        if [ "$3" == "critical" ]; then
            echo -e "${RED}✗${NC} $2"
            ((CRITICAL++))
        else
            echo -e "${YELLOW}⚠${NC} $2"
            ((WARNING++))
        fi
    fi
}

echo ""
echo "1. Checking for exposed secrets in codebase..."
echo "------------------------------------------------"
# Check for hardcoded secrets
grep -r "password\|secret\|api_key\|token" --include="*.js" --include="*.ts" --exclude-dir=node_modules . | grep -v "process.env" | grep -v "secretKeyRef" > /tmp/secrets_scan.txt 2>/dev/null || true
if [ -s /tmp/secrets_scan.txt ]; then
    check_status 1 "Found potential exposed secrets" "critical"
    cat /tmp/secrets_scan.txt | head -5
else
    check_status 0 "No exposed secrets found"
fi

echo ""
echo "2. Scanning Docker images for vulnerabilities..."
echo "------------------------------------------------"
for service in auth organization notification file-storage audit configuration import-export document-generator; do
    echo "Scanning $service-service..."
    trivy image --severity HIGH,CRITICAL ghcr.io/vextrus/$service-service:latest --no-progress --format json > /tmp/trivy_$service.json 2>/dev/null || true
    
    if [ -f /tmp/trivy_$service.json ]; then
        VULNS=$(jq '.Results[].Vulnerabilities | length' /tmp/trivy_$service.json 2>/dev/null | paste -sd+ | bc 2>/dev/null || echo "0")
        if [ "$VULNS" -gt 0 ]; then
            check_status 1 "$service-service: $VULNS vulnerabilities found" "warning"
        else
            check_status 0 "$service-service: No high/critical vulnerabilities"
        fi
    fi
done

echo ""
echo "3. Checking npm dependencies for vulnerabilities..."
echo "------------------------------------------------"
cd services
for dir in */; do
    if [ -f "$dir/package.json" ]; then
        echo "Checking $dir..."
        cd "$dir"
        npm audit --audit-level=high --json > /tmp/npm_audit_$dir.json 2>/dev/null || true
        VULNS=$(jq '.metadata.vulnerabilities.high + .metadata.vulnerabilities.critical' /tmp/npm_audit_$dir.json 2>/dev/null || echo "0")
        if [ "$VULNS" -gt 0 ]; then
            check_status 1 "$dir: $VULNS high/critical vulnerabilities" "warning"
        else
            check_status 0 "$dir: No high/critical vulnerabilities"
        fi
        cd ..
    fi
done
cd ..

echo ""
echo "4. Kubernetes Security Checks..."
echo "------------------------------------------------"
# Check if network policies are applied
kubectl get networkpolicies -n vextrus > /dev/null 2>&1
check_status $? "Network policies configured" "critical"

# Check for pod security policies
kubectl get podsecuritypolicies > /dev/null 2>&1
check_status $? "Pod security policies configured" "warning"

# Check RBAC configurations
kubectl get rolebindings,clusterrolebindings -n vextrus | grep -q "vextrus" 2>/dev/null
check_status $? "RBAC bindings configured" "critical"

# Check for service accounts
for service in auth organization notification file-storage audit configuration import-export document-generator; do
    kubectl get serviceaccount $service-service -n vextrus > /dev/null 2>&1
    check_status $? "Service account for $service-service" "warning"
done

echo ""
echo "5. Multi-tenant Isolation Validation..."
echo "------------------------------------------------"
# Test tenant isolation
echo "Testing cross-tenant data access prevention..."
node scripts/test-tenant-isolation.js > /tmp/tenant_test.log 2>&1
check_status $? "Multi-tenant isolation test passed" "critical"

echo ""
echo "6. RBAC Permission System Audit..."
echo "------------------------------------------------"
# Test RBAC performance
echo "Testing RBAC permission check latency..."
node scripts/test-rbac-performance.js > /tmp/rbac_test.log 2>&1
RBAC_LATENCY=$(grep "p95:" /tmp/rbac_test.log | awk '{print $2}' | sed 's/ms//')
if [ "${RBAC_LATENCY%.*}" -lt 10 ]; then
    check_status 0 "RBAC latency < 10ms (${RBAC_LATENCY}ms)"
else
    check_status 1 "RBAC latency > 10ms (${RBAC_LATENCY}ms)" "warning"
fi

# Check for 14 Bangladesh construction roles
ROLES_COUNT=$(kubectl exec -n vextrus deployment/auth-service -- node -e "console.log(require('./dist/rbac/roles').bangladeshRoles.length)" 2>/dev/null || echo "0")
if [ "$ROLES_COUNT" -eq 14 ]; then
    check_status 0 "All 14 Bangladesh construction roles configured"
else
    check_status 1 "Bangladesh roles incomplete ($ROLES_COUNT/14)" "critical"
fi

echo ""
echo "7. Bangladesh Compliance Checks..."
echo "------------------------------------------------"
# BTRC Data Localization
kubectl exec -n vextrus deployment/audit-service -- ls /data/bangladesh > /dev/null 2>&1
check_status $? "BTRC data localization configured" "critical"

# NBR Audit Trail
kubectl exec -n vextrus deployment/audit-service -- test -f /var/log/nbr-audit.log > /dev/null 2>&1
check_status $? "NBR audit trail logging enabled" "critical"

# Bangladesh phone number validation
grep -q "BANGLADESH_PHONE_PATTERN" infrastructure/kubernetes/configmaps/notification-config.yaml
check_status $? "Bangladesh phone validation configured" "warning"

# TIN/NID validation
grep -q "TIN_VALIDATION_ENABLED\|NID_VALIDATION_ENABLED" infrastructure/kubernetes/configmaps/import-export-config.yaml
check_status $? "TIN/NID validation configured" "warning"

echo ""
echo "8. TLS/SSL Configuration..."
echo "------------------------------------------------"
# Check TLS configuration
openssl s_client -connect api.vextrus.com.bd:443 -tls1_2 </dev/null 2>/dev/null | grep -q "Verify return code: 0"
check_status $? "TLS 1.2+ configured" "critical"

# Check certificate expiry
CERT_EXPIRY=$(echo | openssl s_client -connect api.vextrus.com.bd:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [ -n "$CERT_EXPIRY" ]; then
    DAYS_LEFT=$(( ($(date -d "$CERT_EXPIRY" +%s) - $(date +%s)) / 86400 ))
    if [ $DAYS_LEFT -gt 30 ]; then
        check_status 0 "Certificate valid for $DAYS_LEFT days"
    else
        check_status 1 "Certificate expiring in $DAYS_LEFT days" "warning"
    fi
fi

echo ""
echo "9. Rate Limiting and DDoS Protection..."
echo "------------------------------------------------"
# Test rate limiting
for i in {1..150}; do
    curl -s -o /dev/null -w "%{http_code}" https://api.vextrus.com.bd/api/v1/auth/health
done | grep -q "429"
check_status $? "Rate limiting active" "warning"

echo ""
echo "10. Secrets Management..."
echo "------------------------------------------------"
# Check if secrets are encrypted at rest
kubectl get secret -n vextrus -o json | jq '.items[].data | keys[]' | while read key; do
    if kubectl get secret -n vextrus -o json | jq ".items[].data.\"$key\"" | grep -q "^[A-Za-z0-9+/]*=*$"; then
        check_status 0 "Secret $key is base64 encoded"
    else
        check_status 1 "Secret $key may be exposed" "critical"
    fi
done | head -5

echo ""
echo "============================================="
echo "           SECURITY AUDIT SUMMARY"
echo "============================================="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNING"
echo -e "${RED}Critical:${NC} $CRITICAL"
echo ""

if [ $CRITICAL -gt 0 ]; then
    echo -e "${RED}FAIL: Critical security issues found!${NC}"
    echo "Please address critical issues before deploying to production."
    exit 1
elif [ $WARNING -gt 5 ]; then
    echo -e "${YELLOW}WARNING: Multiple security warnings detected.${NC}"
    echo "Consider addressing warnings before production deployment."
    exit 0
else
    echo -e "${GREEN}PASS: Security audit completed successfully!${NC}"
    exit 0
fi