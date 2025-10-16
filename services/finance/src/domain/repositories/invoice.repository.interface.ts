import { Invoice } from '../aggregates/invoice/invoice.aggregate';

/**
 * Invoice Repository Interface
 *
 * Defines the contract for persisting and retrieving Invoice aggregates.
 * Implementation will use EventStore for write operations (event sourcing)
 * and PostgreSQL for read operations (CQRS read model).
 */
export interface IInvoiceRepository {
  /**
   * Persists an invoice aggregate to the event store
   * Extracts uncommitted domain events and appends them to the event stream
   * Tenant ID is extracted from the aggregate itself
   * @param invoice The invoice aggregate to save
   */
  save(invoice: Invoice): Promise<void>;

  /**
   * Retrieves an invoice aggregate by ID from the event store
   * Reconstructs the aggregate by replaying all events from the stream
   * @param id The invoice aggregate ID
   * @param tenantId The tenant ID for multi-tenant isolation (optional, will use TenantContextService if not provided)
   * @returns The invoice aggregate or null if not found
   */
  findById(id: string, tenantId?: string): Promise<Invoice | null>;

  /**
   * Generates the next invoice number for a given fiscal year and tenant
   * Queries the event store to find the last invoice number and increments the sequence
   * @param fiscalYear The fiscal year (e.g., "2024-2025")
   * @param tenantId The tenant ID for multi-tenant isolation
   * @returns The next invoice number in format INV-YYYY-MM-DD-NNNNNN
   */
  getNextInvoiceNumber(fiscalYear: string, tenantId: string): Promise<string>;

  /**
   * Checks if an invoice exists
   * @param id The invoice aggregate ID
   * @returns True if the invoice exists, false otherwise
   */
  exists(id: string): Promise<boolean>;
}
