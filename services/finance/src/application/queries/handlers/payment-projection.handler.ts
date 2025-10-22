import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { DomainEvent } from '../../../domain/base/domain-event.base';
import {
  PaymentCreatedEvent,
  MobileWalletPaymentInitiatedEvent,
  PaymentCompletedEvent,
  PaymentFailedEvent,
  PaymentReconciledEvent,
  PaymentReversedEvent,
} from '../../../domain/aggregates/payment/payment.aggregate';
import { PaymentReadModel } from '../../../infrastructure/persistence/typeorm/entities/payment.entity';
import { FinanceCacheService } from '../../../infrastructure/cache/cache.service';

/**
 * Payment Projection Handler
 *
 * Projects payment domain events to the read model (PostgreSQL).
 * Handles all 6 payment lifecycle events:
 * 1. PaymentCreatedEvent - Initial payment creation
 * 2. MobileWalletPaymentInitiatedEvent - Mobile wallet payment processing
 * 3. PaymentCompletedEvent - Payment successful
 * 4. PaymentFailedEvent - Payment failed
 * 5. PaymentReconciledEvent - Payment reconciled with bank
 * 6. PaymentReversedEvent - Payment reversed (refund/chargeback)
 *
 * Event Sourcing + CQRS Pattern:
 * - Events stored in EventStore (write model)
 * - Events projected to PostgreSQL (read model)
 * - Read model optimized for queries
 * - Eventual consistency between write and read models
 */
@EventsHandler(
  PaymentCreatedEvent,
  MobileWalletPaymentInitiatedEvent,
  PaymentCompletedEvent,
  PaymentFailedEvent,
  PaymentReconciledEvent,
  PaymentReversedEvent
)
export class PaymentProjectionHandler implements IEventHandler<DomainEvent> {
  private readonly logger = new Logger(PaymentProjectionHandler.name);

  constructor(
    @InjectRepository(PaymentReadModel)
    private readonly readRepository: Repository<PaymentReadModel>,
    private readonly cacheService: FinanceCacheService,
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    try {
      if (event instanceof PaymentCreatedEvent) {
        await this.handlePaymentCreated(event);
      } else if (event instanceof MobileWalletPaymentInitiatedEvent) {
        await this.handleMobileWalletInitiated(event);
      } else if (event instanceof PaymentCompletedEvent) {
        await this.handlePaymentCompleted(event);
      } else if (event instanceof PaymentFailedEvent) {
        await this.handlePaymentFailed(event);
      } else if (event instanceof PaymentReconciledEvent) {
        await this.handlePaymentReconciled(event);
      } else if (event instanceof PaymentReversedEvent) {
        await this.handlePaymentReversed(event);
      }
    } catch (error) {
      this.logger.error(`Error handling ${event.constructor.name}:`, error);
      // Don't throw - projection errors shouldn't stop the event flow
      // In production, implement event replay mechanism for failed projections
    }
  }

  /**
   * Handle PaymentCreatedEvent
   * Creates initial payment record in read model
   */
  private async handlePaymentCreated(event: PaymentCreatedEvent): Promise<void> {
    this.logger.debug(`Projecting PaymentCreatedEvent: ${event.paymentId.value}`);

    const payment = this.readRepository.create({
      id: event.paymentId.value,
      tenantId: event.tenantId,
      paymentNumber: event.paymentNumber,
      invoiceId: event.invoiceId.value,
      amount: event.amount.getAmount(),
      currency: event.amount.getCurrency(),
      paymentMethod: event.paymentMethod,
      paymentDate: event.paymentDate,
      reference: event.reference,
      status: 'PENDING',
      createdAt: new Date(event.timestamp),
      updatedAt: new Date(event.timestamp),
    });

    await this.readRepository.save(payment);

    // Invalidate cache after successful update
    await this.cacheService.invalidatePayment(event.tenantId, event.paymentId.value);
    this.logger.debug(`Invalidated cache for payment ${event.paymentId.value}`);

    this.logger.debug(`Payment read model created: ${event.paymentId.value}`);
  }

  /**
   * Handle MobileWalletPaymentInitiatedEvent
   * Updates payment with mobile wallet details and sets status to PROCESSING
   */
  private async handleMobileWalletInitiated(event: MobileWalletPaymentInitiatedEvent): Promise<void> {
    this.logger.debug(`Projecting MobileWalletPaymentInitiatedEvent: ${event.paymentId.value}`);

    await this.readRepository.update(
      { id: event.paymentId.value },
      {
        mobileWalletProvider: event.provider,
        mobileNumber: event.mobileNumber,
        walletTransactionId: event.transactionId,
        merchantCode: event.merchantCode,
        status: 'PROCESSING',
        updatedAt: new Date(event.timestamp),
      }
    );

    // Invalidate cache after successful update
    await this.cacheService.invalidatePayment(event.tenantId, event.paymentId.value);
    this.logger.debug(`Invalidated cache for payment ${event.paymentId.value}`);

    this.logger.debug(`Payment mobile wallet details updated: ${event.paymentId.value}`);
  }

  /**
   * Handle PaymentCompletedEvent
   * Marks payment as completed with transaction reference
   */
  private async handlePaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
    this.logger.debug(`Projecting PaymentCompletedEvent: ${event.paymentId.value}`);

    await this.readRepository.update(
      { id: event.paymentId.value },
      {
        status: 'COMPLETED',
        transactionReference: event.transactionReference,
        updatedAt: new Date(event.timestamp),
      }
    );

    // Invalidate cache after successful update
    await this.cacheService.invalidatePayment(event.tenantId, event.paymentId.value);
    this.logger.debug(`Invalidated cache for payment ${event.paymentId.value}`);

    this.logger.debug(`Payment completed: ${event.paymentId.value}`);
  }

  /**
   * Handle PaymentFailedEvent
   * Marks payment as failed with failure reason
   */
  private async handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
    this.logger.debug(`Projecting PaymentFailedEvent: ${event.paymentId.value}`);

    await this.readRepository.update(
      { id: event.paymentId.value },
      {
        status: 'FAILED',
        failureReason: event.reason,
        updatedAt: new Date(event.timestamp),
      }
    );

    // Invalidate cache after successful update
    await this.cacheService.invalidatePayment(event.tenantId, event.paymentId.value);
    this.logger.debug(`Invalidated cache for payment ${event.paymentId.value}`);

    this.logger.debug(`Payment failed: ${event.paymentId.value}`);
  }

  /**
   * Handle PaymentReconciledEvent
   * Marks payment as reconciled with bank transaction details
   */
  private async handlePaymentReconciled(event: PaymentReconciledEvent): Promise<void> {
    this.logger.debug(`Projecting PaymentReconciledEvent: ${event.paymentId.value}`);

    await this.readRepository.update(
      { id: event.paymentId.value },
      {
        status: 'RECONCILED',
        bankTransactionId: event.bankTransactionId,
        reconciledAt: event.reconciledAt,
        reconciledBy: event.reconciledBy.value,
        updatedAt: new Date(event.timestamp),
      }
    );

    // Invalidate cache after successful update
    await this.cacheService.invalidatePayment(event.tenantId, event.paymentId.value);
    this.logger.debug(`Invalidated cache for payment ${event.paymentId.value}`);

    this.logger.debug(`Payment reconciled: ${event.paymentId.value}`);
  }

  /**
   * Handle PaymentReversedEvent
   * Marks payment as reversed with reversal details
   */
  private async handlePaymentReversed(event: PaymentReversedEvent): Promise<void> {
    this.logger.debug(`Projecting PaymentReversedEvent: ${event.paymentId.value}`);

    await this.readRepository.update(
      { id: event.paymentId.value },
      {
        status: 'REVERSED',
        reversalReason: event.reason,
        reversedAt: event.reversedAt,
        reversedBy: event.reversedBy.value,
        updatedAt: new Date(event.timestamp),
      }
    );

    // Invalidate cache after successful update
    await this.cacheService.invalidatePayment(event.tenantId, event.paymentId.value);
    this.logger.debug(`Invalidated cache for payment ${event.paymentId.value}`);

    this.logger.debug(`Payment reversed: ${event.paymentId.value}`);
  }
}
