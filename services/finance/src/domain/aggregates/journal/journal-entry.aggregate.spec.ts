import { JournalEntry, CreateJournalCommand, JournalStatus, JournalType, JournalLineDto } from './journal-entry.aggregate';
import { AccountId, TenantId } from '../chart-of-account/chart-of-account.aggregate';
import { UserId } from '../invoice/invoice.aggregate';
import { Money } from '../../value-objects/money.value-object';

describe('JournalEntry Aggregate', () => {
  let createCommand: CreateJournalCommand;

  beforeEach(() => {
    createCommand = {
      journalDate: new Date('2024-01-15'),
      journalType: JournalType.GENERAL,
      description: 'Monthly depreciation entry',
      reference: 'DEP-2024-01',
      tenantId: new TenantId('tenant-1'),
      lines: [],
      autoPost: false,
    };
  });

  describe('Journal Entry Creation', () => {
    it('should create a journal entry with correct initial state', () => {
      const journal = JournalEntry.create(createCommand);

      expect(journal).toBeDefined();
      expect(journal.getStatus()).toBe(JournalStatus.DRAFT);
      expect(journal.getJournalNumber()).toMatch(/^GJ-\d{4}-\d{2}-\d{6}$/);
      expect(journal.getFiscalPeriod()).toBe('FY2023-2024-P07'); // January is P07 in Bangladesh fiscal year
    });

    it('should calculate fiscal period correctly for Bangladesh', () => {
      // Test July (P01 - start of fiscal year)
      const julyCommand = { ...createCommand, journalDate: new Date('2024-07-15') };
      const julyJournal = JournalEntry.create(julyCommand);
      expect(julyJournal.getFiscalPeriod()).toBe('FY2024-2025-P01');

      // Test June (P12 - end of fiscal year)
      const juneCommand = { ...createCommand, journalDate: new Date('2024-06-15') };
      const juneJournal = JournalEntry.create(juneCommand);
      expect(juneJournal.getFiscalPeriod()).toBe('FY2023-2024-P12');

      // Test December (P06)
      const decCommand = { ...createCommand, journalDate: new Date('2024-12-15') };
      const decJournal = JournalEntry.create(decCommand);
      expect(decJournal.getFiscalPeriod()).toBe('FY2024-2025-P06');
    });

    it('should generate correct journal number prefix by type', () => {
      // General Journal
      const generalJournal = JournalEntry.create(createCommand);
      expect(generalJournal.getJournalNumber()).toMatch(/^GJ-/);

      // Sales Journal
      const salesCommand = { ...createCommand, journalType: JournalType.SALES };
      const salesJournal = JournalEntry.create(salesCommand);
      expect(salesJournal.getJournalNumber()).toMatch(/^SJ-/);

      // Cash Receipt
      const cashCommand = { ...createCommand, journalType: JournalType.CASH_RECEIPT };
      const cashJournal = JournalEntry.create(cashCommand);
      expect(cashJournal.getJournalNumber()).toMatch(/^CR-/);
    });
  });

  describe('Double-Entry Validation', () => {
    it('should validate balanced journal entries', () => {
      const journal = JournalEntry.create(createCommand);

      journal.addJournalLine({
        accountId: new AccountId('1000'),
        debitAmount: Money.fromAmount(5000, 'BDT'),
        creditAmount: Money.zero('BDT'),
        description: 'Debit entry',
      });

      journal.addJournalLine({
        accountId: new AccountId('2000'),
        debitAmount: Money.zero('BDT'),
        creditAmount: Money.fromAmount(5000, 'BDT'),
        description: 'Credit entry',
      });

      expect(() => journal.validateBalance()).not.toThrow();
      expect(journal.getTotalDebit().getAmount()).toBe(5000);
      expect(journal.getTotalCredit().getAmount()).toBe(5000);
    });

    it('should reject unbalanced journal entries', () => {
      const journal = JournalEntry.create(createCommand);

      journal.addJournalLine({
        accountId: new AccountId('1000'),
        debitAmount: Money.fromAmount(5000, 'BDT'),
        creditAmount: Money.zero('BDT'),
        description: 'Debit entry',
      });

      journal.addJournalLine({
        accountId: new AccountId('2000'),
        debitAmount: Money.zero('BDT'),
        creditAmount: Money.fromAmount(4000, 'BDT'),
        description: 'Credit entry',
      });

      expect(() => journal.validateBalance())
        .toThrow('Journal entry is not balanced. Debit: 5000, Credit: 4000');
    });

    it('should require at least two journal lines', () => {
      const journal = JournalEntry.create(createCommand);

      journal.addJournalLine({
        accountId: new AccountId('1000'),
        debitAmount: Money.fromAmount(5000, 'BDT'),
        creditAmount: Money.zero('BDT'),
        description: 'Single entry',
      });

      expect(() => journal.validateBalance())
        .toThrow('Journal entry must have at least two lines');
    });

    it('should handle complex multi-line entries', () => {
      const journal = JournalEntry.create(createCommand);

      // Debit multiple accounts
      journal.addJournalLine({
        accountId: new AccountId('1100'),
        debitAmount: Money.fromAmount(3000, 'BDT'),
        creditAmount: Money.zero('BDT'),
        description: 'Cash',
      });

      journal.addJournalLine({
        accountId: new AccountId('1200'),
        debitAmount: Money.fromAmount(2000, 'BDT'),
        creditAmount: Money.zero('BDT'),
        description: 'Bank',
      });

      // Credit single account
      journal.addJournalLine({
        accountId: new AccountId('4000'),
        debitAmount: Money.zero('BDT'),
        creditAmount: Money.fromAmount(5000, 'BDT'),
        description: 'Revenue',
      });

      expect(() => journal.validateBalance()).not.toThrow();
      expect(journal.getEntries()).toHaveLength(3);
      expect(journal.getTotalDebit().getAmount()).toBe(5000);
      expect(journal.getTotalCredit().getAmount()).toBe(5000);
    });
  });

  describe('Journal Line Validation', () => {
    it('should reject lines with both debit and credit amounts', () => {
      const journal = JournalEntry.create(createCommand);

      expect(() => {
        journal.addJournalLine({
          accountId: new AccountId('1000'),
          debitAmount: Money.fromAmount(5000, 'BDT'),
          creditAmount: Money.fromAmount(5000, 'BDT'),
          description: 'Invalid entry',
        });
      }).toThrow('Journal line cannot have both debit and credit amounts');
    });

    it('should reject lines with zero amounts', () => {
      const journal = JournalEntry.create(createCommand);

      expect(() => {
        journal.addJournalLine({
          accountId: new AccountId('1000'),
          debitAmount: Money.zero('BDT'),
          creditAmount: Money.zero('BDT'),
          description: 'Zero entry',
        });
      }).toThrow('Journal line must have either debit or credit amount');
    });

    it('should accept lines with only debit amount', () => {
      const journal = JournalEntry.create(createCommand);

      journal.addJournalLine({
        accountId: new AccountId('1000'),
        debitAmount: Money.fromAmount(5000, 'BDT'),
        description: 'Debit only',
      });

      const entries = journal.getEntries();
      expect(entries[0].debitAmount.getAmount()).toBe(5000);
      expect(entries[0].creditAmount.getAmount()).toBe(0);
    });

    it('should accept lines with only credit amount', () => {
      const journal = JournalEntry.create(createCommand);

      journal.addJournalLine({
        accountId: new AccountId('2000'),
        creditAmount: Money.fromAmount(5000, 'BDT'),
        description: 'Credit only',
      });

      const entries = journal.getEntries();
      expect(entries[0].creditAmount.getAmount()).toBe(5000);
      expect(entries[0].debitAmount.getAmount()).toBe(0);
    });
  });

  describe('Journal Posting', () => {
    it('should post a balanced journal entry', () => {
      const journal = JournalEntry.create(createCommand);

      // Add balanced entries
      journal.addJournalLine({
        accountId: new AccountId('1000'),
        debitAmount: Money.fromAmount(5000, 'BDT'),
        description: 'Debit',
      });

      journal.addJournalLine({
        accountId: new AccountId('2000'),
        creditAmount: Money.fromAmount(5000, 'BDT'),
        description: 'Credit',
      });

      journal.post(new UserId('user-1'));

      expect(journal.getStatus()).toBe(JournalStatus.POSTED);
      expect(journal.isPosted()).toBe(true);
    });

    it('should not allow posting unbalanced entries', () => {
      const journal = JournalEntry.create(createCommand);

      journal.addJournalLine({
        accountId: new AccountId('1000'),
        debitAmount: Money.fromAmount(5000, 'BDT'),
        description: 'Debit',
      });

      journal.addJournalLine({
        accountId: new AccountId('2000'),
        creditAmount: Money.fromAmount(4000, 'BDT'),
        description: 'Credit',
      });

      expect(() => journal.post(new UserId('user-1')))
        .toThrow('Journal entry is not balanced. Debit: 5000, Credit: 4000');
    });

    it('should not allow posting already posted journals', () => {
      const journal = JournalEntry.create(createCommand);

      journal.addJournalLine({
        accountId: new AccountId('1000'),
        debitAmount: Money.fromAmount(5000, 'BDT'),
      });

      journal.addJournalLine({
        accountId: new AccountId('2000'),
        creditAmount: Money.fromAmount(5000, 'BDT'),
      });

      journal.post(new UserId('user-1'));

      expect(() => journal.post(new UserId('user-2')))
        .toThrow('Invalid journal status. Current: POSTED, Expected: DRAFT');
    });
  });

  describe('Reversing Entries', () => {
    it('should create a reversing entry with swapped debits and credits', () => {
      const journal = JournalEntry.create(createCommand);

      // Original entry
      journal.addJournalLine({
        accountId: new AccountId('1000'),
        debitAmount: Money.fromAmount(5000, 'BDT'),
        description: 'Original debit',
      });

      journal.addJournalLine({
        accountId: new AccountId('2000'),
        creditAmount: Money.fromAmount(5000, 'BDT'),
        description: 'Original credit',
      });

      journal.post(new UserId('user-1'));

      // Create reversing entry
      const reversingDate = new Date('2024-02-01');
      const reversingJournal = journal.createReversingEntry(reversingDate);

      const reversingEntries = reversingJournal.getEntries();
      expect(reversingEntries).toHaveLength(2);

      // Check that debits and credits are swapped
      expect(reversingEntries[0].creditAmount.getAmount()).toBe(5000); // Was debit
      expect(reversingEntries[0].debitAmount.getAmount()).toBe(0);

      expect(reversingEntries[1].debitAmount.getAmount()).toBe(5000); // Was credit
      expect(reversingEntries[1].creditAmount.getAmount()).toBe(0);
    });

    it('should not allow reversing unposted journals', () => {
      const journal = JournalEntry.create(createCommand);

      journal.addJournalLine({
        accountId: new AccountId('1000'),
        debitAmount: Money.fromAmount(5000, 'BDT'),
      });

      journal.addJournalLine({
        accountId: new AccountId('2000'),
        creditAmount: Money.fromAmount(5000, 'BDT'),
      });

      // Don't post the journal

      expect(() => journal.createReversingEntry(new Date()))
        .toThrow(/Cannot reverse unposted journal/);
    });

    it('should reject reversing date in closed period', () => {
      const journal = JournalEntry.create(createCommand);

      journal.addJournalLine({
        accountId: new AccountId('1000'),
        debitAmount: Money.fromAmount(5000, 'BDT'),
      });

      journal.addJournalLine({
        accountId: new AccountId('2000'),
        creditAmount: Money.fromAmount(5000, 'BDT'),
      });

      journal.post(new UserId('user-1'));

      // Try to create reversing entry far in the past
      const closedPeriodDate = new Date('2023-01-01');

      expect(() => journal.createReversingEntry(closedPeriodDate))
        .toThrow(/Date .* is in a closed accounting period/);
    });
  });

  describe('Cost Center and Project Tracking', () => {
    it('should track cost centers in journal lines', () => {
      const journal = JournalEntry.create(createCommand);

      journal.addJournalLine({
        accountId: new AccountId('5000'),
        debitAmount: Money.fromAmount(5000, 'BDT'),
        description: 'Office expense',
        costCenter: 'CC-ADMIN',
        project: 'PROJ-001',
      });

      journal.addJournalLine({
        accountId: new AccountId('1000'),
        creditAmount: Money.fromAmount(5000, 'BDT'),
        description: 'Cash payment',
      });

      const entries = journal.getEntries();
      expect(entries[0].costCenter).toBe('CC-ADMIN');
      expect(entries[0].project).toBe('PROJ-001');
    });

    it('should track tax codes in journal lines', () => {
      const journal = JournalEntry.create(createCommand);

      journal.addJournalLine({
        accountId: new AccountId('1200'),
        debitAmount: Money.fromAmount(11500, 'BDT'),
        description: 'Purchase with VAT',
      });

      journal.addJournalLine({
        accountId: new AccountId('2100'),
        creditAmount: Money.fromAmount(10000, 'BDT'),
        description: 'Vendor payable',
      });

      journal.addJournalLine({
        accountId: new AccountId('2110'),
        creditAmount: Money.fromAmount(1500, 'BDT'),
        description: 'VAT payable',
        taxCode: 'VAT-15',
      });

      const entries = journal.getEntries();
      expect(entries[2].taxCode).toBe('VAT-15');
    });
  });

  describe('Auto-Post Feature', () => {
    it('should auto-post journal if requested and balanced', () => {
      const commandWithAutoPost: CreateJournalCommand = {
        ...createCommand,
        lines: [
          {
            accountId: new AccountId('1000'),
            debitAmount: Money.fromAmount(5000, 'BDT'),
          },
          {
            accountId: new AccountId('2000'),
            creditAmount: Money.fromAmount(5000, 'BDT'),
          },
        ],
        autoPost: true,
      };

      const journal = JournalEntry.create(commandWithAutoPost);

      expect(journal.getStatus()).toBe(JournalStatus.POSTED);
      expect(journal.isPosted()).toBe(true);
    });

    it('should not auto-post unbalanced journal', () => {
      const commandWithAutoPost: CreateJournalCommand = {
        ...createCommand,
        lines: [
          {
            accountId: new AccountId('1000'),
            debitAmount: Money.fromAmount(5000, 'BDT'),
          },
          {
            accountId: new AccountId('2000'),
            creditAmount: Money.fromAmount(4000, 'BDT'),
          },
        ],
        autoPost: true,
      };

      const journal = JournalEntry.create(commandWithAutoPost);

      // Should remain in DRAFT status due to imbalance
      expect(journal.getStatus()).toBe(JournalStatus.DRAFT);
      expect(journal.isPosted()).toBe(false);
    });
  });

  describe('Accounting Period Validation', () => {
    it('should reject journal dates too far in the past', () => {
      const oldCommand = {
        ...createCommand,
        journalDate: new Date('2023-01-01'),
      };

      expect(() => JournalEntry.create(oldCommand))
        .toThrow(/Date .* is in a closed accounting period/);
    });

    it('should reject journal dates too far in the future', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 3);

      const futureCommand = {
        ...createCommand,
        journalDate: futureDate,
      };

      expect(() => JournalEntry.create(futureCommand))
        .toThrow(/Date .* is in a closed accounting period/);
    });

    it('should accept current month journal dates', () => {
      const currentCommand = {
        ...createCommand,
        journalDate: new Date(),
      };

      expect(() => JournalEntry.create(currentCommand)).not.toThrow();
    });
  });
});