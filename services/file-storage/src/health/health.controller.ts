import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from '../entities/file.entity';
import { StoragePolicy } from '../entities/storage-policy.entity';
import { MinioProvider } from '../providers/minio.provider';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private configService: ConfigService,
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(StoragePolicy)
    private policyRepository: Repository<StoragePolicy>,
    private minioProvider: MinioProvider,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async health() {
    return {
      status: 'ok',
      service: 'file-storage',
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
      minio: false,
      kafka: false,
    };

    // Check database
    try {
      await this.fileRepository.query('SELECT 1');
      checks.database = true;
    } catch (error: any) {
      checks.database = false;
    }

    // Check MinIO
    try {
      const testBucket = 'health-check';
      const buckets = await this.minioProvider['minioClient'].listBuckets();
      checks.minio = true;
    } catch (error: any) {
      checks.minio = false;
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
    const [fileCount, totalSize] = await Promise.all([
      this.fileRepository.count(),
      this.fileRepository
        .createQueryBuilder('file')
        .select('SUM(file.size)', 'total')
        .getRawOne(),
    ]);

    const policyCount = await this.policyRepository.count();

    const activeFiles = await this.fileRepository.count({
      where: { status: 'active' as any },
    });

    const archivedFiles = await this.fileRepository.count({
      where: { status: 'archived' as any },
    });

    return {
      service: 'file-storage',
      statistics: {
        total_files: fileCount,
        active_files: activeFiles,
        archived_files: archivedFiles,
        total_size_bytes: parseInt(totalSize?.total || '0'),
        total_size_gb: (parseInt(totalSize?.total || '0') / (1024 * 1024 * 1024)).toFixed(2),
        policies: policyCount,
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
      await this.fileRepository.query('SELECT version()');
      const result = await this.fileRepository.query('SELECT version()');
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

    // MinIO
    try {
      const buckets = await this.minioProvider['minioClient'].listBuckets();
      dependencies.push({
        name: 'MinIO',
        status: 'healthy',
        buckets: buckets.length,
        endpoint: this.configService.get<string>('MINIO_ENDPOINT') || 'localhost',
      });
    } catch (error: any) {
      dependencies.push({
        name: 'MinIO',
        status: 'unhealthy',
        error: error.message,
      });
    }

    // Redis (for Bull queues)
    dependencies.push({
      name: 'Redis',
      status: this.configService.get<string>('REDIS_HOST') ? 'configured' : 'not_configured',
      host: this.configService.get<string>('REDIS_HOST') || 'localhost',
      port: this.configService.get<number>('REDIS_PORT') || 6379,
    });

    // Kafka
    dependencies.push({
      name: 'Kafka',
      status: this.configService.get('KAFKA_BROKERS') ? 'configured' : 'not_configured',
      brokers: this.configService.get('KAFKA_BROKERS', 'localhost:9092'),
    });

    return {
      service: 'file-storage',
      dependencies,
      timestamp: new Date().toISOString(),
    };
  }
}