import { Injectable } from '@nestjs/common';
import { metrics, ValueType } from '@opentelemetry/api';
// Temporary Money interface until @vextrus/kernel exports it
interface Money {
  toNumber(): number;
}

@Injectable()
export class BusinessMetricsService {
  private meter = metrics.getMeter('vextrus-erp-business', '1.0.0');
  
  // Authentication metrics
  private loginCounter = this.meter.createCounter('auth.login.attempts', {
    description: 'Number of login attempts',
    unit: '1',
    valueType: ValueType.INT,
  });

  private registrationCounter = this.meter.createCounter('auth.registrations', {
    description: 'Number of user registrations',
    unit: '1',
    valueType: ValueType.INT,
  });

  private tokenRefreshCounter = this.meter.createCounter('auth.token.refreshes', {
    description: 'Number of token refresh operations',
    unit: '1',
    valueType: ValueType.INT,
  });

  private activeSessionsGauge = this.meter.createUpDownCounter('auth.sessions.active', {
    description: 'Number of active user sessions',
    unit: '1',
    valueType: ValueType.INT,
  });

  // Transaction metrics
  private transactionCounter = this.meter.createCounter('transaction.count', {
    description: 'Total number of transactions',
    unit: '1',
    valueType: ValueType.INT,
  });

  private transactionValueHistogram = this.meter.createHistogram('transaction.value', {
    description: 'Transaction monetary values in BDT',
    unit: 'BDT',
    valueType: ValueType.DOUBLE,
  });

  // Saga metrics
  private sagaCounter = this.meter.createCounter('saga.executions', {
    description: 'Number of saga executions',
    unit: '1',
    valueType: ValueType.INT,
  });

  private sagaDurationHistogram = this.meter.createHistogram('saga.duration', {
    description: 'Saga execution duration',
    unit: 'ms',
    valueType: ValueType.DOUBLE,
  });

  private compensationCounter = this.meter.createCounter('saga.compensations', {
    description: 'Number of saga compensations triggered',
    unit: '1',
    valueType: ValueType.INT,
  });

  // Bengali locale specific metrics
  private weekendTransactionCounter = this.meter.createCounter('transaction.weekend', {
    description: 'Transactions on Friday-Saturday (Bangladesh weekend)',
    unit: '1',
    valueType: ValueType.INT,
  });

  private mobilePaymentCounter = this.meter.createCounter('payment.mobile', {
    description: 'Mobile payments (bKash/Nagad)',
    unit: '1',
    valueType: ValueType.INT,
  });

  /**
   * Record authentication metrics
   */
  recordLoginAttempt(success: boolean, method: string, organizationId?: string): void {
    this.loginCounter.add(1, {
      'auth.success': success,
      'auth.method': method,
      'organization.id': organizationId || 'unknown',
    });
  }

  recordRegistration(organizationId: string, role: string): void {
    this.registrationCounter.add(1, {
      'organization.id': organizationId,
      'user.role': role,
    });
  }

  recordTokenRefresh(success: boolean): void {
    this.tokenRefreshCounter.add(1, {
      'refresh.success': success,
    });
  }

  updateActiveSessions(delta: number): void {
    this.activeSessionsGauge.add(delta);
  }

  /**
   * Record transaction metrics with Bengali business context
   */
  recordTransaction(
    type: string,
    amount: Money,
    organizationId: string,
    paymentMethod?: string,
  ): void {
    const amountInBDT = amount.toNumber();
    const isWeekend = this.isBangladeshWeekend(new Date());

    this.transactionCounter.add(1, {
      'transaction.type': type,
      'organization.id': organizationId,
      'payment.method': paymentMethod || 'unknown',
      'transaction.weekend': isWeekend,
    });

    this.transactionValueHistogram.record(amountInBDT, {
      'transaction.type': type,
      'organization.id': organizationId,
    });

    if (isWeekend) {
      this.weekendTransactionCounter.add(1, {
        'transaction.type': type,
      });
    }

    if (paymentMethod === 'bkash' || paymentMethod === 'nagad') {
      this.mobilePaymentCounter.add(1, {
        'payment.provider': paymentMethod,
        'organization.id': organizationId,
      });
    }
  }

  /**
   * Record saga execution metrics
   */
  recordSagaExecution(
    sagaType: string,
    success: boolean,
    duration: number,
    compensated: boolean = false,
  ): void {
    this.sagaCounter.add(1, {
      'saga.type': sagaType,
      'saga.success': success,
      'saga.compensated': compensated,
    });

    this.sagaDurationHistogram.record(duration, {
      'saga.type': sagaType,
      'saga.success': success,
    });

    if (compensated) {
      this.compensationCounter.add(1, {
        'saga.type': sagaType,
      });
    }
  }

  /**
   * Record saga step metrics
   */
  recordSagaStep(
    sagaType: string,
    stepName: string,
    success: boolean,
    duration: number,
  ): void {
    const stepCounter = this.meter.createCounter(`saga.${sagaType}.step`, {
      description: `Steps in ${sagaType} saga`,
      unit: '1',
      valueType: ValueType.INT,
    });

    stepCounter.add(1, {
      'step.name': stepName,
      'step.success': success,
    });

    const stepDuration = this.meter.createHistogram(`saga.${sagaType}.step.duration`, {
      description: `Step duration in ${sagaType} saga`,
      unit: 'ms',
      valueType: ValueType.DOUBLE,
    });

    stepDuration.record(duration, {
      'step.name': stepName,
    });
  }

  /**
   * Record business KPIs
   */
  recordOrderToCapRatio(ratio: number, period: string): void {
    const kpiGauge = this.meter.createObservableGauge('kpi.order_to_cash_ratio', {
      description: 'Order to cash conversion ratio',
      unit: '1',
      valueType: ValueType.DOUBLE,
    });

    kpiGauge.addCallback(async (observableResult) => {
      observableResult.observe(ratio, {
        'kpi.period': period,
      });
    });
  }

  recordAverageSagaCompletionTime(avgTime: number, sagaType: string): void {
    const avgGauge = this.meter.createObservableGauge('saga.avg_completion_time', {
      description: 'Average saga completion time',
      unit: 'ms',
      valueType: ValueType.DOUBLE,
    });

    avgGauge.addCallback(async (observableResult) => {
      observableResult.observe(avgTime, {
        'saga.type': sagaType,
      });
    });
  }

  /**
   * Check if date falls on Bangladesh weekend (Friday-Saturday)
   */
  private isBangladeshWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 5 || day === 6; // Friday = 5, Saturday = 6
  }

  /**
   * Record VAT/AIT tax metrics specific to Bangladesh
   */
  recordTaxCalculation(type: 'VAT' | 'AIT', amount: number, organizationId: string): void {
    const taxCounter = this.meter.createCounter('tax.calculations', {
      description: 'Tax calculations performed',
      unit: '1',
      valueType: ValueType.INT,
    });

    const taxAmountHistogram = this.meter.createHistogram('tax.amount', {
      description: 'Tax amounts in BDT',
      unit: 'BDT',
      valueType: ValueType.DOUBLE,
    });

    taxCounter.add(1, {
      'tax.type': type,
      'organization.id': organizationId,
    });

    taxAmountHistogram.record(amount, {
      'tax.type': type,
      'organization.id': organizationId,
    });
  }
}