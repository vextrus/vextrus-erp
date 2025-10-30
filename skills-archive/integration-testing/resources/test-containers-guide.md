# Test Containers Guide

**Purpose**: Use Docker containers for integration tests with production-parity databases and services.

---

## Installation

```bash
npm install --save-dev @testcontainers/postgresql @testcontainers/kafka @testcontainers/redis
```

---

## PostgreSQL Container

### Basic Setup

```typescript
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

describe('Invoice Integration Tests', () => {
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('finance_test')
      .withUsername('test_user')
      .withPassword('test_pass')
      .withExposedPorts(5432)
      .start();

    // Configure TypeORM
    process.env.DB_HOST = container.getHost();
    process.env.DB_PORT = container.getPort().toString();
    process.env.DB_USER = container.getUsername();
    process.env.DB_PASS = container.getPassword();
    process.env.DB_NAME = container.getDatabase();
  }, 60000); // 60s timeout for container startup

  afterAll(async () => {
    await container.stop();
  });

  it('should connect to PostgreSQL container', async () => {
    // TypeORM will use environment variables
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT),
          username: process.env.DB_USER,
          password: process.env.DB_PASS,
          database: process.env.DB_NAME,
          synchronize: true,
          entities: [Invoice, Payment],
        }),
      ],
    }).compile();

    const dataSource = module.get(DataSource);
    expect(dataSource.isInitialized).toBe(true);
  });
});
```

### With Initialization Scripts

```typescript
container = await new PostgreSqlContainer('postgres:16-alpine')
  .withDatabase('finance_test')
  .withCopyFilesToContainer([
    {
      source: './test/fixtures/init.sql',
      target: '/docker-entrypoint-initdb.d/init.sql',
    },
  ])
  .start();
```

**init.sql example:**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create test schema
CREATE SCHEMA IF NOT EXISTS tenant_a;
CREATE SCHEMA IF NOT EXISTS tenant_b;
```

---

## EventStoreDB Container

```typescript
import { GenericContainer, StartedTestContainer } from 'testcontainers';

let eventStoreContainer: StartedTestContainer;

beforeAll(async () => {
  eventStoreContainer = await new GenericContainer('eventstore/eventstore:23.10.0-alpha-arm64v8')
    .withExposedPorts(2113, 1113)
    .withEnvironment({
      EVENTSTORE_CLUSTER_SIZE: '1',
      EVENTSTORE_RUN_PROJECTIONS: 'All',
      EVENTSTORE_START_STANDARD_PROJECTIONS: 'true',
      EVENTSTORE_INSECURE: 'true', // For testing only
    })
    .withWaitStrategy(Wait.forLogMessage('SPARTA!'))
    .start();

  const connectionString = `esdb://${eventStoreContainer.getHost()}:${eventStoreContainer.getMappedPort(2113)}?tls=false`;

  process.env.EVENTSTORE_CONNECTION_STRING = connectionString;
}, 120000); // EventStore needs longer startup
```

---

## Kafka Container

```typescript
import { KafkaContainer, StartedKafkaContainer } from '@testcontainers/kafka';

let kafkaContainer: StartedKafkaContainer;

beforeAll(async () => {
  kafkaContainer = await new KafkaContainer('confluentinc/cp-kafka:7.5.0')
    .withExposedPorts(9092, 9093)
    .start();

  process.env.KAFKA_BROKERS = kafkaContainer.getConnectionString();
}, 60000);

afterAll(async () => {
  await kafkaContainer.stop();
});
```

---

## Redis Container

```typescript
import { GenericContainer } from 'testcontainers';

let redisContainer: StartedTestContainer;

beforeAll(async () => {
  redisContainer = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .start();

  process.env.REDIS_HOST = redisContainer.getHost();
  process.env.REDIS_PORT = redisContainer.getMappedPort(6379).toString();
});
```

---

## Global Setup (Shared Containers)

**test-integration/src/setup.ts:**

```typescript
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer } from 'testcontainers';

export const globalSetup = async () => {
  console.log('Starting test containers...');

  // Start all containers in parallel
  const [postgresContainer, redisContainer, kafkaContainer] = await Promise.all([
    new PostgreSqlContainer('postgres:16-alpine').start(),
    new GenericContainer('redis:7-alpine').withExposedPorts(6379).start(),
    new KafkaContainer('confluentinc/cp-kafka:7.5.0').start(),
  ]);

  // Store connection info globally
  global.__POSTGRES__ = postgresContainer;
  global.__REDIS__ = redisContainer;
  global.__KAFKA__ = kafkaContainer;

  process.env.DB_HOST = postgresContainer.getHost();
  process.env.DB_PORT = postgresContainer.getPort().toString();
  // ... etc

  console.log('Test containers started successfully');
};

export const globalTeardown = async () => {
  console.log('Stopping test containers...');

  await Promise.all([
    global.__POSTGRES__?.stop(),
    global.__REDIS__?.stop(),
    global.__KAFKA__?.stop(),
  ]);

  console.log('Test containers stopped');
};
```

**jest.config.js:**

```javascript
module.exports = {
  globalSetup: '<rootDir>/test-integration/src/setup.ts',
  globalTeardown: '<rootDir>/test-integration/src/teardown.ts',
  testTimeout: 30000,
};
```

---

## Performance Optimization

### Reuse Containers Across Tests

```typescript
// Start once per test suite
let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer().start();
}, 60000);

// Clean data, not container
afterEach(async () => {
  const dataSource = getDataSource();
  await dataSource.query('TRUNCATE TABLE invoices CASCADE');
});

// Stop once after all tests
afterAll(async () => {
  await container.stop();
});
```

### Parallel Test Execution

```typescript
// Use worker ID for unique ports
const workerPort = 5432 + parseInt(process.env.JEST_WORKER_ID || '0');

container = await new PostgreSqlContainer()
  .withExposedPorts({ container: 5432, host: workerPort })
  .start();
```

---

## Troubleshooting

**Slow Startup?**
- Use Alpine images (smaller, faster): `postgres:16-alpine`
- Reuse containers across tests (clean data, not containers)
- Use global setup for shared containers

**Port Conflicts?**
- Let testcontainers assign random ports (default)
- Use `getMappedPort()` to get actual port

**Container Not Stopping?**
- Always call `await container.stop()` in `afterAll`
- Use `--runInBand` flag to avoid parallel issues

**Docker Not Running?**
- Ensure Docker daemon is running
- Check Docker permissions
- Use `TESTCONTAINERS_RYUK_DISABLED=true` if Ryuk fails

---

## Best Practices

1. **Minimize Container Usage**: Start containers only when needed
2. **Reuse Containers**: Clean data between tests, not containers
3. **Parallel Execution**: Use unique ports per worker
4. **Global Setup**: Share expensive containers across test suites
5. **Timeouts**: Increase timeout for container startup (60s+)
6. **Cleanup**: Always stop containers in `afterAll`
7. **Images**: Use Alpine variants for faster startup

---

## Vextrus ERP Usage

**Current State** (from codebase analysis):
- Single testcontainers setup in `test-integration/src/setup.ts`
- Containers: Kafka, Redis, PostgreSQL, MinIO
- Used for cross-service integration testing
- Most service tests use external databases (not testcontainers)

**Gap**: Testcontainers not widely adopted in individual services

**Recommendation**: Adopt testcontainers for new service integration tests
