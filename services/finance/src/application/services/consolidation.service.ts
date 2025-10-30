import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import moment from 'moment';
import * as lodash from 'lodash';

export interface Company {
  id: string;
  code: string;
  name: string;
  currency: string;
  country: string;
  parentId?: string;
  consolidationMethod: 'full' | 'equity' | 'proportional';
  ownershipPercentage: number;
  isEliminated: boolean;
  tenantId: string;
}

export interface ConsolidationPeriod {
  startDate: Date;
  endDate: Date;
  type: 'monthly' | 'quarterly' | 'yearly';
  year: number;
  period: number;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface ExchangeRates {
  closingRate: number;
  averageRate: number;
  historicalRate: number;
}

export interface CompanyFinancials {
  company: Company;
  period: ConsolidationPeriod;
  currency: Currency;
  accounts: AccountBalance[];
  trialBalance: TrialBalanceEntry[];
  transactions: Transaction[];
  metadata: {
    lastUpdated: Date;
    source: string;
    version: string;
  };
}

export interface AccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  balance: Money;
  localBalance?: Money;
  consolidatedBalance?: Money;
}

export interface Money {
  amount: number;
  currency: string;

  convertTo(targetCurrency: string, rate: number): Money;
  add(other: Money): Money;
  subtract(other: Money): Money;
  multiply(factor: number): Money;
  abs(): Money;
  isZero(): boolean;
}

class MoneyImpl implements Money {
  constructor(
    public amount: number,
    public currency: string
  ) {}

  convertTo(targetCurrency: string, rate: number): Money {
    if (this.currency === targetCurrency) {
      return this;
    }
    return new MoneyImpl(this.amount * rate, targetCurrency);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money in different currencies');
    }
    return new MoneyImpl(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract money in different currencies');
    }
    return new MoneyImpl(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new MoneyImpl(this.amount * factor, this.currency);
  }

  abs(): Money {
    return new MoneyImpl(Math.abs(this.amount), this.currency);
  }

  isZero(): boolean {
    return Math.abs(this.amount) < 0.01;
  }

  static zero(currency: string = 'BDT'): Money {
    return new MoneyImpl(0, currency);
  }
}

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export interface TrialBalanceEntry {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debit: number;
  credit: number;
  balance: number;
}

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: Money;
  fromAccount: string;
  toAccount: string;
  companyId: string;
  isIntercompany: boolean;
  intercompanyPartnerId?: string;
}

export interface ConsolidatedFinancials {
  balanceSheet: FinancialStatement;
  incomeStatement: FinancialStatement;
  cashFlow: CashFlowStatement;
  equityStatement: EquityStatement;
  notes: ConsolidationNote[];
  metadata: ConsolidationMetadata;
}

export interface FinancialStatement {
  title: string;
  period: ConsolidationPeriod;
  currency: Currency;
  sections: StatementSection[];
  totals: StatementTotal[];
}

export interface StatementSection {
  name: string;
  order: number;
  items: StatementLineItem[];
  subtotal?: Money;
}

export interface StatementLineItem {
  accountCode: string;
  description: string;
  amount: Money;
  localAmount?: Money;
  adjustments?: Money;
  eliminated?: Money;
  notes?: string[];
}

export interface StatementTotal {
  name: string;
  amount: Money;
  formula?: string;
}

export interface CashFlowStatement extends FinancialStatement {
  operatingActivities: StatementSection;
  investingActivities: StatementSection;
  financingActivities: StatementSection;
  netCashFlow: Money;
  beginningCash: Money;
  endingCash: Money;
}

export interface EquityStatement extends FinancialStatement {
  beginningBalance: Money;
  netIncome: Money;
  otherComprehensiveIncome: Money;
  dividends: Money;
  sharesIssued: Money;
  endingBalance: Money;
}

export interface ConsolidationNote {
  number: number;
  title: string;
  content: string;
  tables?: any[];
}

export interface ConsolidationMetadata {
  period: ConsolidationPeriod;
  baseCurrency: Currency;
  companies: Company[];
  exchangeRates: Map<string, ExchangeRates>;
  consolidationMethod: string;
  eliminationEntries: EliminationEntry[];
  adjustmentEntries: AdjustmentEntry[];
  generatedAt: Date;
  generatedBy: string;
}

export interface EliminationEntry {
  id: string;
  type: 'intercompany' | 'investment' | 'dividend' | 'unrealized-profit';
  description: string;
  fromCompany: string;
  toCompany: string;
  debitAccount: string;
  creditAccount: string;
  amount: Money;
  reference: string;
}

export interface AdjustmentEntry {
  id: string;
  type: 'fair-value' | 'goodwill' | 'minority-interest' | 'other';
  description: string;
  company: string;
  account: string;
  amount: Money;
  reason: string;
}

@Injectable()
export class ConsolidationService {
  private readonly logger = new Logger(ConsolidationService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async consolidateFinancials(
    companies: Company[],
    period: ConsolidationPeriod,
    baseCurrency: Currency
  ): Promise<ConsolidatedFinancials> {
    const startTime = Date.now();
    this.logger.log(`Starting consolidation for ${companies.length} companies`);

    try {
      // Step 1: Fetch financials for each company
      const companyFinancials = await this.fetchCompanyFinancials(companies, period);

      // Step 2: Get exchange rates
      const exchangeRates = await this.fetchExchangeRates(
        period.endDate,
        companyFinancials.map(cf => cf.currency),
        baseCurrency
      );

      // Step 3: Convert to base currency
      const converted = await this.convertToBaseCurrency(
        companyFinancials,
        baseCurrency,
        exchangeRates
      );

      // Step 4: Identify and eliminate intercompany transactions
      const eliminationEntries = await this.eliminateIntercompanyTransactions(converted);

      // Step 5: Apply consolidation adjustments
      const adjustmentEntries = await this.applyConsolidationAdjustments(
        converted,
        companies,
        period
      );

      // Step 6: Aggregate financials
      const aggregated = this.aggregateFinancials(converted, eliminationEntries, adjustmentEntries);

      // Step 7: Generate consolidated statements
      const statements = await this.generateConsolidatedStatements(
        aggregated,
        period,
        baseCurrency
      );

      // Step 8: Generate notes to financials
      const notes = this.generateConsolidationNotes(
        companies,
        eliminationEntries,
        adjustmentEntries,
        exchangeRates
      );

      const processingTime = Date.now() - startTime;

      // Emit consolidation completed event
      this.eventEmitter.emit('consolidation.completed', {
        period,
        companiesCount: companies.length,
        baseCurrency: baseCurrency.code,
        processingTimeMs: processingTime,
        eliminationsCount: eliminationEntries.length,
        adjustmentsCount: adjustmentEntries.length,
      });

      this.logger.log(`Consolidation completed in ${processingTime}ms`);

      return {
        ...statements,
        notes,
        metadata: {
          period,
          baseCurrency,
          companies,
          exchangeRates,
          consolidationMethod: 'FULL',
          eliminationEntries,
          adjustmentEntries,
          generatedAt: new Date(),
          generatedBy: 'SYSTEM',
        },
      };
    } catch (error) {
      this.logger.error('Consolidation failed', error);
      throw error;
    }
  }

  private async fetchCompanyFinancials(
    companies: Company[],
    period: ConsolidationPeriod
  ): Promise<CompanyFinancials[]> {
    const financials: CompanyFinancials[] = [];

    for (const company of companies) {
      const companyFinancials = await this.getCompanyFinancials(company, period);
      financials.push(companyFinancials);
    }

    return financials;
  }

  private async getCompanyFinancials(
    company: Company,
    period: ConsolidationPeriod
  ): Promise<CompanyFinancials> {
    // Mock implementation - fetch from database
    const accounts: AccountBalance[] = this.generateMockAccounts(company);
    const trialBalance = this.generateTrialBalance(accounts);
    const transactions = this.generateMockTransactions(company, period);

    return {
      company,
      period,
      currency: { code: company.currency, name: company.currency, symbol: '', decimals: 2 },
      accounts,
      trialBalance,
      transactions,
      metadata: {
        lastUpdated: new Date(),
        source: 'ERP',
        version: '1.0',
      },
    };
  }

  private generateMockAccounts(company: Company): AccountBalance[] {
    // Generate sample account balances
    const baseMultiplier = company.currency === 'BDT' ? 1 :
                          company.currency === 'USD' ? 0.009 : 0.008;

    return [
      // Assets
      {
        accountId: '1010',
        accountCode: '1010',
        accountName: 'Cash and Cash Equivalents',
        accountType: AccountType.ASSET,
        balance: new MoneyImpl(5000000 * baseMultiplier, company.currency),
      },
      {
        accountId: '1020',
        accountCode: '1020',
        accountName: 'Accounts Receivable',
        accountType: AccountType.ASSET,
        balance: new MoneyImpl(3000000 * baseMultiplier, company.currency),
      },
      {
        accountId: '1030',
        accountCode: '1030',
        accountName: 'Inventory',
        accountType: AccountType.ASSET,
        balance: new MoneyImpl(2000000 * baseMultiplier, company.currency),
      },
      {
        accountId: '1040',
        accountCode: '1040',
        accountName: 'Property, Plant & Equipment',
        accountType: AccountType.ASSET,
        balance: new MoneyImpl(15000000 * baseMultiplier, company.currency),
      },
      // Liabilities
      {
        accountId: '2010',
        accountCode: '2010',
        accountName: 'Accounts Payable',
        accountType: AccountType.LIABILITY,
        balance: new MoneyImpl(2000000 * baseMultiplier, company.currency),
      },
      {
        accountId: '2020',
        accountCode: '2020',
        accountName: 'Short-term Debt',
        accountType: AccountType.LIABILITY,
        balance: new MoneyImpl(3000000 * baseMultiplier, company.currency),
      },
      {
        accountId: '2030',
        accountCode: '2030',
        accountName: 'Long-term Debt',
        accountType: AccountType.LIABILITY,
        balance: new MoneyImpl(8000000 * baseMultiplier, company.currency),
      },
      // Equity
      {
        accountId: '3010',
        accountCode: '3010',
        accountName: 'Share Capital',
        accountType: AccountType.EQUITY,
        balance: new MoneyImpl(10000000 * baseMultiplier, company.currency),
      },
      {
        accountId: '3020',
        accountCode: '3020',
        accountName: 'Retained Earnings',
        accountType: AccountType.EQUITY,
        balance: new MoneyImpl(2000000 * baseMultiplier, company.currency),
      },
      // Revenue
      {
        accountId: '4010',
        accountCode: '4010',
        accountName: 'Sales Revenue',
        accountType: AccountType.REVENUE,
        balance: new MoneyImpl(20000000 * baseMultiplier, company.currency),
      },
      // Expenses
      {
        accountId: '5010',
        accountCode: '5010',
        accountName: 'Cost of Goods Sold',
        accountType: AccountType.EXPENSE,
        balance: new MoneyImpl(12000000 * baseMultiplier, company.currency),
      },
      {
        accountId: '5020',
        accountCode: '5020',
        accountName: 'Operating Expenses',
        accountType: AccountType.EXPENSE,
        balance: new MoneyImpl(5000000 * baseMultiplier, company.currency),
      },
    ];
  }

  private generateTrialBalance(accounts: AccountBalance[]): TrialBalanceEntry[] {
    return accounts.map(account => ({
      accountCode: account.accountCode,
      accountName: account.accountName,
      accountType: account.accountType,
      debit: [AccountType.ASSET, AccountType.EXPENSE].includes(account.accountType)
        ? account.balance.amount : 0,
      credit: [AccountType.LIABILITY, AccountType.EQUITY, AccountType.REVENUE].includes(account.accountType)
        ? account.balance.amount : 0,
      balance: account.balance.amount,
    }));
  }

  private generateMockTransactions(company: Company, period: ConsolidationPeriod): Transaction[] {
    const transactions: Transaction[] = [];

    // Generate some intercompany transactions
    if (company.parentId) {
      transactions.push({
        id: `ic-${company.id}-001`,
        date: new Date(period.endDate),
        description: 'Management fee to parent',
        amount: new MoneyImpl(100000, company.currency),
        fromAccount: '5030',
        toAccount: '2010',
        companyId: company.id,
        isIntercompany: true,
        intercompanyPartnerId: company.parentId,
      });
    }

    return transactions;
  }

  private async fetchExchangeRates(
    date: Date,
    currencies: Currency[],
    baseCurrency: Currency
  ): Promise<Map<string, ExchangeRates>> {
    const rates = new Map<string, ExchangeRates>();

    // Mock exchange rates (in production, fetch from rate provider)
    for (const currency of currencies) {
      if (currency.code === baseCurrency.code) {
        rates.set(currency.code, {
          closingRate: 1,
          averageRate: 1,
          historicalRate: 1,
        });
      } else {
        // BDT as base
        if (baseCurrency.code === 'BDT') {
          if (currency.code === 'USD') {
            rates.set('USD', {
              closingRate: 110.25,
              averageRate: 109.50,
              historicalRate: 108.00,
            });
          } else if (currency.code === 'EUR') {
            rates.set('EUR', {
              closingRate: 120.50,
              averageRate: 119.75,
              historicalRate: 118.00,
            });
          }
        }
        // USD as base
        else if (baseCurrency.code === 'USD') {
          if (currency.code === 'BDT') {
            rates.set('BDT', {
              closingRate: 1 / 110.25,
              averageRate: 1 / 109.50,
              historicalRate: 1 / 108.00,
            });
          }
        }
      }
    }

    return rates;
  }

  private async convertToBaseCurrency(
    financials: CompanyFinancials[],
    baseCurrency: Currency,
    exchangeRates: Map<string, ExchangeRates>
  ): Promise<CompanyFinancials[]> {
    const converted: CompanyFinancials[] = [];

    for (const companyFinancials of financials) {
      if (companyFinancials.currency.code === baseCurrency.code) {
        converted.push(companyFinancials);
        continue;
      }

      const rates = exchangeRates.get(companyFinancials.currency.code);
      if (!rates) {
        throw new Error(`No exchange rate found for ${companyFinancials.currency.code}`);
      }

      // Convert accounts using appropriate rates
      const convertedAccounts = companyFinancials.accounts.map(account => {
        const rate = this.getConversionRate(account.accountType, rates);
        const convertedBalance = account.balance.convertTo(baseCurrency.code, rate);

        return {
          ...account,
          localBalance: account.balance,
          balance: convertedBalance,
          consolidatedBalance: convertedBalance,
        };
      });

      // Convert transactions
      const convertedTransactions = companyFinancials.transactions.map(transaction => ({
        ...transaction,
        amount: transaction.amount.convertTo(
          baseCurrency.code,
          rates.averageRate
        ),
      }));

      converted.push({
        ...companyFinancials,
        currency: baseCurrency,
        accounts: convertedAccounts,
        transactions: convertedTransactions,
      });
    }

    return converted;
  }

  private getConversionRate(accountType: AccountType, rates: ExchangeRates): number {
    switch (accountType) {
      case AccountType.ASSET:
      case AccountType.LIABILITY:
        return rates.closingRate; // Balance sheet items use closing rate

      case AccountType.REVENUE:
      case AccountType.EXPENSE:
        return rates.averageRate; // P&L items use average rate

      case AccountType.EQUITY:
        return rates.historicalRate; // Equity uses historical rate

      default:
        return rates.closingRate;
    }
  }

  private async eliminateIntercompanyTransactions(
    financials: CompanyFinancials[]
  ): Promise<EliminationEntry[]> {
    const eliminations: EliminationEntry[] = [];

    // Find intercompany transactions
    const intercompanyTransactions = financials.flatMap(f =>
      f.transactions.filter(t => t.isIntercompany)
    );

    // Group by company pairs
    const grouped = lodash.groupBy(intercompanyTransactions, (t: Transaction) =>
      [t.companyId, t.intercompanyPartnerId].sort().join('-')
    );

    // Create elimination entries for matched transactions
    for (const [pairKey, transactions] of Object.entries(grouped)) {
      // Match transactions between companies
      for (let i = 0; i < transactions.length; i++) {
        for (let j = i + 1; j < transactions.length; j++) {
          const t1 = transactions[i];
          const t2 = transactions[j];

          // Check if transactions match (opposite sides of same transaction)
          if (this.isMatchingIntercompany(t1, t2)) {
            eliminations.push({
              id: `elim-${t1.id}-${t2.id}`,
              type: 'intercompany',
              description: `Eliminate intercompany: ${t1.description}`,
              fromCompany: t1.companyId,
              toCompany: t2.companyId,
              debitAccount: t2.toAccount,
              creditAccount: t1.fromAccount,
              amount: t1.amount,
              reference: `${t1.id}/${t2.id}`,
            });
          }
        }
      }
    }

    // Eliminate investment in subsidiaries
    for (const financial of financials) {
      if (financial.company.parentId) {
        const investment = this.findInvestmentAccount(
          financials,
          financial.company.parentId,
          financial.company.id
        );

        if (investment) {
          const equity = this.getEquityAmount(financial);

          eliminations.push({
            id: `elim-inv-${financial.company.id}`,
            type: 'investment',
            description: `Eliminate investment in ${financial.company.name}`,
            fromCompany: financial.company.parentId,
            toCompany: financial.company.id,
            debitAccount: '3010', // Share capital
            creditAccount: investment.accountCode,
            amount: equity.multiply(financial.company.ownershipPercentage / 100),
            reference: `INV-${financial.company.id}`,
          });
        }
      }
    }

    return eliminations;
  }

  private isMatchingIntercompany(t1: Transaction, t2: Transaction): boolean {
    // Check if transactions are matching intercompany transactions
    return (
      t1.companyId === t2.intercompanyPartnerId &&
      t2.companyId === t1.intercompanyPartnerId &&
      Math.abs(t1.amount.amount - t2.amount.amount) < 0.01 &&
      Math.abs(moment(t1.date).diff(moment(t2.date), 'days')) <= 5
    );
  }

  private findInvestmentAccount(
    financials: CompanyFinancials[],
    parentId: string,
    subsidiaryId: string
  ): AccountBalance | undefined {
    const parent = financials.find(f => f.company.id === parentId);
    if (!parent) return undefined;

    // Look for investment account (typically in non-current assets)
    return parent.accounts.find(a =>
      a.accountName.toLowerCase().includes('investment') &&
      a.accountType === AccountType.ASSET
    );
  }

  private getEquityAmount(financial: CompanyFinancials): Money {
    const equityAccounts = financial.accounts.filter(a =>
      a.accountType === AccountType.EQUITY
    );

    return equityAccounts.reduce(
      (sum, account) => sum.add(account.balance),
      MoneyImpl.zero(financial.currency.code)
    );
  }

  private async applyConsolidationAdjustments(
    financials: CompanyFinancials[],
    companies: Company[],
    period: ConsolidationPeriod
  ): Promise<AdjustmentEntry[]> {
    const adjustments: AdjustmentEntry[] = [];

    // Calculate goodwill for acquisitions
    for (const company of companies) {
      if (company.parentId) {
        const goodwill = await this.calculateGoodwill(company, financials);
        if (goodwill && goodwill.amount > 0) {
          adjustments.push({
            id: `adj-gw-${company.id}`,
            type: 'goodwill',
            description: `Goodwill on acquisition of ${company.name}`,
            company: company.parentId,
            account: '1050', // Goodwill account
            amount: goodwill,
            reason: 'Purchase price exceeds fair value of net assets',
          });
        }
      }
    }

    // Calculate minority interest
    for (const financial of financials) {
      if (financial.company.ownershipPercentage < 100) {
        const minorityInterest = this.calculateMinorityInterest(financial);
        if (minorityInterest && minorityInterest.amount > 0) {
          adjustments.push({
            id: `adj-mi-${financial.company.id}`,
            type: 'minority-interest',
            description: `Minority interest in ${financial.company.name}`,
            company: financial.company.id,
            account: '3030', // Minority interest account
            amount: minorityInterest,
            reason: `${100 - financial.company.ownershipPercentage}% minority ownership`,
          });
        }
      }
    }

    // Fair value adjustments
    const fairValueAdjustments = await this.calculateFairValueAdjustments(financials);
    adjustments.push(...fairValueAdjustments);

    return adjustments;
  }

  private async calculateGoodwill(
    company: Company,
    financials: CompanyFinancials[]
  ): Promise<Money | undefined> {
    // Simplified goodwill calculation
    // In production, would use acquisition price and fair value of net assets
    const financial = financials.find(f => f.company.id === company.id);
    if (!financial) return undefined;

    const netAssets = this.calculateNetAssets(financial);
    const purchasePrice = netAssets.multiply(1.2); // Mock 20% premium

    const goodwill = purchasePrice.subtract(netAssets);
    return goodwill.amount > 0 ? goodwill : undefined;
  }

  private calculateNetAssets(financial: CompanyFinancials): Money {
    const assets = financial.accounts
      .filter(a => a.accountType === AccountType.ASSET)
      .reduce((sum, a) => sum.add(a.balance), MoneyImpl.zero(financial.currency.code));

    const liabilities = financial.accounts
      .filter(a => a.accountType === AccountType.LIABILITY)
      .reduce((sum, a) => sum.add(a.balance), MoneyImpl.zero(financial.currency.code));

    return assets.subtract(liabilities);
  }

  private calculateMinorityInterest(financial: CompanyFinancials): Money {
    const equity = this.getEquityAmount(financial);
    const minorityPercentage = (100 - financial.company.ownershipPercentage) / 100;

    return equity.multiply(minorityPercentage);
  }

  private async calculateFairValueAdjustments(
    financials: CompanyFinancials[]
  ): Promise<AdjustmentEntry[]> {
    const adjustments: AdjustmentEntry[] = [];

    // Mock fair value adjustments
    // In production, would use market values for assets/liabilities
    for (const financial of financials) {
      // Example: PPE fair value adjustment
      const ppeAccount = financial.accounts.find(a =>
        a.accountCode === '1040' // Property, Plant & Equipment
      );

      if (ppeAccount) {
        const fairValueAdjustment = ppeAccount.balance.multiply(0.1); // 10% increase

        adjustments.push({
          id: `adj-fv-${financial.company.id}-ppe`,
          type: 'fair-value',
          description: `Fair value adjustment for PPE - ${financial.company.name}`,
          company: financial.company.id,
          account: '1040',
          amount: fairValueAdjustment,
          reason: 'Market value exceeds book value',
        });
      }
    }

    return adjustments;
  }

  private aggregateFinancials(
    financials: CompanyFinancials[],
    eliminations: EliminationEntry[],
    adjustments: AdjustmentEntry[]
  ): CompanyFinancials {
    // Create consolidated entity
    const consolidated: CompanyFinancials = {
      company: {
        id: 'consolidated',
        code: 'CONSOL',
        name: 'Consolidated Group',
        currency: financials[0].currency.code,
        country: 'BD',
        consolidationMethod: 'full',
        ownershipPercentage: 100,
        isEliminated: false,
        tenantId: 'default',
      },
      period: financials[0].period,
      currency: financials[0].currency,
      accounts: [],
      trialBalance: [],
      transactions: [],
      metadata: {
        lastUpdated: new Date(),
        source: 'Consolidation',
        version: '1.0',
      },
    };

    // Aggregate accounts
    const accountMap = new Map<string, AccountBalance>();

    // Sum up all company accounts
    for (const financial of financials) {
      for (const account of financial.accounts) {
        const key = account.accountCode;
        const existing = accountMap.get(key);

        if (existing) {
          existing.balance = existing.balance.add(account.balance);
        } else {
          accountMap.set(key, {
            ...account,
            balance: account.balance,
          });
        }
      }
    }

    // Apply eliminations
    for (const elimination of eliminations) {
      const debitAccount = accountMap.get(elimination.debitAccount);
      const creditAccount = accountMap.get(elimination.creditAccount);

      if (debitAccount) {
        debitAccount.balance = debitAccount.balance.add(elimination.amount);
      }
      if (creditAccount) {
        creditAccount.balance = creditAccount.balance.subtract(elimination.amount);
      }
    }

    // Apply adjustments
    for (const adjustment of adjustments) {
      const account = accountMap.get(adjustment.account);

      if (account) {
        if (adjustment.type === 'minority-interest') {
          // Minority interest reduces equity
          account.balance = account.balance.subtract(adjustment.amount);
        } else {
          account.balance = account.balance.add(adjustment.amount);
        }
      } else {
        // Create new account for adjustment
        accountMap.set(adjustment.account, {
          accountId: adjustment.account,
          accountCode: adjustment.account,
          accountName: this.getAccountName(adjustment.account, adjustment.type),
          accountType: this.getAccountType(adjustment.account),
          balance: adjustment.amount,
        });
      }
    }

    consolidated.accounts = Array.from(accountMap.values());
    consolidated.trialBalance = this.generateTrialBalance(consolidated.accounts);

    return consolidated;
  }

  private getAccountName(accountCode: string, adjustmentType: string): string {
    const accountNames: { [key: string]: string } = {
      '1050': 'Goodwill',
      '3030': 'Minority Interest',
      '7010': 'Foreign Exchange Gain/Loss',
    };

    return accountNames[accountCode] || `Account ${accountCode}`;
  }

  private getAccountType(accountCode: string): AccountType {
    const firstDigit = accountCode[0];

    switch (firstDigit) {
      case '1':
        return AccountType.ASSET;
      case '2':
        return AccountType.LIABILITY;
      case '3':
        return AccountType.EQUITY;
      case '4':
        return AccountType.REVENUE;
      case '5':
      case '6':
      case '7':
        return AccountType.EXPENSE;
      default:
        return AccountType.ASSET;
    }
  }

  private async generateConsolidatedStatements(
    consolidated: CompanyFinancials,
    period: ConsolidationPeriod,
    baseCurrency: Currency
  ): Promise<{
    balanceSheet: FinancialStatement;
    incomeStatement: FinancialStatement;
    cashFlow: CashFlowStatement;
    equityStatement: EquityStatement;
  }> {
    return {
      balanceSheet: this.generateBalanceSheet(consolidated, period, baseCurrency),
      incomeStatement: this.generateIncomeStatement(consolidated, period, baseCurrency),
      cashFlow: this.generateCashFlowStatement(consolidated, period, baseCurrency),
      equityStatement: this.generateEquityStatement(consolidated, period, baseCurrency),
    };
  }

  private generateBalanceSheet(
    consolidated: CompanyFinancials,
    period: ConsolidationPeriod,
    baseCurrency: Currency
  ): FinancialStatement {
    const assetAccounts = consolidated.accounts.filter(a => a.accountType === AccountType.ASSET);
    const liabilityAccounts = consolidated.accounts.filter(a => a.accountType === AccountType.LIABILITY);
    const equityAccounts = consolidated.accounts.filter(a => a.accountType === AccountType.EQUITY);

    const totalAssets = assetAccounts.reduce(
      (sum, a) => sum.add(a.balance),
      MoneyImpl.zero(baseCurrency.code)
    );

    const totalLiabilities = liabilityAccounts.reduce(
      (sum, a) => sum.add(a.balance),
      MoneyImpl.zero(baseCurrency.code)
    );

    const totalEquity = equityAccounts.reduce(
      (sum, a) => sum.add(a.balance),
      MoneyImpl.zero(baseCurrency.code)
    );

    return {
      title: 'Consolidated Balance Sheet',
      period,
      currency: baseCurrency,
      sections: [
        {
          name: 'Assets',
          order: 1,
          items: assetAccounts.map(a => ({
            accountCode: a.accountCode,
            description: a.accountName,
            amount: a.balance,
          })),
          subtotal: totalAssets,
        },
        {
          name: 'Liabilities',
          order: 2,
          items: liabilityAccounts.map(a => ({
            accountCode: a.accountCode,
            description: a.accountName,
            amount: a.balance,
          })),
          subtotal: totalLiabilities,
        },
        {
          name: 'Equity',
          order: 3,
          items: equityAccounts.map(a => ({
            accountCode: a.accountCode,
            description: a.accountName,
            amount: a.balance,
          })),
          subtotal: totalEquity,
        },
      ],
      totals: [
        { name: 'Total Assets', amount: totalAssets },
        { name: 'Total Liabilities', amount: totalLiabilities },
        { name: 'Total Equity', amount: totalEquity },
        { name: 'Total Liabilities and Equity', amount: totalLiabilities.add(totalEquity) },
      ],
    };
  }

  private generateIncomeStatement(
    consolidated: CompanyFinancials,
    period: ConsolidationPeriod,
    baseCurrency: Currency
  ): FinancialStatement {
    const revenueAccounts = consolidated.accounts.filter(a => a.accountType === AccountType.REVENUE);
    const expenseAccounts = consolidated.accounts.filter(a => a.accountType === AccountType.EXPENSE);

    const totalRevenue = revenueAccounts.reduce(
      (sum, a) => sum.add(a.balance),
      MoneyImpl.zero(baseCurrency.code)
    );

    const totalExpenses = expenseAccounts.reduce(
      (sum, a) => sum.add(a.balance),
      MoneyImpl.zero(baseCurrency.code)
    );

    const netIncome = totalRevenue.subtract(totalExpenses);

    return {
      title: 'Consolidated Income Statement',
      period,
      currency: baseCurrency,
      sections: [
        {
          name: 'Revenue',
          order: 1,
          items: revenueAccounts.map(a => ({
            accountCode: a.accountCode,
            description: a.accountName,
            amount: a.balance,
          })),
          subtotal: totalRevenue,
        },
        {
          name: 'Expenses',
          order: 2,
          items: expenseAccounts.map(a => ({
            accountCode: a.accountCode,
            description: a.accountName,
            amount: a.balance,
          })),
          subtotal: totalExpenses,
        },
      ],
      totals: [
        { name: 'Total Revenue', amount: totalRevenue },
        { name: 'Total Expenses', amount: totalExpenses },
        { name: 'Net Income', amount: netIncome },
      ],
    };
  }

  private generateCashFlowStatement(
    consolidated: CompanyFinancials,
    period: ConsolidationPeriod,
    baseCurrency: Currency
  ): CashFlowStatement {
    // Simplified cash flow statement
    const cashAccount = consolidated.accounts.find(a => a.accountCode === '1010');
    const beginningCash = MoneyImpl.zero(baseCurrency.code); // Would need prior period
    const endingCash = cashAccount?.balance || MoneyImpl.zero(baseCurrency.code);
    const netCashFlow = endingCash.subtract(beginningCash);

    return {
      title: 'Consolidated Cash Flow Statement',
      period,
      currency: baseCurrency,
      sections: [],
      totals: [],
      operatingActivities: {
        name: 'Operating Activities',
        order: 1,
        items: [],
        subtotal: MoneyImpl.zero(baseCurrency.code),
      },
      investingActivities: {
        name: 'Investing Activities',
        order: 2,
        items: [],
        subtotal: MoneyImpl.zero(baseCurrency.code),
      },
      financingActivities: {
        name: 'Financing Activities',
        order: 3,
        items: [],
        subtotal: MoneyImpl.zero(baseCurrency.code),
      },
      netCashFlow,
      beginningCash,
      endingCash,
    };
  }

  private generateEquityStatement(
    consolidated: CompanyFinancials,
    period: ConsolidationPeriod,
    baseCurrency: Currency
  ): EquityStatement {
    const equityAccounts = consolidated.accounts.filter(a => a.accountType === AccountType.EQUITY);
    const totalEquity = equityAccounts.reduce(
      (sum, a) => sum.add(a.balance),
      MoneyImpl.zero(baseCurrency.code)
    );

    return {
      title: 'Consolidated Statement of Changes in Equity',
      period,
      currency: baseCurrency,
      sections: [],
      totals: [],
      beginningBalance: totalEquity, // Would need prior period
      netIncome: MoneyImpl.zero(baseCurrency.code), // From income statement
      otherComprehensiveIncome: MoneyImpl.zero(baseCurrency.code),
      dividends: MoneyImpl.zero(baseCurrency.code),
      sharesIssued: MoneyImpl.zero(baseCurrency.code),
      endingBalance: totalEquity,
    };
  }

  private generateConsolidationNotes(
    companies: Company[],
    eliminations: EliminationEntry[],
    adjustments: AdjustmentEntry[],
    exchangeRates: Map<string, ExchangeRates>
  ): ConsolidationNote[] {
    const notes: ConsolidationNote[] = [];

    // Note 1: Basis of Consolidation
    notes.push({
      number: 1,
      title: 'Basis of Consolidation',
      content: `The consolidated financial statements include ${companies.length} companies. ` +
        `Full consolidation method has been applied for subsidiaries with ownership greater than 50%. ` +
        `All intercompany transactions and balances have been eliminated.`,
    });

    // Note 2: Foreign Currency Translation
    notes.push({
      number: 2,
      title: 'Foreign Currency Translation',
      content: `Foreign currency financial statements have been translated to BDT using the following methods: ` +
        `Assets and liabilities at closing rates, income and expenses at average rates, ` +
        `and equity at historical rates. Translation differences are recognized in other comprehensive income.`,
      tables: [this.generateExchangeRateTable(exchangeRates)],
    });

    // Note 3: Intercompany Eliminations
    if (eliminations.length > 0) {
      notes.push({
        number: 3,
        title: 'Intercompany Eliminations',
        content: `Total intercompany transactions eliminated: ${eliminations.length}. ` +
          `Total amount eliminated: ${eliminations.reduce(
            (sum, e) => sum + e.amount.amount,
            0
          ).toFixed(2)} BDT.`,
        tables: [this.generateEliminationTable(eliminations)],
      });
    }

    // Note 4: Consolidation Adjustments
    if (adjustments.length > 0) {
      notes.push({
        number: 4,
        title: 'Consolidation Adjustments',
        content: `Consolidation adjustments include goodwill recognition, minority interest calculation, ` +
          `and fair value adjustments.`,
        tables: [this.generateAdjustmentTable(adjustments)],
      });
    }

    return notes;
  }

  private generateExchangeRateTable(rates: Map<string, ExchangeRates>): any {
    const rows = [];
    for (const [currency, rate] of rates) {
      rows.push({
        Currency: currency,
        'Closing Rate': rate.closingRate.toFixed(4),
        'Average Rate': rate.averageRate.toFixed(4),
        'Historical Rate': rate.historicalRate.toFixed(4),
      });
    }
    return { headers: ['Currency', 'Closing Rate', 'Average Rate', 'Historical Rate'], rows };
  }

  private generateEliminationTable(eliminations: EliminationEntry[]): any {
    const rows = eliminations.map(e => ({
      Type: e.type,
      Description: e.description,
      Amount: e.amount.amount.toFixed(2),
      'Debit Account': e.debitAccount,
      'Credit Account': e.creditAccount,
    }));
    return {
      headers: ['Type', 'Description', 'Amount', 'Debit Account', 'Credit Account'],
      rows,
    };
  }

  private generateAdjustmentTable(adjustments: AdjustmentEntry[]): any {
    const rows = adjustments.map(a => ({
      Type: a.type,
      Description: a.description,
      Amount: a.amount.amount.toFixed(2),
      Account: a.account,
      Reason: a.reason,
    }));
    return {
      headers: ['Type', 'Description', 'Amount', 'Account', 'Reason'],
      rows,
    };
  }
}