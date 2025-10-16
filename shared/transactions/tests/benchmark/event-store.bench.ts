import { bench, describe } from 'vitest';
import { EventStoreService } from '../../src/event-sourcing/event-store.service';
import { DomainEvent } from '../../src/event-sourcing/types';
import { v4 as uuid } from 'uuid';

// Test event
class BenchmarkEvent implements DomainEvent {
  readonly type = 'BenchmarkEvent';
  constructor(
    public readonly data: Record<string, any>,
    public readonly metadata: Record<string, any> = {}
  ) {}
}

describe('EventStore Performance', () => {
  const eventStore = new EventStoreService({
    connectionString: process.env.DATABASE_URL || 'postgresql://vextrus:vextrus_dev_2024@localhost:5432/vextrus_test',
    enableSnapshots: true,
    snapshotFrequency: 100
  });

  bench('append single event', async () => {
    const streamId = `bench-${uuid()}`;
    const event = new BenchmarkEvent({ value: Math.random() });
    await eventStore.appendToStream(streamId, [event]);
  });

  bench('append 10 events', async () => {
    const streamId = `bench-${uuid()}`;
    const events = Array.from({ length: 10 }, () => 
      new BenchmarkEvent({ value: Math.random() })
    );
    await eventStore.appendToStream(streamId, events);
  });

  bench('append 100 events', async () => {
    const streamId = `bench-${uuid()}`;
    const events = Array.from({ length: 100 }, () => 
      new BenchmarkEvent({ value: Math.random() })
    );
    await eventStore.appendToStream(streamId, events);
  });

  bench('read stream with 100 events', async () => {
    const streamId = `bench-read-${uuid()}`;
    // Setup: append events first
    const events = Array.from({ length: 100 }, () => 
      new BenchmarkEvent({ value: Math.random() })
    );
    await eventStore.appendToStream(streamId, events);
    
    // Benchmark read
    await eventStore.readStream(streamId);
  });

  bench('read stream with snapshot', async () => {
    const streamId = `bench-snapshot-${uuid()}`;
    // Setup: append events to trigger snapshot
    const events = Array.from({ length: 101 }, () => 
      new BenchmarkEvent({ value: Math.random() })
    );
    await eventStore.appendToStream(streamId, events);
    
    // Benchmark read with snapshot
    await eventStore.readStream(streamId);
  });

  bench('concurrent append (10 streams)', async () => {
    const promises = Array.from({ length: 10 }, async (_, i) => {
      const streamId = `bench-concurrent-${uuid()}-${i}`;
      const event = new BenchmarkEvent({ stream: i, value: Math.random() });
      return eventStore.appendToStream(streamId, [event]);
    });
    await Promise.all(promises);
  });

  bench('optimistic concurrency check', async () => {
    const streamId = `bench-occ-${uuid()}`;
    const event = new BenchmarkEvent({ value: Math.random() });
    await eventStore.appendToStream(streamId, [event], 0);
  });
});