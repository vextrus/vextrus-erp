import { ChartOfAccount } from '../aggregates/chart-of-account/chart-of-account.aggregate';

/**
 * Chart of Account Repository Interface
 *
 * Defines the contract for persisting and retrieving ChartOfAccount aggregates.
 * Implementation will use EventStore for write operations (event sourcing)
 * and PostgreSQL for read operations (CQRS read model).
 *
 * Event Sourcing Pattern:
 * - save(): Appends uncommitted domain events to EventStore stream
 * - findById(): Reconstructs aggregate by replaying events from stream
 * - Stream naming: chartofaccount-{tenantId}-{accountId}
 *
 * Multi-Tenancy:
 * - All operations scoped by tenant ID
 * - Event streams prefixed with tenant for isolation
 * - Cross-tenant access prevented at repository level
 */
export interface IChartOfAccountRepository {
  /**
   * Persists a chart of account aggregate to the event store
   * Extracts uncommitted domain events and appends them to the event stream
   * Tenant ID is extracted from the aggregate itself
   * @param account The account aggregate to save
   */
  save(account: ChartOfAccount): Promise<void>;

  /**
   * Retrieves a chart of account aggregate by ID from the event store
   * Reconstructs the aggregate by replaying all events from the stream
   * @param id The account aggregate ID
   * @param tenantId The tenant ID for multi-tenant isolation (optional, will use TenantContextService if not provided)
   * @returns The account aggregate or null if not found
   */
  findById(id: string, tenantId?: string): Promise<ChartOfAccount | null>;

  /**
   * Checks if an account with the given code exists for the tenant
   * Used for validation during account creation
   * @param accountCode The account code to check (e.g., "1010", "1010-01")
   * @param tenantId The tenant ID for multi-tenant isolation
   * @returns True if the account code exists, false otherwise
   */
  existsByCode(accountCode: string, tenantId: string): Promise<boolean>;

  /**
   * Checks if an account has active child accounts
   * Used for validation during account deactivation
   * @param accountId The parent account ID
   * @returns True if the account has active children, false otherwise
   */
  hasActiveChildren(accountId: string): Promise<boolean>;

  /**
   * Checks if an account exists by ID
   * @param id The account aggregate ID
   * @returns True if the account exists, false otherwise
   */
  exists(id: string): Promise<boolean>;
}
