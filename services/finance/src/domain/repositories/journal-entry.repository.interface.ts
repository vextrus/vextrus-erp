import { JournalEntry, JournalType } from '../aggregates/journal/journal-entry.aggregate';

/**
 * Journal Entry Repository Interface
 *
 * Defines the contract for persisting and retrieving JournalEntry aggregates.
 * Implementation will use EventStore for write operations (event sourcing)
 * and PostgreSQL for read operations (CQRS read model).
 *
 * Event Sourcing Pattern:
 * - save(): Appends uncommitted domain events to EventStore stream
 * - findById(): Reconstructs aggregate by replaying events from stream
 * - Stream naming: journal-{tenantId}-{journalId}
 *
 * Multi-Tenancy:
 * - All operations scoped by tenant ID
 * - Event streams prefixed with tenant for isolation
 * - Cross-tenant access prevented at repository level
 *
 * Journal Number Generation:
 * - Format: {TYPE}-YYYY-MM-NNNNNN
 * - Examples: GJ-2024-10-000001, SJ-2024-10-000002
 * - Sequential numbering per day and type
 * - Unique across all tenants for system-wide tracking
 */
export interface IJournalEntryRepository {
  /**
   * Persists a journal entry aggregate to the event store
   * Extracts uncommitted domain events and appends them to the event stream
   * Tenant ID is extracted from the aggregate itself
   * @param journal The journal entry aggregate to save
   */
  save(journal: JournalEntry): Promise<void>;

  /**
   * Retrieves a journal entry aggregate by ID from the event store
   * Reconstructs the aggregate by replaying all events from the stream
   * @param id The journal entry aggregate ID
   * @param tenantId The tenant ID for multi-tenant isolation (optional, will use TenantContextService if not provided)
   * @returns The journal entry aggregate or null if not found
   */
  findById(id: string, tenantId?: string): Promise<JournalEntry | null>;

  /**
   * Checks if a journal entry exists
   * @param id The journal entry aggregate ID
   * @returns True if the journal exists, false otherwise
   */
  exists(id: string): Promise<boolean>;

  /**
   * Generates the next journal number for a given date, type, and tenant
   * Format: {TYPE}-YYYY-MM-NNNNNN
   * Examples:
   * - GJ-2024-10-000001 (General Journal)
   * - SJ-2024-10-000002 (Sales Journal)
   * - PJ-2024-10-000003 (Purchase Journal)
   * - CR-2024-10-000004 (Cash Receipt)
   * - CP-2024-10-000005 (Cash Payment)
   * - AJ-2024-10-000006 (Adjustment Journal)
   * - RJ-2024-10-000007 (Reversing Journal)
   * - CJ-2024-10-000008 (Closing Journal)
   * - OJ-2024-10-000009 (Opening Journal)
   *
   * @param date The journal date
   * @param type The journal type (GENERAL, SALES, PURCHASE, etc.)
   * @param tenantId The tenant ID for multi-tenant isolation
   * @returns The next journal number
   */
  getNextJournalNumber(date: Date, type: JournalType, tenantId: string): Promise<string>;
}
