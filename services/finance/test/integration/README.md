# Finance Service Integration Tests

## Overview

Comprehensive integration test suite for the Finance service covering:
- GraphQL Federation
- Authentication & Authorization
- Master Data Integration
- WebSocket Real-Time Updates
- Notification Service Integration
- Health Checks
- Error Handling & Resilience
- Bangladesh ERP Compliance
- Performance & Load Testing

## Test Files

### `invoice-cqrs.integration.spec.ts`
**Purpose**: CQRS flow validation with event sourcing

**Coverage**:
- Command → Event → Projection → Query flow
- Multi-tenancy isolation
- Event replay consistency
- Read/Write model synchronization
- Financial summary projections

**Test Count**: 12 tests
**Dependencies**: EventStore DB, PostgreSQL, Kafka

---

### `final-integration.spec.ts`
**Purpose**: End-to-end service validation

**Coverage**:
- GraphQL Federation (5 tests)
- Authentication & Authorization (7 tests)
- Master Data Integration (4 tests)
- Notification Service Integration (4 tests)
- WebSocket Real-Time Updates (7 tests)
- Health Checks (6 tests)
- Error Handling (7 tests)
- Bangladesh Compliance (7 tests)
- Performance & Load (4 tests)

**Test Count**: 47 tests
**Dependencies**: All external services + Socket.IO

---

## Prerequisites

### Required Services
```bash
# PostgreSQL (port 5432)
docker run -d --name postgres \
  -e POSTGRES_USER=vextrus \
  -e POSTGRES_PASSWORD=vextrus_dev_2024 \
  -e POSTGRES_DB=vextrus_finance \
  -p 5432:5432 \
  postgres:15

# EventStore DB (port 2113)
docker run -d --name eventstore \
  -e EVENTSTORE_INSECURE=true \
  -p 2113:2113 \
  -p 1113:1113 \
  eventstore/eventstore:latest

# Kafka (port 9092)
docker run -d --name kafka \
  -e KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181 \
  -p 9092:9092 \
  confluentinc/cp-kafka:latest
```

### Environment Variables
Create `.env.test` file:
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=vextrus
DATABASE_PASSWORD=vextrus_dev_2024
DATABASE_NAME=vextrus_finance_test

# EventStore
EVENTSTORE_CONNECTION_STRING=esdb://localhost:2113?tls=false

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=finance-service-test

# JWT
JWT_SECRET=test-secret-key-for-integration-tests
JWT_EXPIRES_IN=1h

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
MASTER_DATA_SERVICE_URL=http://localhost:3002
```

---

## Running Tests

### Full Integration Test Suite
```bash
cd services/finance
pnpm test test/integration/
```

### Individual Test Files
```bash
# CQRS Integration Tests
pnpm test test/integration/invoice-cqrs.integration.spec.ts

# Final Integration Tests
pnpm test test/integration/final-integration.spec.ts
```

### Specific Test Suites
```bash
# GraphQL Federation tests only
pnpm test test/integration/final-integration.spec.ts -t "GraphQL Federation"

# Authentication tests only
pnpm test test/integration/final-integration.spec.ts -t "Authentication"

# Health Check tests only
pnpm test test/integration/final-integration.spec.ts -t "Health Checks"

# Bangladesh Compliance tests only
pnpm test test/integration/final-integration.spec.ts -t "Bangladesh"
```

### With Coverage Report
```bash
pnpm test:cov test/integration/
```

### Watch Mode (for development)
```bash
pnpm test:watch test/integration/final-integration.spec.ts
```

### Verbose Output
```bash
pnpm test test/integration/ --verbose
```

---

## Test Configuration

### Jest Configuration
Tests use the base Jest configuration from `package.json`:

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

### TypeScript Configuration
Tests use strict mode with path aliases:

```json
{
  "strict": true,
  "strictNullChecks": true,
  "noImplicitAny": true,
  "paths": {
    "@domain/*": ["src/domain/*"],
    "@application/*": ["src/application/*"],
    "@infrastructure/*": ["src/infrastructure/*"],
    "@presentation/*": ["src/presentation/*"]
  }
}
```

---

## Test Patterns

### GraphQL Request Pattern
```typescript
const response = await request(app.getHttpServer())
  .post('/graphql')
  .set('Authorization', `Bearer ${jwtToken}`)
  .send({
    query: `
      query GetInvoices {
        invoices(limit: 10) {
          id
          invoiceNumber
        }
      }
    `
  })
  .expect(200);

expect(response.body.data).toBeDefined();
```

### WebSocket Connection Pattern
```typescript
const socket = io('http://localhost:3006', {
  auth: { token: jwtToken },
  transports: ['websocket'],
  reconnection: false,
});

socket.on('connect', () => {
  socket.emit('subscribe', { tenantId: 'tenant-123' });
});

socket.on('invoice:statusUpdated', (data) => {
  expect(data.invoiceId).toBeDefined();
  expect(data.status).toBe('APPROVED');
  socket.disconnect();
  done();
});
```

### Health Check Pattern
```typescript
const response = await request(app.getHttpServer())
  .get('/health')
  .expect(200);

expect(response.body.status).toBe('ok');
expect(response.body.info.database.status).toBe('up');
expect(response.body.info.eventstore.status).toBe('up');
```

### JWT Token Generation
```typescript
import * as jwt from 'jsonwebtoken';

const token = jwt.sign(
  {
    sub: 'user-123',
    userId: 'user-123',
    tenantId: 'tenant-abc',
    organizationId: 'org-xyz',
    roles: ['finance_manager'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  },
  JWT_SECRET
);
```

---

## Debugging Tests

### Enable Debug Logging
```bash
DEBUG=* pnpm test test/integration/final-integration.spec.ts
```

### Run Single Test
```bash
pnpm test test/integration/final-integration.spec.ts -t "should reject requests without JWT token"
```

### Increase Test Timeout
```typescript
it('should handle slow operation', async () => {
  // Test implementation
}, 30000); // 30 second timeout
```

### Inspect Test Output
```bash
pnpm test test/integration/ --no-coverage --verbose
```

---

## Common Issues & Solutions

### Issue: EventStore Connection Failed
**Solution**: Ensure EventStore is running and accessible
```bash
docker ps | grep eventstore
curl http://localhost:2113/health/live
```

### Issue: Database Connection Timeout
**Solution**: Check PostgreSQL status
```bash
docker ps | grep postgres
psql -h localhost -U vextrus -d vextrus_finance_test -c "SELECT 1"
```

### Issue: Kafka Not Available
**Solution**: Verify Kafka broker
```bash
docker ps | grep kafka
# Tests should still pass (Kafka failures are non-blocking)
```

### Issue: WebSocket Connection Refused
**Solution**: Ensure Finance service is running on port 3006
```bash
curl http://localhost:3006/health/live
```

### Issue: JWT Token Invalid
**Solution**: Verify JWT_SECRET in .env.test matches service configuration
```bash
echo $JWT_SECRET
# Should match JWT_SECRET in service .env file
```

---

## CI/CD Integration

### GitHub Actions
```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: vextrus
          POSTGRES_PASSWORD: vextrus_dev_2024
          POSTGRES_DB: vextrus_finance_test
        ports:
          - 5432:5432

      eventstore:
        image: eventstore/eventstore:latest
        env:
          EVENTSTORE_INSECURE: true
        ports:
          - 2113:2113

      kafka:
        image: confluentinc/cp-kafka:latest
        ports:
          - 9092:9092

    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm test test/integration/
```

---

## Test Maintenance

### Adding New Tests
1. Create test file in `test/integration/`
2. Follow naming convention: `*.integration.spec.ts`
3. Import required modules and utilities
4. Add `beforeAll` setup and `afterAll` cleanup
5. Organize tests by feature/domain
6. Use descriptive test names

### Updating Existing Tests
1. Run tests before making changes
2. Update test assertions to match new behavior
3. Add new test cases for new features
4. Remove obsolete tests
5. Update documentation

### Test Data Management
- Use factories for test data generation
- Clean up test data in `afterEach`/`afterAll` hooks
- Use unique identifiers to avoid conflicts
- Mock external services when appropriate

---

## Performance Benchmarks

### Expected Performance
- **Simple GraphQL Query**: <100ms
- **Complex Federated Query**: <500ms
- **WebSocket Connection**: <200ms
- **Health Check**: <50ms
- **Database Query**: <100ms

### Load Testing
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery quick --count 10 --num 50 http://localhost:3006/health
```

---

## Coverage Reports

### Generate Coverage
```bash
pnpm test:cov test/integration/
```

### View Coverage Report
```bash
open coverage/lcov-report/index.html
```

### Coverage Targets
- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

---

## Additional Resources

- [Finance Service CLAUDE.md](../../CLAUDE.md)
- [FINAL_INTEGRATION_TEST_REPORT.md](../../FINAL_INTEGRATION_TEST_REPORT.md)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)

---

**Last Updated**: 2025-10-16
**Maintained By**: Finance Service Team
