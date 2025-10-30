# Fix Windows Reserved Ports - Clean Version
# Must be run as Administrator

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  Windows Port Conflict Fix" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

# Check Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Administrator privileges confirmed." -ForegroundColor Green
Write-Host ""

# ALL ports used by Docker services (extracted from docker-compose.yml and docker-compose.monitoring.yml)
$criticalPorts = @{
    # Infrastructure
    80 = "Traefik HTTP"
    443 = "Traefik HTTPS"
    5432 = "PostgreSQL"
    6379 = "Redis"

    # Event Sourcing & Messaging
    22113 = "EventStore HTTP"
    21113 = "EventStore TCP"
    9092 = "Kafka External"
    9093 = "Kafka Internal"

    # Storage & Search
    9000 = "MinIO API"
    9001 = "MinIO Console"
    9200 = "Elasticsearch"

    # Message Queue
    5672 = "RabbitMQ AMQP"
    15672 = "RabbitMQ Management"

    # Workflow & Temporal
    7233 = "Temporal"
    8088 = "Temporal UI"

    # Observability - OpenTelemetry (CRITICAL - Port 4317 was causing latest failure)
    4317 = "OTEL gRPC Receiver"
    4318 = "OTEL HTTP Receiver"
    8888 = "OTEL Prometheus Metrics"
    8889 = "OTEL Prometheus Exporter"
    13133 = "OTEL Health Check"
    55679 = "OTEL zPages"

    # Observability - SignOz
    9100 = "ClickHouse Native"
    8123 = "ClickHouse HTTP"
    3301 = "SignOz Frontend"

    # Observability - Monitoring Stack
    9090 = "Prometheus"
    3000 = "Grafana (monitoring.yml)"
    3500 = "Grafana (main)"

    # Observability - Jaeger (optional)
    5778 = "Jaeger Config"
    16686 = "Jaeger UI"
    14268 = "Jaeger Collector"
    14250 = "Jaeger gRPC"
    9411 = "Jaeger Zipkin"

    # Development Tools
    8081 = "Traefik Dashboard"
    8082 = "Adminer"
    8083 = "Redis Commander"
    8084 = "SignOz Query Service (Backend)"
    8085 = "Kafka UI"
    4873 = "Verdaccio"
    1025 = "Mailhog SMTP"
    8025 = "Mailhog Web UI"

    # Core Services
    3001 = "Auth Service"
    3002 = "Master Data Service"
    3003 = "Notification Service"
    3004 = "Configuration Service"
    3005 = "Scheduler Service"
    3006 = "Document Generator"
    3007 = "Import/Export Service"
    3008 = "File Storage Service"
    3009 = "Audit Service"

    # Business Services
    3011 = "Workflow Service"
    3012 = "Rules Engine"
    3013 = "CRM Service"
    3014 = "Finance Service"
    3015 = "HR Service"
    3016 = "Organization Service"
    3017 = "Project Management"
    3018 = "SCM Service"

    # Gateway
    4000 = "API Gateway (GraphQL Federation)"
}

Write-Host "Checking current port exclusions..." -ForegroundColor Cyan
$currentExclusions = netsh interface ipv4 show excludedportrange protocol=tcp

Write-Host ""
Write-Host "Critical Ports Analysis:" -ForegroundColor Cyan
Write-Host "-------------------------" -ForegroundColor Cyan

$needsReboot = $false
$conflictingRanges = @()

foreach ($port in $criticalPorts.Keys) {
    $service = $criticalPorts[$port]
    $isExcluded = $currentExclusions | Select-String "\s+$port\s+$port\s+"

    if ($isExcluded) {
        Write-Host "OK Port $port ($service) - Already excluded" -ForegroundColor Green
    } else {
        # Check if in reserved range
        $inRange = $false
        $currentExclusions -split "`n" | ForEach-Object {
            if ($_ -match '^\s+(\d+)\s+(\d+)') {
                $start = [int]$matches[1]
                $end = [int]$matches[2]
                if ($port -ge $start -and $port -le $end) {
                    $inRange = $true
                    $conflictingRanges += @{
                        Port = $port
                        Service = $service
                        RangeStart = $start
                        RangeEnd = $end
                    }
                    Write-Host "CONFLICT Port $port ($service) in range $start-$end" -ForegroundColor Red
                    $needsReboot = $true
                }
            }
        }

        if (-not $inRange) {
            try {
                netsh interface ipv4 add excludedportrange protocol=tcp startport=$port numberofports=1 | Out-Null
                Write-Host "OK Port $port ($service) - Excluded successfully" -ForegroundColor Green
            } catch {
                Write-Host "ERROR Port $port ($service) - Failed: $_" -ForegroundColor Red
                $needsReboot = $true
            }
        }
    }
}

Write-Host ""

if ($needsReboot) {
    Write-Host "====================================================================" -ForegroundColor Yellow
    Write-Host "  REBOOT REQUIRED" -ForegroundColor Yellow
    Write-Host "====================================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Conflicting Ranges:" -ForegroundColor Red
    foreach ($conflict in $conflictingRanges) {
        Write-Host "  Port $($conflict.Port) ($($conflict.Service)): Range $($conflict.RangeStart)-$($conflict.RangeEnd)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "INSTRUCTIONS:" -ForegroundColor Cyan
    Write-Host "1. REBOOT your computer" -ForegroundColor White
    Write-Host "2. Run this script AGAIN after reboot" -ForegroundColor White
    Write-Host "3. Then restart Docker Desktop" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "====================================================================" -ForegroundColor Green
    Write-Host "  SUCCESS - All Ports Available" -ForegroundColor Green
    Write-Host "====================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Restart Docker Desktop" -ForegroundColor White
    Write-Host "2. Run: docker-compose down && docker-compose up -d" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "Current Port Exclusions:" -ForegroundColor Cyan
netsh interface ipv4 show excludedportrange protocol=tcp
Write-Host ""
