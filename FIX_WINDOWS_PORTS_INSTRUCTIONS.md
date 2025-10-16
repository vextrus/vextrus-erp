# Fix Windows Port Conflicts - Complete Instructions

## Problem
After restarting Windows, Temporal (port 7233) and Mailhog (ports 1025, 8025) cannot start because Windows has reserved these ports in its dynamic port allocation range.

**Error Message:**
```
ports are not available: exposing port TCP 0.0.0.0:7233 -> 127.0.0.1:0: listen tcp 0.0.0.0:7233: bind: An attempt was made to access a socket in a way forbidden by its access permissions.
```

## Solution Steps

### Step 1: Run PowerShell as Administrator

1. Press `Windows + X`
2. Click **"Windows PowerShell (Admin)"** or **"Terminal (Admin)"**
3. If prompted by UAC (User Account Control), click **Yes**

### Step 2: Navigate to Project Directory

```powershell
cd C:\Users\riz\vextrus-erp
```

### Step 3: Run the Port Fix Script

```powershell
.\scripts\fix-windows-ports.ps1
```

**What the script does:**
- Excludes 25+ ports from Windows dynamic port range
- Includes all Vextrus ERP service ports:
  - 7233 (Temporal)
  - 1025 (Mailhog SMTP)
  - 8025 (Mailhog Web UI)
  - 3001-3018 (All microservices)
  - 4000 (API Gateway)
  - 5432, 6379, 9092, 9093 (Infrastructure)

### Step 4: Verify Port Exclusions

After running the script, verify the ports are excluded:

```powershell
netsh interface ipv4 show excludedportrange protocol=tcp
```

You should see entries like:
```
     7233        7233        1
     1025        1025        1
     8025        8025        1
```

### Step 5: Restart Docker Desktop

1. Right-click Docker Desktop icon in system tray
2. Click **"Quit Docker Desktop"**
3. Wait 10 seconds
4. Start Docker Desktop again

### Step 6: Start Services

Once Docker is running:

```bash
# Stop all containers
docker-compose down

# Start everything again
docker-compose up -d

# Verify Temporal and Mailhog are running
docker ps --filter "name=temporal" --filter "name=mailhog"
```

### Step 7: Restart Document Generator (with new health check)

```bash
docker-compose restart document-generator

# Check health after ~45 seconds
docker ps --filter "name=document-generator"
```

## Expected Results

After completing these steps:
- ✅ Temporal should start on port 7233
- ✅ Mailhog should start on ports 1025 (SMTP) and 8025 (Web UI)
- ✅ Document Generator should show as "healthy"
- ✅ All services should be running without port conflicts

## Verification Commands

```bash
# Check all service statuses
docker-compose ps

# Verify Temporal is accessible
curl http://localhost:7233/

# Verify Mailhog web UI
# Open browser: http://localhost:8025

# Verify document generator health
curl http://localhost:3006/api/v1/health
```

## Troubleshooting

### If script fails with "Access Denied"
- Ensure PowerShell is running as Administrator
- Check UAC settings

### If ports still conflict after running script
1. Restart your computer (Windows may need a full reboot)
2. Re-run the script after restart
3. Then restart Docker Desktop

### If Docker still shows port conflicts
Check if another application is using these ports:
```powershell
netstat -ano | findstr "7233"
netstat -ano | findstr "1025"
```

## Permanent Solution

The port exclusions created by this script are **permanent** and will persist across Windows restarts. You only need to run this script once per machine.

## Notes

- The script is safe to run multiple times
- It will skip ports that are already excluded
- All changes can be reversed if needed (contact support for instructions)
- This is a Windows-specific issue and not required on Linux/macOS

## References

- [Microsoft Docs: Port Reservation](https://docs.microsoft.com/en-us/troubleshoot/windows-server/networking/configure-excluded-port-range)
- [Docker Desktop Windows Port Issues](https://github.com/docker/for-win/issues/3171)
