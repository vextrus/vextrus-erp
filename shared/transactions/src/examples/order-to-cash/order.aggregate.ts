import { AggregateRoot } from '../../event-sourcing/aggregate.base';
import type { DomainEvent, DomainCommand, AggregateState } from '../../event-sourcing/types';
import { Money } from '../../value-objects/money';

/**
 * Order aggregate for Order-to-Cash workflow
 */
export class OrderAggregate extends AggregateRoot<OrderState> {
  /**
   * Create a new order
   */
  static create(
    orderId: string,
    customerId: string,
    items: OrderItem[]
  ): OrderAggregate {
    const aggregate = new OrderAggregate(orderId, {
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      customerId: '',
      items: [],
      status: 'DRAFT',
      totalAmount: Money.zero('BDT'),
      paymentStatus: 'PENDING',
      fulfillmentStatus: 'PENDING',
      shippingAddress: null
    });

    aggregate.raiseEvent('OrderCreated', {
      orderId,
      customerId,
      items,
      totalAmount: aggregate.calculateTotal(items).toJSON()
    });

    return aggregate;
  }

  /**
   * Handle state transitions based on events
   */
  protected when(state: OrderState, event: DomainEvent): OrderState {
    switch (event.type) {
      case 'OrderCreated':
        return {
          ...state,
          customerId: event.data.customerId as string,
          items: event.data.items as OrderItem[],
          status: 'PENDING',
          totalAmount: Money.fromJSON(event.data.totalAmount as any)
        };

      case 'OrderConfirmed':
        return {
          ...state,
          status: 'CONFIRMED',
          confirmedAt: new Date(event.data.confirmedAt as string)
        };

      case 'PaymentProcessed':
        return {
          ...state,
          paymentStatus: 'COMPLETED',
          paymentId: event.data.paymentId as string,
          paidAt: new Date(event.data.paidAt as string)
        };

      case 'PaymentFailed':
        return {
          ...state,
          paymentStatus: 'FAILED',
          paymentError: event.data.error as string
        };

      case 'InventoryReserved':
        return {
          ...state,
          fulfillmentStatus: 'RESERVED',
          reservationId: event.data.reservationId as string
        };

      case 'InventoryReleased':
        return {
          ...state,
          fulfillmentStatus: 'PENDING',
          reservationId: undefined
        };

      case 'ShipmentCreated':
        return {
          ...state,
          fulfillmentStatus: 'SHIPPED',
          shipmentId: event.data.shipmentId as string,
          shippedAt: new Date(event.data.shippedAt as string)
        };

      case 'OrderCompleted':
        return {
          ...state,
          status: 'COMPLETED',
          completedAt: new Date(event.data.completedAt as string)
        };

      case 'OrderCancelled':
        return {
          ...state,
          status: 'CANCELLED',
          cancelledAt: new Date(event.data.cancelledAt as string),
          cancellationReason: event.data.reason as string
        };

      default:
        return state;
    }
  }

  /**
   * Handle commands
   */
  handle(command: DomainCommand): void {
    switch (command.type) {
      case 'ConfirmOrder':
        this.confirmOrder(command.data.shippingAddress as ShippingAddress);
        break;

      case 'ProcessPayment':
        this.processPayment(
          command.data.paymentId as string,
          command.data.success as boolean,
          command.data.error as string | undefined
        );
        break;

      case 'ReserveInventory':
        this.reserveInventory(command.data.reservationId as string);
        break;

      case 'ReleaseInventory':
        this.releaseInventory();
        break;

      case 'CreateShipment':
        this.createShipment(command.data.shipmentId as string);
        break;

      case 'CompleteOrder':
        this.completeOrder();
        break;

      case 'CancelOrder':
        this.cancelOrder(command.data.reason as string);
        break;

      default:
        throw new Error(`Unknown command: ${command.type}`);
    }
  }

  /**
   * Confirm the order
   */
  private confirmOrder(shippingAddress: ShippingAddress): void {
    if (this.state.status !== 'PENDING') {
      throw new Error('Order can only be confirmed from PENDING status');
    }

    if (this.state.items.length === 0) {
      throw new Error('Cannot confirm order with no items');
    }

    this.raiseEvent('OrderConfirmed', {
      orderId: this.id,
      shippingAddress,
      confirmedAt: new Date().toISOString()
    });
  }

  /**
   * Process payment result
   */
  private processPayment(paymentId: string, success: boolean, error?: string): void {
    if (this.state.status !== 'CONFIRMED') {
      throw new Error('Payment can only be processed for confirmed orders');
    }

    if (this.state.paymentStatus === 'COMPLETED') {
      return; // Idempotent
    }

    if (success) {
      this.raiseEvent('PaymentProcessed', {
        orderId: this.id,
        paymentId,
        amount: this.state.totalAmount.toJSON(),
        paidAt: new Date().toISOString()
      });
    } else {
      this.raiseEvent('PaymentFailed', {
        orderId: this.id,
        error: error || 'Payment processing failed',
        failedAt: new Date().toISOString()
      });
    }
  }

  /**
   * Reserve inventory
   */
  private reserveInventory(reservationId: string): void {
    if (this.state.paymentStatus !== 'COMPLETED') {
      throw new Error('Inventory can only be reserved after payment');
    }

    if (this.state.fulfillmentStatus === 'RESERVED') {
      return; // Idempotent
    }

    this.raiseEvent('InventoryReserved', {
      orderId: this.id,
      reservationId,
      items: this.state.items,
      reservedAt: new Date().toISOString()
    });
  }

  /**
   * Release inventory reservation
   */
  private releaseInventory(): void {
    if (this.state.fulfillmentStatus !== 'RESERVED') {
      return; // Nothing to release
    }

    this.raiseEvent('InventoryReleased', {
      orderId: this.id,
      reservationId: this.state.reservationId,
      releasedAt: new Date().toISOString()
    });
  }

  /**
   * Create shipment
   */
  private createShipment(shipmentId: string): void {
    if (this.state.fulfillmentStatus !== 'RESERVED') {
      throw new Error('Shipment can only be created after inventory reservation');
    }

    this.raiseEvent('ShipmentCreated', {
      orderId: this.id,
      shipmentId,
      shippingAddress: this.state.shippingAddress,
      items: this.state.items,
      shippedAt: new Date().toISOString()
    });
  }

  /**
   * Complete the order
   */
  private completeOrder(): void {
    if (this.state.fulfillmentStatus !== 'SHIPPED') {
      throw new Error('Order can only be completed after shipment');
    }

    this.raiseEvent('OrderCompleted', {
      orderId: this.id,
      completedAt: new Date().toISOString()
    });
  }

  /**
   * Cancel the order
   */
  private cancelOrder(reason: string): void {
    if (this.state.status === 'COMPLETED' || this.state.status === 'CANCELLED') {
      throw new Error('Cannot cancel completed or already cancelled order');
    }

    this.raiseEvent('OrderCancelled', {
      orderId: this.id,
      reason,
      cancelledAt: new Date().toISOString(),
      requiresRefund: this.state.paymentStatus === 'COMPLETED'
    });
  }

  /**
   * Calculate order total
   */
  private calculateTotal(items: OrderItem[]): Money {
    return items.reduce(
      (total, item) => total.add(Money.fromAmount(item.price * item.quantity, 'BDT')),
      Money.zero('BDT')
    );
  }

  /**
   * Validate aggregate invariants
   */
  protected validateInvariants(): void {
    if (!this.state.customerId) {
      throw new Error('Order must have a customer');
    }

    if (this.state.items.length === 0 && this.state.status !== 'DRAFT') {
      throw new Error('Active order must have at least one item');
    }

    if (this.state.totalAmount.isNegative()) {
      throw new Error('Order total cannot be negative');
    }
  }
}

/**
 * Order state
 */
export interface OrderState extends AggregateState {
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: Money;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  paidAt?: Date;
  paymentError?: string;
  fulfillmentStatus: FulfillmentStatus;
  reservationId?: string;
  shipmentId?: string;
  shippedAt?: Date;
  shippingAddress: ShippingAddress | null;
  confirmedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

/**
 * Order item
 */
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  sku?: string;
}

/**
 * Shipping address
 */
export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

/**
 * Order status
 */
export type OrderStatus = 
  | 'DRAFT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED';

/**
 * Payment status
 */
export type PaymentStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED';

/**
 * Fulfillment status
 */
export type FulfillmentStatus = 
  | 'PENDING'
  | 'RESERVED'
  | 'PICKING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED';