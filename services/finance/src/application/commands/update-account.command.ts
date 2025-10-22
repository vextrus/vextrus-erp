/**
 * Update Account Command
 *
 * Updates an existing chart of account (ACTIVE accounts only).
 * Follows CQRS pattern - command is executed by UpdateAccountHandler.
 *
 * Business Rules:
 * - Only ACTIVE accounts can be updated
 * - INACTIVE accounts cannot be modified
 * - accountCode, accountType, and currency are IMMUTABLE (accounting integrity)
 * - Only accountName and parentAccountId can be updated
 * - Event sourcing: Updates are recorded as events, not destructive changes
 * - All fields are optional (partial updates supported)
 *
 * Bangladesh Compliance:
 * - Maintains account hierarchy integrity
 * - Preserves account code structure for reporting
 */
export class UpdateAccountCommand {
  constructor(
    public readonly accountId: string,
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly accountName?: string,
    public readonly parentAccountId?: string | null,
  ) {
    // Validate required fields
    if (!accountId) throw new Error('accountId is required');
    if (!userId) throw new Error('userId is required');
    if (!tenantId) throw new Error('tenantId is required');

    // Validate account name if provided
    if (accountName !== undefined) {
      if (accountName.length < 3) {
        throw new Error('Account name must be at least 3 characters');
      }
      if (accountName.length > 255) {
        throw new Error('Account name must not exceed 255 characters');
      }
    }
  }
}
