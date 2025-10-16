import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { createHash, randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { BengaliLocalizationService } from './bengali-localization.service';

export enum PaymentGateway {
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  SSLCOMMERZ = 'SSLCOMMERZ',
  ROCKET = 'ROCKET',
  UPAY = 'UPAY'
}

export enum PaymentStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED'
}

export enum PaymentMethod {
  MOBILE_BANKING = 'MOBILE_BANKING',
  INTERNET_BANKING = 'INTERNET_BANKING',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export interface PaymentRequest {
  gateway: PaymentGateway;
  amount: number;
  currency?: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  description?: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  gateway: PaymentGateway;
  transactionId: string;
  paymentUrl?: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  gatewayResponse?: any;
  expiresAt?: Date;
}

export interface PaymentVerification {
  transactionId: string;
  gateway: PaymentGateway;
  status: PaymentStatus;
  amount: number;
  paidAmount?: number;
  paymentMethod?: string;
  payerAccount?: string;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface RefundRequest {
  gateway: PaymentGateway;
  originalTransactionId: string;
  amount: number;
  reason: string;
  refundId?: string;
}

export interface RefundResponse {
  refundId: string;
  originalTransactionId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  amount: number;
  processedAt?: Date;
  gatewayResponse?: any;
}

interface BkashTokenResponse {
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

interface BkashConfig {
  apiUrl: string;
  appKey: string;
  appSecret: string;
  username: string;
  password: string;
  callbackUrl: string;
}

interface NagadConfig {
  apiUrl: string;
  merchantId: string;
  publicKey: string;
  privateKey: string;
  callbackUrl: string;
}

interface SSLCommerzConfig {
  apiUrl: string;
  storeId: string;
  storePassword: string;
  callbackUrl: string;
  sandbox: boolean;
}

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private bkashToken: string | null = null;
  private bkashTokenExpiry: Date | null = null;

  private readonly bkashConfig: BkashConfig;
  private readonly nagadConfig: NagadConfig;
  private readonly sslcommerzConfig: SSLCommerzConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly bengaliService: BengaliLocalizationService
  ) {
    // Initialize bKash config
    this.bkashConfig = {
      apiUrl: this.configService.get<string>('BKASH_API_URL', 'https://checkout.pay.bka.sh/v1.2.0-beta'),
      appKey: this.configService.get<string>('BKASH_APP_KEY', ''),
      appSecret: this.configService.get<string>('BKASH_APP_SECRET', ''),
      username: this.configService.get<string>('BKASH_USERNAME', ''),
      password: this.configService.get<string>('BKASH_PASSWORD', ''),
      callbackUrl: this.configService.get<string>('BKASH_CALLBACK_URL', 'http://localhost:3000/payment/callback/bkash')
    };

    // Initialize Nagad config
    this.nagadConfig = {
      apiUrl: this.configService.get<string>('NAGAD_API_URL', 'https://api.mynagad.com'),
      merchantId: this.configService.get<string>('NAGAD_MERCHANT_ID', ''),
      publicKey: this.configService.get<string>('NAGAD_PUBLIC_KEY', ''),
      privateKey: this.configService.get<string>('NAGAD_PRIVATE_KEY', ''),
      callbackUrl: this.configService.get<string>('NAGAD_CALLBACK_URL', 'http://localhost:3000/payment/callback/nagad')
    };

    // Initialize SSLCommerz config
    this.sslcommerzConfig = {
      apiUrl: this.configService.get<string>('SSLCOMMERZ_API_URL', 'https://sandbox.sslcommerz.com'),
      storeId: this.configService.get<string>('SSLCOMMERZ_STORE_ID', ''),
      storePassword: this.configService.get<string>('SSLCOMMERZ_STORE_PASSWORD', ''),
      callbackUrl: this.configService.get<string>('SSLCOMMERZ_CALLBACK_URL', 'http://localhost:3000/payment/callback/sslcommerz'),
      sandbox: this.configService.get<boolean>('SSLCOMMERZ_SANDBOX', true)
    };
  }

  /**
   * Initiate payment based on gateway
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.logger.log(`Initiating payment via ${request.gateway} for order ${request.orderId}`);

      // Validate phone number format for mobile banking
      if ([PaymentGateway.BKASH, PaymentGateway.NAGAD, PaymentGateway.ROCKET].includes(request.gateway)) {
        if (!this.validateBangladeshPhoneNumber(request.customerPhone)) {
          throw new HttpException('Invalid Bangladesh phone number format', HttpStatus.BAD_REQUEST);
        }
      }

      switch (request.gateway) {
        case PaymentGateway.BKASH:
          return await this.initiateBkashPayment(request);

        case PaymentGateway.NAGAD:
          return await this.initiateNagadPayment(request);

        case PaymentGateway.SSLCOMMERZ:
          return await this.initiateSSLCommerzPayment(request);

        default:
          throw new HttpException(`Unsupported payment gateway: ${request.gateway}`, HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      this.logger.error(`Payment initiation failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * bKash Payment Integration
   */
  private async initiateBkashPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Get or refresh bKash token
      const token = await this.getBkashToken();

      // Create payment request
      const paymentRequest = {
        amount: request.amount.toString(),
        currency: request.currency || 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: request.orderId,
        merchantAssociationInfo: request.description || 'Payment for order',
        mode: '0011', // Checkout with agreement
        payerReference: request.customerPhone,
        callbackURL: request.callbackUrl || this.bkashConfig.callbackUrl
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.bkashConfig.apiUrl}/checkout/payment/create`,
          paymentRequest,
          {
            headers: {
              'Authorization': token,
              'X-APP-Key': this.bkashConfig.appKey,
              'Content-Type': 'application/json'
            }
          }
        )
      );

      if (response.data.statusCode !== '0000') {
        throw new HttpException(
          `bKash payment creation failed: ${response.data.statusMessage}`,
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        gateway: PaymentGateway.BKASH,
        transactionId: response.data.paymentID,
        paymentUrl: response.data.bkashURL,
        status: PaymentStatus.INITIATED,
        amount: request.amount,
        currency: request.currency || 'BDT',
        gatewayResponse: response.data,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes expiry
      };
    } catch (error) {
      this.logger.error(`bKash payment failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get or refresh bKash token
   */
  private async getBkashToken(): Promise<string> {
    try {
      // Check if token exists and is valid
      if (this.bkashToken && this.bkashTokenExpiry && this.bkashTokenExpiry > new Date()) {
        return this.bkashToken;
      }

      // Request new token
      const tokenRequest = {
        app_key: this.bkashConfig.appKey,
        app_secret: this.bkashConfig.appSecret
      };

      const response = await firstValueFrom(
        this.httpService.post<BkashTokenResponse>(
          `${this.bkashConfig.apiUrl}/checkout/token/grant`,
          tokenRequest,
          {
            headers: {
              'Content-Type': 'application/json',
              'username': this.bkashConfig.username,
              'password': this.bkashConfig.password
            }
          }
        )
      );

      this.bkashToken = response.data.id_token;
      this.bkashTokenExpiry = new Date(Date.now() + (response.data.expires_in - 60) * 1000); // Subtract 60 seconds for safety

      this.logger.log('bKash token refreshed successfully');
      return this.bkashToken;
    } catch (error) {
      this.logger.error(`Failed to get bKash token: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException('Failed to authenticate with bKash', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  /**
   * Execute bKash payment after user authorization
   */
  async executeBkashPayment(paymentId: string): Promise<PaymentVerification> {
    try {
      const token = await this.getBkashToken();

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.bkashConfig.apiUrl}/checkout/payment/execute/${paymentId}`,
          {},
          {
            headers: {
              'Authorization': token,
              'X-APP-Key': this.bkashConfig.appKey
            }
          }
        )
      );

      if (response.data.statusCode !== '0000') {
        return {
          transactionId: paymentId,
          gateway: PaymentGateway.BKASH,
          status: PaymentStatus.FAILED,
          amount: 0
        };
      }

      return {
        transactionId: response.data.trxID,
        gateway: PaymentGateway.BKASH,
        status: PaymentStatus.SUCCESS,
        amount: parseFloat(response.data.amount),
        paidAmount: parseFloat(response.data.amount),
        paymentMethod: 'bKash',
        payerAccount: response.data.customerMsisdn,
        completedAt: new Date(response.data.updateTime),
        metadata: {
          paymentID: response.data.paymentID,
          merchantInvoiceNumber: response.data.merchantInvoiceNumber
        }
      };
    } catch (error) {
      this.logger.error(`bKash payment execution failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Nagad Payment Integration
   */
  private async initiateNagadPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const orderId = `${this.nagadConfig.merchantId}${Date.now()}`;
      const challengeString = randomBytes(20).toString('hex');

      // Generate signature
      const dataToSign = {
        merchantId: this.nagadConfig.merchantId,
        orderId: orderId,
        amount: request.amount,
        dateTime: new Date().toISOString(),
        challenge: challengeString
      };

      const signature = this.generateNagadSignature(dataToSign);

      const paymentRequest = {
        merchantId: this.nagadConfig.merchantId,
        orderId: orderId,
        amount: request.amount.toString(),
        currency: 'BDT',
        challenge: challengeString,
        customerName: request.customerName,
        customerPhone: request.customerPhone,
        productDetails: request.description || 'Payment',
        callbackUrl: request.callbackUrl || this.nagadConfig.callbackUrl,
        signature: signature
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.nagadConfig.apiUrl}/remote-payment-gateway-1.0/api/dfs/check-out/initialize`,
          paymentRequest,
          {
            headers: {
              'X-KM-Api-Version': 'v-0.2.0',
              'X-KM-IP-V4': '127.0.0.1',
              'X-KM-MC-Id': this.nagadConfig.merchantId,
              'X-KM-Client-Type': 'PC_WEB'
            }
          }
        )
      );

      if (response.data.status !== 'Success') {
        throw new HttpException(
          `Nagad payment initialization failed: ${response.data.message}`,
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        gateway: PaymentGateway.NAGAD,
        transactionId: orderId,
        paymentUrl: response.data.callBackUrl,
        status: PaymentStatus.INITIATED,
        amount: request.amount,
        currency: 'BDT',
        gatewayResponse: response.data,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes expiry
      };
    } catch (error) {
      this.logger.error(`Nagad payment failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Generate Nagad signature
   */
  private generateNagadSignature(data: any): string {
    // In production, use proper RSA signing with private key
    const dataString = JSON.stringify(data);
    const hash = createHash('sha256');
    hash.update(dataString + this.nagadConfig.privateKey);
    return hash.digest('hex');
  }

  /**
   * SSLCommerz Payment Integration
   */
  private async initiateSSLCommerzPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const transactionId = `SSL_${Date.now()}_${randomBytes(4).toString('hex')}`;

      const paymentRequest = {
        store_id: this.sslcommerzConfig.storeId,
        store_passwd: this.sslcommerzConfig.storePassword,
        total_amount: request.amount,
        currency: request.currency || 'BDT',
        tran_id: transactionId,
        success_url: `${this.sslcommerzConfig.callbackUrl}/success`,
        fail_url: `${this.sslcommerzConfig.callbackUrl}/fail`,
        cancel_url: `${this.sslcommerzConfig.callbackUrl}/cancel`,
        ipn_url: `${this.sslcommerzConfig.callbackUrl}/ipn`,

        // Customer information
        cus_name: request.customerName,
        cus_email: request.customerEmail || 'customer@example.com',
        cus_phone: request.customerPhone,
        cus_add1: 'Dhaka',
        cus_city: 'Dhaka',
        cus_country: 'Bangladesh',

        // Product information
        product_name: request.description || 'Payment',
        product_category: 'general',
        product_profile: 'general',

        // Shipping information (required but can be same as customer)
        shipping_method: 'NO',
        num_of_item: 1,

        // Additional options
        value_a: request.orderId,
        value_b: request.metadata?.invoiceId || '',
        value_c: request.metadata?.customerId || '',
        value_d: request.metadata?.additional || ''
      };

      const apiUrl = this.sslcommerzConfig.sandbox
        ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
        : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';

      const response = await firstValueFrom(
        this.httpService.post(
          apiUrl,
          new URLSearchParams(paymentRequest as any).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        )
      );

      if (response.data.status !== 'SUCCESS') {
        throw new HttpException(
          `SSLCommerz payment initialization failed: ${response.data.failedreason}`,
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        gateway: PaymentGateway.SSLCOMMERZ,
        transactionId: transactionId,
        paymentUrl: response.data.GatewayPageURL,
        status: PaymentStatus.INITIATED,
        amount: request.amount,
        currency: request.currency || 'BDT',
        gatewayResponse: response.data,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes expiry
      };
    } catch (error) {
      this.logger.error(`SSLCommerz payment failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Verify payment transaction
   */
  async verifyPayment(transactionId: string, gateway: PaymentGateway): Promise<PaymentVerification> {
    try {
      this.logger.log(`Verifying payment ${transactionId} for gateway ${gateway}`);

      switch (gateway) {
        case PaymentGateway.BKASH:
          return await this.verifyBkashPayment(transactionId);

        case PaymentGateway.NAGAD:
          return await this.verifyNagadPayment(transactionId);

        case PaymentGateway.SSLCOMMERZ:
          return await this.verifySSLCommerzPayment(transactionId);

        default:
          throw new HttpException(`Unsupported gateway for verification: ${gateway}`, HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      this.logger.error(`Payment verification failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Verify bKash payment
   */
  private async verifyBkashPayment(paymentId: string): Promise<PaymentVerification> {
    try {
      const token = await this.getBkashToken();

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.bkashConfig.apiUrl}/checkout/payment/query/${paymentId}`,
          {},
          {
            headers: {
              'Authorization': token,
              'X-APP-Key': this.bkashConfig.appKey
            }
          }
        )
      );

      const status = response.data.transactionStatus === 'Completed'
        ? PaymentStatus.SUCCESS
        : response.data.transactionStatus === 'Initiated'
        ? PaymentStatus.PENDING
        : PaymentStatus.FAILED;

      return {
        transactionId: response.data.trxID || paymentId,
        gateway: PaymentGateway.BKASH,
        status: status,
        amount: parseFloat(response.data.amount || '0'),
        paidAmount: parseFloat(response.data.amount || '0'),
        paymentMethod: 'bKash',
        payerAccount: response.data.customerMsisdn,
        completedAt: response.data.updateTime ? new Date(response.data.updateTime) : undefined,
        metadata: response.data
      };
    } catch (error) {
      this.logger.error(`bKash verification failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        transactionId: paymentId,
        gateway: PaymentGateway.BKASH,
        status: PaymentStatus.FAILED,
        amount: 0
      };
    }
  }

  /**
   * Verify Nagad payment
   */
  private async verifyNagadPayment(orderId: string): Promise<PaymentVerification> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.nagadConfig.apiUrl}/remote-payment-gateway-1.0/api/dfs/verify/payment/${orderId}`,
          {
            headers: {
              'X-KM-Api-Version': 'v-0.2.0',
              'X-KM-IP-V4': '127.0.0.1',
              'X-KM-MC-Id': this.nagadConfig.merchantId,
              'X-KM-Client-Type': 'PC_WEB'
            }
          }
        )
      );

      const status = response.data.status === 'Success'
        ? PaymentStatus.SUCCESS
        : response.data.status === 'Processing'
        ? PaymentStatus.PENDING
        : PaymentStatus.FAILED;

      return {
        transactionId: response.data.issuerPaymentRefNo || orderId,
        gateway: PaymentGateway.NAGAD,
        status: status,
        amount: parseFloat(response.data.amount || '0'),
        paidAmount: parseFloat(response.data.amount || '0'),
        paymentMethod: 'Nagad',
        payerAccount: response.data.clientMobileNo,
        completedAt: response.data.paymentDate ? new Date(response.data.paymentDate) : undefined,
        metadata: response.data
      };
    } catch (error) {
      this.logger.error(`Nagad verification failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        transactionId: orderId,
        gateway: PaymentGateway.NAGAD,
        status: PaymentStatus.FAILED,
        amount: 0
      };
    }
  }

  /**
   * Verify SSLCommerz payment
   */
  private async verifySSLCommerzPayment(transactionId: string): Promise<PaymentVerification> {
    try {
      const validationUrl = this.sslcommerzConfig.sandbox
        ? 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php'
        : 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php';

      const params = new URLSearchParams({
        val_id: transactionId,
        store_id: this.sslcommerzConfig.storeId,
        store_passwd: this.sslcommerzConfig.storePassword,
        format: 'json'
      });

      const response = await firstValueFrom(
        this.httpService.get(`${validationUrl}?${params.toString()}`)
      );

      const status = response.data.status === 'VALID' || response.data.status === 'VALIDATED'
        ? PaymentStatus.SUCCESS
        : response.data.status === 'PENDING'
        ? PaymentStatus.PENDING
        : PaymentStatus.FAILED;

      return {
        transactionId: response.data.tran_id || transactionId,
        gateway: PaymentGateway.SSLCOMMERZ,
        status: status,
        amount: parseFloat(response.data.amount || '0'),
        paidAmount: parseFloat(response.data.amount || '0'),
        paymentMethod: response.data.card_type || response.data.card_brand || 'SSLCommerz',
        payerAccount: response.data.card_no || response.data.bank_tran_id,
        completedAt: response.data.tran_date ? new Date(response.data.tran_date) : undefined,
        metadata: response.data
      };
    } catch (error) {
      this.logger.error(`SSLCommerz verification failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        transactionId: transactionId,
        gateway: PaymentGateway.SSLCOMMERZ,
        status: PaymentStatus.FAILED,
        amount: 0
      };
    }
  }

  /**
   * Process refund
   */
  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      this.logger.log(`Processing refund for transaction ${request.originalTransactionId}`);

      switch (request.gateway) {
        case PaymentGateway.BKASH:
          return await this.processBkashRefund(request);

        case PaymentGateway.NAGAD:
          return await this.processNagadRefund(request);

        case PaymentGateway.SSLCOMMERZ:
          return await this.processSSLCommerzRefund(request);

        default:
          throw new HttpException(`Refund not supported for gateway: ${request.gateway}`, HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      this.logger.error(`Refund processing failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Process bKash refund
   */
  private async processBkashRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      const token = await this.getBkashToken();
      const refundId = request.refundId || uuidv4();

      const refundRequest = {
        paymentID: request.originalTransactionId,
        amount: request.amount.toString(),
        trxID: refundId,
        sku: 'Refund',
        reason: request.reason
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.bkashConfig.apiUrl}/checkout/payment/refund`,
          refundRequest,
          {
            headers: {
              'Authorization': token,
              'X-APP-Key': this.bkashConfig.appKey
            }
          }
        )
      );

      return {
        refundId: response.data.refundTrxID || refundId,
        originalTransactionId: request.originalTransactionId,
        status: response.data.statusCode === '0000' ? 'SUCCESS' : 'FAILED',
        amount: request.amount,
        processedAt: response.data.completedTime ? new Date(response.data.completedTime) : new Date(),
        gatewayResponse: response.data
      };
    } catch (error) {
      this.logger.error(`bKash refund failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        refundId: request.refundId || uuidv4(),
        originalTransactionId: request.originalTransactionId,
        status: 'FAILED',
        amount: request.amount
      };
    }
  }

  /**
   * Process Nagad refund
   */
  private async processNagadRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      // Nagad refund implementation
      // This would need actual Nagad refund API endpoint
      this.logger.warn('Nagad refund API not fully implemented in sandbox');

      return {
        refundId: request.refundId || uuidv4(),
        originalTransactionId: request.originalTransactionId,
        status: 'PENDING',
        amount: request.amount,
        processedAt: new Date(),
        gatewayResponse: { message: 'Nagad refund initiated, manual processing required' }
      };
    } catch (error) {
      this.logger.error(`Nagad refund failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        refundId: request.refundId || uuidv4(),
        originalTransactionId: request.originalTransactionId,
        status: 'FAILED',
        amount: request.amount
      };
    }
  }

  /**
   * Process SSLCommerz refund
   */
  private async processSSLCommerzRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      const refundUrl = this.sslcommerzConfig.sandbox
        ? 'https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php'
        : 'https://securepay.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php';

      const refundRequest = {
        store_id: this.sslcommerzConfig.storeId,
        store_passwd: this.sslcommerzConfig.storePassword,
        bank_tran_id: request.originalTransactionId,
        refund_amount: request.amount,
        refund_remarks: request.reason,
        refe_id: request.refundId || uuidv4()
      };

      const response = await firstValueFrom(
        this.httpService.post(
          refundUrl,
          new URLSearchParams(refundRequest as any).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        )
      );

      return {
        refundId: response.data.refund_ref_id || request.refundId || uuidv4(),
        originalTransactionId: request.originalTransactionId,
        status: response.data.status === 'success' ? 'SUCCESS' : 'FAILED',
        amount: request.amount,
        processedAt: new Date(),
        gatewayResponse: response.data
      };
    } catch (error) {
      this.logger.error(`SSLCommerz refund failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        refundId: request.refundId || uuidv4(),
        originalTransactionId: request.originalTransactionId,
        status: 'FAILED',
        amount: request.amount
      };
    }
  }

  /**
   * Handle payment callback/webhook
   */
  async handlePaymentCallback(gateway: PaymentGateway, callbackData: any): Promise<PaymentVerification> {
    try {
      this.logger.log(`Processing callback for ${gateway}`);

      switch (gateway) {
        case PaymentGateway.BKASH:
          return await this.handleBkashCallback(callbackData);

        case PaymentGateway.NAGAD:
          return await this.handleNagadCallback(callbackData);

        case PaymentGateway.SSLCOMMERZ:
          return await this.handleSSLCommerzCallback(callbackData);

        default:
          throw new HttpException(`Callback handler not implemented for: ${gateway}`, HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      this.logger.error(`Callback processing failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Handle bKash callback
   */
  private async handleBkashCallback(callbackData: any): Promise<PaymentVerification> {
    const { paymentID, status } = callbackData;

    if (status === 'success') {
      return await this.executeBkashPayment(paymentID);
    }

    return {
      transactionId: paymentID,
      gateway: PaymentGateway.BKASH,
      status: status === 'cancel' ? PaymentStatus.CANCELLED : PaymentStatus.FAILED,
      amount: 0
    };
  }

  /**
   * Handle Nagad callback
   */
  private async handleNagadCallback(callbackData: any): Promise<PaymentVerification> {
    const { order_id, status } = callbackData;

    if (status === 'Success') {
      return await this.verifyNagadPayment(order_id);
    }

    return {
      transactionId: order_id,
      gateway: PaymentGateway.NAGAD,
      status: status === 'Cancelled' ? PaymentStatus.CANCELLED : PaymentStatus.FAILED,
      amount: 0
    };
  }

  /**
   * Handle SSLCommerz callback
   */
  private async handleSSLCommerzCallback(callbackData: any): Promise<PaymentVerification> {
    const { tran_id, val_id, status } = callbackData;

    if (status === 'VALID' || status === 'VALIDATED') {
      return await this.verifySSLCommerzPayment(val_id || tran_id);
    }

    return {
      transactionId: tran_id,
      gateway: PaymentGateway.SSLCOMMERZ,
      status: status === 'CANCELLED' ? PaymentStatus.CANCELLED : PaymentStatus.FAILED,
      amount: parseFloat(callbackData.amount || '0'),
      metadata: callbackData
    };
  }

  /**
   * Validate Bangladesh phone number
   */
  private validateBangladeshPhoneNumber(phone: string): boolean {
    // Remove any spaces, hyphens, or country code
    const cleaned = phone.replace(/[\s-]/g, '').replace(/^(\+88|88)/, '');

    // Check if it matches Bangladesh mobile format: 01[3-9]XXXXXXXX
    const phoneRegex = /^01[3-9]\d{8}$/;
    return phoneRegex.test(cleaned);
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(transactionId: string, gateway: PaymentGateway): Promise<PaymentStatus> {
    try {
      const verification = await this.verifyPayment(transactionId, gateway);
      return verification.status;
    } catch (error) {
      this.logger.error(`Failed to get payment status: ${(error as Error).message}`, (error as Error).stack);
      return PaymentStatus.FAILED;
    }
  }

  /**
   * Get supported payment methods
   */
  getSupportedPaymentMethods(): PaymentGateway[] {
    return [
      PaymentGateway.BKASH,
      PaymentGateway.NAGAD,
      PaymentGateway.SSLCOMMERZ
    ];
  }

  /**
   * Get gateway configuration status
   */
  getGatewayStatus(): Record<PaymentGateway, boolean> {
    return {
      [PaymentGateway.BKASH]: !!this.bkashConfig.appKey && !!this.bkashConfig.appSecret,
      [PaymentGateway.NAGAD]: !!this.nagadConfig.merchantId,
      [PaymentGateway.SSLCOMMERZ]: !!this.sslcommerzConfig.storeId && !!this.sslcommerzConfig.storePassword,
      [PaymentGateway.ROCKET]: false, // Not implemented yet
      [PaymentGateway.UPAY]: false    // Not implemented yet
    };
  }
}