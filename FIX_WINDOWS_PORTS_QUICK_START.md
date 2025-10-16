# Windows Port Conflict Resolution - Quick Start Guide

## Problem Summary

Windows randomly reserves ports in the dynamic range (1024-65535) for system use. These reservations persist across reboots and prevent Docker containers from binding to specific ports.

**Your Recent Port Conflicts:**
1. **First failure**: Ports 7233 (Temporal), 1025/8025 (Mailhog)
2. **Second failure**: Port 5432 (PostgreSQL)
3. **Third failure**: Port 4317 (SignOz OTEL Collector)

## Root Cause

Windows kernel-level port reservations conflict with Docker's need to bind to specific ports. Each time a port conflict is discovered, we've been adding it individually to the exclusion list. This iterative approach is frustrating.

## Comprehensive Solution

The updated script `scripts\fix-windows-ports-clean.ps1` now excludes **ALL 61 ports** used by your Docker Compose infrastructure.

### Complete Port List (61 ports)

**Infrastructure (4 ports)**
- 80, 443 (Traefik), 5432 (PostgreSQL), 6379 (Redis)

**Event Sourcing & Messaging (4 ports)**
- 21113, 22113 (EventStore), 9092, 9093 (Kafka)

**Storage & Search (3 ports)**
- 9000, 9001 (MinIO), 9200 (Elasticsearch)

**Message Queue (2 ports)**
- 5672, 15672 (RabbitMQ)

**Workflow (2 ports)**
- 7233 (Temporal), 8088 (Temporal UI)

**OpenTelemetry (6 ports) - CRITICAL**
- **4317** (OTEL gRPC) - *This was your latest failure*
- **4318** (OTEL HTTP)
- 8888, 8889, 13133, 55679 (OTEL metrics/health)

**SignOz (3 ports)**
- 9100, 8123 (ClickHouse), 3301 (SignOz Frontend)

**Monitoring (3 ports)**
- 9090 (Prometheus), 3000, 3500 (Grafana)

**Jaeger (5 ports)**
- 5778, 16686, 14268, 14250, 9411

**Development Tools (7 ports)**
- 8081 (Traefik Dashboard), 8082 (Adminer), 8083 (Redis Commander)
- 8085 (Kafka UI), 4873 (Verdaccio), 1025, 8025 (Mailhog)

**Core Services (9 ports)**
- 3001-3009 (Auth, Master Data, Notification, Configuration, Scheduler, Document Generator, Import/Export, File Storage, Audit)

**Business Services (8 ports)**
- 3011-3018 (Workflow, Rules Engine, CRM, Finance, HR, Organization, Project Management, SCM)

**Gateway (1 port)**
- 4000 (API Gateway)

## Step-by-Step Instructions

### Step 1: Stop Docker

```powershell
docker-compose down
```

### Step 2: Run the Comprehensive Port Fix

Open PowerShell **as Administrator**:

```powershell
cd C:\Users\riz\vextrus-erp
.\scripts\fix-windows-ports-clean.ps1
```

### Step 3: Check the Output

**If all ports are available:**
- Script will show "SUCCESS - All Ports Available"
- Skip to Step 5

**If conflicts detected:**
- Script will show "REBOOT REQUIRED"
- Will list all conflicting ports and their Windows-reserved ranges
- Proceed to Step 4

### Step 4: Reboot (If Needed)

1. Restart your computer
2. Wait for full startup
3. Run the script again:
   ```powershell
   .\scripts\fix-windows-ports-clean.ps1
   ```
4. Verify all ports show as "OK" or "Already excluded"

### Step 5: Start Docker Services

```powershell
docker-compose up -d
```

### Step 6: Verify All Containers

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Expected result:** All 40/40 containers running (not 40/41)

## Verification Commands

**Check port exclusions:**
```powershell
netsh interface ipv4 show excludedportrange protocol=tcp
```

**Check for specific port:**
```powershell
netsh interface ipv4 show excludedportrange protocol=tcp | Select-String "4317"
```

**Check Docker container health:**
```powershell
docker ps -a | Select-String "Exited|unhealthy"
```

**Check specific service logs:**
```powershell
docker logs vextrus-signoz-otel-collector --tail 50
docker logs vextrus-temporal --tail 50
docker logs vextrus-mailhog --tail 50
```

## What This Script Does

1. **Checks administrator privileges** - Required for netsh commands
2. **Reads current Windows port reservations** - From `netsh interface ipv4`
3. **Analyzes each of 61 critical ports**:
   - ✅ Already excluded → Skip
   - ⚠️ In reserved range → Flag for reboot
   - ➕ Available → Exclude immediately
4. **Reports conflicts** - Shows which ports need reboot to clear
5. **Excludes available ports** - Uses `netsh interface ipv4 add excludedportrange`

## Why Reboot Is Sometimes Needed

Windows kernel-level port reservations cannot be removed without a reboot. The `netsh` command can only prevent *future* reservations, not remove *existing* ones.

**Reboot clears:**
- Hyper-V dynamic port reservations
- Windows NAT service reservations
- System process port locks

## Troubleshooting

### "Access Denied" Error
- Ensure PowerShell is running **as Administrator**
- Right-click PowerShell → "Run as Administrator"

### "Execution Policy" Error
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\fix-windows-ports-clean.ps1
```

### Script Shows Success But Docker Still Fails
1. Restart Docker Desktop completely
2. Run `docker system prune -a` (WARNING: removes all unused containers/images)
3. Check Windows Hyper-V status: `Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V`

### Port Still Conflicts After Reboot
- Check if another application is using the port:
  ```powershell
  netstat -ano | Select-String ":4317"
  ```
- If PID shown, identify process:
  ```powershell
  Get-Process -Id <PID>
  ```

## Success Criteria

✅ **All 61 ports excluded from Windows dynamic range**
✅ **All 40 Docker containers running**
✅ **No port binding errors in logs**
✅ **Services accessible:**
   - API Gateway: http://localhost:4000/graphql
   - Traefik Dashboard: http://localhost:8081
   - Grafana: http://localhost:3500
   - Temporal UI: http://localhost:8088
   - SignOz: http://localhost:3301

## Next Steps After Fix

Once all containers are running:

1. **Test authentication flow** - Login via GraphQL API
2. **Verify GraphQL Federation** - Check API Gateway aggregates all subgraphs
3. **Check observability stack** - View traces in SignOz, metrics in Grafana
4. **Resume frontend integration** - Start work on `h-integrate-frontend-backend-finance-module` task

## Support

If issues persist after following this guide:
1. Capture full output: `.\scripts\fix-windows-ports-clean.ps1 > port-fix-output.txt`
2. Capture Docker logs: `docker-compose logs > docker-logs.txt`
3. Check Windows Event Viewer → Windows Logs → System for port-related errors
4. Verify Hyper-V and WSL2 status

---

**This comprehensive fix addresses all known and potential port conflicts in one operation.**
