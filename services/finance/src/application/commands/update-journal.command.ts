/**
 * JournalLineInput Interface
 *
 * Represents a single line item in a journal entry.
 * Must have either debit OR credit (not both) following double-entry bookkeeping.
 */
export interface JournalLineInput {
  accountId: string;
  debitAmount?: number;
  creditAmount?: number;
  description?: string;
  costCenter?: string;
  project?: string;
  reference?: string;
  taxCode?: string;
}

/**
 * Update Journal Entry Command
 *
 * Updates an existing journal entry (DRAFT status only).
 * Follows CQRS pattern - command is executed by UpdateJournalHandler.
 *
 * Business Rules:
 * - Only DRAFT journals can be updated
 * - Cannot update POSTED, REVERSED, or CANCELLED journals
 * - Event sourcing: Updates are recorded as events, not destructive changes
 * - All fields are optional (partial updates supported)
 * - Journal must remain balanced (debits = credits)
 *
 * Bangladesh Compliance:
 * - Fiscal period validation (July-June fiscal year)
 * - Double-entry bookkeeping rules enforced
 */
export class UpdateJournalCommand {
  constructor(
    public readonly journalId: string,
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly description?: string,
    public readonly reference?: string,
    public readonly journalDate?: Date,
    public readonly lines?: JournalLineInput[],
  ) {}
}
