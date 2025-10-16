# Quick script to restart Finance service after code changes

Write-Host "Restarting Finance Service..." -ForegroundColor Cyan
Write-Host ""

# Stop finance service
Write-Host "[1/4] Stopping finance service..." -ForegroundColor Yellow
docker-compose stop finance

# Rebuild with no cache to ensure new code is used
Write-Host "[2/4] Rebuilding finance service (this may take 1-2 minutes)..." -ForegroundColor Yellow
docker-compose build --no-cache finance

# Start finance service
Write-Host "[3/4] Starting finance service..." -ForegroundColor Yellow
docker-compose up -d finance

# Wait for service to be ready
Write-Host "[4/4] Waiting for service to be ready (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "Checking service health..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3014/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Finance service is healthy and running!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Apollo Sandbox: http://localhost:3014/graphql" -ForegroundColor Cyan
        Write-Host "Schema should now load automatically!" -ForegroundColor Green
    }
} catch {
    Write-Host "! Service may still be starting..." -ForegroundColor Yellow
    Write-Host "  Wait a few more seconds and try: http://localhost:3014/health" -ForegroundColor Gray
}

Write-Host ""
Write-Host "View logs: docker-compose logs -f finance" -ForegroundColor Gray
Write-Host ""
