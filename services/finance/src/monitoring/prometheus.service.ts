import { Injectable } from '@nestjs/common';
import { PrometheusService as BasePrometheusService } from '@vextrus/shared-infrastructure';
import * as promClient from 'prom-client';

@Injectable()
export class PrometheusService extends BasePrometheusService {
  private readonly financeMetrics: {
    invoicesCreated: promClient.Counter<string>;
    paymentsProcessed: promClient.Counter<string>;
    expenseTracked: promClient.Counter<string>;
    transactionAmount: promClient.Histogram<string>;
    reconciliationTime: promClient.Histogram<string>;
    activeInvoices: promClient.Gauge<string>;
    outstandingBalance: promClient.Gauge<string>;
  };

  constructor() {
    super();

    // Initialize metrics after base class constructor
    this.financeMetrics = {
      invoicesCreated: this.createCounter(
        'finance_invoices_created_total',
        'Total number of invoices created',
        ['status', 'tenant']
      ),
      paymentsProcessed: this.createCounter(
        'finance_payments_processed_total',
        'Total number of payments processed',
        ['method', 'status', 'tenant']
      ),
      expenseTracked: this.createCounter(
        'finance_expenses_tracked_total',
        'Total number of expenses tracked',
        ['category', 'tenant']
      ),
      transactionAmount: this.createHistogram(
        'finance_transaction_amount',
        'Transaction amounts in BDT',
        ['type', 'tenant'],
        [100, 500, 1000, 5000, 10000, 50000, 100000, 500000]
      ),
      reconciliationTime: this.createHistogram(
        'finance_reconciliation_duration_seconds',
        'Time taken to reconcile payments',
        ['type'],
        [1, 5, 10, 30, 60, 120, 300]
      ),
      activeInvoices: this.createGauge(
        'finance_active_invoices',
        'Number of active invoices',
        ['status', 'tenant']
      ),
      outstandingBalance: this.createGauge(
        'finance_outstanding_balance_bdt',
        'Total outstanding balance in BDT',
        ['tenant']
      )
    };
  }

  recordInvoiceCreated(status: string, tenantId: string): void {
    this.financeMetrics.invoicesCreated.labels(status, tenantId).inc();
  }

  recordPaymentProcessed(
    method: string,
    status: string,
    tenantId: string
  ): void {
    this.financeMetrics.paymentsProcessed
      .labels(method, status, tenantId)
      .inc();
  }

  recordExpenseTracked(category: string, tenantId: string): void {
    this.financeMetrics.expenseTracked.labels(category, tenantId).inc();
  }

  recordTransactionAmount(
    type: string,
    amount: number,
    tenantId: string
  ): void {
    this.financeMetrics.transactionAmount
      .labels(type, tenantId)
      .observe(amount);
  }

  recordReconciliationTime(type: string, durationSeconds: number): void {
    this.financeMetrics.reconciliationTime.labels(type).observe(durationSeconds);
  }

  setActiveInvoices(
    status: string,
    count: number,
    tenantId: string
  ): void {
    this.financeMetrics.activeInvoices.labels(status, tenantId).set(count);
  }

  setOutstandingBalance(amount: number, tenantId: string): void {
    this.financeMetrics.outstandingBalance.labels(tenantId).set(amount);
  }

  /**
   * Query Prometheus metrics (stub implementation for now)
   */
  async query(promQL: string): Promise<any> {
    // TODO: Implement actual Prometheus query
    // This would typically query a Prometheus server
    console.log('Querying Prometheus:', promQL);
    return { data: { result: [] } };
  }

  getFinanceMetrics(): typeof this.financeMetrics {
    return this.financeMetrics;
  }
}