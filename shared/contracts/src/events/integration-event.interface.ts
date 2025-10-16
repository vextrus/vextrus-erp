export interface IntegrationEventMetadata {
  eventId: string;
  eventName: string;
  eventVersion: string;
  occurredAt: Date;
  correlationId: string;
  causationId?: string;
  publishedBy: string;
  schemaVersion: string;
  retryCount?: number;
  headers?: Record<string, string>;
}

export interface IntegrationEvent<T = any> {
  id: string;
  type: string;
  data: T;
  metadata: IntegrationEventMetadata;
}

export interface IntegrationEventHandler<T = any> {
  /**
   * Get event type this handler processes
   */
  getEventType(): string;
  
  /**
   * Handle the integration event
   */
  handle(event: IntegrationEvent<T>): Promise<void>;
  
  /**
   * Handle event processing error
   */
  handleError(event: IntegrationEvent<T>, error: Error): Promise<void>;
  
  /**
   * Get retry policy
   */
  getRetryPolicy(): RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
  retryableErrors?: string[];
}

export interface EventBus {
  /**
   * Publish integration event
   */
  publish<T>(event: IntegrationEvent<T>): Promise<void>;
  
  /**
   * Publish multiple events
   */
  publishBatch<T>(events: IntegrationEvent<T>[]): Promise<void>;
  
  /**
   * Subscribe to event type
   */
  subscribe<T>(eventType: string, handler: IntegrationEventHandler<T>): void;
  
  /**
   * Unsubscribe from event type
   */
  unsubscribe(eventType: string, handler: IntegrationEventHandler): void;
  
  /**
   * Start consuming events
   */
  start(): Promise<void>;
  
  /**
   * Stop consuming events
   */
  stop(): Promise<void>;
}

export interface EventOutbox {
  /**
   * Add event to outbox
   */
  add(event: IntegrationEvent): Promise<void>;
  
  /**
   * Get pending events
   */
  getPending(limit?: number): Promise<IntegrationEvent[]>;
  
  /**
   * Mark event as published
   */
  markAsPublished(eventId: string): Promise<void>;
  
  /**
   * Mark event as failed
   */
  markAsFailed(eventId: string, error: string): Promise<void>;
  
  /**
   * Clean old events
   */
  cleanOld(olderThanDays: number): Promise<number>;
}