import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Pool } from 'pg';
import { SagaOrchestrator, SagaBuilder, SagaContext } from '../../src/saga/saga-state-machine';
import { SagaRepository } from '../../src/saga/saga-repository';
import { EventStoreService } from '../../src/event-sourcing/event-store.service';
import { OutboxService, MessagePublisher } from '../../src/patterns/outbox.service';
import { DomainEvent } from '../../src/event-sourcing/types';

// Test events
class OrderCreatedEvent implements DomainEvent {
  readonly type = 'OrderCreated';
  constructor(
    public readonly data: { orderId: string; amount: number },
    public readonly metadata: Record<string, any> = {}
  ) {}
}

class PaymentProcessedEvent implements DomainEvent {
  readonly type = 'PaymentProcessed';
  constructor(
    public readonly data: { orderId: string; paymentId: string },
    public readonly metadata: Record<string, any> = {}
  ) {}
}

class InventoryReservedEvent implements DomainEvent {
  readonly type = 'InventoryReserved';
  constructor(
    public readonly data: { orderId: string; items: string[] },
    public readonly metadata: Record<string, any> = {}
  ) {}
}

class ShipmentCreatedEvent implements DomainEvent {
  readonly type = 'ShipmentCreated';
  constructor(
    public readonly data: { orderId: string; trackingNumber: string },
    public readonly metadata: Record<string, any> = {}
  ) {}
}

// Test services
class TestPaymentService {
  async processPayment(orderId: string, amount: number): Promise<string> {
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 100));
    if (amount > 10000) {
      throw new Error('Payment amount exceeds limit');
    }
    return `PAY-${orderId}`;
  }

  async cancelPayment(paymentId: string): Promise<void> {
    // Simulate cancellation
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

class TestInventoryService {
  async reserveItems(orderId: string, items: string[]): Promise<void> {
    // Simulate reservation
    await new Promise(resolve => setTimeout(resolve, 100));
    if (items.includes('OUT_OF_STOCK')) {
      throw new Error('Item out of stock');
    }
  }

  async releaseItems(orderId: string): Promise<void> {
    // Simulate release
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

class TestShippingService {
  async createShipment(orderId: string): Promise<string> {
    // Simulate shipment creation
    await new Promise(resolve => setTimeout(resolve, 100));
    return `TRACK-${orderId}`;
  }

  async cancelShipment(trackingNumber: string): Promise<void> {
    // Simulate cancellation
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

// Test message publisher
class TestMessagePublisher implements MessagePublisher {
  publishedEvents: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.publishedEvents.push(event);
  }
}

describe('Saga Orchestration Integration Tests', () => {
  let pool: Pool;
  let sagaRepository: SagaRepository;
  let eventStore: EventStoreService;
  let outboxService: OutboxService;
  let orchestrator: SagaOrchestrator<any>;
  let messagePublisher: TestMessagePublisher;
  let paymentService: TestPaymentService;
  let inventoryService: TestInventoryService;
  let shippingService: TestShippingService;

  beforeAll(async () => {
    // Setup test database connection
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'vextrus_test',
      user: process.env.DB_USER || 'vextrus',
      password: process.env.DB_PASSWORD || 'vextrus_dev_2024'
    });

    // Initialize services
    sagaRepository = new SagaRepository(pool);
    eventStore = new EventStoreService({
      connectionString: `postgresql://${process.env.DB_USER || 'vextrus'}:${process.env.DB_PASSWORD || 'vextrus_dev_2024'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'vextrus_test'}`,
      enableOutbox: true
    });
    
    messagePublisher = new TestMessagePublisher();
    outboxService = new OutboxService(pool);
    outboxService.registerPublisher('*', messagePublisher);
    
    paymentService = new TestPaymentService();
    inventoryService = new TestInventoryService();
    shippingService = new TestShippingService();

    // Initialize event store
    await eventStore.initialize();
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    messagePublisher.publishedEvents = [];
    
    // Clean up any existing saga states to ensure test isolation
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM saga_state');
      await client.query('DELETE FROM outbox_events');
    } finally {
      client.release();
    }
  });

  describe('Simple Saga Flow', () => {
    it('should execute a simple saga successfully', async () => {
      const sagaBuilder = new SagaBuilder<{ orderId: string; amount: number; paymentId?: string; trackingNumber?: string }>()
        .withName('SimpleOrderSaga')
        .withInitialState('STARTED')
        .addStep('STARTED', async (ctx) => {
          const paymentId = await paymentService.processPayment(
            ctx.data.orderId,
            ctx.data.amount
          );
          ctx.data.paymentId = paymentId;
          return new PaymentProcessedEvent({
            orderId: ctx.data.orderId,
            paymentId
          });
        })
        .addStep('PAYMENT_DONE', async (ctx) => {
          const trackingNumber = await shippingService.createShipment(
            ctx.data.orderId
          );
          ctx.data.trackingNumber = trackingNumber;
          return new ShipmentCreatedEvent({
            orderId: ctx.data.orderId,
            trackingNumber
          });
        })
        .addTransition('STARTED', 'PaymentProcessed', 'PAYMENT_DONE')
        .addTransition('PAYMENT_DONE', 'ShipmentCreated', 'COMPLETED');

      orchestrator = sagaBuilder.createOrchestrator(sagaRepository);

      // Start saga
      const sagaId = await orchestrator.start({
        orderId: 'ORDER-001',
        amount: 1000
      });

      expect(sagaId).toBeDefined();

      // Handle events
      await orchestrator.handleEvent(sagaId, new PaymentProcessedEvent({
        orderId: 'ORDER-001',
        paymentId: 'PAY-ORDER-001'
      }));

      await orchestrator.handleEvent(sagaId, new ShipmentCreatedEvent({
        orderId: 'ORDER-001',
        trackingNumber: 'TRACK-ORDER-001'
      }));

      // Verify saga state
      const sagaState = await sagaRepository.load(sagaId);
      expect(sagaState?.status).toBe('COMPLETED');
      expect(sagaState?.data.paymentId).toBe('PAY-ORDER-001');
      expect(sagaState?.data.trackingNumber).toBe('TRACK-ORDER-001');
    });

    it('should handle saga compensation on failure', async () => {
      // Track compensation calls using a simple flag we can verify
      let compensationCalled = false;

      const saga = new SagaBuilder<{ orderId: string; amount: number; paymentId?: string }>()
        .withName('CompensationSaga')
        .withInitialState('STARTED')
        .addStep('STARTED', async (ctx) => {
          const paymentId = await paymentService.processPayment(
            ctx.data.orderId,
            ctx.data.amount
          );
          ctx.data.paymentId = paymentId;
          return new PaymentProcessedEvent({
            orderId: ctx.data.orderId,
            paymentId
          });
        })
        .addCompensation('STARTED', async (ctx) => {
          compensationCalled = true;
          if (ctx.data.paymentId) {
            await paymentService.cancelPayment(ctx.data.paymentId);
          }
        })
        .addTransition('STARTED', 'PaymentProcessed', 'PAYMENT_DONE')
        .addTransition('PAYMENT_DONE', 'InventoryReserved', 'COMPLETED');

      orchestrator = saga.createOrchestrator(sagaRepository);

      // Start saga
      const sagaId = await orchestrator.start({
        orderId: 'ORDER-002',
        amount: 500
      });

      // Process payment successfully
      await orchestrator.handleEvent(sagaId, new PaymentProcessedEvent({
        orderId: 'ORDER-002',
        paymentId: 'PAY-ORDER-002'
      }));

      // Manually simulate a failure and trigger compensation
      const sagaState = await sagaRepository.load(sagaId);
      sagaState!.currentState = 'FAILED';
      sagaState!.executedSteps = ['STARTED'];
      await sagaRepository.save(sagaState!);

      // Trigger compensation
      await orchestrator.compensate(sagaId);

      // Verify compensation was called
      expect(compensationCalled).toBe(true);
      
      // Verify saga state
      const finalState = await sagaRepository.load(sagaId);
      expect(finalState?.status).toBe('COMPENSATED');
    });
  });

  describe('Complex Saga with Parallel Steps', () => {
    it('should handle parallel saga steps', async () => {
      const executionOrder: string[] = [];

      const saga = new SagaBuilder<{ orderId: string }>()
        .withName('ParallelSaga')
        .withInitialState('STARTED')
        .addStep('STARTED', async (ctx) => {
          executionOrder.push('INIT');
          return { type: 'InitCompleted', data: {}, metadata: {} };
        })
        .addStep('INIT_DONE', async (ctx) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          executionOrder.push('PARALLEL_1');
          return { type: 'Parallel1Completed', data: {}, metadata: {} };
        })
        .addStep('PARALLEL_2', async (ctx) => {
          await new Promise(resolve => setTimeout(resolve, 50));
          executionOrder.push('PARALLEL_2');
          return { type: 'Parallel2Completed', data: {}, metadata: {} };
        })
        .addStep('FINAL', async (ctx) => {
          executionOrder.push('FINAL');
          return { type: 'FinalCompleted', data: {}, metadata: {} };
        })
        .addTransition('STARTED', 'InitCompleted', 'INIT_DONE')
        .addTransition('INIT_DONE', 'Parallel1Completed', 'PARALLEL_2')
        .addTransition('PARALLEL_2', 'Parallel2Completed', 'FINAL')
        .addTransition('FINAL', 'FinalCompleted', 'COMPLETED');

      orchestrator = saga.createOrchestrator(sagaRepository);

      const sagaId = await orchestrator.start({ orderId: 'ORDER-003' });

      // Execute steps
      await orchestrator.handleEvent(sagaId, { type: 'InitCompleted', data: {}, metadata: {} });
      
      // Execute steps sequentially (but can be in any order)
      await orchestrator.handleEvent(sagaId, { type: 'Parallel1Completed', data: {}, metadata: {} });
      await orchestrator.handleEvent(sagaId, { type: 'Parallel2Completed', data: {}, metadata: {} });
      
      await orchestrator.handleEvent(sagaId, { type: 'FinalCompleted', data: {}, metadata: {} });

      // Verify execution order (parallel steps can complete in any order)
      expect(executionOrder[0]).toBe('INIT');
      expect(executionOrder).toContain('PARALLEL_1');
      expect(executionOrder).toContain('PARALLEL_2');
      expect(executionOrder[executionOrder.length - 1]).toBe('FINAL');
    });
  });

  describe('Saga Recovery', () => {
    it('should recover stale sagas', async () => {
      // Create a simple saga without auto-execution
      const saga = new SagaBuilder<{ orderId: string }>()
        .withName('RecoverySaga')
        .withInitialState('STARTED')
        .addTransition('STARTED', 'OrderProcessed', 'COMPLETED');

      orchestrator = saga.createOrchestrator(sagaRepository);

      // Create a saga and let it stay in STARTED state
      const sagaId = await orchestrator.start({ orderId: 'ORDER-004' });
      
      // Wait for the saga to be persisted
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify the saga exists and is not completed
      let loadedSaga = await sagaRepository.load(sagaId);
      expect(loadedSaga).toBeDefined();
      expect(loadedSaga?.currentState).toBe('STARTED');
      expect(loadedSaga?.completedAt).toBeNull();
      
      // Manually update saga to be stale
      const client = await pool.connect();
      try {
        // Disable the trigger that auto-updates updated_at
        await client.query('ALTER TABLE saga_state DISABLE TRIGGER trigger_update_saga_timestamp');
        
        // Set updated_at to 2 hours ago
        const staleTime = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const result = await client.query(
          'UPDATE saga_state SET updated_at = $2 WHERE id = $1 RETURNING *',
          [sagaId, staleTime]
        );
        expect(result.rowCount).toBe(1);
        
        // Re-enable the trigger for other tests
        await client.query('ALTER TABLE saga_state ENABLE TRIGGER trigger_update_saga_timestamp');
      } finally {
        client.release();
      }

      // Find stale sagas (sagas not updated in the last 60 minutes)
      const staleSagas = await sagaRepository.findStale(60);
      
      // Should find our stale saga
      expect(staleSagas.length).toBeGreaterThan(0);
      const staleSaga = staleSagas.find(s => s.sagaId === sagaId || s.id === sagaId);
      expect(staleSaga).toBeDefined();

      // Recover the saga by compensating it
      await orchestrator.compensate(sagaId);

      // Verify saga was compensated
      const finalState = await sagaRepository.load(sagaId);
      expect(finalState?.status).toBe('COMPENSATED');
    });
  });

  describe('Event Store Integration', () => {
    it('should persist saga events to event store', async () => {
      const saga = new SagaBuilder<{ orderId: string }>()
        .withName('EventStoreSaga')
        .withInitialState('STARTED')
        .addStep('STARTED', async (ctx) => {
          return new OrderCreatedEvent({ orderId: ctx.data.orderId, amount: 100 });
        })
        .addTransition('STARTED', 'OrderCreated', 'COMPLETED');

      orchestrator = saga.createOrchestrator(sagaRepository);

      const sagaId = await orchestrator.start({ orderId: 'ORDER-005' });
      const streamId = `saga-${sagaId}`;

      // Store events
      const event = new OrderCreatedEvent({ orderId: 'ORDER-005', amount: 100 });
      await eventStore.appendToStream(streamId, [event]);

      // Read events back
      const stream = await eventStore.readStream(streamId);
      expect(stream.events).toHaveLength(1);
      expect(stream.events[0].type).toBe('OrderCreated');
      expect(stream.events[0].data.orderId).toBe('ORDER-005');
    });
  });

  describe('Outbox Pattern Integration', () => {
    it('should process saga events through outbox', async () => {
      const saga = new SagaBuilder<{ orderId: string }>()
        .withName('OutboxSaga')
        .withInitialState('STARTED')
        .addStep('STARTED', async (ctx) => {
          return new OrderCreatedEvent({ orderId: ctx.data.orderId, amount: 200 });
        })
        .addTransition('STARTED', 'OrderCreated', 'COMPLETED');

      orchestrator = saga.createOrchestrator(sagaRepository);

      const sagaId = await orchestrator.start({ orderId: 'ORDER-006' });
      
      // Process event through event store with outbox
      const event = new OrderCreatedEvent({ orderId: 'ORDER-006', amount: 200 });
      await eventStore.appendToStream(`saga-${sagaId}`, [event]);

      // Process outbox events using outbox service
      const processed = await outboxService.processOutboxEvents();
      expect(processed).toBeGreaterThan(0);

      // Verify event was published
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async processing
      expect(messagePublisher.publishedEvents.length).toBeGreaterThan(0);
    });
  });
});