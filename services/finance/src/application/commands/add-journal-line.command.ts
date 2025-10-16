/**
 * Add Journal Line Command
 *
 * Command to add a new line to an existing DRAFT journal entry.
 * Used for building journal entries incrementally.
 *
 * Business Rules:
 * - Journal must be in DRAFT status
 * - Line must have either debit OR credit (not both)
 * - Amounts must be positive
 * - Account ID must be valid
 *
 * Note: Adding a line doesn't automatically post the journal.
 * The journal must be explicitly posted after all lines are added.
 */
export class AddJournalLineCommand {
  constructor(
    public readonly journalId: string,
    public readonly accountId: string,
    public readonly tenantId: string,
    public readonly debitAmount?: number,
    public readonly creditAmount?: number,
    public readonly description?: string,
    public readonly costCenter?: string,
    public readonly project?: string,
    public readonly reference?: string,
    public readonly taxCode?: string,
  ) {
    // Validate required fields
    if (!journalId) throw new Error('journalId is required');
    if (!accountId) throw new Error('accountId is required');
    if (!tenantId) throw new Error('tenantId is required');

    // Validate that line has either debit OR credit (not both)
    const hasDebit = debitAmount !== undefined && debitAmount !== null && debitAmount > 0;
    const hasCredit = creditAmount !== undefined && creditAmount !== null && creditAmount > 0;

    if (!hasDebit && !hasCredit) {
      throw new Error('Journal line must have either debit or credit amount');
    }

    if (hasDebit && hasCredit) {
      throw new Error('Journal line cannot have both debit and credit amounts');
    }

    // Validate amounts are positive
    if (hasDebit && debitAmount! <= 0) {
      throw new Error('Debit amount must be positive');
    }

    if (hasCredit && creditAmount! <= 0) {
      throw new Error('Credit amount must be positive');
    }
  }
}
