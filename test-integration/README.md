# Integration Test Suite

## Overview

Comprehensive integration tests for Vextrus ERP GraphQL Federation architecture.

## Test Coverage

### Federation Integration Tests
- **Schema Introspection**: Verifies federated schema composition
- **PageInfo Shareable Type**: Tests cross-service pagination type
- **Individual Service Queries**: Tests each microservice's GraphQL endpoint
- **Cross-Service Queries**: Tests federated queries spanning multiple services
- **Performance**: Response time and concurrent request handling
- **Error Handling**: Malformed queries, missing fields, invalid requests

### Service Coverage
- ✅ Auth Service (3001)
- ✅ Master Data Service (3002)
- ✅ Configuration Service (3004)
- ✅ Audit Service (3009)
- ✅ Notification Service (3003)
- ✅ Import-Export Service (3007)
- ✅ All 13 GraphQL services

## Prerequisites

### Running Services
Ensure all services are running:
```bash
docker-compose ps
```

All GraphQL services should be in "Up" status:
- auth (3001)
- master-data (3002)
- notification (3003)
- configuration (3004)
- scheduler (3005)
- document-generator (3006)
- import-export (3007)
- file-storage (3008)
- audit (3009)
- workflow (3011)
- rules-engine (3012)
- finance (3014)
- organization (3016)
- api-gateway (4000)

### API Gateway Health
Check federation gateway:
```bash
curl http://localhost:4000/health
```

## Installation

```bash
cd test-integration
pnpm install
```

## Running Tests

### Run All Tests
```bash
pnpm test
```

### Run Federation Tests Only
```bash
pnpm test:federation
```

### Run with Coverage
```bash
pnpm test:coverage
```

### Watch Mode
```bash
pnpm test:watch
```

## Test Structure

### federation-integration.test.ts
Main federation test suite covering:
- Schema introspection and type verification
- PageInfo shareable type across services
- Individual service type queries
- Connection types (AuditLogConnection, ConfigurationConnection, etc.)
- Cross-service federated queries
- Performance benchmarks
- Error handling scenarios
- Direct service access verification

## Expected Results

### Passing Tests
- ✅ Schema introspection returns 200+ types
- ✅ PageInfo type has 4 fields (hasNextPage, hasPreviousPage, startCursor, endCursor)
- ✅ All services respond to direct queries
- ✅ Connection types use shared PageInfo
- ✅ Federated queries execute successfully
- ✅ Response times < 1 second
- ✅ Concurrent requests handled correctly
- ✅ Malformed queries return 400 errors

### Common Failures
- ❌ Service not running: Ensure `docker-compose up -d <service>`
- ❌ Port conflicts: Check no other apps using ports 3001-4000
- ❌ Network issues: Verify Docker network `vextrus-network` exists
- ❌ Schema composition errors: Check API Gateway logs

## Debugging

### Check Service Logs
```bash
docker-compose logs <service-name> --tail 50
```

### Check API Gateway Federation
```bash
docker-compose logs api-gateway --tail 100 | grep -E "(subgraph|composition)"
```

### Test Individual Service
```bash
curl -X POST http://localhost:<port>/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

### Test Apollo Sandbox
Open in browser:
- http://localhost:4000/graphql (Gateway)
- http://localhost:3001/graphql (Auth)
- http://localhost:3002/graphql (Master Data)
- http://localhost:3009/graphql (Audit)

## Performance Benchmarks

### Target Metrics
- **Query Response Time**: < 1000ms
- **Concurrent Requests**: 10 simultaneous requests without errors
- **Schema Introspection**: < 500ms

### Monitoring
Use SignOz dashboard for detailed metrics:
```
http://localhost:3301
```

## Test Data

### Mock Data
Currently tests use schema introspection only (no mutations or data creation).

### Future Enhancements
- Add authentication token tests
- Add mutation tests
- Add subscription tests
- Add end-to-end user workflows
- Add performance stress tests

## Authentication Tests

Authentication token forwarding tests coming in `auth-integration.test.ts`:
- Token generation via auth service
- Token forwarding from gateway to subgraphs
- Protected resolver access
- Token expiration handling

## CI/CD Integration

### GitHub Actions
Add to `.github/workflows/test.yml`:
```yaml
- name: Run Integration Tests
  run: |
    cd test-integration
    pnpm install
    pnpm test
```

### Prerequisites for CI
- Docker Compose running all services
- Services healthy before test execution
- Network accessible from test runner

## Troubleshooting

### Connection Refused
- Check service is running: `docker-compose ps`
- Check port is correct: Review docker-compose.yml
- Check network: `docker network ls | grep vextrus`

### GraphQL Errors
- Check schema is loaded: Query `{ __schema { types { name } } }`
- Check federation: `docker-compose logs api-gateway`
- Check service health: `curl http://localhost:<port>/health`

### Timeout Errors
- Increase test timeout in package.json `jest.testTimeout`
- Check service performance: `docker stats`
- Check database connections: `docker-compose logs postgres`

## Contributing

### Adding New Tests
1. Create test file: `*.test.ts`
2. Follow naming convention: `<feature>-integration.test.ts`
3. Use axios for HTTP requests
4. Add describe blocks for test organization
5. Include error handling tests

### Best Practices
- Test both success and failure scenarios
- Use descriptive test names
- Clean up test data after mutations
- Use proper assertions (expect statements)
- Document expected behavior in comments

## Related Documentation

- [Apollo Sandbox Migration Complete](../APOLLO_SANDBOX_MIGRATION_COMPLETE.md)
- [GraphQL Federation Guide](../docs/guides/graphql-federation.md)
- [Service Architecture](../docs/architecture.md)

## License

Private - Vextrus ERP Internal Use Only
