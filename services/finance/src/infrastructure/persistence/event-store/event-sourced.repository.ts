import { Injectable, Logger } from '@nestjs/common';
import { EventStoreService } from './event-store.service';
import { AggregateRoot } from '@domain/base/aggregate-root.base';
import { DomainEvent } from '@domain/base/domain-event.base';

export interface IEventSourcedRepository<T extends AggregateRoot<any>> {
  save(aggregate: T): Promise<void>;
  getById(id: string): Promise<T | null>;
  exists(id: string): Promise<boolean>;
}

@Injectable()
export abstract class EventSourcedRepository<T extends AggregateRoot<any>>
  implements IEventSourcedRepository<T>
{
  protected readonly logger: Logger;

  constructor(
    protected readonly eventStore: EventStoreService,
    protected readonly aggregateName: string,
  ) {
    this.logger = new Logger(`${aggregateName}Repository`);
  }

  async save(aggregate: T): Promise<void> {
    const events = aggregate.getUncommittedEvents();

    if (events.length === 0) {
      this.logger.debug(`No events to save for aggregate ${aggregate.id}`);
      return;
    }

    const streamName = this.getStreamName(aggregate.id);

    try {
      const expectedRevision = aggregate.version > 0
        ? BigInt(aggregate.version - 1)
        : undefined;

      await this.eventStore.appendEvents(streamName, events, expectedRevision);

      aggregate.markEventsAsCommitted();

      this.logger.debug(
        `Saved ${events.length} events for aggregate ${aggregate.id}. New version: ${aggregate.version}`,
      );
    } catch (error) {
      this.logger.error(`Failed to save aggregate ${aggregate.id}:`, error);
      throw error;
    }
  }

  async getById(id: string): Promise<T | null> {
    const streamName = this.getStreamName(id);

    try {
      const events = await this.eventStore.readStream(streamName);

      if (events.length === 0) {
        this.logger.debug(`No events found for aggregate ${id}`);
        return null;
      }

      const aggregate = this.createEmptyAggregate();
      aggregate.loadFromHistory(events);

      this.logger.debug(
        `Loaded aggregate ${id} with ${events.length} events. Version: ${aggregate.version}`,
      );

      return aggregate;
    } catch (error: any) {
      if (error.type === 'stream-not-found') {
        this.logger.debug(`Stream not found for aggregate ${id}`);
        return null;
      }

      this.logger.error(`Failed to load aggregate ${id}:`, error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    const streamName = this.getStreamName(id);

    try {
      const lastEvent = await this.eventStore.readLastEvent(streamName);
      return lastEvent !== null;
    } catch (error: any) {
      if (error.type === 'stream-not-found') {
        return false;
      }

      this.logger.error(`Failed to check existence of aggregate ${id}:`, error);
      throw error;
    }
  }

  protected getStreamName(aggregateId: string): string {
    return `${this.aggregateName}-${aggregateId}`;
  }

  protected abstract createEmptyAggregate(): T;
}