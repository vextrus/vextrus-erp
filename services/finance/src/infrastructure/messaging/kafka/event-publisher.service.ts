import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { DomainEvent } from '@domain/base/domain-event.base';
import { lastValueFrom } from 'rxjs';

export interface KafkaEventMessage {
  key: string;
  value: any;
  headers?: Record<string, string>;
  partition?: number;
}

@Injectable()
export class EventPublisherService implements OnModuleInit {
  private readonly logger = new Logger(EventPublisherService.name);

  constructor(@Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka) {}

  async onModuleInit() {
    // Subscribe to response topics if needed
    const topics = [
      'finance.events',
      'finance.commands',
      'finance.domain.events',
      'finance.integration.events',
    ];

    topics.forEach(topic => {
      this.kafkaClient.subscribeToResponseOf(topic);
    });

    await this.kafkaClient.connect();
    this.logger.log('Kafka client connected');
  }

  async publish(event: DomainEvent, topic?: string): Promise<void> {
    const topicName = topic || this.getTopicForEvent(event.eventType);

    const message: KafkaEventMessage = {
      key: event.aggregateId,
      value: {
        eventId: event.eventId,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        eventVersion: event.eventVersion,
        payload: event.payload,
        timestamp: event.timestamp,
      },
      headers: {
        'tenant-id': event.tenantId,
        'user-id': event.userId || '',
        'correlation-id': event.correlationId || '',
        'event-type': event.eventType,
        'content-type': 'application/json',
        'source': 'finance-service',
      },
    };

    try {
      await lastValueFrom(
        this.kafkaClient.emit(topicName, message)
      );

      this.logger.debug(
        `Published event ${event.eventType} to topic ${topicName} for aggregate ${event.aggregateId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish event ${event.eventType} to topic ${topicName}:`,
        error
      );
      throw error;
    }
  }

  async publishBatch(events: DomainEvent[], topic?: string): Promise<void> {
    const promises = events.map(event => this.publish(event, topic));
    await Promise.all(promises);
  }

  async publishCommand(command: any, topic: string = 'finance.commands'): Promise<void> {
    const message: KafkaEventMessage = {
      key: command.aggregateId || command.id,
      value: command,
      headers: {
        'command-type': command.constructor.name,
        'tenant-id': command.tenantId || '',
        'user-id': command.userId || '',
        'correlation-id': command.correlationId || '',
        'content-type': 'application/json',
        'source': 'finance-service',
      },
    };

    try {
      await lastValueFrom(
        this.kafkaClient.emit(topic, message)
      );

      this.logger.debug(
        `Published command ${command.constructor.name} to topic ${topic}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish command ${command.constructor.name}:`,
        error
      );
      throw error;
    }
  }

  async publishIntegrationEvent(
    eventType: string,
    payload: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    const message: KafkaEventMessage = {
      key: metadata?.aggregateId || metadata?.id || eventType,
      value: {
        eventType,
        payload,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          source: 'finance-service',
        },
      },
      headers: {
        'event-type': eventType,
        'tenant-id': metadata?.tenantId || '',
        'correlation-id': metadata?.correlationId || '',
        'content-type': 'application/json',
        'source': 'finance-service',
      },
    };

    try {
      await lastValueFrom(
        this.kafkaClient.emit('finance.integration.events', message)
      );

      this.logger.debug(
        `Published integration event ${eventType} to finance.integration.events`
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish integration event ${eventType}:`,
        error
      );
      throw error;
    }
  }

  private getTopicForEvent(eventType: string): string {
    // Route events to appropriate topics based on event type
    const eventTypeMapping: Record<string, string> = {
      InvoiceCreated: 'finance.invoice.events',
      InvoiceUpdated: 'finance.invoice.events',
      InvoiceDeleted: 'finance.invoice.events',
      PaymentReceived: 'finance.payment.events',
      PaymentProcessed: 'finance.payment.events',
      JournalEntryCreated: 'finance.journal.events',
      JournalEntryPosted: 'finance.journal.events',
    };

    return eventTypeMapping[eventType] || 'finance.domain.events';
  }
}