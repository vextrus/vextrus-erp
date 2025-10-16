# Finance Service Infrastructure Verification - Windows PowerShell
# Verifies all dependencies are running before starting the service

Write-Host "=== Finance Service Infrastructure Verification (Windows) ===" -ForegroundColor Cyan
Write-Host ""

$Failed = 0

# Check PostgreSQL (via Docker or local service)
Write-Host "Checking PostgreSQL... " -NoNewline
try {
    $dbHost = if ($env:DATABASE_HOST) { $env:DATABASE_HOST } else { "localhost" }
    $dbPort = if ($env:DATABASE_PORT) { $env:DATABASE_PORT } else { "5432" }
    
    # Try to connect via Test-NetConnection
    $connection = Test-NetConnection -ComputerName $dbHost -Port $dbPort -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    
    if ($connection.TcpTestSucceeded) {
        Write-Host "✓ Running" -ForegroundColor Green
    } else {
        Write-Host "✗ Not available" -ForegroundColor Red
        Write-Host "  PostgreSQL not reachable at ${dbHost}:${dbPort}" -ForegroundColor Yellow
        Write-Host "  Start Docker: docker-compose up -d postgres" -ForegroundColor Yellow
        $Failed = 1
    }
} catch {
    Write-Host "✗ Error checking PostgreSQL" -ForegroundColor Red
    $Failed = 1
}

# Check EventStore
Write-Host "Checking EventStore... " -NoNewline
try {
    $eventStoreHost = if ($env:EVENTSTORE_HOST) { $env:EVENTSTORE_HOST } else { "localhost" }
    $response = Invoke-WebRequest -Uri "http://${eventStoreHost}:2113/health/live" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Running" -ForegroundColor Green
    } else {
        Write-Host "✗ Not available" -ForegroundColor Red
        $Failed = 1
    }
} catch {
    Write-Host "✗ Not available" -ForegroundColor Red
    Write-Host "  Start EventStore: docker run -d -p 2113:2113 eventstore/eventstore:latest --insecure" -ForegroundColor Yellow
    $Failed = 1
}

# Check Kafka
Write-Host "Checking Kafka... " -NoNewline
try {
    $kafkaHost = if ($env:KAFKA_HOST) { $env:KAFKA_HOST } else { "localhost" }
    $kafkaPort = if ($env:KAFKA_PORT) { $env:KAFKA_PORT } else { "9092" }
    
    $connection = Test-NetConnection -ComputerName $kafkaHost -Port $kafkaPort -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    
    if ($connection.TcpTestSucceeded) {
        Write-Host "✓ Running" -ForegroundColor Green
    } else {
        Write-Host "⚠ Not available (optional for local dev)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Not available (optional)" -ForegroundColor Yellow
}

# Check Node.js version
Write-Host "Checking Node.js version... " -NoNewline
try {
    $nodeVersion = node -v
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    
    if ($versionNumber -ge 20) {
        Write-Host "✓ $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "✗ Node.js 20+ required, found $nodeVersion" -ForegroundColor Red
        $Failed = 1
    }
} catch {
    Write-Host "✗ Node.js not found" -ForegroundColor Red
    $Failed = 1
}

# Check dependencies
Write-Host "Checking node_modules... " -NoNewline
if (Test-Path "node_modules") {
    Write-Host "✓ Installed" -ForegroundColor Green
} else {
    Write-Host "⚠ Running npm install..." -ForegroundColor Yellow
    npm install
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
}

# Check if service is running
Write-Host "Checking Finance service... " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3006/health/live" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Running" -ForegroundColor Green
    } else {
        Write-Host "⚠ Not running" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Not running (use 'npm run start:dev')" -ForegroundColor Yellow
}

Write-Host ""
if ($Failed -eq 0) {
    Write-Host "=== All infrastructure checks passed ===" -ForegroundColor Green
    exit 0
} else {
    Write-Host "=== Infrastructure verification failed ===" -ForegroundColor Red
    Write-Host "Fix the errors above and try again" -ForegroundColor Yellow
    exit 1
}
