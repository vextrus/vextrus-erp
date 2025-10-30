import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Pool } from 'pg';
import { EventStoreService } from '../../../src/event-sourcing/event-store.service';
import type { DomainEvent, EventStoreOptions } from '../../../src/event-sourcing/types';

// Mock the pg module
vi.mock('pg', () => {
  const mockClient = {
    query: vi.fn(),
    release: vi.fn(),
  };
  
  const mockPool = {
    connect: vi.fn().mockResolvedValue(mockClient),
    query: vi.fn(),
    end: vi.fn(),
  };
  
  return {
    Pool: vi.fn(() => mockPool),
  };
});

// Mock emmett-postgresql
vi.mock('@event-driven-io/emmett-postgresql', () => ({
  getPostgreSQLEventStore: vi.fn(() => ({
    appendToStream: vi.fn(),
    readStream: vi.fn(),
  })),
}));

// Test event
class TestEvent implements DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly data: any
  ) {}
  type = 'TestEvent';
}

describe('EventStoreService', () => {
  let eventStore: EventStoreService;
  let mockPool: any;
  let mockClient: any;
  const options: EventStoreOptions = {
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    user: 'test_user',
    password: 'test_pass',
    enableSnapshots: true,
    snapshotFrequency: 10,
    enableOutbox: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPool = new Pool(options as any);
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };
    mockPool.connect.mockResolvedValue(mockClient);
    eventStore = new EventStoreService(options);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('appendToStream', () => {
    it('should append events to stream successfully', async () => {
      const streamId = 'order-123';
      const events = [
        new TestEvent('order-123', { amount: 100 }),
        new TestEvent('order-123', { amount: 200 }),
      ];

      mockClient.query.mockImplementation((query) => {
        if (typeof query === 'string') {
          if (query === 'BEGIN' || query === 'COMMIT' || query === 'ROLLBACK') {
            return Promise.resolve({});
          }
          if (query.includes('SELECT MAX(stream_version)')) {
            return Promise.resolve({ rows: [{ version: 0 }] });
          }
          if (query.includes('INSERT INTO event_store')) {
            return Promise.resolve({ rows: [] });
          }
          if (query.includes('INSERT INTO outbox_events')) {
            return Promise.resolve({ rows: [] });
          }
        }
        return Promise.resolve({ rows: [] });
      });

      await eventStore.appendToStream(streamId, events);

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle optimistic concurrency control', async () => {
      const streamId = 'order-456';
      const events = [new TestEvent('order-456', { amount: 300 })];
      const expectedVersion = 5;

      mockClient.query.mockImplementation((query) => {
        if (typeof query === 'string') {
          if (query === 'BEGIN' || query === 'ROLLBACK') {
            return Promise.resolve({});
          }
          if (query.includes('SELECT MAX(stream_version)')) {
            return Promise.resolve({ rows: [{ version: 4 }] });
          }
        }
        return Promise.resolve({ rows: [] });
      });

      await expect(
        eventStore.appendToStream(streamId, events, expectedVersion)
      ).rejects.toThrow('Concurrency conflict: expected version 5, current version 4');

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should create snapshot when threshold is reached', async () => {
      const streamId = 'order-789';
      const events = Array.from({ length: 11 }, (_, i) => 
        new TestEvent('order-789', { index: i })
      );

      let snapshotCallMade = false;
      mockClient.query.mockImplementation((query) => {
        if (typeof query === 'string') {
          if (query === 'BEGIN' || query === 'COMMIT') {
            return Promise.resolve({});
          }
          if (query.includes('SELECT MAX(stream_version)')) {
            return Promise.resolve({ rows: [{ version: 0 }] });
          }
          if (query.includes('INSERT INTO event_store')) {
            return Promise.resolve({ rows: [] });
          }
          if (query.includes('INSERT INTO outbox_events')) {
            return Promise.resolve({ rows: [] });
          }
          if (query.includes('INSERT INTO event_snapshots')) {
            snapshotCallMade = true;
            return Promise.resolve({ rows: [] });
          }
        }
        return Promise.resolve({ rows: [] });
      });

      await eventStore.appendToStream(streamId, events);

      // Check that snapshot was attempted (11 events > threshold of 10)
      expect(snapshotCallMade).toBe(true);
    });

    it('should rollback on error', async () => {
      const streamId = 'order-error';
      const events = [new TestEvent('order-error', { amount: 100 })];

      mockClient.query.mockResolvedValueOnce({ rows: [] }); // Check stream version
      mockClient.query.mockResolvedValueOnce({}); // BEGIN
      mockClient.query.mockRejectedValueOnce(new Error('Database error')); // Insert fails
      mockClient.query.mockResolvedValueOnce({}); // ROLLBACK

      await expect(
        eventStore.appendToStream(streamId, events)
      ).rejects.toThrow('Database error');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('readStream', () => {
    it('should read events from stream', async () => {
      const streamId = 'order-read';
      const mockEvents = [
        { event_type: 'OrderCreated', event_data: JSON.stringify({ amount: 100 }), stream_version: 1, metadata: JSON.stringify({}), created_at: new Date() },
        { event_type: 'OrderUpdated', event_data: JSON.stringify({ amount: 200 }), stream_version: 2, metadata: JSON.stringify({}), created_at: new Date() },
      ];

      mockClient.query.mockImplementation((query) => {
        if (typeof query === 'string' && query.includes('event_snapshots')) {
          return Promise.resolve({ rows: [] });
        }
        if (typeof query === 'string' && query.includes('event_store')) {
          return Promise.resolve({ rows: mockEvents });
        }
        return Promise.resolve({ rows: [] });
      });

      const result = await eventStore.readStream(streamId);

      expect(result.streamId).toBe(streamId);
      expect(result.events).toHaveLength(2);
      expect(result.events[0].type).toBe('OrderCreated');
      expect(result.events[1].type).toBe('OrderUpdated');
      expect(result.version).toBe(2);
    });

    it('should read events with version range', async () => {
      const streamId = 'order-range';
      
      mockClient.query.mockImplementation((query) => {
        if (typeof query === 'string' && query.includes('event_snapshots')) {
          return Promise.resolve({ rows: [] });
        }
        if (typeof query === 'string' && query.includes('event_store')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });

      await eventStore.readStream(streamId, 5, 10);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('stream_version > $2'),
        expect.arrayContaining([streamId, 5, 10])
      );
    });

    it('should use snapshot if available', async () => {
      const streamId = 'order-snapshot';
      const snapshot = {
        stream_version: 10,
        snapshot_data: JSON.stringify({ state: 'snapshot', value: 500 }),
        created_at: new Date(),
      };
      const eventsAfterSnapshot = [
        { event_type: 'OrderUpdated', event_data: JSON.stringify({ amount: 600 }), stream_version: 11, metadata: JSON.stringify({}), created_at: new Date() },
      ];

      mockClient.query.mockImplementation((query) => {
        if (typeof query === 'string' && query.includes('event_snapshots')) {
          return Promise.resolve({ rows: [snapshot] });
        }
        if (typeof query === 'string' && query.includes('event_store')) {
          return Promise.resolve({ rows: eventsAfterSnapshot });
        }
        return Promise.resolve({ rows: [] });
      });

      const result = await eventStore.readStream(streamId);

      expect(result.snapshot).toBeDefined();
      expect(result.snapshot?.version).toBe(10);
      expect(result.events).toHaveLength(1);
      expect(result.version).toBe(11);
    });
  });

  describe('processOutboxEvents', () => {
    it('should process pending outbox events', async () => {
      const outboxEvents = [
        { 
          id: 1, 
          aggregate_id: 'order-1',
          event_type: 'OrderCreated',
          payload: { amount: 100 },
          retry_count: 0,
          max_retries: 3
        },
        { 
          id: 2,
          aggregate_id: 'order-2', 
          event_type: 'OrderShipped',
          payload: { trackingNumber: 'ABC123' },
          retry_count: 0,
          max_retries: 3
        },
      ];

      mockClient.query.mockResolvedValueOnce({}); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rows: outboxEvents }); // SELECT outbox events
      mockClient.query.mockResolvedValueOnce({}); // UPDATE status to PROCESSING
      mockClient.query.mockResolvedValueOnce({}); // COMMIT

      const processor = vi.fn().mockResolvedValue(undefined);
      mockClient.query.mockResolvedValueOnce({}); // BEGIN for each event
      mockClient.query.mockResolvedValueOnce({}); // UPDATE to PUBLISHED
      mockClient.query.mockResolvedValueOnce({}); // COMMIT
      mockClient.query.mockResolvedValueOnce({}); // BEGIN for each event
      mockClient.query.mockResolvedValueOnce({}); // UPDATE to PUBLISHED
      mockClient.query.mockResolvedValueOnce({}); // COMMIT

      const processed = await eventStore.processOutboxEvents(10, processor);

      expect(processed).toBe(2);
      expect(processor).toHaveBeenCalledTimes(2);
      expect(processor).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        aggregateId: 'order-1',
      }));
    });

    it('should handle failed event processing', async () => {
      const outboxEvent = {
        id: 3,
        aggregate_id: 'order-3',
        event_type: 'OrderFailed',
        payload: { reason: 'Payment declined' },
        retry_count: 2,
        max_retries: 3,
      };

      mockClient.query.mockResolvedValueOnce({}); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rows: [outboxEvent] }); // SELECT
      mockClient.query.mockResolvedValueOnce({}); // UPDATE to PROCESSING
      mockClient.query.mockResolvedValueOnce({}); // COMMIT

      const processor = vi.fn().mockRejectedValue(new Error('Processing failed'));
      mockClient.query.mockResolvedValueOnce({}); // BEGIN for retry
      mockClient.query.mockResolvedValueOnce({}); // UPDATE retry count
      mockClient.query.mockResolvedValueOnce({}); // COMMIT

      const processed = await eventStore.processOutboxEvents(10, processor);

      expect(processed).toBe(0); // No successful processing
      expect(processor).toHaveBeenCalledTimes(1);
    });

    it('should skip events that have reached max retries', async () => {
      const outboxEvent = {
        id: 4,
        aggregate_id: 'order-4',
        event_type: 'OrderCancelled',
        payload: { reason: 'Customer request' },
        retry_count: 3,
        max_retries: 3,
      };

      mockClient.query.mockResolvedValueOnce({}); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // SELECT (no events because retry_count >= max_retries)
      mockClient.query.mockResolvedValueOnce({}); // COMMIT

      const processor = vi.fn();
      const processed = await eventStore.processOutboxEvents(10, processor);

      expect(processed).toBe(0);
      expect(processor).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on destroy', async () => {
      await eventStore.destroy();
      expect(mockPool.end).toHaveBeenCalled();
    });
  });
});