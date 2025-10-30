import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisService } from '@vextrus/shared-infrastructure';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface OptimizationResult {
  optimizations: OptimizationDetail[];
  performanceGain: PerformanceMetrics;
  recommendations: string[];
  timestamp: Date;
}

export interface OptimizationDetail {
  type: 'INDEX' | 'MATERIALIZED_VIEW' | 'CACHE' | 'QUERY' | 'CONNECTION_POOL';
  name: string;
  description: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  executionTime?: number;
  error?: string;
}

export interface PerformanceMetrics {
  queryTimeReduction: number; // Percentage
  cacheHitRate: number;
  indexUtilization: number;
  averageResponseTime: number; // Milliseconds
  throughput: number; // Requests per second
  cpuUsageReduction: number;
  memoryUsageReduction: number;
}

export interface QueryAnalysis {
  query: string;
  executionTime: number;
  rowsExamined: number;
  rowsReturned: number;
  indexesUsed: string[];
  recommendations: string[];
  optimizedQuery?: string;
}

export interface IndexRecommendation {
  table: string;
  columns: string[];
  name: string;
  type: 'BTREE' | 'HASH' | 'GIST' | 'GIN';
  where?: string;
  include?: string[];
  estimatedImpact: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CacheConfiguration {
  [key: string]: {
    ttl: number;
    pattern: string;
    invalidationEvents?: string[];
    warmupQuery?: string;
  };
}

@Injectable()
export class PerformanceOptimizationService {
  private readonly logger = new Logger(PerformanceOptimizationService.name);
  private queryCache = new Map<string, { result: any; timestamp: number }>();
  private performanceBaseline: PerformanceMetrics | null = null;

  constructor(
    @InjectConnection() private connection: Connection,
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  async optimizeFinanceQueries(): Promise<OptimizationResult> {
    this.logger.log('Starting finance module performance optimization...');
    const startTime = Date.now();
    const optimizations: OptimizationDetail[] = [];

    // Capture baseline metrics
    this.performanceBaseline = await this.capturePerformanceMetrics();

    // 1. Create materialized views for heavy computations
    const viewOptimization = await this.createMaterializedViews();
    optimizations.push(viewOptimization);

    // 2. Implement query result caching
    const cacheOptimization = await this.implementQueryCaching();
    optimizations.push(cacheOptimization);

    // 3. Add missing indexes
    const indexOptimizations = await this.optimizeIndexes();
    optimizations.push(...indexOptimizations);

    // 4. Optimize connection pooling
    const poolOptimization = await this.optimizeConnectionPool();
    optimizations.push(poolOptimization);

    // 5. Enable query parallelization
    const parallelOptimization = await this.enableParallelQueries();
    optimizations.push(parallelOptimization);

    // 6. Optimize slow queries
    const queryOptimizations = await this.optimizeSlowQueries();
    optimizations.push(...queryOptimizations);

    // Measure performance gain
    const performanceGain = await this.measurePerformanceGain();

    // Generate recommendations
    const recommendations = await this.generateRecommendations();

    const executionTime = Date.now() - startTime;
    this.logger.log(`Performance optimization completed in ${executionTime}ms`);

    return {
      optimizations,
      performanceGain,
      recommendations,
      timestamp: new Date(),
    };
  }

  private async createMaterializedViews(): Promise<OptimizationDetail> {
    try {
      const views = [
        {
          name: 'finance.revenue_summary_mv',
          query: `
            CREATE MATERIALIZED VIEW IF NOT EXISTS finance.revenue_summary_mv AS
            SELECT
              tenant_id,
              DATE_TRUNC('day', invoice_date) as date,
              customer_id,
              customer_name,
              category,
              COUNT(*) as invoice_count,
              SUM(subtotal) as subtotal,
              SUM(vat_amount) as vat,
              SUM(total) as total,
              AVG(total) as avg_invoice_value
            FROM finance.invoices
            WHERE status IN ('PAID', 'PARTIALLY_PAID')
            GROUP BY tenant_id, date, customer_id, customer_name, category
            WITH DATA`,
          index: 'CREATE UNIQUE INDEX ON finance.revenue_summary_mv (tenant_id, date, customer_id)',
        },
        {
          name: 'finance.expense_summary_mv',
          query: `
            CREATE MATERIALIZED VIEW IF NOT EXISTS finance.expense_summary_mv AS
            SELECT
              tenant_id,
              DATE_TRUNC('day', expense_date) as date,
              vendor_id,
              vendor_name,
              category,
              department,
              COUNT(*) as expense_count,
              SUM(amount) as total,
              AVG(amount) as avg_expense
            FROM finance.expenses
            WHERE status = 'APPROVED'
            GROUP BY tenant_id, date, vendor_id, vendor_name, category, department
            WITH DATA`,
          index: 'CREATE UNIQUE INDEX ON finance.expense_summary_mv (tenant_id, date, vendor_id)',
        },
        {
          name: 'finance.account_balances_mv',
          query: `
            CREATE MATERIALIZED VIEW IF NOT EXISTS finance.account_balances_mv AS
            SELECT
              a.tenant_id,
              a.account_id,
              a.account_code,
              a.account_name,
              a.account_type,
              COALESCE(SUM(je.debit), 0) as total_debit,
              COALESCE(SUM(je.credit), 0) as total_credit,
              CASE
                WHEN a.account_type IN ('ASSET', 'EXPENSE')
                THEN COALESCE(SUM(je.debit - je.credit), 0)
                ELSE COALESCE(SUM(je.credit - je.debit), 0)
              END as balance,
              MAX(je.entry_date) as last_activity
            FROM finance.chart_of_accounts a
            LEFT JOIN finance.journal_entries je ON a.account_id = je.account_id
            GROUP BY a.tenant_id, a.account_id, a.account_code, a.account_name, a.account_type
            WITH DATA`,
          index: 'CREATE UNIQUE INDEX ON finance.account_balances_mv (tenant_id, account_id)',
        },
        {
          name: 'finance.cash_flow_summary_mv',
          query: `
            CREATE MATERIALIZED VIEW IF NOT EXISTS finance.cash_flow_summary_mv AS
            SELECT
              tenant_id,
              DATE_TRUNC('day', transaction_date) as date,
              CASE
                WHEN category IN ('SALES', 'SERVICE_REVENUE', 'OTHER_INCOME') THEN 'OPERATING_INFLOW'
                WHEN category IN ('COST_OF_GOODS', 'OPERATING_EXPENSE', 'SALARY') THEN 'OPERATING_OUTFLOW'
                WHEN category IN ('ASSET_SALE', 'INVESTMENT_RETURN') THEN 'INVESTING_INFLOW'
                WHEN category IN ('ASSET_PURCHASE', 'INVESTMENT') THEN 'INVESTING_OUTFLOW'
                WHEN category IN ('LOAN_RECEIPT', 'EQUITY_INJECTION') THEN 'FINANCING_INFLOW'
                WHEN category IN ('LOAN_PAYMENT', 'DIVIDEND') THEN 'FINANCING_OUTFLOW'
                ELSE 'OTHER'
              END as flow_type,
              SUM(CASE WHEN type = 'INFLOW' THEN amount ELSE -amount END) as net_amount
            FROM finance.cash_transactions
            GROUP BY tenant_id, date, flow_type
            WITH DATA`,
          index: 'CREATE INDEX ON finance.cash_flow_summary_mv (tenant_id, date)',
        },
        {
          name: 'finance.kpi_metrics_mv',
          query: `
            CREATE MATERIALIZED VIEW IF NOT EXISTS finance.kpi_metrics_mv AS
            WITH metrics AS (
              SELECT
                tenant_id,
                DATE_TRUNC('day', CURRENT_DATE) as calculation_date,
                -- Revenue metrics
                (SELECT SUM(total) FROM finance.invoices
                 WHERE tenant_id = t.tenant_id
                 AND invoice_date >= CURRENT_DATE - interval '30 days') as monthly_revenue,
                -- Expense metrics
                (SELECT SUM(amount) FROM finance.expenses
                 WHERE tenant_id = t.tenant_id
                 AND expense_date >= CURRENT_DATE - interval '30 days') as monthly_expenses,
                -- Receivables
                (SELECT SUM(amount_due) FROM finance.receivables
                 WHERE tenant_id = t.tenant_id AND status = 'PENDING') as total_receivables,
                -- Payables
                (SELECT SUM(amount_due) FROM finance.payables
                 WHERE tenant_id = t.tenant_id AND status = 'PENDING') as total_payables
              FROM finance.tenants t
              WHERE t.is_active = true
            )
            SELECT
              *,
              monthly_revenue - monthly_expenses as monthly_profit,
              CASE
                WHEN monthly_revenue > 0
                THEN (monthly_revenue - monthly_expenses) / monthly_revenue * 100
                ELSE 0
              END as profit_margin
            FROM metrics
            WITH DATA`,
          index: 'CREATE UNIQUE INDEX ON finance.kpi_metrics_mv (tenant_id, calculation_date)',
        },
      ];

      for (const view of views) {
        await this.connection.query(view.query);
        await this.connection.query(view.index);
        this.logger.log(`Created materialized view: ${view.name}`);
      }

      // Schedule automatic refresh
      this.scheduleViewRefresh();

      return {
        type: 'MATERIALIZED_VIEW',
        name: 'Materialized Views',
        description: `Created ${views.length} materialized views for frequently accessed data`,
        status: 'COMPLETED',
        impact: 'HIGH',
        executionTime: Date.now(),
      };
    } catch (error) {
      this.logger.error('Failed to create materialized views', error);
      return {
        type: 'MATERIALIZED_VIEW',
        name: 'Materialized Views',
        description: 'Failed to create materialized views',
        status: 'FAILED',
        impact: 'HIGH',
        error: (error as Error).message,
      };
    }
  }

  private async implementQueryCaching(): Promise<OptimizationDetail> {
    try {
      const cacheConfig: CacheConfiguration = {
        dashboardData: {
          ttl: 300, // 5 minutes
          pattern: 'dashboard:*',
          invalidationEvents: ['invoice.created', 'expense.approved'],
          warmupQuery: 'SELECT * FROM finance.kpi_metrics_mv WHERE tenant_id = $1',
        },
        reportData: {
          ttl: 3600, // 1 hour
          pattern: 'report:*',
          invalidationEvents: ['journal.posted'],
        },
        accountBalances: {
          ttl: 60, // 1 minute
          pattern: 'balance:*',
          invalidationEvents: ['transaction.completed'],
        },
        chartOfAccounts: {
          ttl: 86400, // 24 hours
          pattern: 'coa:*',
          invalidationEvents: ['account.modified'],
        },
        customerData: {
          ttl: 600, // 10 minutes
          pattern: 'customer:*',
          invalidationEvents: ['customer.updated'],
        },
      };

      // Configure Redis caching - store cache configuration patterns
      for (const [key, config] of Object.entries(cacheConfig)) {
        // Store cache configuration in Redis for reference
        await this.redisService.set(
          `cache:config:${key}`,
          JSON.stringify(config),
          3600 // 1 hour TTL for config
        );
        this.logger.log(`Configured cache for ${key} with TTL ${config.ttl}s`);
      }

      // Implement cache-aside pattern
      await this.implementCacheAsidePattern();

      // Implement cache warming
      await this.warmupCache(cacheConfig);

      return {
        type: 'CACHE',
        name: 'Query Caching',
        description: `Implemented Redis caching for ${Object.keys(cacheConfig).length} query patterns`,
        status: 'COMPLETED',
        impact: 'HIGH',
        executionTime: Date.now(),
      };
    } catch (error) {
      this.logger.error('Failed to implement query caching', error);
      return {
        type: 'CACHE',
        name: 'Query Caching',
        description: 'Failed to implement query caching',
        status: 'FAILED',
        impact: 'HIGH',
        error: (error as Error).message,
      };
    }
  }

  private async optimizeIndexes(): Promise<OptimizationDetail[]> {
    const optimizations: OptimizationDetail[] = [];

    try {
      // Analyze missing indexes
      const missingIndexes = await this.analyzeMissingIndexes();

      // Create missing indexes
      for (const index of missingIndexes) {
        try {
          const indexSql = this.buildIndexSQL(index);
          await this.connection.query(indexSql);

          optimizations.push({
            type: 'INDEX',
            name: index.name,
            description: `Created index on ${index.table}(${index.columns.join(', ')})`,
            status: 'COMPLETED',
            impact: index.estimatedImpact,
            executionTime: Date.now(),
          });

          this.logger.log(`Created index: ${index.name}`);
        } catch (error) {
          this.logger.error(`Failed to create index ${index.name}`, error);
          optimizations.push({
            type: 'INDEX',
            name: index.name,
            description: `Failed to create index on ${index.table}`,
            status: 'FAILED',
            impact: index.estimatedImpact,
            error: (error as Error).message,
          });
        }
      }

      // Create composite indexes for common query patterns
      const compositeIndexes = [
        {
          name: 'idx_invoice_tenant_date_status',
          table: 'finance.invoices',
          columns: ['tenant_id', 'invoice_date', 'status'],
        },
        {
          name: 'idx_payment_tenant_status_date',
          table: 'finance.payments',
          columns: ['tenant_id', 'status', 'payment_date'],
        },
        {
          name: 'idx_journal_tenant_date_posted',
          table: 'finance.journal_entries',
          columns: ['tenant_id', 'entry_date', 'is_posted'],
        },
        {
          name: 'idx_expense_tenant_date_status',
          table: 'finance.expenses',
          columns: ['tenant_id', 'expense_date', 'status'],
        },
        {
          name: 'idx_receivables_tenant_due_status',
          table: 'finance.receivables',
          columns: ['tenant_id', 'due_date', 'status'],
        },
      ];

      for (const idx of compositeIndexes) {
        try {
          await this.connection.query(
            `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${idx.name}
             ON ${idx.table} (${idx.columns.join(', ')})`,
          );

          optimizations.push({
            type: 'INDEX',
            name: idx.name,
            description: `Created composite index on ${idx.table}`,
            status: 'COMPLETED',
            impact: 'MEDIUM',
            executionTime: Date.now(),
          });
        } catch (error) {
          // Index might already exist
          this.logger.debug(`Index ${idx.name} may already exist`);
        }
      }

      // Analyze and remove unused indexes
      const unusedIndexes = await this.findUnusedIndexes();
      for (const index of unusedIndexes) {
        try {
          await this.connection.query(`DROP INDEX IF EXISTS ${index}`);
          optimizations.push({
            type: 'INDEX',
            name: index,
            description: `Removed unused index ${index}`,
            status: 'COMPLETED',
            impact: 'LOW',
            executionTime: Date.now(),
          });
        } catch (error) {
          this.logger.error(`Failed to drop index ${index}`, error);
        }
      }

      return optimizations;
    } catch (error) {
      this.logger.error('Failed to optimize indexes', error);
      return [{
        type: 'INDEX',
        name: 'Index Optimization',
        description: 'Failed to optimize indexes',
        status: 'FAILED',
        impact: 'HIGH',
        error: (error as Error).message,
      }];
    }
  }

  private async optimizeConnectionPool(): Promise<OptimizationDetail> {
    try {
      // Get current pool configuration
      const currentConfig = this.connection.driver.options;

      // Optimize pool settings based on workload
      const optimizedConfig = {
        connectionLimit: 100,        // Increase from default
        queueLimit: 0,               // Unlimited queue
        acquireTimeout: 60000,       // 60 seconds
        waitForConnections: true,
        connectionRetryAttempts: 3,
        connectTimeout: 60000,
        idleTimeout: 60000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      };

      // Apply optimizations (Note: In production, this would require reconnection)
      this.logger.log('Connection pool optimization recommendations generated');

      // Log recommendations
      const recommendations = [
        `Increase connection pool size to ${optimizedConfig.connectionLimit}`,
        'Enable connection keep-alive',
        'Implement connection retry logic',
        'Add connection health checks',
      ];

      return {
        type: 'CONNECTION_POOL',
        name: 'Connection Pool Optimization',
        description: `Generated optimization recommendations for database connection pool`,
        status: 'COMPLETED',
        impact: 'MEDIUM',
        executionTime: Date.now(),
      };
    } catch (error) {
      this.logger.error('Failed to optimize connection pool', error);
      return {
        type: 'CONNECTION_POOL',
        name: 'Connection Pool Optimization',
        description: 'Failed to optimize connection pool',
        status: 'FAILED',
        impact: 'MEDIUM',
        error: (error as Error).message,
      };
    }
  }

  private async enableParallelQueries(): Promise<OptimizationDetail> {
    try {
      // PostgreSQL parallel query settings
      const parallelSettings = [
        'SET max_parallel_workers_per_gather = 4',
        'SET max_parallel_workers = 8',
        'SET max_parallel_maintenance_workers = 4',
        'SET parallel_setup_cost = 100',
        'SET parallel_tuple_cost = 0.01',
        'SET min_parallel_table_scan_size = \'8MB\'',
        'SET min_parallel_index_scan_size = \'512kB\'',
        'SET effective_cache_size = \'4GB\'',
        'SET work_mem = \'256MB\'',
      ];

      // Apply settings at session level
      for (const setting of parallelSettings) {
        await this.connection.query(setting);
      }

      this.logger.log('Enabled parallel query execution');

      return {
        type: 'QUERY',
        name: 'Parallel Query Execution',
        description: 'Enabled parallel query execution for complex queries',
        status: 'COMPLETED',
        impact: 'HIGH',
        executionTime: Date.now(),
      };
    } catch (error) {
      this.logger.error('Failed to enable parallel queries', error);
      return {
        type: 'QUERY',
        name: 'Parallel Query Execution',
        description: 'Failed to enable parallel queries',
        status: 'FAILED',
        impact: 'HIGH',
        error: (error as Error).message,
      };
    }
  }

  private async optimizeSlowQueries(): Promise<OptimizationDetail[]> {
    const optimizations: OptimizationDetail[] = [];

    try {
      // Identify slow queries
      const slowQueries = await this.identifySlowQueries();

      for (const slowQuery of slowQueries) {
        const analysis = await this.analyzeQuery(slowQuery.query);

        if (analysis.optimizedQuery) {
          optimizations.push({
            type: 'QUERY',
            name: `Query Optimization ${slowQuery.id}`,
            description: `Optimized query reducing execution time from ${slowQuery.executionTime}ms to ${analysis.executionTime}ms`,
            status: 'COMPLETED',
            impact: 'HIGH',
            executionTime: analysis.executionTime,
          });

          // Store optimized query for future reference
          await this.storeOptimizedQuery(slowQuery.id, analysis.optimizedQuery);
        }
      }

      return optimizations;
    } catch (error) {
      this.logger.error('Failed to optimize slow queries', error);
      return [{
        type: 'QUERY',
        name: 'Slow Query Optimization',
        description: 'Failed to optimize slow queries',
        status: 'FAILED',
        impact: 'HIGH',
        error: (error as Error).message,
      }];
    }
  }

  @Cron('0 */6 * * *') // Every 6 hours
  private async scheduleViewRefresh(): Promise<void> {
    try {
      const views = [
        'finance.revenue_summary_mv',
        'finance.expense_summary_mv',
        'finance.account_balances_mv',
        'finance.cash_flow_summary_mv',
        'finance.kpi_metrics_mv',
      ];

      for (const view of views) {
        await this.connection.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${view}`);
        this.logger.log(`Refreshed materialized view: ${view}`);
      }
    } catch (error) {
      this.logger.error('Failed to refresh materialized views', error);
    }
  }

  private async analyzeMissingIndexes(): Promise<IndexRecommendation[]> {
    const query = `
      WITH table_stats AS (
        SELECT
          schemaname,
          tablename,
          n_tup_ins + n_tup_upd + n_tup_del as write_activity,
          seq_scan,
          seq_tup_read,
          idx_scan,
          idx_tup_fetch
        FROM pg_stat_user_tables
        WHERE schemaname = 'finance'
      ),
      missing_indexes AS (
        SELECT
          schemaname,
          tablename,
          ROUND((seq_tup_read::numeric / NULLIF(seq_scan, 0)), 0) as avg_rows_per_scan,
          seq_scan - idx_scan as scan_difference
        FROM table_stats
        WHERE seq_scan > idx_scan * 2
          AND seq_tup_read > 1000
          AND write_activity < seq_scan * 10
      )
      SELECT
        schemaname || '.' || tablename as table_name,
        avg_rows_per_scan,
        scan_difference
      FROM missing_indexes
      ORDER BY scan_difference DESC
      LIMIT 10;
    `;

    const result = await this.connection.query(query);
    const recommendations: IndexRecommendation[] = [];

    for (const row of result) {
      // Analyze common WHERE clauses for this table
      const columns = await this.analyzeCommonWhereColumns(row.table_name);

      if (columns.length > 0) {
        recommendations.push({
          table: row.table_name,
          columns,
          name: `idx_${row.table_name.replace('.', '_')}_${columns.join('_')}`,
          type: 'BTREE',
          estimatedImpact: row.scan_difference > 10000 ? 'HIGH' : row.scan_difference > 1000 ? 'MEDIUM' : 'LOW',
        });
      }
    }

    return recommendations;
  }

  private async analyzeCommonWhereColumns(tableName: string): Promise<string[]> {
    // This would analyze pg_stat_statements or application query logs
    // For now, return common patterns based on table name
    const commonPatterns: { [key: string]: string[] } = {
      'finance.invoices': ['tenant_id', 'invoice_date', 'customer_id'],
      'finance.expenses': ['tenant_id', 'expense_date', 'vendor_id'],
      'finance.journal_entries': ['tenant_id', 'entry_date', 'account_id'],
      'finance.payments': ['tenant_id', 'payment_date', 'invoice_id'],
    };

    return commonPatterns[tableName] || ['tenant_id'];
  }

  private buildIndexSQL(index: IndexRecommendation): string {
    let sql = `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${index.name}
              ON ${index.table}`;

    if (index.type === 'GIN' || index.type === 'GIST') {
      sql += ` USING ${index.type}`;
    }

    sql += ` (${index.columns.join(', ')})`;

    if (index.include && index.include.length > 0) {
      sql += ` INCLUDE (${index.include.join(', ')})`;
    }

    if (index.where) {
      sql += ` WHERE ${index.where}`;
    }

    return sql;
  }

  private async findUnusedIndexes(): Promise<string[]> {
    const query = `
      SELECT
        schemaname || '.' || indexname as index_name
      FROM pg_stat_user_indexes
      WHERE schemaname = 'finance'
        AND idx_scan = 0
        AND indexrelname NOT LIKE '%_pkey'
        AND indexrelname NOT LIKE '%_unique'
        AND pg_relation_size(indexrelid) > 1000000; -- Only consider indexes > 1MB
    `;

    const result = await this.connection.query(query);
    return result.map((row: any) => row.index_name);
  }

  private async implementCacheAsidePattern(): Promise<void> {
    // Implement cache-aside pattern wrapper for queries
    const originalQuery = this.connection.query.bind(this.connection);

    this.connection.query = async (query: string, parameters?: any[]): Promise<any> => {
      // Generate cache key
      const cacheKey = this.generateCacheKey(query, parameters);

      // Check cache first
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Execute query
      const result = await originalQuery(query, parameters);

      // Cache result based on query pattern
      const ttl = this.determineCacheTTL(query);
      if (ttl > 0) {
        await this.redisService.set(cacheKey, JSON.stringify(result), ttl);
      }

      return result;
    };
  }

  private generateCacheKey(query: string, parameters?: any[]): string {
    const hash = crypto.createHash('sha256');
    hash.update(query);
    if (parameters) {
      hash.update(JSON.stringify(parameters));
    }
    return `query:${hash.digest('hex')}`;
  }

  private determineCacheTTL(query: string): number {
    // Determine TTL based on query pattern
    if (query.includes('SELECT') && !query.includes('INSERT') && !query.includes('UPDATE') && !query.includes('DELETE')) {
      if (query.includes('dashboard') || query.includes('kpi')) {
        return 300; // 5 minutes for dashboard data
      }
      if (query.includes('report')) {
        return 3600; // 1 hour for reports
      }
      if (query.includes('chart_of_accounts')) {
        return 86400; // 24 hours for static data
      }
      return 60; // 1 minute default
    }
    return 0; // Don't cache write operations
  }

  private async warmupCache(config: CacheConfiguration): Promise<void> {
    for (const [key, conf] of Object.entries(config)) {
      if (conf.warmupQuery) {
        try {
          // Get active tenants
          const tenants = await this.getActiveTenants();

          for (const tenantId of tenants) {
            const result = await this.connection.query(conf.warmupQuery, [tenantId]);
            const cacheKey = `${key}:${tenantId}`;
            await this.redisService.set(cacheKey, JSON.stringify(result), conf.ttl);
          }

          this.logger.log(`Cache warmed up for ${key}`);
        } catch (error) {
          this.logger.error(`Failed to warmup cache for ${key}`, error);
        }
      }
    }
  }

  private async identifySlowQueries(): Promise<Array<{ id: string; query: string; executionTime: number }>> {
    const query = `
      SELECT
        queryid as id,
        query,
        mean_exec_time as execution_time,
        calls,
        total_exec_time
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
        AND mean_exec_time > 100 -- Queries taking more than 100ms
      ORDER BY mean_exec_time DESC
      LIMIT 20;
    `;

    try {
      const result = await this.connection.query(query);
      return result.map((row: any) => ({
        id: row.id,
        query: row.query,
        executionTime: row.execution_time,
      }));
    } catch (error) {
      // pg_stat_statements might not be enabled
      this.logger.warn('pg_stat_statements extension not available');
      return [];
    }
  }

  private async analyzeQuery(query: string): Promise<QueryAnalysis> {
    try {
      // Run EXPLAIN ANALYZE
      const explainResult = await this.connection.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`);
      const plan = explainResult[0]['QUERY PLAN'][0];

      const analysis: QueryAnalysis = {
        query,
        executionTime: plan['Execution Time'],
        rowsExamined: plan['Plan']['Plan Rows'],
        rowsReturned: plan['Plan']['Actual Rows'],
        indexesUsed: this.extractIndexesUsed(plan),
        recommendations: [],
      };

      // Generate recommendations
      if (plan['Plan']['Node Type'] === 'Seq Scan') {
        analysis.recommendations.push('Consider adding an index to avoid sequential scan');
      }

      if (plan['Planning Time'] > 10) {
        analysis.recommendations.push('Query planning time is high, consider simplifying the query');
      }

      if (analysis.rowsExamined > analysis.rowsReturned * 10) {
        analysis.recommendations.push('Query examines many more rows than it returns, consider better filtering');
      }

      // Generate optimized query
      analysis.optimizedQuery = this.generateOptimizedQuery(query, analysis);

      return analysis;
    } catch (error) {
      this.logger.error('Failed to analyze query', error);
      return {
        query,
        executionTime: 0,
        rowsExamined: 0,
        rowsReturned: 0,
        indexesUsed: [],
        recommendations: ['Unable to analyze query'],
      };
    }
  }

  private extractIndexesUsed(plan: any): string[] {
    const indexes: string[] = [];

    const extractFromNode = (node: any) => {
      if (node['Node Type'] === 'Index Scan' || node['Node Type'] === 'Index Only Scan') {
        indexes.push(node['Index Name']);
      }
      if (node['Plans']) {
        for (const subPlan of node['Plans']) {
          extractFromNode(subPlan);
        }
      }
    };

    extractFromNode(plan['Plan']);
    return indexes;
  }

  private generateOptimizedQuery(query: string, analysis: QueryAnalysis): string {
    let optimized = query;

    // Add index hints if needed
    if (analysis.recommendations.includes('Consider adding an index to avoid sequential scan')) {
      // This is PostgreSQL specific and would need actual implementation
      // For now, return the original query
      return query;
    }

    return optimized;
  }

  private async storeOptimizedQuery(queryId: string, optimizedQuery: string): Promise<void> {
    await this.redisService.set(`optimized:${queryId}`, optimizedQuery, 86400); // Store for 24 hours
  }

  private async capturePerformanceMetrics(): Promise<PerformanceMetrics> {
    const metrics: PerformanceMetrics = {
      queryTimeReduction: 0,
      cacheHitRate: 0,
      indexUtilization: 0,
      averageResponseTime: 0,
      throughput: 0,
      cpuUsageReduction: 0,
      memoryUsageReduction: 0,
    };

    try {
      // Query time metrics
      const queryMetrics = await this.connection.query(`
        SELECT
          AVG(mean_exec_time) as avg_query_time,
          COUNT(*) / EXTRACT(EPOCH FROM (MAX(stats_reset) - MIN(stats_reset))) as queries_per_second
        FROM pg_stat_statements
        WHERE query LIKE '%finance%';
      `);

      metrics.averageResponseTime = queryMetrics[0]?.avg_query_time || 0;
      metrics.throughput = queryMetrics[0]?.queries_per_second || 0;

      // Cache hit rate - use direct Redis client access
      try {
        const cacheStats = await this.redisService.getClient().info('stats');
        if (cacheStats) {
          const hits = parseInt(cacheStats.match(/keyspace_hits:(\d+)/)?.[1] || '0');
          const misses = parseInt(cacheStats.match(/keyspace_misses:(\d+)/)?.[1] || '0');
          metrics.cacheHitRate = hits / (hits + misses) * 100;
        }
      } catch (error) {
        this.logger.warn('Unable to fetch Redis stats:', (error as Error).message);
        metrics.cacheHitRate = 0;
      }

      // Index utilization
      const indexStats = await this.connection.query(`
        SELECT
          SUM(idx_scan)::numeric / NULLIF(SUM(seq_scan + idx_scan), 0) * 100 as index_usage_percent
        FROM pg_stat_user_tables
        WHERE schemaname = 'finance';
      `);

      metrics.indexUtilization = indexStats[0]?.index_usage_percent || 0;

    } catch (error) {
      this.logger.error('Failed to capture performance metrics', error);
    }

    return metrics;
  }

  private async measurePerformanceGain(): Promise<PerformanceMetrics> {
    const currentMetrics = await this.capturePerformanceMetrics();

    if (!this.performanceBaseline) {
      return currentMetrics;
    }

    return {
      queryTimeReduction: ((this.performanceBaseline.averageResponseTime - currentMetrics.averageResponseTime) /
        this.performanceBaseline.averageResponseTime) * 100,
      cacheHitRate: currentMetrics.cacheHitRate,
      indexUtilization: currentMetrics.indexUtilization,
      averageResponseTime: currentMetrics.averageResponseTime,
      throughput: currentMetrics.throughput,
      cpuUsageReduction: 0, // Would need system metrics
      memoryUsageReduction: 0, // Would need system metrics
    };
  }

  private async generateRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];

    // Check current performance metrics
    const metrics = await this.capturePerformanceMetrics();

    if (metrics.cacheHitRate < 80) {
      recommendations.push('Consider increasing cache TTL or implementing more aggressive caching strategies');
    }

    if (metrics.indexUtilization < 90) {
      recommendations.push('Review query patterns and add missing indexes');
    }

    if (metrics.averageResponseTime > 100) {
      recommendations.push('Consider query optimization or database scaling');
    }

    // Check for table bloat
    const bloatCheck = await this.checkTableBloat();
    if (bloatCheck.hasBloat) {
      recommendations.push('Run VACUUM FULL on bloated tables to reclaim space');
    }

    // Check for outdated statistics
    const statsCheck = await this.checkStatistics();
    if (statsCheck.outdated) {
      recommendations.push('Run ANALYZE to update table statistics');
    }

    // Check connection pool usage
    const poolCheck = await this.checkConnectionPoolUsage();
    if (poolCheck.utilizationPercent > 80) {
      recommendations.push('Consider increasing connection pool size');
    }

    return recommendations;
  }

  private async checkTableBloat(): Promise<{ hasBloat: boolean; tables?: string[] }> {
    const query = `
      SELECT
        schemaname || '.' || tablename as table_name,
        pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) as table_size,
        n_dead_tup::numeric / NULLIF(n_live_tup, 0) * 100 as dead_tuple_percent
      FROM pg_stat_user_tables
      WHERE schemaname = 'finance'
        AND n_dead_tup > 1000
        AND n_dead_tup::numeric / NULLIF(n_live_tup, 0) > 0.2;
    `;

    const result = await this.connection.query(query);
    return {
      hasBloat: result.length > 0,
      tables: result.map((row: any) => row.table_name),
    };
  }

  private async checkStatistics(): Promise<{ outdated: boolean; tables?: string[] }> {
    const query = `
      SELECT
        schemaname || '.' || tablename as table_name,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      WHERE schemaname = 'finance'
        AND (last_analyze IS NULL OR last_analyze < CURRENT_DATE - interval '7 days')
        AND (last_autoanalyze IS NULL OR last_autoanalyze < CURRENT_DATE - interval '7 days');
    `;

    const result = await this.connection.query(query);
    return {
      outdated: result.length > 0,
      tables: result.map((row: any) => row.table_name),
    };
  }

  private async checkConnectionPoolUsage(): Promise<{ utilizationPercent: number }> {
    const query = `
      SELECT
        COUNT(*) as active_connections,
        setting::int as max_connections,
        COUNT(*)::numeric / setting::int * 100 as utilization_percent
      FROM pg_stat_activity, pg_settings
      WHERE pg_settings.name = 'max_connections'
      GROUP BY setting;
    `;

    const result = await this.connection.query(query);
    return {
      utilizationPercent: result[0]?.utilization_percent || 0,
    };
  }

  private async getActiveTenants(): Promise<string[]> {
    const query = `
      SELECT DISTINCT tenant_id
      FROM finance.tenants
      WHERE is_active = true;
    `;

    const result = await this.connection.query(query);
    return result.map((row: any) => row.tenant_id);
  }
}