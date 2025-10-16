export interface EventMetadata {
  eventId: string;
  eventType: string;
  eventVersion: string;
  timestamp: Date;
  correlationId?: string;
  causationId?: string;
  userId?: string;
  tenantId?: string;
  source?: string;
}

export interface DomainEvent<T = any> {
  aggregateId: string;
  aggregateType: string;
  aggregateVersion: number;
  eventData: T;
  metadata: EventMetadata;
}

export interface DomainEventHandler<T = any> {
  /**
   * Get event types this handler processes
   */
  getEventTypes(): string[];
  
  /**
   * Handle the domain event
   */
  handle(event: DomainEvent<T>): Promise<void>;
  
  /**
   * Get handler priority (lower = higher priority)
   */
  getPriority(): number;
  
  /**
   * Check if handler can handle this event
   */
  canHandle(event: DomainEvent): boolean;
}

export interface EventStore {
  /**
   * Append events to the store
   */
  append(events: DomainEvent[]): Promise<void>;
  
  /**
   * Get events for an aggregate
   */
  getEvents(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]>;
  
  /**
   * Get events by type
   */
  getEventsByType(eventType: string, limit?: number, offset?: number): Promise<DomainEvent[]>;
  
  /**
   * Get events by correlation ID
   */
  getEventsByCorrelation(correlationId: string): Promise<DomainEvent[]>;
  
  /**
   * Get aggregate snapshot
   */
  getSnapshot(aggregateId: string): Promise<any | null>;
  
  /**
   * Save aggregate snapshot
   */
  saveSnapshot(aggregateId: string, snapshot: any, version: number): Promise<void>;
}

export interface EventPublisher {
  /**
   * Publish domain events
   */
  publish(events: DomainEvent | DomainEvent[]): Promise<void>;
  
  /**
   * Subscribe to events
   */
  subscribe(eventTypes: string[], handler: DomainEventHandler): void;
  
  /**
   * Unsubscribe from events
   */
  unsubscribe(handler: DomainEventHandler): void;
}