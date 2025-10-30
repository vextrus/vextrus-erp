/**
 * @vextrus/distributed-transactions
 * Distributed transactions foundation with saga orchestration, event sourcing, CQRS, and outbox pattern
 */

// Event Sourcing
export * from './event-sourcing/types';
export { EventStoreService } from './event-sourcing/event-store.service';
export { AggregateRoot } from './event-sourcing/aggregate.base';

// Saga Orchestration
export {
  SagaOrchestrator,
  SagaBuilder,
  StateMachine,
  SagaContext,
  createOrderSaga
} from './saga/saga-state-machine';
export { SagaRepository } from './saga/saga-repository';

// Patterns
export {
  OutboxService,
  MessagePublisher,
  KafkaMessagePublisher,
  RedisMessagePublisher
} from './patterns/outbox.service';
export {
  IdempotencyService,
  IdempotencyOptions,
  IdempotencyResult,
  Idempotent
} from './patterns/idempotency.middleware';

// Value Objects
export { Money } from './value-objects/money';

// CQRS
export {
  ICommand,
  ICommandHandler,
  CommandMetadata,
  CommandHandlerMetadata
} from './cqrs/command.interface';
export {
  IQuery,
  IQueryHandler,
  QueryMetadata,
  QueryHandlerMetadata
} from './cqrs/query.interface';
export { CommandBus } from './cqrs/command-bus';
export { QueryBus } from './cqrs/query-bus';
export {
  CommandHandler,
  QueryHandler,
  Command,
  Query,
  EventHandler,
  Transactional,
  Retry,
  Cache
} from './cqrs/decorators';

// Order-to-Cash Example
export {
  OrderAggregate,
  OrderState,
  OrderItem,
  ShippingAddress,
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus
} from './examples/order-to-cash/order.aggregate';
export {
  OrderFulfillmentSaga,
  OrderFulfillmentData,
  IPaymentService,
  IInventoryService,
  IShippingService
} from './examples/order-to-cash/order-fulfillment.saga';

// Re-export common types
export type {
  DomainEvent,
  DomainCommand,
  AggregateState,
  SagaState,
  OutboxEvent,
  EventStream,
  CommandResult,
  QueryResult,
  SagaStep,
  Projection,
  EventStoreOptions
} from './event-sourcing/types';