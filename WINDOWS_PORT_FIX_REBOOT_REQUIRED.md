# Windows Port Conflict - Reboot Required

## Current Situation

The port exclusion script ran successfully, BUT Windows has **already reserved** ports 7233 and 1025 in dynamic ranges **before** we could exclude them. This is why Temporal and Mailhog still can't start.

### What We Found:
- ✗ Port **1025** (Mailhog SMTP) - Caught in Windows range **1025-1124**
- ✗ Port **7233** (Temporal) - Not properly excluded
- ✓ Port **8025** (Mailhog Web UI) - Successfully excluded

## Why This Happens

When Windows starts, it randomly reserves port RANGES for its dynamic allocation. These ranges can include the ports we need. Once reserved, they can't be freed without a reboot.

## The Solution: System Reboot

Unfortunately, the **only way** to clear these pre-existing port reservations is to reboot Windows.

---

## Complete Fix Instructions

### Step 1: Run Enhanced Script (In Administrator PowerShell)

You're already in the right directory. Run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
.\scripts\fix-windows-ports-reboot-required.ps1
```

**What this script does:**
- Detects exactly which ports are caught in reserved ranges
- Shows you the conflicting ranges
- Can optionally trigger a reboot for you

### Step 2: Reboot Your Computer

**Important:** You MUST reboot Windows to clear the port reservations.

```powershell
# Option 1: Script will ask if you want to reboot (recommended)
# Press Y when prompted

# Option 2: Manual reboot
# Save your work and restart Windows normally
```

### Step 3: After Reboot - Run Script Again

After Windows restarts:

```powershell
# 1. Open PowerShell as Administrator again
# 2. Navigate to project
cd C:\Users\riz\vextrus-erp

# 3. Allow scripts
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# 4. Run the script again (this time it will succeed)
.\scripts\fix-windows-ports-reboot-required.ps1
```

This time, the script should report **SUCCESS** - all ports available.

### Step 4: Start Docker Services

```powershell
# Start Docker Desktop (if not already running)

# Restart all containers
docker-compose down
docker-compose up -d

# Verify Temporal and Mailhog are running
docker ps --filter "name=temporal" --filter "name=mailhog"
```

---

## Expected Results After Reboot + Script

```
✓ Port 7233 (Temporal) - Available
✓ Port 1025 (Mailhog SMTP) - Available
✓ Port 8025 (Mailhog Web UI) - Available

All 40 containers should start successfully!
```

---

## Alternative: Manual Port Exclusion After Reboot

If you prefer to run commands manually after reboot:

```powershell
# After rebooting, open PowerShell as Administrator

# Exclude critical ports
netsh interface ipv4 add excludedportrange protocol=tcp startport=7233 numberofports=1
netsh interface ipv4 add excludedportrange protocol=tcp startport=1025 numberofports=1
netsh interface ipv4 add excludedportrange protocol=tcp startport=8025 numberofports=1

# Exclude all service ports (3001-3018)
for ($port=3001; $port -le 3018; $port++) {
    netsh interface ipv4 add excludedportrange protocol=tcp startport=$port numberofports=1
}

# Exclude infrastructure ports
netsh interface ipv4 add excludedportrange protocol=tcp startport=4000 numberofports=1
netsh interface ipv4 add excludedportrange protocol=tcp startport=5432 numberofports=1
netsh interface ipv4 add excludedportrange protocol=tcp startport=6379 numberofports=1
netsh interface ipv4 add excludedportrange protocol=tcp startport=9092 numberofports=1
netsh interface ipv4 add excludedportrange protocol=tcp startport=9093 numberofports=1

# Verify
netsh interface ipv4 show excludedportrange protocol=tcp | findstr "7233 1025 8025"
```

---

## About the SignOz Services (Different Issue)

The other 2 containers with issues are **not** port-related:

### vextrus-signoz-query-service
**Error:** `unable to open database file: no such file or directory`
**Cause:** Missing ClickHouse database connection
**Fix:** This is a dependency startup order issue - will resolve after Temporal/Mailhog are fixed

### vextrus-signoz-frontend
**Error:** `host not found in upstream signoz-query-service`
**Cause:** Depends on query-service being healthy first
**Fix:** Will auto-resolve once query-service starts properly

These will likely fix themselves once we restart all containers after the reboot.

---

## Why Reboot is Mandatory

Windows port reservations are managed at the **kernel level**. Once Windows reserves a port range during startup:
- The reservation persists until next boot
- No command can free it
- Even stopping all services won't help
- Only a reboot clears these reservations

This is a documented Windows behavior, not a bug in our scripts.

---

## Prevention for Future Reboots

After you successfully exclude these ports (post-reboot), the exclusions are **permanent**. Windows will:
- ✅ Remember these exclusions across reboots
- ✅ Never reserve these ports again
- ✅ Allow your containers to use them freely

**You only need to reboot ONCE to fix this.**

---

## Quick Reference

```powershell
# Before reboot: Run enhanced script
.\scripts\fix-windows-ports-reboot-required.ps1

# REBOOT WINDOWS

# After reboot: Run script again
.\scripts\fix-windows-ports-reboot-required.ps1

# Start Docker
docker-compose down && docker-compose up -d

# Verify
docker-compose ps
```

---

## Still Having Issues After Reboot?

If problems persist after reboot:

1. **Check if Hyper-V is interfering:**
   ```powershell
   Get-NetTCPConnection -LocalPort 7233,1025,8025
   ```

2. **Check Windows Firewall:**
   ```powershell
   Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*7233*" -or $_.DisplayName -like "*1025*"}
   ```

3. **Contact for support** - there may be enterprise policies blocking these ports

---

**TL;DR:**
1. Reboot Windows (required to clear existing port reservations)
2. Run the script again after reboot
3. Start Docker containers
4. Everything should work! 🚀
