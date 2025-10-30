import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { RedisService } from '@vextrus/shared-infrastructure';
import { EventBus } from '@nestjs/cqrs';
import Decimal from 'decimal.js';
import { BengaliLocalizationService } from './bengali-localization.service';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DashboardData {
  kpis: KPIMetrics;
  revenue: RevenueAnalytics;
  expenses: ExpenseAnalytics;
  cashFlow: CashFlowAnalytics;
  workingCapital: WorkingCapitalMetrics;
  predictions: PredictiveAnalytics;
  charts: ChartCollection;
  metadata: DashboardMetadata;
}

export interface KPIMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  cashPosition: number;
  dso: number; // Days Sales Outstanding
  dpo: number; // Days Payables Outstanding
  currentRatio: number;
  quickRatio: number;
  debtToEquity: number;
  returnOnAssets: number;
  returnOnEquity: number;
}

export interface RevenueAnalytics {
  total: number;
  byCategory: Record<string, number>;
  topCustomers: Array<{ id: string; name: string; amount: number }>;
  byProduct: Record<string, number>;
  growthRate: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  dailyData: Array<{ date: string; amount: number }>;
  chart?: ChartData;
}

export interface ExpenseAnalytics {
  total: number;
  byCategory: Record<string, number>;
  topVendors: Array<{ id: string; name: string; amount: number }>;
  byDepartment: Record<string, number>;
  trend: 'UP' | 'DOWN' | 'STABLE';
  chart?: ChartData;
}

export interface CashFlowAnalytics {
  operating: number;
  investing: number;
  financing: number;
  net: number;
  opening: number;
  closing: number;
  forecast: Array<{ date: string; projected: number }>;
  chart?: ChartData;
}

export interface WorkingCapitalMetrics {
  receivables: number;
  payables: number;
  inventory: number;
  net: number;
  trend: Array<{ date: string; amount: number }>;
}

export interface PredictiveAnalytics {
  revenueNext30Days: number;
  cashFlowNext30Days: number;
  riskAlerts: Array<{ type: string; message: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }>;
  opportunities: Array<{ type: string; message: string; potentialValue: number }>;
}

export interface ChartData {
  type: 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'scatter';
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
      tension?: number;
      borderDash?: number[];
    }>;
  };
  options?: any;
}

export interface ChartCollection {
  profitLoss: ChartData;
  balanceSheet: ChartData;
  ratioAnalysis: ChartData;
  trendAnalysis: ChartData;
  cashFlowWaterfall: ChartData;
  revenueBreakdown: ChartData;
  expenseBreakdown: ChartData;
}

export interface DashboardMetadata {
  lastUpdated: Date;
  dataFreshness: 'real-time' | 'cached' | 'stale';
  queryTime: number;
  cacheHit: boolean;
  tenantId: string;
  period: DateRange;
}

@Injectable()
export class AnalyticsDashboardService {
  private readonly logger = new Logger(AnalyticsDashboardService.name);

  constructor(
    @InjectConnection() private connection: Connection,
    private redisService: RedisService,
    private eventBus: EventBus,
    private bengaliService: BengaliLocalizationService,
  ) {}

  async getFinancialDashboard(
    tenantId: string,
    period: DateRange,
    options?: {
      forceRefresh?: boolean;
      includeCharts?: boolean;
      locale?: 'en' | 'bn';
    },
  ): Promise<DashboardData> {
    const cacheKey = `dashboard:${tenantId}:${period.from.toISOString()}:${period.to.toISOString()}`;

    // Try cache first unless force refresh
    if (!options?.forceRefresh) {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        data.metadata.dataFreshness = 'cached';
        data.metadata.cacheHit = true;
        return data;
      }
    }

    const startTime = Date.now();

    // Parallel data fetching with optimized queries
    const [
      revenue,
      expenses,
      cashFlow,
      receivables,
      payables,
      profitability,
      trends,
      forecasts,
      ratios,
    ] = await Promise.all([
      this.calculateRevenue(tenantId, period),
      this.calculateExpenses(tenantId, period),
      this.calculateCashFlow(tenantId, period),
      this.getReceivables(tenantId),
      this.getPayables(tenantId),
      this.calculateProfitability(tenantId, period),
      this.getTrends(tenantId, period),
      this.getPredictiveForecast(tenantId),
      this.calculateFinancialRatios(tenantId),
    ]);

    // Calculate KPIs
    const kpis = this.calculateKPIs(revenue, expenses, cashFlow, receivables, payables, ratios);

    // Generate charts if requested
    const charts = options?.includeCharts
      ? await this.generateCharts(revenue, expenses, cashFlow, profitability, trends)
      : {} as ChartCollection;

    const dashboard: DashboardData = {
      kpis,
      revenue: {
        ...revenue,
        chart: options?.includeCharts ? this.generateRevenueChart(revenue) : undefined,
      },
      expenses: {
        ...expenses,
        chart: options?.includeCharts ? this.generateExpenseChart(expenses) : undefined,
      },
      cashFlow: {
        ...cashFlow,
        chart: options?.includeCharts ? this.generateCashFlowChart(cashFlow) : undefined,
      },
      workingCapital: {
        receivables: receivables.total,
        payables: payables.total,
        inventory: 0, // Will be integrated with inventory service
        net: receivables.total - payables.total,
        trend: await this.calculateWorkingCapitalTrend(tenantId, period),
      },
      predictions: forecasts,
      charts,
      metadata: {
        lastUpdated: new Date(),
        dataFreshness: 'real-time',
        queryTime: Date.now() - startTime,
        cacheHit: false,
        tenantId,
        period,
      },
    };

    // Localize if Bengali requested
    if (options?.locale === 'bn') {
      dashboard.revenue.chart = this.localizeToBengali(dashboard.revenue.chart);
      dashboard.expenses.chart = this.localizeToBengali(dashboard.expenses.chart);
    }

    // Cache for 5 minutes
    await this.redisService.set(cacheKey, JSON.stringify(dashboard), 300);

    // Track analytics usage
    this.trackAnalyticsUsage(tenantId, Date.now() - startTime);

    return dashboard;
  }

  private async calculateRevenue(
    tenantId: string,
    period: DateRange,
  ): Promise<RevenueAnalytics> {
    // Use materialized view for better performance
    const query = `
      SELECT
        DATE_TRUNC('day', invoice_date) as date,
        category,
        customer_id,
        customer_name,
        product_category,
        SUM(total) as total,
        COUNT(*) as count,
        AVG(total) as average
      FROM finance.invoices
      WHERE tenant_id = $1
        AND invoice_date BETWEEN $2 AND $3
        AND status IN ('PAID', 'PARTIALLY_PAID')
      GROUP BY ROLLUP(date, category, customer_id, customer_name, product_category)
      ORDER BY date;
    `;

    const result = await this.connection.query(query, [
      tenantId,
      period.from,
      period.to,
    ]);

    return this.processRevenueData(result);
  }

  private async calculateExpenses(
    tenantId: string,
    period: DateRange,
  ): Promise<ExpenseAnalytics> {
    const query = `
      SELECT
        DATE_TRUNC('day', expense_date) as date,
        category,
        vendor_id,
        vendor_name,
        department,
        SUM(amount) as total,
        COUNT(*) as count
      FROM finance.expenses
      WHERE tenant_id = $1
        AND expense_date BETWEEN $2 AND $3
        AND status = 'APPROVED'
      GROUP BY ROLLUP(date, category, vendor_id, vendor_name, department)
      ORDER BY date;
    `;

    const result = await this.connection.query(query, [
      tenantId,
      period.from,
      period.to,
    ]);

    return this.processExpenseData(result);
  }

  private async calculateCashFlow(
    tenantId: string,
    period: DateRange,
  ): Promise<CashFlowAnalytics> {
    // Calculate operating, investing, and financing cash flows
    const query = `
      WITH cash_movements AS (
        SELECT
          CASE
            WHEN category IN ('SALES', 'SERVICE_REVENUE') THEN 'operating'
            WHEN category IN ('ASSET_PURCHASE', 'INVESTMENT') THEN 'investing'
            WHEN category IN ('LOAN', 'EQUITY') THEN 'financing'
            ELSE 'operating'
          END as flow_type,
          SUM(CASE WHEN type = 'INFLOW' THEN amount ELSE -amount END) as net_amount
        FROM finance.cash_transactions
        WHERE tenant_id = $1
          AND transaction_date BETWEEN $2 AND $3
        GROUP BY flow_type
      ),
      opening_balance AS (
        SELECT balance as opening
        FROM finance.cash_accounts
        WHERE tenant_id = $1
          AND date = $2::date - interval '1 day'
        LIMIT 1
      )
      SELECT
        COALESCE((SELECT net_amount FROM cash_movements WHERE flow_type = 'operating'), 0) as operating,
        COALESCE((SELECT net_amount FROM cash_movements WHERE flow_type = 'investing'), 0) as investing,
        COALESCE((SELECT net_amount FROM cash_movements WHERE flow_type = 'financing'), 0) as financing,
        COALESCE((SELECT opening FROM opening_balance), 0) as opening
    `;

    const result = await this.connection.query(query, [
      tenantId,
      period.from,
      period.to,
    ]);

    const cashFlow = result[0] || { operating: 0, investing: 0, financing: 0, opening: 0 };

    // Calculate net and closing
    cashFlow.net = cashFlow.operating + cashFlow.investing + cashFlow.financing;
    cashFlow.closing = cashFlow.opening + cashFlow.net;

    // Get forecast using ML model (simplified for now)
    cashFlow.forecast = await this.generateCashFlowForecast(tenantId, cashFlow);

    return cashFlow;
  }

  private async getReceivables(tenantId: string): Promise<any> {
    const query = `
      SELECT
        SUM(amount_due) as total,
        COUNT(*) as count,
        AVG(EXTRACT(DAY FROM CURRENT_DATE - due_date)) as avg_days_overdue,
        SUM(CASE WHEN due_date < CURRENT_DATE THEN amount_due ELSE 0 END) as overdue,
        SUM(CASE WHEN due_date >= CURRENT_DATE THEN amount_due ELSE 0 END) as current
      FROM finance.receivables
      WHERE tenant_id = $1
        AND status = 'PENDING';
    `;

    const result = await this.connection.query(query, [tenantId]);
    return result[0] || { total: 0, count: 0, overdue: 0, current: 0 };
  }

  private async getPayables(tenantId: string): Promise<any> {
    const query = `
      SELECT
        SUM(amount_due) as total,
        COUNT(*) as count,
        AVG(EXTRACT(DAY FROM due_date - CURRENT_DATE)) as avg_days_until_due,
        SUM(CASE WHEN due_date < CURRENT_DATE THEN amount_due ELSE 0 END) as overdue,
        SUM(CASE WHEN due_date >= CURRENT_DATE THEN amount_due ELSE 0 END) as current
      FROM finance.payables
      WHERE tenant_id = $1
        AND status = 'PENDING';
    `;

    const result = await this.connection.query(query, [tenantId]);
    return result[0] || { total: 0, count: 0, overdue: 0, current: 0 };
  }

  private async calculateProfitability(
    tenantId: string,
    period: DateRange,
  ): Promise<any> {
    const query = `
      WITH revenue_data AS (
        SELECT SUM(total) as revenue
        FROM finance.invoices
        WHERE tenant_id = $1
          AND invoice_date BETWEEN $2 AND $3
          AND status IN ('PAID', 'PARTIALLY_PAID')
      ),
      expense_data AS (
        SELECT SUM(amount) as expenses
        FROM finance.expenses
        WHERE tenant_id = $1
          AND expense_date BETWEEN $2 AND $3
          AND status = 'APPROVED'
      ),
      cogs_data AS (
        SELECT SUM(cost) as cogs
        FROM finance.cost_of_goods_sold
        WHERE tenant_id = $1
          AND date BETWEEN $2 AND $3
      )
      SELECT
        r.revenue,
        e.expenses,
        c.cogs,
        (r.revenue - c.cogs) as gross_profit,
        (r.revenue - c.cogs) / NULLIF(r.revenue, 0) * 100 as gross_margin,
        (r.revenue - e.expenses) as operating_profit,
        (r.revenue - e.expenses) / NULLIF(r.revenue, 0) * 100 as operating_margin,
        (r.revenue - e.expenses - c.cogs) as net_profit,
        (r.revenue - e.expenses - c.cogs) / NULLIF(r.revenue, 0) * 100 as net_margin
      FROM revenue_data r, expense_data e, cogs_data c;
    `;

    const result = await this.connection.query(query, [tenantId, period.from, period.to]);
    return result[0] || {};
  }

  private async getTrends(tenantId: string, period: DateRange): Promise<any> {
    // Calculate trends over time periods
    const query = `
      WITH daily_metrics AS (
        SELECT
          DATE_TRUNC('day', date) as day,
          SUM(revenue) as daily_revenue,
          SUM(expenses) as daily_expenses,
          SUM(revenue - expenses) as daily_profit
        FROM (
          SELECT invoice_date as date, total as revenue, 0 as expenses
          FROM finance.invoices
          WHERE tenant_id = $1 AND status IN ('PAID', 'PARTIALLY_PAID')
          UNION ALL
          SELECT expense_date as date, 0 as revenue, amount as expenses
          FROM finance.expenses
          WHERE tenant_id = $1 AND status = 'APPROVED'
        ) combined
        WHERE date BETWEEN $2 AND $3
        GROUP BY day
        ORDER BY day
      )
      SELECT
        day,
        daily_revenue,
        daily_expenses,
        daily_profit,
        AVG(daily_revenue) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as revenue_7day_avg,
        AVG(daily_revenue) OVER (ORDER BY day ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as revenue_30day_avg
      FROM daily_metrics;
    `;

    const result = await this.connection.query(query, [tenantId, period.from, period.to]);
    return result;
  }

  private async getPredictiveForecast(tenantId: string): Promise<PredictiveAnalytics> {
    // Simplified forecast - in production would use ML models
    const revenueGrowthRate = 0.05; // 5% monthly growth assumption
    const currentRevenue = await this.getCurrentMonthRevenue(tenantId);

    const predictions: PredictiveAnalytics = {
      revenueNext30Days: currentRevenue * (1 + revenueGrowthRate),
      cashFlowNext30Days: currentRevenue * 0.7, // 70% collection rate assumption
      riskAlerts: [],
      opportunities: [],
    };

    // Check for risk alerts
    const receivables = await this.getReceivables(tenantId);
    if (receivables.overdue > receivables.total * 0.3) {
      predictions.riskAlerts.push({
        type: 'RECEIVABLES',
        message: 'High percentage of overdue receivables (>30%)',
        severity: 'HIGH',
      });
    }

    // Check for opportunities
    const topCustomers = await this.getTopCustomers(tenantId);
    for (const customer of topCustomers) {
      if (customer.growthRate > 0.1) {
        predictions.opportunities.push({
          type: 'CUSTOMER_GROWTH',
          message: `${customer.name} showing ${(customer.growthRate * 100).toFixed(1)}% growth`,
          potentialValue: customer.projectedRevenue,
        });
      }
    }

    return predictions;
  }

  private async calculateFinancialRatios(tenantId: string): Promise<any> {
    const query = `
      WITH balance_sheet AS (
        SELECT
          SUM(CASE WHEN account_type = 'ASSET' THEN balance ELSE 0 END) as total_assets,
          SUM(CASE WHEN account_type = 'LIABILITY' THEN balance ELSE 0 END) as total_liabilities,
          SUM(CASE WHEN account_type = 'EQUITY' THEN balance ELSE 0 END) as total_equity,
          SUM(CASE WHEN account_type = 'CURRENT_ASSET' THEN balance ELSE 0 END) as current_assets,
          SUM(CASE WHEN account_type = 'CURRENT_LIABILITY' THEN balance ELSE 0 END) as current_liabilities,
          SUM(CASE WHEN account_type IN ('CASH', 'MARKETABLE_SECURITIES') THEN balance ELSE 0 END) as liquid_assets
        FROM finance.account_balances
        WHERE tenant_id = $1
      )
      SELECT
        total_assets,
        total_liabilities,
        total_equity,
        current_assets / NULLIF(current_liabilities, 0) as current_ratio,
        liquid_assets / NULLIF(current_liabilities, 0) as quick_ratio,
        total_liabilities / NULLIF(total_equity, 0) as debt_to_equity
      FROM balance_sheet;
    `;

    const result = await this.connection.query(query, [tenantId]);
    return result[0] || {};
  }

  private calculateKPIs(
    revenue: RevenueAnalytics,
    expenses: ExpenseAnalytics,
    cashFlow: CashFlowAnalytics,
    receivables: any,
    payables: any,
    ratios: any,
  ): KPIMetrics {
    const netProfit = revenue.total - expenses.total;
    const profitMargin = revenue.total > 0 ? (netProfit / revenue.total) * 100 : 0;

    return {
      totalRevenue: revenue.total,
      totalExpenses: expenses.total,
      netProfit,
      profitMargin,
      cashPosition: cashFlow.closing,
      dso: this.calculateDSO(receivables, revenue.total),
      dpo: this.calculateDPO(payables, expenses.total),
      currentRatio: ratios.current_ratio || 0,
      quickRatio: ratios.quick_ratio || 0,
      debtToEquity: ratios.debt_to_equity || 0,
      returnOnAssets: this.calculateROA(netProfit, ratios.total_assets),
      returnOnEquity: this.calculateROE(netProfit, ratios.total_equity),
    };
  }

  private calculateDSO(receivables: any, revenue: number): number {
    // Days Sales Outstanding = (Accounts Receivable / Revenue) * Days in Period
    if (!revenue || revenue === 0) return 0;
    return Math.round((receivables.total / revenue) * 30);
  }

  private calculateDPO(payables: any, expenses: number): number {
    // Days Payables Outstanding = (Accounts Payable / COGS) * Days in Period
    if (!expenses || expenses === 0) return 0;
    return Math.round((payables.total / expenses) * 30);
  }

  private calculateROA(netProfit: number, totalAssets: number): number {
    // Return on Assets = Net Profit / Total Assets
    if (!totalAssets || totalAssets === 0) return 0;
    return (netProfit / totalAssets) * 100;
  }

  private calculateROE(netProfit: number, totalEquity: number): number {
    // Return on Equity = Net Profit / Total Equity
    if (!totalEquity || totalEquity === 0) return 0;
    return (netProfit / totalEquity) * 100;
  }

  private async calculateWorkingCapitalTrend(
    tenantId: string,
    period: DateRange,
  ): Promise<Array<{ date: string; amount: number }>> {
    const query = `
      SELECT
        DATE_TRUNC('day', date) as day,
        SUM(current_assets - current_liabilities) as working_capital
      FROM finance.daily_balances
      WHERE tenant_id = $1
        AND date BETWEEN $2 AND $3
      GROUP BY day
      ORDER BY day;
    `;

    const result = await this.connection.query(query, [tenantId, period.from, period.to]);

    return result.map((row: any) => ({
      date: row.day.toISOString().split('T')[0],
      amount: parseFloat(row.working_capital),
    }));
  }

  private async generateCharts(
    revenue: RevenueAnalytics,
    expenses: ExpenseAnalytics,
    cashFlow: CashFlowAnalytics,
    profitability: any,
    trends: any[],
  ): Promise<ChartCollection> {
    return {
      profitLoss: this.generatePLChart(revenue, expenses),
      balanceSheet: await this.generateBalanceSheetChart(),
      ratioAnalysis: this.generateRatioChart(profitability),
      trendAnalysis: this.generateTrendChart(trends),
      cashFlowWaterfall: this.generateCashFlowWaterfallChart(cashFlow),
      revenueBreakdown: this.generateRevenueBreakdownChart(revenue),
      expenseBreakdown: this.generateExpenseBreakdownChart(expenses),
    };
  }

  private generateRevenueChart(revenue: RevenueAnalytics): ChartData {
    return {
      type: 'area',
      data: {
        labels: revenue.dailyData.map(d => d.date),
        datasets: [{
          label: 'Revenue',
          data: revenue.dailyData.map(d => d.amount),
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgb(59, 130, 246)',
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: any) => `৳${value.toLocaleString()}`,
            },
          },
        },
      },
    };
  }

  private generateExpenseChart(expenses: ExpenseAnalytics): ChartData {
    const categories = Object.keys(expenses.byCategory);
    const values = Object.values(expenses.byCategory);

    return {
      type: 'donut',
      data: {
        labels: categories,
        datasets: [{
          label: 'Expenses by Category',
          data: values,
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
          ],
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right' },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const percentage = ((value / expenses.total) * 100).toFixed(1);
                return `${label}: ৳${value.toLocaleString()} (${percentage}%)`;
              },
            },
          },
        },
      },
    };
  }

  private generateCashFlowChart(cashFlow: CashFlowAnalytics): ChartData {
    return {
      type: 'bar',
      data: {
        labels: ['Operating', 'Investing', 'Financing', 'Net'],
        datasets: [{
          label: 'Cash Flow',
          data: [
            cashFlow.operating,
            cashFlow.investing,
            cashFlow.financing,
            cashFlow.net,
          ],
          backgroundColor: [
            cashFlow.operating >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)',
            cashFlow.investing >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)',
            cashFlow.financing >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)',
            cashFlow.net >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)',
          ],
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: any) => `৳${value.toLocaleString()}`,
            },
          },
        },
      },
    };
  }

  private generatePLChart(revenue: RevenueAnalytics, expenses: ExpenseAnalytics): ChartData {
    const labels = revenue.dailyData.map(d => d.date);
    const revenueData = revenue.dailyData.map(d => d.amount);
    const expenseData = labels.map(() => expenses.total / labels.length); // Simplified

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Revenue',
            data: revenueData,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
          },
          {
            label: 'Expenses',
            data: expenseData,
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          tooltip: { mode: 'index', intersect: false },
        },
      },
    };
  }

  private async generateBalanceSheetChart(): Promise<ChartData> {
    return {
      type: 'bar',
      data: {
        labels: ['Assets', 'Liabilities', 'Equity'],
        datasets: [{
          label: 'Balance Sheet',
          data: [1000000, 400000, 600000], // Placeholder values
          backgroundColor: ['#36A2EB', '#FF6384', '#4BC0C0'],
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: any) => `৳${value.toLocaleString()}`,
            },
          },
        },
      },
    };
  }

  private generateRatioChart(profitability: any): ChartData {
    return {
      type: 'bar',
      data: {
        labels: ['Gross Margin', 'Operating Margin', 'Net Margin'],
        datasets: [{
          label: 'Profitability Ratios (%)',
          data: [
            profitability.gross_margin || 0,
            profitability.operating_margin || 0,
            profitability.net_margin || 0,
          ],
          backgroundColor: ['#FFCE56', '#36A2EB', '#4BC0C0'],
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value: any) => `${value}%`,
            },
          },
        },
      },
    };
  }

  private generateTrendChart(trends: any[]): ChartData {
    return {
      type: 'line',
      data: {
        labels: trends.map(t => t.day),
        datasets: [
          {
            label: 'Daily Revenue',
            data: trends.map(t => t.daily_revenue),
            borderColor: 'rgb(59, 130, 246)',
            tension: 0.1,
          },
          {
            label: '7-Day Average',
            data: trends.map(t => t.revenue_7day_avg),
            borderColor: 'rgb(34, 197, 94)',
            borderDash: [5, 5],
            tension: 0.3,
          },
          {
            label: '30-Day Average',
            data: trends.map(t => t.revenue_30day_avg),
            borderColor: 'rgb(251, 191, 36)',
            borderDash: [10, 5],
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
        },
      },
    };
  }

  private generateCashFlowWaterfallChart(cashFlow: CashFlowAnalytics): ChartData {
    const data = [
      cashFlow.opening,
      cashFlow.operating,
      cashFlow.investing,
      cashFlow.financing,
      cashFlow.closing,
    ];

    return {
      type: 'bar',
      data: {
        labels: ['Opening', 'Operating', 'Investing', 'Financing', 'Closing'],
        datasets: [{
          label: 'Cash Flow Waterfall',
          data,
          backgroundColor: data.map(d => d >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
      },
    };
  }

  private generateRevenueBreakdownChart(revenue: RevenueAnalytics): ChartData {
    return {
      type: 'pie',
      data: {
        labels: Object.keys(revenue.byCategory),
        datasets: [{
          label: 'Revenue by Category',
          data: Object.values(revenue.byCategory),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
          ],
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right' },
        },
      },
    };
  }

  private generateExpenseBreakdownChart(expenses: ExpenseAnalytics): ChartData {
    return {
      type: 'pie',
      data: {
        labels: Object.keys(expenses.byDepartment),
        datasets: [{
          label: 'Expenses by Department',
          data: Object.values(expenses.byDepartment),
          backgroundColor: [
            '#FF9F40',
            '#FF6384',
            '#4BC0C0',
            '#9966FF',
            '#FFCE56',
          ],
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right' },
        },
      },
    };
  }

  private async generateCashFlowForecast(
    tenantId: string,
    currentCashFlow: any,
  ): Promise<Array<{ date: string; projected: number }>> {
    // Simplified forecast - in production would use ML model
    const forecast = [];
    let projectedBalance = currentCashFlow.closing;

    for (let i = 1; i <= 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      // Simple linear projection with some randomness
      const dailyChange = (currentCashFlow.net / 30) * (0.8 + Math.random() * 0.4);
      projectedBalance += dailyChange;

      forecast.push({
        date: date.toISOString().split('T')[0],
        projected: Math.round(projectedBalance),
      });
    }

    return forecast;
  }

  private async getCurrentMonthRevenue(tenantId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const query = `
      SELECT SUM(total) as revenue
      FROM finance.invoices
      WHERE tenant_id = $1
        AND invoice_date >= $2
        AND status IN ('PAID', 'PARTIALLY_PAID');
    `;

    const result = await this.connection.query(query, [tenantId, startOfMonth]);
    return result[0]?.revenue || 0;
  }

  private async getTopCustomers(tenantId: string): Promise<any[]> {
    const query = `
      WITH customer_revenue AS (
        SELECT
          customer_id,
          customer_name,
          SUM(total) as total_revenue,
          COUNT(*) as transaction_count,
          MAX(invoice_date) as last_transaction
        FROM finance.invoices
        WHERE tenant_id = $1
          AND status IN ('PAID', 'PARTIALLY_PAID')
          AND invoice_date >= CURRENT_DATE - interval '90 days'
        GROUP BY customer_id, customer_name
      ),
      customer_growth AS (
        SELECT
          customer_id,
          (SUM(CASE WHEN invoice_date >= CURRENT_DATE - interval '30 days' THEN total ELSE 0 END) -
           SUM(CASE WHEN invoice_date < CURRENT_DATE - interval '30 days' AND invoice_date >= CURRENT_DATE - interval '60 days' THEN total ELSE 0 END)) /
          NULLIF(SUM(CASE WHEN invoice_date < CURRENT_DATE - interval '30 days' AND invoice_date >= CURRENT_DATE - interval '60 days' THEN total ELSE 0 END), 0) as growth_rate
        FROM finance.invoices
        WHERE tenant_id = $1
          AND status IN ('PAID', 'PARTIALLY_PAID')
          AND invoice_date >= CURRENT_DATE - interval '60 days'
        GROUP BY customer_id
      )
      SELECT
        cr.customer_id as id,
        cr.customer_name as name,
        cr.total_revenue,
        cr.transaction_count,
        cr.last_transaction,
        COALESCE(cg.growth_rate, 0) as growthRate,
        cr.total_revenue * (1 + COALESCE(cg.growth_rate, 0)) as projectedRevenue
      FROM customer_revenue cr
      LEFT JOIN customer_growth cg ON cr.customer_id = cg.customer_id
      ORDER BY cr.total_revenue DESC
      LIMIT 10;
    `;

    const result = await this.connection.query(query, [tenantId]);
    return result;
  }

  private processRevenueData(data: any[]): RevenueAnalytics {
    let total = 0;
    const byCategory: Record<string, number> = {};
    const byProduct: Record<string, number> = {};
    const dailyData: Array<{ date: string; amount: number }> = [];
    const customers: Map<string, { id: string; name: string; amount: number }> = new Map();

    for (const row of data) {
      if (row.date && row.total) {
        total += parseFloat(row.total);

        if (row.category) {
          byCategory[row.category] = (byCategory[row.category] || 0) + parseFloat(row.total);
        }

        if (row.product_category) {
          byProduct[row.product_category] = (byProduct[row.product_category] || 0) + parseFloat(row.total);
        }

        if (row.customer_id) {
          const existing = customers.get(row.customer_id) || {
            id: row.customer_id,
            name: row.customer_name,
            amount: 0
          };
          existing.amount += parseFloat(row.total);
          customers.set(row.customer_id, existing);
        }

        // Aggregate daily data
        const dateStr = row.date.toISOString().split('T')[0];
        const existing = dailyData.find(d => d.date === dateStr);
        if (existing) {
          existing.amount += parseFloat(row.total);
        } else {
          dailyData.push({ date: dateStr, amount: parseFloat(row.total) });
        }
      }
    }

    // Get top 10 customers
    const topCustomers = Array.from(customers.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Calculate growth rate (simplified)
    const growthRate = dailyData.length > 1
      ? (dailyData[dailyData.length - 1].amount - dailyData[0].amount) / dailyData[0].amount
      : 0;

    return {
      total,
      byCategory,
      topCustomers,
      byProduct,
      growthRate,
      trend: growthRate > 0.05 ? 'UP' : growthRate < -0.05 ? 'DOWN' : 'STABLE',
      dailyData: dailyData.sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  private processExpenseData(data: any[]): ExpenseAnalytics {
    let total = 0;
    const byCategory: Record<string, number> = {};
    const byDepartment: Record<string, number> = {};
    const vendors: Map<string, { id: string; name: string; amount: number }> = new Map();

    for (const row of data) {
      if (row.date && row.total) {
        total += parseFloat(row.total);

        if (row.category) {
          byCategory[row.category] = (byCategory[row.category] || 0) + parseFloat(row.total);
        }

        if (row.department) {
          byDepartment[row.department] = (byDepartment[row.department] || 0) + parseFloat(row.total);
        }

        if (row.vendor_id) {
          const existing = vendors.get(row.vendor_id) || {
            id: row.vendor_id,
            name: row.vendor_name,
            amount: 0
          };
          existing.amount += parseFloat(row.total);
          vendors.set(row.vendor_id, existing);
        }
      }
    }

    // Get top 10 vendors
    const topVendors = Array.from(vendors.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Determine trend (simplified)
    const trend = 'STABLE'; // Would calculate based on historical data

    return {
      total,
      byCategory,
      topVendors,
      byDepartment,
      trend,
    };
  }

  private localizeToBengali(chart?: ChartData): ChartData | undefined {
    if (!chart) return undefined;

    // Localize chart labels and values using Bengali localization service
    if (chart.options?.plugins?.tooltip?.callbacks?.label) {
      const originalCallback = chart.options.plugins.tooltip.callbacks.label;
      chart.options.plugins.tooltip.callbacks.label = (context: any) => {
        const result = originalCallback(context);
        // Convert numbers to Bengali numerals
        return this.bengaliService.formatCurrency(context.parsed.y);
      };
    }

    return chart;
  }

  private trackAnalyticsUsage(tenantId: string, queryTime: number): void {
    // Track usage for analytics and optimization
    this.logger.log(`Dashboard generated for tenant ${tenantId} in ${queryTime}ms`);

    // Emit event for telemetry
    this.eventBus.publish({
      type: 'ANALYTICS_DASHBOARD_VIEWED',
      tenantId,
      queryTime,
      timestamp: new Date(),
    });
  }
}