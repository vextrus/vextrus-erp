import { SagaBuilder, SagaOrchestrator, SagaContext } from '../../saga/saga-state-machine';
import { EventStoreService } from '../../event-sourcing/event-store.service';
import { OrderAggregate } from './order.aggregate';
import type { OrderItem, ShippingAddress } from './order.aggregate';
import type { DomainEvent } from '../../event-sourcing/types';
import { Trace, Metric } from '@vextrus/utils';
import { v4 as uuid } from 'uuid';

/**
 * Order fulfillment saga data
 */
export interface OrderFulfillmentData {
  orderId: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentId?: string;
  reservationId?: string;
  shipmentId?: string;
  error?: string;
}

/**
 * Order fulfillment saga orchestrator
 */
export class OrderFulfillmentSaga {
  private readonly saga: SagaOrchestrator<OrderFulfillmentData>;
  
  constructor(
    private readonly eventStore: EventStoreService,
    private readonly paymentService: IPaymentService,
    private readonly inventoryService: IInventoryService,
    private readonly shippingService: IShippingService
  ) {
    this.saga = this.buildSaga();
  }

  /**
   * Start order fulfillment saga
   */
  @Metric('saga.order-fulfillment.start')
  async startFulfillment(
    orderId: string,
    customerId: string,
    items: OrderItem[],
    totalAmount: number,
    shippingAddress: ShippingAddress
  ): Promise<string> {
    const sagaData: OrderFulfillmentData = {
      orderId,
      customerId,
      items,
      totalAmount,
      shippingAddress
    };

    const correlationId = uuid();
    const sagaState = await this.saga.start(sagaData, correlationId);
    
    return sagaState.id;
  }

  /**
   * Build the saga state machine
   */
  private buildSaga(): SagaOrchestrator<OrderFulfillmentData> {
    return new SagaBuilder<OrderFulfillmentData>()
      .withType('OrderFulfillment')
      .withInitialState('validatingOrder')
      
      // State: Validating Order
      .addState('validatingOrder', {
        invoke: {
          src: async (context) => {
            await this.validateOrder(context);
          },
          onDone: 'reservingInventory',
          onError: 'orderFailed'
        }
      })
      
      // State: Reserving Inventory
      .addState('reservingInventory', {
        invoke: {
          src: async (context) => {
            await this.reserveInventory(context);
          },
          onDone: 'processingPayment',
          onError: 'releasingInventory'
        },
        compensate: async (context) => {
          await this.releaseInventory(context);
        }
      })
      
      // State: Processing Payment
      .addState('processingPayment', {
        invoke: {
          src: async (context) => {
            await this.processPayment(context);
          },
          onDone: 'creatingShipment',
          onError: 'refundingPayment'
        },
        compensate: async (context) => {
          await this.refundPayment(context);
        }
      })
      
      // State: Creating Shipment
      .addState('creatingShipment', {
        invoke: {
          src: async (context) => {
            await this.createShipment(context);
          },
          onDone: 'orderCompleted',
          onError: 'cancellingShipment'
        },
        compensate: async (context) => {
          await this.cancelShipment(context);
        }
      })
      
      // Compensation States
      .addState('releasingInventory', {
        invoke: {
          src: async (context) => {
            await this.releaseInventory(context);
          },
          onDone: 'orderFailed'
        }
      })
      
      .addState('refundingPayment', {
        invoke: {
          src: async (context) => {
            await this.refundPayment(context);
            await this.releaseInventory(context);
          },
          onDone: 'orderFailed'
        }
      })
      
      .addState('cancellingShipment', {
        invoke: {
          src: async (context) => {
            await this.cancelShipment(context);
            await this.refundPayment(context);
            await this.releaseInventory(context);
          },
          onDone: 'orderFailed'
        }
      })
      
      // Final States
      .addState('orderCompleted', {
        type: 'final',
        invoke: {
          src: async (context) => {
            await this.completeOrder(context);
          }
        }
      })
      
      .addState('orderFailed', {
        type: 'final',
        invoke: {
          src: async (context) => {
            await this.failOrder(context);
          }
        }
      })
      
      .build();
  }

  /**
   * Validate order
   */
  @Trace()
  private async validateOrder(context: SagaContext<OrderFulfillmentData>): Promise<void> {
    const { orderId, items, totalAmount } = context.data;
    
    // Validate order items
    if (items.length === 0) {
      throw new Error('Order has no items');
    }
    
    // Validate total amount
    if (totalAmount <= 0) {
      throw new Error('Invalid order total');
    }
    
    // Emit OrderValidated event
    await this.emitEvent('OrderValidated', {
      orderId,
      sagaId: context.sagaId,
      correlationId: context.correlationId
    });
  }

  /**
   * Reserve inventory
   */
  @Trace()
  @Metric('saga.order-fulfillment.reserve-inventory')
  private async reserveInventory(context: SagaContext<OrderFulfillmentData>): Promise<void> {
    const { orderId, items } = context.data;
    
    try {
      const reservationId = await this.inventoryService.reserveItems(items);
      context.data.reservationId = reservationId;
      
      // Update order aggregate
      const aggregate = await this.loadOrderAggregate(orderId);
      aggregate.handle({
        type: 'ReserveInventory',
        data: { reservationId },
        metadata: { correlationId: context.correlationId }
      });
      
      await this.saveAggregate(aggregate);
      
      // Emit event
      await this.emitEvent('InventoryReserved', {
        orderId,
        reservationId,
        items,
        sagaId: context.sagaId,
        correlationId: context.correlationId
      });
    } catch (error) {
      context.data.error = `Inventory reservation failed: ${error}`;
      throw error;
    }
  }

  /**
   * Release inventory
   */
  @Trace()
  private async releaseInventory(context: SagaContext<OrderFulfillmentData>): Promise<void> {
    const { orderId, reservationId } = context.data;
    
    if (!reservationId) {
      return; // Nothing to release
    }
    
    try {
      await this.inventoryService.releaseReservation(reservationId);
      
      // Update order aggregate
      const aggregate = await this.loadOrderAggregate(orderId);
      aggregate.handle({
        type: 'ReleaseInventory',
        data: {},
        metadata: { correlationId: context.correlationId }
      });
      
      await this.saveAggregate(aggregate);
      
      // Emit event
      await this.emitEvent('InventoryReleased', {
        orderId,
        reservationId,
        sagaId: context.sagaId,
        correlationId: context.correlationId
      });
    } catch (error) {
      console.error('Failed to release inventory:', error);
    }
  }

  /**
   * Process payment
   */
  @Trace()
  @Metric('saga.order-fulfillment.process-payment')
  private async processPayment(context: SagaContext<OrderFulfillmentData>): Promise<void> {
    const { orderId, customerId, totalAmount } = context.data;
    
    try {
      const paymentId = await this.paymentService.processPayment(
        customerId,
        totalAmount
      );
      
      context.data.paymentId = paymentId;
      
      // Update order aggregate
      const aggregate = await this.loadOrderAggregate(orderId);
      aggregate.handle({
        type: 'ProcessPayment',
        data: { paymentId, success: true },
        metadata: { correlationId: context.correlationId }
      });
      
      await this.saveAggregate(aggregate);
      
      // Emit event
      await this.emitEvent('PaymentProcessed', {
        orderId,
        paymentId,
        amount: totalAmount,
        sagaId: context.sagaId,
        correlationId: context.correlationId
      });
    } catch (error) {
      context.data.error = `Payment failed: ${error}`;
      
      // Update order with payment failure
      const aggregate = await this.loadOrderAggregate(orderId);
      aggregate.handle({
        type: 'ProcessPayment',
        data: { success: false, error: String(error) },
        metadata: { correlationId: context.correlationId }
      });
      
      await this.saveAggregate(aggregate);
      
      throw error;
    }
  }

  /**
   * Refund payment
   */
  @Trace()
  private async refundPayment(context: SagaContext<OrderFulfillmentData>): Promise<void> {
    const { orderId, paymentId } = context.data;
    
    if (!paymentId) {
      return; // Nothing to refund
    }
    
    try {
      await this.paymentService.refundPayment(paymentId);
      
      // Emit event
      await this.emitEvent('PaymentRefunded', {
        orderId,
        paymentId,
        sagaId: context.sagaId,
        correlationId: context.correlationId
      });
    } catch (error) {
      console.error('Failed to refund payment:', error);
    }
  }

  /**
   * Create shipment
   */
  @Trace()
  @Metric('saga.order-fulfillment.create-shipment')
  private async createShipment(context: SagaContext<OrderFulfillmentData>): Promise<void> {
    const { orderId, items, shippingAddress } = context.data;
    
    try {
      const shipmentId = await this.shippingService.createShipment(
        items,
        shippingAddress
      );
      
      context.data.shipmentId = shipmentId;
      
      // Update order aggregate
      const aggregate = await this.loadOrderAggregate(orderId);
      aggregate.handle({
        type: 'CreateShipment',
        data: { shipmentId },
        metadata: { correlationId: context.correlationId }
      });
      
      await this.saveAggregate(aggregate);
      
      // Emit event
      await this.emitEvent('ShipmentCreated', {
        orderId,
        shipmentId,
        shippingAddress,
        sagaId: context.sagaId,
        correlationId: context.correlationId
      });
    } catch (error) {
      context.data.error = `Shipment creation failed: ${error}`;
      throw error;
    }
  }

  /**
   * Cancel shipment
   */
  @Trace()
  private async cancelShipment(context: SagaContext<OrderFulfillmentData>): Promise<void> {
    const { shipmentId } = context.data;
    
    if (!shipmentId) {
      return; // Nothing to cancel
    }
    
    try {
      await this.shippingService.cancelShipment(shipmentId);
      
      // Emit event
      await this.emitEvent('ShipmentCancelled', {
        shipmentId,
        sagaId: context.sagaId,
        correlationId: context.correlationId
      });
    } catch (error) {
      console.error('Failed to cancel shipment:', error);
    }
  }

  /**
   * Complete order
   */
  @Trace()
  private async completeOrder(context: SagaContext<OrderFulfillmentData>): Promise<void> {
    const { orderId } = context.data;
    
    // Update order aggregate
    const aggregate = await this.loadOrderAggregate(orderId);
    aggregate.handle({
      type: 'CompleteOrder',
      data: {},
      metadata: { correlationId: context.correlationId }
    });
    
    await this.saveAggregate(aggregate);
    
    // Emit event
    await this.emitEvent('OrderCompleted', {
      orderId,
      sagaId: context.sagaId,
      correlationId: context.correlationId,
      completedAt: new Date().toISOString()
    });
  }

  /**
   * Fail order
   */
  @Trace()
  private async failOrder(context: SagaContext<OrderFulfillmentData>): Promise<void> {
    const { orderId, error } = context.data;
    
    // Update order aggregate
    const aggregate = await this.loadOrderAggregate(orderId);
    aggregate.handle({
      type: 'CancelOrder',
      data: { reason: error || 'Order fulfillment failed' },
      metadata: { correlationId: context.correlationId }
    });
    
    await this.saveAggregate(aggregate);
    
    // Emit event
    await this.emitEvent('OrderFailed', {
      orderId,
      sagaId: context.sagaId,
      correlationId: context.correlationId,
      error,
      failedAt: new Date().toISOString()
    });
  }

  /**
   * Load order aggregate
   */
  private async loadOrderAggregate(orderId: string): Promise<OrderAggregate> {
    const { state, version } = await this.eventStore.aggregateStream(
      orderId,
      (state, event) => {
        const aggregate = new OrderAggregate(orderId, state);
        return (aggregate as any).when(state, event);
      },
      new OrderAggregate(orderId, {
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customerId: '',
        items: [],
        status: 'DRAFT',
        totalAmount: {} as any, // Will be replaced with proper Money implementation
        paymentStatus: 'PENDING',
        fulfillmentStatus: 'PENDING',
        shippingAddress: null
      }).getState()
    );
    
    const aggregate = new OrderAggregate(orderId, state);
    aggregate['version'] = version;
    return aggregate;
  }

  /**
   * Save aggregate events
   */
  private async saveAggregate(aggregate: OrderAggregate): Promise<void> {
    const events = aggregate.getUncommittedEvents();
    if (events.length > 0) {
      await this.eventStore.appendToStream(
        aggregate.id,
        events,
        aggregate.getVersion() - events.length
      );
      aggregate.markEventsAsCommitted();
    }
  }

  /**
   * Emit domain event
   */
  private async emitEvent(type: string, data: Record<string, unknown>): Promise<void> {
    const event: DomainEvent = {
      type,
      data,
      metadata: {
        timestamp: Date.now(),
        source: 'OrderFulfillmentSaga'
      }
    };
    
    // In a real implementation, this would publish to event bus
    console.log('Emitting event:', event);
  }
}

/**
 * External service interfaces
 */
export interface IPaymentService {
  processPayment(customerId: string, amount: number): Promise<string>;
  refundPayment(paymentId: string): Promise<void>;
}

export interface IInventoryService {
  reserveItems(items: OrderItem[]): Promise<string>;
  releaseReservation(reservationId: string): Promise<void>;
}

export interface IShippingService {
  createShipment(items: OrderItem[], address: ShippingAddress): Promise<string>;
  cancelShipment(shipmentId: string): Promise<void>;
}