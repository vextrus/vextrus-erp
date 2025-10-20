import { Injectable, Logger } from '@nestjs/common';
import { EventStoreService } from './event-store.service';
import { AggregateRoot } from '@domain/base/aggregate-root.base';
import { DomainEvent } from '@domain/base/domain-event.base';

/**
 * Snapshot data structure
 * Stores the serialized state of an aggregate at a specific version
 */
export interface AggregateSnapshot {
  aggregateId: string;
  aggregateName: string;
  version: number;
  state: any; // Serialized aggregate state
  timestamp: Date;
}

export interface IEventSourcedRepository<T extends AggregateRoot<any>> {
  save(aggregate: T): Promise<void>;
  getById(id: string): Promise<T | null>;
  exists(id: string): Promise<boolean>;
  saveSnapshot?(aggregate: T): Promise<void>;
  loadSnapshot?(id: string): Promise<AggregateSnapshot | null>;
}

@Injectable()
export abstract class EventSourcedRepository<T extends AggregateRoot<any>>
  implements IEventSourcedRepository<T>
{
  protected readonly logger: Logger;
  protected readonly SNAPSHOT_FREQUENCY: number = 50; // Snapshot every 50 events
  protected readonly snapshotsEnabled: boolean;

  constructor(
    protected readonly eventStore: EventStoreService,
    protected readonly aggregateName: string,
  ) {
    this.logger = new Logger(`${aggregateName}Repository`);
    // Enable snapshots in production or if explicitly configured
    this.snapshotsEnabled = process.env.SNAPSHOTS_ENABLED === 'true' ||
                            process.env.NODE_ENV === 'production';

    if (this.snapshotsEnabled) {
      this.logger.log(`Snapshots ENABLED for ${aggregateName} (frequency: every ${this.SNAPSHOT_FREQUENCY} events)`);
    }
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

      // Create snapshot if threshold reached
      if (this.snapshotsEnabled && aggregate.version % this.SNAPSHOT_FREQUENCY === 0) {
        await this.saveSnapshot(aggregate);
      }
    } catch (error) {
      this.logger.error(`Failed to save aggregate ${aggregate.id}:`, error);
      throw error;
    }
  }

  async getById(id: string): Promise<T | null> {
    const streamName = this.getStreamName(id);
    const startTime = Date.now();
    let eventsReplayed = 0;

    try {
      // Try loading from snapshot first if enabled
      let snapshot: AggregateSnapshot | null = null;
      if (this.snapshotsEnabled) {
        snapshot = await this.loadSnapshot(id);
      }

      let events: DomainEvent[];
      let fromRevision: bigint | undefined;

      if (snapshot) {
        // Load events after snapshot
        fromRevision = BigInt(snapshot.version + 1);
        events = await this.eventStore.readStream(streamName, fromRevision);
        eventsReplayed = events.length;

        const aggregate = this.createEmptyAggregate();

        // Restore from snapshot state
        Object.assign(aggregate, snapshot.state);

        // Replay events after snapshot
        if (events.length > 0) {
          aggregate.loadFromHistory(events);
        }

        this.logger.debug(
          `Loaded aggregate ${id} from snapshot (v${snapshot.version}) + ${events.length} events. Total version: ${aggregate.version}. Time: ${Date.now() - startTime}ms`,
        );

        return aggregate;
      } else {
        // No snapshot, load all events
        events = await this.eventStore.readStream(streamName);
        eventsReplayed = events.length;

        if (events.length === 0) {
          this.logger.debug(`No events found for aggregate ${id}`);
          return null;
        }

        const aggregate = this.createEmptyAggregate();
        aggregate.loadFromHistory(events);

        this.logger.debug(
          `Loaded aggregate ${id} with ${events.length} events (no snapshot). Version: ${aggregate.version}. Time: ${Date.now() - startTime}ms`,
        );

        return aggregate;
      }
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

  async saveSnapshot(aggregate: T): Promise<void> {
    try {
      const snapshot: AggregateSnapshot = {
        aggregateId: aggregate.id,
        aggregateName: this.aggregateName,
        version: aggregate.version,
        state: this.serializeAggregate(aggregate),
        timestamp: new Date(),
      };

      const snapshotStreamName = this.getSnapshotStreamName(aggregate.id);

      // Save snapshot as JSON event with $maxCount=1 to keep only latest
      const snapshotEvent = {
        type: `${this.aggregateName}Snapshot`,
        data: snapshot,
      };

      await this.eventStore.appendEvents(
        snapshotStreamName,
        [snapshotEvent as any],
        undefined,
      );

      this.logger.log(
        `Created snapshot for aggregate ${aggregate.id} at version ${aggregate.version}`,
      );
    } catch (error) {
      // Log error but don't fail the save operation
      this.logger.error(`Failed to save snapshot for aggregate ${aggregate.id}:`, error);
    }
  }

  async loadSnapshot(id: string): Promise<AggregateSnapshot | null> {
    try {
      const snapshotStreamName = this.getSnapshotStreamName(id);
      const events = await this.eventStore.readStream(snapshotStreamName, undefined, 1);

      if (events.length === 0) {
        return null;
      }

      const snapshotEvent = events[0];
      const snapshot = snapshotEvent.payload as AggregateSnapshot;

      this.logger.debug(`Loaded snapshot for aggregate ${id} at version ${snapshot.version}`);
      return snapshot;
    } catch (error: any) {
      if (error.type === 'stream-not-found') {
        this.logger.debug(`No snapshot found for aggregate ${id}`);
        return null;
      }

      this.logger.warn(`Failed to load snapshot for aggregate ${id}:`, error);
      return null;
    }
  }

  protected getStreamName(aggregateId: string): string {
    return `${this.aggregateName}-${aggregateId}`;
  }

  protected getSnapshotStreamName(aggregateId: string): string {
    return `${this.aggregateName}-${aggregateId}-snapshots`;
  }

  protected serializeAggregate(aggregate: T): any {
    // Default serialization - can be overridden by subclasses
    return JSON.parse(JSON.stringify(aggregate));
  }

  protected abstract createEmptyAggregate(): T;
}