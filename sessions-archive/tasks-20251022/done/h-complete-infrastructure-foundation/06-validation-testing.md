---
task: h-complete-infrastructure-foundation/06-validation-testing
status: pending
created: 2025-09-20
---

# Subtask 6: Validation & Testing

## Objective
Perform comprehensive validation of the entire infrastructure stack to ensure production readiness, including health checks, integration testing, performance baselines, and security validation.

## Success Criteria
- [ ] All health endpoints returning 200 OK
- [ ] Inter-service communication validated
- [ ] Authentication flow working end-to-end
- [ ] Performance metrics within targets
- [ ] No critical errors in any service logs
- [ ] All monitoring dashboards showing data
- [ ] API documentation accessible

## Tasks

### 1. Health Check Validation
- [ ] Verify all /health endpoints
- [ ] Check /ready endpoints for dependencies
- [ ] Validate /live endpoints
- [ ] Test health check retries
- [ ] Verify graceful degradation

### 2. Integration Testing
- [ ] Test auth token generation and validation
- [ ] Verify service-to-service authentication
- [ ] Test GraphQL federation queries
- [ ] Validate message queue communication
- [ ] Check cache invalidation across services

### 3. Performance Baseline Testing
- [ ] Measure API response times
- [ ] Test concurrent user load
- [ ] Validate database query performance
- [ ] Check memory usage under load
- [ ] Establish performance KPIs

### 4. Security Validation
- [ ] Test JWT token validation
- [ ] Verify CORS configuration
- [ ] Check rate limiting
- [ ] Validate input sanitization
- [ ] Test RBAC permissions

### 5. End-to-End User Flows
- [ ] User registration and login
- [ ] Password reset flow
- [ ] Create and update master data
- [ ] Execute workflow process
- [ ] Generate reports

## Test Scripts

### Health Check Script
```bash
#!/bin/bash
# health-check-all.sh

SERVICES=(
  "auth:3001"
  "master-data:3002"
  "configuration:3003"
  "rules-engine:3004"
  "workflow:3005"
  "notification:3006"
  "audit:3007"
  "file-storage:3008"
  "reporting:3009"
  "api-gateway:3000"
  "graphql-gateway:4000"
)

echo "=== Service Health Check ==="
for service in "${SERVICES[@]}"; do
  IFS=':' read -r name port <<< "$service"
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health)
  if [ "$response" == "200" ]; then
    echo "✅ $name (port $port): HEALTHY"
  else
    echo "❌ $name (port $port): UNHEALTHY (HTTP $response)"
  fi
done
```

### Integration Test Example
```typescript
// test-integration/auth-flow.spec.ts
import axios from 'axios';

describe('Authentication Flow', () => {
  const authUrl = 'http://localhost:3001';
  const gatewayUrl = 'http://localhost:3000';

  let accessToken: string;
  let refreshToken: string;

  test('should login successfully', async () => {
    const response = await axios.post(`${authUrl}/auth/login`, {
      email: 'admin@vextrus.com',
      password: 'admin123'
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('accessToken');
    expect(response.data).toHaveProperty('refreshToken');

    accessToken = response.data.accessToken;
    refreshToken = response.data.refreshToken;
  });

  test('should access protected endpoint with token', async () => {
    const response = await axios.get(`${gatewayUrl}/api/users/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('email', 'admin@vextrus.com');
  });

  test('should refresh token successfully', async () => {
    const response = await axios.post(`${authUrl}/auth/refresh`, {
      refreshToken
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('accessToken');
  });
});
```

### Performance Test Script
```javascript
// k6-performance-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
  },
};

export default function () {
  // Login
  const loginRes = http.post('http://localhost:3001/auth/login',
    JSON.stringify({
      email: 'test@vextrus.com',
      password: 'test123'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => r.json('accessToken') !== undefined,
  });

  const token = loginRes.json('accessToken');

  // Make authenticated request
  const profileRes = http.get('http://localhost:3000/api/users/profile', {
    headers: { Authorization: `Bearer ${token}` }
  });

  check(profileRes, {
    'profile retrieved': (r) => r.status === 200,
  });

  sleep(1);
}
```

### Monitoring Validation
```bash
#!/bin/bash
# validate-monitoring.sh

echo "=== Prometheus Targets ==="
curl -s http://localhost:9090/api/v1/targets | \
  jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

echo -e "\n=== Grafana Dashboards ==="
curl -s http://admin:admin@localhost:3000/api/dashboards | \
  jq '.[] | {title: .title, uid: .uid}'

echo -e "\n=== Metrics Sample ==="
curl -s http://localhost:3001/metrics | grep -E "^[a-z]" | head -10
```

### Security Test Checklist
```bash
#!/bin/bash
# security-validation.sh

echo "=== Security Validation ==="

# Test CORS
echo "Testing CORS..."
curl -I -X OPTIONS http://localhost:3000/api/auth/login \
  -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: POST"

# Test rate limiting
echo "Testing rate limiting..."
for i in {1..100}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
  if [ "$response" == "429" ]; then
    echo "Rate limiting active at request $i"
    break
  fi
done

# Test without auth token
echo "Testing unauthorized access..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/users/profile)
if [ "$response" == "401" ]; then
  echo "✅ Unauthorized access blocked"
else
  echo "❌ Unauthorized access not blocked (HTTP $response)"
fi
```

## Validation Report Template

```markdown
# Infrastructure Validation Report
Date: [DATE]
Version: [VERSION]

## Health Check Results
- [ ] All services healthy
- [ ] Database connections established
- [ ] Redis connections active
- [ ] Kafka brokers reachable
- [ ] MinIO storage accessible

## Performance Metrics
- API Response Time (p95): [X]ms (Target: <500ms)
- Concurrent Users Supported: [X] (Target: >100)
- Memory Usage: [X]GB (Target: <8GB)
- CPU Usage: [X]% (Target: <60%)
- Database Query Time (avg): [X]ms (Target: <100ms)

## Security Validation
- [ ] Authentication working
- [ ] Authorization enforced
- [ ] Rate limiting active
- [ ] CORS configured
- [ ] Input validation working

## Monitoring Status
- [ ] All Prometheus targets UP
- [ ] Grafana dashboards populated
- [ ] Alerts configured
- [ ] Logs aggregated
- [ ] Traces collected

## Issues Found
1. [Issue description and resolution]
2. [Issue description and resolution]

## Sign-off
- [ ] Infrastructure team approved
- [ ] Security review completed
- [ ] Performance acceptable
- [ ] Ready for application deployment
```

## Final Validation Commands
```bash
# Run complete validation suite
./scripts/validate-all.sh

# Check Docker container status
docker-compose ps
docker stats --no-stream

# Check service logs for errors
docker-compose logs --tail=50 | grep -i error

# Test end-to-end flow
npm run test:e2e

# Run performance test
k6 run k6-performance-test.js

# Generate validation report
./scripts/generate-validation-report.sh > validation-report-$(date +%Y%m%d).md
```