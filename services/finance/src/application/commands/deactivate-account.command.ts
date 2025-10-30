/**
 * Deactivate Account Command
 *
 * Command to deactivate an existing chart of account.
 * Deactivation requires a reason and is only allowed for accounts
 * with zero balance and no active child accounts.
 *
 * Business Rules:
 * - Account must have zero balance
 * - Account must not have active child accounts
 * - Reason must be provided for audit trail
 */
export class DeactivateAccountCommand {
  constructor(
    public readonly accountId: string,
    public readonly reason: string,
    public readonly userId: string,
  ) {
    // Validate required fields
    if (!accountId) throw new Error('accountId is required');
    if (!reason) throw new Error('reason is required');
    if (!userId) throw new Error('userId is required');

    // Validate reason length
    if (reason.length < 10) {
      throw new Error('Deactivation reason must be at least 10 characters');
    }
    if (reason.length > 500) {
      throw new Error('Deactivation reason must not exceed 500 characters');
    }
  }
}
