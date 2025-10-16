import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@vextrus/shared-infrastructure';
import { DeploymentPreparationService } from '../deployment-preparation.service';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('DeploymentPreparationService', () => {
  let service: DeploymentPreparationService;
  let dataSource: jest.Mocked<DataSource>;
  let configService: jest.Mocked<ConfigService>;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const mockDataSource = {
      query: jest.fn(),
    };

    const mockRedisService = {
      getClient: jest.fn().mockResolvedValue({
        ping: jest.fn().mockResolvedValue('PONG'),
        info: jest.fn().mockResolvedValue('redis_version:6.2.0'),
      }),
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        const config: Record<string, string | number> = {
          'production.database.host': 'prod-db.vextrus.com',
          'production.database.port': 5432,
          'production.database.name': 'vextrus_finance',
          'production.database.username': 'finance_user',
          'production.database.password': 'secure_password',
          'production.redis.host': 'prod-redis.vextrus.com',
          'production.redis.port': 6379,
          'production.redis.password': 'redis_password',
          'monitoring.prometheus.endpoint': 'http://prometheus.vextrus.com',
          'monitoring.grafana.endpoint': 'http://grafana.vextrus.com',
          'monitoring.sentry.dsn': 'https://sentry.vextrus.com/dsn',
          'encryption.key': 'production-encryption-key-32char',
          'jwt.secret': 'production-jwt-secret',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeploymentPreparationService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<DeploymentPreparationService>(DeploymentPreparationService);
    dataSource = module.get(DataSource);
    configService = module.get(ConfigService);
    redisService = module.get(RedisService);
  });

  describe('prepareForDeployment', () => {
    beforeEach(() => {
      // Mock all check methods to return true by default
      jest.spyOn(service as any, 'checkDatabase').mockResolvedValue(true);
      jest.spyOn(service as any, 'checkRedis').mockResolvedValue(true);
      jest.spyOn(service as any, 'checkMigrations').mockResolvedValue(true);
      jest.spyOn(service as any, 'checkConfiguration').mockResolvedValue(true);
      jest.spyOn(service as any, 'checkSecurity').mockResolvedValue(true);
      jest.spyOn(service as any, 'checkMonitoring').mockResolvedValue(true);
      jest.spyOn(service as any, 'checkBackup').mockResolvedValue(true);
      jest.spyOn(service as any, 'checkDocumentation').mockResolvedValue(true);
      jest.spyOn(service as any, 'collectPerformanceMetrics').mockResolvedValue({
        apiResponseTime: 85,
        databaseLatency: 35,
        cacheHitRate: 82,
        errorRate: 0.05,
        throughput: 8500,
      });
    });

    it('should run all deployment checks', async () => {
      const report = await service.prepareForDeployment('production');

      expect(report.environment).toBe('production');
      expect(report.checks.database).toBe(true);
      expect(report.checks.redis).toBe(true);
      expect(report.checks.migrations).toBe(true);
      expect(report.checks.configuration).toBe(true);
      expect(report.checks.security).toBe(true);
      expect(report.checks.monitoring).toBe(true);
      expect(report.checks.backup).toBe(true);
      expect(report.checks.documentation).toBe(true);
    });

    it('should report ready status when all checks pass', async () => {
      const report = await service.prepareForDeployment('production');

      expect(report.status).toBe('ready');
      expect(report.blockingIssues).toHaveLength(0);
    });

    it('should report not ready when critical checks fail', async () => {
      jest.spyOn(service as any, 'checkDatabase').mockResolvedValue(false);
      jest.spyOn(service as any, 'checkMigrations').mockResolvedValue(false);

      const report = await service.prepareForDeployment('production');

      expect(report.status).toBe('not_ready');
      expect(report.blockingIssues).toContain('Database connection failed - cannot proceed with deployment');
      expect(report.blockingIssues).toContain('Database migrations not applied - run migrations before deployment');
    });

    it('should collect performance metrics', async () => {
      const report = await service.prepareForDeployment('production');

      expect(report.metrics.apiResponseTime).toBe(85);
      expect(report.metrics.databaseLatency).toBe(35);
      expect(report.metrics.cacheHitRate).toBe(82);
      expect(report.metrics.errorRate).toBe(0.05);
      expect(report.metrics.throughput).toBe(8500);
    });

    it('should generate recommendations based on metrics', async () => {
      jest.spyOn(service as any, 'collectPerformanceMetrics').mockResolvedValue({
        apiResponseTime: 150, // Above threshold
        databaseLatency: 75,  // Above threshold
        cacheHitRate: 65,     // Below threshold
        errorRate: 0.5,       // Above threshold
        throughput: 8500,
      });

      const report = await service.prepareForDeployment('production');

      expect(report.recommendations).toContain('Consider implementing response caching for frequently accessed endpoints');
      expect(report.recommendations).toContain('Optimize database queries and consider adding indexes');
      expect(report.recommendations).toContain('Review caching strategy and increase cache TTL for stable data');
    });

    it('should generate deployment artifacts on success', async () => {
      const mockGenerateArtifacts = jest.spyOn(service as any, 'generateDeploymentArtifacts').mockResolvedValue(undefined);

      const report = await service.prepareForDeployment('production');

      expect(report.status).toBe('ready');
      expect(mockGenerateArtifacts).toHaveBeenCalledWith('production');
    });
  });

  describe('generateEnvironmentConfig', () => {
    it('should generate production configuration', async () => {
      const mockWriteFile = fs.promises.writeFile as jest.Mock;
      mockWriteFile.mockResolvedValue(undefined);

      const config = await service.generateEnvironmentConfig('production');

      expect(config.environment).toBe('production');
      expect(config.database.ssl).toBe(true);
      expect(config.database.poolSize).toBe(100);
      expect(config.redis.cluster).toBe(true);
      expect(config.monitoring.enabled).toBe(true);
      expect(config.performance.clustering).toBe(true);
      expect(config.performance.workers).toBe(4);
    });

    it('should generate staging configuration', async () => {
      const mockWriteFile = fs.promises.writeFile as jest.Mock;
      mockWriteFile.mockResolvedValue(undefined);

      const config = await service.generateEnvironmentConfig('staging');

      expect(config.environment).toBe('staging');
      expect(config.database.ssl).toBe(false);
      expect(config.database.poolSize).toBe(20);
      expect(config.redis.cluster).toBe(false);
      expect(config.monitoring.enabled).toBe(true);
      expect(config.performance.clustering).toBe(false);
      expect(config.performance.workers).toBe(1);
    });

    it('should include security configurations', async () => {
      const config = await service.generateEnvironmentConfig('production');

      expect(config.security.encryptionKey).toBeDefined();
      expect(config.security.encryptionKey.length).toBeGreaterThan(30);
      expect(config.security.jwtSecret).toBeDefined();
      expect(config.security.rateLimiting.enabled).toBe(true);
      expect(config.security.rateLimiting.maxRequests).toBe(100);
    });

    it('should save configuration to YAML file', async () => {
      const mockWriteFile = fs.promises.writeFile as jest.Mock;
      mockWriteFile.mockResolvedValue(undefined);

      await service.generateEnvironmentConfig('production');

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('config/production.yaml'),
        expect.any(String),
        'utf8',
      );
    });
  });

  describe('createDeploymentChecklist', () => {
    it('should create comprehensive deployment checklist', async () => {
      const mockWriteFile = fs.promises.writeFile as jest.Mock;
      const mockMkdir = fs.promises.mkdir as jest.Mock;
      mockWriteFile.mockResolvedValue(undefined);
      mockMkdir.mockResolvedValue(undefined);

      const checklist = await service.createDeploymentChecklist();

      expect(checklist).toContain('Finance Module Production Deployment Checklist');
      expect(checklist).toContain('Pre-Deployment');
      expect(checklist).toContain('Deployment Steps');
      expect(checklist).toContain('Post-Deployment');
      expect(checklist).toContain('Rollback Procedure');
    });

    it('should include infrastructure requirements', async () => {
      const checklist = await service.createDeploymentChecklist();

      expect(checklist).toContain('PostgreSQL 14+');
      expect(checklist).toContain('Redis cluster');
      expect(checklist).toContain('Load balancer');
      expect(checklist).toContain('SSL certificates');
    });

    it('should include Bangladesh-specific validations', async () => {
      const checklist = await service.createDeploymentChecklist();

      expect(checklist).toContain('TIN validation working (10-12 digits)');
      expect(checklist).toContain('BIN validation working (9 digits)');
      expect(checklist).toContain('NID validation working (10/13/17 digits)');
      expect(checklist).toContain('Mobile format validation (01[3-9]XXXXXXXX)');
      expect(checklist).toContain('VAT calculation accurate (15%)');
      expect(checklist).toContain('Fiscal year logic correct (July-June)');
    });

    it('should include performance targets', async () => {
      const checklist = await service.createDeploymentChecklist();

      expect(checklist).toContain('API Response Time: Target < 100ms');
      expect(checklist).toContain('Database Query Time: Target < 50ms');
      expect(checklist).toContain('Cache Hit Rate: Target > 80%');
      expect(checklist).toContain('Concurrent Users: Support 50,000+');
    });

    it('should save checklist to file', async () => {
      const mockWriteFile = fs.promises.writeFile as jest.Mock;
      mockWriteFile.mockResolvedValue(undefined);

      await service.createDeploymentChecklist();

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('deployment/checklist.md'),
        expect.any(String),
        'utf8',
      );
    });
  });

  describe('runPreDeploymentValidation', () => {
    it('should check database connectivity', async () => {
      dataSource.query.mockResolvedValue([{ '?column?': 1 }]);

      const checks = await service.runPreDeploymentValidation();
      const dbCheck = checks.find(c => c.service === 'Database');

      expect(dbCheck).toBeDefined();
      expect(dbCheck?.status).toBe('healthy');
      expect(dbCheck?.latency).toBeDefined();
    });

    it('should check Redis connectivity', async () => {
      const checks = await service.runPreDeploymentValidation();
      const redisCheck = checks.find(c => c.service === 'Redis');

      expect(redisCheck).toBeDefined();
      expect(redisCheck?.status).toBe('healthy');
    });

    it('should check API endpoints', async () => {
      const checks = await service.runPreDeploymentValidation();
      const apiChecks = checks.filter(c => c.service.startsWith('API:'));

      expect(apiChecks.length).toBeGreaterThan(0);
      expect(apiChecks).toContainEqual(
        expect.objectContaining({
          service: 'API: /health',
          status: 'healthy',
        }),
      );
    });

    it('should handle unhealthy services', async () => {
      dataSource.query.mockRejectedValue(new Error('Connection failed'));

      const checks = await service.runPreDeploymentValidation();
      const dbCheck = checks.find(c => c.service === 'Database');

      expect(dbCheck?.status).toBe('unhealthy');
      expect(dbCheck?.details).toContain('Connection failed');
    });
  });

  describe('generateDeploymentScripts', () => {
    it('should generate Docker deployment script', async () => {
      const mockWriteFile = fs.promises.writeFile as jest.Mock;
      const mockMkdir = fs.promises.mkdir as jest.Mock;
      mockWriteFile.mockResolvedValue(undefined);
      mockMkdir.mockResolvedValue(undefined);

      await service.generateDeploymentScripts();

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('deploy-docker.sh'),
        expect.stringContaining('docker build'),
        expect.objectContaining({ mode: 0o755 }),
      );
    });

    it('should generate Kubernetes deployment script', async () => {
      const mockWriteFile = fs.promises.writeFile as jest.Mock;
      mockWriteFile.mockResolvedValue(undefined);

      await service.generateDeploymentScripts();

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('deploy-k8s.sh'),
        expect.stringContaining('kubectl apply'),
        expect.objectContaining({ mode: 0o755 }),
      );
    });

    it('should include health checks in scripts', async () => {
      const mockWriteFile = fs.promises.writeFile as jest.Mock;
      mockWriteFile.mockResolvedValue(undefined);

      await service.generateDeploymentScripts();

      const dockerCall = mockWriteFile.mock.calls.find(call =>
        call[0].includes('deploy-docker.sh')
      );

      expect(dockerCall[1]).toContain('curl -f http://localhost:3000/health');
    });

    it('should set proper file permissions', async () => {
      const mockWriteFile = fs.promises.writeFile as jest.Mock;
      mockWriteFile.mockResolvedValue(undefined);

      await service.generateDeploymentScripts();

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ mode: 0o755 }), // Executable
      );
    });
  });

  describe('createProductionDocumentation', () => {
    it('should create comprehensive production documentation', async () => {
      const mockWriteFile = fs.promises.writeFile as jest.Mock;
      const mockMkdir = fs.promises.mkdir as jest.Mock;
      mockWriteFile.mockResolvedValue(undefined);
      mockMkdir.mockResolvedValue(undefined);

      await service.createProductionDocumentation();

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('docs/PRODUCTION.md'),
        expect.stringContaining('Finance Module Production Documentation'),
        'utf8',
      );
    });

    it('should include architecture details', async () => {
      const mockWriteFile = fs.promises.writeFile as jest.Mock;
      mockWriteFile.mockResolvedValue(undefined);

      await service.createProductionDocumentation();

      const docCall = mockWriteFile.mock.calls[0];
      const content = docCall[1];

      expect(content).toContain('PostgreSQL 14+');
      expect(content).toContain('Redis 6.2+');
      expect(content).toContain('NestJS');
      expect(content).toContain('RabbitMQ');
    });

    it('should include API documentation', async () => {
      const mockWriteFile = fs.promises.writeFile as jest.Mock;
      mockWriteFile.mockResolvedValue(undefined);

      await service.createProductionDocumentation();

      const docCall = mockWriteFile.mock.calls[0];
      const content = docCall[1];

      expect(content).toContain('/api/finance/accounts');
      expect(content).toContain('/api/finance/transactions');
      expect(content).toContain('/api/finance/invoices');
      expect(content).toContain('Authorization: Bearer <token>');
    });

    it('should include monitoring and troubleshooting', async () => {
      const mockWriteFile = fs.promises.writeFile as jest.Mock;
      mockWriteFile.mockResolvedValue(undefined);

      await service.createProductionDocumentation();

      const docCall = mockWriteFile.mock.calls[0];
      const content = docCall[1];

      expect(content).toContain('Health Checks');
      expect(content).toContain('Prometheus metrics');
      expect(content).toContain('Troubleshooting');
      expect(content).toContain('Common Issues');
    });

    it('should include disaster recovery procedures', async () => {
      const mockWriteFile = fs.promises.writeFile as jest.Mock;
      mockWriteFile.mockResolvedValue(undefined);

      await service.createProductionDocumentation();

      const docCall = mockWriteFile.mock.calls[0];
      const content = docCall[1];

      expect(content).toContain('Disaster Recovery');
      expect(content).toContain('Backup Strategy');
      expect(content).toContain('RTO: 4 hours');
      expect(content).toContain('RPO: 1 hour');
    });
  });

  describe('Health Checks', () => {
    it('should validate database version', async () => {
      dataSource.query.mockResolvedValue([{ version: 'PostgreSQL 14.5' }]);

      const result = await service['checkDatabase']();

      expect(result).toBe(true);
    });

    it('should validate Redis connection', async () => {
      const result = await service['checkRedis']();

      expect(result).toBe(true);
      expect(redisService.getClient).toHaveBeenCalled();
    });

    it('should validate migrations are applied', async () => {
      dataSource.query.mockResolvedValue([{ pending: '12' }]);

      const result = await service['checkMigrations']();

      expect(result).toBe(true);
    });

    it('should validate required configuration', async () => {
      const result = await service['checkConfiguration']('production');

      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalled();
    });

    it('should validate security configuration', async () => {
      configService.get.mockReturnValue('configured');

      const result = await service['checkSecurity']();

      expect(result).toBe(true);
    });

    it('should validate monitoring configuration', async () => {
      configService.get.mockReturnValue('configured');

      const result = await service['checkMonitoring']();

      expect(result).toBe(true);
    });
  });

  describe('Performance Metrics Collection', () => {
    it('should collect API response time', async () => {
      const metrics = await service['collectPerformanceMetrics']();

      expect(metrics.apiResponseTime).toBeGreaterThan(0);
      expect(metrics.apiResponseTime).toBeLessThan(200);
    });

    it('should collect database latency', async () => {
      const metrics = await service['collectPerformanceMetrics']();

      expect(metrics.databaseLatency).toBeGreaterThan(0);
      expect(metrics.databaseLatency).toBeLessThan(100);
    });

    it('should calculate cache hit rate', async () => {
      const metrics = await service['collectPerformanceMetrics']();

      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(metrics.cacheHitRate).toBeLessThanOrEqual(100);
    });

    it('should measure throughput', async () => {
      const metrics = await service['collectPerformanceMetrics']();

      expect(metrics.throughput).toBeGreaterThan(0);
      expect(metrics.throughput).toBeLessThan(20000);
    });
  });
});