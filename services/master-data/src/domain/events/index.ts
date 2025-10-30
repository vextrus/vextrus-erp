/**
 * Domain Events Index
 * Export all domain events for easy importing
 */

export {
  DomainEvent,
  CustomerCreatedEvent,
  CustomerUpdatedEvent,
  CustomerCreditLimitChangedEvent,
  CustomerOutstandingBalanceUpdatedEvent,
  CustomerCreditLimitExceededEvent,
  CustomerStatusChangedEvent,
  CustomerBlacklistedEvent,
  CustomerLoyaltyPointsUpdatedEvent,
  CustomerPurchaseMadeEvent,
  CustomerPaymentReceivedEvent,
} from './customer.events';
