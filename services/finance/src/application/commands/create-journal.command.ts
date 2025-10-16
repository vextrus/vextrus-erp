import { JournalType } from '../../domain/aggregates/journal/journal-entry.aggregate';

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
 * Create Journal Command
 *
 * Command to create a new journal entry with double-entry bookkeeping validation.
 * Supports all journal types including general, sales, purchase, and closing entries.
 *
 * Business Rules:
 * - Must have at least 2 lines (double-entry bookkeeping)
 * - Each line must have either debit OR credit (not both)
 * - Total debits must equal total credits (balanced entry)
 * - Journal date must be in open accounting period
 * - Fiscal period calculated from journal date (Bangladesh July-June fiscal year)
 *
 * Bangladesh Compliance:
 * - Fiscal year: July 1 to June 30
 * - Fiscal period format: FY2024-2025-P01 (P01 = July, P12 = June)
 * - Journal number format: {TYPE}-YYYY-MM-NNNNNN (e.g., GJ-2024-01-000001)
 * - Support for 9 journal types (GENERAL, SALES, PURCHASE, etc.)
 */
export class CreateJournalCommand {
  constructor(
    public readonly journalDate: Date,
    public readonly description: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly lines: JournalLineInput[],
    public readonly journalType?: JournalType,
    public readonly reference?: string,
    public readonly autoPost?: boolean,
  ) {
    // Validate required fields
    if (!journalDate) throw new Error('journalDate is required');
    if (!description) throw new Error('description is required');
    if (!tenantId) throw new Error('tenantId is required');
    if (!userId) throw new Error('userId is required');

    // Validate lines
    if (!lines || lines.length < 2) {
      throw new Error('Journal entry must have at least 2 lines (double-entry bookkeeping)');
    }

    // Validate each line has either debit OR credit (not both)
    lines.forEach((line, index) => {
      const hasDebit = line.debitAmount !== undefined && line.debitAmount !== null && line.debitAmount > 0;
      const hasCredit = line.creditAmount !== undefined && line.creditAmount !== null && line.creditAmount > 0;

      if (!hasDebit && !hasCredit) {
        throw new Error(`Line ${index + 1} must have either debit or credit amount`);
      }

      if (hasDebit && hasCredit) {
        throw new Error(`Line ${index + 1} cannot have both debit and credit amounts`);
      }

      if (!line.accountId) {
        throw new Error(`Line ${index + 1} must have accountId`);
      }

      // Validate amounts are positive
      if (hasDebit && line.debitAmount! <= 0) {
        throw new Error(`Line ${index + 1} debit amount must be positive`);
      }

      if (hasCredit && line.creditAmount! <= 0) {
        throw new Error(`Line ${index + 1} credit amount must be positive`);
      }
    });

    // Validate balance (debits = credits)
    const totalDebit = lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);

    // Allow small rounding differences (0.01 BDT)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(
        `Journal entry is not balanced. Total Debits: ${totalDebit.toFixed(2)} BDT, ` +
        `Total Credits: ${totalCredit.toFixed(2)} BDT, ` +
        `Difference: ${Math.abs(totalDebit - totalCredit).toFixed(2)} BDT`
      );
    }
  }
}
