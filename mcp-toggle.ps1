# MCP Server Toggle Script for Windows
# Usage: .\mcp-toggle.ps1 [enable|disable] [docs|database|testing|research|full]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("enable", "disable", "status", "list")]
    [string]$Action,

    [Parameter(Mandatory=$false)]
    [ValidateSet("docs", "database", "testing", "research", "full")]
    [string]$Profile
)

$baseConfig = ".mcp.json"
$backupConfig = ".mcp.json.current-backup"

function Show-Status {
    Write-Host "`n=== Current MCP Configuration ===" -ForegroundColor Cyan
    if (Test-Path $baseConfig) {
        $config = Get-Content $baseConfig | ConvertFrom-Json
        $serverCount = ($config.mcpServers | Get-Member -MemberType NoteProperty).Count
        Write-Host "Active servers: $serverCount" -ForegroundColor Green
        Write-Host "`nEnabled MCP Servers:" -ForegroundColor Yellow
        $config.mcpServers | Get-Member -MemberType NoteProperty | ForEach-Object {
            Write-Host "  - $($_.Name)" -ForegroundColor White
        }
    } else {
        Write-Host "No MCP configuration found!" -ForegroundColor Red
    }
    Write-Host ""
}

function Show-AvailableProfiles {
    Write-Host "`n=== Available MCP Profiles ===" -ForegroundColor Cyan
    Write-Host "  core      - Minimal setup (filesystem, github, postgres, serena, sequential-thinking)" -ForegroundColor Green
    Write-Host "  docs      - Documentation lookup (context7, consult7)" -ForegroundColor Yellow
    Write-Host "  database  - Database tools (prisma-local, sqlite)" -ForegroundColor Yellow
    Write-Host "  testing   - Browser automation (playwright)" -ForegroundColor Yellow
    Write-Host "  research  - Web research (brave-search, brightdata, reddit)" -ForegroundColor Yellow
    Write-Host "  full      - All servers enabled" -ForegroundColor Red
    Write-Host ""
}

function Merge-Configs {
    param([string]$optionalConfig)

    # Backup current config
    Copy-Item $baseConfig $backupConfig -Force

    # Read both configs
    $base = Get-Content $baseConfig | ConvertFrom-Json
    $optional = Get-Content $optionalConfig | ConvertFrom-Json

    # Merge servers
    $optional.mcpServers | Get-Member -MemberType NoteProperty | ForEach-Object {
        $serverName = $_.Name
        $base.mcpServers | Add-Member -NotePropertyName $serverName -NotePropertyValue $optional.mcpServers.$serverName -Force
    }

    # Save merged config
    $base | ConvertTo-Json -Depth 10 | Set-Content $baseConfig
    Write-Host "Enabled profile: $Profile" -ForegroundColor Green
}

function Restore-CoreConfig {
    # Read the minimal config template
    $coreServers = @("filesystem", "github", "postgres", "serena", "sequential-thinking")

    if (Test-Path $backupConfig) {
        Copy-Item $backupConfig $baseConfig -Force
    }

    # Filter to keep only core servers
    $config = Get-Content $baseConfig | ConvertFrom-Json
    $newConfig = @{ mcpServers = @{} }

    $config.mcpServers | Get-Member -MemberType NoteProperty | ForEach-Object {
        $serverName = $_.Name
        if ($coreServers -contains $serverName) {
            $newConfig.mcpServers[$serverName] = $config.mcpServers.$serverName
        }
    }

    $newConfig | ConvertTo-Json -Depth 10 | Set-Content $baseConfig
    Write-Host "Restored to core configuration" -ForegroundColor Green
}

# Main logic
switch ($Action) {
    "status" {
        Show-Status
        Show-AvailableProfiles
    }
    "list" {
        Show-AvailableProfiles
    }
    "enable" {
        if (-not $Profile) {
            Write-Host "Error: Profile required for enable action" -ForegroundColor Red
            Show-AvailableProfiles
            exit 1
        }

        switch ($Profile) {
            "docs" { Merge-Configs ".mcp.optional-docs.json" }
            "database" { Merge-Configs ".mcp.optional-database.json" }
            "testing" { Merge-Configs ".mcp.optional-testing.json" }
            "research" { Merge-Configs ".mcp.optional-research.json" }
            "full" { Copy-Item ".mcp.json.backup-full" $baseConfig -Force; Write-Host "Enabled all servers" -ForegroundColor Yellow }
        }

        Write-Host "`nRESTART Claude Code for changes to take effect!" -ForegroundColor Cyan
        Show-Status
    }
    "disable" {
        Restore-CoreConfig
        Write-Host "`nRESTART Claude Code for changes to take effect!" -ForegroundColor Cyan
        Show-Status
    }
}
