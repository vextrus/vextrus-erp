import { Injectable, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';

@Injectable()
export class KafkaConsumerService {
  private readonly logger = new Logger(KafkaConsumerService.name);

  @MessagePattern('finance.commands')
  async handleFinanceCommands(@Payload() message: any, @Ctx() context: KafkaContext) {
    const kafkaMessage = context.getMessage();
    const headers = kafkaMessage.headers || {};

    this.logger.debug(
      `Received command from topic ${context.getTopic()}`,
      {
        headers,
        message,
      }
    );

    // Process command based on type
    try {
      const commandType = headers['command-type']?.toString();

      switch (commandType) {
        case 'CreateInvoiceCommand':
          // Handle invoice creation
          break;
        case 'ProcessPaymentCommand':
          // Handle payment processing
          break;
        default:
          this.logger.warn(`Unknown command type: ${commandType}`);
      }
    } catch (error) {
      this.logger.error('Error processing command:', error);
      throw error;
    }
  }

  @MessagePattern('finance.integration.events')
  async handleIntegrationEvents(@Payload() message: any, @Ctx() context: KafkaContext) {
    const kafkaMessage = context.getMessage();
    const headers = kafkaMessage.headers || {};
    const eventType = headers['event-type']?.toString();

    this.logger.debug(`Received integration event: ${eventType}`, message);

    try {
      // Handle integration events from other services
      switch (eventType) {
        case 'CustomerCreated':
          // Handle customer creation from CRM service
          break;
        case 'OrderCompleted':
          // Handle order completion from SCM service
          break;
        default:
          this.logger.debug(`Unhandled integration event type: ${eventType}`);
      }
    } catch (error) {
      this.logger.error('Error processing integration event:', error);
      throw error;
    }
  }

  @MessagePattern('finance.domain.events')
  async handleDomainEvents(@Payload() message: any, @Ctx() context: KafkaContext) {
    const kafkaMessage = context.getMessage();
    const headers = kafkaMessage.headers || {};

    this.logger.debug('Received domain event', {
      eventType: message.eventType,
      aggregateId: message.aggregateId,
      tenantId: headers['tenant-id']?.toString(),
    });

    // Process domain events for projections, sagas, etc.
    try {
      // This would typically trigger projection updates or saga orchestrations
      await this.processProjection(message);
    } catch (error) {
      this.logger.error('Error processing domain event:', error);
      throw error;
    }
  }

  private async processProjection(event: any): Promise<void> {
    // Placeholder for projection processing logic
    this.logger.debug(`Processing projection for event ${event.eventType}`);
  }
}