/**
 * Post Journal Command
 *
 * Command to post a journal entry, making it immutable and affecting account balances.
 * Once posted, journal cannot be modified (only reversed).
 *
 * Business Rules:
 * - Journal must be in DRAFT status
 * - Journal must be balanced (debits = credits)
 * - Journal must have at least 2 lines
 * - Journal date must be in open accounting period
 * - All accounts must be valid and active
 *
 * Effects:
 * - Journal status changes to POSTED
 * - Account balances updated
 * - Fiscal period updated
 * - Posted timestamp and user recorded
 * - Journal becomes immutable (cannot edit, can only reverse)
 *
 * Bangladesh Compliance:
 * - Validates fiscal period is open (July-June fiscal year)
 * - Records posting for audit trail
 * - Prevents posting to closed periods
 */
export class PostJournalCommand {
  constructor(
    public readonly journalId: string,
    public readonly postedBy: string,
    public readonly tenantId: string,
  ) {
    // Validate required fields
    if (!journalId) throw new Error('journalId is required');
    if (!postedBy) throw new Error('postedBy is required');
    if (!tenantId) throw new Error('tenantId is required');
  }
}
