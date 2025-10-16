export default () => ({
  port: parseInt(process.env.PORT || process.env.APP_PORT, 10) || 3012,
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || 'vextrus_redis_2024',
    db: parseInt(process.env.REDIS_DB, 10) || 2,
    ttl: parseInt(process.env.CACHE_TTL, 10) || 300, // 5 minutes
  },
  database: {
    host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT, 10) || 5432,
    username: process.env.DATABASE_USERNAME || process.env.DB_USERNAME || 'vextrus',
    password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'vextrus_dev_2024',
    database: process.env.DATABASE_NAME || process.env.DB_NAME || 'vextrus_erp',
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'rules-engine-service',
    groupId: process.env.KAFKA_GROUP_ID || 'rules-engine-service-group',
  },
  rules: {
    maxEvaluationTime: parseInt(process.env.MAX_EVALUATION_TIME, 10) || 5000, // 5 seconds
    enableCache: process.env.ENABLE_RULE_CACHE !== 'false',
    cacheTtl: parseInt(process.env.RULE_CACHE_TTL, 10) || 60, // 1 minute
  },
});