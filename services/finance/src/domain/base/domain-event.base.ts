import { v4 as uuidv4 } from 'uuid';

export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly aggregateId: string;
  public readonly eventType: string;
  public readonly eventVersion: number;
  public readonly timestamp: Date;
  public readonly tenantId: string;
  public readonly userId?: string;
  public readonly correlationId?: string;
  public readonly payload: any;

  constructor(
    aggregateId: string,
    eventType: string,
    payload: any,
    tenantId: string,
    userId?: string,
    correlationId?: string,
  ) {
    this.eventId = uuidv4();
    this.aggregateId = aggregateId;
    this.eventType = eventType;
    this.eventVersion = 1;
    this.timestamp = new Date();
    this.tenantId = tenantId;
    this.userId = userId;
    this.correlationId = correlationId || uuidv4();
    this.payload = payload;
  }
}