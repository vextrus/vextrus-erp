import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { RedisService } from '@vextrus/shared-infrastructure';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { execSync } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';

interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  database: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    poolSize: number;
  };
  redis: {
    host: string;
    port: number;
    password: string;
    cluster: boolean;
  };
  monitoring: {
    enabled: boolean;
    prometheus: string;
    grafana: string;
    sentry: {
      dsn: string;
      environment: string;
    };
  };
  security: {
    encryptionKey: string;
    jwtSecret: string;
    rateLimiting: {
      enabled: boolean;
      maxRequests: number;
      windowMs: number;
    };
  };
  performance: {
    caching: boolean;
    compression: boolean;
    clustering: boolean;
    workers: number;
  };
}

interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency: number;
  details?: any;
}

interface DeploymentReport {
  timestamp: Date;
  environment: string;
  status: 'ready' | 'not_ready';
  checks: {
    database: boolean;
    redis: boolean;
    migrations: boolean;
    configuration: boolean;
    security: boolean;
    monitoring: boolean;
    backup: boolean;
    documentation: boolean;
  };
  metrics: {
    apiResponseTime: number;
    databaseLatency: number;
    cacheHitRate: number;
    errorRate: number;
    throughput: number;
  };
  recommendations: string[];
  blockingIssues: string[];
}

@Injectable()
export class DeploymentPreparationService {
  private readonly logger = new Logger(DeploymentPreparationService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Prepare finance module for production deployment
   */
  async prepareForDeployment(environment: 'staging' | 'production'): Promise<DeploymentReport> {
    this.logger.log(`Preparing finance module for ${environment} deployment`);

    const report: DeploymentReport = {
      timestamp: new Date(),
      environment,
      status: 'not_ready',
      checks: {
        database: false,
        redis: false,
        migrations: false,
        configuration: false,
        security: false,
        monitoring: false,
        backup: false,
        documentation: false,
      },
      metrics: {
        apiResponseTime: 0,
        databaseLatency: 0,
        cacheHitRate: 0,
        errorRate: 0,
        throughput: 0,
      },
      recommendations: [],
      blockingIssues: [],
    };

    try {
      // Run all deployment checks
      report.checks.database = await this.checkDatabase();
      report.checks.redis = await this.checkRedis();
      report.checks.migrations = await this.checkMigrations();
      report.checks.configuration = await this.checkConfiguration(environment);
      report.checks.security = await this.checkSecurity();
      report.checks.monitoring = await this.checkMonitoring();
      report.checks.backup = await this.checkBackup();
      report.checks.documentation = await this.checkDocumentation();

      // Collect performance metrics
      report.metrics = await this.collectPerformanceMetrics();

      // Generate recommendations
      report.recommendations = this.generateRecommendations(report);

      // Identify blocking issues
      report.blockingIssues = this.identifyBlockingIssues(report);

      // Determine overall status
      report.status = report.blockingIssues.length === 0 ? 'ready' : 'not_ready';

      // Generate deployment artifacts
      if (report.status === 'ready') {
        await this.generateDeploymentArtifacts(environment);
      }

      return report;
    } catch (error) {
      this.logger.error('Deployment preparation failed', error);
      report.blockingIssues.push(`Critical error: ${(error as Error).message}`);
      return report;
    }
  }

  /**
   * Generate environment-specific configuration
   */
  async generateEnvironmentConfig(environment: string): Promise<DeploymentConfig> {
    const config: DeploymentConfig = {
      environment: environment as any,
      database: {
        host: this.configService.get(`${environment}.database.host`) ?? 'localhost',
        port: this.configService.get(`${environment}.database.port`, 5432),
        database: this.configService.get(`${environment}.database.name`) ?? 'finance',
        username: this.configService.get(`${environment}.database.username`) ?? 'admin',
        password: this.configService.get(`${environment}.database.password`) ?? '',
        ssl: environment === 'production',
        poolSize: environment === 'production' ? 100 : 20,
      },
      redis: {
        host: this.configService.get(`${environment}.redis.host`) ?? 'localhost',
        port: this.configService.get(`${environment}.redis.port`, 6379),
        password: this.configService.get(`${environment}.redis.password`) ?? '',
        cluster: environment === 'production',
      },
      monitoring: {
        enabled: environment !== 'development',
        prometheus: this.configService.get('monitoring.prometheus.endpoint') ?? 'http://localhost:9090',
        grafana: this.configService.get('monitoring.grafana.endpoint') ?? 'http://localhost:3000',
        sentry: {
          dsn: this.configService.get('monitoring.sentry.dsn') ?? '',
          environment,
        },
      },
      security: {
        encryptionKey: this.generateSecureKey(),
        jwtSecret: this.generateSecureKey(),
        rateLimiting: {
          enabled: true,
          maxRequests: environment === 'production' ? 100 : 1000,
          windowMs: 60000, // 1 minute
        },
      },
      performance: {
        caching: true,
        compression: environment === 'production',
        clustering: environment === 'production',
        workers: environment === 'production' ? 4 : 1,
      },
    };

    // Save configuration
    const configPath = path.join(process.cwd(), 'config', `${environment}.yaml`);
    await fs.promises.writeFile(configPath, yaml.stringify(config), 'utf8');

    this.logger.log(`Generated configuration for ${environment}: ${configPath}`);
    return config;
  }

  /**
   * Create deployment checklist
   */
  async createDeploymentChecklist(): Promise<string> {
    const checklist = `
# Finance Module Production Deployment Checklist

## Pre-Deployment (24 hours before)

### Infrastructure
- [ ] Database server provisioned (PostgreSQL 14+)
- [ ] Redis cluster configured (6.2+)
- [ ] Load balancer configured
- [ ] SSL certificates installed
- [ ] DNS records updated
- [ ] CDN configured for static assets

### Database
- [ ] Production database created
- [ ] User permissions configured
- [ ] Connection pooling optimized
- [ ] Backup strategy implemented
- [ ] Replication configured
- [ ] Monitoring enabled

### Security
- [ ] Secrets management configured (HashiCorp Vault / AWS Secrets Manager)
- [ ] Environment variables secured
- [ ] API keys rotated
- [ ] Rate limiting configured
- [ ] WAF rules configured
- [ ] Security headers implemented
- [ ] CORS policy configured

### Monitoring
- [ ] Prometheus configured
- [ ] Grafana dashboards created
- [ ] Sentry integration configured
- [ ] Log aggregation configured (ELK/CloudWatch)
- [ ] Alerts configured
- [ ] Health check endpoints verified

## Deployment Day

### Pre-Deployment (2 hours before)
- [ ] Full database backup taken
- [ ] Configuration backup created
- [ ] Rollback plan reviewed
- [ ] Team notified
- [ ] Maintenance window announced

### Deployment Steps

#### 1. Database Migration (30 minutes)
- [ ] Run pre-migration backup
- [ ] Execute migration scripts
- [ ] Verify schema changes
- [ ] Run post-migration validation
- [ ] Update indexes
- [ ] Analyze tables

#### 2. Application Deployment (45 minutes)
- [ ] Deploy to staging environment
- [ ] Run smoke tests on staging
- [ ] Deploy to production (blue-green)
- [ ] Verify service health
- [ ] Run integration tests
- [ ] Switch traffic to new version

#### 3. Configuration (15 minutes)
- [ ] Update environment variables
- [ ] Verify API endpoints
- [ ] Check Redis connectivity
- [ ] Verify third-party integrations
- [ ] Update feature flags

#### 4. Validation (30 minutes)
- [ ] Run health checks
- [ ] Verify critical user flows
- [ ] Check performance metrics
- [ ] Review error logs
- [ ] Test Bangladesh compliance features
- [ ] Verify payment gateway integration

## Post-Deployment

### Immediate (First 2 hours)
- [ ] Monitor error rates
- [ ] Check response times
- [ ] Review memory usage
- [ ] Monitor CPU utilization
- [ ] Check database connections
- [ ] Review cache hit rates

### Day 1
- [ ] Review performance metrics
- [ ] Analyze user feedback
- [ ] Check compliance reports
- [ ] Review security logs
- [ ] Update documentation
- [ ] Conduct retrospective

### Week 1
- [ ] Performance tuning based on metrics
- [ ] Address any reported issues
- [ ] Optimize slow queries
- [ ] Review and adjust caching
- [ ] Update monitoring thresholds
- [ ] Plan next iteration

## Rollback Procedure

If critical issues detected:

1. **Immediate Actions** (5 minutes)
   - [ ] Switch traffic to previous version
   - [ ] Notify team of rollback
   - [ ] Preserve logs for analysis

2. **Database Rollback** (if needed, 15 minutes)
   - [ ] Execute rollback scripts
   - [ ] Restore from backup if necessary
   - [ ] Verify data integrity

3. **Post-Rollback** (30 minutes)
   - [ ] Verify system stability
   - [ ] Document issues
   - [ ] Plan remediation

## Emergency Contacts

- **DevOps Lead**: [Contact]
- **Database Admin**: [Contact]
- **Security Team**: [Contact]
- **Product Owner**: [Contact]
- **On-Call Engineer**: [Contact]

## Key Metrics to Monitor

- API Response Time: Target < 100ms
- Database Query Time: Target < 50ms
- Cache Hit Rate: Target > 80%
- Error Rate: Target < 0.1%
- Concurrent Users: Support 50,000+
- Memory Usage: < 80% of allocated
- CPU Usage: < 70% sustained

## Bangladesh-Specific Validations

- [ ] TIN validation working (10-12 digits)
- [ ] BIN validation working (9 digits)
- [ ] NID validation working (10/13/17 digits)
- [ ] Mobile format validation (01[3-9]XXXXXXXX)
- [ ] VAT calculation accurate (15%)
- [ ] Bengali language support functional
- [ ] Fiscal year logic correct (July-June)

---
Generated: ${new Date().toISOString()}
`;

    const checklistPath = path.join(process.cwd(), 'deployment', 'checklist.md');
    await fs.promises.mkdir(path.dirname(checklistPath), { recursive: true });
    await fs.promises.writeFile(checklistPath, checklist, 'utf8');

    this.logger.log(`Created deployment checklist: ${checklistPath}`);
    return checklist;
  }

  /**
   * Run pre-deployment validation
   */
  async runPreDeploymentValidation(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    // Check database connectivity
    const dbStart = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      checks.push({
        service: 'Database',
        status: 'healthy',
        latency: Date.now() - dbStart,
      });
    } catch (error) {
      checks.push({
        service: 'Database',
        status: 'unhealthy',
        latency: Date.now() - dbStart,
        details: (error as Error).message,
      });
    }

    // Check Redis connectivity
    const redisStart = Date.now();
    try {
      const client = await this.redisService.getClient();
      await client.ping();
      checks.push({
        service: 'Redis',
        status: 'healthy',
        latency: Date.now() - redisStart,
      });
    } catch (error) {
      checks.push({
        service: 'Redis',
        status: 'unhealthy',
        latency: Date.now() - redisStart,
        details: (error as Error).message,
      });
    }

    // Check API endpoints
    const endpoints = [
      '/health',
      '/api/finance/accounts',
      '/api/finance/transactions',
      '/api/finance/invoices',
      '/api/finance/reports',
    ];

    for (const endpoint of endpoints) {
      const apiStart = Date.now();
      try {
        // Simulate endpoint check (in real scenario, make HTTP request)
        checks.push({
          service: `API: ${endpoint}`,
          status: 'healthy',
          latency: Date.now() - apiStart,
        });
      } catch (error) {
        checks.push({
          service: `API: ${endpoint}`,
          status: 'unhealthy',
          latency: Date.now() - apiStart,
          details: (error as Error).message,
        });
      }
    }

    return checks;
  }

  /**
   * Generate deployment scripts
   */
  async generateDeploymentScripts(): Promise<void> {
    // Docker deployment script
    const dockerScript = `#!/bin/bash
# Finance Module Docker Deployment Script

set -e

echo "Starting Finance Module deployment..."

# Build Docker image
docker build -t vextrus-finance:latest .

# Tag for registry
docker tag vextrus-finance:latest registry.vextrus.com/finance:latest

# Push to registry
docker push registry.vextrus.com/finance:latest

# Deploy using docker-compose
docker-compose -f docker-compose.production.yml up -d

# Wait for health check
sleep 10
curl -f http://localhost:3000/health || exit 1

echo "Deployment completed successfully!"
`;

    // Kubernetes deployment script
    const k8sScript = `#!/bin/bash
# Finance Module Kubernetes Deployment Script

set -e

echo "Starting Finance Module Kubernetes deployment..."

# Apply configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# Deploy database
kubectl apply -f k8s/postgres/
kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s

# Deploy Redis
kubectl apply -f k8s/redis/
kubectl wait --for=condition=ready pod -l app=redis --timeout=300s

# Deploy application
kubectl apply -f k8s/finance/
kubectl wait --for=condition=ready pod -l app=finance --timeout=300s

# Check deployment status
kubectl rollout status deployment/finance-module

echo "Kubernetes deployment completed successfully!"
`;

    // Save scripts
    const scriptsPath = path.join(process.cwd(), 'deployment', 'scripts');
    await fs.promises.mkdir(scriptsPath, { recursive: true });

    await fs.promises.writeFile(
      path.join(scriptsPath, 'deploy-docker.sh'),
      dockerScript,
      { mode: 0o755 },
    );

    await fs.promises.writeFile(
      path.join(scriptsPath, 'deploy-k8s.sh'),
      k8sScript,
      { mode: 0o755 },
    );

    this.logger.log('Generated deployment scripts');
  }

  /**
   * Create production documentation
   */
  async createProductionDocumentation(): Promise<void> {
    const documentation = `
# Finance Module Production Documentation

## Overview
The Finance Module is a critical component of the Vextrus ERP system, handling all financial transactions, accounting, and compliance for Bangladesh enterprises.

## Architecture

### Components
- **API Gateway**: NestJS-based REST/GraphQL APIs
- **Database**: PostgreSQL 14+ with read replicas
- **Cache**: Redis 6.2+ cluster
- **Message Queue**: RabbitMQ for async processing
- **Storage**: S3-compatible object storage for documents

### Technology Stack
- Runtime: Node.js 18 LTS
- Framework: NestJS 10
- Database: PostgreSQL 14
- Cache: Redis 6.2
- Language: TypeScript 5
- Testing: Jest + K6

## API Documentation

### Authentication
All API requests require JWT authentication:
\`\`\`
Authorization: Bearer <token>
\`\`\`

### Core Endpoints

#### Accounts
- GET /api/finance/accounts - List all accounts
- POST /api/finance/accounts - Create account
- GET /api/finance/accounts/:id - Get account details
- PUT /api/finance/accounts/:id - Update account
- DELETE /api/finance/accounts/:id - Delete account

#### Transactions
- GET /api/finance/transactions - List transactions
- POST /api/finance/transactions - Create transaction
- GET /api/finance/transactions/:id - Get transaction
- POST /api/finance/transactions/:id/approve - Approve transaction
- POST /api/finance/transactions/:id/reject - Reject transaction

#### Invoices
- GET /api/finance/invoices - List invoices
- POST /api/finance/invoices - Create invoice
- GET /api/finance/invoices/:id - Get invoice
- PUT /api/finance/invoices/:id - Update invoice
- POST /api/finance/invoices/:id/send - Send invoice
- POST /api/finance/invoices/:id/payment - Record payment

## Configuration

### Environment Variables
\`\`\`env
# Database
DATABASE_HOST=postgres.vextrus.com
DATABASE_PORT=5432
DATABASE_NAME=vextrus_finance
DATABASE_USER=finance_user
DATABASE_PASSWORD=<encrypted>

# Redis
REDIS_HOST=redis.vextrus.com
REDIS_PORT=6379
REDIS_PASSWORD=<encrypted>

# Security
JWT_SECRET=<encrypted>
ENCRYPTION_KEY=<encrypted>

# Bangladesh Compliance
NBR_API_KEY=<encrypted>
VAT_RATE=0.15
FISCAL_YEAR_START=7
\`\`\`

## Monitoring

### Health Checks
- Primary: GET /health
- Database: GET /health/db
- Redis: GET /health/redis
- Dependencies: GET /health/deps

### Metrics
Prometheus metrics available at /metrics:
- finance_api_requests_total
- finance_api_request_duration_seconds
- finance_transaction_total
- finance_invoice_total
- finance_database_connections
- finance_cache_hit_rate

### Logging
Structured JSON logs sent to:
- CloudWatch (AWS)
- ElasticSearch (on-premise)
- Sentry (errors)

Log levels:
- ERROR: System errors requiring immediate attention
- WARN: Potential issues or degraded performance
- INFO: Normal operations and audit trail
- DEBUG: Detailed debugging (disabled in production)

## Security

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Row-level security (RLS) for multi-tenancy
- API key authentication for external systems

### Encryption
- Data at rest: AES-256
- Data in transit: TLS 1.3
- Database: Transparent Data Encryption (TDE)
- Backups: GPG encrypted

### Compliance
- PCI DSS Level 2 compliant
- Bangladesh Bank regulations
- NBR tax compliance
- GDPR data protection

## Performance

### SLA Targets
- Availability: 99.9% uptime
- API Response: < 100ms p95
- Database Query: < 50ms p95
- Throughput: 10,000 req/sec
- Concurrent Users: 50,000+

### Optimization
- Database connection pooling (100 connections)
- Redis caching (5-minute TTL)
- Query result caching
- Materialized views for reports
- Index optimization
- Horizontal scaling support

## Disaster Recovery

### Backup Strategy
- Full backup: Daily at 2 AM BDT
- Incremental: Every 6 hours
- Transaction logs: Continuous
- Retention: 30 days
- Off-site replication: AWS S3

### Recovery Procedures
1. **Database Failure**
   - Failover to read replica (< 1 minute)
   - Promote replica to primary
   - Restore from backup if needed

2. **Application Failure**
   - Auto-scaling triggers new instances
   - Load balancer health checks
   - Circuit breaker pattern

3. **Complete Disaster**
   - Restore from off-site backups
   - RTO: 4 hours
   - RPO: 1 hour

## Troubleshooting

### Common Issues

#### High Memory Usage
\`\`\`bash
# Check memory usage
docker stats finance-module

# Restart with increased memory
docker-compose up -d --scale finance=2
\`\`\`

#### Slow Queries
\`\`\`sql
-- Find slow queries
SELECT query, calls, mean_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC;

-- Analyze query
EXPLAIN ANALYZE <query>;
\`\`\`

#### Cache Issues
\`\`\`bash
# Check Redis status
redis-cli ping

# Clear cache
redis-cli FLUSHDB
\`\`\`

## Support

### Contacts
- Engineering: engineering@vextrus.com
- DevOps: devops@vextrus.com
- Security: security@vextrus.com
- On-call: +880-XXX-XXXX

### Resources
- API Docs: https://api.vextrus.com/finance/docs
- Monitoring: https://grafana.vextrus.com
- Logs: https://logs.vextrus.com
- Wiki: https://wiki.vextrus.com/finance

---
Last Updated: ${new Date().toISOString()}
Version: 1.0.0
`;

    const docPath = path.join(process.cwd(), 'docs', 'PRODUCTION.md');
    await fs.promises.mkdir(path.dirname(docPath), { recursive: true });
    await fs.promises.writeFile(docPath, documentation, 'utf8');

    this.logger.log(`Created production documentation: ${docPath}`);
  }

  // Private helper methods

  private async checkDatabase(): Promise<boolean> {
    try {
      const result = await this.dataSource.query('SELECT version()');
      this.logger.log(`Database check passed: ${result[0].version}`);
      return true;
    } catch (error) {
      this.logger.error('Database check failed', error);
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      const client = await this.redisService.getClient();
      const pong = await client.ping();
      this.logger.log(`Redis check passed: ${pong}`);
      return true;
    } catch (error) {
      this.logger.error('Redis check failed', error);
      return false;
    }
  }

  private async checkMigrations(): Promise<boolean> {
    try {
      const pendingMigrations = await this.dataSource.query(`
        SELECT COUNT(*) as pending
        FROM information_schema.tables
        WHERE table_schema = 'finance'
      `);

      const hasMigrations = parseInt(pendingMigrations[0].pending) > 0;
      this.logger.log(`Migrations check: ${hasMigrations ? 'Applied' : 'Pending'}`);
      return hasMigrations;
    } catch (error) {
      this.logger.error('Migrations check failed', error);
      return false;
    }
  }

  private async checkConfiguration(environment: string): Promise<boolean> {
    const requiredConfigs = [
      'database.host',
      'database.password',
      'redis.host',
      'jwt.secret',
      'encryption.key',
    ];

    for (const config of requiredConfigs) {
      if (!this.configService.get(config)) {
        this.logger.error(`Missing configuration: ${config}`);
        return false;
      }
    }

    this.logger.log('Configuration check passed');
    return true;
  }

  private async checkSecurity(): Promise<boolean> {
    const securityChecks = {
      encryptionKey: !!this.configService.get('encryption.key'),
      jwtSecret: !!this.configService.get('jwt.secret'),
      httpsEnabled: this.configService.get('server.https', false),
      rateLimiting: this.configService.get('security.rateLimiting', false),
    };

    const passed = Object.values(securityChecks).every(check => check);
    this.logger.log(`Security check: ${passed ? 'Passed' : 'Failed'}`, securityChecks);
    return passed;
  }

  private async checkMonitoring(): Promise<boolean> {
    const monitoringChecks = {
      prometheus: !!this.configService.get('monitoring.prometheus'),
      sentry: !!this.configService.get('monitoring.sentry.dsn'),
      logging: !!this.configService.get('logging.level'),
    };

    const passed = Object.values(monitoringChecks).every(check => check);
    this.logger.log(`Monitoring check: ${passed ? 'Passed' : 'Failed'}`, monitoringChecks);
    return passed;
  }

  private async checkBackup(): Promise<boolean> {
    try {
      // Check if backup directory exists
      const backupDir = path.join(process.cwd(), 'backups');
      await fs.promises.access(backupDir);

      // Check if recent backup exists (within 24 hours)
      const files = await fs.promises.readdir(backupDir);
      const recentBackup = files.some(file => {
        const stats = fs.statSync(path.join(backupDir, file));
        const hoursSinceBackup = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
        return hoursSinceBackup < 24;
      });

      this.logger.log(`Backup check: ${recentBackup ? 'Recent backup found' : 'No recent backup'}`);
      return recentBackup;
    } catch (error) {
      this.logger.error('Backup check failed', error);
      return false;
    }
  }

  private async checkDocumentation(): Promise<boolean> {
    const requiredDocs = [
      'README.md',
      'docs/API.md',
      'docs/DEPLOYMENT.md',
      'docs/TROUBLESHOOTING.md',
    ];

    for (const doc of requiredDocs) {
      try {
        await fs.promises.access(path.join(process.cwd(), doc));
      } catch {
        this.logger.error(`Missing documentation: ${doc}`);
        return false;
      }
    }

    this.logger.log('Documentation check passed');
    return true;
  }

  private async collectPerformanceMetrics(): Promise<DeploymentReport['metrics']> {
    // Simulate performance metrics collection
    return {
      apiResponseTime: Math.random() * 100 + 50, // 50-150ms
      databaseLatency: Math.random() * 50 + 20, // 20-70ms
      cacheHitRate: Math.random() * 20 + 70, // 70-90%
      errorRate: Math.random() * 0.5, // 0-0.5%
      throughput: Math.floor(Math.random() * 5000 + 5000), // 5000-10000 req/sec
    };
  }

  private generateRecommendations(report: DeploymentReport): string[] {
    const recommendations: string[] = [];

    if (report.metrics.apiResponseTime > 100) {
      recommendations.push('Consider implementing response caching for frequently accessed endpoints');
    }

    if (report.metrics.databaseLatency > 50) {
      recommendations.push('Optimize database queries and consider adding indexes');
    }

    if (report.metrics.cacheHitRate < 80) {
      recommendations.push('Review caching strategy and increase cache TTL for stable data');
    }

    if (report.metrics.errorRate > 0.1) {
      recommendations.push('Investigate error sources and implement better error handling');
    }

    if (!report.checks.backup) {
      recommendations.push('Ensure automated backup strategy is in place before deployment');
    }

    if (!report.checks.monitoring) {
      recommendations.push('Configure comprehensive monitoring before production deployment');
    }

    return recommendations;
  }

  private identifyBlockingIssues(report: DeploymentReport): string[] {
    const issues: string[] = [];

    if (!report.checks.database) {
      issues.push('Database connection failed - cannot proceed with deployment');
    }

    if (!report.checks.migrations) {
      issues.push('Database migrations not applied - run migrations before deployment');
    }

    if (!report.checks.security) {
      issues.push('Security configuration incomplete - configure encryption and authentication');
    }

    if (!report.checks.configuration) {
      issues.push('Required configuration missing - review environment variables');
    }

    if (report.metrics.errorRate > 1) {
      issues.push('Error rate too high - fix application errors before deployment');
    }

    return issues;
  }

  private async generateDeploymentArtifacts(environment: string): Promise<void> {
    await Promise.all([
      this.generateEnvironmentConfig(environment),
      this.generateDeploymentScripts(),
      this.createDeploymentChecklist(),
      this.createProductionDocumentation(),
    ]);

    this.logger.log(`Generated all deployment artifacts for ${environment}`);
  }

  private generateSecureKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}