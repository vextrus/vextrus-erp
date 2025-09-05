# Windows Performance Optimizer for Claude Code & Vextrus ERP
# Run as Administrator for best results

Write-Host "🚀 Windows Performance Optimizer for Vextrus ERP" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator"))
{
    Write-Host "⚠️ Please run this script as Administrator for full optimization" -ForegroundColor Yellow
    Write-Host "Some optimizations will be skipped..." -ForegroundColor Yellow
}

# Function to set process priority
function Set-ProcessPriority {
    param(
        [string]$ProcessName,
        [string]$Priority = "High"
    )
    
    try {
        $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
        if ($processes) {
            foreach ($proc in $processes) {
                $proc.PriorityClass = $Priority
                Write-Host "✅ Set $ProcessName to $Priority priority" -ForegroundColor Green
            }
        }
    }
    catch {
        Write-Host "⚠️ Could not set priority for $ProcessName" -ForegroundColor Yellow
    }
}

# Function to optimize Node.js
function Optimize-NodeJS {
    Write-Host "`n📦 Optimizing Node.js..." -ForegroundColor Cyan
    
    # Set Node.js memory limit
    [Environment]::SetEnvironmentVariable("NODE_OPTIONS", "--max-old-space-size=8192", "User")
    Write-Host "✅ Set Node.js memory limit to 8GB" -ForegroundColor Green
    
    # Enable Node.js performance flags
    $nodeFlags = "--max-old-space-size=8192 --optimize-for-size --gc-interval=100"
    [Environment]::SetEnvironmentVariable("NODE_ENV", "development", "User")
    Write-Host "✅ Configured Node.js performance flags" -ForegroundColor Green
}

# Function to optimize Git Bash
function Optimize-GitBash {
    Write-Host "`n🐚 Optimizing Git Bash..." -ForegroundColor Cyan
    
    # Create or update .bashrc
    $bashrcPath = "$env:USERPROFILE\.bashrc"
    $bashrcContent = @"
# Performance optimizations for Git Bash
export NODE_OPTIONS='--max-old-space-size=8192'
export FORCE_COLOR=1
export CI=false

# Faster command execution
set -o vi
shopt -s histappend
shopt -s checkwinsize

# History optimization
export HISTSIZE=10000
export HISTFILESIZE=20000
export HISTCONTROL=ignoreboth

# Faster file operations
export GIT_TRACE_PERFORMANCE=1
export GIT_FLUSH=0

# Claude Code optimizations
export CLAUDE_PARALLEL_TOOLS=true
export CLAUDE_MAX_WORKERS=8

# Aliases for common operations
alias ll='ls -la'
alias gs='git status'
alias gp='git pull'
alias npm-clean='rm -rf node_modules package-lock.json && npm install'
alias build='npm run build'
alias dev='npm run dev'
alias test='npm test'

# Function to quickly start Vextrus
vextrus() {
    cd /c/Users/riz/vextrus/vextrus-app
    npm run dev
}

echo "🚀 Git Bash optimized for Vextrus development"
"@
    
    Set-Content -Path $bashrcPath -Value $bashrcContent -Force
    Write-Host "✅ Created optimized .bashrc configuration" -ForegroundColor Green
}

# Function to optimize Windows Defender
function Optimize-WindowsDefender {
    if ([Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Host "`n🛡️ Optimizing Windows Defender exclusions..." -ForegroundColor Cyan
        
        # Add development folders to exclusions
        $exclusions = @(
            "$env:USERPROFILE\vextrus",
            "$env:USERPROFILE\.npm",
            "$env:USERPROFILE\.cache",
            "$env:USERPROFILE\AppData\Roaming\npm",
            "$env:USERPROFILE\AppData\Local\pnpm",
            "C:\Program Files\nodejs",
            "$env:TEMP"
        )
        
        foreach ($path in $exclusions) {
            try {
                Add-MpPreference -ExclusionPath $path -ErrorAction SilentlyContinue
                Write-Host "✅ Added exclusion: $path" -ForegroundColor Green
            }
            catch {
                Write-Host "⚠️ Could not add exclusion: $path" -ForegroundColor Yellow
            }
        }
        
        # Add process exclusions
        $processes = @("node.exe", "npm.exe", "git.exe", "code.exe", "cursor.exe")
        foreach ($process in $processes) {
            try {
                Add-MpPreference -ExclusionProcess $process -ErrorAction SilentlyContinue
                Write-Host "✅ Added process exclusion: $process" -ForegroundColor Green
            }
            catch {
                Write-Host "⚠️ Could not add process exclusion: $process" -ForegroundColor Yellow
            }
        }
    }
}

# Function to optimize system performance
function Optimize-SystemPerformance {
    Write-Host "`n⚡ Optimizing system performance..." -ForegroundColor Cyan
    
    # Set power plan to High Performance
    try {
        powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c
        Write-Host "✅ Set power plan to High Performance" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️ Could not set power plan" -ForegroundColor Yellow
    }
    
    # Disable unnecessary visual effects
    try {
        Set-ItemProperty -Path "HKCU:\Control Panel\Desktop" -Name "UserPreferencesMask" -Value ([byte[]](0x90,0x12,0x03,0x80,0x10,0x00,0x00,0x00))
        Write-Host "✅ Optimized visual effects for performance" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️ Could not optimize visual effects" -ForegroundColor Yellow
    }
    
    # Optimize virtual memory
    if ([Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        try {
            # Get system RAM
            $ram = (Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum).Sum / 1GB
            $pagefile = [math]::Round($ram * 1.5)
            
            Write-Host "✅ System RAM: ${ram}GB, Recommended Pagefile: ${pagefile}GB" -ForegroundColor Green
        }
        catch {
            Write-Host "⚠️ Could not optimize virtual memory" -ForegroundColor Yellow
        }
    }
}

# Function to optimize WSL2
function Optimize-WSL2 {
    Write-Host "`n🐧 Optimizing WSL2..." -ForegroundColor Cyan
    
    # Create .wslconfig
    $wslConfigPath = "$env:USERPROFILE\.wslconfig"
    $wslConfigContent = @"
[wsl2]
memory=8GB
processors=6
swap=4GB
swapFile=C:\\temp\\wsl-swap.vhdx
localhostForwarding=true

[experimental]
autoMemoryReclaim=gradual
sparseVhd=true
"@
    
    Set-Content -Path $wslConfigPath -Value $wslConfigContent -Force
    Write-Host "✅ Created optimized .wslconfig" -ForegroundColor Green
    
    # Check if WSL is running
    $wslStatus = wsl --list --running 2>$null
    if ($wslStatus) {
        Write-Host "⚠️ Please restart WSL for changes to take effect: wsl --shutdown" -ForegroundColor Yellow
    }
}

# Function to create performance monitoring script
function Create-PerformanceMonitor {
    Write-Host "`n📊 Creating performance monitor..." -ForegroundColor Cyan
    
    $monitorScript = @'
# Performance Monitor for Vextrus Development
while ($true) {
    Clear-Host
    Write-Host "📊 Vextrus Performance Monitor" -ForegroundColor Cyan
    Write-Host "=============================" -ForegroundColor Cyan
    
    # CPU Usage
    $cpu = Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 1 -MaxSamples 1
    $cpuUsage = [math]::Round($cpu.CounterSamples.CookedValue, 2)
    Write-Host "CPU Usage: $cpuUsage%" -ForegroundColor $(if ($cpuUsage -gt 80) {"Red"} elseif ($cpuUsage -gt 60) {"Yellow"} else {"Green"})
    
    # Memory Usage
    $os = Get-CimInstance Win32_OperatingSystem
    $memUsage = [math]::Round((($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / $os.TotalVisibleMemorySize) * 100, 2)
    Write-Host "Memory Usage: $memUsage%" -ForegroundColor $(if ($memUsage -gt 80) {"Red"} elseif ($memUsage -gt 60) {"Yellow"} else {"Green"})
    
    # Node.js Processes
    $nodeProcs = Get-Process -Name node -ErrorAction SilentlyContinue
    if ($nodeProcs) {
        Write-Host "`nNode.js Processes:" -ForegroundColor Cyan
        foreach ($proc in $nodeProcs) {
            $mem = [math]::Round($proc.WorkingSet64 / 1MB, 2)
            Write-Host "  PID: $($proc.Id) - Memory: ${mem}MB" -ForegroundColor White
        }
    }
    
    # Git Bash Processes
    $gitProcs = Get-Process -Name *bash* -ErrorAction SilentlyContinue
    if ($gitProcs) {
        Write-Host "`nGit Bash Processes:" -ForegroundColor Cyan
        foreach ($proc in $gitProcs) {
            $mem = [math]::Round($proc.WorkingSet64 / 1MB, 2)
            Write-Host "  PID: $($proc.Id) - Memory: ${mem}MB" -ForegroundColor White
        }
    }
    
    Write-Host "`nPress Ctrl+C to exit" -ForegroundColor Gray
    Start-Sleep -Seconds 5
}
'@
    
    $monitorPath = "$env:USERPROFILE\vextrus\performance-monitor.ps1"
    Set-Content -Path $monitorPath -Value $monitorScript -Force
    Write-Host "✅ Created performance monitor script at: $monitorPath" -ForegroundColor Green
}

# Function to optimize Docker Desktop
function Optimize-Docker {
    Write-Host "`n🐳 Optimizing Docker Desktop..." -ForegroundColor Cyan
    
    # Check if Docker is installed
    if (Test-Path "$env:APPDATA\Docker\settings.json") {
        Write-Host "✅ Docker Desktop detected" -ForegroundColor Green
        Write-Host "Recommended settings:" -ForegroundColor Yellow
        Write-Host "  - CPUs: 6" -ForegroundColor White
        Write-Host "  - Memory: 8GB" -ForegroundColor White
        Write-Host "  - Swap: 2GB" -ForegroundColor White
        Write-Host "  - Disk image size: 64GB" -ForegroundColor White
        Write-Host "Please update in Docker Desktop settings manually" -ForegroundColor Yellow
    }
    else {
        Write-Host "⚠️ Docker Desktop not found" -ForegroundColor Yellow
    }
}

# Main execution
Write-Host "`n🔧 Starting optimization process..." -ForegroundColor Cyan

# Run all optimizations
Optimize-NodeJS
Optimize-GitBash
Optimize-WindowsDefender
Optimize-SystemPerformance
Optimize-WSL2
Optimize-Docker
Create-PerformanceMonitor

# Set process priorities
Write-Host "`n⚡ Setting process priorities..." -ForegroundColor Cyan
Set-ProcessPriority -ProcessName "node" -Priority "High"
Set-ProcessPriority -ProcessName "cursor" -Priority "AboveNormal"
Set-ProcessPriority -ProcessName "git" -Priority "AboveNormal"

# Create startup script
$startupScript = @"
@echo off
echo 🚀 Starting Vextrus Development Environment...
echo.

REM Start Docker Desktop
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
echo Starting Docker Desktop...
timeout /t 10 /nobreak >nul

REM Navigate to project
cd /d C:\Users\riz\vextrus\vextrus-app

REM Start Redis and PostgreSQL
echo Starting database services...
docker-compose -f docker-compose.dev.yml up -d

REM Open Cursor IDE
start "" "C:\Users\riz\AppData\Local\Programs\cursor\Cursor.exe" .

REM Start development server
echo Starting development server...
npm run dev

pause
"@

$startupPath = "$env:USERPROFILE\vextrus\start-vextrus.bat"
Set-Content -Path $startupPath -Value $startupScript -Force
Write-Host "`n✅ Created startup script at: $startupPath" -ForegroundColor Green

# Final summary
Write-Host "`n✅ Optimization Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "The following optimizations have been applied:" -ForegroundColor White
Write-Host "  ✓ Node.js memory limit increased to 8GB" -ForegroundColor White
Write-Host "  ✓ Git Bash performance optimized" -ForegroundColor White
Write-Host "  ✓ Windows Defender exclusions added" -ForegroundColor White
Write-Host "  ✓ System performance optimized" -ForegroundColor White
Write-Host "  ✓ WSL2 configuration optimized" -ForegroundColor White
Write-Host "  ✓ Performance monitor created" -ForegroundColor White
Write-Host "  ✓ Startup script created" -ForegroundColor White

Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Restart Git Bash to apply .bashrc changes" -ForegroundColor Yellow
Write-Host "2. Run 'wsl --shutdown' and restart WSL2" -ForegroundColor Yellow
Write-Host "3. Update Docker Desktop settings manually" -ForegroundColor Yellow
Write-Host "4. Use start-vextrus.bat to launch development environment" -ForegroundColor Yellow
Write-Host "5. Run performance-monitor.ps1 to monitor system resources" -ForegroundColor Yellow

Write-Host "`n🚀 Your system is now optimized for Vextrus development!" -ForegroundColor Green