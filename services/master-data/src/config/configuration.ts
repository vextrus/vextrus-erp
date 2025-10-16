export default () => ({
  app: {
    name: process.env.APP_NAME || 'master-data-service',
    port: parseInt(process.env.APP_PORT || '3002', 10),
    url: process.env.APP_URL || 'http://localhost:3002',
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    type: 'postgres' as const,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'vextrus',
    password: process.env.DATABASE_PASSWORD || 'vextrus_dev_2024',
    database: process.env.DATABASE_NAME || 'vextrus_erp',
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    autoLoadEntities: true,
    migrations: ['dist/database/migrations/*.js'],
    migrationsRun: true,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || 'vextrus_redis_2024',
    db: parseInt(process.env.REDIS_DB || '0', 10),
    ttl: parseInt(process.env.REDIS_TTL || '300', 10), // 5 minutes default
  },
  kafka: {
    clientId: process.env.KAFKA_CLIENT_ID || 'master-data-service',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    consumerGroup: process.env.KAFKA_CONSUMER_GROUP || 'master-data-consumer-group',
    topics: {
      masterDataEvents: 'master-data.events',
      customerEvents: 'customer.events',
      vendorEvents: 'vendor.events',
      productEvents: 'product.events',
      accountEvents: 'account.events',
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutes
    max: parseInt(process.env.CACHE_MAX || '100', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  swagger: {
    title: 'Master Data Management API',
    description: 'API for managing master data (customers, vendors, products, chart of accounts)',
    version: '1.0.0',
    path: 'api/docs',
  },
});