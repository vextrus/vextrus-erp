---
task: h-complete-infrastructure-foundation/01-fix-docker-builds
status: pending
created: 2025-09-20
---

# Subtask 1: Fix Docker Build Issues

## Objective
Resolve all Docker build issues and ensure every service can be built successfully as a container.

## Success Criteria
- [ ] All service Dockerfiles validated and fixed
- [ ] pnpm workspace dependencies resolved
- [ ] Build context issues fixed
- [ ] Multi-stage builds optimized
- [ ] All services build without errors

## Tasks

### 1. Audit Current Dockerfiles
- [ ] List all Dockerfiles in infrastructure/docker/services/
- [ ] Identify which services use which Dockerfile
- [ ] Document build failures and errors

### 2. Create Universal Service Dockerfile
- [ ] Create optimized multi-stage Dockerfile
- [ ] Handle pnpm workspaces correctly
- [ ] Include health check commands
- [ ] Minimize final image size

### 3. Update docker-compose.yml
- [ ] Update all service definitions to use correct Dockerfile
- [ ] Fix build context paths
- [ ] Add proper build arguments
- [ ] Configure health checks

### 4. Test Builds
- [ ] Build each service individually
- [ ] Fix any build errors
- [ ] Verify image sizes are reasonable
- [ ] Test container startup

## Common Issues to Fix
- Missing dependencies in Dockerfile
- Incorrect WORKDIR paths
- pnpm workspace resolution
- Node module permissions
- Port exposure configuration

## Validation
```bash
# Test build all services
docker-compose build --parallel

# Verify images created
docker images | grep vextrus

# Test individual service
docker-compose build auth
docker-compose up auth
```