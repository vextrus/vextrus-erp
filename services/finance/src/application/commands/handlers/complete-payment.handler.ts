import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { CompletePaymentCommand } from '../complete-payment.command';
import { IPaymentRepository } from '../../../domain/repositories/payment.repository.interface';
import { IInvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { PaymentAlreadyCompletedException } from '../../../domain/aggregates/payment/payment.aggregate';

/**
 * Complete Payment Command Handler
 *
 * Handles payment completion when transaction is successful.
 * Loads payment from EventStore, executes business logic, saves events.
 *
 * Business Rules:
 * - Payment must be in PENDING or PROCESSING status
 * - Transaction reference is required
 * - Once completed, payment can be reconciled or reversed
 * - Completion triggers invoice payment tracking (via recordPayment)
 *
 * Payment-Invoice Linking:
 * - After payment completion, records payment on linked invoice
 * - Updates invoice paid amount and auto-transitions to PAID if fully paid
 * - Uses graceful degradation: payment completes even if invoice update fails
 */
@CommandHandler(CompletePaymentCommand)
export class CompletePaymentHandler implements ICommandHandler<CompletePaymentCommand> {
  private readonly logger = new Logger(CompletePaymentHandler.name);

  constructor(
    @Inject('IPaymentRepository')
    private readonly repository: IPaymentRepository,
    @Inject('IInvoiceRepository')
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CompletePaymentCommand): Promise<void> {
    this.logger.log(`Completing payment ${command.paymentId}`);

    try {
      // Load payment from EventStore
      const payment = await this.repository.findById(command.paymentId);
      if (!payment) {
        throw new NotFoundException(`Payment ${command.paymentId} not found`);
      }

      // Execute domain logic (validates status)
      try {
        payment.complete(command.transactionReference);
      } catch (error) {
        if (error instanceof PaymentAlreadyCompletedException) {
          throw new BadRequestException(error.message);
        }
        throw error;
      }

      // Save payment to EventStore
      await this.repository.save(payment);

      // Publish payment domain events
      const events = payment.getUncommittedEvents();
      this.logger.log(`Publishing ${events.length} payment events for ${command.paymentId}`);

      for (const event of events) {
        this.eventBus.publish(event);
      }

      this.logger.log(`Payment completed successfully: ${command.paymentId}`);

      // NEW: Record payment on linked invoice
      // Uses graceful degradation: payment completes even if invoice update fails
      try {
        const invoiceId = payment.getInvoiceId();

        // CRITICAL FIX #1: Proper null check before accessing .value
        if (!invoiceId || !invoiceId.value) {
          this.logger.warn(
            `Payment ${command.paymentId} has no linked invoice. Skipping invoice update.`
          );
          return;
        }

        this.logger.debug(
          `Recording payment ${command.paymentId} on invoice ${invoiceId.value}`
        );

        // Load invoice from EventStore
        const invoice = await this.invoiceRepository.findById(invoiceId.value);

        if (!invoice) {
          this.logger.error(
            `Invoice ${invoiceId.value} not found for payment ${command.paymentId}. ` +
            `Payment completed but invoice not updated. Manual reconciliation required.`
          );
          return;
        }

        // Record payment on invoice aggregate (may throw InvoiceOverpaymentException)
        try {
          invoice.recordPayment(payment.getId(), payment.getAmount());
        } catch (recordError) {
          // CRITICAL FIX #2: Specific handling for InvoiceOverpaymentException
          if (recordError instanceof Error && recordError.constructor.name === 'InvoiceOverpaymentException') {
            this.logger.error(
              `Payment ${command.paymentId} would overpay invoice ${invoiceId.value}. ` +
              `This indicates a concurrency issue or incorrect payment amount. ` +
              `Payment amount: ${payment.getAmount().getAmount()}, ` +
              `Error: ${recordError.message}. ` +
              `Payment is completed, but invoice NOT updated. Manual reconciliation required.`
            );
            // DO NOT THROW - payment is already completed
            return;
          }
          // Re-throw other errors (e.g., InvalidInvoiceStatusException)
          throw recordError;
        }

        // Save invoice to EventStore
        await this.invoiceRepository.save(invoice);

        // Publish invoice domain events
        const invoiceEvents = invoice.getUncommittedEvents();
        this.logger.log(
          `Publishing ${invoiceEvents.length} invoice events for ${invoiceId.value}`
        );

        for (const invoiceEvent of invoiceEvents) {
          this.eventBus.publish(invoiceEvent);
        }

        this.logger.log(
          `Successfully recorded payment ${command.paymentId} on invoice ${invoiceId.value}`
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;

        this.logger.error(
          `Failed to record payment on invoice: ${errorMessage}. ` +
          `Payment ${command.paymentId} is completed, but invoice update failed. ` +
          `Manual reconciliation may be required.`,
          errorStack
        );

        // DO NOT THROW - payment is already completed
        // Invoice can be manually reconciled later
        // This ensures payment completion is not blocked by invoice errors
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to complete payment: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
