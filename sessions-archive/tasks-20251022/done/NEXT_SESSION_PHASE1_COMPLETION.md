# Next Session: Complete Phase 1 with MCP-Powered Deep Analysis

## Session Initialization Prompt

```
I need to complete Phase 1 (Emergency Service Recovery) of the h-fix-infrastructure-achieve-100-percent-readiness task. Currently at 40% infrastructure readiness with only 2/13 services having working health endpoints.

CRITICAL CONTEXT:
- Task: h-fix-infrastructure-achieve-100-percent-readiness
- Branch: feature/h-fix-infrastructure-achieve-100-percent-readiness
- Current Status: 40% infrastructure, Phase 1 60% complete
- Working Services: Auth (3001), API Gateway (4000)
- Issues: 11/13 services lack health endpoints, 3 services not running

IMMEDIATE PRIORITIES:
1. Use MCP servers for deep analysis BEFORE implementing
2. Fix logging agent race condition issue
3. Complete Phase 1 systematically before Phase 2

Please start by:
1. Reading the checkpoint at .claude/state/checkpoint-2025-09-26-phase1-40-percent.md
2. Reading INFRASTRUCTURE_HEALTH_REPORT.md for current status
3. Using MCP servers to analyze the codebase systematically
```

## Phase 1 Completion Strategy with MCP Integration

### Step 1: Deep Analysis Using MCP Servers (30 minutes)

#### 1.1 Use Consult7 for Pattern Analysis
```python
# Analyze health endpoint patterns across all services
mcp__consult7__consultation(
    files=["services/*/src/modules/health/*.ts", "services/*/src/main.ts"],
    query="Analyze all health endpoint implementations. What patterns exist? Which services have health endpoints and which don't? What's the standard pattern we should follow?",
    model="gemini-2.5-pro|thinking"
)
```

#### 1.2 Use Context7 for NestJS Documentation
```python
# Get NestJS health check best practices
mcp__context7__resolve_library_id("@nestjs/terminus")
mcp__context7__get_library_docs(
    context7CompatibleLibraryID="/nestjs/terminus",
    topic="health checks",
    tokens=5000
)
```

#### 1.3 Use GitHub MCP for Examples
```python
# Search for health endpoint implementations
mcp__github__search_code(
    q="@nestjs/terminus HealthCheckService filename:*.module.ts",
    per_page=10
)
```

### Step 2: Deploy Specialized Agents (20 minutes)

#### 2.1 Performance Profiler Agent
```python
Task(
    description="Analyze service performance",
    subagent_type="performance-profiler",
    prompt="""
    Analyze why Document Generator is unhealthy after 19 hours.
    Check memory usage, connection pools, and resource leaks.
    Profile services: document-generator, master-data, workflow
    """
)
```

#### 2.2 API Integration Tester Agent
```python
Task(
    description="Test all service endpoints",
    subagent_type="api-integration-tester",
    prompt="""
    Test health endpoints for all 13 services systematically:
    - Auth (3001): /api/v1/health
    - Master Data (3002): Try /health, /api/health, /api/v1/health
    - Workflow (3011): Try all common health paths
    Document which endpoints work and which return 404
    """
)
```

#### 2.3 Business Logic Validator Agent
```python
Task(
    description="Validate service compliance",
    subagent_type="business-logic-validator",
    prompt="""
    Validate that all services meet ERP requirements:
    - Database connections are properly configured
    - Kafka connections are established
    - Redis caching is operational
    - Bangladesh regulatory compliance hooks are in place
    """
)
```

### Step 3: Systematic Implementation Plan

#### Phase 1A: Fix Logging Agent Issue (CRITICAL)
1. **Analyze the race condition**
   ```bash
   # Use Sequential Thinking MCP
   mcp__sequential-thinking__sequentialthinking(
       thought="Logging agent fails with 'file modified' error. Root cause analysis needed.",
       thoughtNumber=1,
       totalThoughts=5
   )
   ```

2. **Implement solution**
   - Option A: Create append-only log files
   - Option B: Implement file locking mechanism
   - Option C: Use database for work logs

#### Phase 1B: Add Health Endpoints (6 services)
1. **Master Data Service (3002)**
   ```typescript
   // Add to services/master-data/src/app.module.ts
   import { HealthModule } from './modules/health/health.module';
   imports: [..., HealthModule]
   ```

2. **Workflow Service (3011)**
   - Check Temporal connection in health
   - Add /health endpoint

3. **Rules Engine (3012)**
   - Add basic health check
   - Verify rule loading status

4. **Notification (3003)**
   - Add health module
   - Check email/SMS providers

5. **Scheduler (3005)**
   - Add health with cron job status
   - Check job queue health

6. **Document Generator (3006)**
   - Fix unhealthy status
   - Check Chromium/Puppeteer status

#### Phase 1C: Fix Port Exposure (5 services)
```yaml
# Update docker-compose.yml
notification:
  ports:
    - "3003:3003"

configuration:
  ports:
    - "3004:3004"

scheduler:
  ports:
    - "3005:3005"

document-generator:
  ports:
    - "3006:3006"

audit:
  ports:
    - "3009:3009"
```

#### Phase 1D: Start Missing Services (3 services)
1. **Organization Service**
   ```bash
   docker-compose up -d organization
   ```

2. **Import-Export Service**
   - Create stub implementation like API Gateway
   - Use inline Node.js server in docker-compose.yml

3. **File Storage Service**
   - Create minimal Express stub
   - Implement basic health endpoint

### Step 4: Validation Using MCP Servers

#### 4.1 Use Playwright MCP for E2E Testing
```python
mcp__playwright__browser_navigate(url="http://localhost:4000/health")
mcp__playwright__browser_snapshot()
# Test all 13 service health endpoints
```

#### 4.2 Use SQLite MCP for Database Verification
```python
mcp__sqlite__query(
    sql="SELECT service_name, last_health_check FROM service_status"
)
```

### Step 5: Complete Phase 1 Checklist

- [ ] All 13 services running
- [ ] All 13 services have health endpoints
- [ ] All ports properly exposed
- [ ] Database connections verified
- [ ] Kafka connections established
- [ ] Redis connections working
- [ ] GraphQL federation operational
- [ ] Logging agent issue resolved
- [ ] Document Generator healthy
- [ ] Organization service started
- [ ] Import-Export stub working
- [ ] File Storage stub working

## Expected Outcomes

### Infrastructure Metrics Target
- Services Running: 13/13 (100%)
- Health Endpoints: 13/13 (100%)
- Ports Exposed: 13/13 (100%)
- Database Verified: 13/13 (100%)
- **Target: 70% Overall Infrastructure Ready**

### Time Allocation
- Deep Analysis: 30 minutes
- Agent Deployment: 20 minutes
- Implementation: 2 hours
- Testing & Validation: 30 minutes
- **Total: ~3 hours**

## Critical Success Factors

1. **USE MCP SERVERS FIRST** - Analyze before implementing
2. **DEPLOY AGENTS IN PARALLEL** - Multiple agents working simultaneously
3. **SYSTEMATIC APPROACH** - Follow Phase 1 completely before Phase 2
4. **FIX LOGGING ISSUE** - Critical for all future work
5. **VALIDATE EVERYTHING** - Use integration testing agents

## Fallback Strategy

If time runs short:
1. Focus on getting all 13 services running (even with stubs)
2. Add basic health endpoints returning `{"status": "ok"}`
3. Expose all ports in docker-compose.yml
4. Document remaining work for next session

## Command Sequences Ready

```bash
# Quick health check all services
for port in 3001 3002 3003 3004 3005 3006 3007 3008 3009 3011 3012 3016 4000; do
  echo "Port $port: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:$port/health)"
done

# Restart all services
docker-compose down && docker-compose up -d

# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}" | grep vextrus

# View logs for unhealthy services
docker-compose logs --tail=50 document-generator
```

## Remember

- **Logging Agent Bug** is CRITICAL - affects all file modifications
- **Use MCP servers** for research BEFORE implementation
- **Deploy agents** for parallel work
- **Systematic approach** - don't skip steps
- **Phase 1 must be 100%** before Phase 2

---

*This plan leverages MCP servers and agents for efficient, systematic completion of Phase 1.*