import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { createHash, createCipheriv, createDecipheriv } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { AIReconciliationService } from './ai-reconciliation.service';
import { BengaliLocalizationService } from './bengali-localization.service';
import moment from 'moment';

export enum BankType {
  BRAC = 'BRAC',
  DBBL = 'DBBL',  // Dutch Bangla Bank
  ISLAMI = 'ISLAMI',
  SCB = 'SCB',    // Standard Chartered
  HSBC = 'HSBC',
  CITY = 'CITY',  // City Bank
  EBL = 'EBL',    // Eastern Bank
  UCB = 'UCB',    // United Commercial Bank
  SONALI = 'SONALI',
  JANATA = 'JANATA'
}

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  TRANSFER = 'TRANSFER',
  PAYMENT = 'PAYMENT',
  COLLECTION = 'COLLECTION'
}

export enum ReconciliationStatus {
  MATCHED = 'MATCHED',
  PARTIALLY_MATCHED = 'PARTIALLY_MATCHED',
  UNMATCHED = 'UNMATCHED',
  PENDING = 'PENDING',
  MANUAL_REVIEW = 'MANUAL_REVIEW'
}

export interface BankAccount {
  bankType: BankType;
  accountNumber: string;
  accountTitle: string;
  branchCode?: string;
  branchName?: string;
  currency: string;
  currentBalance?: number;
  availableBalance?: number;
}

export interface BankTransaction {
  transactionId: string;
  bankType: BankType;
  accountNumber: string;
  transactionDate: Date;
  valueDate: Date;
  description: string;
  reference: string;
  chequeNumber?: string;
  transactionType: TransactionType;
  amount: number;
  balance: number;
  particulars?: string;
  metadata?: Record<string, any>;
}

export interface StatementRequest {
  bankType: BankType;
  accountNumber: string;
  fromDate: Date;
  toDate: Date;
  format?: 'JSON' | 'CSV' | 'PDF';
}

export interface StatementResponse {
  bankType: BankType;
  accountNumber: string;
  accountTitle: string;
  period: {
    from: Date;
    to: Date;
  };
  openingBalance: number;
  closingBalance: number;
  transactions: BankTransaction[];
  summary: {
    totalDebits: number;
    totalCredits: number;
    transactionCount: number;
  };
}

export interface TransferRequest {
  fromBank: BankType;
  fromAccount: string;
  toBank: BankType;
  toAccount: string;
  toAccountTitle: string;
  amount: number;
  currency?: string;
  purpose: string;
  reference?: string;
  scheduledDate?: Date;
}

export interface TransferResponse {
  transferId: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  fromAccount: string;
  toAccount: string;
  amount: number;
  charges?: number;
  executedAt?: Date;
  referenceNumber: string;
  bankResponse?: any;
}

export interface ReconciliationRequest {
  bankTransactions: BankTransaction[];
  systemTransactions: any[];
  toleranceAmount?: number;
  tolerancePercentage?: number;
  dateRangeDays?: number;
}

export interface ReconciliationResult {
  totalBankTransactions: number;
  totalSystemTransactions: number;
  matchedTransactions: number;
  unmatchedBankTransactions: number;
  unmatchedSystemTransactions: number;
  reconciliationRate: number;
  matches: ReconciliationMatch[];
  unmatched: {
    bank: BankTransaction[];
    system: any[];
  };
  suggestedMatches: ReconciliationMatch[];
}

export interface ReconciliationMatch {
  bankTransaction: BankTransaction;
  systemTransaction: any;
  matchScore: number;
  matchType: 'EXACT' | 'PARTIAL' | 'SUGGESTED';
  matchCriteria: string[];
  differences?: {
    amount?: number;
    date?: number;
    description?: string;
  };
}

interface BankCredentials {
  [key: string]: {
    apiUrl: string;
    apiKey: string;
    apiSecret: string;
    username?: string;
    password?: string;
    clientId?: string;
  };
}

@Injectable()
export class BankingIntegrationService {
  private readonly logger = new Logger(BankingIntegrationService.name);
  private readonly bankCredentials: BankCredentials;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly aiReconciliationService: AIReconciliationService,
    private readonly bengaliService: BengaliLocalizationService
  ) {
    // Initialize bank credentials from config
    this.bankCredentials = {
      [BankType.BRAC]: {
        apiUrl: this.configService.get<string>('BRAC_BANK_API_URL', 'https://api.bracbank.com'),
        apiKey: this.configService.get<string>('BRAC_BANK_API_KEY', ''),
        apiSecret: this.configService.get<string>('BRAC_BANK_API_SECRET', ''),
        clientId: this.configService.get<string>('BRAC_BANK_CLIENT_ID', '')
      },
      [BankType.DBBL]: {
        apiUrl: this.configService.get<string>('DBBL_API_URL', 'https://api.dutchbanglabank.com'),
        apiKey: this.configService.get<string>('DBBL_API_KEY', ''),
        apiSecret: this.configService.get<string>('DBBL_API_SECRET', ''),
        username: this.configService.get<string>('DBBL_USERNAME', ''),
        password: this.configService.get<string>('DBBL_PASSWORD', '')
      },
      [BankType.ISLAMI]: {
        apiUrl: this.configService.get<string>('ISLAMI_BANK_API_URL', 'https://api.islamibank.com.bd'),
        apiKey: this.configService.get<string>('ISLAMI_BANK_API_KEY', ''),
        apiSecret: this.configService.get<string>('ISLAMI_BANK_API_SECRET', '')
      },
      [BankType.SCB]: {
        apiUrl: this.configService.get<string>('SCB_API_URL', 'https://api.sc.com/bd'),
        apiKey: this.configService.get<string>('SCB_API_KEY', ''),
        apiSecret: this.configService.get<string>('SCB_API_SECRET', ''),
        clientId: this.configService.get<string>('SCB_CLIENT_ID', '')
      }
    };
  }

  /**
   * Fetch bank statement
   */
  async fetchBankStatement(request: StatementRequest): Promise<StatementResponse> {
    try {
      this.logger.log(`Fetching statement for ${request.bankType} account ${request.accountNumber}`);

      switch (request.bankType) {
        case BankType.BRAC:
          return await this.fetchBracStatement(request);

        case BankType.DBBL:
          return await this.fetchDbblStatement(request);

        case BankType.ISLAMI:
          return await this.fetchIslamiStatement(request);

        case BankType.SCB:
          return await this.fetchScbStatement(request);

        default:
          throw new HttpException(
            `Bank integration not available for: ${request.bankType}`,
            HttpStatus.BAD_REQUEST
          );
      }
    } catch (error) {
      this.logger.error(`Statement fetch failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Fetch BRAC Bank statement
   */
  private async fetchBracStatement(request: StatementRequest): Promise<StatementResponse> {
    try {
      const credentials = this.bankCredentials[BankType.BRAC];

      // Generate authentication token
      const token = await this.getBankAuthToken(BankType.BRAC);

      const response = await firstValueFrom(
        this.httpService.post(
          `${credentials.apiUrl}/v1/accounts/${request.accountNumber}/statements`,
          {
            fromDate: moment(request.fromDate).format('YYYY-MM-DD'),
            toDate: moment(request.toDate).format('YYYY-MM-DD'),
            format: request.format || 'JSON'
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Client-Id': credentials.clientId,
              'Content-Type': 'application/json'
            }
          }
        )
      );

      // Parse BRAC Bank response format
      const transactions = response.data.transactions.map((tx: any) => this.parseBracTransaction(tx));

      return {
        bankType: BankType.BRAC,
        accountNumber: request.accountNumber,
        accountTitle: response.data.accountTitle,
        period: {
          from: new Date(response.data.fromDate),
          to: new Date(response.data.toDate)
        },
        openingBalance: response.data.openingBalance,
        closingBalance: response.data.closingBalance,
        transactions,
        summary: {
          totalDebits: response.data.totalDebits,
          totalCredits: response.data.totalCredits,
          transactionCount: transactions.length
        }
      };
    } catch (error) {
      this.logger.error(`BRAC statement fetch failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Fetch DBBL statement
   */
  private async fetchDbblStatement(request: StatementRequest): Promise<StatementResponse> {
    try {
      const credentials = this.bankCredentials[BankType.DBBL];

      // DBBL uses session-based authentication
      const sessionId = await this.getDbblSession();

      const response = await firstValueFrom(
        this.httpService.get(
          `${credentials.apiUrl}/api/statement`,
          {
            params: {
              accountNumber: request.accountNumber,
              fromDate: moment(request.fromDate).format('DD/MM/YYYY'),
              toDate: moment(request.toDate).format('DD/MM/YYYY')
            },
            headers: {
              'X-Session-Id': sessionId,
              'X-API-Key': credentials.apiKey
            }
          }
        )
      );

      // Parse DBBL response format
      const transactions = response.data.statementDetails.map((tx: any) => this.parseDbblTransaction(tx));

      return {
        bankType: BankType.DBBL,
        accountNumber: request.accountNumber,
        accountTitle: response.data.accountName,
        period: {
          from: new Date(response.data.periodFrom),
          to: new Date(response.data.periodTo)
        },
        openingBalance: response.data.openBalance,
        closingBalance: response.data.closeBalance,
        transactions,
        summary: {
          totalDebits: response.data.totalDebit,
          totalCredits: response.data.totalCredit,
          transactionCount: transactions.length
        }
      };
    } catch (error) {
      this.logger.error(`DBBL statement fetch failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Fetch Islami Bank statement
   */
  private async fetchIslamiStatement(request: StatementRequest): Promise<StatementResponse> {
    try {
      const credentials = this.bankCredentials[BankType.ISLAMI];

      // Islami Bank uses OAuth2
      const token = await this.getBankAuthToken(BankType.ISLAMI);

      const response = await firstValueFrom(
        this.httpService.post(
          `${credentials.apiUrl}/ibanking/api/account/statement`,
          {
            accountNo: request.accountNumber,
            startDate: moment(request.fromDate).format('YYYYMMDD'),
            endDate: moment(request.toDate).format('YYYYMMDD')
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-API-KEY': credentials.apiKey
            }
          }
        )
      );

      // Parse Islami Bank response
      const transactions = response.data.transactionList.map((tx: any) => this.parseIslamiTransaction(tx));

      return {
        bankType: BankType.ISLAMI,
        accountNumber: request.accountNumber,
        accountTitle: response.data.accountTitle,
        period: {
          from: new Date(response.data.fromDate),
          to: new Date(response.data.toDate)
        },
        openingBalance: response.data.beginningBalance,
        closingBalance: response.data.endingBalance,
        transactions,
        summary: {
          totalDebits: transactions
            .filter((t: BankTransaction) => t.transactionType === TransactionType.DEBIT)
            .reduce((sum: number, t: BankTransaction) => sum + t.amount, 0),
          totalCredits: transactions
            .filter((t: BankTransaction) => t.transactionType === TransactionType.CREDIT)
            .reduce((sum: number, t: BankTransaction) => sum + t.amount, 0),
          transactionCount: transactions.length
        }
      };
    } catch (error) {
      this.logger.error(`Islami Bank statement fetch failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Fetch SCB statement
   */
  private async fetchScbStatement(request: StatementRequest): Promise<StatementResponse> {
    try {
      const credentials = this.bankCredentials[BankType.SCB];

      const token = await this.getBankAuthToken(BankType.SCB);

      const response = await firstValueFrom(
        this.httpService.get(
          `${credentials.apiUrl}/accounts/${request.accountNumber}/transactions`,
          {
            params: {
              fromDate: request.fromDate.toISOString(),
              toDate: request.toDate.toISOString()
            },
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Client-Id': credentials.clientId
            }
          }
        )
      );

      // Parse SCB response
      const transactions = response.data.data.map((tx: any) => this.parseScbTransaction(tx));

      return {
        bankType: BankType.SCB,
        accountNumber: request.accountNumber,
        accountTitle: response.data.accountName,
        period: {
          from: request.fromDate,
          to: request.toDate
        },
        openingBalance: response.data.openingBalance,
        closingBalance: response.data.closingBalance,
        transactions,
        summary: {
          totalDebits: response.data.totalDebits,
          totalCredits: response.data.totalCredits,
          transactionCount: transactions.length
        }
      };
    } catch (error) {
      this.logger.error(`SCB statement fetch failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Initiate bank transfer
   */
  async initiateTransfer(request: TransferRequest): Promise<TransferResponse> {
    try {
      this.logger.log(`Initiating transfer from ${request.fromBank} to ${request.toBank}`);

      // Validate accounts
      if (!this.validateAccountNumber(request.fromAccount, request.fromBank)) {
        throw new HttpException('Invalid source account number', HttpStatus.BAD_REQUEST);
      }

      if (!this.validateAccountNumber(request.toAccount, request.toBank)) {
        throw new HttpException('Invalid destination account number', HttpStatus.BAD_REQUEST);
      }

      // Route to appropriate bank handler
      switch (request.fromBank) {
        case BankType.BRAC:
          return await this.initiateBracTransfer(request);

        case BankType.DBBL:
          return await this.initiateDbblTransfer(request);

        case BankType.ISLAMI:
          return await this.initiateIslamiTransfer(request);

        default:
          throw new HttpException(
            `Transfer not supported from: ${request.fromBank}`,
            HttpStatus.BAD_REQUEST
          );
      }
    } catch (error) {
      this.logger.error(`Transfer initiation failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Initiate BRAC Bank transfer
   */
  private async initiateBracTransfer(request: TransferRequest): Promise<TransferResponse> {
    try {
      const credentials = this.bankCredentials[BankType.BRAC];
      const token = await this.getBankAuthToken(BankType.BRAC);

      const transferId = `BRAC_${Date.now()}_${uuidv4().substring(0, 8)}`;

      const transferRequest = {
        transferId: transferId,
        fromAccount: request.fromAccount,
        toAccount: request.toAccount,
        toAccountName: request.toAccountTitle,
        toBankCode: this.getBankCode(request.toBank),
        amount: request.amount,
        currency: request.currency || 'BDT',
        purpose: request.purpose,
        reference: request.reference || transferId,
        transferType: request.fromBank === request.toBank ? 'INTERNAL' : 'EXTERNAL',
        scheduledDate: request.scheduledDate?.toISOString()
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${credentials.apiUrl}/v1/transfers/initiate`,
          transferRequest,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Client-Id': credentials.clientId,
              'Content-Type': 'application/json'
            }
          }
        )
      );

      return {
        transferId: response.data.transferId,
        status: response.data.status,
        fromAccount: request.fromAccount,
        toAccount: request.toAccount,
        amount: request.amount,
        charges: response.data.charges,
        executedAt: response.data.executedAt ? new Date(response.data.executedAt) : undefined,
        referenceNumber: response.data.referenceNumber,
        bankResponse: response.data
      };
    } catch (error) {
      this.logger.error(`BRAC transfer failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Initiate DBBL transfer
   */
  private async initiateDbblTransfer(request: TransferRequest): Promise<TransferResponse> {
    try {
      const credentials = this.bankCredentials[BankType.DBBL];
      const sessionId = await this.getDbblSession();

      const transferRequest = {
        debitAccount: request.fromAccount,
        creditAccount: request.toAccount,
        creditAccountName: request.toAccountTitle,
        amount: request.amount,
        transferPurpose: request.purpose,
        referenceNo: request.reference || `DBBL${Date.now()}`,
        transferDate: request.scheduledDate
          ? moment(request.scheduledDate).format('DD/MM/YYYY')
          : moment().format('DD/MM/YYYY')
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${credentials.apiUrl}/api/transfer`,
          transferRequest,
          {
            headers: {
              'X-Session-Id': sessionId,
              'X-API-Key': credentials.apiKey
            }
          }
        )
      );

      return {
        transferId: response.data.transactionId,
        status: response.data.status === '00' ? 'SUCCESS' : 'FAILED',
        fromAccount: request.fromAccount,
        toAccount: request.toAccount,
        amount: request.amount,
        charges: response.data.charge,
        executedAt: new Date(),
        referenceNumber: response.data.referenceNumber,
        bankResponse: response.data
      };
    } catch (error) {
      this.logger.error(`DBBL transfer failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Initiate Islami Bank transfer
   */
  private async initiateIslamiTransfer(request: TransferRequest): Promise<TransferResponse> {
    try {
      const credentials = this.bankCredentials[BankType.ISLAMI];
      const token = await this.getBankAuthToken(BankType.ISLAMI);

      const transferRequest = {
        sourceAccount: request.fromAccount,
        destinationAccount: request.toAccount,
        beneficiaryName: request.toAccountTitle,
        transferAmount: request.amount,
        transferPurpose: request.purpose,
        narration: request.reference,
        valueDate: request.scheduledDate
          ? moment(request.scheduledDate).format('YYYYMMDD')
          : moment().format('YYYYMMDD')
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${credentials.apiUrl}/ibanking/api/fund/transfer`,
          transferRequest,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-API-KEY': credentials.apiKey
            }
          }
        )
      );

      return {
        transferId: response.data.transactionRef,
        status: response.data.responseCode === '000' ? 'SUCCESS' : 'FAILED',
        fromAccount: request.fromAccount,
        toAccount: request.toAccount,
        amount: request.amount,
        charges: response.data.serviceCharge,
        executedAt: new Date(),
        referenceNumber: response.data.ftReference,
        bankResponse: response.data
      };
    } catch (error) {
      this.logger.error(`Islami Bank transfer failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Auto-reconcile transactions
   */
  async autoReconcile(request: ReconciliationRequest): Promise<ReconciliationResult> {
    try {
      this.logger.log(`Starting auto-reconciliation for ${request.bankTransactions.length} bank transactions`);

      const matches: ReconciliationMatch[] = [];
      const unmatchedBank: BankTransaction[] = [...request.bankTransactions];
      const unmatchedSystem: any[] = [...request.systemTransactions];
      const suggestedMatches: ReconciliationMatch[] = [];

      // Set default tolerance values
      const toleranceAmount = request.toleranceAmount || 1; // 1 BDT tolerance
      const tolerancePercentage = request.tolerancePercentage || 0.001; // 0.1% tolerance
      const dateRangeDays = request.dateRangeDays || 3; // 3 days date tolerance

      // Phase 1: Exact matching
      for (let i = unmatchedBank.length - 1; i >= 0; i--) {
        const bankTx = unmatchedBank[i];

        for (let j = unmatchedSystem.length - 1; j >= 0; j--) {
          const systemTx = unmatchedSystem[j];

          if (this.isExactMatch(bankTx, systemTx, toleranceAmount)) {
            matches.push({
              bankTransaction: bankTx,
              systemTransaction: systemTx,
              matchScore: 1.0,
              matchType: 'EXACT',
              matchCriteria: ['amount', 'date', 'reference']
            });

            unmatchedBank.splice(i, 1);
            unmatchedSystem.splice(j, 1);
            break;
          }
        }
      }

      // Phase 2: Partial matching with tolerance
      for (let i = unmatchedBank.length - 1; i >= 0; i--) {
        const bankTx = unmatchedBank[i];

        for (let j = unmatchedSystem.length - 1; j >= 0; j--) {
          const systemTx = unmatchedSystem[j];

          const matchResult = this.checkPartialMatch(
            bankTx,
            systemTx,
            toleranceAmount,
            tolerancePercentage,
            dateRangeDays
          );

          if (matchResult.isMatch && matchResult.score > 0.8) {
            matches.push({
              bankTransaction: bankTx,
              systemTransaction: systemTx,
              matchScore: matchResult.score,
              matchType: 'PARTIAL',
              matchCriteria: matchResult.criteria,
              differences: matchResult.differences
            });

            unmatchedBank.splice(i, 1);
            unmatchedSystem.splice(j, 1);
            break;
          }
        }
      }

      // Phase 3: AI-powered matching for remaining transactions
      if (unmatchedBank.length > 0 && unmatchedSystem.length > 0) {
        // Map BankTransaction to AI service format
        const mappedBankTransactions = unmatchedBank.map(tx => this.mapToAIBankTransaction(tx));

        const aiSuggestions = await this.aiReconciliationService.suggestMatches(
          mappedBankTransactions,
          unmatchedSystem
        );

        for (const suggestion of aiSuggestions) {
          if (suggestion.confidence > 0.7) {
            const bankTx = unmatchedBank.find(tx =>
              tx.transactionId === suggestion.transaction.id
            );
            const systemTx = unmatchedSystem.find(tx =>
              tx.id === suggestion.payment.id
            );

            if (bankTx && systemTx) {
              suggestedMatches.push({
                bankTransaction: bankTx,
                systemTransaction: systemTx,
                matchScore: suggestion.confidence,
                matchType: 'SUGGESTED',
                matchCriteria: [`AI confidence: ${suggestion.confidence}`, `Match type: ${suggestion.matchType}`]
              });

              // Remove from unmatched if confidence is very high
              if (suggestion.confidence > 0.9) {
                const bankIndex = unmatchedBank.indexOf(bankTx);
                const systemIndex = unmatchedSystem.indexOf(systemTx);

                if (bankIndex !== -1) unmatchedBank.splice(bankIndex, 1);
                if (systemIndex !== -1) unmatchedSystem.splice(systemIndex, 1);

                // Move to matches
                matches.push(suggestedMatches.pop()!);
              }
            }
          }
        }
      }

      // Calculate reconciliation rate
      const totalBankTransactions = request.bankTransactions.length;
      const matchedTransactions = matches.length;
      const reconciliationRate = totalBankTransactions > 0
        ? (matchedTransactions / totalBankTransactions) * 100
        : 0;

      this.logger.log(`Reconciliation completed: ${reconciliationRate.toFixed(2)}% match rate`);

      return {
        totalBankTransactions,
        totalSystemTransactions: request.systemTransactions.length,
        matchedTransactions,
        unmatchedBankTransactions: unmatchedBank.length,
        unmatchedSystemTransactions: unmatchedSystem.length,
        reconciliationRate,
        matches,
        unmatched: {
          bank: unmatchedBank,
          system: unmatchedSystem
        },
        suggestedMatches
      };
    } catch (error) {
      this.logger.error(`Auto-reconciliation failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Check if exact match
   */
  private isExactMatch(
    bankTx: BankTransaction,
    systemTx: any,
    toleranceAmount: number
  ): boolean {
    // Check amount with tolerance
    const amountMatch = Math.abs(bankTx.amount - systemTx.amount) <= toleranceAmount;

    // Check date (same day)
    const bankDate = moment(bankTx.transactionDate).format('YYYY-MM-DD');
    const systemDate = moment(systemTx.transactionDate).format('YYYY-MM-DD');
    const dateMatch = bankDate === systemDate;

    // Check reference
    const referenceMatch = bankTx.reference === systemTx.referenceNumber ||
                          bankTx.description.includes(systemTx.referenceNumber) ||
                          systemTx.description?.includes(bankTx.reference);

    return amountMatch && dateMatch && referenceMatch;
  }

  /**
   * Check partial match with tolerance
   */
  private checkPartialMatch(
    bankTx: BankTransaction,
    systemTx: any,
    toleranceAmount: number,
    tolerancePercentage: number,
    dateRangeDays: number
  ): {
    isMatch: boolean;
    score: number;
    criteria: string[];
    differences?: any;
  } {
    let score = 0;
    const criteria: string[] = [];
    const differences: any = {};

    // Check amount with percentage tolerance
    const amountDiff = Math.abs(bankTx.amount - systemTx.amount);
    const percentageDiff = amountDiff / bankTx.amount;

    if (amountDiff <= toleranceAmount || percentageDiff <= tolerancePercentage) {
      score += 0.4;
      criteria.push('amount');
      if (amountDiff > 0) {
        differences.amount = amountDiff;
      }
    }

    // Check date within range
    const daysDiff = Math.abs(
      moment(bankTx.transactionDate).diff(moment(systemTx.transactionDate), 'days')
    );

    if (daysDiff <= dateRangeDays) {
      score += 0.3;
      criteria.push('date');
      if (daysDiff > 0) {
        differences.date = daysDiff;
      }
    }

    // Check reference or description similarity
    const refMatch = this.checkReferenceSimilarity(bankTx, systemTx);
    if (refMatch > 0.5) {
      score += 0.3 * refMatch;
      criteria.push('reference');
    }

    return {
      isMatch: score > 0.5,
      score,
      criteria,
      differences: Object.keys(differences).length > 0 ? differences : undefined
    };
  }

  /**
   * Check reference similarity
   */
  private checkReferenceSimilarity(bankTx: BankTransaction, systemTx: any): number {
    const bankRef = (bankTx.reference + ' ' + bankTx.description).toLowerCase();
    const systemRef = (systemTx.referenceNumber + ' ' + (systemTx.description || '')).toLowerCase();

    // Check for exact reference match
    if (bankTx.reference === systemTx.referenceNumber) {
      return 1.0;
    }

    // Check for partial matches
    if (bankRef.includes(systemTx.referenceNumber?.toLowerCase()) ||
        systemRef.includes(bankTx.reference?.toLowerCase())) {
      return 0.8;
    }

    // Check for invoice/order number patterns
    const invoicePattern = /INV[-\d]+/gi;
    const bankInvoice = bankRef.match(invoicePattern);
    const systemInvoice = systemRef.match(invoicePattern);

    if (bankInvoice && systemInvoice && bankInvoice[0] === systemInvoice[0]) {
      return 0.9;
    }

    // Check for amount in description
    const amountInBank = bankRef.includes(systemTx.amount.toString());
    const amountInSystem = systemRef.includes(bankTx.amount.toString());

    if (amountInBank || amountInSystem) {
      return 0.6;
    }

    return 0;
  }

  /**
   * Parse BRAC transaction
   */
  private parseBracTransaction(tx: any): BankTransaction {
    return {
      transactionId: tx.transactionId,
      bankType: BankType.BRAC,
      accountNumber: tx.accountNumber,
      transactionDate: new Date(tx.transactionDate),
      valueDate: new Date(tx.valueDate),
      description: tx.particular,
      reference: tx.referenceNo,
      chequeNumber: tx.chequeNo,
      transactionType: tx.debitAmount ? TransactionType.DEBIT : TransactionType.CREDIT,
      amount: tx.debitAmount || tx.creditAmount,
      balance: tx.balance,
      particulars: tx.particular,
      metadata: {
        branchCode: tx.branchCode,
        instrumentNo: tx.instrumentNo
      }
    };
  }

  /**
   * Parse DBBL transaction
   */
  private parseDbblTransaction(tx: any): BankTransaction {
    return {
      transactionId: tx.tranId,
      bankType: BankType.DBBL,
      accountNumber: tx.accountNo,
      transactionDate: moment(tx.tranDate, 'DD/MM/YYYY').toDate(),
      valueDate: moment(tx.valueDate, 'DD/MM/YYYY').toDate(),
      description: tx.narration,
      reference: tx.refNo,
      chequeNumber: tx.chqNo,
      transactionType: tx.drAmount ? TransactionType.DEBIT : TransactionType.CREDIT,
      amount: parseFloat(tx.drAmount || tx.crAmount),
      balance: parseFloat(tx.balance),
      particulars: tx.particular
    };
  }

  /**
   * Parse Islami Bank transaction
   */
  private parseIslamiTransaction(tx: any): BankTransaction {
    return {
      transactionId: tx.tranRefNo,
      bankType: BankType.ISLAMI,
      accountNumber: tx.accountNumber,
      transactionDate: moment(tx.tranDate, 'YYYYMMDD').toDate(),
      valueDate: moment(tx.valueDate, 'YYYYMMDD').toDate(),
      description: tx.tranParticular,
      reference: tx.tranRefNo,
      chequeNumber: tx.instrumentNo,
      transactionType: tx.tranType === 'D' ? TransactionType.DEBIT : TransactionType.CREDIT,
      amount: parseFloat(tx.tranAmount),
      balance: parseFloat(tx.currentBalance),
      particulars: tx.tranParticular,
      metadata: {
        tranCode: tx.tranCode,
        branchCode: tx.branchCode
      }
    };
  }

  /**
   * Parse SCB transaction
   */
  private parseScbTransaction(tx: any): BankTransaction {
    return {
      transactionId: tx.transactionReference,
      bankType: BankType.SCB,
      accountNumber: tx.accountId,
      transactionDate: new Date(tx.bookingDate),
      valueDate: new Date(tx.valueDate),
      description: tx.transactionInformation,
      reference: tx.reference,
      transactionType: tx.creditDebitIndicator === 'DEBIT' ? TransactionType.DEBIT : TransactionType.CREDIT,
      amount: parseFloat(tx.amount.value),
      balance: parseFloat(tx.balanceAfter.value),
      particulars: tx.additionalInformation,
      metadata: {
        currency: tx.amount.currency,
        status: tx.status
      }
    };
  }

  /**
   * Get bank authentication token
   */
  private async getBankAuthToken(bankType: BankType): Promise<string> {
    const credentials = this.bankCredentials[bankType];

    try {
      const tokenRequest = {
        client_id: credentials.clientId,
        client_secret: credentials.apiSecret,
        grant_type: 'client_credentials'
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${credentials.apiUrl}/oauth/token`,
          tokenRequest,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      );

      return response.data.access_token;
    } catch (error) {
      this.logger.error(`Failed to get auth token for ${bankType}: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(`Bank authentication failed`, HttpStatus.UNAUTHORIZED);
    }
  }

  /**
   * Get DBBL session
   */
  private async getDbblSession(): Promise<string> {
    const credentials = this.bankCredentials[BankType.DBBL];

    try {
      const loginRequest = {
        username: credentials.username,
        password: credentials.password,
        apiKey: credentials.apiKey
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${credentials.apiUrl}/api/session/create`,
          loginRequest
        )
      );

      return response.data.sessionId;
    } catch (error) {
      this.logger.error(`DBBL session creation failed: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(`DBBL authentication failed`, HttpStatus.UNAUTHORIZED);
    }
  }

  /**
   * Validate account number format
   */
  private validateAccountNumber(accountNumber: string, bankType: BankType): boolean {
    const patterns: Record<string, RegExp> = {
      [BankType.BRAC]: /^\d{13}$/,          // 13 digits
      [BankType.DBBL]: /^\d{12}$/,          // 12 digits
      [BankType.ISLAMI]: /^\d{13}$/,        // 13 digits
      [BankType.SCB]: /^\d{10,16}$/,        // 10-16 digits
      [BankType.SONALI]: /^\d{11}$/,        // 11 digits
      [BankType.JANATA]: /^\d{11}$/         // 11 digits
    };

    const pattern = patterns[bankType];
    return pattern ? pattern.test(accountNumber) : true;
  }

  /**
   * Get bank code for transfers
   */
  private getBankCode(bankType: BankType): string {
    const codes: Record<string, string> = {
      [BankType.BRAC]: '060',
      [BankType.DBBL]: '090',
      [BankType.ISLAMI]: '125',
      [BankType.SCB]: '215',
      [BankType.HSBC]: '105',
      [BankType.CITY]: '225',
      [BankType.EBL]: '230',
      [BankType.UCB]: '245',
      [BankType.SONALI]: '200',
      [BankType.JANATA]: '205'
    };

    return codes[bankType] || '999';
  }

  /**
   * Get account balance
   */
  async getAccountBalance(bankType: BankType, accountNumber: string): Promise<number> {
    try {
      // Fetch mini statement to get current balance
      const statement = await this.fetchBankStatement({
        bankType,
        accountNumber,
        fromDate: moment().subtract(1, 'day').toDate(),
        toDate: new Date()
      });

      return statement.closingBalance;
    } catch (error) {
      this.logger.error(`Failed to get balance: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Schedule recurring transfer
   */
  async scheduleRecurringTransfer(
    request: TransferRequest,
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    endDate: Date
  ): Promise<string> {
    // This would integrate with bank's standing instruction API
    this.logger.log(`Scheduling recurring transfer: ${frequency} until ${endDate}`);

    // Placeholder implementation
    return `RECURRING_${request.fromBank}_${Date.now()}`;
  }

  /**
   * Map BankTransaction to AI reconciliation service format
   */
  private mapToAIBankTransaction(bankTx: BankTransaction): import('./ai-reconciliation.service').BankTransaction {
    return {
      id: bankTx.transactionId,
      amount: bankTx.amount,
      currency: 'BDT', // Default to BDT for Bangladesh ERP
      date: bankTx.transactionDate,
      description: bankTx.description,
      counterparty: bankTx.particulars || bankTx.description || 'Unknown',
      reference: bankTx.reference,
      tenantId: 'default' // TODO: Get actual tenant ID from context
    };
  }
}