import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { Kafka } from 'kafkajs';
import Redis from 'ioredis';
import { DataSource } from 'typeorm';

// Global test containers
let kafkaContainer: StartedTestContainer;
let redisContainer: StartedTestContainer;
let postgresContainer: StartedTestContainer;
let minioContainer: StartedTestContainer;

// Global clients
export let kafkaClient: Kafka;
export let redisClient: Redis;
export let dataSource: DataSource;

// Setup before all tests
beforeAll(async () => {
  console.log('Starting test containers...');

  // Start Kafka container
  kafkaContainer = await new GenericContainer('confluentinc/cp-kafka:7.5.0')
    .withExposedPorts(9092)
    .withEnvironment({
      KAFKA_BROKER_ID: '1',
      KAFKA_ZOOKEEPER_CONNECT: 'zookeeper:2181',
      KAFKA_ADVERTISED_LISTENERS: 'PLAINTEXT://localhost:9092',
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: '1',
    })
    .start();

  // Start Redis container
  redisContainer = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .start();

  // Start PostgreSQL container
  postgresContainer = await new GenericContainer('postgres:15-alpine')
    .withExposedPorts(5432)
    .withEnvironment({
      POSTGRES_DB: 'vextrus_test',
      POSTGRES_USER: 'vextrus',
      POSTGRES_PASSWORD: 'test_password',
    })
    .start();

  // Start MinIO container
  minioContainer = await new GenericContainer('minio/minio:latest')
    .withExposedPorts(9000, 9001)
    .withEnvironment({
      MINIO_ROOT_USER: 'test_admin',
      MINIO_ROOT_PASSWORD: 'test_password',
    })
    .withCommand(['server', '/data', '--console-address', ':9001'])
    .start();

  // Initialize Kafka client
  kafkaClient = new Kafka({
    clientId: 'test-client',
    brokers: [`localhost:${kafkaContainer.getMappedPort(9092)}`],
  });

  // Initialize Redis client
  redisClient = new Redis({
    host: 'localhost',
    port: redisContainer.getMappedPort(6379),
  });

  // Initialize PostgreSQL DataSource
  dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: postgresContainer.getMappedPort(5432),
    username: 'vextrus',
    password: 'test_password',
    database: 'vextrus_test',
    synchronize: true,
    logging: false,
  });

  await dataSource.initialize();
  console.log('Test containers started successfully');
});

// Cleanup after all tests
afterAll(async () => {
  console.log('Stopping test containers...');
  
  await kafkaClient?.admin()?.disconnect();
  await redisClient?.disconnect();
  await dataSource?.destroy();
  
  await kafkaContainer?.stop();
  await redisContainer?.stop();
  await postgresContainer?.stop();
  await minioContainer?.stop();
  
  console.log('Test containers stopped');
});

// Helper functions for tests
export const getTestConfig = () => ({
  kafka: {
    brokers: [`localhost:${kafkaContainer.getMappedPort(9092)}`],
  },
  redis: {
    host: 'localhost',
    port: redisContainer.getMappedPort(6379),
  },
  postgres: {
    host: 'localhost',
    port: postgresContainer.getMappedPort(5432),
    username: 'vextrus',
    password: 'test_password',
    database: 'vextrus_test',
  },
  minio: {
    endpoint: `localhost:${minioContainer.getMappedPort(9000)}`,
    accessKey: 'test_admin',
    secretKey: 'test_password',
  },
});

export const clearDatabase = async () => {
  const entities = dataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.clear();
  }
};

export const createTestTenant = () => ({
  id: 'test-tenant-' + Date.now(),
  name: 'Test Organization',
  subdomain: 'test-org',
  settings: {
    language: 'bn',
    timezone: 'Asia/Dhaka',
    currency: 'BDT',
  },
});