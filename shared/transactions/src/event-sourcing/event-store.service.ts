import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import { v4 as uuid } from 'uuid';
import { 
  getPostgreSQLEventStore
} from '@event-driven-io/emmett-postgresql';
import type { EventStore as EmmettEventStore } from '@event-driven-io/emmett';
import { Trace, Metric, WithCircuitBreaker } from '@vextrus/utils';
import type { 
  DomainEvent, 
  EventStream, 
  OutboxEvent, 
  EventStoreOptions,
  AggregateState 
} from './types';

/**
 * Event Store Service with PostgreSQL backend
 * Provides event sourcing capabilities with snapshots and outbox pattern
 */
export class EventStoreService {
  private pool: Pool;
  private emmettStore?: any;
  private readonly snapshotFrequency: number;
  private readonly enableSnapshots: boolean;
  private readonly enableOutbox: boolean;

  constructor(private readonly options: EventStoreOptions) {
    this.pool = new Pool({
      connectionString: options.connectionString,
      max: options.poolSize || 10,
    });
    
    this.snapshotFrequency = options.snapshotFrequency || 100;
    this.enableSnapshots = options.enableSnapshots ?? true;
    this.enableOutbox = options.enableOutbox ?? true;
  }

  /**
   * Initialize the event store and run migrations
   */
  @Metric('eventstore.init')
  async initialize(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Initialize Emmett store
      this.emmettStore = getPostgreSQLEventStore(this.options.connectionString!);

      // Verify tables exist
      await client.query('SELECT 1 FROM event_store LIMIT 1');
      await client.query('SELECT 1 FROM saga_state LIMIT 1');
      await client.query('SELECT 1 FROM outbox_events LIMIT 1');
    } catch (error) {
      throw new Error(`Failed to initialize event store: ${error}`);
    } finally {
      client.release();
    }
  }

  /**
   * Append events to a stream with optimistic concurrency control
   */
  @Trace()
  @Metric('eventstore.append')
  @WithCircuitBreaker({ failureThreshold: 5, timeout: 30000 })
  async appendToStream(
    streamId: string,
    events: DomainEvent[],
    expectedVersion?: number
  ): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current stream version
      const versionResult = await client.query(
        'SELECT MAX(stream_version) as version FROM event_store WHERE stream_id = $1',
        [streamId]
      );
      
      const currentVersion = versionResult.rows[0]?.version || 0;
      
      // Check optimistic concurrency
      if (expectedVersion !== undefined && expectedVersion !== currentVersion) {
        throw new Error(
          `Concurrency conflict: expected version ${expectedVersion}, current version ${currentVersion}`
        );
      }

      let nextVersion = currentVersion + 1;
      const correlationId = events[0]?.metadata?.correlationId || uuid();

      const finalVersion = currentVersion + events.length;
      let shouldCreateSnapshot = false;

      // Insert events
      for (const event of events) {
        await client.query(
          `INSERT INTO event_store 
           (stream_id, stream_version, event_type, event_data, metadata, correlation_id, causation_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            streamId,
            nextVersion++,
            event.type,
            JSON.stringify(event.data),
            JSON.stringify({
              ...event.metadata,
              correlationId,
              timestamp: Date.now()
            }),
            correlationId,
            event.metadata?.causationId || null
          ]
        );

        // Add to outbox if enabled
        if (this.enableOutbox) {
          await this.addToOutbox(client, streamId, event, correlationId);
        }
      }

      // Check if snapshot is needed - create snapshot when we reach or exceed threshold
      if (this.enableSnapshots && finalVersion >= this.snapshotFrequency && 
          Math.floor(finalVersion / this.snapshotFrequency) > Math.floor(currentVersion / this.snapshotFrequency)) {
        shouldCreateSnapshot = true;
      }

      if (shouldCreateSnapshot) {
        await this.createSnapshot(client, streamId, finalVersion);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Read events from a stream
   */
  @Trace()
  @Metric('eventstore.read')
  async readStream(
    streamId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<EventStream> {
    const client = await this.pool.connect();
    
    try {
      // Try to load from snapshot first
      let snapshot: { version: number; data: unknown; createdAt: Date } | undefined;
      let snapshotVersion = 0;
      
      if (this.enableSnapshots && !fromVersion) {
        const snapshotResult = await client.query(
          `SELECT stream_version, snapshot_data, created_at 
           FROM event_snapshots 
           WHERE stream_id = $1 
           ORDER BY stream_version DESC 
           LIMIT 1`,
          [streamId]
        );
        
        if (snapshotResult.rows[0]) {
          snapshot = {
            version: snapshotResult.rows[0].stream_version,
            data: snapshotResult.rows[0].snapshot_data,
            createdAt: snapshotResult.rows[0].created_at
          };
          snapshotVersion = snapshot.version;
        }
      }

      // Load events after snapshot
      const query = `
        SELECT stream_version, event_type, event_data, metadata, created_at
        FROM event_store
        WHERE stream_id = $1
        AND stream_version > $2
        ${toVersion ? 'AND stream_version <= $3' : ''}
        ORDER BY stream_version ASC
      `;
      
      const params = toVersion 
        ? [streamId, fromVersion || snapshotVersion, toVersion]
        : [streamId, fromVersion || snapshotVersion];
      
      const result = await client.query(query, params);
      
      const events: DomainEvent[] = result.rows.map(row => ({
        type: row.event_type,
        data: row.event_data,
        metadata: {
          ...row.metadata,
          version: row.stream_version,
          createdAt: row.created_at
        }
      }));

      const currentVersion = result.rows.length > 0 
        ? result.rows[result.rows.length - 1].stream_version
        : snapshotVersion;

      return {
        streamId,
        version: currentVersion,
        events,
        snapshot
      };
    } finally {
      client.release();
    }
  }

  /**
   * Aggregate stream to current state
   */
  @Trace()
  async aggregateStream<TState extends AggregateState>(
    streamId: string,
    evolve: (state: TState, event: DomainEvent) => TState,
    initialState: TState
  ): Promise<{ state: TState; version: number }> {
    const stream = await this.readStream(streamId);
    
    let state = stream.snapshot 
      ? (stream.snapshot.data as TState)
      : initialState;
    
    for (const event of stream.events) {
      state = evolve(state, event);
    }
    
    return { state, version: stream.version };
  }

  /**
   * Create a snapshot of the current state
   */
  private async createSnapshot(
    client: PoolClient,
    streamId: string,
    version: number
  ): Promise<void> {
    // This would typically aggregate the state and store it
    // For now, we'll store a placeholder
    await client.query(
      `INSERT INTO event_snapshots (stream_id, stream_version, snapshot_data)
       VALUES ($1, $2, $3)
       ON CONFLICT (stream_id, stream_version) DO NOTHING`,
      [streamId, version, JSON.stringify({ placeholder: true })]
    );
  }

  /**
   * Add event to outbox for reliable publishing
   */
  private async addToOutbox(
    client: PoolClient,
    aggregateId: string,
    event: DomainEvent,
    correlationId: string
  ): Promise<void> {
    await client.query(
      `INSERT INTO outbox_events 
       (aggregate_id, aggregate_type, event_type, payload, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        aggregateId,
        'aggregate', // This should be derived from context
        event.type,
        JSON.stringify(event.data),
        JSON.stringify({
          ...event.metadata,
          correlationId
        })
      ]
    );
  }

  /**
   * Process outbox events for publishing
   */
  @Trace()
  @Metric('eventstore.outbox.process')
  async processOutboxEvents(
    batchSize: number = 100,
    processor: (event: OutboxEvent) => Promise<void>
  ): Promise<number> {
    const client = await this.pool.connect();
    let processedCount = 0;

    try {
      await client.query('BEGIN');

      // Lock and fetch pending events
      const result = await client.query(
        `UPDATE outbox_events 
         SET status = 'PROCESSING'
         WHERE id IN (
           SELECT id FROM outbox_events
           WHERE status = 'PENDING'
           OR (status = 'FAILED' AND retry_count < max_retries AND next_retry_at <= NOW())
           ORDER BY created_at
           LIMIT $1
           FOR UPDATE SKIP LOCKED
         )
         RETURNING *`,
        [batchSize]
      );

      for (const row of result.rows) {
        const outboxEvent: OutboxEvent = {
          id: row.id,
          aggregateId: row.aggregate_id,
          aggregateType: row.aggregate_type,
          eventType: row.event_type,
          payload: row.payload,
          metadata: row.metadata,
          status: row.status,
          retryCount: row.retry_count,
          maxRetries: row.max_retries,
          createdAt: row.created_at,
          publishedAt: row.published_at,
          nextRetryAt: row.next_retry_at,
          errorMessage: row.error_message
        };

        try {
          await processor(outboxEvent);
          
          // Mark as published
          await client.query(
            `UPDATE outbox_events 
             SET status = 'PUBLISHED', published_at = NOW()
             WHERE id = $1`,
            [outboxEvent.id]
          );
          
          processedCount++;
        } catch (error) {
          // Mark as failed with retry
          const nextRetry = new Date(Date.now() + Math.pow(2, outboxEvent.retryCount) * 1000);
          
          await client.query(
            `UPDATE outbox_events 
             SET status = 'FAILED', 
                 retry_count = retry_count + 1,
                 next_retry_at = $2,
                 error_message = $3
             WHERE id = $1`,
            [outboxEvent.id, nextRetry, String(error)]
          );
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return processedCount;
  }

  /**
   * Clean up old events and snapshots
   */
  @Trace()
  async cleanup(retentionDays: number = 90): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      
      // Delete old published outbox events
      await client.query(
        `DELETE FROM outbox_events 
         WHERE status = 'PUBLISHED' AND published_at < $1`,
        [cutoffDate]
      );
      
      // Clean up expired idempotency keys
      await client.query('SELECT cleanup_expired_idempotency_keys()');
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Dispose of resources
   */
  async dispose(): Promise<void> {
    if (this.emmettStore) {
      await this.emmettStore.close();
    }
    await this.pool.end();
  }

  /**
   * Destroy the event store and clean up resources
   * Alias for dispose() for compatibility
   */
  async destroy(): Promise<void> {
    await this.dispose();
  }
}