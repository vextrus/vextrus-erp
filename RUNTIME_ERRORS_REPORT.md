# Runtime Errors Report - Optimized Services Deployment

**Date:** 2025-10-07
**Branch:** feature/optimize-docker-infrastructure
**Services Deployed:** 13 optimized services
**Infrastructure Status:** Running (postgres, redis, kafka, zookeeper, elasticsearch, minio, temporal)

---

## EXECUTIVE SUMMARY

**Services Status:**
- ✅ **1 service healthy:** organization
- ⚠️ **9 services unhealthy:** auth, api-gateway, scheduler, audit, file-storage, notification, import-export, document-generator, master-data
- 🔴 **3 services crashing:** workflow, rules-engine, configuration

**Critical Issues:** 3 services cannot run due to runtime errors
**Estimated Fix Time:** 1-2 days

---

## CRITICAL RUNTIME ERRORS

### 1. Workflow Service - ALPINE INCOMPATIBILITY ⚠️ HIGH PRIORITY

**Status:** Crashing (Restarting continuously)

**Error:**
```
Error: Error loading shared library ld-linux-x86-64.so.2: No such file or directory
(needed by @temporalio/core-bridge/releases/x86_64-unknown-linux-gnu/index.node)
    at Module._extensions..node (node:internal/modules/cjs/loader:1661:18)
```

**Root Cause:**
- **Temporal SDK native bindings require glibc**
- Alpine Linux uses musl libc (incompatible)
- @temporalio/core-bridge contains Rust native modules compiled for glibc

**Impact:**
- Workflow service cannot run at all on Alpine image
- Critical for business process orchestration
- Blocks any workflow-based features

**Solution:**
```yaml
# MUST use Debian-based image, not Alpine
services/workflow/Dockerfile:
  FROM node:20-bookworm-slim  # Changed from node:20-alpine
```

**Files to Change:**
- `docker-compose.yml` line ~600: Change dockerfile to Debian-based template
- Create `infrastructure/docker/templates/node-service-debian-temporal.Dockerfile`
- Use same Debian template as Finance (already exists)

**Estimated Fix Time:** 2 hours (rebuild with Debian image)

---

### 2. Rules-Engine Service - KAFKA HEALTH INDICATOR BUG 🔴 BLOCKING

**Status:** Crashing (Restarting continuously)

**Error:**
```
[Nest] ERROR [ExceptionHandler] Nest can't resolve dependencies of the KafkaHealthIndicator (?).
Please make sure that the argument "KAFKA_CLIENT" at index [0] is available in the HealthModule context.
```

**Root Cause:**
- Health module trying to use `KafkaHealthIndicator`
- `KAFKA_CLIENT` provider not registered in HealthModule's context
- Likely missing `KafkaModule` import in HealthModule

**Impact:**
- Rules engine service crashes on startup
- Business rules cannot be evaluated
- Blocks conditional workflow logic

**Solution:**
```typescript
// services/rules-engine/src/health/health.module.ts

@Module({
  imports: [
    TerminusModule,
    KafkaModule,  // ADD THIS - missing import
  ],
  controllers: [HealthController],
  providers: [HealthService, KafkaHealthIndicator],
})
export class HealthModule {}
```

**Files to Fix:**
- `services/rules-engine/src/health/health.module.ts` - Add KafkaModule import
- OR remove KafkaHealthIndicator from health checks if not needed

**Estimated Fix Time:** 30 minutes

---

### 3. Configuration Service - APOLLO DRIVER BUG 🔴 BLOCKING

**Status:** Crashing (Restarting continuously)

**Error:**
```
[Nest] ERROR [ExceptionHandler] Nest can't resolve dependencies of the ApolloDriver (?).
Please make sure that the argument ModulesContainer at index [0] is available in the GraphQLModule context.
```

**Root Cause:**
- GraphQL module misconfiguration
- ApolloDriver cannot resolve ModulesContainer dependency
- Likely @nestjs/graphql version mismatch or incorrect GraphQLModule.forRoot() setup

**Impact:**
- Configuration service crashes on startup
- Feature flags, tenant configs unavailable
- Blocks multi-tenant functionality

**Solution:**
```typescript
// services/configuration/src/app.module.ts

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,  // Ensure ApolloDriver is imported correctly
      autoSchemaFile: true,
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      context: ({ req }) => ({ req }),
      buildSchemaOptions: {
        // Ensure proper schema building
      },
    }),
    // ... other imports
  ],
})
export class AppModule {}
```

**Files to Check:**
- `services/configuration/src/app.module.ts` - GraphQL configuration
- `services/configuration/package.json` - Verify @nestjs/graphql version
- May need to upgrade: `@nestjs/graphql@^12.0.0` and `@nestjs/apollo@^12.0.0`

**Estimated Fix Time:** 1 hour

---

## SERVICES WITH HEALTH CHECK ISSUES (Not Crashing but Unhealthy)

### 4. Auth Service
**Status:** Up, health: starting → will likely become unhealthy
**Issue:** Missing /health endpoint implementation
**Priority:** Medium
**Fix:** Add TerminusModule health checks

### 5. Master-Data Service
**Status:** Up 2 hours (unhealthy)
**Issue:** Missing /health endpoint implementation
**Priority:** Medium
**Fix:** Add TerminusModule health checks

### 6. API Gateway Service
**Status:** Up, health: starting → will likely become unhealthy
**Issue:** Missing /health endpoint implementation
**Priority:** High (gateway is critical)
**Fix:** Add TerminusModule health checks

### 7. Scheduler Service
**Status:** Up, health: starting → will likely become unhealthy
**Issue:** Missing /health endpoint implementation
**Priority:** Medium
**Fix:** Add TerminusModule health checks

### 8. Audit Service
**Status:** Up (unhealthy)
**Issue:** Missing /health endpoint implementation
**Priority:** Medium
**Fix:** Add TerminusModule health checks

### 9. File-Storage Service
**Status:** Up (unhealthy)
**Issue:** Missing /health endpoint implementation
**Priority:** Medium
**Fix:** Add TerminusModule health checks

### 10. Notification Service
**Status:** Up (unhealthy)
**Issue:** Missing /health endpoint implementation
**Priority:** Medium
**Fix:** Add TerminusModule health checks

### 11. Import-Export Service
**Status:** Up (unhealthy)
**Issue:** Missing /health endpoint implementation
**Priority:** Low
**Fix:** Add TerminusModule health checks

### 12. Document-Generator Service
**Status:** Up (unhealthy)
**Issue:** Has health endpoint but failing health check
**Priority:** Medium
**Fix:** Investigate why health check is failing (DB connection? Kafka?)

---

## SUCCESSFUL SERVICE

### ✅ Organization Service - HEALTHY
**Status:** Up (healthy)
**Port:** 3016
**Notes:** Only service passing health checks properly
**Why:** Likely has proper TerminusModule setup and all dependencies available

**Use as reference implementation for other services!**

---

## RECOMMENDED FIX SEQUENCE

### Immediate (Today)

1. **Fix workflow service Alpine incompatibility** (2 hours)
   - Change to Debian-based Dockerfile
   - Rebuild workflow service

2. **Fix rules-engine KafkaHealthIndicator** (30 minutes)
   - Add KafkaModule import to HealthModule
   - Rebuild rules-engine service

3. **Fix configuration ApolloDriver** (1 hour)
   - Review GraphQL module setup
   - Upgrade @nestjs/graphql if needed
   - Rebuild configuration service

**Total Immediate Fixes:** 3.5 hours

### Short-term (This Week)

4. **Add health endpoints to 9 unhealthy services** (1 day)
   - Use organization service as template
   - Copy HealthModule structure to all services
   - Verify database, Redis, Kafka connectivity in health checks

5. **Investigate document-generator health failure** (2 hours)
   - Check logs for specific health check failures
   - Fix underlying connectivity issues

**Total Short-term Fixes:** 1.5 days

---

## DETAILED FIX INSTRUCTIONS

### Fix 1: Workflow Service - Switch to Debian Image

**Step 1:** Update docker-compose.yml
```yaml
# docker-compose.yml line ~600
workflow:
  build:
    context: .
    dockerfile: ./infrastructure/docker/templates/node-service-debian-temporal.Dockerfile  # NEW
    args:
      SERVICE_NAME: workflow
      SERVICE_PORT: 3011
      NODE_VERSION: 20
```

**Step 2:** Create Debian template (or use existing debian-ml template)
```dockerfile
# infrastructure/docker/templates/node-service-debian-temporal.Dockerfile
FROM node:20-bookworm-slim AS base

# Install minimal dependencies for Temporal native bindings
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

WORKDIR /app

# ... rest of multi-stage build same as Alpine version
```

**Step 3:** Rebuild
```bash
docker-compose build workflow
docker-compose up -d workflow
docker logs vextrus-workflow
```

---

### Fix 2: Rules-Engine - Add KafkaModule Import

**File:** `services/rules-engine/src/health/health.module.ts`

**Change:**
```typescript
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { KafkaModule } from '../kafka/kafka.module';  // ADD THIS LINE
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { KafkaHealthIndicator } from './kafka.health';

@Module({
  imports: [
    TerminusModule,
    KafkaModule,  // ADD THIS LINE
  ],
  controllers: [HealthController],
  providers: [HealthService, KafkaHealthIndicator],
})
export class HealthModule {}
```

**Rebuild:**
```bash
docker-compose build rules-engine
docker-compose up -d rules-engine
docker logs vextrus-rules-engine
```

---

### Fix 3: Configuration - Fix ApolloDriver

**File:** `services/configuration/src/app.module.ts`

**Verify imports:**
```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';  // Ensure correct import

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

**Check package.json versions:**
```json
{
  "dependencies": {
    "@nestjs/graphql": "^12.1.1",
    "@nestjs/apollo": "^12.1.0",
    "@apollo/server": "^4.10.0",
    "graphql": "^16.8.1"
  }
}
```

**If versions are old, upgrade:**
```bash
cd services/configuration
pnpm add @nestjs/graphql@^12.1.1 @nestjs/apollo@^12.1.0
cd ../..
docker-compose build configuration
docker-compose up -d configuration
```

---

## IMPACT ANALYSIS

### Critical Business Functions Blocked:

1. **Workflow Orchestration (workflow service down)**
   - Purchase order approval workflows
   - Invoice processing workflows
   - Multi-step business processes

2. **Business Rules (rules-engine down)**
   - Discount calculations
   - Validation rules
   - Conditional logic

3. **Multi-Tenancy (configuration service down)**
   - Tenant-specific settings
   - Feature flags
   - System configuration

### Services Still Functional:

- ✅ Organization management (organization service)
- ⚠️ Other 9 services running but without health checks

---

## TESTING CHECKLIST

After applying fixes, verify:

```bash
# 1. Check all services are running
docker ps | grep vextrus

# 2. Check no services are restarting
docker ps | grep Restarting

# 3. Check service health
docker inspect vextrus-workflow | jq '.[].State.Health'
docker inspect vextrus-rules-engine | jq '.[].State.Health'
docker inspect vextrus-configuration | jq '.[].State.Health'

# 4. Check logs for errors
docker logs vextrus-workflow --tail 50
docker logs vextrus-rules-engine --tail 50
docker logs vextrus-configuration --tail 50

# 5. Test GraphQL endpoints
curl -X POST http://localhost:4000/graphql -H "Content-Type: application/json" -d '{"query": "{ __schema { types { name } } }"}'
```

---

## NEXT STEPS

1. ✅ Complete this runtime errors report
2. 🔧 Fix 3 critical crashing services (3.5 hours)
3. 🔧 Add health endpoints to 9 unhealthy services (1 day)
4. ✅ Proceed with Finance optimization (Debian ML template)
5. 📋 Create separate task for production readiness issues

---

## CONCLUSION

**Current Deployment Success Rate:** 76.9% (10/13 services running)

**Blocking Issues:** 3 services
**Non-Blocking Issues:** 9 services (missing health checks)

**Total Estimated Fix Time:** 2 days
- Critical fixes: 3.5 hours
- Health endpoint additions: 1 day

**Recommendation:**
1. Fix the 3 critical issues immediately
2. Proceed with Finance optimization (uses Debian image, will work)
3. Address health endpoint additions as separate task

---

**Report Generated:** 2025-10-07 19:30 Bangladesh Time
**Log Files Created:**
- `workflow-runtime-errors.log`
- `deploy-optimized-services.log`
