export default () => ({
  app: {
    name: process.env['APP_NAME'] || 'vextrus-erp-auth',
    port: parseInt(process.env['APP_PORT'] || '3001', 10),
    url: process.env['APP_URL'] || 'http://localhost:3000',
    env: process.env['NODE_ENV'] || 'development',
  },
  database: {
    type: 'postgres' as const,
    host: process.env['DATABASE_HOST'] || 'localhost',
    port: parseInt(process.env['DATABASE_PORT'] || '5432', 10),
    username: process.env['DATABASE_USERNAME'] || 'vextrus',
    password: process.env['DATABASE_PASSWORD'] || 'vextrus_dev_2024',
    database: process.env['DATABASE_NAME'] || 'vextrus_erp',
    synchronize: process.env['NODE_ENV'] === 'development',
    logging: process.env['NODE_ENV'] === 'development',
    autoLoadEntities: true,
    ssl: process.env['DATABASE_SSL'] === 'true',
  },
  redis: {
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
    password: process.env['REDIS_PASSWORD'] || 'vextrus_redis_2024',
    db: parseInt(process.env['REDIS_DB'] || '0', 10),
  },
  jwt: {
    access: {
      secret: process.env['JWT_ACCESS_SECRET'] || 'vextrus_jwt_access_secret_dev_2024',
      expiresIn: process.env['JWT_ACCESS_EXPIRES_IN'] || '15m',
    },
    refresh: {
      secret: process.env['JWT_REFRESH_SECRET'] || 'vextrus_jwt_refresh_secret_dev_2024',
      expiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
    },
    accessTokenSecret: process.env['JWT_ACCESS_SECRET'] || 'vextrus_jwt_access_secret_dev_2024',
    accessTokenExpiresIn: process.env['JWT_ACCESS_EXPIRES_IN'] || '15m',
    refreshTokenSecret: process.env['JWT_REFRESH_SECRET'] || 'vextrus_jwt_refresh_secret_dev_2024',
    refreshTokenExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
  },
  bcrypt: {
    saltRounds: parseInt(process.env['BCRYPT_SALT_ROUNDS'] || '10', 10),
  },
  kafka: {
    brokers: (process.env['KAFKA_BROKERS'] || 'localhost:9092').split(','),
    clientId: process.env['KAFKA_CLIENT_ID'] || 'auth-service',
    consumerGroup: process.env['KAFKA_CONSUMER_GROUP'] || 'auth-consumer',
  },
});