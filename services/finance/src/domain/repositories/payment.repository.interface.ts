import { Payment } from '../aggregates/payment/payment.aggregate';

/**
 * Payment Repository Interface
 *
 * Defines the contract for persisting and retrieving Payment aggregates.
 * Implementation will use EventStore for write operations (event sourcing)
 * and PostgreSQL for read operations (CQRS read model).
 *
 * Event Sourcing Pattern:
 * - save(): Appends uncommitted domain events to EventStore stream
 * - findById(): Reconstructs aggregate by replaying events from stream
 * - Stream naming: payment-{tenantId}-{paymentId}
 *
 * Multi-Tenancy:
 * - All operations scoped by tenant ID
 * - Event streams prefixed with tenant for isolation
 * - Cross-tenant access prevented at repository level
 *
 * Payment Number Generation:
 * - Format: PMT-YYYY-MM-DD-NNNNNN
 * - Sequential numbering per day
 * - Unique across all tenants for system-wide tracking
 */
export interface IPaymentRepository {
  /**
   * Persists a payment aggregate to the event store
   * Extracts uncommitted domain events and appends them to the event stream
   * Tenant ID is extracted from the aggregate itself
   * @param payment The payment aggregate to save
   */
  save(payment: Payment): Promise<void>;

  /**
   * Retrieves a payment aggregate by ID from the event store
   * Reconstructs the aggregate by replaying all events from the stream
   * @param id The payment aggregate ID
   * @param tenantId The tenant ID for multi-tenant isolation (optional, will use TenantContextService if not provided)
   * @returns The payment aggregate or null if not found
   */
  findById(id: string, tenantId?: string): Promise<Payment | null>;

  /**
   * Checks if a payment exists
   * @param id The payment aggregate ID
   * @returns True if the payment exists, false otherwise
   */
  exists(id: string): Promise<boolean>;

  /**
   * Generates the next payment number for a given date and tenant
   * Format: PMT-YYYY-MM-DD-NNNNNN
   * Example: PMT-2024-10-16-000001
   * @param date The payment date
   * @param tenantId The tenant ID for multi-tenant isolation
   * @returns The next payment number
   */
  getNextPaymentNumber(date: Date, tenantId: string): Promise<string>;
}
