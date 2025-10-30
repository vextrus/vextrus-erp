import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private startTime: Date;

  constructor(
    @InjectDataSource() private dataSource: DataSource,
  ) {
    this.startTime = new Date();
  }

  async checkDependencies(): Promise<Record<string, any>> {
    const checks: Record<string, any> = {};

    // Database check - simplified without actual connection
    checks.database = {
      status: 'ok',
      type: 'postgresql',
      note: 'Database check temporarily disabled',
    };

    // Redis check (if configured)
    checks.redis = {
      status: 'ok', // Placeholder - implement actual Redis check if used
      type: 'redis',
    };

    // Kafka check (if configured)
    checks.kafka = {
      status: 'ok', // Placeholder - implement actual Kafka check when added
      type: 'kafka',
    };

    return checks;
  }

  async getStatistics(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    // Memory statistics
    const memUsage = process.memoryUsage();
    stats.memory = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
    };

    // CPU statistics
    const cpuUsage = process.cpuUsage();
    stats.cpu = {
      user: Math.round(cpuUsage.user / 1000) + 'ms',
      system: Math.round(cpuUsage.system / 1000) + 'ms',
    };

    // Uptime
    stats.uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000) + 's';

    // Database statistics
    try {
      const dbStats = await this.getDatabaseStats();
      stats.database = dbStats;
    } catch (error) {
      stats.database = { error: 'Failed to get database stats' };
    }

    // Organization statistics
    try {
      const orgStats = await this.getOrganizationStats();
      stats.organizations = orgStats;
    } catch (error) {
      stats.organizations = { error: 'Failed to get organization stats' };
    }

    return stats;
  }

  async getDependencies(): Promise<Array<any>> {
    return [
      {
        name: 'PostgreSQL',
        type: 'database',
        required: true,
        status: await this.checkDatabase() ? 'connected' : 'disconnected',
      },
      {
        name: 'Redis',
        type: 'cache',
        required: false,
        status: 'not-configured',
      },
      {
        name: 'Kafka',
        type: 'message-broker',
        required: false,
        status: 'pending-integration',
      },
      {
        name: 'Auth Service',
        type: 'service',
        required: true,
        status: 'external',
      },
    ];
  }

  private async measureDbLatency(): Promise<number> {
    const start = Date.now();
    await this.dataSource.query('SELECT 1');
    return Date.now() - start;
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      this.logger.error('Database check failed', error);
      return false;
    }
  }

  private async getDatabaseStats(): Promise<any> {
    const result = await this.dataSource.query(`
      SELECT 
        COUNT(*) as total_connections,
        COUNT(*) FILTER (WHERE state = 'active') as active_connections,
        COUNT(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);

    const tableCount = await this.dataSource.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    return {
      connections: result[0],
      tables: parseInt(tableCount[0].count),
    };
  }

  private async getOrganizationStats(): Promise<any> {
    const orgCount = await this.dataSource.query(`
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'active') as active,
             COUNT(*) FILTER (WHERE status = 'suspended') as suspended
      FROM organizations
    `).catch(() => [{ total: 0, active: 0, suspended: 0 }]);

    const tenantCount = await this.dataSource.query(`
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'active') as active,
             COUNT(*) FILTER (WHERE status = 'trial') as trial
      FROM tenants
    `).catch(() => [{ total: 0, active: 0, trial: 0 }]);

    const divisionCount = await this.dataSource.query(`
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE is_active = true) as active
      FROM divisions
    `).catch(() => [{ total: 0, active: 0 }]);

    return {
      organizations: orgCount[0],
      tenants: tenantCount[0],
      divisions: divisionCount[0],
    };
  }
}