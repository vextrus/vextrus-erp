# @vextrus/distributed-transactions

A comprehensive distributed transactions library for the Vextrus ERP ecosystem, providing event sourcing, saga orchestration, CQRS, and reliability patterns.

## Features

- **Event Sourcing** - Capture all changes as events with PostgreSQL backend
- **Saga Orchestration** - Manage complex distributed workflows with compensation
- **CQRS** - Separate command and query responsibilities with dedicated buses
- **Outbox Pattern** - Ensure reliable event publishing across services
- **Idempotency** - Prevent duplicate operations with configurable middleware
- **Observability** - Built-in tracing and metrics with OpenTelemetry

## Installation

```bash
pnpm add @vextrus/distributed-transactions
```

## Quick Start

### Event Sourcing

```typescript
import { AggregateRoot, EventStoreService } from '@vextrus/distributed-transactions';

// Define your aggregate
class OrderAggregate extends AggregateRoot<OrderState> {
  static create(orderId: string, customerId: string): OrderAggregate {
    const aggregate = new OrderAggregate(orderId, {
      orderId,
      customerId,
      items: [],
      status: 'PENDING',
      version: 0
    });
    
    aggregate.raiseEvent('OrderCreated', { orderId, customerId });
    return aggregate;
  }

  protected when(state: OrderState, event: DomainEvent): OrderState {
    switch (event.type) {
      case 'OrderCreated':
        return { ...state, status: 'CREATED' };
      case 'ItemAdded':
        return { ...state, items: [...state.items, event.data.item] };
      default:
        return state;
    }
  }

  handle(command: DomainCommand): void {
    switch (command.type) {
      case 'AddItem':
        this.raiseEvent('ItemAdded', { item: command.data.item });
        break;
    }
  }

  protected validateInvariants(): void {
    if (this.state.items.length > 100) {
      throw new Error('Too many items');
    }
  }
}

// Use the event store
const eventStore = new EventStoreService({
  connectionString: 'postgresql://...',
  enableSnapshots: true
});

await eventStore.initialize();

const order = OrderAggregate.create('ORD-001', 'CUST-001');
await eventStore.appendToStream(
  order.id,
  order.getUncommittedEvents()
);
```

### Saga Orchestration

```typescript
import { SagaBuilder, SagaOrchestrator } from '@vextrus/distributed-transactions';

// Define saga data
interface OrderSagaData {
  orderId: string;
  amount: number;
  paymentId?: string;
  shipmentId?: string;
}

// Build the saga
const orderSaga = new SagaBuilder<OrderSagaData>()
  .withName('OrderFulfillment')
  .addStep('PAYMENT', async (ctx) => {
    const paymentId = await paymentService.process(ctx.data.amount);
    ctx.data.paymentId = paymentId;
    return { type: 'PaymentProcessed', data: { paymentId } };
  })
  .addCompensation('PAYMENT', async (ctx) => {
    if (ctx.data.paymentId) {
      await paymentService.cancel(ctx.data.paymentId);
    }
  })
  .addStep('SHIPMENT', async (ctx) => {
    const shipmentId = await shippingService.create(ctx.data.orderId);
    ctx.data.shipmentId = shipmentId;
    return { type: 'ShipmentCreated', data: { shipmentId } };
  })
  .addCompensation('SHIPMENT', async (ctx) => {
    if (ctx.data.shipmentId) {
      await shippingService.cancel(ctx.data.shipmentId);
    }
  })
  .build();

// Execute the saga
const orchestrator = new SagaOrchestrator('OrderFulfillment', repository);
const sagaId = await orchestrator.start({
  orderId: 'ORD-001',
  amount: 99.99
});

// Handle events to progress the saga
await orchestrator.handleEvent(sagaId, {
  type: 'PaymentProcessed',
  data: { paymentId: 'PAY-001' }
});
```

### CQRS

```typescript
import { CommandBus, QueryBus, CommandHandler, QueryHandler } from '@vextrus/distributed-transactions';

// Define commands
class CreateOrderCommand {
  constructor(
    public readonly customerId: string,
    public readonly items: OrderItem[]
  ) {}
}

@CommandHandler('CreateOrderCommand')
class CreateOrderHandler {
  async execute(command: CreateOrderCommand): Promise<string> {
    const order = await orderService.create(command);
    return order.id;
  }
}

// Define queries
class GetOrderQuery {
  constructor(public readonly orderId: string) {}
}

@QueryHandler('GetOrderQuery')
class GetOrderHandler {
  async execute(query: GetOrderQuery): Promise<Order> {
    return await orderRepository.findById(query.orderId);
  }
}

// Use the buses
const commandBus = new CommandBus();
commandBus.register('CreateOrderCommand', new CreateOrderHandler());

const queryBus = new QueryBus();
queryBus.register('GetOrderQuery', new GetOrderHandler());

// Execute commands and queries
const orderId = await commandBus.execute(
  new CreateOrderCommand('CUST-001', items)
);

const order = await queryBus.execute(
  new GetOrderQuery(orderId),
  { cache: true } // Enable caching
);
```

### Idempotency Middleware

```typescript
import { IdempotencyService } from '@vextrus/distributed-transactions';
import express from 'express';

const app = express();
const idempotency = new IdempotencyService({
  connectionString: 'postgresql://...',
  keyHeader: 'x-idempotency-key',
  ttlHours: 24
});

// Apply middleware
app.post('/api/orders', 
  idempotency.middleware(),
  async (req, res) => {
    // This handler will only execute once per idempotency key
    const order = await createOrder(req.body);
    res.json(order);
  }
);

// Or use as a decorator
class OrderService {
  @Idempotent({ ttlHours: 24 })
  async createOrder(data: OrderData): Promise<Order> {
    // Method will be idempotent
    return await this.repository.create(data);
  }
}
```

### Outbox Pattern

```typescript
import { OutboxService, KafkaMessagePublisher } from '@vextrus/distributed-transactions';

// Configure publisher
const publisher = new KafkaMessagePublisher({
  brokers: ['localhost:9092'],
  clientId: 'order-service'
});

// Configure outbox
const outbox = new OutboxService(pool, publisher, {
  batchSize: 100,
  processingIntervalMs: 5000,
  maxRetries: 3
});

// Start processing
await outbox.start();

// Events added to outbox within transactions will be reliably published
await eventStore.appendToStream(streamId, events); // Automatically adds to outbox
```

## Architecture

### Event Sourcing

The event sourcing implementation captures all state changes as events:

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│  Aggregate  │─────▶│ Event Store  │─────▶│  PostgreSQL  │
└─────────────┘      └──────────────┘      └──────────────┘
       │                     │                      │
       │                     │                      ▼
       │                     │              ┌──────────────┐
       │                     └─────────────▶│  Snapshots   │
       │                                    └──────────────┘
       ▼
┌─────────────┐
│   Events    │
└─────────────┘
```

### Saga Orchestration

Sagas manage distributed transactions with compensation:

```
┌──────────┐      ┌──────────────┐      ┌──────────────┐
│  Trigger │─────▶│ Orchestrator │─────▶│    Step 1    │
└──────────┘      └──────────────┘      └──────────────┘
                         │                      │
                         │                      ▼
                         │               ┌──────────────┐
                         │               │    Step 2    │
                         │               └──────────────┘
                         │                      │
                         │                      ▼
                         │               ┌──────────────┐
                         └──────────────▶│ Compensation │
                                        └──────────────┘
```

## Configuration

### Database Schema

Run the migrations to set up required tables:

```bash
pnpm run migrate
```

This creates:
- `event_store` - Event storage
- `saga_state` - Saga persistence
- `outbox_events` - Reliable publishing
- `idempotency_keys` - Request deduplication
- `event_snapshots` - Performance optimization

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Optional: Event Store
EVENT_STORE_SNAPSHOT_FREQUENCY=100
EVENT_STORE_ENABLE_OUTBOX=true

# Optional: Saga
SAGA_TIMEOUT_MINUTES=60
SAGA_MAX_RETRIES=3

# Optional: Idempotency
IDEMPOTENCY_TTL_HOURS=24
```

## Best Practices

### Event Sourcing

1. **Keep events immutable** - Never modify past events
2. **Use meaningful event names** - `OrderShipped` not `Event123`
3. **Include sufficient data** - Events should be self-contained
4. **Version your events** - Plan for schema evolution
5. **Create snapshots** - Improve read performance for long streams

### Saga Orchestration

1. **Design for failure** - Always implement compensation
2. **Keep steps idempotent** - Steps may be retried
3. **Use timeouts** - Prevent sagas from running forever
4. **Monitor saga state** - Track active, completed, and failed sagas
5. **Test compensations** - Ensure rollback logic works

### CQRS

1. **Separate models** - Commands and queries use different models
2. **Async projections** - Build read models asynchronously
3. **Cache queries** - Improve read performance
4. **Validate commands** - Ensure business rules before execution
5. **Use correlation IDs** - Track operations across services

### Idempotency

1. **Use unique keys** - Generate deterministic idempotency keys
2. **Set appropriate TTL** - Balance between safety and storage
3. **Include request data** - Hash relevant request parameters
4. **Handle retries gracefully** - Return cached responses
5. **Clean up old keys** - Prevent database bloat

## Performance

### Benchmarks

Run performance benchmarks:

```bash
pnpm run bench
```

Typical results on standard hardware:
- Single event append: ~5ms
- 100 event batch: ~50ms
- Saga start: ~10ms
- Command execution: ~3ms
- Cached query: <1ms

### Optimization Tips

1. **Batch operations** - Process events in batches
2. **Use snapshots** - Reduce event replay time
3. **Enable caching** - Cache frequently accessed queries
4. **Connection pooling** - Reuse database connections
5. **Async processing** - Use outbox for eventual consistency

## Testing

### Unit Tests

```bash
pnpm test
```

### Integration Tests

```bash
pnpm test:integration
```

### Coverage

```bash
pnpm test:coverage
```

## Migration Guide

### From v0.x to v1.0

1. Update imports:
```typescript
// Before
import { EventStore } from '@vextrus/distributed-transactions/event-store';

// After
import { EventStoreService } from '@vextrus/distributed-transactions';
```

2. Update configuration:
```typescript
// Before
new EventStore(pool, { snapshots: true });

// After
new EventStoreService({ 
  connectionString: '...',
  enableSnapshots: true 
});
```

## API Reference

See [API Documentation](./docs/api.md) for detailed API reference.

## Examples

See the [examples](./src/examples) directory for complete examples:
- [Order-to-Cash Workflow](./src/examples/order-to-cash)
- [Inventory Management Saga](./src/examples/inventory-saga)
- [Payment Processing](./src/examples/payment-processing)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

MIT - See [LICENSE](../../LICENSE) for details.