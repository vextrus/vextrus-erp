import { Event as EmmettEvent, Command as EmmettCommand } from '@event-driven-io/emmett';

/**
 * Base event type extending Emmett's Event
 */
export type DomainEvent<
  TType extends string = string,
  TData extends Record<string, unknown> = Record<string, unknown>,
  TMetadata extends Record<string, unknown> = Record<string, unknown>
> = EmmettEvent<TType, TData, TMetadata & {
  correlationId?: string;
  causationId?: string;
  userId?: string;
  timestamp?: number;
}>;

/**
 * Base command type extending Emmett's Command
 */
export type DomainCommand<
  TType extends string = string,
  TData extends Record<string, unknown> = Record<string, unknown>,
  TMetadata extends Record<string, unknown> = Record<string, unknown>
> = EmmettCommand<TType, TData, TMetadata & {
  correlationId?: string;
  userId?: string;
  idempotencyKey?: string;
}>;

/**
 * Aggregate state interface
 */
export interface AggregateState {
  version: number;
  updatedAt: Date;
  createdAt: Date;
}

/**
 * Saga state for orchestration
 */
export interface SagaState<TData = unknown> {
  id?: string; // Legacy field, use sagaId instead
  sagaId: string; // Primary ID field
  sagaType: string;
  type?: string; // Alias for sagaType for compatibility
  currentState: string;
  data: TData;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'COMPENSATED' | 'STARTED'; // Added status field
  version: number;
  correlationId: string;
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  error?: string | null; // Added error field
  retryCount?: number; // Made optional
  executedSteps?: string[]; // Track executed steps for compensation
  completedSteps?: string[]; // Added completedSteps field
  compensatedSteps?: string[]; // Added compensatedSteps field
}

/**
 * Outbox event for reliable messaging
 */
export interface OutboxEvent {
  id?: bigint;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  status: 'PENDING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED' | 'DEAD_LETTER';
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  publishedAt?: Date;
  nextRetryAt?: Date;
  errorMessage?: string;
}

/**
 * Event stream metadata
 */
export interface EventStream {
  streamId: string;
  version: number;
  events: DomainEvent[];
  snapshot?: {
    version: number;
    data: unknown;
    createdAt: Date;
  };
}

/**
 * Command handler result
 */
export interface CommandResult<T = unknown> {
  success: boolean;
  data?: T;
  events?: DomainEvent[];
  error?: Error;
  correlationId: string;
}

/**
 * Query result
 */
export interface QueryResult<T = unknown> {
  data: T;
  metadata?: {
    totalCount?: number;
    pageSize?: number;
    pageNumber?: number;
    timestamp?: Date;
  };
}

/**
 * Saga step definition
 */
export interface SagaStep<TData = unknown> {
  name: string;
  execute: (data: TData) => Promise<void>;
  compensate?: (data: TData) => Promise<void>;
  timeout?: number;
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
    maxBackoffMs?: number;
  };
}

/**
 * Projection definition for read models
 */
export interface Projection<TState = unknown> {
  name: string;
  initialState: TState;
  when: {
    [eventType: string]: (state: TState, event: DomainEvent) => TState;
  };
}

/**
 * Event store options
 */
export interface EventStoreOptions {
  connectionString?: string;
  poolSize?: number;
  snapshotFrequency?: number;
  enableSnapshots?: boolean;
  enableOutbox?: boolean;
}