# Event Versioning Patterns

**Source**: Event Sourcing Advanced Patterns
**Purpose**: Manage event schema evolution in event-sourced systems

---

## Why Event Versioning Matters

In event-sourced systems, events are immutable and stored forever. As the system evolves, event schemas need to change while maintaining backward compatibility with historical events.

---

## Versioned Events Pattern

### Version 1 - Original Event
```typescript
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
```

### Version 2 - Enhanced Event
```typescript
export class InvoiceCreatedEvent_V2 extends DomainEvent {
  readonly eventType = 'InvoiceCreated';
  readonly version = 2;

  constructor(
    public readonly data: {
      aggregateId: string;
      customerId: string;
      items: InvoiceItem[]; // NEW FIELD
      total: number;       // RENAMED from amount
    },
  ) {
    super();
  }
}
```

---

## Event Upcasting Pattern

Convert old event versions to new format when loading from event store:

```typescript
function upcastEvent(storedEvent: any): DomainEvent {
  if (storedEvent.type === 'InvoiceCreated') {
    if (storedEvent.version === 1) {
      // Upcast V1 to V2
      return new InvoiceCreatedEvent_V2({
        ...storedEvent.data,
        items: [{ amount: storedEvent.data.amount }], // Convert single amount to items array
        total: storedEvent.data.amount,
      });
    }
    return storedEvent; // Already V2
  }

  // Handle other event types...
}
```

---

## Versioning Strategies

### 1. Additive Changes (Preferred)
**Safe**: Add new optional fields
```typescript
// V1
{ customerId: string }

// V2 (backward compatible)
{ customerId: string, customerEmail?: string }
```

### 2. Field Renames (Requires Upcasting)
**Moderate**: Rename fields with upcasting
```typescript
// V1: { amount: number }
// V2: { total: number }
// Upcast: V2.total = V1.amount
```

### 3. Breaking Changes (Avoid)
**Risky**: Complete schema changes
- Create new event type instead
- Example: `InvoiceCreated` → `InvoiceCreatedV2`

---

## Best Practices

1. **Always Include Version Number**: `readonly version = 1;`
2. **Never Delete Old Event Classes**: Needed for upcasting
3. **Prefer Additive Changes**: Add optional fields instead of renaming
4. **Test Upcasting**: Verify old events load correctly
5. **Document Changes**: Keep changelog of event schema evolution

---

## Testing Event Versioning

```typescript
describe('Event Versioning', () => {
  it('should upcast V1 events to V2', () => {
    const v1Event = {
      type: 'InvoiceCreated',
      version: 1,
      data: { aggregateId: 'inv-1', customerId: 'cust-1', amount: 100 },
    };

    const v2Event = upcastEvent(v1Event);

    expect(v2Event.version).toBe(2);
    expect(v2Event.data.items).toEqual([{ amount: 100 }]);
    expect(v2Event.data.total).toBe(100);
  });

  it('should replay mixed version events', () => {
    const events = [
      InvoiceCreatedEvent_V1(...),  // Old event from 2024
      InvoiceItemAddedEvent_V1(...), // Old event
      InvoiceMarkedAsPaidEvent_V2(...), // New event from 2025
    ];

    const aggregate = new InvoiceAggregate();
    for (const event of events.map(upcastEvent)) {
      aggregate.loadFromHistory(event); // All upcasted to latest version
    }

    expect(aggregate.getVersion()).toBe(3);
  });
});
```

---

## Common Pitfalls

❌ **Don't**:
- Change event type names
- Delete old event versions
- Modify existing event data
- Assume all events are latest version

✅ **Do**:
- Add version field to all events
- Keep old event classes
- Use upcasting layer
- Test with historical events
- Document version changes

---

**See Also**:
- `.claude/skills/event-sourcing/advanced-patterns.md` - Complete event sourcing patterns
- `.claude/skills/event-sourcing/core-patterns.md` - Core aggregate patterns
- `services/finance/src/domain/events/` - Production event versioning examples
