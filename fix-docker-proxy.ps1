# Fix Docker Proxy Issues on Windows
# Run this script as Administrator in PowerShell

Write-Host "Fixing Docker proxy configuration..." -ForegroundColor Green

# Option 1: Update Docker daemon.json
$daemonPath = "$env:USERPROFILE\.docker\daemon.json"
$daemonConfig = @{
    "builder" = @{
        "gc" = @{
            "defaultKeepStorage" = "20GB"
            "enabled" = $true
        }
    }
    "experimental" = $false
    "insecure-registries" = @(
        "registry-1.docker.io",
        "registry.docker.io",
        "docker.io"
    )
    "registry-mirrors" = @("https://mirror.gcr.io")
    "proxies" = @{
        "http-proxy" = $null
        "https-proxy" = $null
        "no-proxy" = "*.docker.io,*.docker.com,registry-1.docker.io,registry.docker.io,auth.docker.io,production.cloudflare.docker.com"
    }
}

# Backup existing config
if (Test-Path $daemonPath) {
    Copy-Item $daemonPath "$daemonPath.backup"
    Write-Host "Backed up existing daemon.json to daemon.json.backup" -ForegroundColor Yellow
}

# Write new config
$daemonConfig | ConvertTo-Json -Depth 10 | Set-Content $daemonPath
Write-Host "Updated daemon.json configuration" -ForegroundColor Green

# Option 2: Set environment variables
[System.Environment]::SetEnvironmentVariable("DOCKER_TLS_VERIFY", "0", "User")
[System.Environment]::SetEnvironmentVariable("DOCKER_BUILDKIT", "0", "User")
Write-Host "Set environment variables" -ForegroundColor Green

Write-Host "`nPlease restart Docker Desktop now!" -ForegroundColor Cyan
Write-Host "After restart, test with: docker pull hello-world" -ForegroundColor Yellow