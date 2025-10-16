---
task: h-implement-production-phased-rollout-week1
parent: h-implement-production-phased-rollout
branch: feature/production-phased-rollout
status: in-progress
started: 2025-10-16
created: 2025-10-16
week: 1
estimated_hours: 9
---

# Week 1: Critical Security Fixes + Limited Rollout

## Goal
Fix 4 critical security vulnerabilities and deploy Finance service to 10% of users (5-10 concurrent) with comprehensive monitoring.

## Success Criteria
- [ ] Fix eval() code injection vulnerability (automated-journal-entries.service.ts)
- [ ] Enable CSRF protection in GraphQL (federation.config.ts)
- [ ] Fix CORS wildcard configuration (main.ts)
- [ ] Remove hardcoded database credentials (app.module.ts)
- [ ] Security scan shows 0 critical vulnerabilities
- [ ] Deploy to 10% users successfully
- [ ] Monitor for 48 hours: error rate <0.5%, P95 <500ms
- [ ] Zero production incidents

## Tasks

### 1. Fix Code Injection Vulnerability (4 hours)
**File**: `services/finance/src/application/services/automated-journal-entries.service.ts:353`

**Current Issue**:
```typescript
return eval(result);  // CRITICAL: Arbitrary code execution!
```

**Solution**:
```typescript
import { create, all } from 'mathjs';

const math = create(all, {
  number: 'number',  // Use number instead of BigNumber
});

private async evaluateFormula(formula: string, date: Date): Promise<number> {
  // Validate formula first
  const allowedPattern = /^[0-9+\-*/().MONTHYEARDAYSN_ ]+$/;
  if (!allowedPattern.test(formula)) {
    throw new Error('Invalid formula: contains disallowed characters');
  }

  const scope = {
    MONTH: date.getMonth() + 1,
    YEAR: date.getFullYear(),
    DAY: date.getDate(),
    DAYS_IN_MONTH: moment(date).daysInMonth(),
  };

  try {
    return math.evaluate(formula, scope);
  } catch (error) {
    this.logger.error(`Failed to evaluate formula: ${formula}`, error);
    return 0;
  }
}
```

**Testing**:
```bash
# Install mathjs
cd services/finance && pnpm add mathjs

# Run tests
pnpm test automated-journal-entries.service.spec.ts

# Security validation
/security-scan
```

---

### 2. Enable CSRF Protection (2 hours)
**File**: `services/finance/src/infrastructure/graphql/federation.config.ts:27`

**Current Issue**:
```typescript
csrfPrevention: false, // Required for Apollo Sandbox
```

**Solution**:
```typescript
createGqlOptions(): ApolloFederationDriverConfig {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    driver: ApolloFederationDriver,
    // Enable CSRF in production, disable in development
    csrfPrevention: isProduction ? {
      requestHeaders: ['x-apollo-operation-name', 'apollo-require-preflight']
    } : false,
    introspection: !isProduction, // Disable introspection in production
    // ... rest of config
  };
}
```

**Testing**:
```bash
# Test in development (should allow)
NODE_ENV=development pnpm start:dev

# Test in production mode (should enforce CSRF)
NODE_ENV=production pnpm build && pnpm start:prod

# Try mutation without CSRF headers (should fail in production)
curl -X POST http://localhost:3006/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { createInvoice(...) }"}'
```

---

### 3. Fix CORS Configuration (2 hours)
**File**: `services/finance/src/main.ts:38`

**Current Issue**:
```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',  // Falls back to wildcard!
  credentials: true,  // DANGEROUS with wildcard
});
```

**Solution**:
```typescript
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [];

// FAIL FAST in production if CORS not configured
if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  throw new Error('CORS_ORIGIN must be configured in production');
}

app.enableCors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  maxAge: 86400, // 24 hours
});
```

**Configuration**:
```bash
# .env.production
CORS_ORIGIN=https://vextrus.com,https://app.vextrus.com
```

**Testing**:
```bash
# Test allowed origin
curl -H "Origin: https://vextrus.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:3006/graphql

# Test disallowed origin (should fail)
curl -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:3006/graphql
```

---

### 4. Remove Hardcoded Credentials (1 hour)
**File**: `services/finance/src/app.module.ts:40`

**Current Issue**:
```typescript
TypeOrmModule.forRoot({
  password: process.env.DATABASE_PASSWORD || 'vextrus_dev_2024',  // CRITICAL!
})
```

**Solution**:
```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,  // NO FALLBACK
  database: process.env.DATABASE_NAME,
  autoLoadEntities: true,
  synchronize: false, // NEVER true in production
  logging: process.env.NODE_ENV === 'development',
  extra: {
    connectionTimeoutMillis: 5000,
    max: 20,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: true
    } : false
  }
})
```

**Add Startup Validation in main.ts**:
```typescript
async function bootstrap() {
  // Validate required environment variables
  const requiredEnvVars = [
    'DATABASE_HOST',
    'DATABASE_USERNAME',
    'DATABASE_PASSWORD',
    'DATABASE_NAME',
    'JWT_SECRET',
    'CORS_ORIGIN',
  ];

  if (process.env.NODE_ENV === 'production') {
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }
  }

  const app = await NestFactory.create(AppModule);
  // ... rest of bootstrap
}
```

**Testing**:
```bash
# Test with missing env vars (should fail)
NODE_ENV=production pnpm start:prod

# Test with all env vars (should succeed)
NODE_ENV=production \
DATABASE_PASSWORD=secure_password \
JWT_SECRET=secure_secret \
CORS_ORIGIN=https://vextrus.com \
pnpm start:prod
```

---

## Deployment

### Step 1: Build and Test
```bash
cd services/finance

# Run security scan
/security-scan

# Verify 0 critical vulnerabilities
# Verify all fixes applied

# Run tests
pnpm test

# Build
pnpm build
```

### Step 2: Deploy to Staging
```bash
# Deploy to staging environment
docker build -t vextrus/finance:week1-staging .
docker push vextrus/finance:week1-staging

# Update staging deployment
kubectl set image deployment/finance-service-staging \
  app=vextrus/finance:week1-staging

# Smoke test
curl https://staging-api.vextrus.com/health
```

### Step 3: Production Deployment (10% traffic)
```bash
# Tag for production
docker tag vextrus/finance:week1-staging vextrus/finance:week1-prod
docker push vextrus/finance:week1-prod

# Deploy with 10% traffic split
kubectl apply -f k8s/finance-service-week1.yaml

# Verify deployment
kubectl get pods -l app=finance-service
kubectl logs -f deployment/finance-service
```

### Step 4: Monitor
```bash
# Watch key metrics for 48 hours:
# - Error rate: <0.5%
# - P95 latency: <500ms
# - Security alerts: 0
# - User complaints: 0
```

## Monitoring Checklist

### Real-Time Monitoring (First 24 hours)
- [ ] Grafana dashboard shows error rate <0.5%
- [ ] P95 latency <500ms
- [ ] No security alerts triggered
- [ ] All health checks green
- [ ] EventStore connection stable
- [ ] PostgreSQL connection stable
- [ ] Kafka messages flowing

### 48-Hour Validation
- [ ] Zero critical errors logged
- [ ] No rollback required
- [ ] User feedback positive
- [ ] Performance metrics stable
- [ ] Security metrics normal

## Rollback Plan

**If error rate >1% or critical issues**:
```bash
# Immediate rollback (5 minutes)
kubectl set image deployment/finance-service \
  app=vextrus/finance:stable

# Verify rollback
kubectl rollout status deployment/finance-service
curl https://api.vextrus.com/health
```

## Quality Gates

- [x] Security scan - 0 critical vulnerabilities (Score: 85/100)
- [x] All 4 security fixes verified
- [ ] 10% deployment successful (NEXT: Deploy to staging/production)
- [ ] 48-hour monitoring: error rate <0.5%
- [ ] Zero production incidents
- [ ] Ready for Week 2

---

## Work Log

**2025-10-16 - Security Fixes Completed**

**✅ Completed Tasks**:
1. **Fixed eval() Code Injection** (automated-journal-entries.service.ts)
   - Replaced eval() with mathjs library
   - Added input validation with regex pattern
   - Restricted scope to mathematical variables only
   - Added result validation (finite numbers only)
   - TypeScript type errors resolved

2. **Enabled CSRF Protection** (federation.config.ts)
   - Environment-based CSRF (enabled in production, disabled in dev)
   - Uses Apollo's recommended headers
   - Disabled introspection in production

3. **Fixed CORS Configuration** (main.ts)
   - Removed wildcard fallback
   - Strict origin validation with callback function
   - Fail-fast if CORS_ORIGIN not set in production
   - Development fallback for localhost only
   - TypeScript type errors resolved

4. **Removed Hardcoded Credentials** (app.module.ts)
   - Removed password fallback ('vextrus_dev_2024')
   - All credentials from environment variables
   - Added production environment validation in main.ts
   - Configured SSL for production database connections
   - Disabled auto-sync (use migrations instead)

**🔒 Security Audit Results**:
- **Security Score**: 85/100
- **Critical Issues**: 0 (All 4 fixed ✅)
- **High Issues**: 0
- **Medium Issues**: 2 (RBAC missing, input validation improvements)
- **Low Issues**: 3 (secrets management, OCR security, introspection docs)
- **Report**: services/finance/SECURITY_AUDIT_REPORT.md

**✅ Build Status**: Clean build, no TypeScript errors

**📋 Next Steps**:
1. Deploy to staging environment
2. Smoke test all endpoints
3. Deploy to production with 10% traffic split
4. Monitor for 48 hours (error rate, latency, security)
5. Proceed to Week 2 if stable

---

**Week 1 Status**: Security fixes complete, awaiting deployment and 48-hour monitoring.
