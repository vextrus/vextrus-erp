import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SagaOrchestrator, SagaBuilder, SagaContext } from '../../../src/saga/saga-state-machine';
import { SagaRepository } from '../../../src/saga/saga-repository';
import type { DomainEvent, SagaState } from '../../../src/event-sourcing/types';

// Mock the repository
vi.mock('../../../src/saga/saga-repository');

// Test events
class OrderCreatedEvent implements DomainEvent {
  type = 'OrderCreated';
  constructor(public orderId: string, public amount: number) {}
}

class PaymentProcessedEvent implements DomainEvent {
  type = 'PaymentProcessed';
  constructor(public orderId: string, public success: boolean) {}
}

class InventoryReservedEvent implements DomainEvent {
  type = 'InventoryReserved';
  constructor(public orderId: string, public items: string[]) {}
}

class ShipmentCreatedEvent implements DomainEvent {
  type = 'ShipmentCreated';
  constructor(public orderId: string, public trackingNumber: string) {}
}

// Test saga data
interface OrderSagaData {
  orderId: string;
  amount: number;
  items?: string[];
  paymentId?: string;
  trackingNumber?: string;
}

describe('SagaOrchestrator', () => {
  let orchestrator: SagaOrchestrator<OrderSagaData>;
  let repository: SagaRepository;
  let mockSave: any;
  let mockUpdate: any;
  let mockFind: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    repository = new SagaRepository({} as any);
    mockSave = vi.spyOn(repository, 'save').mockResolvedValue(undefined);
    mockUpdate = vi.spyOn(repository, 'update').mockResolvedValue(undefined);
    mockFind = vi.spyOn(repository, 'findById').mockResolvedValue(null);
    
    orchestrator = new SagaOrchestrator<OrderSagaData>(
      'OrderFulfillment',
      repository
    );
  });

  describe('Saga Building', () => {
    it('should build saga with steps and transitions', () => {
      orchestrator
        .addStep('order_created', async (ctx) => {
          ctx.data.paymentId = `payment-${ctx.data.orderId}`;
          return new PaymentProcessedEvent(ctx.data.orderId, true);
        })
        .addStep('payment_processed', async (ctx) => {
          return new InventoryReservedEvent(ctx.data.orderId, ['item1', 'item2']);
        })
        .addStep('inventory_reserved', async (ctx) => {
          return new ShipmentCreatedEvent(ctx.data.orderId, 'TRACK123');
        })
        .addTransition('initial', 'OrderCreated', 'order_created')
        .addTransition('order_created', 'PaymentProcessed', 'payment_processed')
        .addTransition('payment_processed', 'InventoryReserved', 'inventory_reserved')
        .addTransition('inventory_reserved', 'ShipmentCreated', 'completed');

      const stateMachine = (orchestrator as any).stateMachine;
      expect(stateMachine.states).toHaveProperty('order_created');
      expect(stateMachine.states).toHaveProperty('payment_processed');
      expect(stateMachine.states).toHaveProperty('inventory_reserved');
      expect(stateMachine.transitions.size).toBe(4);
    });

    it('should add compensation handlers', () => {
      orchestrator
        .addStep('payment', async () => new PaymentProcessedEvent('order-1', true))
        .addCompensation('payment', async (ctx) => {
          // Refund payment
          console.log(`Refunding payment for order ${ctx.data.orderId}`);
        });

      const compensations = (orchestrator as any).compensations;
      expect(compensations.has('payment')).toBe(true);
    });
  });

  describe('Saga Execution', () => {
    beforeEach(() => {
      orchestrator
        .addStep('processing_payment', async (ctx) => {
          ctx.data.paymentId = 'pay-123';
          return new PaymentProcessedEvent(ctx.data.orderId, true);
        })
        .addStep('reserving_inventory', async (ctx) => {
          ctx.data.items = ['item1', 'item2'];
          return new InventoryReservedEvent(ctx.data.orderId, ctx.data.items);
        })
        .addTransition('initial', 'OrderCreated', 'processing_payment')
        .addTransition('processing_payment', 'PaymentProcessed', 'reserving_inventory')
        .addTransition('reserving_inventory', 'InventoryReserved', 'completed');
    });

    it('should start a new saga', async () => {
      const data: OrderSagaData = {
        orderId: 'order-123',
        amount: 1000,
      };

      const sagaId = await orchestrator.start(data, 'correlation-123');

      expect(sagaId).toBeDefined();
      expect(typeof sagaId).toBe('string');
      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
        sagaType: 'OrderFulfillment',
        currentState: expect.any(String),
        data,
      }));
    });

    it('should handle events and transition states', async () => {
      const sagaState: SagaState<OrderSagaData> = {
        id: 'saga-456',
        type: 'OrderFulfillment',
        currentState: 'initial',
        data: { orderId: 'order-456', amount: 500 },
        version: 1,
        startedAt: new Date(),
        updatedAt: new Date(),
      };

      const event = new OrderCreatedEvent('order-456', 500);
      const result = await orchestrator.handleEvent(sagaState, event);

      expect(result.currentState).toBe('processing_payment');
      expect(result.data.paymentId).toBe('pay-123');
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        currentState: 'processing_payment',
      }), expect.any(Number));
    });

    it('should complete saga when reaching final state', async () => {
      const sagaState: SagaState<OrderSagaData> = {
        id: 'saga-789',
        type: 'OrderFulfillment',
        currentState: 'reserving_inventory',
        data: { 
          orderId: 'order-789', 
          amount: 750,
          items: ['item1', 'item2']
        },
        version: 3,
        startedAt: new Date(),
        updatedAt: new Date(),
      };

      const event = new InventoryReservedEvent('order-789', ['item1', 'item2']);
      const result = await orchestrator.handleEvent(sagaState, event);

      expect(result.currentState).toBe('completed');
      expect(result.completedAt).toBeDefined();
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        currentState: 'completed',
        completedAt: expect.any(Date),
      }), expect.any(Number));
    });

    it('should handle unknown events gracefully', async () => {
      const sagaState: SagaState<OrderSagaData> = {
        id: 'saga-unknown',
        type: 'OrderFulfillment',
        currentState: 'processing_payment',
        data: { orderId: 'order-unknown', amount: 100 },
        version: 1,
        startedAt: new Date(),
        updatedAt: new Date(),
      };

      const unknownEvent = { type: 'UnknownEvent' } as DomainEvent;
      const result = await orchestrator.handleEvent(sagaState, unknownEvent);

      // Should return same state for unknown events
      expect(result.currentState).toBe('processing_payment');
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Compensation', () => {
    beforeEach(() => {
      const paymentCompensation = vi.fn().mockResolvedValue(undefined);
      const inventoryCompensation = vi.fn().mockResolvedValue(undefined);

      orchestrator
        .addStep('payment', async () => new PaymentProcessedEvent('order-1', true))
        .addStep('inventory', async () => new InventoryReservedEvent('order-1', ['item1']))
        .addCompensation('payment', paymentCompensation)
        .addCompensation('inventory', inventoryCompensation)
        .addTransition('initial', 'OrderCreated', 'payment')
        .addTransition('payment', 'PaymentProcessed', 'inventory');

      (orchestrator as any).compensationHandlers = {
        payment: paymentCompensation,
        inventory: inventoryCompensation,
      };
    });

    it('should execute compensation in reverse order', async () => {
      const sagaState: SagaState<OrderSagaData> = {
        id: 'saga-comp-1',
        type: 'OrderFulfillment',
        currentState: 'inventory',
        data: { orderId: 'order-comp', amount: 200 },
        version: 3,
        startedAt: new Date(),
        updatedAt: new Date(),
        executedSteps: ['payment', 'inventory'],
      };

      await orchestrator.compensate(sagaState);

      const compensationHandlers = (orchestrator as any).compensationHandlers;
      
      // Verify compensations were called in reverse order
      expect(compensationHandlers.inventory).toHaveBeenCalled();
      expect(compensationHandlers.payment).toHaveBeenCalled();
      
      // Check order using call order
      const inventoryCallOrder = compensationHandlers.inventory.mock.invocationCallOrder[0];
      const paymentCallOrder = compensationHandlers.payment.mock.invocationCallOrder[0];
      expect(inventoryCallOrder).toBeLessThan(paymentCallOrder);
    });

    it('should continue compensation even if one fails', async () => {
      const failingCompensation = vi.fn().mockRejectedValue(new Error('Compensation failed'));
      const successCompensation = vi.fn().mockResolvedValue(undefined);

      (orchestrator as any).compensationHandlers = {
        payment: failingCompensation,
        inventory: successCompensation,
      };

      const sagaState: SagaState<OrderSagaData> = {
        id: 'saga-comp-2',
        type: 'OrderFulfillment',
        currentState: 'failed',
        data: { orderId: 'order-fail', amount: 300 },
        version: 3,
        startedAt: new Date(),
        updatedAt: new Date(),
        executedSteps: ['payment', 'inventory'],
      };

      await orchestrator.compensate(sagaState);

      // Both compensations should be attempted
      expect(failingCompensation).toHaveBeenCalled();
      expect(successCompensation).toHaveBeenCalled();
    });

    it('should mark saga as compensated after compensation', async () => {
      const sagaState: SagaState<OrderSagaData> = {
        id: 'saga-comp-3',
        type: 'OrderFulfillment',
        currentState: 'failed',
        data: { orderId: 'order-comp-3', amount: 400 },
        version: 2,
        startedAt: new Date(),
        updatedAt: new Date(),
        executedSteps: ['payment'],
      };

      await orchestrator.compensate(sagaState);

      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        currentState: 'compensated',
      }), expect.any(Number));
    });
  });

  describe('SagaBuilder', () => {
    it('should build saga configuration fluently', () => {
      const builder = new SagaBuilder<OrderSagaData>('TestSaga');
      
      const config = builder
        .initialState('start')
        .addState('processing', {
          onEnter: async (ctx) => {
            ctx.data.orderId = 'processed';
          },
          action: async (ctx) => {
            return new OrderCreatedEvent(ctx.data.orderId, 100);
          },
        })
        .addState('completed', {
          isFinal: true,
        })
        .addTransition('start', 'OrderCreated', 'processing')
        .addTransition('processing', 'PaymentProcessed', 'completed')
        .build();

      expect(config.name).toBe('TestSaga');
      expect(config.initialState).toBe('start');
      expect(config.states).toHaveProperty('processing');
      expect(config.states).toHaveProperty('completed');
      expect(config.states.completed.isFinal).toBe(true);
      expect(config.transitions).toHaveLength(2);
    });

    it('should validate saga has initial state', () => {
      const builder = new SagaBuilder<OrderSagaData>('InvalidSaga');
      
      expect(() => builder.build()).toThrow();
    });

    it('should create executable saga from builder', () => {
      const builder = new SagaBuilder<OrderSagaData>('ExecutableSaga');
      
      builder
        .initialState('init')
        .addState('running', {
          action: async () => new OrderCreatedEvent('order-1', 100),
        })
        .addTransition('init', 'Start', 'running');

      const orchestrator = builder.createOrchestrator(repository);
      
      expect(orchestrator).toBeInstanceOf(SagaOrchestrator);
      expect((orchestrator as any).name).toBe('ExecutableSaga');
    });
  });

  describe('SagaContext', () => {
    it('should provide context utilities', () => {
      const data: OrderSagaData = { orderId: 'ctx-order', amount: 500 };
      const context = new SagaContext(
        'saga-ctx-1',
        'TestSaga',
        'processing',
        data,
        'correlation-ctx'
      );

      expect(context.sagaId).toBe('saga-ctx-1');
      expect(context.sagaType).toBe('TestSaga');
      expect(context.currentState).toBe('processing');
      expect(context.data).toEqual(data);
      expect(context.correlationId).toBe('correlation-ctx');

      // Test state update
      context.updateState('completed');
      expect(context.currentState).toBe('completed');

      // Test data mutation
      context.data.paymentId = 'pay-ctx';
      expect(context.data.paymentId).toBe('pay-ctx');
    });
  });
});