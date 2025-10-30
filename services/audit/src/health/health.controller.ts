import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { RetentionPolicy } from '../entities/retention-policy.entity';
import { ElasticsearchService } from '../services/elasticsearch.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private configService: ConfigService,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(RetentionPolicy)
    private retentionPolicyRepository: Repository<RetentionPolicy>,
    private elasticsearchService: ElasticsearchService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async health() {
    return {
      status: 'ok',
      service: 'audit',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  async liveness() {
    return {
      status: 'live',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe with dependency checks' })
  async readiness() {
    const checks = {
      database: false,
      elasticsearch: false,
      kafka: false,
    };

    // Check database
    try {
      await this.auditLogRepository.query('SELECT 1');
      checks.database = true;
    } catch (error: any) {
      checks.database = false;
    }

    // Check Elasticsearch
    try {
      checks.elasticsearch = await this.elasticsearchService.checkHealth();
    } catch (error: any) {
      checks.elasticsearch = false;
    }

    // Check Kafka (basic config check)
    checks.kafka = !!this.configService.get('KAFKA_BROKERS');

    const isReady = Object.values(checks).every(check => check === true);

    return {
      status: isReady ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get service statistics' })
  async stats() {
    const [logCount, archivedCount] = await Promise.all([
      this.auditLogRepository.count(),
      this.auditLogRepository.count({ where: { is_archived: true } }),
    ]);

    const policyCount = await this.retentionPolicyRepository.count();

    const recentLogs = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('audit.event_type', 'event_type')
      .addSelect('COUNT(*)', 'count')
      .where('audit.timestamp >= :date', { 
        date: new Date(Date.now() - 24 * 60 * 60 * 1000) 
      })
      .groupBy('audit.event_type')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    const esStats = await this.elasticsearchService.getStatistics();

    return {
      service: 'audit',
      statistics: {
        total_logs: logCount,
        archived_logs: archivedCount,
        active_logs: logCount - archivedCount,
        retention_policies: policyCount,
        recent_event_types: recentLogs,
        elasticsearch: esStats,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('dependencies')
  @ApiOperation({ summary: 'Check all service dependencies' })
  async dependencies() {
    const dependencies: any[] = [];

    // Database
    try {
      const result = await this.auditLogRepository.query('SELECT version()');
      dependencies.push({
        name: 'PostgreSQL',
        status: 'healthy',
        version: result[0]?.version?.split(' ')[1] || 'unknown',
      });
    } catch (error: any) {
      dependencies.push({
        name: 'PostgreSQL',
        status: 'unhealthy',
        error: error.message,
      });
    }

    // Elasticsearch
    try {
      const healthy = await this.elasticsearchService.checkHealth();
      dependencies.push({
        name: 'Elasticsearch',
        status: healthy ? 'healthy' : 'unhealthy',
        node: this.configService.get<string>('ELASTICSEARCH_NODE', 'http://localhost:9200'),
      });
    } catch (error: any) {
      dependencies.push({
        name: 'Elasticsearch',
        status: 'unhealthy',
        error: error.message,
      });
    }

    // Kafka
    dependencies.push({
      name: 'Kafka',
      status: this.configService.get('KAFKA_BROKERS') ? 'configured' : 'not_configured',
      brokers: this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092'),
    });

    return {
      service: 'audit',
      dependencies,
      timestamp: new Date().toISOString(),
    };
  }
}