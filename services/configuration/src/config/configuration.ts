export default () => ({
  port: parseInt(process.env.PORT || '3004', 10),
  database: {
    host: process.env.DATABASE_HOST || 'postgres',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'vextrus',
    password: process.env.DATABASE_PASSWORD || 'vextrus_dev_2024',
    name: process.env.DATABASE_NAME || 'vextrus_erp',
  },
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    ttl: parseInt(process.env.REDIS_TTL || '300', 10), // 5 minutes default
  },
  consul: {
    host: process.env.CONSUL_HOST || 'localhost',
    port: parseInt(process.env.CONSUL_PORT || '8500', 10),
    secure: process.env.CONSUL_SECURE === 'true',
    token: process.env.CONSUL_TOKEN,
  },
  etcd: {
    hosts: process.env.ETCD_HOSTS?.split(',') || ['localhost:2379'],
    username: process.env.ETCD_USERNAME,
    password: process.env.ETCD_PASSWORD,
  },
  kafka: {
    brokers: process.env.KAFKA_BROKERS?.split(',') || ['kafka:9093'],
    groupId: process.env.KAFKA_GROUP_ID || 'configuration-consumer',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '60', 10), // seconds
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD || '120', 10), // seconds
  },
  featureFlags: {
    defaultEnabled: process.env.FEATURE_FLAGS_DEFAULT === 'true',
    refreshInterval: parseInt(process.env.FEATURE_FLAGS_REFRESH_INTERVAL || '30000', 10), // 30 seconds
  },
});