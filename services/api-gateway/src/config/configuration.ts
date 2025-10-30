export default () => ({
  port: parseInt(process.env.PORT, 10) || 4000,
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4000',
  },
  jwt: {
    secret: process.env.JWT_ACCESS_SECRET || 'vextrus_jwt_access_secret_dev_2024',
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  },
  graphql: {
    playground: process.env.NODE_ENV !== 'production',
    introspection: process.env.NODE_ENV !== 'production',
    debug: process.env.NODE_ENV !== 'production',
  },
  services: {
    pollInterval: parseInt(process.env.POLL_INTERVAL, 10) || 10000, // 10 seconds
    subgraphs: [
      {
        name: 'auth',
        url: process.env.AUTH_SERVICE_URL || 'http://auth:3001/graphql',
      },
      {
        name: 'master-data',
        url: process.env.MASTER_DATA_SERVICE_URL || 'http://master-data:3002/graphql',
      },
      {
        name: 'workflow',
        url: process.env.WORKFLOW_SERVICE_URL || 'http://workflow:3011/graphql',
      },
      {
        name: 'rules-engine',
        url: process.env.RULES_ENGINE_SERVICE_URL || 'http://rules-engine:3012/graphql',
      },
      {
        name: 'organization',
        url: process.env.ORGANIZATION_SERVICE_URL || 'http://organization:3016/graphql',
      },
      {
        name: 'notification',
        url: process.env.NOTIFICATION_SERVICE_URL || 'http://notification:3003/graphql',
      },
      {
        name: 'file-storage',
        url: process.env.FILE_STORAGE_SERVICE_URL || 'http://file-storage:3008/graphql',
      },
      {
        name: 'audit',
        url: process.env.AUDIT_SERVICE_URL || 'http://audit:3009/graphql',
      },
      {
        name: 'configuration',
        url: process.env.CONFIGURATION_SERVICE_URL || 'http://configuration:3004/graphql',
      },
      {
        name: 'import-export',
        url: process.env.IMPORT_EXPORT_SERVICE_URL || 'http://import-export:3007/graphql',
      },
      {
        name: 'document-generator',
        url: process.env.DOCUMENT_GENERATOR_SERVICE_URL || 'http://document-generator:3006/graphql',
      },
      {
        name: 'scheduler',
        url: process.env.SCHEDULER_SERVICE_URL || 'http://scheduler:3005/graphql',
      },
      // Business module services (when available)
      {
        name: 'finance',
        url: process.env.FINANCE_SERVICE_URL || 'http://finance:3014/graphql',
      },
      {
        name: 'hr',
        url: process.env.HR_SERVICE_URL || 'http://hr:3015/graphql',
      },
      {
        name: 'crm',
        url: process.env.CRM_SERVICE_URL || 'http://crm:3013/graphql',
      },
      {
        name: 'scm',
        url: process.env.SCM_SERVICE_URL || 'http://scm:3018/graphql',
      },
      {
        name: 'project-management',
        url: process.env.PROJECT_MANAGEMENT_SERVICE_URL || 'http://project-management:3017/graphql',
      },
    ].filter(service => {
      // Filter out services that are not yet available
      const skipServices = process.env.SKIP_SERVICES
        ? process.env.SKIP_SERVICES.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : [];
      return !skipServices.includes(service.name);
    }),
  },
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || 'vextrus_redis_2024',
    db: parseInt(process.env.REDIS_DB, 10) || 3,
  },
  rateLimiting: {
    enabled: process.env.RATE_LIMITING_ENABLED !== 'false',
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000, // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    serviceName: 'api-gateway',
    jaegerEndpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:4000/api/traces',
  },
});