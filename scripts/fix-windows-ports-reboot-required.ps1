# Fix Windows Reserved Ports - Reboot Required Version
# This script handles existing port range conflicts
# Must be run as Administrator

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  Windows Port Conflict Fix - Reboot Required Method" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
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

# Critical ports that MUST be available
$criticalPorts = @{
    7233 = "Temporal"
    1025 = "Mailhog SMTP"
    8025 = "Mailhog Web UI"
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
        Write-Host "✓ Port $port ($service) - Already excluded correctly" -ForegroundColor Green
    } else {
        # Check if port is in a reserved range
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
                    Write-Host "✗ Port $port ($service) - Caught in reserved range $start-$end" -ForegroundColor Red
                    $needsReboot = $true
                }
            }
        }

        if (-not $inRange) {
            # Try to exclude it now
            try {
                netsh interface ipv4 add excludedportrange protocol=tcp startport=$port numberofports=1 | Out-Null
                Write-Host "✓ Port $port ($service) - Successfully excluded" -ForegroundColor Green
            } catch {
                Write-Host "✗ Port $port ($service) - Failed to exclude: $_" -ForegroundColor Red
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
    Write-Host "Windows has pre-reserved these ports in dynamic ranges." -ForegroundColor Yellow
    Write-Host "A system reboot is required to clear these reservations." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Conflicting Ranges Found:" -ForegroundColor Red
    foreach ($conflict in $conflictingRanges) {
        Write-Host "  - Port $($conflict.Port) ($($conflict.Service)): Range $($conflict.RangeStart)-$($conflict.RangeEnd)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "INSTRUCTIONS:" -ForegroundColor Cyan
    Write-Host "1. REBOOT your computer now" -ForegroundColor White
    Write-Host "2. After reboot, run this script AGAIN as Administrator" -ForegroundColor White
    Write-Host "3. Then start Docker Desktop and your containers" -ForegroundColor White
    Write-Host ""
    Write-Host "Would you like to reboot now? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host

    if ($response -eq 'Y' -or $response -eq 'y') {
        Write-Host ""
        Write-Host "Initiating reboot in 60 seconds..." -ForegroundColor Yellow
        Write-Host "Save your work! Press Ctrl+C to cancel." -ForegroundColor Red
        Start-Sleep -Seconds 5
        shutdown /r /t 60 /c "Rebooting to fix Windows port reservations for Vextrus ERP"
    } else {
        Write-Host ""
        Write-Host "Please reboot manually when ready." -ForegroundColor Yellow
    }
} else {
    Write-Host "====================================================================" -ForegroundColor Green
    Write-Host "  SUCCESS - All Critical Ports Available" -ForegroundColor Green
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
