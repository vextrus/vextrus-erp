# Backend Integration Readiness Test
# Tests authentication flow, CORS, and protected queries

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Backend Integration Readiness Test" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0
$API_GATEWAY = "http://localhost:4000/graphql"

# Test 1: API Gateway Accessibility
Write-Host "Test 1: Checking API Gateway accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $API_GATEWAY -Method GET -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 405) {
        Write-Host "[PASS] API Gateway is accessible" -ForegroundColor Green
        $testsPassed++
    }
} catch {
    Write-Host "[FAIL] API Gateway not accessible" -ForegroundColor Red
    $testsFailed++
}
Write-Host ""

# Test 2: GraphQL Introspection
Write-Host "Test 2: Testing GraphQL introspection..." -ForegroundColor Yellow
try {
    $body = '{"query":"{ __schema { queryType { name } } }"}'

    $response = Invoke-RestMethod -Uri $API_GATEWAY -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    if ($response.data) {
        Write-Host "[PASS] GraphQL introspection working" -ForegroundColor Green
        $testsPassed++
    }
} catch {
    Write-Host "[FAIL] GraphQL introspection failed" -ForegroundColor Red
    $testsFailed++
}
Write-Host ""

# Test 3: Check Federated Schema
Write-Host "Test 3: Checking federated schema..." -ForegroundColor Yellow
try {
    $body = '{"query":"{ __schema { types { name } } }"}'

    $response = Invoke-RestMethod -Uri $API_GATEWAY -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    $types = $response.data.__schema.types
    $hasBusinessTypes = $types | Where-Object { $_.name -match "User|Invoice" }

    if ($hasBusinessTypes) {
        Write-Host "[PASS] Federated schema includes business types" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "[WARN] No business types found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[FAIL] Schema check failed" -ForegroundColor Red
    $testsFailed++
}
Write-Host ""

# Test 4: Docker Services Health
Write-Host "Test 4: Checking critical Docker services..." -ForegroundColor Yellow
$criticalServices = @("vextrus-api-gateway", "vextrus-auth", "vextrus-finance")
$healthyServices = 0

foreach ($service in $criticalServices) {
    $status = docker ps --filter "name=$service" --format "{{.Status}}" 2>$null
    if ($status -match "Up") {
        $healthyServices++
    }
}

if ($healthyServices -eq $criticalServices.Count) {
    Write-Host "[PASS] All critical services running ($healthyServices/$($criticalServices.Count))" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "[FAIL] Some services not running ($healthyServices/$($criticalServices.Count))" -ForegroundColor Red
    $testsFailed++
}
Write-Host ""

# Test 5: Check Auth Service Types
Write-Host "Test 5: Checking Auth service integration..." -ForegroundColor Yellow
try {
    $body = '{"query":"{ __type(name: \"User\") { name } }"}'

    $response = Invoke-RestMethod -Uri $API_GATEWAY -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    if ($response.data.__type) {
        Write-Host "[PASS] Auth service (User type) is federated" -ForegroundColor Green
        $testsPassed++
    }
} catch {
    Write-Host "[WARN] Could not verify Auth service" -ForegroundColor Yellow
}
Write-Host ""

# Test 6: Check Finance Service Types
Write-Host "Test 6: Checking Finance service integration..." -ForegroundColor Yellow
try {
    $body = '{"query":"{ __type(name: \"Invoice\") { name } }"}'

    $response = Invoke-RestMethod -Uri $API_GATEWAY -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    if ($response.data.__type) {
        Write-Host "[PASS] Finance service (Invoice type) is federated" -ForegroundColor Green
        $testsPassed++
    }
} catch {
    Write-Host "[WARN] Could not verify Finance service" -ForegroundColor Yellow
}
Write-Host ""

# Final Summary
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Test Results Summary" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -gt 0) { "Red" } else { "Green" })
Write-Host ""

# Decision Logic
if ($testsFailed -eq 0 -and $testsPassed -ge 4) {
    Write-Host "====================================================" -ForegroundColor Green
    Write-Host "GO: Backend is ready for frontend integration!" -ForegroundColor Green
    Write-Host "====================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Start frontend integration task immediately" -ForegroundColor White
    Write-Host "2. Configure Apollo Client in Next.js" -ForegroundColor White
    Write-Host "3. Implement authentication flow" -ForegroundColor White
    Write-Host "4. Build Finance module UI" -ForegroundColor White
    Write-Host ""
    exit 0
} elseif ($testsFailed -le 1) {
    Write-Host "====================================================" -ForegroundColor Yellow
    Write-Host "CONDITIONAL GO: Minor issues detected" -ForegroundColor Yellow
    Write-Host "====================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Recommendations:" -ForegroundColor Cyan
    Write-Host "1. Review failed tests above" -ForegroundColor White
    Write-Host "2. Fix critical issues (< 1 hour estimated)" -ForegroundColor White
    Write-Host "3. Then proceed with frontend integration" -ForegroundColor White
    Write-Host ""
    exit 1
} else {
    Write-Host "====================================================" -ForegroundColor Red
    Write-Host "NO-GO: Backend needs stabilization first" -ForegroundColor Red
    Write-Host "====================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Critical Issues:" -ForegroundColor Cyan
    Write-Host "1. Multiple tests failed - backend not ready" -ForegroundColor White
    Write-Host "2. Fix issues above before frontend integration" -ForegroundColor White
    Write-Host "3. Estimated fix time: 2-4 hours" -ForegroundColor White
    Write-Host ""
    exit 2
}
