import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { EventBus } from '@nestjs/cqrs';
import { RedisService } from '@vextrus/shared-infrastructure';
import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Subject, interval } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import Decimal from 'decimal.js';

// Domain Events
export class InvoicePaidEvent {
  constructor(
    public readonly invoiceId: string,
    public readonly tenantId: string,
    public readonly amount: number,
    public readonly customerId: string,
  ) {}
}

export class ExpenseApprovedEvent {
  constructor(
    public readonly expenseId: string,
    public readonly tenantId: string,
    public readonly amount: number,
    public readonly category: string,
  ) {}
}

export class PaymentProcessedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly tenantId: string,
    public readonly amount: number,
    public readonly type: 'INFLOW' | 'OUTFLOW',
  ) {}
}

export interface RealTimeKPIs {
  // Financial Health Indicators
  quickRatio: number;
  currentRatio: number;
  debtToEquity: number;
  returnOnAssets: number;
  returnOnEquity: number;

  // Operational Efficiency
  assetTurnover: number;
  inventoryTurnover: number;
  receivablesTurnover: number;

  // Liquidity Metrics
  cashConversionCycle: number;
  workingCapitalRatio: number;
  operatingCashFlowRatio: number;

  // Profitability Metrics
  grossProfitMargin: number;
  operatingProfitMargin: number;
  netProfitMargin: number;
  ebitda: number;

  // Growth Metrics
  revenueGrowthRate: number;
  expenseGrowthRate: number;
  customerGrowthRate: number;

  // Risk Indicators
  debtServiceCoverage: number;
  interestCoverage: number;
  creditRisk: number;

  // Custom Bangladesh Metrics
  vatCompliance: number;
  tdsCompliance: number;
  nbrReportingStatus: 'COMPLIANT' | 'PENDING' | 'OVERDUE';

  // Timestamp
  lastUpdated: Date;
}

export interface KPIUpdate {
  tenantId: string;
  kpiName: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  timestamp: Date;
}

export interface SmartAlert {
  id?: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL';
  category: string;
  message: string;
  recommendation?: string;
  impact?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp?: Date;
  data?: any;
}

export interface KPIThreshold {
  kpiName: string;
  minValue?: number;
  maxValue?: number;
  targetValue?: number;
  criticalMin?: number;
  criticalMax?: number;
}

@Injectable()
export class KPICalculationService {
  private readonly logger = new Logger(KPICalculationService.name);
  private kpiStreams = new Map<string, Subject<KPIUpdate>>();
  private kpiCache = new Map<string, RealTimeKPIs>();
  private thresholds = new Map<string, KPIThreshold[]>();

  constructor(
    @InjectConnection() private connection: Connection,
    private eventBus: EventBus,
    private redisService: RedisService,
  ) {
    this.initializeService();
    this.initializeThresholds();
    this.startKPIRefreshInterval();
  }

  private initializeService() {
    // Initialize the KPI calculation service
    // Note: In NestJS CQRS, event handling is done through @EventsHandler classes
    // Create separate event handlers that call the update methods:
    // - InvoicePaidKPIHandler -> calls updateRevenueKPIs
    // - ExpenseApprovedKPIHandler -> calls updateExpenseKPIs
    // - PaymentProcessedKPIHandler -> calls updateCashFlowKPIs

    this.logger.log('KPI calculation service initialized');
    this.logger.log('Event handlers should be registered as separate @EventsHandler classes');
  }

  // Public methods that can be called from event handlers
  public async handleInvoicePaid(event: InvoicePaidEvent): Promise<void> {
    await this.updateRevenueKPIs(event);
  }

  public async handleExpenseApproved(event: ExpenseApprovedEvent): Promise<void> {
    await this.updateExpenseKPIs(event);
  }

  public async handlePaymentProcessed(event: PaymentProcessedEvent): Promise<void> {
    await this.updateCashFlowKPIs(event);
  }

  private initializeThresholds() {
    // Initialize default KPI thresholds for Bangladesh market
    const defaultThresholds: KPIThreshold[] = [
      {
        kpiName: 'currentRatio',
        minValue: 1.2,
        targetValue: 2.0,
        criticalMin: 1.0,
      },
      {
        kpiName: 'quickRatio',
        minValue: 0.8,
        targetValue: 1.5,
        criticalMin: 0.5,
      },
      {
        kpiName: 'debtToEquity',
        maxValue: 2.0,
        targetValue: 1.0,
        criticalMax: 3.0,
      },
      {
        kpiName: 'grossProfitMargin',
        minValue: 20,
        targetValue: 35,
        criticalMin: 15,
      },
      {
        kpiName: 'cashConversionCycle',
        maxValue: 60,
        targetValue: 30,
        criticalMax: 90,
      },
      {
        kpiName: 'vatCompliance',
        minValue: 95,
        targetValue: 100,
        criticalMin: 90,
      },
    ];

    this.thresholds.set('default', defaultThresholds);
  }

  private startKPIRefreshInterval() {
    // Refresh KPIs every 5 minutes for all active tenants
    interval(5 * 60 * 1000)
      .pipe(throttleTime(1000))
      .subscribe(async () => {
        const tenants = await this.getActiveTenants();
        for (const tenantId of tenants) {
          await this.calculateRealTimeKPIs(tenantId);
        }
      });
  }

  async calculateRealTimeKPIs(
    tenantId: string,
    forceRefresh = false,
  ): Promise<RealTimeKPIs> {
    // Check cache first
    if (!forceRefresh) {
      const cached = this.kpiCache.get(tenantId);
      if (cached && this.isCacheValid(cached.lastUpdated)) {
        return cached;
      }
    }

    const startTime = Date.now();

    // Parallel KPI calculations
    const [
      financialHealth,
      operational,
      liquidity,
      profitability,
      growth,
      risk,
      compliance,
    ] = await Promise.all([
      this.calculateFinancialHealthKPIs(tenantId),
      this.calculateOperationalKPIs(tenantId),
      this.calculateLiquidityKPIs(tenantId),
      this.calculateProfitabilityKPIs(tenantId),
      this.calculateGrowthKPIs(tenantId),
      this.calculateRiskKPIs(tenantId),
      this.calculateComplianceKPIs(tenantId),
    ]);

    const kpis: RealTimeKPIs = {
      // Financial Health defaults
      quickRatio: 0,
      currentRatio: 0,
      debtToEquity: 0,
      returnOnAssets: 0,
      returnOnEquity: 0,

      // Operational defaults
      assetTurnover: 0,
      inventoryTurnover: 0,
      receivablesTurnover: 0,

      // Liquidity defaults
      cashConversionCycle: 0,
      workingCapitalRatio: 0,
      operatingCashFlowRatio: 0,

      // Profitability defaults
      grossProfitMargin: 0,
      operatingProfitMargin: 0,
      netProfitMargin: 0,
      ebitda: 0,

      // Growth defaults
      revenueGrowthRate: 0,
      expenseGrowthRate: 0,
      customerGrowthRate: 0,

      // Risk defaults
      debtServiceCoverage: 0,
      interestCoverage: 0,
      creditRisk: 0,

      // Custom Bangladesh defaults
      vatCompliance: 0,
      tdsCompliance: 0,
      nbrReportingStatus: 'PENDING' as const,

      // Override with calculated values
      ...financialHealth,
      ...operational,
      ...liquidity,
      ...profitability,
      ...growth,
      ...risk,
      ...compliance,

      // Timestamp
      lastUpdated: new Date(),
    };

    // Cache the results
    this.kpiCache.set(tenantId, kpis);

    // Store in Redis for persistence
    await this.redisService.set(
      `kpis:${tenantId}`,
      JSON.stringify(kpis),
      300, // 5 minutes TTL
    );

    // Check thresholds and generate alerts
    const alerts = await this.checkKPIThresholds(tenantId, kpis);
    if (alerts.length > 0) {
      await this.publishAlerts(tenantId, alerts);
    }

    // Stream updates to connected clients
    this.broadcastKPIUpdate(tenantId, kpis);

    // Log performance
    this.logger.log(`KPI calculation for tenant ${tenantId} took ${Date.now() - startTime}ms`);

    return kpis;
  }

  private async calculateFinancialHealthKPIs(tenantId: string): Promise<Partial<RealTimeKPIs>> {
    const query = `
      WITH balance_sheet AS (
        SELECT
          SUM(CASE WHEN account_type = 'ASSET' THEN balance ELSE 0 END) as total_assets,
          SUM(CASE WHEN account_type = 'LIABILITY' THEN balance ELSE 0 END) as total_liabilities,
          SUM(CASE WHEN account_type = 'EQUITY' THEN balance ELSE 0 END) as total_equity,
          SUM(CASE WHEN account_type = 'CURRENT_ASSET' THEN balance ELSE 0 END) as current_assets,
          SUM(CASE WHEN account_type = 'CURRENT_LIABILITY' THEN balance ELSE 0 END) as current_liabilities,
          SUM(CASE WHEN account_type IN ('CASH', 'MARKETABLE_SECURITIES', 'RECEIVABLES') THEN balance ELSE 0 END) as quick_assets,
          SUM(CASE WHEN account_type = 'INVENTORY' THEN balance ELSE 0 END) as inventory
        FROM finance.account_balances
        WHERE tenant_id = $1 AND is_active = true
      ),
      income_statement AS (
        SELECT
          SUM(CASE WHEN type = 'REVENUE' THEN amount ELSE 0 END) as revenue,
          SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expenses
        FROM finance.transactions
        WHERE tenant_id = $1
          AND transaction_date >= CURRENT_DATE - interval '12 months'
      )
      SELECT
        bs.*,
        is.*,
        -- Current Ratio
        ROUND(COALESCE(bs.current_assets / NULLIF(bs.current_liabilities, 0), 0), 2) as current_ratio,
        -- Quick Ratio
        ROUND(COALESCE(bs.quick_assets / NULLIF(bs.current_liabilities, 0), 0), 2) as quick_ratio,
        -- Debt to Equity
        ROUND(COALESCE(bs.total_liabilities / NULLIF(bs.total_equity, 0), 0), 2) as debt_to_equity,
        -- Return on Assets (ROA)
        ROUND(COALESCE((is.revenue - is.expenses) / NULLIF(bs.total_assets, 0) * 100, 0), 2) as return_on_assets,
        -- Return on Equity (ROE)
        ROUND(COALESCE((is.revenue - is.expenses) / NULLIF(bs.total_equity, 0) * 100, 0), 2) as return_on_equity
      FROM balance_sheet bs, income_statement is;
    `;

    const result = await this.connection.query(query, [tenantId]);
    const data = result[0] || {};

    return {
      currentRatio: data.current_ratio || 0,
      quickRatio: data.quick_ratio || 0,
      debtToEquity: data.debt_to_equity || 0,
      returnOnAssets: data.return_on_assets || 0,
      returnOnEquity: data.return_on_equity || 0,
    };
  }

  private async calculateOperationalKPIs(tenantId: string): Promise<Partial<RealTimeKPIs>> {
    const query = `
      WITH operational_metrics AS (
        SELECT
          -- Asset Turnover
          (SELECT SUM(amount) FROM finance.invoices
           WHERE tenant_id = $1 AND status = 'PAID'
           AND invoice_date >= CURRENT_DATE - interval '12 months') as annual_revenue,

          (SELECT AVG(balance) FROM finance.account_balances
           WHERE tenant_id = $1 AND account_type = 'ASSET') as avg_total_assets,

          -- Inventory Turnover
          (SELECT SUM(cost) FROM finance.cost_of_goods_sold
           WHERE tenant_id = $1
           AND date >= CURRENT_DATE - interval '12 months') as annual_cogs,

          (SELECT AVG(balance) FROM finance.account_balances
           WHERE tenant_id = $1 AND account_type = 'INVENTORY') as avg_inventory,

          -- Receivables Turnover
          (SELECT AVG(balance) FROM finance.account_balances
           WHERE tenant_id = $1 AND account_type = 'RECEIVABLES') as avg_receivables
      )
      SELECT
        ROUND(COALESCE(annual_revenue / NULLIF(avg_total_assets, 0), 0), 2) as asset_turnover,
        ROUND(COALESCE(annual_cogs / NULLIF(avg_inventory, 0), 0), 2) as inventory_turnover,
        ROUND(COALESCE(annual_revenue / NULLIF(avg_receivables, 0), 0), 2) as receivables_turnover
      FROM operational_metrics;
    `;

    const result = await this.connection.query(query, [tenantId]);
    const data = result[0] || {};

    return {
      assetTurnover: data.asset_turnover || 0,
      inventoryTurnover: data.inventory_turnover || 0,
      receivablesTurnover: data.receivables_turnover || 0,
    };
  }

  private async calculateLiquidityKPIs(tenantId: string): Promise<Partial<RealTimeKPIs>> {
    const query = `
      WITH liquidity_metrics AS (
        SELECT
          -- Days Sales Outstanding (DSO)
          (SELECT AVG(balance) FROM finance.receivables WHERE tenant_id = $1) as avg_receivables,
          (SELECT SUM(amount) / 365 FROM finance.invoices
           WHERE tenant_id = $1 AND invoice_date >= CURRENT_DATE - interval '365 days') as daily_sales,

          -- Days Inventory Outstanding (DIO)
          (SELECT AVG(balance) FROM finance.inventory WHERE tenant_id = $1) as avg_inventory,
          (SELECT SUM(cost) / 365 FROM finance.cost_of_goods_sold
           WHERE tenant_id = $1 AND date >= CURRENT_DATE - interval '365 days') as daily_cogs,

          -- Days Payable Outstanding (DPO)
          (SELECT AVG(balance) FROM finance.payables WHERE tenant_id = $1) as avg_payables,

          -- Working Capital
          (SELECT SUM(CASE WHEN account_type = 'CURRENT_ASSET' THEN balance
                          WHEN account_type = 'CURRENT_LIABILITY' THEN -balance
                          ELSE 0 END)
           FROM finance.account_balances WHERE tenant_id = $1) as working_capital,

          -- Operating Cash Flow
          (SELECT SUM(CASE WHEN type = 'OPERATING' THEN amount ELSE 0 END)
           FROM finance.cash_flows
           WHERE tenant_id = $1 AND date >= CURRENT_DATE - interval '12 months') as operating_cash_flow,

          (SELECT SUM(balance) FROM finance.account_balances
           WHERE tenant_id = $1 AND account_type = 'CURRENT_LIABILITY') as current_liabilities
      )
      SELECT
        -- Cash Conversion Cycle = DSO + DIO - DPO
        ROUND(
          COALESCE(avg_receivables / NULLIF(daily_sales, 0), 0) +
          COALESCE(avg_inventory / NULLIF(daily_cogs, 0), 0) -
          COALESCE(avg_payables / NULLIF(daily_cogs, 0), 0), 2
        ) as cash_conversion_cycle,

        -- Working Capital Ratio
        ROUND(COALESCE(working_capital / NULLIF(daily_sales * 365, 0), 0), 2) as working_capital_ratio,

        -- Operating Cash Flow Ratio
        ROUND(COALESCE(operating_cash_flow / NULLIF(current_liabilities, 0), 0), 2) as operating_cash_flow_ratio
      FROM liquidity_metrics;
    `;

    const result = await this.connection.query(query, [tenantId]);
    const data = result[0] || {};

    return {
      cashConversionCycle: data.cash_conversion_cycle || 0,
      workingCapitalRatio: data.working_capital_ratio || 0,
      operatingCashFlowRatio: data.operating_cash_flow_ratio || 0,
    };
  }

  private async calculateProfitabilityKPIs(tenantId: string): Promise<Partial<RealTimeKPIs>> {
    const query = `
      WITH profitability_metrics AS (
        SELECT
          SUM(CASE WHEN type = 'REVENUE' THEN amount ELSE 0 END) as revenue,
          SUM(CASE WHEN type = 'COGS' THEN amount ELSE 0 END) as cogs,
          SUM(CASE WHEN type = 'OPERATING_EXPENSE' THEN amount ELSE 0 END) as operating_expenses,
          SUM(CASE WHEN type = 'INTEREST' THEN amount ELSE 0 END) as interest_expense,
          SUM(CASE WHEN type = 'TAX' THEN amount ELSE 0 END) as tax_expense,
          SUM(CASE WHEN type = 'DEPRECIATION' THEN amount ELSE 0 END) as depreciation,
          SUM(CASE WHEN type = 'AMORTIZATION' THEN amount ELSE 0 END) as amortization
        FROM finance.income_statement_items
        WHERE tenant_id = $1
          AND period_end >= CURRENT_DATE - interval '12 months'
      )
      SELECT
        -- Gross Profit Margin
        ROUND(COALESCE((revenue - cogs) / NULLIF(revenue, 0) * 100, 0), 2) as gross_profit_margin,

        -- Operating Profit Margin
        ROUND(COALESCE((revenue - cogs - operating_expenses) / NULLIF(revenue, 0) * 100, 0), 2) as operating_profit_margin,

        -- Net Profit Margin
        ROUND(COALESCE((revenue - cogs - operating_expenses - interest_expense - tax_expense) / NULLIF(revenue, 0) * 100, 0), 2) as net_profit_margin,

        -- EBITDA
        ROUND(revenue - cogs - operating_expenses + depreciation + amortization, 2) as ebitda
      FROM profitability_metrics;
    `;

    const result = await this.connection.query(query, [tenantId]);
    const data = result[0] || {};

    return {
      grossProfitMargin: data.gross_profit_margin || 0,
      operatingProfitMargin: data.operating_profit_margin || 0,
      netProfitMargin: data.net_profit_margin || 0,
      ebitda: data.ebitda || 0,
    };
  }

  private async calculateGrowthKPIs(tenantId: string): Promise<Partial<RealTimeKPIs>> {
    const query = `
      WITH growth_metrics AS (
        SELECT
          -- Current Period (last 30 days)
          (SELECT SUM(amount) FROM finance.invoices
           WHERE tenant_id = $1 AND invoice_date >= CURRENT_DATE - interval '30 days') as current_revenue,

          -- Previous Period (30-60 days ago)
          (SELECT SUM(amount) FROM finance.invoices
           WHERE tenant_id = $1
           AND invoice_date >= CURRENT_DATE - interval '60 days'
           AND invoice_date < CURRENT_DATE - interval '30 days') as previous_revenue,

          -- Current Expenses
          (SELECT SUM(amount) FROM finance.expenses
           WHERE tenant_id = $1 AND expense_date >= CURRENT_DATE - interval '30 days') as current_expenses,

          -- Previous Expenses
          (SELECT SUM(amount) FROM finance.expenses
           WHERE tenant_id = $1
           AND expense_date >= CURRENT_DATE - interval '60 days'
           AND expense_date < CURRENT_DATE - interval '30 days') as previous_expenses,

          -- Current Customers
          (SELECT COUNT(DISTINCT customer_id) FROM finance.invoices
           WHERE tenant_id = $1 AND invoice_date >= CURRENT_DATE - interval '30 days') as current_customers,

          -- Previous Customers
          (SELECT COUNT(DISTINCT customer_id) FROM finance.invoices
           WHERE tenant_id = $1
           AND invoice_date >= CURRENT_DATE - interval '60 days'
           AND invoice_date < CURRENT_DATE - interval '30 days') as previous_customers
      )
      SELECT
        -- Revenue Growth Rate
        ROUND(COALESCE((current_revenue - previous_revenue) / NULLIF(previous_revenue, 0) * 100, 0), 2) as revenue_growth_rate,

        -- Expense Growth Rate
        ROUND(COALESCE((current_expenses - previous_expenses) / NULLIF(previous_expenses, 0) * 100, 0), 2) as expense_growth_rate,

        -- Customer Growth Rate
        ROUND(COALESCE((current_customers - previous_customers)::numeric / NULLIF(previous_customers, 0) * 100, 0), 2) as customer_growth_rate
      FROM growth_metrics;
    `;

    const result = await this.connection.query(query, [tenantId]);
    const data = result[0] || {};

    return {
      revenueGrowthRate: data.revenue_growth_rate || 0,
      expenseGrowthRate: data.expense_growth_rate || 0,
      customerGrowthRate: data.customer_growth_rate || 0,
    };
  }

  private async calculateRiskKPIs(tenantId: string): Promise<Partial<RealTimeKPIs>> {
    const query = `
      WITH risk_metrics AS (
        SELECT
          -- Debt Service Coverage Ratio (DSCR)
          (SELECT SUM(amount) FROM finance.cash_flows
           WHERE tenant_id = $1 AND type = 'OPERATING'
           AND date >= CURRENT_DATE - interval '12 months') as net_operating_income,

          (SELECT SUM(amount) FROM finance.debt_service
           WHERE tenant_id = $1
           AND due_date >= CURRENT_DATE - interval '12 months') as total_debt_service,

          -- Interest Coverage Ratio
          (SELECT SUM(amount) FROM finance.income_statement_items
           WHERE tenant_id = $1 AND type = 'EBIT'
           AND period_end >= CURRENT_DATE - interval '12 months') as ebit,

          (SELECT SUM(amount) FROM finance.income_statement_items
           WHERE tenant_id = $1 AND type = 'INTEREST'
           AND period_end >= CURRENT_DATE - interval '12 months') as interest_expense,

          -- Credit Risk Score (simplified)
          (SELECT
            COUNT(CASE WHEN days_overdue > 90 THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100
           FROM finance.receivables
           WHERE tenant_id = $1) as overdue_percentage
      )
      SELECT
        -- Debt Service Coverage Ratio
        ROUND(COALESCE(net_operating_income / NULLIF(total_debt_service, 0), 0), 2) as debt_service_coverage,

        -- Interest Coverage Ratio
        ROUND(COALESCE(ebit / NULLIF(interest_expense, 0), 0), 2) as interest_coverage,

        -- Credit Risk Score (0-100, lower is better)
        ROUND(COALESCE(overdue_percentage, 0), 2) as credit_risk
      FROM risk_metrics;
    `;

    const result = await this.connection.query(query, [tenantId]);
    const data = result[0] || {};

    return {
      debtServiceCoverage: data.debt_service_coverage || 0,
      interestCoverage: data.interest_coverage || 0,
      creditRisk: data.credit_risk || 0,
    };
  }

  private async calculateComplianceKPIs(tenantId: string): Promise<Partial<RealTimeKPIs>> {
    const query = `
      WITH compliance_metrics AS (
        SELECT
          -- VAT Compliance
          (SELECT
            COUNT(CASE WHEN vat_filed = true THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100
           FROM finance.vat_returns
           WHERE tenant_id = $1
           AND due_date <= CURRENT_DATE) as vat_compliance_rate,

          -- TDS Compliance
          (SELECT
            COUNT(CASE WHEN tds_deposited = true THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100
           FROM finance.tds_returns
           WHERE tenant_id = $1
           AND due_date <= CURRENT_DATE) as tds_compliance_rate,

          -- NBR Reporting Status
          (SELECT
            CASE
              WHEN MAX(due_date) < CURRENT_DATE AND MAX(filed_date) IS NULL THEN 'OVERDUE'
              WHEN MAX(due_date) >= CURRENT_DATE AND MAX(filed_date) IS NULL THEN 'PENDING'
              ELSE 'COMPLIANT'
            END
           FROM finance.nbr_reports
           WHERE tenant_id = $1) as nbr_status
      )
      SELECT
        ROUND(COALESCE(vat_compliance_rate, 100), 2) as vat_compliance,
        ROUND(COALESCE(tds_compliance_rate, 100), 2) as tds_compliance,
        COALESCE(nbr_status, 'COMPLIANT') as nbr_reporting_status
      FROM compliance_metrics;
    `;

    const result = await this.connection.query(query, [tenantId]);
    const data = result[0] || {};

    return {
      vatCompliance: data.vat_compliance || 100,
      tdsCompliance: data.tds_compliance || 100,
      nbrReportingStatus: data.nbr_reporting_status || 'COMPLIANT',
    };
  }

  async generateSmartAlerts(tenantId: string): Promise<SmartAlert[]> {
    const alerts: SmartAlert[] = [];
    const kpis = await this.calculateRealTimeKPIs(tenantId);

    // Cash flow prediction alert
    const cashFlowForecast = await this.predictCashFlow(tenantId, 30);
    if (cashFlowForecast.projectedBalance < 0) {
      alerts.push({
        type: 'CRITICAL',
        category: 'CASH_FLOW',
        message: `Cash flow shortage predicted in ${cashFlowForecast.daysToShortage} days`,
        recommendation: 'Consider accelerating receivables collection or negotiating extended payment terms with suppliers',
        impact: 'CRITICAL',
        timestamp: new Date(),
      });
    }

    // Liquidity alerts
    if (kpis.currentRatio < 1.0) {
      alerts.push({
        type: 'CRITICAL',
        category: 'LIQUIDITY',
        message: `Current ratio (${kpis.currentRatio}) below critical threshold`,
        recommendation: 'Immediate action needed to improve short-term liquidity',
        impact: 'HIGH',
        timestamp: new Date(),
      });
    }

    // Receivables aging alert
    const agingAnalysis = await this.analyzeReceivablesAging(tenantId);
    if (agingAnalysis.over90Days > agingAnalysis.total * 0.2) {
      alerts.push({
        type: 'WARNING',
        category: 'RECEIVABLES',
        message: `${((agingAnalysis.over90Days / agingAnalysis.total) * 100).toFixed(1)}% of receivables overdue >90 days`,
        recommendation: 'Initiate aggressive collection procedures or consider factoring',
        impact: 'MEDIUM',
        timestamp: new Date(),
      });
    }

    // Profitability alerts
    if (kpis.netProfitMargin < 0) {
      alerts.push({
        type: 'CRITICAL',
        category: 'PROFITABILITY',
        message: 'Company operating at a net loss',
        recommendation: 'Review cost structure and pricing strategy immediately',
        impact: 'CRITICAL',
        timestamp: new Date(),
      });
    } else if (kpis.netProfitMargin < 5) {
      alerts.push({
        type: 'WARNING',
        category: 'PROFITABILITY',
        message: `Net profit margin (${kpis.netProfitMargin}%) below healthy threshold`,
        recommendation: 'Focus on cost reduction and revenue optimization',
        impact: 'MEDIUM',
        timestamp: new Date(),
      });
    }

    // Growth alerts
    if (kpis.revenueGrowthRate < -10) {
      alerts.push({
        type: 'WARNING',
        category: 'GROWTH',
        message: `Revenue declining at ${Math.abs(kpis.revenueGrowthRate)}% rate`,
        recommendation: 'Analyze customer churn and market conditions',
        impact: 'HIGH',
        timestamp: new Date(),
      });
    }

    // Compliance alerts
    if (kpis.vatCompliance < 95) {
      alerts.push({
        type: 'WARNING',
        category: 'COMPLIANCE',
        message: `VAT compliance rate (${kpis.vatCompliance}%) below requirement`,
        recommendation: 'Review VAT filing process and ensure timely submissions',
        impact: 'HIGH',
        timestamp: new Date(),
      });
    }

    if (kpis.nbrReportingStatus === 'OVERDUE') {
      alerts.push({
        type: 'CRITICAL',
        category: 'COMPLIANCE',
        message: 'NBR reporting is overdue',
        recommendation: 'Submit NBR reports immediately to avoid penalties',
        impact: 'CRITICAL',
        timestamp: new Date(),
      });
    }

    // Risk alerts
    if (kpis.debtServiceCoverage < 1.25) {
      alerts.push({
        type: 'WARNING',
        category: 'DEBT',
        message: `Debt service coverage ratio (${kpis.debtServiceCoverage}) approaching critical level`,
        recommendation: 'Review debt restructuring options or improve operating income',
        impact: 'HIGH',
        timestamp: new Date(),
      });
    }

    if (kpis.creditRisk > 20) {
      alerts.push({
        type: 'WARNING',
        category: 'CREDIT',
        message: `High credit risk score (${kpis.creditRisk})`,
        recommendation: 'Tighten credit policies and review customer creditworthiness',
        impact: 'MEDIUM',
        timestamp: new Date(),
      });
    }

    return alerts;
  }

  private async predictCashFlow(
    tenantId: string,
    days: number,
  ): Promise<{ projectedBalance: number; daysToShortage?: number }> {
    // Simplified cash flow prediction
    const query = `
      WITH daily_averages AS (
        SELECT
          AVG(CASE WHEN type = 'INFLOW' THEN amount ELSE 0 END) as avg_daily_inflow,
          AVG(CASE WHEN type = 'OUTFLOW' THEN amount ELSE 0 END) as avg_daily_outflow
        FROM finance.cash_transactions
        WHERE tenant_id = $1
          AND transaction_date >= CURRENT_DATE - interval '30 days'
      ),
      current_balance AS (
        SELECT balance
        FROM finance.cash_accounts
        WHERE tenant_id = $1
          AND is_primary = true
        LIMIT 1
      )
      SELECT
        cb.balance as current_balance,
        da.avg_daily_inflow,
        da.avg_daily_outflow,
        cb.balance + ($2 * (da.avg_daily_inflow - da.avg_daily_outflow)) as projected_balance,
        CASE
          WHEN da.avg_daily_outflow > da.avg_daily_inflow
          THEN cb.balance / (da.avg_daily_outflow - da.avg_daily_inflow)
          ELSE NULL
        END as days_to_shortage
      FROM current_balance cb, daily_averages da;
    `;

    const result = await this.connection.query(query, [tenantId, days]);
    const data = result[0] || {};

    return {
      projectedBalance: data.projected_balance || 0,
      daysToShortage: data.days_to_shortage ? Math.floor(data.days_to_shortage) : undefined,
    };
  }

  private async analyzeReceivablesAging(tenantId: string): Promise<any> {
    const query = `
      SELECT
        SUM(amount_due) as total,
        SUM(CASE WHEN days_overdue <= 30 THEN amount_due ELSE 0 END) as current,
        SUM(CASE WHEN days_overdue > 30 AND days_overdue <= 60 THEN amount_due ELSE 0 END) as over30Days,
        SUM(CASE WHEN days_overdue > 60 AND days_overdue <= 90 THEN amount_due ELSE 0 END) as over60Days,
        SUM(CASE WHEN days_overdue > 90 THEN amount_due ELSE 0 END) as over90Days
      FROM (
        SELECT
          amount_due,
          EXTRACT(DAY FROM CURRENT_DATE - due_date) as days_overdue
        FROM finance.receivables
        WHERE tenant_id = $1
          AND status = 'PENDING'
      ) aging;
    `;

    const result = await this.connection.query(query, [tenantId]);
    return result[0] || { total: 0, over90Days: 0 };
  }

  private async updateRevenueKPIs(event: InvoicePaidEvent): Promise<void> {
    const tenantId = event.tenantId;

    // Update relevant KPIs in real-time
    const updates: KPIUpdate[] = [];

    // Update revenue-related KPIs
    const currentRevenue = await this.getCurrentMonthRevenue(tenantId);
    const previousRevenue = await this.getPreviousMonthRevenue(tenantId);

    updates.push({
      tenantId,
      kpiName: 'monthlyRevenue',
      value: currentRevenue,
      previousValue: previousRevenue,
      change: currentRevenue - previousRevenue,
      changePercent: ((currentRevenue - previousRevenue) / previousRevenue) * 100,
      timestamp: new Date(),
    });

    // Broadcast updates
    this.broadcastKPIUpdates(tenantId, updates);
  }

  private async updateExpenseKPIs(event: ExpenseApprovedEvent): Promise<void> {
    const tenantId = event.tenantId;

    // Update expense-related KPIs
    const updates: KPIUpdate[] = [];

    const currentExpenses = await this.getCurrentMonthExpenses(tenantId);
    const previousExpenses = await this.getPreviousMonthExpenses(tenantId);

    updates.push({
      tenantId,
      kpiName: 'monthlyExpenses',
      value: currentExpenses,
      previousValue: previousExpenses,
      change: currentExpenses - previousExpenses,
      changePercent: ((currentExpenses - previousExpenses) / previousExpenses) * 100,
      timestamp: new Date(),
    });

    this.broadcastKPIUpdates(tenantId, updates);
  }

  private async updateCashFlowKPIs(event: PaymentProcessedEvent): Promise<void> {
    const tenantId = event.tenantId;

    // Update cash flow KPIs
    const cashPosition = await this.getCurrentCashPosition(tenantId);

    const update: KPIUpdate = {
      tenantId,
      kpiName: 'cashPosition',
      value: cashPosition,
      previousValue: cashPosition - (event.type === 'INFLOW' ? event.amount : -event.amount),
      change: event.type === 'INFLOW' ? event.amount : -event.amount,
      changePercent: 0, // Will calculate based on previous
      timestamp: new Date(),
    };

    this.broadcastKPIUpdates(tenantId, [update]);
  }

  private async checkKPIThresholds(
    tenantId: string,
    kpis: RealTimeKPIs,
  ): Promise<SmartAlert[]> {
    const alerts: SmartAlert[] = [];
    const thresholds = this.thresholds.get(tenantId) || this.thresholds.get('default') || [];

    for (const threshold of thresholds) {
      const value = (kpis as any)[threshold.kpiName];
      if (value === undefined) continue;

      // Check critical thresholds
      if (threshold.criticalMin !== undefined && value < threshold.criticalMin) {
        alerts.push({
          type: 'CRITICAL',
          category: 'KPI_THRESHOLD',
          message: `${threshold.kpiName} (${value}) below critical minimum (${threshold.criticalMin})`,
          impact: 'CRITICAL',
          timestamp: new Date(),
          data: { kpi: threshold.kpiName, value, threshold: threshold.criticalMin },
        });
      } else if (threshold.criticalMax !== undefined && value > threshold.criticalMax) {
        alerts.push({
          type: 'CRITICAL',
          category: 'KPI_THRESHOLD',
          message: `${threshold.kpiName} (${value}) above critical maximum (${threshold.criticalMax})`,
          impact: 'CRITICAL',
          timestamp: new Date(),
          data: { kpi: threshold.kpiName, value, threshold: threshold.criticalMax },
        });
      }
      // Check warning thresholds
      else if (threshold.minValue !== undefined && value < threshold.minValue) {
        alerts.push({
          type: 'WARNING',
          category: 'KPI_THRESHOLD',
          message: `${threshold.kpiName} (${value}) below minimum threshold (${threshold.minValue})`,
          impact: 'MEDIUM',
          timestamp: new Date(),
          data: { kpi: threshold.kpiName, value, threshold: threshold.minValue },
        });
      } else if (threshold.maxValue !== undefined && value > threshold.maxValue) {
        alerts.push({
          type: 'WARNING',
          category: 'KPI_THRESHOLD',
          message: `${threshold.kpiName} (${value}) above maximum threshold (${threshold.maxValue})`,
          impact: 'MEDIUM',
          timestamp: new Date(),
          data: { kpi: threshold.kpiName, value, threshold: threshold.maxValue },
        });
      }
    }

    return alerts;
  }

  private async publishAlerts(tenantId: string, alerts: SmartAlert[]): Promise<void> {
    // Store alerts in database
    for (const alert of alerts) {
      alert.id = this.generateAlertId();

      await this.connection.query(
        `INSERT INTO finance.alerts (id, tenant_id, type, category, message, recommendation, impact, timestamp, data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          alert.id,
          tenantId,
          alert.type,
          alert.category,
          alert.message,
          alert.recommendation || null,
          alert.impact || null,
          alert.timestamp,
          JSON.stringify(alert.data || {}),
        ],
      );
    }

    // Publish alerts via event bus
    this.eventBus.publish({
      type: 'SMART_ALERTS_GENERATED',
      tenantId,
      alerts,
      timestamp: new Date(),
    } as any);
  }

  private broadcastKPIUpdate(tenantId: string, kpis: RealTimeKPIs): void {
    // Get or create stream for tenant
    if (!this.kpiStreams.has(tenantId)) {
      this.kpiStreams.set(tenantId, new Subject<KPIUpdate>());
    }

    // Emit KPI updates
    const stream = this.kpiStreams.get(tenantId);
    if (stream) {
      // Emit individual KPI updates
      Object.keys(kpis).forEach(kpiName => {
        if (kpiName !== 'lastUpdated') {
          stream.next({
            tenantId,
            kpiName,
            value: (kpis as any)[kpiName],
            previousValue: 0, // Would fetch from cache
            change: 0,
            changePercent: 0,
            timestamp: new Date(),
          });
        }
      });
    }
  }

  private broadcastKPIUpdates(tenantId: string, updates: KPIUpdate[]): void {
    const stream = this.kpiStreams.get(tenantId);
    if (stream) {
      updates.forEach(update => stream.next(update));
    }
  }

  // WebSocket Gateway for real-time updates
  subscribeToKPIUpdates(tenantId: string): Subject<KPIUpdate> {
    if (!this.kpiStreams.has(tenantId)) {
      this.kpiStreams.set(tenantId, new Subject<KPIUpdate>());
    }
    return this.kpiStreams.get(tenantId)!;
  }

  async setKPIThresholds(tenantId: string, thresholds: KPIThreshold[]): Promise<void> {
    this.thresholds.set(tenantId, thresholds);

    // Persist to database
    await this.connection.query(
      `INSERT INTO finance.kpi_thresholds (tenant_id, thresholds, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (tenant_id)
       DO UPDATE SET thresholds = $2, updated_at = NOW()`,
      [tenantId, JSON.stringify(thresholds)],
    );
  }

  private isCacheValid(lastUpdated: Date): boolean {
    const cacheAge = Date.now() - lastUpdated.getTime();
    return cacheAge < 60000; // Cache valid for 1 minute
  }

  private async getActiveTenants(): Promise<string[]> {
    const query = `
      SELECT DISTINCT tenant_id
      FROM finance.tenants
      WHERE is_active = true
        AND subscription_status = 'ACTIVE';
    `;

    const result = await this.connection.query(query);
    return result.map((row: any) => row.tenant_id);
  }

  private async getCurrentMonthRevenue(tenantId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);

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

  private async getPreviousMonthRevenue(tenantId: string): Promise<number> {
    const startOfPrevMonth = new Date();
    startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);
    startOfPrevMonth.setDate(1);

    const endOfPrevMonth = new Date();
    endOfPrevMonth.setDate(0);

    const query = `
      SELECT SUM(total) as revenue
      FROM finance.invoices
      WHERE tenant_id = $1
        AND invoice_date >= $2
        AND invoice_date <= $3
        AND status IN ('PAID', 'PARTIALLY_PAID');
    `;

    const result = await this.connection.query(query, [tenantId, startOfPrevMonth, endOfPrevMonth]);
    return result[0]?.revenue || 0;
  }

  private async getCurrentMonthExpenses(tenantId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);

    const query = `
      SELECT SUM(amount) as expenses
      FROM finance.expenses
      WHERE tenant_id = $1
        AND expense_date >= $2
        AND status = 'APPROVED';
    `;

    const result = await this.connection.query(query, [tenantId, startOfMonth]);
    return result[0]?.expenses || 0;
  }

  private async getPreviousMonthExpenses(tenantId: string): Promise<number> {
    const startOfPrevMonth = new Date();
    startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);
    startOfPrevMonth.setDate(1);

    const endOfPrevMonth = new Date();
    endOfPrevMonth.setDate(0);

    const query = `
      SELECT SUM(amount) as expenses
      FROM finance.expenses
      WHERE tenant_id = $1
        AND expense_date >= $2
        AND expense_date <= $3
        AND status = 'APPROVED';
    `;

    const result = await this.connection.query(query, [tenantId, startOfPrevMonth, endOfPrevMonth]);
    return result[0]?.expenses || 0;
  }

  private async getCurrentCashPosition(tenantId: string): Promise<number> {
    const query = `
      SELECT SUM(balance) as cash_position
      FROM finance.cash_accounts
      WHERE tenant_id = $1
        AND is_active = true;
    `;

    const result = await this.connection.query(query, [tenantId]);
    return result[0]?.cash_position || 0;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}