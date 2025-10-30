# Vextrus ERP Troubleshooting Guide

This guide documents real issues encountered during development and their solutions.

## 📋 Table of Contents
- [TypeScript & NestJS Build Issues](#typescript--nestjs-build-issues)
- [Kafka Configuration Issues](#kafka-configuration-issues)
- [Port Conflicts](#port-conflicts)
- [MCP Server Configuration](#mcp-server-configuration)
- [Health Check Implementation](#health-check-implementation)
- [Docker & Service Issues](#docker--service-issues)

---

## TypeScript & NestJS Build Issues

### Problem: "Cannot find module 'dist/main'"
**Error Message:**
```
Error: Cannot find module 'C:\Users\riz\vextrus-erp\services\auth\dist\main'
```

**Root Cause:** 
- NestJS build process wasn't creating the `dist` directory
- Overly strict TypeScript configuration in `tsconfig.base.json`

**Solution:**
1. Create `tsconfig.build.json` in the service directory:
```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

2. Relax TypeScript strictness in `tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": false,
    "strictPropertyInitialization": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "exactOptionalPropertyTypes": false,
    "noImplicitOverride": false,
    "noPropertyAccessFromIndexSignature": false
  }
}
```

3. Alternative: Create `tsconfig.direct.json` as a working configuration:
```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "commonjs",
    "strict": false,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### Problem: NestJS not creating dist directory
**Solution:**
```bash
# Ensure nest-cli.json exists
# Run build explicitly
npm run build

# Or use direct TypeScript compilation
npx tsc -p tsconfig.build.json
```

---

## Kafka Configuration Issues

### Problem: "The group coordinator is not available"
**Error Message:**
```
ERROR [Connection] Response GroupCoordinator(key: 10, version: 2) 
{"error":"The group coordinator is not available"}
```

**Root Cause:** Kafka topics not created

**Solution:**
1. Create topics manually:
```bash
# Create auth-events topic
docker exec -it kafka kafka-topics.sh \
  --create --topic auth-events \
  --bootstrap-server localhost:9092 \
  --partitions 1 --replication-factor 1

# Create user-events topic
docker exec -it kafka kafka-topics.sh \
  --create --topic user-events \
  --bootstrap-server localhost:9092 \
  --partitions 1 --replication-factor 1

# List topics to verify
docker exec -it kafka kafka-topics.sh \
  --list --bootstrap-server localhost:9092
```

2. Or enable auto-creation in Kafka configuration (docker-compose.yml):
```yaml
environment:
  KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true'
```

### Problem: Kafka health check error - "producer.admin is not a function"
**Root Cause:** Incorrect implementation trying to access non-existent methods

**Solution:**
1. Add `isConnected()` method to KafkaService:
```typescript
// services/auth/src/shared/kafka/kafka.service.ts
isConnected(): boolean {
  try {
    return !!(this.client && this.client['producer'] && this.client['consumer']);
  } catch {
    return false;
  }
}
```

2. Update KafkaHealthIndicator:
```typescript
// services/auth/src/modules/health/kafka.health.ts
async isHealthy(key: string): Promise<HealthIndicatorResult> {
  try {
    if (this.kafkaService.isConnected()) {
      return this.getStatus(key, true);
    } else {
      throw new Error('Kafka client is not connected');
    }
  } catch (error) {
    throw new HealthCheckError(
      'Kafka check failed',
      this.getStatus(key, false, { message: error.message }),
    );
  }
}
```

---

## Port Conflicts

### Problem: EADDRINUSE: address already in use :::3001
**Solution:**
```bash
# Safe method using npx kill-port (recommended for Windows)
npx kill-port 3001

# Alternative: Find and kill process
netstat -ano | grep 3001
# Note the PID, then:
# On Windows (use double slashes in Git Bash):
taskkill //F //PID <PID>

# Change port in .env file if needed:
APP_PORT=3002
```

**Warning:** Avoid using `taskkill /F` with single slashes as it may terminate Claude Code itself on Windows.

---

## MCP Server Configuration

### Problem: Postgres MCP server not connecting
**Root Cause:** Missing database connection parameters in `.mcp.json`

**Solution:**
Add environment configuration to `.mcp.json`:
```json
"postgres": {
  "type": "stdio",
  "command": "cmd",
  "args": [
    "/c",
    "npx",
    "-y",
    "@modelcontextprotocol/server-postgres"
  ],
  "env": {
    "PGHOST": "localhost",
    "PGPORT": "5432",
    "PGUSER": "vextrus",
    "PGDATABASE": "vextrus_erp",
    "PGPASSWORD": "vextrus_dev_2024"
  }
}
```

---

## Health Check Implementation

### Problem: @nestjs/terminus not found
**Solution:**
```bash
cd services/auth
npm install @nestjs/terminus
```

### Problem: Health endpoints not configured
**Solution:**
Create health module with proper indicators:
```typescript
// health.module.ts
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis.health';
import { KafkaHealthIndicator } from './kafka.health';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, KafkaHealthIndicator],
})
export class HealthModule {}
```

---

## Docker & Service Issues

### Problem: Services not starting in correct order
**Solution:**
Start infrastructure services first:
```bash
# Start database and cache first
docker-compose up -d postgres redis

# Wait for them to be ready, then start Kafka
docker-compose up -d kafka

# Finally start application services
cd services/auth && npm run start:dev
```

### Problem: Docker containers using too much memory
**Solution:**
Add resource limits in docker-compose.yml:
```yaml
services:
  kafka:
    mem_limit: 512m
  postgres:
    mem_limit: 256m
  redis:
    mem_limit: 128m
```

---

## Quick Reference Commands

### Service Management
```bash
# Start all infrastructure
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart [service-name]

# Clean restart
docker-compose down && docker-compose up -d
```

### Debugging
```bash
# Check health endpoints
curl http://localhost:3001/api/v1/health | python -m json.tool

# Test specific health check
curl http://localhost:3001/api/v1/health/ready
curl http://localhost:3001/api/v1/health/live

# Check Kafka topics
docker exec -it kafka kafka-topics.sh --list --bootstrap-server localhost:9092

# Check PostgreSQL connection
docker exec -it postgres psql -U vextrus -d vextrus_erp -c "SELECT 1"

# Check Redis connection
docker exec -it redis redis-cli ping
```

---

## Contributing to This Guide

When you encounter and solve a new issue:
1. Document the error message exactly as it appears
2. Identify the root cause
3. Provide the complete solution
4. Add any relevant commands or code snippets
5. Include warnings about potential side effects

Last Updated: January 2025