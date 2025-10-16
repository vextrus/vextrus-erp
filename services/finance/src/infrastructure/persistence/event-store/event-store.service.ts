import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventStoreDBClient, jsonEvent, JSONEventType, ResolvedEvent } from '@eventstore/db-client';
import { DomainEvent } from '@domain/base/domain-event.base';

@Injectable()
export class EventStoreService {
  private client: EventStoreDBClient;
  private readonly logger = new Logger(EventStoreService.name);

  constructor(private configService: ConfigService) {
    const connectionString = this.configService.get<string>('EVENTSTORE_CONNECTION_STRING', 'esdb://localhost:2113?tls=false');

    this.client = EventStoreDBClient.connectionString(connectionString);

    this.logger.log(`EventStore client initialized with connection: ${connectionString}`);
  }

  async appendEvents(
    streamName: string,
    events: DomainEvent[],
    expectedRevision?: bigint,
  ): Promise<void> {
    try {
      const eventData = events.map(event =>
        jsonEvent({
          type: event.eventType,
          data: {
            aggregateId: event.aggregateId,
            payload: event.payload,
            eventVersion: event.eventVersion,
          },
          metadata: {
            tenantId: event.tenantId,
            userId: event.userId,
            correlationId: event.correlationId,
            timestamp: event.timestamp,
          },
        }),
      );

      const result = await this.client.appendToStream(
        streamName,
        eventData,
        {
          expectedRevision: expectedRevision ?? 'no_stream',
        },
      );

      this.logger.debug(
        `Appended ${events.length} events to stream ${streamName}. Next expected revision: ${result.nextExpectedRevision}`,
      );
    } catch (error) {
      this.logger.error(`Failed to append events to stream ${streamName}:`, error);
      throw error;
    }
  }

  async readStream(
    streamName: string,
    fromRevision?: bigint,
    maxCount?: number,
  ): Promise<DomainEvent[]> {
    try {
      const events = this.client.readStream<JSONEventType>(
        streamName,
        {
          fromRevision: fromRevision ?? 'start',
          maxCount: maxCount ?? Number.MAX_SAFE_INTEGER,
          direction: 'forwards',
        },
      );

      const domainEvents: DomainEvent[] = [];

      for await (const resolvedEvent of events) {
        if (resolvedEvent.event) {
          domainEvents.push(this.mapToDomainEvent(resolvedEvent));
        }
      }

      this.logger.debug(`Read ${domainEvents.length} events from stream ${streamName}`);
      return domainEvents;
    } catch (error) {
      this.logger.error(`Failed to read stream ${streamName}:`, error);
      throw error;
    }
  }

  async readLastEvent(streamName: string): Promise<DomainEvent | null> {
    try {
      const events = this.client.readStream<JSONEventType>(
        streamName,
        {
          fromRevision: 'end',
          maxCount: 1,
          direction: 'backwards',
        },
      );

      for await (const resolvedEvent of events) {
        if (resolvedEvent.event) {
          return this.mapToDomainEvent(resolvedEvent);
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to read last event from stream ${streamName}:`, error);
      throw error;
    }
  }

  async subscribeToStream(
    streamName: string,
    onEvent: (event: DomainEvent) => void,
    fromRevision?: bigint,
  ): Promise<void> {
    try {
      const subscription = this.client.subscribeToStream<JSONEventType>(
        streamName,
        {
          fromRevision: fromRevision ?? 'start',
        },
      );

      this.logger.log(`Subscribed to stream ${streamName}`);

      for await (const resolvedEvent of subscription) {
        if (resolvedEvent.event) {
          const domainEvent = this.mapToDomainEvent(resolvedEvent);
          onEvent(domainEvent);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to subscribe to stream ${streamName}:`, error);
      throw error;
    }
  }

  async createPersistentSubscription(
    streamName: string,
    groupName: string,
    settings?: any,
  ): Promise<void> {
    try {
      await this.client.createPersistentSubscriptionToStream(
        streamName,
        groupName,
        settings ?? {},
      );

      this.logger.log(`Created persistent subscription ${groupName} for stream ${streamName}`);
    } catch (error) {
      this.logger.error(`Failed to create persistent subscription:`, error);
      throw error;
    }
  }

  async connectToPersistentSubscription(
    streamName: string,
    groupName: string,
    onEvent: (event: DomainEvent) => Promise<void>,
  ): Promise<void> {
    try {
      const subscription = this.client.subscribeToPersistentSubscriptionToStream(
        streamName,
        groupName,
      );

      this.logger.log(`Connected to persistent subscription ${groupName} for stream ${streamName}`);

      for await (const resolvedEvent of subscription) {
        if (resolvedEvent.event) {
          const domainEvent = this.mapToDomainEvent(resolvedEvent as any);

          try {
            await onEvent(domainEvent);
            await subscription.ack(resolvedEvent);
          } catch (error: any) {
            this.logger.error(`Error processing event:`, error);
            await subscription.nack('retry', error.message, resolvedEvent);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to connect to persistent subscription:`, error);
      throw error;
    }
  }

  private mapToDomainEvent(resolvedEvent: ResolvedEvent<JSONEventType>): DomainEvent {
    const event = resolvedEvent.event;
    if (!event) {
      throw new Error('Event is null');
    }

    const data = event.data as any;
    const metadata = event.metadata as any;

    return {
      eventId: event.id,
      aggregateId: data.aggregateId,
      eventType: event.type,
      eventVersion: data.eventVersion || 1,
      timestamp: new Date(metadata?.timestamp || event.created),
      tenantId: metadata?.tenantId,
      userId: metadata?.userId,
      correlationId: metadata?.correlationId,
      payload: data.payload,
    } as DomainEvent;
  }

  async checkConnection(): Promise<boolean> {
    try {
      const info = await this.client.getStreamMetadata('$settings');
      this.logger.log('EventStore connection successful');
      return true;
    } catch (error) {
      this.logger.error('EventStore connection failed:', error);
      return false;
    }
  }
}