# SignOz Quick Start - Test Your Fixes

## What Was Fixed

We resolved **3 critical issues** preventing SignOz from starting:

1. **Port Conflict**: SignOz Query Service moved from 8081 → 8084 (8081 was used by Traefik)
2. **Missing Volume**: Added `signoz_query_data` volume for SQLite metadata database
3. **Authentication Error**: Simplified ClickHouse authentication (removed password requirement)
4. **Startup Order**: Added health checks so Frontend waits for Query Service to be ready

## Quick Test (2 Minutes)

### Option 1: Automated Test (Recommended)

**Windows (PowerShell)**:
```powershell
.\test-signoz-fix.ps1
```

**Linux/Mac (Bash)**:
```bash
chmod +x test-signoz-fix.sh
./test-signoz-fix.sh
```

### Option 2: Manual Test

**Step 1: Restart Docker Services**
```bash
docker-compose down
docker-compose up -d
```

**Step 2: Wait 60 seconds for startup**
```bash
# Watch the logs
docker-compose logs -f signoz-query-service signoz-frontend
```

**Step 3: Check Status**
```bash
# All 4 SignOz containers should be "Up"
docker ps | grep signoz
```

Expected output:
```
vextrus-signoz-frontend         Up (healthy)   3301:3301
vextrus-signoz-query-service    Up (healthy)   8084:8080
vextrus-signoz-clickhouse       Up             9100:9000, 8123:8123
vextrus-signoz-otel-collector   Up             4317-4318, 8889, 13133, 55679
```

**Step 4: Test Query Service API**
```bash
curl http://localhost:8084/api/v1/version
```

Should return JSON with version info.

**Step 5: Test Frontend**
```
Open browser: http://localhost:3301
```

You should see the SignOz dashboard (no connection errors).

## Success Criteria

✅ All 4 SignOz containers running (not restarting)
✅ Query Service status: "Up (healthy)"
✅ No "unable to open database file" errors in logs
✅ No "Authentication failed" errors in logs
✅ No "host not found in upstream" errors in logs
✅ SignOz UI loads at http://localhost:3301
✅ API responds at http://localhost:8084/api/v1/version

## Troubleshooting

### Query Service keeps restarting?

```bash
# Check logs for errors
docker logs vextrus-signoz-query-service --tail 50

# Common issues:
# 1. ClickHouse not running: docker logs vextrus-signoz-clickhouse
# 2. Volume permissions: docker exec vextrus-signoz-query-service ls -la /var/lib/signoz
```

### Frontend can't connect?

```bash
# Verify Query Service is healthy first
docker inspect vextrus-signoz-query-service | grep -A 5 "Health"

# Check Frontend logs
docker logs vextrus-signoz-frontend --tail 50
```

### Still seeing authentication errors?

Verify docker-compose.yml has:

**ClickHouse** (line 760):
```yaml
CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT: 0
```

**Query Service** (line 802):
```yaml
ClickHouseUrl: tcp://signoz-clickhouse:9000  # No username/password
```

## Configuration Files

All fixes are in:
- `docker-compose.yml` - Lines 753-817
- `SIGNOZ_FIX_COMPLETE.md` - Full documentation
- `BACKEND_PORT_ALLOCATION.md` - Updated port list

## Next Steps

Once SignOz is running:

1. **Configure OTEL Exporters** in your microservices:
   ```yaml
   OTEL_EXPORTER_OTLP_ENDPOINT: http://signoz-otel-collector:4318
   OTEL_SERVICE_NAME: your-service-name
   ```

2. **Set up Dashboards** in SignOz UI (http://localhost:3301):
   - Create service dashboards
   - Configure alerts
   - Set up SLO monitoring

3. **Test Tracing**: Make API calls to your services and view traces in SignOz

## Support

If issues persist after following this guide:
1. Check `SIGNOZ_FIX_COMPLETE.md` for detailed troubleshooting
2. Run the automated test scripts
3. Review container logs for specific error messages

---

**Status**: All fixes applied ✅
**Updated**: 2025-10-14
**Containers Fixed**: SignOz Query Service, SignOz Frontend, SignOz ClickHouse
