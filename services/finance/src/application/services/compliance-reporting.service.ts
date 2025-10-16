import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import moment from 'moment';
import { TaxCalculationService, TaxType } from './tax-calculation.service';
import { BengaliLocalizationService } from './bengali-localization.service';
import { NBRIntegrationService, VATReturn, MushakSubmission } from './nbr-integration.service';
import { MushakGeneratorService, MushakFormType, MushakFormData } from './mushak-generator.service';
import { ChallanGeneratorService, ChallanType, ChallanData } from './challan-generator.service';
import { BankingIntegrationService, BankType } from './banking-integration.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export enum ReportType {
  VAT_RETURN = 'VAT_RETURN',
  INCOME_TAX_RETURN = 'INCOME_TAX_RETURN',
  TDS_RETURN = 'TDS_RETURN',
  AIT_RETURN = 'AIT_RETURN',
  RJSC_RETURN = 'RJSC_RETURN',
  AUDIT_REPORT = 'AUDIT_REPORT',
  COMPLIANCE_SUMMARY = 'COMPLIANCE_SUMMARY'
}

export enum ReportFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  HALF_YEARLY = 'HALF_YEARLY',
  ANNUAL = 'ANNUAL',
  ON_DEMAND = 'ON_DEMAND'
}

export enum ComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  PENDING = 'PENDING',
  OVERDUE = 'OVERDUE',
  SUBMITTED = 'SUBMITTED',
  REJECTED = 'REJECTED',
  UNDER_REVIEW = 'UNDER_REVIEW'
}

export interface ComplianceReport {
  reportType: ReportType;
  period: {
    from: Date;
    to: Date;
  };
  status: ComplianceStatus;
  dueDate: Date;
  submissionDate?: Date;
  data: any;
  violations?: ComplianceViolation[];
  penalties?: PenaltyCalculation[];
}

export interface ComplianceViolation {
  type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedDate: Date;
  dueDate?: Date;
  penaltyAmount?: number;
  correctionRequired: string;
}

export interface PenaltyCalculation {
  violationType: string;
  baseAmount: number;
  penaltyRate: number;
  daysLate: number;
  penaltyAmount: number;
  totalDue: number;
}

export interface ComplianceSchedule {
  reportType: ReportType;
  frequency: ReportFrequency;
  cronExpression?: string;
  nextRunDate: Date;
  lastRunDate?: Date;
  enabled: boolean;
  emailRecipients?: string[];
  autoSubmit: boolean;
}

export interface ComplianceDeadline {
  name: string;
  nameBengali: string;
  reportType: ReportType;
  dueDate: Date;
  reminderDays: number[];
  penaltyRate?: number;
  description: string;
}

export interface FilingStatus {
  reportType: ReportType;
  period: string;
  status: ComplianceStatus;
  filedDate?: Date;
  referenceNumber?: string;
  nextDueDate: Date;
}

@Injectable()
export class ComplianceReportingService {
  private readonly logger = new Logger(ComplianceReportingService.name);
  private readonly complianceDeadlines: ComplianceDeadline[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly eventEmitter: EventEmitter2,
    private readonly taxService: TaxCalculationService,
    private readonly bengaliService: BengaliLocalizationService,
    private readonly nbrService: NBRIntegrationService,
    private readonly mushakGenerator: MushakGeneratorService,
    private readonly challanGenerator: ChallanGeneratorService,
    private readonly bankingService: BankingIntegrationService
  ) {
    this.initializeComplianceDeadlines();
    this.registerScheduledJobs();
  }

  /**
   * Initialize compliance deadlines for Bangladesh
   */
  private initializeComplianceDeadlines(): void {
    const currentYear = new Date().getFullYear();

    // Monthly VAT return - Due by 15th of next month
    for (let month = 0; month < 12; month++) {
      this.complianceDeadlines.push({
        name: `VAT Return - ${moment().month(month).format('MMMM')}`,
        nameBengali: `ভ্যাট রিটার্ন - ${this.bengaliService.getMonthName(month)}`,
        reportType: ReportType.VAT_RETURN,
        dueDate: new Date(currentYear, month + 1, 15),
        reminderDays: [7, 3, 1],
        penaltyRate: 0.02, // 2% per month
        description: 'Monthly VAT return submission'
      });
    }

    // Annual Income Tax Return - Due by November 30
    this.complianceDeadlines.push({
      name: 'Annual Income Tax Return',
      nameBengali: 'বার্ষিক আয়কর রিটার্ন',
      reportType: ReportType.INCOME_TAX_RETURN,
      dueDate: new Date(currentYear, 10, 30), // November 30
      reminderDays: [30, 15, 7, 3, 1],
      penaltyRate: 0.05, // 5% penalty
      description: 'Annual income tax return for the assessment year'
    });

    // Quarterly TDS Return
    const quarters = [
      { month: 2, day: 31 }, // March 31
      { month: 5, day: 30 }, // June 30
      { month: 8, day: 30 }, // September 30
      { month: 11, day: 31 } // December 31
    ];

    quarters.forEach((quarter, index) => {
      this.complianceDeadlines.push({
        name: `TDS Return - Q${index + 1}`,
        nameBengali: `টিডিএস রিটার্ন - ত্রৈমাসিক ${index + 1}`,
        reportType: ReportType.TDS_RETURN,
        dueDate: new Date(currentYear, quarter.month, quarter.day),
        reminderDays: [15, 7, 3],
        penaltyRate: 0.02,
        description: `Quarterly TDS return for Q${index + 1}`
      });
    });

    // Annual RJSC Return - Due within 30 days after AGM
    this.complianceDeadlines.push({
      name: 'RJSC Annual Return',
      nameBengali: 'আরজেএসসি বার্ষিক রিটার্ন',
      reportType: ReportType.RJSC_RETURN,
      dueDate: new Date(currentYear, 3, 30), // Assuming AGM in March
      reminderDays: [15, 7, 3],
      penaltyRate: 0.10,
      description: 'Annual return to Registrar of Joint Stock Companies'
    });
  }

  /**
   * Register scheduled jobs for automatic reporting
   */
  private registerScheduledJobs(): void {
    // Monthly VAT return reminder - Run on 10th of every month
    const vatReminderJob = new CronJob('0 9 10 * *', () => {
      this.sendVATReturnReminder();
    });
    this.schedulerRegistry.addCronJob('vat-return-reminder', vatReminderJob);
    vatReminderJob.start();

    // Daily compliance check - Run every day at 8 AM
    const complianceCheckJob = new CronJob('0 8 * * *', () => {
      this.performDailyComplianceCheck();
    });
    this.schedulerRegistry.addCronJob('daily-compliance-check', complianceCheckJob);
    complianceCheckJob.start();

    // Weekly compliance summary - Run every Monday at 9 AM
    const weeklySummaryJob = new CronJob('0 9 * * 1', () => {
      this.generateWeeklyComplianceSummary();
    });
    this.schedulerRegistry.addCronJob('weekly-compliance-summary', weeklySummaryJob);
    weeklySummaryJob.start();
  }

  /**
   * Monthly VAT return automation (15th of each month)
   */
  @Cron('0 0 15 * *') // Runs at midnight on the 15th of every month
  async automateMonthlyVATReturn(): Promise<void> {
    try {
      this.logger.log('Starting automated monthly VAT return process');

      const previousMonth = moment().subtract(1, 'month');
      const returnPeriod = previousMonth.format('MM/YYYY');

      // Generate VAT return data
      const vatReturnData = await this.prepareVATReturn(
        previousMonth.startOf('month').toDate(),
        previousMonth.endOf('month').toDate()
      );

      // Generate Mushak-9.1 form
      const mushakForm = await this.mushakGenerator.generateMushakForm({
        formType: MushakFormType.MUSHAK_9_1,
        companyInfo: await this.getCompanyInfo(),
        additionalInfo: {
          returnMonth: returnPeriod,
          dueDate: moment().format('DD/MM/YYYY'),
          totalSales: vatReturnData.totalSales,
          outputVAT: vatReturnData.outputVAT,
          totalPurchases: vatReturnData.totalPurchases,
          inputVAT: vatReturnData.inputVAT,
          exports: vatReturnData.exports,
          exemptedSales: vatReturnData.exemptedSales,
          supplementaryDuty: vatReturnData.supplementaryDuty
        },
        bengaliLabels: true,
        includeQRCode: true
      } as MushakFormData);

      // Submit to NBR if auto-submit is enabled
      if (this.configService.get<boolean>('AUTO_SUBMIT_VAT_RETURN', false)) {
        const submission = await this.nbrService.submitVATReturn({
          returnPeriod,
          binNumber: await this.getCompanyBIN(),
          tinNumber: await this.getCompanyTIN(),
          totalSales: vatReturnData.totalSales,
          totalPurchases: vatReturnData.totalPurchases,
          outputVAT: vatReturnData.outputVAT,
          inputVAT: vatReturnData.inputVAT,
          netVAT: vatReturnData.netVAT,
          supplementaryDuty: vatReturnData.supplementaryDuty,
          adjustments: vatReturnData.adjustments,
          mushakForms: [
            {
              formType: '9.1',
              formData: vatReturnData,
              attachments: [mushakForm.pdfBuffer.toString('base64')]
            }
          ],
          submissionDate: new Date(),
          dueDate: new Date(moment().year(), moment().month(), 15)
        });

        this.logger.log(`VAT return submitted successfully: ${submission.referenceNumber}`);
      }

      // Emit event for notification
      this.eventEmitter.emit('compliance.vat-return.submitted', {
        period: returnPeriod,
        netVAT: vatReturnData.netVAT,
        submissionDate: new Date()
      });

    } catch (error) {
      this.logger.error(`Automated VAT return failed: ${(error as Error).message}`, (error as Error).stack);

      // Emit failure event
      this.eventEmitter.emit('compliance.vat-return.failed', {
        period: moment().subtract(1, 'month').format('MM/YYYY'),
        error: (error as Error).message
      });
    }
  }

  /**
   * Annual tax return automation (July 1st)
   */
  @Cron('0 0 1 7 *') // Runs at midnight on July 1st
  async automateAnnualTaxReturn(): Promise<void> {
    try {
      this.logger.log('Starting automated annual tax return process');

      const fiscalYear = this.taxService.getCurrentFiscalYear();
      const taxReturnData = await this.prepareIncomeTaxReturn(fiscalYear);

      // Generate Income Tax Return
      const taxReturn = await this.generateIncomeTaxReturn(taxReturnData);

      // Generate payment challan if tax is due
      if (taxReturnData.taxPayable > 0) {
        const challan = await this.challanGenerator.generateChallan({
          challanType: ChallanType.INCOME_TAX_CHALLAN,
          companyInfo: await this.getCompanyInfo(),
          paymentDetails: {
            paymentDate: new Date(),
            dueDate: moment().month(10).date(30).toDate(), // November 30
            paymentMode: 'ONLINE',
            paymentPeriod: fiscalYear.year,
            assessmentYear: fiscalYear.year
          },
          taxDetails: {
            principalAmount: taxReturnData.taxableIncome,
            taxAmount: taxReturnData.taxPayable,
            totalAmount: taxReturnData.taxPayable,
            taxType: TaxType.VAT,
            economicCode: '1-1143-0000-0311'
          },
          generateBarcode: true,
          generateQRCode: true
        } as ChallanData);

        this.logger.log(`Income tax challan generated: ${challan.challanNumber}`);
      }

      // Emit event
      this.eventEmitter.emit('compliance.income-tax-return.generated', {
        fiscalYear: fiscalYear.year,
        taxPayable: taxReturnData.taxPayable,
        dueDate: moment().month(10).date(30).toDate()
      });

    } catch (error) {
      this.logger.error(`Annual tax return automation failed: ${(error as Error).message}`, (error as Error).stack);
    }
  }

  /**
   * Send VAT return reminder
   */
  private async sendVATReturnReminder(): Promise<void> {
    try {
      const daysRemaining = 5; // Reminder 5 days before due date
      const dueDate = moment().add(daysRemaining, 'days').format('DD/MM/YYYY');

      this.logger.log(`Sending VAT return reminder - Due date: ${dueDate}`);

      // Emit reminder event
      this.eventEmitter.emit('compliance.reminder', {
        type: 'VAT_RETURN',
        dueDate,
        daysRemaining,
        message: `VAT return for ${moment().subtract(1, 'month').format('MMMM YYYY')} is due in ${daysRemaining} days`
      });
    } catch (error) {
      this.logger.error(`Failed to send VAT reminder: ${(error as Error).message}`, (error as Error).stack);
    }
  }

  /**
   * Perform daily compliance check
   */
  async performDailyComplianceCheck(): Promise<ComplianceReport[]> {
    try {
      this.logger.log('Performing daily compliance check');

      const violations: ComplianceViolation[] = [];
      const reports: ComplianceReport[] = [];

      // Check upcoming deadlines
      const upcomingDeadlines = this.getUpcomingDeadlines(30); // Next 30 days

      for (const deadline of upcomingDeadlines) {
        const daysUntilDue = moment(deadline.dueDate).diff(moment(), 'days');

        // Check if reminder should be sent
        if (deadline.reminderDays.includes(daysUntilDue)) {
          this.sendComplianceReminder(deadline);
        }

        // Check for overdue items
        if (daysUntilDue < 0) {
          violations.push({
            type: deadline.reportType,
            description: `${deadline.name} is overdue by ${Math.abs(daysUntilDue)} days`,
            severity: daysUntilDue < -7 ? 'CRITICAL' : 'HIGH',
            detectedDate: new Date(),
            dueDate: deadline.dueDate,
            penaltyAmount: this.calculatePenalty(0, Math.abs(daysUntilDue), deadline.penaltyRate),
            correctionRequired: `Submit ${deadline.name} immediately to avoid further penalties`
          });
        }
      }

      // Create compliance report
      const report: ComplianceReport = {
        reportType: ReportType.COMPLIANCE_SUMMARY,
        period: {
          from: moment().startOf('day').toDate(),
          to: moment().endOf('day').toDate()
        },
        status: violations.length === 0 ? ComplianceStatus.COMPLIANT : ComplianceStatus.PENDING,
        dueDate: new Date(),
        data: {
          upcomingDeadlines,
          violations
        },
        violations
      };

      reports.push(report);

      // Store compliance check results
      await this.storeComplianceReport(report);

      // Emit event if violations found
      if (violations.length > 0) {
        this.eventEmitter.emit('compliance.violations.detected', {
          count: violations.length,
          critical: violations.filter(v => v.severity === 'CRITICAL').length,
          violations
        });
      }

      return reports;
    } catch (error) {
      this.logger.error(`Daily compliance check failed: ${(error as Error).message}`, (error as Error).stack);
      return [];
    }
  }

  /**
   * Generate weekly compliance summary
   */
  async generateWeeklyComplianceSummary(): Promise<ComplianceReport> {
    try {
      this.logger.log('Generating weekly compliance summary');

      const weekStart = moment().startOf('week').toDate();
      const weekEnd = moment().endOf('week').toDate();

      // Collect all compliance data for the week
      const filingStatus = await this.getFilingStatus();
      const upcomingDeadlines = this.getUpcomingDeadlines(14); // Next 2 weeks
      const violations = await this.getViolations(weekStart, weekEnd);
      const penalties = await this.calculateTotalPenalties();

      const summary: ComplianceReport = {
        reportType: ReportType.COMPLIANCE_SUMMARY,
        period: { from: weekStart, to: weekEnd },
        status: this.determineOverallComplianceStatus(filingStatus, violations),
        dueDate: moment().endOf('week').toDate(),
        submissionDate: new Date(),
        data: {
          filingStatus,
          upcomingDeadlines,
          violationCount: violations.length,
          totalPenalties: penalties.reduce((sum, p) => sum + p.penaltyAmount, 0),
          complianceScore: this.calculateComplianceScore(filingStatus, violations)
        },
        violations,
        penalties
      };

      // Generate PDF report
      const pdfBuffer = await this.generateCompliancePDF(summary);

      // Store and distribute report
      await this.storeComplianceReport(summary);
      await this.distributeComplianceReport(summary, pdfBuffer);

      this.logger.log('Weekly compliance summary generated and distributed');

      return summary;
    } catch (error) {
      this.logger.error(`Weekly summary generation failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Prepare VAT return data
   */
  private async prepareVATReturn(fromDate: Date, toDate: Date): Promise<any> {
    // In a real implementation, this would fetch data from accounting system
    const salesData = await this.fetchSalesData(fromDate, toDate);
    const purchaseData = await this.fetchPurchaseData(fromDate, toDate);

    const totalSales = salesData.reduce((sum, s) => sum + s.amount, 0);
    const totalPurchases = purchaseData.reduce((sum, p) => sum + p.amount, 0);

    const outputVAT = totalSales * 0.15;
    const inputVAT = totalPurchases * 0.15;
    const netVAT = outputVAT - inputVAT;

    return {
      totalSales,
      totalPurchases,
      outputVAT,
      inputVAT,
      netVAT,
      exports: 0, // Would be calculated from actual data
      exemptedSales: 0,
      supplementaryDuty: 0,
      adjustments: []
    };
  }

  /**
   * Prepare income tax return data
   */
  private async prepareIncomeTaxReturn(fiscalYear: any): Promise<any> {
    // This would fetch actual financial data
    const revenue = 10000000; // Example
    const expenses = 7000000;
    const taxableIncome = revenue - expenses;
    const taxRate = 0.25; // 25% corporate tax rate
    const taxPayable = taxableIncome * taxRate;

    return {
      fiscalYear: fiscalYear.year,
      revenue,
      expenses,
      taxableIncome,
      taxRate,
      taxPayable,
      advanceTaxPaid: 0,
      tdsCollected: 0,
      netPayable: taxPayable
    };
  }

  /**
   * Generate income tax return document
   */
  private async generateIncomeTaxReturn(data: any): Promise<Buffer> {
    // This would generate actual tax return document
    const doc = {} as any; // PDFDocument instance
    // ... generate PDF
    return Buffer.from('');
  }

  /**
   * Get upcoming deadlines
   */
  getUpcomingDeadlines(days: number): ComplianceDeadline[] {
    const futureDate = moment().add(days, 'days').toDate();

    return this.complianceDeadlines.filter(deadline => {
      return deadline.dueDate >= new Date() && deadline.dueDate <= futureDate;
    }).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /**
   * Send compliance reminder
   */
  private async sendComplianceReminder(deadline: ComplianceDeadline): Promise<void> {
    const daysUntilDue = moment(deadline.dueDate).diff(moment(), 'days');

    this.logger.log(`Sending reminder for ${deadline.name} - Due in ${daysUntilDue} days`);

    this.eventEmitter.emit('compliance.reminder.send', {
      deadline,
      daysUntilDue,
      urgency: daysUntilDue <= 3 ? 'HIGH' : 'NORMAL'
    });
  }

  /**
   * Calculate penalty
   */
  private calculatePenalty(
    amount: number,
    daysLate: number,
    penaltyRate?: number
  ): number {
    if (!penaltyRate || daysLate <= 0) return 0;

    // Calculate monthly penalty
    const monthsLate = Math.ceil(daysLate / 30);
    return amount * penaltyRate * monthsLate;
  }

  /**
   * Get filing status
   */
  private async getFilingStatus(): Promise<FilingStatus[]> {
    // This would fetch actual filing status from database
    return [
      {
        reportType: ReportType.VAT_RETURN,
        period: moment().subtract(1, 'month').format('MM/YYYY'),
        status: ComplianceStatus.SUBMITTED,
        filedDate: new Date(),
        referenceNumber: 'VAT-2024-01-12345',
        nextDueDate: moment().add(1, 'month').date(15).toDate()
      }
    ];
  }

  /**
   * Get violations for period
   */
  private async getViolations(fromDate: Date, toDate: Date): Promise<ComplianceViolation[]> {
    // This would fetch actual violations from database
    return [];
  }

  /**
   * Calculate total penalties
   */
  private async calculateTotalPenalties(): Promise<PenaltyCalculation[]> {
    // This would calculate actual penalties
    return [];
  }

  /**
   * Determine overall compliance status
   */
  private determineOverallComplianceStatus(
    filingStatus: FilingStatus[],
    violations: ComplianceViolation[]
  ): ComplianceStatus {
    if (violations.length > 0) {
      return violations.some(v => v.severity === 'CRITICAL')
        ? ComplianceStatus.OVERDUE
        : ComplianceStatus.PENDING;
    }

    const pendingFilings = filingStatus.filter(f => f.status === ComplianceStatus.PENDING);
    if (pendingFilings.length > 0) {
      return ComplianceStatus.PENDING;
    }

    return ComplianceStatus.COMPLIANT;
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(
    filingStatus: FilingStatus[],
    violations: ComplianceViolation[]
  ): number {
    let score = 100;

    // Deduct for violations
    violations.forEach(v => {
      switch (v.severity) {
        case 'CRITICAL': score -= 25; break;
        case 'HIGH': score -= 15; break;
        case 'MEDIUM': score -= 10; break;
        case 'LOW': score -= 5; break;
      }
    });

    // Deduct for pending filings
    const pendingCount = filingStatus.filter(f => f.status === ComplianceStatus.PENDING).length;
    score -= pendingCount * 10;

    return Math.max(0, score);
  }

  /**
   * Generate compliance PDF report
   */
  private async generateCompliancePDF(report: ComplianceReport): Promise<Buffer> {
    // This would generate actual PDF report
    return Buffer.from('');
  }

  /**
   * Store compliance report
   */
  private async storeComplianceReport(report: ComplianceReport): Promise<void> {
    // This would store report in database
    this.logger.log(`Compliance report stored: ${report.reportType}`);
  }

  /**
   * Distribute compliance report
   */
  private async distributeComplianceReport(
    report: ComplianceReport,
    pdfBuffer: Buffer
  ): Promise<void> {
    // This would email report to configured recipients
    const recipients = this.configService.get<string[]>('COMPLIANCE_REPORT_RECIPIENTS', []);

    this.eventEmitter.emit('compliance.report.distribute', {
      report,
      recipients,
      attachment: pdfBuffer
    });
  }

  /**
   * Helper methods to get company information
   */
  private async getCompanyInfo(): Promise<any> {
    return {
      name: this.configService.get<string>('COMPANY_NAME', 'Test Company Ltd'),
      nameBengali: 'টেস্ট কোম্পানি লিমিটেড',
      bin: await this.getCompanyBIN(),
      tin: await this.getCompanyTIN(),
      address: this.configService.get<string>('COMPANY_ADDRESS', 'Dhaka, Bangladesh'),
      addressBengali: 'ঢাকা, বাংলাদেশ',
      phone: this.configService.get<string>('COMPANY_PHONE', '01700000000'),
      email: this.configService.get<string>('COMPANY_EMAIL', 'info@company.com')
    };
  }

  private async getCompanyBIN(): Promise<string> {
    return this.configService.get<string>('COMPANY_BIN', '123456789');
  }

  private async getCompanyTIN(): Promise<string> {
    return this.configService.get<string>('COMPANY_TIN', '123456789012');
  }

  /**
   * Mock data fetchers - would connect to actual accounting system
   */
  private async fetchSalesData(fromDate: Date, toDate: Date): Promise<any[]> {
    // Mock implementation
    return [
      { date: fromDate, amount: 100000, vatAmount: 15000 },
      { date: toDate, amount: 150000, vatAmount: 22500 }
    ];
  }

  private async fetchPurchaseData(fromDate: Date, toDate: Date): Promise<any[]> {
    // Mock implementation
    return [
      { date: fromDate, amount: 50000, vatAmount: 7500 },
      { date: toDate, amount: 75000, vatAmount: 11250 }
    ];
  }

  /**
   * Manual report generation methods
   */
  async generateVATReturnManual(period: string): Promise<any> {
    const [month, year] = period.split('/');
    const startDate = moment(`${year}-${month}-01`).startOf('month').toDate();
    const endDate = moment(`${year}-${month}-01`).endOf('month').toDate();

    return this.prepareVATReturn(startDate, endDate);
  }

  async generateComplianceCalendar(year?: number): Promise<ComplianceDeadline[]> {
    const targetYear = year || new Date().getFullYear();

    return this.complianceDeadlines.filter(deadline => {
      return deadline.dueDate.getFullYear() === targetYear;
    }).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /**
   * Check specific compliance requirement
   */
  async checkCompliance(reportType: ReportType, period?: string): Promise<ComplianceStatus> {
    // This would check actual compliance status
    const filingStatus = await this.getFilingStatus();
    const filing = filingStatus.find(f => f.reportType === reportType);

    if (!filing) {
      return ComplianceStatus.PENDING;
    }

    return filing.status;
  }

  /**
   * Get penalty details for late filing
   */
  async getLateFlingPenalty(
    reportType: ReportType,
    dueDate: Date,
    filingDate?: Date
  ): Promise<PenaltyCalculation> {
    const deadline = this.complianceDeadlines.find(d => d.reportType === reportType);
    if (!deadline) {
      throw new Error(`No deadline found for report type: ${reportType}`);
    }

    const actualFilingDate = filingDate || new Date();
    const daysLate = moment(actualFilingDate).diff(moment(dueDate), 'days');

    if (daysLate <= 0) {
      return {
        violationType: reportType,
        baseAmount: 0,
        penaltyRate: 0,
        daysLate: 0,
        penaltyAmount: 0,
        totalDue: 0
      };
    }

    // Example base amount - would be actual tax amount
    const baseAmount = 100000;
    const penaltyAmount = this.calculatePenalty(baseAmount, daysLate, deadline.penaltyRate);

    return {
      violationType: reportType,
      baseAmount,
      penaltyRate: deadline.penaltyRate || 0,
      daysLate,
      penaltyAmount,
      totalDue: baseAmount + penaltyAmount
    };
  }
}