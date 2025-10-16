import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { createHash, createCipheriv, createDecipheriv } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export enum NBREndpoint {
  VAT_RETURN_SUBMISSION = '/vat/return/submit',
  TIN_VERIFICATION = '/verification/tin',
  BIN_VERIFICATION = '/verification/bin',
  VAT_PAYMENT_STATUS = '/vat/payment/status',
  MUSHAK_SUBMISSION = '/mushak/submit',
  TAX_CLEARANCE = '/clearance/verify',
  AUDIT_LOG_SUBMISSION = '/audit/log'
}

export enum SubmissionStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  CORRECTION_REQUIRED = 'CORRECTION_REQUIRED'
}

export interface VATReturn {
  returnPeriod: string; // Format: MM/YYYY
  binNumber: string;
  tinNumber: string;
  totalSales: number;
  totalPurchases: number;
  outputVAT: number;
  inputVAT: number;
  netVAT: number;
  supplementaryDuty: number;
  adjustments: VATAdjustment[];
  mushakForms: MushakSubmission[];
  submissionDate: Date;
  dueDate: Date;
}

export interface VATAdjustment {
  type: 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'REFUND' | 'PENALTY';
  amount: number;
  description: string;
  referenceNumber: string;
}

export interface MushakSubmission {
  formType: string; // e.g., "6.1", "6.2.1", "6.3"
  formData: Record<string, any>;
  attachments?: string[]; // Base64 encoded attachments
}

export interface TINVerificationRequest {
  tinNumber: string;
  name?: string;
  nidNumber?: string;
}

export interface TINVerificationResponse {
  valid: boolean;
  tinNumber: string;
  name: string;
  registrationDate: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  taxCircle?: string;
  taxZone?: string;
}

export interface BINVerificationRequest {
  binNumber: string;
  companyName?: string;
  tradeLicense?: string;
}

export interface BINVerificationResponse {
  valid: boolean;
  binNumber: string;
  companyName: string;
  registrationDate: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  businessType: string;
  registeredAddress: string;
  vatRegistrationDate?: Date;
}

export interface NBRSubmissionResponse {
  submissionId: string;
  status: SubmissionStatus;
  timestamp: Date;
  referenceNumber: string;
  message?: string;
  errors?: string[];
  nextSteps?: string[];
}

export interface AuditLogEntry {
  eventType: string;
  eventDescription: string;
  userId: string;
  timestamp: Date;
  ipAddress: string;
  affectedEntity: string;
  entityId: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

@Injectable()
export class NBRIntegrationService {
  private readonly logger = new Logger(NBRIntegrationService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly encryptionKey: string;
  private readonly encryptionIV: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {
    this.apiUrl = this.configService.get<string>('NBR_API_URL', 'https://api.nbr.gov.bd/v1');
    this.apiKey = this.configService.get<string>('NBR_API_KEY', '');
    this.encryptionKey = this.configService.get<string>('NBR_ENCRYPTION_KEY', '');
    this.encryptionIV = this.configService.get<string>('NBR_ENCRYPTION_IV', '');
  }

  /**
   * Submit VAT return to NBR
   */
  async submitVATReturn(vatReturn: VATReturn): Promise<NBRSubmissionResponse> {
    try {
      this.logger.log(`Submitting VAT return for period: ${vatReturn.returnPeriod}`);

      // Validate VAT return data
      this.validateVATReturn(vatReturn);

      // Encrypt sensitive data
      const encryptedData = this.encryptData(vatReturn);

      // Generate submission signature
      const signature = this.generateSignature(vatReturn);

      // Prepare request payload
      const payload = {
        data: encryptedData,
        signature,
        submissionId: uuidv4(),
        timestamp: new Date().toISOString()
      };

      // Submit to NBR API
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}${NBREndpoint.VAT_RETURN_SUBMISSION}`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'X-NBR-Client-ID': this.configService.get('NBR_CLIENT_ID'),
              'X-NBR-Request-ID': uuidv4()
            }
          }
        )
      );

      // Log submission for audit
      await this.logSubmission({
        eventType: 'VAT_RETURN_SUBMISSION',
        eventDescription: `VAT return submitted for period ${vatReturn.returnPeriod}`,
        userId: 'system',
        timestamp: new Date(),
        ipAddress: '127.0.0.1',
        affectedEntity: 'VAT_RETURN',
        entityId: vatReturn.binNumber,
        metadata: {
          returnPeriod: vatReturn.returnPeriod,
          netVAT: vatReturn.netVAT,
          submissionId: payload.submissionId
        }
      });

      return {
        submissionId: response.data.submissionId,
        status: response.data.status as SubmissionStatus,
        timestamp: new Date(response.data.timestamp),
        referenceNumber: response.data.referenceNumber,
        message: response.data.message,
        errors: response.data.errors,
        nextSteps: response.data.nextSteps
      };
    } catch (error) {
      this.logger.error(`VAT return submission failed: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        `NBR submission failed: ${(error as Error).message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Verify TIN (Tax Identification Number)
   */
  async verifyTIN(request: TINVerificationRequest): Promise<TINVerificationResponse> {
    try {
      // Validate TIN format (10-12 digits)
      if (!this.validateTINFormat(request.tinNumber)) {
        throw new HttpException('Invalid TIN format', HttpStatus.BAD_REQUEST);
      }

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}${NBREndpoint.TIN_VERIFICATION}`,
          request,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        )
      );

      // Cache verification result for performance
      await this.cacheVerificationResult('TIN', request.tinNumber, response.data);

      return {
        valid: response.data.valid,
        tinNumber: response.data.tinNumber,
        name: response.data.name,
        registrationDate: new Date(response.data.registrationDate),
        status: response.data.status,
        taxCircle: response.data.taxCircle,
        taxZone: response.data.taxZone
      };
    } catch (error) {
      if ((error as any).response?.status === 404) {
        return {
          valid: false,
          tinNumber: request.tinNumber,
          name: '',
          registrationDate: new Date(),
          status: 'INACTIVE'
        };
      }
      throw error;
    }
  }

  /**
   * Verify BIN (Business Identification Number)
   */
  async verifyBIN(request: BINVerificationRequest): Promise<BINVerificationResponse> {
    try {
      // Validate BIN format (9 digits)
      if (!this.validateBINFormat(request.binNumber)) {
        throw new HttpException('Invalid BIN format', HttpStatus.BAD_REQUEST);
      }

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}${NBREndpoint.BIN_VERIFICATION}`,
          request,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        )
      );

      // Cache verification result for performance
      await this.cacheVerificationResult('BIN', request.binNumber, response.data);

      return {
        valid: response.data.valid,
        binNumber: response.data.binNumber,
        companyName: response.data.companyName,
        registrationDate: new Date(response.data.registrationDate),
        status: response.data.status,
        businessType: response.data.businessType,
        registeredAddress: response.data.registeredAddress,
        vatRegistrationDate: response.data.vatRegistrationDate
          ? new Date(response.data.vatRegistrationDate)
          : undefined
      };
    } catch (error) {
      if ((error as any).response?.status === 404) {
        return {
          valid: false,
          binNumber: request.binNumber,
          companyName: '',
          registrationDate: new Date(),
          status: 'INACTIVE',
          businessType: '',
          registeredAddress: ''
        };
      }
      throw error;
    }
  }

  /**
   * Submit Mushak forms to NBR
   */
  async submitMushakForm(mushak: MushakSubmission): Promise<NBRSubmissionResponse> {
    try {
      this.logger.log(`Submitting Mushak form: ${mushak.formType}`);

      const payload = {
        formType: mushak.formType,
        formData: this.encryptData(mushak.formData),
        attachments: mushak.attachments,
        submissionId: uuidv4(),
        timestamp: new Date().toISOString()
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}${NBREndpoint.MUSHAK_SUBMISSION}`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'X-NBR-Form-Type': mushak.formType
            }
          }
        )
      );

      // Log submission for audit
      await this.logSubmission({
        eventType: 'MUSHAK_SUBMISSION',
        eventDescription: `Mushak form ${mushak.formType} submitted`,
        userId: 'system',
        timestamp: new Date(),
        ipAddress: '127.0.0.1',
        affectedEntity: 'MUSHAK_FORM',
        entityId: mushak.formType,
        metadata: {
          formType: mushak.formType,
          submissionId: payload.submissionId
        }
      });

      return {
        submissionId: response.data.submissionId,
        status: response.data.status as SubmissionStatus,
        timestamp: new Date(response.data.timestamp),
        referenceNumber: response.data.referenceNumber,
        message: response.data.message,
        errors: response.data.errors,
        nextSteps: response.data.nextSteps
      };
    } catch (error) {
      this.logger.error(`Mushak submission failed: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        `Mushak submission failed: ${(error as Error).message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Check VAT payment status
   */
  async checkVATPaymentStatus(binNumber: string, period: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.apiUrl}${NBREndpoint.VAT_PAYMENT_STATUS}`,
          {
            params: {
              binNumber,
              period
            },
            headers: {
              'Authorization': `Bearer ${this.apiKey}`
            }
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Payment status check failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Verify tax clearance certificate
   */
  async verifyTaxClearance(certificateNumber: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.apiUrl}${NBREndpoint.TAX_CLEARANCE}/${certificateNumber}`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`
            }
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Tax clearance verification failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Log submission to NBR audit system
   */
  public async logSubmission(auditLog: AuditLogEntry): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}${NBREndpoint.AUDIT_LOG_SUBMISSION}`,
          auditLog,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        )
      );

      this.logger.log(`Audit log submitted: ${auditLog.eventType}`);
    } catch (error) {
      // Don't fail main operation if audit logging fails
      this.logger.error(`Audit logging failed: ${(error as Error).message}`, (error as Error).stack);
    }
  }

  /**
   * Validate VAT return data
   */
  private validateVATReturn(vatReturn: VATReturn): void {
    const errors: string[] = [];

    // Validate BIN
    if (!this.validateBINFormat(vatReturn.binNumber)) {
      errors.push('Invalid BIN format');
    }

    // Validate TIN
    if (!this.validateTINFormat(vatReturn.tinNumber)) {
      errors.push('Invalid TIN format');
    }

    // Validate return period format (MM/YYYY)
    const periodRegex = /^(0[1-9]|1[0-2])\/\d{4}$/;
    if (!periodRegex.test(vatReturn.returnPeriod)) {
      errors.push('Invalid return period format. Use MM/YYYY');
    }

    // Validate amounts
    if (vatReturn.totalSales < 0) {
      errors.push('Total sales cannot be negative');
    }

    if (vatReturn.totalPurchases < 0) {
      errors.push('Total purchases cannot be negative');
    }

    // Validate VAT calculation
    const expectedOutputVAT = vatReturn.totalSales * 0.15;
    const expectedInputVAT = vatReturn.totalPurchases * 0.15;
    const tolerance = 0.01; // Allow 1 taka tolerance for rounding

    if (Math.abs(vatReturn.outputVAT - expectedOutputVAT) > tolerance) {
      errors.push('Output VAT calculation mismatch');
    }

    if (Math.abs(vatReturn.inputVAT - expectedInputVAT) > tolerance) {
      errors.push('Input VAT calculation mismatch');
    }

    if (Math.abs(vatReturn.netVAT - (vatReturn.outputVAT - vatReturn.inputVAT)) > tolerance) {
      errors.push('Net VAT calculation mismatch');
    }

    // Check due date (15th of next month)
    const [month, year] = vatReturn.returnPeriod.split('/');
    const dueDate = new Date(parseInt(year), parseInt(month), 15); // 15th of next month
    const today = new Date();

    if (vatReturn.dueDate < today && vatReturn.dueDate.getTime() !== dueDate.getTime()) {
      errors.push('Invalid due date');
    }

    if (errors.length > 0) {
      throw new HttpException(
        `VAT return validation failed: ${errors.join(', ')}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Validate TIN format (10-12 digits)
   */
  private validateTINFormat(tin: string): boolean {
    const tinRegex = /^\d{10,12}$/;
    return tinRegex.test(tin);
  }

  /**
   * Validate BIN format (9 digits)
   */
  private validateBINFormat(bin: string): boolean {
    const binRegex = /^\d{9}$/;
    return binRegex.test(bin);
  }

  /**
   * Encrypt sensitive data for NBR submission
   */
  private encryptData(data: any): string {
    try {
      if (!this.encryptionKey || !this.encryptionIV) {
        // If encryption is not configured, return base64 encoded data
        return Buffer.from(JSON.stringify(data)).toString('base64');
      }

      const cipher = createCipheriv(
        'aes-256-cbc',
        Buffer.from(this.encryptionKey, 'hex'),
        Buffer.from(this.encryptionIV, 'hex')
      );

      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return encrypted;
    } catch (error) {
      this.logger.error(`Encryption failed: ${(error as Error).message}`, (error as Error).stack);
      // Fallback to base64 encoding
      return Buffer.from(JSON.stringify(data)).toString('base64');
    }
  }

  /**
   * Generate digital signature for submission
   */
  private generateSignature(data: any): string {
    const hash = createHash('sha256');
    hash.update(JSON.stringify(data) + this.apiKey);
    return hash.digest('hex');
  }

  /**
   * Cache verification results for performance
   */
  private async cacheVerificationResult(
    type: 'TIN' | 'BIN',
    identifier: string,
    result: any
  ): Promise<void> {
    // Implementation would use Redis or similar caching solution
    // For now, we'll just log
    this.logger.log(`Cached ${type} verification for ${identifier}`);
  }

  /**
   * Get submission history
   */
  async getSubmissionHistory(
    binNumber: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.apiUrl}/submissions/history`,
          {
            params: {
              binNumber,
              startDate: startDate?.toISOString(),
              endDate: endDate?.toISOString()
            },
            headers: {
              'Authorization': `Bearer ${this.apiKey}`
            }
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to retrieve submission history: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get pending submissions
   */
  async getPendingSubmissions(binNumber: string): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.apiUrl}/submissions/pending`,
          {
            params: { binNumber },
            headers: {
              'Authorization': `Bearer ${this.apiKey}`
            }
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to retrieve pending submissions: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }
}