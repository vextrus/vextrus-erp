/**
 * Reverse Journal Command
 *
 * Command to create a reversing journal entry for a posted journal.
 * Creates a new journal with debits and credits swapped.
 *
 * Business Rules:
 * - Original journal must be POSTED
 * - Reversing date must be in open accounting period
 * - Creates new journal with swapped debits/credits
 * - Original journal status changes to REVERSED
 * - Reversing journal is automatically posted
 *
 * Use Cases:
 * - Correcting errors in posted journals
 * - Reversing accruals
 * - Period-end adjustments
 * - Closing entry corrections
 *
 * Effects:
 * - Creates new journal with reversed entries
 * - Original journal marked as REVERSED
 * - New journal marked as REVERSING
 * - Both journals linked (originalJournalId/reversingJournalId)
 * - Account balances updated by net effect
 *
 * Bangladesh Compliance:
 * - Validates reversing date in open fiscal period
 * - Maintains complete audit trail
 * - Journal number format: RJ-YYYY-MM-NNNNNN
 * - Reference includes original journal number
 */
export class ReverseJournalCommand {
  constructor(
    public readonly journalId: string,
    public readonly reversingDate: Date,
    public readonly userId: string,
    public readonly tenantId: string,
  ) {
    // Validate required fields
    if (!journalId) throw new Error('journalId is required');
    if (!reversingDate) throw new Error('reversingDate is required');
    if (!userId) throw new Error('userId is required');
    if (!tenantId) throw new Error('tenantId is required');

    // Validate reversing date is not in the future
    const now = new Date();
    if (reversingDate > now) {
      throw new Error('Reversing date cannot be in the future');
    }
  }
}
