# Fix Windows Reserved Ports for Temporal and Mailhog
# This script excludes specific ports from dynamic port allocation to prevent conflicts
# Must be run as Administrator

Write-Host "Fixing Windows Reserved Ports..." -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Administrator privileges confirmed." -ForegroundColor Green
Write-Host ""

# Ports used by Vextrus ERP services
$portsToExclude = @(
    7233,   # Temporal
    1025,   # Mailhog SMTP
    8025,   # Mailhog Web UI
    3001,   # Auth service
    3002,   # Master data
    3003,   # Notification
    3004,   # Configuration
    3005,   # Scheduler
    3006,   # Document generator
    3007,   # Import/Export
    3008,   # File storage
    3009,   # Audit
    3011,   # Workflow
    3012,   # Rules engine
    3013,   # CRM
    3014,   # Finance
    3015,   # HR
    3016,   # Organization
    3017,   # Project management
    3018,   # SCM
    4000,   # API Gateway
    5432,   # PostgreSQL
    6379,   # Redis
    9092,   # Kafka
    9093    # Kafka internal
)

Write-Host "Ports to exclude from Windows dynamic range:" -ForegroundColor Cyan
$portsToExclude | ForEach-Object { Write-Host "  - $_" }
Write-Host ""

# Function to exclude a port
function Exclude-Port {
    param (
        [int]$port
    )

    try {
        # Check if already excluded
        $existing = netsh interface ipv4 show excludedportrange protocol=tcp | Select-String "$port\s+$port"

        if ($existing) {
            Write-Host "Port $port is already excluded" -ForegroundColor Gray
        } else {
            netsh interface ipv4 add excludedportrange protocol=tcp startport=$port numberofports=1 | Out-Null
            Write-Host "Successfully excluded port $port" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Warning: Could not exclude port $port - $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "Excluding ports..." -ForegroundColor Cyan
foreach ($port in $portsToExclude) {
    Exclude-Port -port $port
}

Write-Host ""
Write-Host "Checking current excluded port ranges:" -ForegroundColor Cyan
netsh interface ipv4 show excludedportrange protocol=tcp

Write-Host ""
Write-Host "Port exclusion complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Stop all Docker containers: docker-compose down"
Write-Host "  2. Restart Docker Desktop"
Write-Host "  3. Start containers: docker-compose up -d"
Write-Host ""
