# Event Sourcing Advanced Patterns

EventStore operations, snapshots, and testing strategies.

---

## Event Store Operations

### Append Events to Stream
```typescript
async save(aggregate: AggregateRoot): Promise<void> {
  const events = aggregate.getUncommittedEvents();
  const stream = `invoice-${aggregate.getId()}`;

  for (const event of events) {
    await this.eventStore.appendToStream(
      stream,
      {
        type: event.eventType,
        data: event.data,
        metadata: {
          aggregateId: aggregate.getId(),
          version: aggregate.getVersion(),
          timestamp: new Date(),
        },
      },
      aggregate.getVersion() - 1, // Optimistic concurrency
    );
  }

  aggregate.commit(); // Clear uncommitted events
}
```

### Load Aggregate from Events
```typescript
async getById(id: string): Promise<InvoiceAggregate> {
  const stream = `invoice-${id}`;
  const events = await this.eventStore.readStream(stream);

  if (events.length === 0) {
    throw new Error(`Invoice ${id} not found`);
  }

  // Replay events to rebuild state
  const aggregate = new InvoiceAggregate();
  for (const event of events) {
    aggregate.loadFromHistory(event);
  }

  return aggregate;
}
```

---

## Snapshots (Performance Optimization)

For aggregates with many events (>100), snapshots improve load performance.

### Save Snapshot
```typescript
// Save snapshot every 100 events
if (aggregate.getVersion() % 100 === 0) {
  await this.snapshotStore.save({
    aggregateId: aggregate.getId(),
    version: aggregate.getVersion(),
    state: aggregate.getState(),
  });
}
```

### Load from Snapshot
```typescript
// Load from snapshot + recent events
const snapshot = await this.snapshotStore.getLatest(id);
const aggregate = InvoiceAggregate.fromSnapshot(snapshot);

// Only replay events after snapshot
const eventsAfter = await this.eventStore.readStream(
  `invoice-${id}`,
  snapshot.version,
);

for (const event of eventsAfter) {
  aggregate.loadFromHistory(event);
}
```

---

## Testing Event-Sourced Aggregates

### Given-When-Then Pattern
```typescript
describe('InvoiceAggregate', () => {
  it('should mark invoice as paid', () => {
    // GIVEN - Arrange: Set up initial state
    const aggregate = InvoiceAggregate.create({
      customerId: 'cust-1',
      items: [{ productId: 'prod-1', quantity: 1, price: 100 }],
    });
    aggregate.commit(); // Clear creation events

    // WHEN - Act: Execute business method
    aggregate.markAsPaid('payment-123');

    // THEN - Assert: Verify events
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(InvoiceMarkedAsPaidEvent);
    expect(events[0].data.paymentId).toBe('payment-123');

    // Verify state
    expect(aggregate.getStatus()).toBe(InvoiceStatus.PAID);
  });

  it('should be idempotent when marking as paid twice', () => {
    const aggregate = InvoiceAggregate.create({...});

    // Mark as paid twice
    aggregate.markAsPaid('payment-123');
    aggregate.commit();
    aggregate.markAsPaid('payment-123');

    // Should not create duplicate event
    expect(aggregate.getUncommittedEvents()).toHaveLength(0);
  });

  it('should enforce business rules', () => {
    const aggregate = InvoiceAggregate.create({...});

    // Mark as paid
    aggregate.markAsPaid('payment-123');
    aggregate.commit();

    // Try to add item to paid invoice
    expect(() => {
      aggregate.addItem({ productId: 'prod-2', quantity: 1 });
    }).toThrow('Cannot add items to non-draft invoice');
  });
});
```

### Test Event Replay
```typescript
it('should rebuild state from events', () => {
  // Create aggregate and generate events
  const aggregate1 = InvoiceAggregate.create({...});
  aggregate1.addItem({ productId: 'prod-1', quantity: 2 });
  aggregate1.markAsPaid('payment-123');

  const events = aggregate1.getAllEvents();

  // Replay events into new aggregate
  const aggregate2 = new InvoiceAggregate();
  for (const event of events) {
    aggregate2.loadFromHistory(event);
  }

  // Should have same state
  expect(aggregate2.getId()).toBe(aggregate1.getId());
  expect(aggregate2.getStatus()).toBe(InvoiceStatus.PAID);
  expect(aggregate2.getItems()).toEqual(aggregate1.getItems());
});
```

---

## Event Versioning

As system evolves, event schemas may need updates.

### Versioned Events
```typescript
// V1 - Original event
export class InvoiceCreatedEvent_V1 extends DomainEvent {
  readonly eventType = 'InvoiceCreated';
  readonly version = 1;

  constructor(
    public readonly data: {
      aggregateId: string;
      customerId: string;
      amount: number;
    },
  ) {
    super();
  }
}

// V2 - Added items array
export class InvoiceCreatedEvent_V2 extends DomainEvent {
  readonly eventType = 'InvoiceCreated';
  readonly version = 2;

  constructor(
    public readonly data: {
      aggregateId: string;
      customerId: string;
      items: InvoiceItem[]; // NEW
      total: number;
    },
  ) {
    super();
  }
}
```

### Event Upcasting
```typescript
function upcastEvent(storedEvent: any): DomainEvent {
  if (storedEvent.type === 'InvoiceCreated') {
    if (storedEvent.version === 1) {
      // Upcast V1 to V2
      return new InvoiceCreatedEvent_V2({
        ...storedEvent.data,
        items: [{ amount: storedEvent.data.amount }], // Convert
        total: storedEvent.data.amount,
      });
    }
    return storedEvent; // Already V2
  }
  // ... handle other event types
}
```

---

## Best Practices Summary

1. **Snapshots**: Use for aggregates with >100 events
2. **Idempotency**: Always check current state before applying events
3. **Testing**: Use Given-When-Then pattern, test event replay
4. **Versioning**: Plan for event schema evolution from day 1
5. **Concurrency**: Use optimistic locking (version numbers)
6. **Projections**: Rebuild if corrupted (events are source of truth)
