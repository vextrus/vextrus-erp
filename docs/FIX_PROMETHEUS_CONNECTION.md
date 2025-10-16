# Fix Prometheus Connection in Grafana

## The Problem
Grafana can't connect to Prometheus using `localhost:9090` because both services are running in Docker containers. Containers need to communicate using container names on the Docker network.

## Solution: Configure Prometheus Data Source

### Step 1: Add Prometheus Data Source in Grafana

1. **In Grafana** (http://localhost:3000), go to:
   - **Configuration** (gear icon) → **Data Sources**
   - Or navigate directly to: http://localhost:3000/datasources

2. **Click "Add data source"**

3. **Select "Prometheus"**

4. **Configure with these settings:**
   ```
   Name: Prometheus
   URL: http://vextrus-prometheus:9090
   ```

   **IMPORTANT**: Use `vextrus-prometheus:9090` NOT `localhost:9090`

5. **Leave other settings as default:**
   - Access: Server (default)
   - Auth: All disabled (default)
   - Skip TLS Verify: OFF (default)

6. **Click "Save & Test"**
   - You should see: "Data source is working"

### Step 2: Re-import Dashboards with Correct Data Source

Now that Prometheus is properly configured, re-import the dashboards:

1. **Go to Dashboards → Import**

2. **Upload each JSON file:**
   - `infrastructure/monitoring/grafana/dashboards/service-health.json`
   - `infrastructure/monitoring/grafana/dashboards/business-kpis.json`
   - `infrastructure/monitoring/grafana/dashboards/infrastructure-metrics.json`

3. **When prompted for data source:**
   - Select "Prometheus" (the one you just configured)
   - Click "Import"

### Alternative: Quick Command Line Fix

If you prefer, you can add the data source via API:

```bash
# Add Prometheus data source via Grafana API
curl -X POST http://admin:vextrus_grafana_2024@localhost:3000/api/datasources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Prometheus",
    "type": "prometheus",
    "access": "proxy",
    "url": "http://vextrus-prometheus:9090",
    "isDefault": true
  }'
```

## Why This Works

- **Docker Networking**: Containers on the same Docker network can communicate using container names
- **Container Name**: `vextrus-prometheus` is the hostname inside the Docker network
- **Port**: Still use port 9090, but with the container hostname
- **Access Mode**: "Server" means Grafana backend makes the request (not your browser)

## Verify It's Working

1. **Test Prometheus directly** (from outside Docker):
   ```bash
   curl http://localhost:9090/api/v1/query?query=up
   ```

2. **Check Grafana can reach Prometheus**:
   - Go to http://localhost:3000/datasources
   - Click on "Prometheus"
   - Click "Test" button
   - Should show "Data source is working"

3. **Check dashboards are loading data**:
   - Go to any dashboard
   - Data should start appearing within 10-30 seconds

## Container Communication Reference

| From | To | Use URL |
|------|-----|---------|
| Your Browser | Prometheus | http://localhost:9090 |
| Your Browser | Grafana | http://localhost:3000 |
| Grafana Container | Prometheus | http://vextrus-prometheus:9090 |
| Prometheus Container | Services | http://<service-name>:<port> |

## Still Not Working?

1. **Check both containers are on same network:**
   ```bash
   docker inspect vextrus-grafana | grep NetworkMode
   docker inspect vextrus-prometheus | grep NetworkMode
   ```

2. **Test connectivity between containers:**
   ```bash
   docker exec vextrus-grafana ping vextrus-prometheus
   ```

3. **Check Prometheus is responding:**
   ```bash
   docker exec vextrus-grafana curl http://vextrus-prometheus:9090/api/v1/query?query=up
   ```

The key is using `vextrus-prometheus:9090` instead of `localhost:9090` in the Grafana data source configuration!