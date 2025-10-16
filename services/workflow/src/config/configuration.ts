export default () => ({
  port: parseInt(process.env.PORT, 10) || 3010,
  temporal: {
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'vextrus-erp-workflows',
    workerId: process.env.TEMPORAL_WORKER_ID || 'vextrus-worker-1',
    maxConcurrentActivityExecutions: parseInt(process.env.TEMPORAL_MAX_CONCURRENT_ACTIVITIES, 10) || 100,
    maxConcurrentWorkflowTaskExecutions: parseInt(process.env.TEMPORAL_MAX_CONCURRENT_WORKFLOWS, 10) || 100,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || 'vextrus_redis_2024',
    db: parseInt(process.env.REDIS_DB, 10) || 1,
  },
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USERNAME || 'vextrus',
    password: process.env.DATABASE_PASSWORD || 'vextrus_dev_2024',
    database: process.env.DATABASE_NAME || 'vextrus_workflow',
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'workflow-service',
    groupId: process.env.KAFKA_GROUP_ID || 'workflow-service-group',
  },
});