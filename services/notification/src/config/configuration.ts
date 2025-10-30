export default () => ({
  port: parseInt(process.env.PORT || '3005', 10),
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
  },
  kafka: {
    brokers: process.env.KAFKA_BROKERS?.split(',') || ['kafka:9092'],
    groupId: process.env.KAFKA_GROUP_ID || 'notification-consumer',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true' || false,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@vextrus.com',
  },
  sms: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
  },
  push: {
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,
  },
});
