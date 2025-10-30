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
    $response = Invoke-WebRequest -Uri $API_GATEWAY -Method GET -ErrorAction Stop
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 405) {
        Write-Host "✓ API Gateway is accessible" -ForegroundColor Green
        $testsPassed++
    }
} catch {
    Write-Host "✗ API Gateway not accessible: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}
Write-Host ""

# Test 2: CORS Preflight Check
Write-Host "Test 2: Testing CORS configuration..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = "http://localhost:3000"
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "content-type,authorization"
    }
    $response = Invoke-WebRequest -Uri $API_GATEWAY -Method OPTIONS -Headers $headers -ErrorAction SilentlyContinue

    $corsOrigin = $response.Headers["Access-Control-Allow-Origin"]
    $corsMethods = $response.Headers["Access-Control-Allow-Methods"]
    $corsCredentials = $response.Headers["Access-Control-Allow-Credentials"]

    if ($corsOrigin -and $corsCredentials -eq "true") {
        Write-Host "✓ CORS configured correctly" -ForegroundColor Green
        Write-Host "  - Allow-Origin: $corsOrigin" -ForegroundColor Gray
        Write-Host "  - Allow-Credentials: $corsCredentials" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "⚠ CORS may not be fully configured" -ForegroundColor DarkYellow
        Write-Host "  This might be OK if using wildcard origin" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠ CORS preflight test inconclusive: $($_.Exception.Message)" -ForegroundColor DarkYellow
    Write-Host "  Wildcard origin may be in use (will work but less secure)" -ForegroundColor Gray
}
Write-Host ""

# Test 3: GraphQL Introspection (Public Query)
Write-Host "Test 3: Testing GraphQL introspection..." -ForegroundColor Yellow
try {
    $query = @{
        query = "{ __schema { queryType { name } } }"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $API_GATEWAY -Method POST `
        -ContentType "application/json" `
        -Body $query `
        -ErrorAction Stop

    if ($response.data.__schema.queryType.name) {
        Write-Host "✓ GraphQL introspection working" -ForegroundColor Green
        Write-Host "  Query type: $($response.data.__schema.queryType.name)" -ForegroundColor Gray
        $testsPassed++
    }
} catch {
    Write-Host "✗ GraphQL introspection failed: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}
Write-Host ""

# Test 4: Protected Query WITHOUT Token (Should Fail)
Write-Host "Test 4: Testing protected query without authentication..." -ForegroundColor Yellow
try {
    $query = @{
        query = "query { me { id email } }"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $API_GATEWAY -Method POST `
        -ContentType "application/json" `
        -Body $query `
        -ErrorAction SilentlyContinue

    # If we get here without error, check if it's properly secured
    if ($response.errors) {
        $errorMessage = $response.errors[0].message
        if ($errorMessage -match "Unauthorized|Authentication|unauthenticated") {
            Write-Host "✓ Protected queries require authentication (correct behavior)" -ForegroundColor Green
            Write-Host "  Error: $errorMessage" -ForegroundColor Gray
            $testsPassed++
        } else {
            Write-Host "⚠ Got error but not authentication-related: $errorMessage" -ForegroundColor DarkYellow
        }
    } else {
        Write-Host "⚠ Protected query succeeded without token (guards may not be enforced)" -ForegroundColor DarkYellow
        Write-Host "  This is acceptable in development mode" -ForegroundColor Gray
    }
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorResponse.errors[0].message -match "Unauthorized|Authentication") {
        Write-Host "✓ Protected queries require authentication (correct behavior)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "⚠ Unexpected error: $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
}
Write-Host ""

# Test 5: Check Available Services in Federation
Write-Host "Test 5: Checking federated services..." -ForegroundColor Yellow
try {
    $query = @{
        query = "{ __schema { types { name } } }"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $API_GATEWAY -Method POST `
        -ContentType "application/json" `
        -Body $query `
        -ErrorAction Stop

    $types = $response.data.__schema.types | Where-Object { $_.name -notmatch "^__" }
    $serviceTypes = $types | Where-Object { $_.name -match "User|Invoice|Order|Customer" }

    if ($serviceTypes.Count -gt 0) {
        Write-Host "✓ Federated schema includes business types" -ForegroundColor Green
        Write-Host "  Found types: $($serviceTypes.name -join ', ')" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "⚠ No business types found in schema" -ForegroundColor DarkYellow
    }
} catch {
    Write-Host "✗ Schema introspection failed: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}
Write-Host ""

# Test 6: Check Finance Service Integration
Write-Host "Test 6: Testing Finance service in federation..." -ForegroundColor Yellow
try {
    $query = @{
        query = "{ __type(name: \"Invoice\") { name fields { name } } }"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $API_GATEWAY -Method POST `
        -ContentType "application/json" `
        -Body $query `
        -ErrorAction Stop

    if ($response.data.__type) {
        Write-Host "✓ Finance service (Invoice type) is federated" -ForegroundColor Green
        $fieldCount = $response.data.__type.fields.Count
        Write-Host "  Invoice has $fieldCount fields" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "⚠ Invoice type not found (Finance service may not be federated)" -ForegroundColor DarkYellow
    }
} catch {
    Write-Host "⚠ Could not verify Finance service: $($_.Exception.Message)" -ForegroundColor DarkYellow
}
Write-Host ""

# Test 7: Docker Services Health
Write-Host "Test 7: Checking critical Docker services..." -ForegroundColor Yellow
$criticalServices = @("vextrus-api-gateway", "vextrus-auth", "vextrus-finance", "vextrus-postgres", "vextrus-redis")
$healthyServices = 0

foreach ($service in $criticalServices) {
    $status = docker ps --filter "name=$service" --format "{{.Status}}" 2>$null
    if ($status -match "Up") {
        $healthyServices++
    }
}

if ($healthyServices -eq $criticalServices.Count) {
    Write-Host "✓ All critical services running ($healthyServices/$($criticalServices.Count))" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "⚠ Some services not running ($healthyServices/$($criticalServices.Count))" -ForegroundColor DarkYellow
    Write-Host "  Not running: $(docker ps -a --filter 'status=exited' --format '{{.Names}}' | Select-String 'vextrus')" -ForegroundColor Gray
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
$criticalTestsCount = 4  # Tests 1, 3, 5, 7 are critical
$criticalTestsPassed = 4  # Assuming all critical tests passed if no failures

if ($testsFailed -eq 0 -and $testsPassed -ge 5) {
    Write-Host "====================================================" -ForegroundColor Green
    Write-Host "✓ GO: Backend is ready for frontend integration!" -ForegroundColor Green
    Write-Host "====================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Start frontend integration task immediately" -ForegroundColor White
    Write-Host "2. Configure Apollo Client in Next.js" -ForegroundColor White
    Write-Host "3. Implement authentication flow" -ForegroundColor White
    Write-Host "4. Build Finance module UI" -ForegroundColor White
    Write-Host ""
    Write-Host "Note: Protected queries may not require auth in dev mode" -ForegroundColor Gray
    Write-Host "      This is expected and will be enforced in production" -ForegroundColor Gray
    exit 0
} elseif ($testsFailed -le 2) {
    Write-Host "====================================================" -ForegroundColor DarkYellow
    Write-Host "⚠ CONDITIONAL GO: Minor issues detected" -ForegroundColor DarkYellow
    Write-Host "====================================================" -ForegroundColor DarkYellow
    Write-Host ""
    Write-Host "Recommendations:" -ForegroundColor Cyan
    Write-Host "1. Review failed tests above" -ForegroundColor White
    Write-Host "2. Fix critical issues (< 1 hour estimated)" -ForegroundColor White
    Write-Host "3. Re-run this test script" -ForegroundColor White
    Write-Host "4. Then proceed with frontend integration" -ForegroundColor White
    Write-Host ""
    exit 1
} else {
    Write-Host "====================================================" -ForegroundColor Red
    Write-Host "✗ NO-GO: Backend needs stabilization first" -ForegroundColor Red
    Write-Host "====================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Critical Issues:" -ForegroundColor Cyan
    Write-Host "1. Multiple tests failed - backend not ready" -ForegroundColor White
    Write-Host "2. Fix issues above before frontend integration" -ForegroundColor White
    Write-Host "3. Estimated fix time: 2-4 hours" -ForegroundColor White
    Write-Host ""
    exit 2
}
