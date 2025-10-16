import { AccountType, Currency } from '../../domain/aggregates/chart-of-account/chart-of-account.aggregate';

/**
 * Create Account Command
 *
 * Command to create a new chart of account in the system.
 * Contains all necessary data for account creation including
 * account code, type, currency, and optional parent account for hierarchy.
 *
 * Bangladesh Compliance:
 * - accountCode follows Bangladesh standard format (4-digit hierarchical)
 * - Currency defaults to BDT (Bangladesh Taka)
 * - Supports hierarchical chart of accounts structure
 */
export class CreateAccountCommand {
  constructor(
    public readonly accountCode: string,
    public readonly accountName: string,
    public readonly accountType: AccountType,
    public readonly currency: Currency,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly parentAccountId?: string,
  ) {
    // Validate required fields
    if (!accountCode) throw new Error('accountCode is required');
    if (!accountName) throw new Error('accountName is required');
    if (!accountType) throw new Error('accountType is required');
    if (!currency) throw new Error('currency is required');
    if (!tenantId) throw new Error('tenantId is required');
    if (!userId) throw new Error('userId is required');

    // Validate account code format (Bangladesh standard: XXXX or XXXX-YY-ZZ)
    if (!/^\d{4}(-\d{2})*$/.test(accountCode)) {
      throw new Error('Account code must follow Bangladesh format: XXXX or XXXX-YY-ZZ');
    }

    // Validate account name length
    if (accountName.length < 3) {
      throw new Error('Account name must be at least 3 characters');
    }
    if (accountName.length > 255) {
      throw new Error('Account name must not exceed 255 characters');
    }
  }
}
