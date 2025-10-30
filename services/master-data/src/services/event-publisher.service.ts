import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

export enum EventType {
  // Customer Events
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
  CUSTOMER_DELETED = 'customer.deleted',
  CUSTOMER_STATUS_CHANGED = 'customer.status_changed',
  
  // Vendor Events
  VENDOR_CREATED = 'vendor.created',
  VENDOR_UPDATED = 'vendor.updated',
  VENDOR_DELETED = 'vendor.deleted',
  VENDOR_APPROVED = 'vendor.approved',
  VENDOR_BLACKLISTED = 'vendor.blacklisted',
  
  // Product Events
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
  PRODUCT_STOCK_UPDATED = 'product.stock_updated',
  PRODUCT_PRICE_UPDATED = 'product.price_updated',
  PRODUCT_LOW_STOCK = 'product.low_stock',
  
  // Account Events
  ACCOUNT_CREATED = 'account.created',
  ACCOUNT_UPDATED = 'account.updated',
  ACCOUNT_DELETED = 'account.deleted',
  ACCOUNT_BALANCE_UPDATED = 'account.balance_updated',
  ACCOUNT_RECONCILED = 'account.reconciled',
}

export interface EventPayload {
  eventType: EventType;
  aggregateId: string;
  aggregateType: string;
  tenantId: string;
  userId?: string;
  timestamp: Date;
  version: number;
  data: any;
  metadata?: {
    correlationId?: string;
    causationId?: string;
    ipAddress?: string;
    userAgent?: string;
    source?: string;
  };
}

@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  constructor(
    @Inject('KAFKA_SERVICE')
    private readonly kafkaClient: ClientKafka,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const topics = [
      this.configService.get('kafka.topics.masterDataEvents'),
      this.configService.get('kafka.topics.customerEvents'),
      this.configService.get('kafka.topics.vendorEvents'),
      this.configService.get('kafka.topics.productEvents'),
      this.configService.get('kafka.topics.accountEvents'),
    ];

    topics.forEach(topic => {
      if (topic) {
        this.kafkaClient.subscribeToResponseOf(topic);
      }
    });

    await this.kafkaClient.connect();
  }

  async publishEvent(event: EventPayload): Promise<void> {
    try {
      const topic = this.getTopicForEvent(event.eventType);
      
      const message = {
        key: event.aggregateId,
        value: JSON.stringify(event),
        headers: {
          'x-tenant-id': event.tenantId,
          'x-event-type': event.eventType,
          'x-aggregate-type': event.aggregateType,
          'x-correlation-id': event.metadata?.correlationId || '',
          'x-timestamp': event.timestamp.toISOString(),
        },
      };

      this.logger.log(`Publishing event ${event.eventType} to topic ${topic}`);
      
      await this.kafkaClient.emit(topic, message).toPromise();
      
      // Also publish to master data events topic for audit
      await this.kafkaClient.emit(
        this.configService.get('kafka.topics.masterDataEvents'),
        message
      ).toPromise();
      
      this.logger.log(`Event ${event.eventType} published successfully`);
    } catch (error) {
      this.logger.error(`Failed to publish event ${event.eventType}:`, error);
      throw error;
    }
  }

  async publishCustomerEvent(
    eventType: EventType,
    customerId: string,
    tenantId: string,
    data: any,
    userId?: string,
    metadata?: EventPayload['metadata']
  ): Promise<void> {
    const event: EventPayload = {
      eventType,
      aggregateId: customerId,
      aggregateType: 'Customer',
      tenantId,
      userId,
      timestamp: new Date(),
      version: 1,
      data,
      metadata,
    };

    await this.publishEvent(event);
  }

  async publishVendorEvent(
    eventType: EventType,
    vendorId: string,
    tenantId: string,
    data: any,
    userId?: string,
    metadata?: EventPayload['metadata']
  ): Promise<void> {
    const event: EventPayload = {
      eventType,
      aggregateId: vendorId,
      aggregateType: 'Vendor',
      tenantId,
      userId,
      timestamp: new Date(),
      version: 1,
      data,
      metadata,
    };

    await this.publishEvent(event);
  }

  async publishProductEvent(
    eventType: EventType,
    productId: string,
    tenantId: string,
    data: any,
    userId?: string,
    metadata?: EventPayload['metadata']
  ): Promise<void> {
    const event: EventPayload = {
      eventType,
      aggregateId: productId,
      aggregateType: 'Product',
      tenantId,
      userId,
      timestamp: new Date(),
      version: 1,
      data,
      metadata,
    };

    await this.publishEvent(event);
  }

  async publishAccountEvent(
    eventType: EventType,
    accountId: string,
    tenantId: string,
    data: any,
    userId?: string,
    metadata?: EventPayload['metadata']
  ): Promise<void> {
    const event: EventPayload = {
      eventType,
      aggregateId: accountId,
      aggregateType: 'ChartOfAccount',
      tenantId,
      userId,
      timestamp: new Date(),
      version: 1,
      data,
      metadata,
    };

    await this.publishEvent(event);
  }

  async publishBulkEvents(events: EventPayload[]): Promise<void> {
    try {
      const promises = events.map(event => this.publishEvent(event));
      await Promise.all(promises);
      this.logger.log(`Published ${events.length} events successfully`);
    } catch (error) {
      this.logger.error('Failed to publish bulk events:', error);
      throw error;
    }
  }

  private getTopicForEvent(eventType: EventType): string {
    if (eventType.startsWith('customer.')) {
      return this.configService.get('kafka.topics.customerEvents');
    } else if (eventType.startsWith('vendor.')) {
      return this.configService.get('kafka.topics.vendorEvents');
    } else if (eventType.startsWith('product.')) {
      return this.configService.get('kafka.topics.productEvents');
    } else if (eventType.startsWith('account.')) {
      return this.configService.get('kafka.topics.accountEvents');
    } else {
      return this.configService.get('kafka.topics.masterDataEvents');
    }
  }

  async publishStockAlert(
    productId: string,
    tenantId: string,
    currentStock: number,
    minimumStock: number,
    reorderLevel: number
  ): Promise<void> {
    const event: EventPayload = {
      eventType: EventType.PRODUCT_LOW_STOCK,
      aggregateId: productId,
      aggregateType: 'Product',
      tenantId,
      timestamp: new Date(),
      version: 1,
      data: {
        productId,
        currentStock,
        minimumStock,
        reorderLevel,
        alertType: currentStock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
        severity: currentStock === 0 ? 'CRITICAL' : 'WARNING',
      },
    };

    await this.publishEvent(event);
  }

  async publishVendorApproval(
    vendorId: string,
    tenantId: string,
    approvedBy: string,
    approvalDetails: any
  ): Promise<void> {
    const event: EventPayload = {
      eventType: EventType.VENDOR_APPROVED,
      aggregateId: vendorId,
      aggregateType: 'Vendor',
      tenantId,
      userId: approvedBy,
      timestamp: new Date(),
      version: 1,
      data: {
        vendorId,
        approvedBy,
        approvedAt: new Date(),
        ...approvalDetails,
      },
      metadata: {
        source: 'master-data-service',
      },
    };

    await this.publishEvent(event);
  }

  async publishAccountBalanceUpdate(
    accountId: string,
    tenantId: string,
    oldBalance: number,
    newBalance: number,
    transactionType: 'debit' | 'credit',
    amount: number,
    userId?: string
  ): Promise<void> {
    const event: EventPayload = {
      eventType: EventType.ACCOUNT_BALANCE_UPDATED,
      aggregateId: accountId,
      aggregateType: 'ChartOfAccount',
      tenantId,
      userId,
      timestamp: new Date(),
      version: 1,
      data: {
        accountId,
        oldBalance,
        newBalance,
        transactionType,
        amount,
        balanceChange: newBalance - oldBalance,
      },
      metadata: {
        source: 'master-data-service',
      },
    };

    await this.publishEvent(event);
  }
}