export default () => ({
  port: parseInt(process.env.PORT || '3009', 10),
  database: {
    host: process.env.DATABASE_HOST || 'postgres',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'vextrus',
    password: process.env.DATABASE_PASSWORD || 'vextrus_dev_2024',
    name: process.env.DATABASE_NAME || 'vextrus_erp',
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://elasticsearch:9200',
    apiKey: process.env.ELASTICSEARCH_API_KEY,
  },
  kafka: {
    brokers: process.env.KAFKA_BROKERS?.split(',') || ['kafka:9092'],
    groupId: process.env.KAFKA_GROUP_ID || 'audit-consumer',
  },
  retention: {
    defaultDays: parseInt(process.env.RETENTION_DAYS || '90', 10),
    archiveDays: parseInt(process.env.ARCHIVE_DAYS || '365', 10),
  },
});
