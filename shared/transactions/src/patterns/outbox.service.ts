import { Pool } from 'pg';
import type { OutboxEvent, DomainEvent } from '../event-sourcing/types';
import { Trace, Metric, WithCircuitBreaker } from '@vextrus/utils';

/**
 * Message publisher interface for outbox pattern
 */
export interface MessagePublisher {
  publish(event: OutboxEvent): Promise<void>;
}

/**
 * Outbox service for reliable event publishing
 */
export class OutboxService {
  private readonly pool: Pool;
  private readonly publishers: Map<string, MessagePublisher> = new Map();
  private processingInterval?: NodeJS.Timeout;
  private isProcessing = false;

  constructor(
    connectionStringOrPool: string | Pool,
    private readonly options: {
      batchSize?: number;
      processingIntervalMs?: number;
      maxRetries?: number;
      deadLetterAfterRetries?: number;
    } = {}
  ) {
    if (typeof connectionStringOrPool === 'string') {
      this.pool = new Pool({ connectionString: connectionStringOrPool });
    } else {
      this.pool = connectionStringOrPool;
    }
  }

  /**
   * Register a message publisher for an event type pattern
   */
  registerPublisher(pattern: string, publisher: MessagePublisher): void {
    this.publishers.set(pattern, publisher);
  }

  /**
   * Add event to outbox within a transaction
   */
  @Metric('outbox.add')
  async addEvent(
    event: DomainEvent,
    aggregateId: string,
    aggregateType: string,
    client?: any
  ): Promise<void> {
    const useClient = client || await this.pool.connect();
    
    try {
      await useClient.query(
        `INSERT INTO outbox_events 
         (aggregate_id, aggregate_type, event_type, payload, metadata, max_retries)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          aggregateId,
          aggregateType,
          event.type,
          JSON.stringify(event.data),
          JSON.stringify(event.metadata || {}),
          this.options.maxRetries || 3
        ]
      );
    } finally {
      if (!client) {
        useClient.release();
      }
    }
  }

  /**
   * Start processing outbox events
   */
  @Trace()
  startProcessing(): void {
    const intervalMs = this.options.processingIntervalMs || 5000;
    
    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processOutboxEvents();
      }
    }, intervalMs);
  }

  /**
   * Stop processing outbox events
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }

  /**
   * Process pending outbox events
   */
  @Trace()
  @Metric('outbox.process')
  @WithCircuitBreaker({ failureThreshold: 5, timeout: 30000 })
  async processOutboxEvents(): Promise<number> {
    if (this.isProcessing) {
      return 0;
    }

    this.isProcessing = true;
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
        [this.options.batchSize || 100]
      );

      for (const row of result.rows) {
        const outboxEvent: OutboxEvent = this.mapRowToOutboxEvent(row);

        try {
          // Find matching publisher
          const publisher = this.findPublisher(outboxEvent.eventType);
          
          if (publisher) {
            await publisher.publish(outboxEvent);
            
            // Mark as published
            await client.query(
              `UPDATE outbox_events 
               SET status = 'PUBLISHED', published_at = NOW()
               WHERE id = $1`,
              [outboxEvent.id]
            );
            
            processedCount++;
          } else {
            // No publisher found, mark as dead letter
            await client.query(
              `UPDATE outbox_events 
               SET status = 'DEAD_LETTER', 
                   error_message = $2
               WHERE id = $1`,
              [outboxEvent.id, `No publisher found for event type: ${outboxEvent.eventType}`]
            );
          }
        } catch (error) {
          await this.handlePublishError(client, outboxEvent, error as Error);
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
      this.isProcessing = false;
    }

    return processedCount;
  }

  /**
   * Handle publish error with retry logic
   */
  private async handlePublishError(
    client: any,
    event: OutboxEvent,
    error: Error
  ): Promise<void> {
    const newRetryCount = event.retryCount + 1;
    const deadLetterThreshold = this.options.deadLetterAfterRetries || 5;
    
    if (newRetryCount >= deadLetterThreshold) {
      // Move to dead letter
      await client.query(
        `UPDATE outbox_events 
         SET status = 'DEAD_LETTER', 
             retry_count = $2,
             error_message = $3
         WHERE id = $1`,
        [event.id, newRetryCount, error.message]
      );
    } else {
      // Schedule retry with exponential backoff
      const backoffMs = Math.min(
        Math.pow(2, newRetryCount) * 1000,
        60000 // Max 1 minute
      );
      const nextRetry = new Date(Date.now() + backoffMs);
      
      await client.query(
        `UPDATE outbox_events 
         SET status = 'FAILED', 
             retry_count = $2,
             next_retry_at = $3,
             error_message = $4
         WHERE id = $1`,
        [event.id, newRetryCount, nextRetry, error.message]
      );
    }
  }

  /**
   * Find publisher for event type
   */
  private findPublisher(eventType: string): MessagePublisher | undefined {
    // Exact match first
    if (this.publishers.has(eventType)) {
      return this.publishers.get(eventType);
    }

    // Pattern match
    for (const [pattern, publisher] of this.publishers) {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        if (regex.test(eventType)) {
          return publisher;
        }
      }
    }

    return undefined;
  }

  /**
   * Map database row to OutboxEvent
   */
  private mapRowToOutboxEvent(row: any): OutboxEvent {
    return {
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
  }

  /**
   * Get statistics for outbox events
   */
  @Metric('outbox.stats')
  async getStatistics(): Promise<{
    pending: number;
    processing: number;
    published: number;
    failed: number;
    deadLetter: number;
  }> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `SELECT 
           status,
           COUNT(*) as count
         FROM outbox_events
         GROUP BY status`
      );
      
      const stats = {
        pending: 0,
        processing: 0,
        published: 0,
        failed: 0,
        deadLetter: 0
      };
      
      for (const row of result.rows) {
        switch (row.status) {
          case 'PENDING':
            stats.pending = parseInt(row.count);
            break;
          case 'PROCESSING':
            stats.processing = parseInt(row.count);
            break;
          case 'PUBLISHED':
            stats.published = parseInt(row.count);
            break;
          case 'FAILED':
            stats.failed = parseInt(row.count);
            break;
          case 'DEAD_LETTER':
            stats.deadLetter = parseInt(row.count);
            break;
        }
      }
      
      return stats;
    } finally {
      client.release();
    }
  }

  /**
   * Reprocess dead letter events
   */
  @Trace()
  @Metric('outbox.reprocess-dead-letter')
  async reprocessDeadLetter(limit: number = 100): Promise<number> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `UPDATE outbox_events 
         SET status = 'PENDING', 
             retry_count = 0,
             error_message = NULL,
             next_retry_at = NULL
         WHERE id IN (
           SELECT id FROM outbox_events
           WHERE status = 'DEAD_LETTER'
           LIMIT $1
         )`,
        [limit]
      );
      
      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  /**
   * Clean up old published events
   */
  @Trace()
  async cleanup(retentionDays: number = 7): Promise<number> {
    const client = await this.pool.connect();
    
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      
      const result = await client.query(
        `DELETE FROM outbox_events 
         WHERE status = 'PUBLISHED' 
         AND published_at < $1`,
        [cutoffDate]
      );
      
      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  /**
   * Dispose of resources
   */
  async dispose(): Promise<void> {
    this.stopProcessing();
    await this.pool.end();
  }
}

/**
 * Example Kafka publisher implementation
 */
export class KafkaMessagePublisher implements MessagePublisher {
  constructor(private readonly topic: string) {}

  async publish(event: OutboxEvent): Promise<void> {
    // Kafka publishing logic would go here
    console.log(`Publishing to Kafka topic ${this.topic}:`, event);
  }
}

/**
 * Example Redis publisher implementation
 */
export class RedisMessagePublisher implements MessagePublisher {
  constructor(private readonly channel: string) {}

  async publish(event: OutboxEvent): Promise<void> {
    // Redis publishing logic would go here
    console.log(`Publishing to Redis channel ${this.channel}:`, event);
  }
}