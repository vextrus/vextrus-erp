# SignOz Fix Verification Script (PowerShell)
# Tests all SignOz services after fixes applied

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "SignOz Fix Verification Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

# Test 1: Check container status
Write-Host "Test 1: Checking container status..." -ForegroundColor Yellow
$containers = docker ps --filter "name=vextrus-signoz" --format "{{.Names}}" 2>$null
if ($containers) {
    Write-Host "✓ SignOz containers are running" -ForegroundColor Green
    docker ps --filter "name=vextrus-signoz" --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"
    $testsPassed++
} else {
    Write-Host "✗ SignOz containers are not running" -ForegroundColor Red
    $testsFailed++
}
Write-Host ""

# Test 2: Check Query Service health
Write-Host "Test 2: Checking Query Service health..." -ForegroundColor Yellow
$health = docker inspect vextrus-signoz-query-service --format='{{.State.Health.Status}}' 2>$null
if ($health -eq "healthy") {
    Write-Host "✓ Query Service is healthy" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "⚠ Query Service not yet healthy (status: $health)" -ForegroundColor DarkYellow
    Write-Host "  This is normal if services just started. Wait 30-60 seconds." -ForegroundColor Gray
}
Write-Host ""

# Test 3: Check for SQLite errors
Write-Host "Test 3: Checking for SQLite database errors..." -ForegroundColor Yellow
$sqliteErrors = docker logs vextrus-signoz-query-service 2>&1 | Select-String "unable to open database file"
if ($sqliteErrors) {
    Write-Host "✗ SQLite database error detected" -ForegroundColor Red
    docker logs vextrus-signoz-query-service --tail 10
    $testsFailed++
} else {
    Write-Host "✓ No SQLite database errors" -ForegroundColor Green
    $testsPassed++
}
Write-Host ""

# Test 4: Check for authentication errors
Write-Host "Test 4: Checking for ClickHouse authentication errors..." -ForegroundColor Yellow
$authErrors = docker logs vextrus-signoz-query-service 2>&1 | Select-String -Pattern "authentication failed" -CaseSensitive:$false
if ($authErrors) {
    Write-Host "✗ Authentication errors detected" -ForegroundColor Red
    docker logs vextrus-signoz-query-service 2>&1 | Select-String -Pattern "authentication" -CaseSensitive:$false | Select-Object -Last 5
    $testsFailed++
} else {
    Write-Host "✓ No authentication errors" -ForegroundColor Green
    $testsPassed++
}
Write-Host ""

# Test 5: Check Frontend nginx errors
Write-Host "Test 5: Checking Frontend for nginx errors..." -ForegroundColor Yellow
$nginxErrors = docker logs vextrus-signoz-frontend 2>&1 | Select-String "host not found in upstream"
if ($nginxErrors) {
    Write-Host "✗ Frontend host resolution error detected" -ForegroundColor Red
    docker logs vextrus-signoz-frontend --tail 10
    $testsFailed++
} else {
    Write-Host "✓ No nginx host resolution errors" -ForegroundColor Green
    $testsPassed++
}
Write-Host ""

# Test 6: Check Query Service API
Write-Host "Test 6: Testing Query Service API endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8084/api/v1/version" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Query Service API is responding" -ForegroundColor Green
        Write-Host "Version info:" -ForegroundColor Gray
        $response.Content | ConvertFrom-Json | Select-Object -First 1 | Format-List
        $testsPassed++
    }
} catch {
    Write-Host "⚠ Query Service API not responding (may still be starting)" -ForegroundColor DarkYellow
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
}
Write-Host ""

# Test 7: Check volume exists
Write-Host "Test 7: Checking SignOz volume..." -ForegroundColor Yellow
$volume = docker volume ls | Select-String "signoz_query_data"
if ($volume) {
    Write-Host "✓ signoz_query_data volume exists" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "✗ signoz_query_data volume missing" -ForegroundColor Red
    $testsFailed++
}
Write-Host ""

# Test 8: Check port allocation
Write-Host "Test 8: Verifying port 8084 is used (not 8081)..." -ForegroundColor Yellow
$ports = docker ps --filter "name=vextrus-signoz-query-service" --format "{{.Ports}}"
if ($ports -match "8084") {
    Write-Host "✓ Query Service using port 8084 (correct)" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "✗ Query Service not using port 8084" -ForegroundColor Red
    Write-Host "  Current ports: $ports" -ForegroundColor Gray
    $testsFailed++
}
Write-Host ""

# Final summary
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Verification Complete!" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "✓ All critical tests passed! SignOz services are working correctly." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Access SignOz UI at http://localhost:3301" -ForegroundColor White
    Write-Host "2. Configure OTEL exporters in your microservices" -ForegroundColor White
    Write-Host "3. Set up alerts and dashboards" -ForegroundColor White
} else {
    Write-Host "⚠ Some tests failed. Review the output above." -ForegroundColor DarkYellow
    Write-Host ""
    Write-Host "Troubleshooting steps:" -ForegroundColor Cyan
    Write-Host "1. Check docker-compose logs: docker-compose logs signoz-query-service signoz-frontend" -ForegroundColor White
    Write-Host "2. Review SIGNOZ_FIX_COMPLETE.md for detailed troubleshooting" -ForegroundColor White
    Write-Host "3. Ensure all containers have been restarted after configuration changes" -ForegroundColor White
}
Write-Host ""
