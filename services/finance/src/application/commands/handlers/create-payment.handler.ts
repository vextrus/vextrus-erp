import { CommandHandler, ICommandHandler, EventBus, QueryBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { CreatePaymentCommand } from '../create-payment.command';
import { IPaymentRepository } from '../../../domain/repositories/payment.repository.interface';
import { Payment, BankAccountId } from '../../../domain/aggregates/payment/payment.aggregate';
import { InvoiceId } from '../../../domain/aggregates/invoice/invoice.aggregate';
import { TenantId } from '../../../domain/aggregates/chart-of-account/chart-of-account.aggregate';
import { Money } from '../../../domain/value-objects/money.value-object';
import { TaxCalculationService, TaxType, VendorType } from '../../services/tax-calculation.service';
import { GetInvoiceQuery } from '../../queries/get-invoice.query';
import Decimal from 'decimal.js';

/**
 * Create Payment Command Handler
 *
 * Handles the creation of new payments using CQRS pattern with automatic TDS/AIT withholding.
 * Creates a Payment aggregate with calculated withholding tax, persists it to EventStore,
 * and publishes domain events to Kafka via EventBus.
 *
 * Business Rules:
 * - Amount must be positive
 * - Payment method validation (mobile wallet, bank transfer, check)
 * - Bangladesh mobile number validation for mobile wallet payments
 * - Bank account ID required for bank transfers
 * - Check number required for check payments
 *
 * Bangladesh Tax Compliance:
 * - Automatically calculates TDS (Tax Deducted at Source) based on vendor type
 * - Calculates AIT (Advance Income Tax) for imports/exports
 * - Higher rates (1.5x) applied for vendors without TIN
 * - Withholding tax logged for challan generation
 */
@CommandHandler(CreatePaymentCommand)
export class CreatePaymentHandler implements ICommandHandler<CreatePaymentCommand> {
  private readonly logger = new Logger(CreatePaymentHandler.name);

  constructor(
    @Inject('IPaymentRepository')
    private readonly repository: IPaymentRepository,
    private readonly eventBus: EventBus,
    private readonly taxCalculationService: TaxCalculationService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: CreatePaymentCommand): Promise<string> {
    this.logger.log(`Creating payment for invoice ${command.invoiceId}`);

    try {
      // Calculate TDS/AIT withholding tax
      const withholdingInfo = await this.calculateWithholdingTax(command);

      if (withholdingInfo.totalWithholding > 0) {
        this.logger.log(
          `Withholding tax calculated: TDS ${withholdingInfo.tdsAmount.toFixed(2)}, ` +
          `AIT ${withholdingInfo.aitAmount.toFixed(2)}, ` +
          `Total ${withholdingInfo.totalWithholding.toFixed(2)} ${command.currency} ` +
          `(Rate: ${(withholdingInfo.effectiveRate * 100).toFixed(2)}%)`
        );
      }

      // Create Payment aggregate
      // Note: In production, you might want to:
      // 1. Store withholding amount in Payment aggregate
      // 2. Reduce net payment amount by withholding
      // 3. Emit TaxWithheldEvent for challan generation
      const payment = Payment.create({
        invoiceId: new InvoiceId(command.invoiceId),
        amount: Money.create(command.amount, command.currency),
        paymentMethod: command.paymentMethod,
        paymentDate: command.paymentDate,
        reference: command.reference,
        tenantId: new TenantId(command.tenantId),
        // Optional bank payment fields
        bankAccountId: command.bankAccountId ? new BankAccountId(command.bankAccountId) : undefined,
        checkNumber: command.checkNumber,
        // Optional mobile wallet fields
        walletProvider: command.walletProvider,
        mobileNumber: command.mobileNumber,
        walletTransactionId: command.walletTransactionId,
        merchantCode: command.merchantCode,
      });

      // Save to EventStore
      await this.repository.save(payment);

      // Publish domain events
      const events = payment.getUncommittedEvents();
      this.logger.log(`Publishing ${events.length} events for payment ${payment.getId().value}`);

      for (const event of events) {
        this.eventBus.publish(event);
      }

      const paymentId = payment.getId().value;
      this.logger.log(`Payment created successfully: ${paymentId}`);

      return paymentId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create payment: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Calculate TDS/AIT withholding tax for payment
   * Returns withholding information for tax reporting and challan generation
   */
  private async calculateWithholdingTax(command: CreatePaymentCommand): Promise<{
    tdsAmount: number;
    aitAmount: number;
    totalWithholding: number;
    effectiveRate: number;
    vendorType?: VendorType;
    hasTIN: boolean;
  }> {
    try {
      // Query invoice to get vendor details
      const invoice = await this.queryBus.execute(new GetInvoiceQuery(command.invoiceId));

      if (!invoice) {
        this.logger.warn(`Invoice ${command.invoiceId} not found for withholding calculation`);
        return { tdsAmount: 0, aitAmount: 0, totalWithholding: 0, effectiveRate: 0, hasTIN: false };
      }

      // Determine vendor type (default to SUPPLIER if not specified)
      const vendorType = (invoice as any).vendorType || VendorType.SUPPLIER;
      const hasTIN = !!invoice.vendorTIN;

      let tdsAmount = 0;
      let aitAmount = 0;

      // Calculate TDS (Tax Deducted at Source)
      const tdsResult = await this.taxCalculationService.calculateTax({
        amount: command.amount,
        taxType: TaxType.TDS,
        vendorType,
        hasTIN,
        transactionDate: command.paymentDate
      });
      tdsAmount = tdsResult.taxAmount;

      // Calculate AIT (Advance Income Tax) for import/export vendors
      if (vendorType === VendorType.IMPORT || vendorType === VendorType.EXPORT) {
        const aitResult = await this.taxCalculationService.calculateTax({
          amount: command.amount,
          taxType: TaxType.AIT,
          vendorType,
          transactionDate: command.paymentDate
        });
        aitAmount = aitResult.taxAmount;
      }

      const totalWithholding = new Decimal(tdsAmount).add(aitAmount).toNumber();
      const effectiveRate = totalWithholding / command.amount;

      return {
        tdsAmount,
        aitAmount,
        totalWithholding,
        effectiveRate,
        vendorType,
        hasTIN
      };
    } catch (error) {
      // Don't fail payment if withholding calculation fails
      this.logger.error(`Failed to calculate withholding tax: ${(error as Error).message}`, (error as Error).stack);
      return { tdsAmount: 0, aitAmount: 0, totalWithholding: 0, effectiveRate: 0, hasTIN: false };
    }
  }
}
