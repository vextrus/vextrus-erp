# Apollo Sandbox Migration - Current Status

**Date**: 2025-10-10
**Task**: h-complete-apollo-sandbox-migration
**Overall Progress**: 95% Complete (⚠️ 1 blocker remaining)

## Executive Summary

Successfully migrated 13 GraphQL services from deprecated GraphQL Playground to Apollo Sandbox. All services now have proper Apollo Server 4.x configuration with Sandbox UI enabled. Federation expanded from 6 to 13 services, but schema composition blocked by PageInfo type conflict.

## ✅ Completed (All 13 Services)

### 1. Apollo Sandbox Configuration
- **Status**: ✅ Complete
- **Services**: auth, master-data, finance, organization, configuration, rules-engine, workflow, scheduler, notification, audit, import-export, file-storage, document-generator

All services now have:
- ✅ `playground: false` (deprecated Playground disabled)
- ✅ `plugins: [ApolloServerPluginLandingPageLocalDefault()]` (Sandbox enabled)
- ✅ `csrfPrevention: false` (Required for local development)
- ✅ `introspection: true` (Schema exploration enabled)
- ✅ Express middleware for body parsing (json + urlencoded)

### 2. Service Testing
- **Status**: ✅ Complete
- **Method**: Automated testing via curl for all 13 services

All services respond correctly to:
- ✅ `GET /graphql` with `Accept: text/html` → Returns Apollo Sandbox UI
- ✅ `POST /graphql` with `{"query":"{ __typename }"}` → Returns `{"data":{"__typename":"Query"}}`

### 3. Federation Expansion
- **Status**: ⚠️ Partially Complete (schema conflict)
- **Previous**: 6 subgraphs active
- **Current**: 13 subgraphs configured
- **Skipped**: 4 services (hr, crm, scm, project-management - not yet implemented)

**Active Subgraphs**:
1. auth (3001)
2. master-data (3002)
3. finance (3014)
4. organization (3016)
5. configuration (3004)
6. rules-engine (3012)
7. workflow (3011)
8. scheduler (3005)
9. notification (3003)
10. audit (3009)
11. import-export (3007)
12. file-storage (3008)
13. document-generator (3006)

## ⚠️ Blocker: PageInfo Schema Conflict

### Issue
Multiple services define the `PageInfo` type (used for cursor-based pagination) as non-shareable, causing Apollo Federation schema composition to fail.

### Affected Services
- audit
- configuration
- import-export
- notification

### Error Message
```
Non-shareable field "PageInfo.hasNextPage" is resolved from multiple subgraphs:
it is resolved from subgraphs "audit", "configuration", "import-export" and "notification"
and defined as non-shareable in all of them
```

### Impact
- API Gateway cannot compose unified schema
- Cross-service GraphQL queries blocked
- Federation remains degraded until resolved

### Resolution Options

#### Option A: Add @shareable Directive (Recommended)
Mark PageInfo as shareable in all services that use it:

```graphql
type PageInfo @shareable {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

**Pros**: Simple, follows Federation v2 best practices
**Cons**: Requires updating 4+ service schemas
**Effort**: Low (automated script possible)

#### Option B: Move to Shared Schema Package
Create a shared GraphQL schema package that all services import.

**Pros**: Centralized type definitions, prevents future conflicts
**Cons**: Requires architectural change, shared package management
**Effort**: Medium

#### Option C: Use Service-Specific Pagination
Rename PageInfo to service-specific names (e.g., AuditPageInfo, ConfigPageInfo).

**Pros**: No conflicts, service independence
**Cons**: Code duplication, inconsistent API
**Effort**: Medium

### Recommended Action
**Option A** - Add `@shareable` directive to PageInfo in all affected services. This is the fastest fix and aligns with Apollo Federation v2 best practices.

## 🔧 Service-Specific Variations

### Finance Service
**Unique Requirement**: Multi-tenant architecture with TenantMiddleware

**Implementation**:
- Middleware exclusion added for `/graphql` path (GET and POST)
- Code location: `services/finance/src/app.module.ts:78-84`
- Uses RequestMethod.ALL to exclude both GET (Sandbox UI) and POST (introspection)

**Limitation**:
- Service requires tenant context via headers or DEFAULT_TENANT_ID env variable
- For full Sandbox functionality, recommend adding `DEFAULT_TENANT_ID=default` to docker-compose.yml

### API Gateway
**Unique Configuration**: ApolloGatewayDriver instead of ApolloFederationDriver

**Implementation**:
- Plugins configured under `server.plugins` (not root `plugins`)
- Federation gateway pattern (aggregates subgraphs)
- csrfPrevention: false in gateway config

**Code Location**: `services/api-gateway/src/app.module.ts`

## 📊 Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Services Migrated | 13/13 | ✅ Complete |
| Apollo Sandbox Enabled | 13/13 | ✅ Complete |
| csrfPrevention Configured | 13/13 | ✅ Complete |
| Services in Federation | 13 | ⚠️ Schema conflict |
| Services Skipped | 4 | Expected (not implemented) |
| Blockers Resolved | 2/3 | 🔨 In Progress |

## 🎯 Next Steps

### Immediate (High Priority)
1. **Fix PageInfo Schema Conflict**
   - Add `@shareable` directive to PageInfo type
   - Services: audit, configuration, import-export, notification
   - Estimated time: 30 minutes

2. **Test Federation Health**
   - Verify API Gateway schema composition succeeds
   - Test cross-service GraphQL queries
   - Validate Sandbox UI at http://localhost:4000/graphql

### Short Term (Medium Priority)
3. **Add DEFAULT_TENANT_ID to Finance**
   - Update docker-compose.yml finance service environment
   - Add: `DEFAULT_TENANT_ID: default`
   - Test finance Sandbox without tenant headers

4. **Create Integration Test Suite**
   - Automated tests for all 13 services
   - Cross-service federation queries
   - Authentication flow testing

### Documentation
5. **Service Variations Documentation**
   - Finance multi-tenant requirements
   - API Gateway federation pattern
   - PageInfo conflict resolution

## 🚀 Success Criteria Checklist

- [x] All 13 services have Apollo Sandbox UI accessible
- [x] All services respond to GraphQL POST requests
- [x] Schema introspection enabled for all services
- [ ] Federation working without schema conflicts ⚠️ **PageInfo blocker**
- [ ] API Gateway composing unified schema ⚠️ **PageInfo blocker**
- [ ] Cross-service queries functional
- [ ] Comprehensive test suite created
- [ ] Service variations documented

## 📝 Files Modified

### Services (13)
- services/auth/src/main.ts
- services/auth/src/app.module.ts
- services/finance/src/main.ts
- services/finance/src/app.module.ts
- services/organization/src/main.ts
- services/organization/src/app.module.ts
- services/configuration/src/app.module.ts
- services/rules-engine/src/main.ts
- services/rules-engine/src/app.module.ts
- services/workflow/src/app.module.ts
- services/scheduler/src/app.module.ts
- services/notification/src/app.module.ts
- services/audit/src/app.module.ts
- services/import-export/src/app.module.ts
- services/file-storage/src/app.module.ts
- services/document-generator/src/app.module.ts

### Configuration
- docker-compose.yml (SKIP_SERVICES updated)

### Automation
- update-csrf-prevention.py (created)

## 🔗 Related Documentation
- APOLLO_SANDBOX_SUCCESS_REPORT.md - Master-data reference implementation
- services/master-data/CLAUDE.md - Complete service documentation
- sessions/tasks/h-complete-apollo-sandbox-migration.md - Task tracking

---
*Generated on 2025-10-10 after Session 2*
